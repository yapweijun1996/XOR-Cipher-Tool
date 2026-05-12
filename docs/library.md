# Library Usage

The reusable XOR number cipher logic lives in:

```text
js/xor-number-cipher.js
```

It has no DOM dependency. The web app UI in `js/app.js` uses this same library.

## Browser Usage

```html
<script src="./js/xor-number-cipher.js"></script>
<script>
  const ciphertext = XORNumberCipher.encrypt("Hello 中文 😀", "secret-key");
  const plaintext = XORNumberCipher.decrypt(ciphertext, "secret-key");

  console.log(ciphertext);
  console.log(plaintext);
</script>
```

## Node / Agent Script Usage

```js
const XORNumberCipher = require("./js/xor-number-cipher.js");

const result = await XORNumberCipher.encode("Hello 中文 😀", "secret-key");
const plaintext = await XORNumberCipher.decode(result.ciphertext, "secret-key");

console.log(result.ciphertext);
console.log(plaintext);
```

Node 18+ is recommended because it provides `TextEncoder` and `TextDecoder` globally.

## API

```js
await XORNumberCipher.encode(message, key)
await XORNumberCipher.decode(ciphertext, key)
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

`XORCipherTool` is kept as a browser alias for compatibility.

## Recommended Agent API

Agents and engineers should prefer the high-level aliases:

```js
const result = await XORNumberCipher.encode(message, key);
const plaintext = await XORNumberCipher.decode(result.ciphertext, key);
```

`encode()` is an alias for `encryptBestNumbers()`. It compresses, encrypts, and encodes into number groups using the shortest supported mode. `decode()` is an alias for `decryptBestNumbers()` and reads the 3-digit mode header automatically.

## Optional Zip / Gzip Layer

The default cipher output is already numeric. If the numeric ciphertext is very long, the library can gzip that numeric string and convert the compressed bytes back into 3-digit numbers.

```js
const ciphertext = XORNumberCipher.encrypt("Long message...", "secret-key");
const zipped = await XORNumberCipher.zipNumberCiphertext(ciphertext);
const restoredCiphertext = await XORNumberCipher.unzipNumberCiphertext(zipped);
const plaintext = XORNumberCipher.decrypt(restoredCiphertext, "secret-key");
```

Shortcut:

```js
const zipped = await XORNumberCipher.encryptToZippedNumbers("Long message...", "secret-key");
const plaintext = await XORNumberCipher.decryptFromZippedNumbers(zipped, "secret-key");
```

The web UI exposes a more efficient `Gzip before encrypt` mode. It gzips plaintext bytes first, XOR-encrypts those compressed bytes, then outputs the encrypted bytes as 3-digit numbers.

The UI uses `encryptToShortestNumbers()`, so gzip mode only outputs compressed ciphertext if it is shorter than normal ciphertext. If gzip would make the result longer, the UI keeps the normal ciphertext and shows a skip message.

Important:

- The zipped output is still number-only.
- The zipped output is also grouped as 3 digits per compressed byte.
- Small messages may become longer after gzip because gzip has header/metadata overhead.
- Use `encryptToShortestNumbers()` when you want automatic shorter-output selection.
- This uses `CompressionStream` and `DecompressionStream`, so it needs a modern browser or Node runtime that supports those APIs.

## Best Mode

Best mode compares three numeric formats and returns the shortest:

```text
000 = normal XOR number ciphertext
001 = gzip plaintext -> XOR compressed bytes -> number ciphertext
002 = gzip plaintext -> XOR compressed bytes -> gzip number ciphertext -> number ciphertext
```

Example:

```js
const result = await XORNumberCipher.encryptBestNumbers(message, key);
const plaintext = await XORNumberCipher.decryptBestNumbers(result.ciphertext, key);
```

`decryptBestNumbers()` reads the first 3-digit group as the mode header.

Legacy note: `zipNumberCiphertext()` gzips the already-encrypted number string. It remains available for agents that need it, but `encryptBestNumbers()` should be the default for shortest output.

## Error Behavior

The library throws `Error` for invalid input:

- Empty message during encryption.
- Empty key.
- Empty ciphertext.
- Ciphertext contains non-digit characters after whitespace cleanup.
- Ciphertext length is not divisible by 3.
- Any 3-digit group is outside `000` to `255`.
- Zip/unzip APIs throw if `CompressionStream` or `DecompressionStream` is not available.

## Security Boundary

This is repeated-key XOR for learning. It is not secure encryption.

Use Web Crypto AES-GCM for real security.
