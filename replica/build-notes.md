# Lawha: build notes (architect → design → build → test → diff → brand → deploy)

## Architect
- **Stack:** an offline web editor (plain JavaScript, no build step) running inside a native iOS shell (Swift + WKWebView). There is no server and no accounts, and everything is saved on the device. That keeps the app free to run forever.
- **Libraries:** Konva 9 (canvas, selection, transformer) and jsPDF 2 (PDF export). Both are MIT. Fonts are 12 Google Fonts under OFL, including Arabic fonts (Cairo, Tajawal, Changa, Reem Kufi, Lalezar, Amiri). Icons are Lucide (ISC). All of them are bundled, so the app works with no internet connection.
- **Data:** one JSON document per design: `{id, title, width, height, pages:[{bg, elements:[…]}]}`. Element types are `text | shape | line | image | icon | group`, and groups nest. Uploads are stored once and referenced by data URL.
- **Storage:** on iOS, `store` is a native bridge that writes one file per key under `Application Support/LawhaData`. In a browser it falls back to IndexedDB. Undo history keeps images in an in-memory pool, so snapshots stay small.
- **Export:** each page renders off-screen to a canvas, capped at 16M pixels (the iOS canvas limit). The output is PNG, JPG or a multi-page PDF. On iOS the `share` bridge opens the system share sheet: Save Image, Save to Files, AirDrop, and so on.

## Design (own identity, not Canva's)
- **Palette:** vermilion `#E4572E` (accent), ink `#1F2A44`, paper `#FAF7F2`, line `#E7E1D8`, amber `#F2A541`. There is no purple or teal brand gradient.
- **Type:** the UI uses Cairo. The UI is Arabic-first and right-to-left, with an English switch.
- **Layout:** phones get a bottom tab bar, a bottom panel and a floating context bar. Screens 820px and wider get a side rail and a side panel.

## Brand
- **Name:** Lawha (لوحة, "canvas / board"). The icon is an original open frame. The name has not been checked for trademarks; check it before any public store release.

## Test
- Automated Playwright smoke tests in Chromium, at phone (390×844, touch) and desktop (1280×800) sizes, covered:
  - template open, add text, shape and icon
  - group, ungroup, align, undo and redo
  - drag and corner-resize with the mouse, image upload, crop, filters, font change, gradient background, layers
  - double-click text editing, marquee select plus Ctrl+G
  - PNG export (2160×2160), 2-page PDF export, resize-to-copy
  - persistence after a reload
- There were no console errors.
- Not tested here: the real iOS build. It is built on GitHub's macOS runner.

## Diff (parity vs the recon feature matrix)
- Weighted parity: about **83%** (must ×3, should ×2, could ×1, skips excluded). See `features.csv`.
- **Missing should-haves:** background remover, SVG export, folders, share links, stock photo search.
- **Missing could-haves:** charts, comments, live co-editing.

## Deploy
- `.github/workflows/ios.yml` builds an **unsigned IPA** on a macOS runner. It uploads the IPA as an artifact and publishes it as a GitHub pre-release.
- Install the IPA with SideStore or AltStore, which sign it with your own Apple ID.
