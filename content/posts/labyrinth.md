---
title: Labyrinth
description: Reverse engineering challenge inverting a 4-chunk 16-round Feistel network with AES S-boxes and an anti-debug ptrace key-poison.
image: /static/netanix.png
event: NxCTF
tags:
  - writeup
  - reversing
difficulty: medium
date: 2026-08-09
---

|                |                     |
| -------------- | ------------------- |
| **Challenge**  | Labyrinth           |
| **Category**   | Reverse Engineering |
| **Difficulty** | Medium              |
| **SHA256**     | `88e76134...`       |
| **Flag**       | `NxCTF{[REDACTED]}` |

---

## 1. Unlocking the archive

`laby.zip` is a traditional **ZipCrypto** archive (12-byte encryption header, no AES `0x9901` marker). The password was recovered with a dictionary attack:

```bash
fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt laby.zip
# PASSWORD FOUND!!!!: pw == helloworld
unzip -P helloworld laby.zip
```

The extracted `labyrinth` is a stripped x86-64 PIE ELF (SHA256 `88e76134...`).

## 2. Behavior

Running the binary:

```
$ echo 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' | ./labyrinth
[labyrinth] step in: you are lost.
```

- Input is read with `fgets`, `\r\n` stripped, and must be **exactly 32 bytes** (else "the walls collapse on you.").
- The 32 bytes are transformed and compared with `memcmp` against a 32-byte constant at `0x2060`; equality prints "the labyrinth opens.".

## 3. Anti-debug poison

`main` calls `ptrace(PTRACE_TRACEME, 0, 0, 0)`. If that fails (i.e. the process is already being traced), a global flag at `0x406c` is set to 1. Inside the round loop:

```asm
mov eax, r11d
xor eax, 0xdeadbeef
test ebp, ebp            ; poison flag
cmovne r11d, eax         ; key ^= 0xdeadbeef when traced
```

So under a debugger every round key is XORed with `0xdeadbeef` and the answer is poisoned — the binary "remembers visitors and poisons their answer". Analysis must be done statically or on a clean run.

## 4. The transform

The 32-byte input is processed as **4 chunks of 8 bytes**. Each chunk is a 16-round Feistel network:

```
for each of 16 keys k_i:
    t = ROL(SBOX32(k_i ^ B), 7) ^ A ^ 0xcafebabe
    A, B = B, t
```

- `SBOX32` applies the **AES S-box** (table at `0x20c0`, 256 bytes) to each byte of the 32-bit word.
- Round keys at `0x2080`: `a76c9b5e 3d24b89a 55cc11ff 9842c0de 017f3a4b b1ac5e76 4d2378e5 c9f8fa01 68b4d215 e3567b0a 2c9f47b8 71034ce6 da85b902 4f2e1ac7 8bd63e50 1a5c7e29`
- Expected ciphertext at `0x2060`: `f04b97c7245e38413614ca418593a2dd1132f5bf94ffe35cc36ae0e3163f2961`

## 5. Inversion

Each round is trivially invertible:

```
B_prev = A_next
A_prev = B_next ^ 0xcafebabe ^ ROL(SBOX32(k ^ B_prev), 7)
```

Iterating the keys in reverse over each 8-byte ciphertext chunk recovers the plaintext:

```
NxCTF{[REDACTED]}
```

## 6. Verification

```bash
$ echo 'NxCTF{[REDACTED]}' | ./labyrinth
[labyrinth] step in: the labyrinth opens.
```

The forward transform of the recovered flag also matches the expected ciphertext byte-for-byte.

## Lessons

- ZipCrypto passwords are often weak — a dictionary attack is the first move.
- Anti-debug `ptrace` + key poisoning is a common RE obfuscation; identify the poison branch and invert the _clean_ transform.
- Feistel networks with known S-boxes and keys are trivially invertible round-by-round.
