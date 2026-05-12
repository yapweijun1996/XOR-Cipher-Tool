# Task Board

## Current Milestone

Set up the XOR Cipher Tool project foundation.

## Active Task

No active implementation task.

## Planned

- Improve visual polish after browser review.
- Add automated browser smoke tests if the project grows.

## Done

- Created project documentation standard.
- Created logic documentation for XOR number cipher.
- Created PWA standard notes.
- Created long-running task tracking files.
- Created the first `index.html` XOR number cipher demo.
- Implemented byte-based XOR number encryption and decryption.
- Implemented numeric ciphertext validation.
- Added copy and clear buttons.
- Added security warning in the UI.
- Added XOR explanation table.
- Added PWA support with manifest, service worker, offline page, and generated icons.
- Added GitHub Pages deployment workflow.
- Fixed GitHub Pages first-run workflow configuration by enabling Pages setup and opting JavaScript actions into Node 24.
- Fixed UI/PWA edge issues found during review: hidden display override, offline fallback order, and clipboard fallback.
- Extracted XOR number cipher logic into a reusable single-file JavaScript library.
- Added library documentation for browser and Node/CommonJS usage.
- Added live plaintext and ciphertext length counters for end users.
- Added optional gzip-to-number APIs for long numeric ciphertext.
- Fixed PWA update flow so waiting Service Workers show reload and update checks bypass cached `sw.js`.
- Added a UI checkbox for zipped numeric ciphertext mode.
- Changed zip mode to gzip plaintext before XOR encryption and keep normal ciphertext when gzip would make output longer.
- Added best mode with 000/001/002 headers for normal, gzip-before-encrypt, and gzip+encrypt+gzip.

## Blocked

- None.

## Notes

The project should preserve the original number-output encryption style:

```text
encrypted byte -> 3-digit number -> continuous numeric ciphertext
```

The implementation should still use byte-safe Unicode handling with `TextEncoder` and `TextDecoder`.

Library entrypoint:

```text
js/xor-number-cipher.js
```
