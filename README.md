# XOR Cipher Tool

A browser-based XOR cipher demo that encrypts text into a numeric ciphertext format.

This project is intended for learning and demonstration. It is not secure encryption and must not be used for passwords, tokens, private documents, or production security.

## Project Goal

Build a simple static web tool that:

- Accepts a text message and a key.
- Converts the message and key into UTF-8 bytes.
- Applies XOR byte by byte.
- Outputs a numeric ciphertext where every encrypted byte is stored as a 3-digit number.
- Decrypts the numeric ciphertext back into the original text.
- Provides a reusable single-file JavaScript library for other engineers and AI agents.

## Cipher Format

The ciphertext is a continuous number string.

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
  const ciphertext = XORNumberCipher.encrypt("Hello 中文 😀", "secret-key");
  const plaintext = XORNumberCipher.decrypt(ciphertext, "secret-key");

  console.log(ciphertext);
  console.log(plaintext);
</script>
```

Available API:

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
await XORNumberCipher.encryptCompressedToNumbers(message, key)
await XORNumberCipher.decryptCompressedFromNumbers(ciphertext, key)
await XORNumberCipher.encryptToShortestNumbers(message, key)
await XORNumberCipher.encryptBestNumbers(message, key)
await XORNumberCipher.decryptBestNumbers(ciphertext, key)
XORNumberCipher.buildXorRows(message, key, limit)
```

`XORCipherTool` is also kept as an alias for compatibility.

Node or AI agent scripts can also require it:

```js
const XORNumberCipher = require("./js/xor-number-cipher.js");

const ciphertext = XORNumberCipher.encrypt("Hello 中文 😀", "secret-key");
const plaintext = XORNumberCipher.decrypt(ciphertext, "secret-key");
```

More details: [docs/library.md](docs/library.md).

For very long text, the UI can auto-select the shortest format. Best mode prefixes output with a 3-digit mode header: `000` normal, `001` gzip-before-encrypt, `002` gzip-before-encrypt then gzip again.

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
