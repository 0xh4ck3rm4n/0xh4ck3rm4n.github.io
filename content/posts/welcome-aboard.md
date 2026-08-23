---
title: Welcome Aboard
description: BrunnerCTF web challenge involving request smuggling through an employee wiki with multiple infrastructure layers.
image: /static/brunner-logo.png
tags:
  - writeup
  - web
difficulty: medium
date: 2026-08-21
---

| | |
|---|---|
| **Challenge** | Welcome Aboard |
| **Category** | Web |
| **Difficulty** | Medium |
| **Flag** | [REDACTED] |

---

## TL;DR (Summary)

Welcome to the BrunnerCTF "Welcome Aboard" challenge! This web exploitation challenge requires exploiting a request smuggling vulnerability through an employee wiki with multiple infrastructure layers. The platform sits behind multiple layers of infrastructure, and IT is confident every chunk reaches the backend, exactly as expected.

## 1. Challenge description

Your employee account has access to the Brunnerne Inc. Wiki, where you'll find onboarding guides and technical documentation. The platform sits behind multiple layers of infrastructure, and IT is confident every chunk reaches the backend, exactly as expected. Explore the wiki and see if everything behaves as intended.

Two phrases in there did most of the work of pointing me at the answer:
*"multiple layers of infrastructure"* (there's a proxy in front of an app) and *"every **chunk** reaches the backend"* (someone wants me to think about `Transfer-Encoding: chunked`). That's a request-smuggling nudge if I've ever seen one, but I didn't want to marry the theory before looking at the app.

## 2. Triage

### File identification

```bash
# The challenge provides a text file with usernames and passwords, but only one is real.
# Review the wiki for onboarding guides and infrastructure diagrams.
```

**Result:** Only one credential pair works; the rest are decoys.

### Inspect the frontend

The challenge description mentions "multiple layers of infrastructure" and "every chunk reaches the backend", hinting at a proxy in front of an application.

**Result:** Identify the request smuggling vector.

---

## 3. Exploiting Request Smuggling

### The vulnerability

The `Transfer-Encoding: chunked` header combined with `Content-Length` creates a ambiguity in how the proxy and server interpret the request boundaries. By sending a request with both headers, the proxy may forward only part of the request to the back-end server.

### The exploit

1. Login with the valid credential `user:userpass123!` to obtain a session token.
2. Craft a smuggled request that bypasses the authentication check.
3. Use the smuggled request to access the `/flag` endpoint directly.

**Result:** The flag is retrieved via the smuggling vector.

---

## 4. Flag

```
brunner{00ps_th4t_p4g3_w4s_1nt3rn4l}
```

**Verdict:** `[REDACTED]`

---

## 5. Key takeaways

1. **Request smuggling** — ambiguity between `Transfer-Encoding: chunked` and `Content-Length` can bypass proxies and access protected endpoints.
2. **Decoy credentials** — CTF challenge hint files always contain many decoy usernames:passwords; only one is real.
3. **Wiki enumeration** — onboarding documents and infrastructure diagrams often contain Smuggling nudges.
4. **Always validate** — verify every request path through both the proxy and the back-end server.