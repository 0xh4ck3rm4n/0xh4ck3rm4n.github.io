---
title: Whitebox
description: Hard reversing challenge inverting a Chow-style white-box AES (9 table rounds + final byte encoding) to recover the secret key-free.
image: /static/netanix.png
tags:
  - writeup
  - reversing
difficulty: hard
date: 2026-08-09
---

| | |
|---|---|
| **Challenge** | Whitebox |
| **Category** | Reversing / White-box Cryptography |
| **Difficulty** | Hard |
| **SHA256** | `583699eeb8b1a6d9c6992a160edf1bf40cdc3ad913d41d0b304f164d1b676ce6` |

---

## TL;DR (Summary)

`whitebox` is a small Linux binary that validates a 32-character input against a secret. The secret is protected by a **white-box AES** implementation:

1. The binary reads a 32-byte line, splits it into two 16-byte blocks, and runs each block through a table-driven cipher (`fcn.000012c0`).
2. The cipher is **white-box AES**: 9 table rounds + a final byte encoding. The AES key is **not present as a constant** — it is folded into 144 lookup tables (Chow-style internal encodings).
3. Because each round word is a clean XOR of 4 independent byte lookups (no XOR-splitting tables between rounds), the whole transform can be **inverted directly**:
   - undo the final per-position byte encoding (bijective),
   - then for each of the 9 rounds, solve each 32-bit word with a **meet-in-the-middle** over its 4 tables.
4. Every round/word inverts to **exactly one solution**, so the plaintext is recovered deterministically.
5. The recovered secret is `[REDACTED]` — verified against the binary (`ok.`).

---

## 1. Triage

### File identification

```bash
unzip -o ~/hack-the-box/white.zip
file whitebox
sha256sum whitebox
```

**Result:**

```
whitebox: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV),
          dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2,
          for GNU/Linux 3.2.0, stripped
583699eeb8b1a6d9c6992a160edf1bf40cdc3ad913d41d0b304f164d1b676ce6  whitebox
```

- ELF64 x86-64, **PIE**, **stripped**, dynamically linked.
- Imports: `puts, strlen, strcspn, memcmp, fgets, fflush, fwrite` — nothing crypto-looking.

### Sections

```bash
readelf -S whitebox
```

| Section | Address | Size |
|---------|---------|------|
| `.text` | `0x10c0` | 824 B |
| `.rodata` | `0x2000` | 0x251b4 B |
| `.data` | `0x29038` | — |

### Strings

```bash
strings whitebox
```

Only the expected strings: `> `, `size mismatch.`, `ok.`, `no.` — **no key, no flag, no hint strings**. The secret is not stored as data.

---

## 2. Reversing `main` (0x10c0)

Disassembling with radare2:

```bash
r2 -q -e bin.cache=true -c "aaa; pdf @ main" whitebox
```

The logic is straightforward:

```c
fwrite("> ", 1, 2, stdout);
fflush(stdout);
fgets(buf, 0x80, stdin);
buf[strcspn(buf, "\r\n")] = 0;          // strip newline
if (strlen(buf) != 0x20) {              // must be exactly 32 chars
    puts("size mismatch.");
    return 1;
}
transform(buf, out);                    // block 0  (rdi=buf, rsi=out)
transform(buf + 0x10, out + 0x10);      // block 1
if (memcmp(out, 0x2040, 0x20) == 0)
    puts("ok.");
else
    puts("no.");
```

The expected ciphertext is at `0x2040`:

```
04a419fedc9c8bd8d46b147d6382cec1   <- block 0 target
5e5daa550aabd0c87d08604acd05344c   <- block 1 target
```

So the task reduces to: **invert the transform independently for two 16-byte blocks**.

---

## 3. Reversing the transform (`fcn.000012c0` @ 0x12c0)

This is the heart of the challenge. Key facts from the disassembly:

- `r9  = 0x3060` — base of a large table region (0x24000 bytes).
- `r11 = 0x27060` — a 16-byte permutation table.
- `0x2060` — a byte table used by the final loop.

### The permutation table

```bash
xxd -s 0x27060 -l 16 whitebox
```

```
00 05 0a 0f 04 09 0e 03 08 0d 02 07 0c 01 06 0b
```

```
P = [0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11]
```

### Round count

The outer loop is:

```asm
xor ebx, ebx
...
lea r10, [rbx*4]
...
add rbx, 4
cmp rbx, 0x24
jne ...
```

`rbx` takes values `0, 4, 8, ..., 0x20` — that is **9 iterations**, not 36 rounds. Each iteration is one table-driven round.

### Inner structure (per round)

For each round `r` and each output word `j` (0..3), the code does 4 byte lookups:

```
rax = r10 << 8            ; r10 = 4*(r*4 + j)  ->  subtable index base
for i in 0..3:
    sel   = P[4*j + i]                    ; byte selector
    b     = state[sel]                    ; state byte
    w    ^= RT[ (16*r + 4*j + i)*256 + b ] ; 32-bit table entry
    rax  += 0x100
```

The subtable index is `16r + 4j + i` (0..143), so the round table is **144 subtables × 256 entries × 4 bytes = 0x24000 bytes**, exactly filling `0x3060..0x27060`.

### The final loop

```asm
; 0x13c0
edx = P[rax]                 ; selector
edx = state[edx]
edx += rax << 8              ; position * 256
out[rax] = O[edx]            ; O @ 0x2060
```

So the final encoding is:

```
out[pos] = O[pos*256 + state[P[pos]]]
```

### Reconstructed pseudocode

```python
def transform(inp):                     # 16 bytes
    state = list(inp)
    for r in range(9):                  # 9 rounds
        new = [0]*16
        for j in range(4):              # 4 output words
            w = 0
            for i in range(4):          # 4 byte lookups
                sel = P[4*j + i]
                w ^= RT[16*r + 4*j + i][ state[sel] ]
            new[4*j:4*j+4] = w (little-endian)
        state = new
    return bytes(O[pos*256 + state[P[pos]]] for pos in range(16))
```

---

## 3. Identifying the cipher

The structure is a textbook **white-box AES**:

- 16-byte blocks,
- 9 table rounds where each output word is the XOR of 4 byte-lookups (this is exactly how AES `MixColumns` is expressed with T-tables),
- a final byte-wise round (SubBytes + AddRoundKey, no MixColumns) with an output encoding,
- **no key constant anywhere** — the key is embedded in the tables.

The description confirms it: *"It ships on real phones, real ATMs, real DRM stacks"* — that is white-box cryptography (Chow et al.).

We verified the tables are **not** plain AES T-tables (the byte sets don't match `{S[x], 2·S[x], 3·S[x]}`) and the final table is not an affine version of the S-box — the implementation uses **internal encodings** (Chow-style). That doesn't matter for solving: the transform is a pure composition of lookups and XORs, so it can be inverted directly.

---

## 4. Reconstructing the forward transform (and validating it)

We wrote a Python implementation of the transform and validated it against the real binary using an **LD_PRELOAD hook on `memcmp`** that prints both buffers:

```c
// memcmp_hook.c
#define _GNU_SOURCE
#include <stdio.h>
#include <string.h>
#include <dlfcn.h>

int memcmp(const void *s1, const void *s2, size_t n) {
    static int (*real)(const void*, const void*, size_t) = NULL;
    if (!real) real = dlsym(RTLD_NEXT, "memcmp");
    if (n == 32) {
        fprintf(stderr, "HOOK: computed=");
        for (size_t i = 0; i < 32; i++) fprintf(stderr, "%02x", ((unsigned char*)s1)[i]);
        fprintf(stderr, " expected=");
        for (size_t i = 0; i < 32; i++) fprintf(stderr, "%02x", ((unsigned char*)s2)[i]);
        fprintf(stderr, "\n");
    }
    return real(s1, s2, n);
}
```

```bash
x86_64-linux-gnu-gcc -shared -fPIC -o memcmp_hook.so memcmp_hook.c -ldl
printf 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n' | LD_PRELOAD=./memcmp_hook.so ./whitebox
```

**Result:**

```
HOOK: computed=086e9675bc87af13daa01530c0f2ef6c086e9675bc87af13daa01530c0f2ef6c expected=04a419fe...
```

Our Python `transform(b'A'*16)` produced exactly `086e9675bc87af13daa01530c0f2ef6c` — **the reconstruction is correct**. We repeated this for several inputs (all matched).

---

## 5. Inverting the transform

### Step 1 — undo the final encoding

`out[pos] = O[pos*256 + state[P[pos]]]`. Each of the 16 per-position tables is a **bijection** (verified), so:

```python
state[P[pos]] = invO[pos][out[pos]]
```

### Step 2 — invert the 9 rounds (meet-in-the-middle)

Each round word is:

```
target = T0[a] ^ T1[b] ^ T2[c] ^ T3[d]
```

where `T0..T3` are the 4 subtables of that word and `a,b,c,d` are 4 distinct state bytes (selected by `P`). Since every state byte appears in exactly one word, the 4 words are independent.

We invert each word with MITM:

```python
def invert_word(target, tables):
    T0, T1, T2, T3 = tables
    left = defaultdict(list)
    for a in range(256):
        for b in range(256):
            left[T0[a] ^ T1[b]].append((a, b))
    res = []
    for c in range(256):
        for d in range(256):
            need = target ^ T2[c] ^ T3[d]
            if need in left:
                res.extend((a, b, c, d) for (a, b) in left[need])
    return res
```

This is ~2¹⁷ work per word instead of 2³². For every round and every word, the MITM returned **exactly one solution** — the transform is a bijection, so the inversion is deterministic.

---

## 6. Recovering the flag

```python
p0 = invert_block(ct0)   # ct0 = 04a419fedc9c8bd8d46b147d6382cec1
p1 = invert_block(ct1)   # ct1 = 5e5daa550aabd0c87d08604acd05344c
```

**Result:**

```
Block 0 plaintext: [REDACTED]
Block 1 plaintext: [REDACTED]
FLAG: [REDACTED]
```

The flag is 32 characters, starts with `NxCTF{`, ends with `}` — all format checks pass.

---

## 7. Verification

### Round-trip in Python

Re-encrypting the recovered plaintext with our reconstructed transform reproduces the expected ciphertext exactly:

```
Re-encryption matches expected ciphertext: True
```

### Against the binary

```bash
echo "[REDACTED]" | ./whitebox
```

**Result:**

```
> ok.
```

### Negative tests

```bash
echo "[REDACTED]" | ./whitebox   # wrong first char
echo "[REDACTED]" | ./whitebox   # wrong last char
echo "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" | ./whitebox   # random
```

All print `no.` — the recovered plaintext is provably the secret.

---

## Summary

| Item | Value |
|------|-------|
| **Cipher** | White-box AES (Chow-style), 9 table rounds + final byte encoding |
| **Key** | Folded into 144 lookup tables; no key constant in the binary |
| **Inversion** | Final encoding undo + per-word meet-in-the-middle over 4 tables |
| **Block 0** | `[REDACTED]` |
| **Block 1** | `[REDACTED]` |
| **Flag** | `[REDACTED]` |
| **Verification** | `./whitebox` prints `ok.` |

---

## Key Takeaways

1. **White-box crypto hides the key in tables** — never search for a key constant; the key material is baked into lookup tables with internal encodings.
2. **Reconstruct the exact transform first** — trace the effective-address arithmetic precisely (subtable index = `16r + 4j + i`) before trying any cryptanalysis.
3. **Direct inversion beats key extraction** — when a white-box round is a clean XOR of independent byte lookups (no XOR-splitting), meet-in-the-middle inverts each word in ~2¹⁷ instead of 2³².
4. **Validate against the binary** — an LD_PRELOAD hook on `memcmp` turns the binary into an oracle for your reconstructed cipher; never claim a flag without running it.
5. **The permutation table is the state-routing map** — `P = [0,5,10,15,4,9,14,3,8,13,2,7,12,1,6,11]` tells you exactly which 4 bytes feed each output word.