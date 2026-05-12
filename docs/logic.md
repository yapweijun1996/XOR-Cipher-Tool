# XOR Number Cipher Logic

This project keeps the original demo idea: encrypted output is a numeric string.

The implementation should improve correctness while preserving the number-based output.

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
