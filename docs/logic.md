# XOR Number Cipher Logic

This project keeps the original demo idea: encrypted output is a numeric string.

The implementation should improve correctness while preserving the number-based output.

## Reusable Library

Core logic lives in a single DOM-free file:

```text
js/xor-number-cipher.js
```

This file exposes a global browser API:

```js
await XORNumberCipher.encode(message, key)
await XORNumberCipher.encode(message, key, { output: "compact" })
await XORNumberCipher.decode(ciphertext, key)
await XORNumberCipher.encodeCompact(message, key)
await XORNumberCipher.decodeCompact(ciphertext, key)
await XORNumberCipher.encodeBest(message, key, { output: "number" | "compact" | "auto" })
await XORNumberCipher.decodeAuto(ciphertext, key)
XORNumberCipher.encrypt(message, key)
XORNumberCipher.decrypt(ciphertext, key)
XORNumberCipher.encryptToNumbers(message, key)
XORNumberCipher.decryptFromNumbers(ciphertext, key)
XORNumberCipher.validateNumberCiphertext(ciphertext)
XORNumberCipher.formatNumberGroups(ciphertext)
XORNumberCipher.cleanCiphertext(ciphertext)
await XORNumberCipher.zipNumberCiphertext(ciphertext)
await XORNumberCipher.unzipNumberCiphertext(zippedCiphertext)
await XORNumberCipher.encryptToZippedNumbers(message, key)
await XORNumberCipher.decryptFromZippedNumbers(zippedCiphertext, key)
await XORNumberCipher.encryptCompressedToNumbers(message, key)
await XORNumberCipher.decryptCompressedFromNumbers(ciphertext, key)
await XORNumberCipher.encryptToShortestNumbers(message, key)
await XORNumberCipher.encryptBestNumbers(message, key)
await XORNumberCipher.decryptBestNumbers(ciphertext, key)
XORNumberCipher.buildXorRows(message, key, limit)
```

`XORCipherTool` is an alias of the same API for compatibility with earlier demo code.

For engineer/agent usage, `encode()` and `decode()` are the preferred API. `encode()` keeps number-only best mode by default. `decode()` auto-detects number-only and compact `XC1` formats.

The library also supports CommonJS:

```js
const XORNumberCipher = require("./js/xor-number-cipher.js");
```

Example:

```html
<script src="./js/xor-number-cipher.js"></script>
<script>
  const encrypted = XORNumberCipher.encrypt("Hello 中文 😀", "key中文");
  const decrypted = XORNumberCipher.decrypt(encrypted, "key中文");
</script>
```

## Encryption Flow

1. Read plaintext message.
2. Read key.
3. Convert message to UTF-8 bytes with `TextEncoder`.
4. Convert key to UTF-8 bytes with `TextEncoder`.
5. For each message byte:
   - Pick a key byte by repeating the key bytes.
   - XOR message byte with key byte.
   - Convert result to a 3-digit number.
6. Join all 3-digit numbers into one ciphertext string.

Example operation:

```text
encryptedByte = messageByte ^ keyByte
numberGroup = encryptedByte.toString().padStart(3, "0")
```

## Decryption Flow

1. Read numeric ciphertext.
2. Remove whitespace.
3. Validate the ciphertext.
4. Split into 3-digit groups.
5. Convert each group to a number.
6. XOR each encrypted byte with the repeated key byte.
7. Collect decrypted bytes.
8. Decode bytes back to text with `TextDecoder`.

## Optional Zip Flow

The zip flow is separate from normal encryption:

1. Encrypt message to normal numeric ciphertext.
2. Gzip the numeric ciphertext string.
3. Convert compressed bytes back into 3-digit numeric groups.

Unzip reverses that:

1. Convert zipped 3-digit groups back to compressed bytes.
2. Gunzip into the original numeric ciphertext string.
3. Decrypt that normal numeric ciphertext with the key.

This keeps the final zipped payload numeric-only, but it is a different format from normal ciphertext. The caller must know whether the input is zipped or normal.

For UI use, prefer `encryptToShortestNumbers()`. It compares normal output against gzip-before-encrypt output and only returns compressed output when it is actually shorter.

For automatic self-describing output, use best mode:

```text
000 = normal
001 = gzip before encrypt
002 = gzip before encrypt plus gzip the encrypted number string
```

The first 3 digits are a mode header. `decryptBestNumbers()` reads the header and applies the correct reverse flow.

## Compact Text Flow

Compact text mode is optional. It is intended for engineers, AI agents, and users who can accept non-number ciphertext for shorter output.

The compact pipeline is:

```text
compress plaintext -> XOR by key -> Base64URL encode
```

Supported compact headers:

```text
XC1R = raw XOR bytes
XC1G = gzip plaintext, then XOR
XC1D = deflate-raw plaintext, then XOR
XC1B = brotli plaintext, then XOR when supported
```

Example output:

```text
XC1G.A1b2_cd-...
```

`encodeCompact()` compares supported compact candidates and selects the shortest. `deflate-raw` and brotli are optional because browser and Node support varies.

`decodeAuto()` dispatches by format:

- Starts with `XC1`: compact decode.
- Digits only: numeric decode. It tries `000/001/002` best headers first, then falls back to legacy raw numeric groups.

This keeps old numeric ciphertext usable while adding compact text output.

## Validation Rules

Before decrypting:

- Key must not be empty.
- Ciphertext must not be empty.
- Ciphertext must contain only digits after whitespace is removed.
- Ciphertext length must be divisible by 3.
- Each 3-digit group must be between `000` and `255`.
- Compact ciphertext must match `XC1R.`, `XC1G.`, `XC1D.`, or `XC1B.` with a Base64URL payload.

Before encrypting:

- Key must not be empty.
- Message must not be empty.

## Recommended Function Names

```js
encryptToNumbers(message, key)
decryptFromNumbers(ciphertext, key)
validateNumberCiphertext(ciphertext)
formatNumberGroups(ciphertext)
```

## Important Implementation Rule

Do not use `charCodeAt()` for the key if Unicode key support is required.

Use:

```js
const keyBytes = encoder.encode(key);
```

This keeps the XOR result inside byte range `0-255`.

## Limitation

Repeated-key XOR is not secure. It is suitable for a learning demo only.
