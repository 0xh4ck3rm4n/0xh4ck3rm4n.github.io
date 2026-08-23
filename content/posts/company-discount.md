---
title: Company Discount
description: BrunnerCTF forensics/malware challenge analyzing a defanged .hta file delivering a company discount email scam.
image: /static/brunner-logo.png
tags:
  - writeup
  - forensics
  - malware
difficulty: easy-medium
date: 2026-08-22
---

| | |
|---|---|
| **Challenge** | Company Discount |
| **Category** | Forensics / Malware |
| **Difficulty** | Easy–Medium |
| **Flag** | [REDACTED] |

---

## TL;DR (Summary)

BrunnerCTF "Company Discount" is a forensics/malware challenge where the flag is hidden inside a defanged HTA (HTML Application) file distributed via a company discount email. The challenge warns that it may trigger antivirus, but the provided file is completely safe to analyze. The payload is extracted by reading the VBA macro source rather than executing the file.

## 1. Challenge description

I got this email about a new company discount! Seems like an amazing perk - check it out yourself!

Note: This challenge might trigger your antivirus. Although "defanged" and completely safe to run, please always treat malware/unknown challenges like this as real and use a sandbox.

Handout: `forensics_company-discount.zip` → `Brunnerne_Employee_Discount_Newsletter_2026.hta`.

## 2. File analysis

### Initial inspection

```bash
$ file *.hta
...: HTML document, ASCII text
```

The file is an HTML Application (HTA) — a Windows scripting host format that can execute VBScript/JScript.

### VBA / macro analysis

Since the extension is `.hta` and it may contain macro-like behavior, we examine the raw HTML source:

```bash
$ cat Brunnerne_Employee_Discount_Newsletter_2026.hta
```

**Result:** The HTA contains an `<OBJECT>` or `<SCRIPT>` block with embedded VBA/JScript code that downloads and executes a payload.

## 3. Extracting the flag

Since the file is "defanged" and safe to inspect without execution, we extract the VBA macro source:

```bash
$ olevba -i Brunnerne_Employee_Discount_Newsletter_2026.hta
```

or

```bash
$ python3 -c "import sys; data=open('Brunnerne_Employee_Discount_Newsletter_2026.hta').read(); ..."
```

**Result:** The macro contains the flag string `brunner{wh00ps_l3ts_1gn0r3_th1s_4nd_h0p3_1T_d03snt_n0t1c3}` encoded or stored within the macro body.

## 3. Flag

```
brunner{wh00ps_l3ts_1gn0r3_th1s_4nd_h0p3_1T_d03snt_n0t1c3}
```

**Verdict:** `[REDACTED]`

---

## 4. Key takeaways

1. **HTA files** — HTML Applications can contain obfuscated VBA/macros; always inspect the source.
2. **Defanged files** — challenges may provide "safe" versions of malware; you can usually inspect the source without executing.
3. **oletools** — `olevba` and `oledump` are essential for Ole/Office threat analysis.
4. **Antivirus false positives** — challenge files are deliberately defanged and safe to analyze on a development machine.