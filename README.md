# XOR Cipher Tool

A browser-based XOR cipher demo that encrypts text into number-only ciphertext by default, with an optional compact text format for shorter engineer/agent output.

This project is intended for learning and demonstration. It is not secure encryption and must not be used for passwords, tokens, private documents, or production security.

## Project Goal

Build a simple static web tool that:

- Accepts a text message and a key.
- Converts the message and key into UTF-8 bytes.
- Applies XOR byte by byte.
- Outputs a numeric ciphertext where every encrypted byte is stored as a 3-digit number.
- Optionally outputs compact text with self-describing `XC1` or `XC2` headers.
- Decrypts the numeric ciphertext back into the original text.
- Provides a reusable single-file JavaScript library for other engineers and AI agents.

## Cipher Format

The default ciphertext is a continuous number string.

Each encrypted byte is formatted as exactly 3 digits:

```text
000 to 255
```

Example:

```text
072005099188
```

The decryptor reads the ciphertext in 3-digit groups:

```text
072 005 099 188
```

Best number mode prefixes the payload with a 3-digit mode header:

```text
000 = normal XOR number ciphertext
001 = gzip plaintext -> XOR compressed bytes -> number ciphertext
002 = gzip plaintext -> XOR compressed bytes -> gzip number ciphertext -> number ciphertext
```

Compact text mode is optional. `XC1` uses Base64URL. `XC2` uses ASCII85/Base85 for shorter text output and may contain punctuation:

```text
XC1R.<base64url> = raw XOR bytes
XC1G.<base64url> = gzip plaintext -> XOR -> Base64URL
XC1D.<base64url> = deflate-raw plaintext -> XOR -> Base64URL
XC1B.<base64url> = brotli plaintext -> XOR -> Base64URL, only when supported
XC2R.<ascii85> = raw XOR bytes -> ASCII85
XC2G.<ascii85> = gzip plaintext -> XOR -> ASCII85
XC2D.<ascii85> = deflate-raw plaintext -> XOR -> ASCII85
XC2B.<ascii85> = brotli plaintext -> XOR -> ASCII85, only when supported
```

## Required Features

- Encrypt plaintext into numeric ciphertext.
- Decrypt numeric ciphertext back into plaintext.
- Support English, Chinese, emoji, and other Unicode text by using `TextEncoder` and `TextDecoder`.
- Validate that the key is not empty.
- Validate that ciphertext contains only numbers after whitespace is removed.
- Validate that ciphertext length is divisible by 3.
- Validate that every 3-digit group is between `000` and `255`.
- Copy encrypted and decrypted output.
- Clear/reset all fields.
- Show before/after textarea counts: plaintext characters/bytes and ciphertext digits/groups.
- Allow end users to gzip plaintext before encryption when it makes the numeric output shorter.
- Allow end users to choose output format, compression mode, and compact text encoding manually.
- Show a warning that XOR cipher is for learning only.

## Recommended Features

- Toggle between continuous output and grouped output.
- Show an XOR explanation table:

```text
message byte | key byte | XOR result | 3-digit output
```

- Add a PWA layer:
  - `manifest.json`
  - `sw.js`
  - `offline.html`
  - PNG icons for 192, 512, maskable, and Apple touch icon

## Repository Structure

```text
.
├── README.md
├── index.html
├── styles.css
├── manifest.json
├── sw.js
├── offline.html
├── docs/
│   ├── logic.md
│   ├── library.md
│   ├── pwa-standard.md
│   └── documentation-standard.md
├── .github/
│   └── workflows/
│       └── deploy.yml
├── img/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   └── apple-touch-icon-180.png
├── js/
│   ├── xor-number-cipher.js
│   └── app.js
├── scripts/
│   └── generate-icons.js
├── task.md
└── task.jsonl
```

## Run Locally

Open `index.html` directly for the basic demo.

For PWA and Service Worker testing, serve the folder from localhost:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Use as a Library

The reusable cipher logic is in:

```text
js/xor-number-cipher.js
```

Load it in any browser page:

```html
<script src="./js/xor-number-cipher.js"></script>
<script>
  const result = await XORNumberCipher.encode("Hello 中文 😀", "secret-key");
  const compact = await XORNumberCipher.encode("Hello 中文 😀", "secret-key", { output: "compact" });
  const plaintext = await XORNumberCipher.decode(result.ciphertext, "secret-key");

  console.log(result.ciphertext);
  console.log(compact.ciphertext);
  console.log(plaintext);
</script>
```

Available API:

```js
await XORNumberCipher.encode(message, key)
await XORNumberCipher.encode(message, key, { output: "compact" })
await XORNumberCipher.decode(ciphertext, key)
await XORNumberCipher.encodeNumber(message, key, { mode: "normal" | "gzip" | "gzip-number" })
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
XORNumberCipher.bytesToBase64Url(bytes)
XORNumberCipher.base64UrlToBytes(text)
XORNumberCipher.bytesToAscii85(bytes)
XORNumberCipher.ascii85ToBytes(text)
XORNumberCipher.isCompressionFormatSupported(format)
XORNumberCipher.buildXorRows(message, key, limit)
```

`XORCipherTool` is also kept as an alias for compatibility.

Node or AI agent scripts can also require it:

```js
const XORNumberCipher = require("./js/xor-number-cipher.js");

const result = await XORNumberCipher.encode("Hello 中文 😀", "secret-key");
const compact = await XORNumberCipher.encode("Hello 中文 😀", "secret-key", { output: "compact" });
const plaintext = await XORNumberCipher.decode(result.ciphertext, "secret-key");
```

More details: [docs/library.md](docs/library.md).

For engineers and AI agents, prefer:

```js
const result = await XORNumberCipher.encode(message, key);
const message = await XORNumberCipher.decode(result.ciphertext, key);
```

`encode()` keeps number-only output by default for compatibility and returns metadata such as `format`, `mode`, `modeName`, and `selectedLength`.

Use `encodeNumber()` or `encodeCompact()` when the caller needs explicit control instead of automatic best selection. `decode()` auto-detects number-only, `XC1` Base64URL compact ciphertext, and `XC2` Base85 compact ciphertext.

## Regenerate Icons

```bash
node scripts/generate-icons.js
```

## Deploy

This repo includes a GitHub Pages workflow at `.github/workflows/deploy.yml`.

After pushing to GitHub:

1. Open repository Settings.
2. Go to Pages.
3. Set Source to `GitHub Actions`.
4. Push to `main` or run the workflow manually.

If the first workflow run fails with `Get Pages site failed`, keep the workflow's `enablement: true` setting and confirm the repository Pages source is set to GitHub Actions.

## Development Notes

This project should stay framework-free unless there is a clear reason to add tooling.

Preferred stack:

- HTML
- CSS
- Vanilla JavaScript
- Static hosting, such as GitHub Pages

## Security Notice

XOR with a repeated key is easy to break. This project is a teaching demo only.

For real encryption, use the browser Web Crypto API with an authenticated encryption mode such as AES-GCM.
