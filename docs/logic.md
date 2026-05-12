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
await XORNumberCipher.encryptToShortestNumbers(message, key)
XORNumberCipher.buildXorRows(message, key, limit)
```

`XORCipherTool` is an alias of the same API for compatibility with earlier demo code.

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

For UI use, prefer `encryptToShortestNumbers()`. It compares normal vs zipped output and only returns zipped output when it is actually shorter.

## Validation Rules

Before decrypting:

- Key must not be empty.
- Ciphertext must not be empty.
- Ciphertext must contain only digits after whitespace is removed.
- Ciphertext length must be divisible by 3.
- Each 3-digit group must be between `000` and `255`.

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
