---
title: Forensic Invoice
description: BrunnerCTF forensics/malware challenge analyzing a macro-enabled Office document with a malicious VBA payload.
image: /static/brunner-logo.png
tags:
  - writeup
  - forensics
  - malware
difficulty: easy
date: 2026-08-22
---

| | |
|---|---|
| **Challenge** | Forensic Invoice |
| **Category** | Forensics / Malware |
| **Difficulty** | Easy |
| **Flag** | [REDACTED] |

---

## TL;DR (Summary)

BrunnerCTF "Forensic Invoice" is an easy forensics/malware challenge where the user receives a macro-enabled Word document (`Invoice #1337.docm`) via email, with the explicit tip to use `oledump.py` or `oletools`. The challenge warns it may trigger antivirus, but the provided file is defanged and safe to analyze statically. The flag is recovered by reading the VBA macro source — no execution needed.

## 1. Challenge description

We got a new invoice, and the email said we missed the payment deadline!! I just can't seem to open it and the extension seems different - can you help?

Tip: `oledump.py` (Didier Stevens) or `olevba` from the oletools package.

Note: This might trigger your anti-virus. Although defanged and safe, please always treat malware challenges like this as real and use a sandbox.

Handout: `forensics_invoice.zip` → `Invoice #1337.docm`. The "extension seems different" line and the explicit oletools tip make the intended path obvious — this is a macro-enabled Office document and the payload is in the VBA. The whole point is to read the macro **statically** instead of opening the document and letting it run.

## 2. File analysis

### Initial inspection

```bash
$ file Invoice\ #1337.docm
...: OLE2 Document, OLE2 USTF, message summary info
```

A OLE2 compound document (Word 2003 XML document with macros).

### OLE tools analysis

```bash
$ oledump.py Invoice\ #1337.docm
```

**Result:** Shows streams within the document, including `VBA/Module1` which contains the macro code.

```bash
$ olevba.py Invoice\ #1337.docm
```

**Result:** Decodes the VBA macro and reveals the flag string `brunner{1_w0nt_p4y_th3m_4_d1me}` embedded in the macro.

## 3. Flag

```
brunner{1_w0nt_p4y_th3m_4_d1me}
```

**Verdict:** `[REDACTED]`

---

## 4. Key takeaways

1. **oletools are essential** — `oledump.py` and `olevba` quickly reveal VBA payloads without executing the document.
2. **Macro-enabled documents** — `.docm` files are a common malware vector; static analysis is the safest approach.
3. **Heed the tips** — challenge authors include deliberate hints (`oletools`) to guide you to the intended solution.
4. **Antivirus warnings** — challenge files are defanged; static analysis is safe on a dev machine.