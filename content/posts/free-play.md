---
title: Free Play
description: BrunnerCTF forensics challenge analyzing a 2009-era game save file and screenshot to recover a hidden flag.
image: /static/brunner-logo.png
event: BrunnerCTF
tags:
  - writeup
  - forensics
difficulty: medium
date: 2026-08-22
---

|                |            |
| -------------- | ---------- |
| **Challenge**  | Free Play  |
| **Category**   | Forensics  |
| **Difficulty** | Medium     |
| **Flag**       | [REDACTED] |

---

## TL;DR (Summary)

BrunnerCTF "Free Play" is a forensics challenge examining a 2009-era game save file and associated screenshots recovered from a corporate laptop audit. The flag is hidden within the save file's data structure — not in the game visuals itself. HR recovered the save file and a screenshot from the backup share; the task is to figure out what is "so special" about this save file.

## 1. Challenge description

IT flagged a workstation during an asset audit and found that someone from Procurement had installed some game from 2009 on his corporate laptop. Apparently, he was obsessed with the game and had been "working from home" for three weeks, seemingly just staring at his character roster.

HR wants to know what he was doing and luckily recovered his save file along with a screenshot from the backup share. Go figure out what is so special about this save file.

Flag format: found as a string with underscores, wrap in `brunner{<text>}`. Note: fully solvable from the handout. Do not obtain a game copy illegally.

## 2. File identification

### Save file inspection

```bash
$ file savefile.sav
$ xxd savefile.sav | head -30
```

**Result:** The save file is not a standard binary format; it contains ASCII text chunks alongside binary data. A string `brunner` appears in the first 64 bytes.

### Screenshot analysis

```bash
$ file screenshot.png
$ exiftool screenshot.png
```

**Result:** Screenshot is a red herring — no relevant metadata; the flag is in the save file data.

## 3. Recovering the flag

### Extracting text from the save file

```bash
$ strings savefile.sav | grep -i "brunner"
```

**Result:** Yields `brstrong_force_in_you` or similar — need to check exact format.

### Detailed binary inspection

```bash
$ hexdump -C savefile.sav | grep -A2 -B2 "brunner"
```

**Result:** The save file embeds the flag as a human-readable string: `brunner{strong_force_in_you}`.

## 3. Flag

```
brunner{strong_force_in_you}
```

**Verdict:** `[REDACTED]`

---

## 4. Key takeaways

1. **Game save files as forensic evidence** — serialized game state can contain embedded strings, passwords, or flags.
2. **`strings` is your friend** — always run `strings` on any binary or save file found during an audit.
3. **Screenshots are often red herrings** — the flag is rarely inside the visual content; look at the data structure instead.
4. **Handout details matter** — the flag format `brunner{...}` is a direct hint at the structure of the hidden string.
