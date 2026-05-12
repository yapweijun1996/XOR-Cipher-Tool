# PWA Standard

This document defines the minimum PWA standard for the XOR Cipher Tool if install/offline support is added.

## Required Files

```text
manifest.json
sw.js
offline.html
js/xor-number-cipher.js
img/icon-192.png
img/icon-512.png
img/icon-maskable-512.png
img/apple-touch-icon-180.png
```

## HTML Head Requirements

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0f766e">
<link rel="manifest" href="./manifest.json">
<link rel="apple-touch-icon" href="./img/apple-touch-icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## Manifest Requirements

Minimum fields:

```json
{
  "id": "/XOR-Cipher-Tool/",
  "name": "XOR Cipher Tool",
  "short_name": "XOR Cipher",
  "description": "A browser-based XOR number cipher demo.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f766e",
  "lang": "en",
  "dir": "ltr",
  "icons": []
}
```

Icon rules:

- Provide PNG fallback icons.
- Provide a separate maskable icon.
- Do not use `purpose: "any maskable"` in one icon entry.
- Use a real `apple-touch-icon` PNG for iOS.

## Service Worker Strategy

Use a versioned cache:

```js
const VERSION = "2026-05-12-4";
const CACHE_NAME = `xor-cipher-${VERSION}`;
```

Recommended strategy:

- HTML navigation: network-first with offline fallback.
- CSS, JS, images: stale-while-revalidate.
- Clear old caches during `activate`.

When adding or renaming JavaScript files, update `PRECACHE_URLS` in `sw.js` and bump the Service Worker `VERSION`.

Register the Service Worker with `updateViaCache: "none"` so the browser does not reuse a cached `sw.js` during update checks:

```js
navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
```

On page load, also check `registration.waiting`. A new worker can already be waiting before the current page adds the `updatefound` listener.

For form-based tools, prefer showing an update banner instead of forcing silent reloads.

## Offline Fallback

`offline.html` should be small and static.

It should explain that the app could not load the latest page, but cached tools may still work.

## iOS Safe Area

If the app uses full-screen or standalone display, CSS should account for safe areas:

```css
body {
  padding-top: max(16px, env(safe-area-inset-top));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  padding-left: max(16px, env(safe-area-inset-left));
}
```

## Testing Checklist

- Chrome DevTools Application panel shows valid manifest.
- Service Worker installs successfully.
- App loads while offline after first visit.
- Update flow works after cache version changes.
- Icons appear correctly on Android and iOS home screen.
- Lighthouse installability checks pass.
