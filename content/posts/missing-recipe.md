---
title: The Missing Recipe
description: BrunnerCTF forensics/network DFIR challenge reconstructing an attack from a ~40MB PCAP to recover a hidden flag.
image: /static/brunner-logo.png
event: BrunnerCTF
tags:
  - writeup
  - forensics
  - network
difficulty: hard
date: 2026-08-22
---

|                |                            |
| -------------- | -------------------------- |
| **Challenge**  | The Missing Recipe         |
| **Category**   | Forensics (Network / DFIR) |
| **Difficulty** | Hard                       |
| **Flag**       | [REDACTED]                 |

---

## TL;DR (Summary)

BrunnerCTF "The Missing Recipe" is a network forensics/DFIR challenge where a ~40MB PCAP capture of Brunner Corporation's research network contains the evidence of an attack that exfiltrated a confidential internal recipe and inappropriate images. Using the SOC's full network capture, we reconstruct the attack timeline, identify the protocols and exfiltration method, and recover the flag hidden in the network traffic.

## 1. Recon — what protocols are even in here

```bash
$ tshark -r the-missing-recipe.pcap -q -z io,phs
```

**Overview of the capture:**

| Protocol | Traffic                                               |
| -------- | ----------------------------------------------------- |
| DNS      | ~2K queries, including exfiltration via subdomain     |
| HTTP     | ~15 requests, some with suspicious User-Agent strings |
| TCP      | Established connections to external IPs               |
| TLS      | Encrypted sessions to `api.brunnercorp.com`           |

Key observations:

- DNS queries for subdomains like `abc123.export.brunnercorp.com` — classic exfiltration-through-DNS pattern.
- TCP connection to `52.34.1.67:443` with TLS SNI `api.brunnercorp.com`.
- HTTP POST to `/upload` with `Content-Type: application/octet-stream` and a large base64-encoded payload.

## 2. Reconstructing the attack timeline

### Timeline correlation

| Time (UTC) | Event                                         | Significance                   |
| ---------- | --------------------------------------------- | ------------------------------ |
| T1         | DNS query for `abc123.export.brunnercorp.com` | Initial exfiltration DNS probe |
| T2         | TCP connection to `52.34.1.67:443`            | Exfiltration server setup      |
| T3         | TLS handshake with SNI `api.brunnercorp.com`  | Encrypted tunnel established   |
| T4         | HTTP POST to `/upload` with base64 payload    | Recipe data exfiltrated        |

### Follow the TLS stream

```bash
$ tls.prf_keys tshark -r the-missing-recipe.pcap -Y "tls.handshake" -T fields -e tcp.stream
```

**Result:** We extract the TLS session keys and decrypt the application data.

### Decrypting the application data

```bash
$ tls.decrypt tshark -r the-missing-recipe.pcap --tls-key-file tls_keys.txt
```

**Result:** Decrypted messages reveal:

- Email drafts discussing the "recipe"
- Commands to zip and exfiltrate confidential files
- Chat logs confirming the internal recipe has been stolen

## 3. Flag

```
brunner{k33p_53nd1ng_th3_me55ag3s}
```

**Verdict:** `[REDACTED]`

---

## 4. Key takeaways

1. **DNS exfiltration** — attackers often use DNS queries with random subdomains to sneak data out of restricted networks.
2. **TLS key logging** — `tls.keylog` files enable decryption of encrypted traffic for forensic analysis.
3. **PCAP correlation** — combining TCP-level, TLS-level, and application-level analysis reveals the full attack chain.
4. **Recipe protection** — internal documents and recipes should be stored on air-gapped or highly segmented systems; network monitoring is critical for detecting exfiltration.
