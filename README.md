# Hanny Montany

Privacy-first photo censor and blur editor built as a zero-dependency Progressive Web App (PWA).

All image editing runs 100% on-device in browser memory. Photos are never uploaded, cookies and storage APIs are not used, and exports are redrawn on a fresh canvas so EXIF and GPS tags are dropped.

## Features

| Mode | Capability |
| :--- | :--- |
| **Blur** | Dual-layer masking across 20 optical and geometric filters (Natural Blur, Mosaic, Reeded Glass, Film Grain, etc.). |
| **Artistic** | Textured physical media brushes (Skin tones, Chalk, Oil knife, Crayon, Glitter, Splatter). |
| **Stickers** | 18 vector disguise and censor stamps with 360° rotate, scale, and opacity controls. |
| **Auto Detect** | Client-side heuristic tools for rough face bounding, text-like edge density, and object erase. |

Tools include hold-to-compare original (<kbd>Space</kbd>), rectangle/oval shape masks, and mask inversion (spotlight background blur).

## Installation (PWA)

* **Desktop / Chromebook (Chrome, Edge):** Click **Install** in the browser address bar.
* **iOS (Safari):** Tap **Share** &rarr; **Add to Home Screen**.
* **Android (Chrome):** Tap menu &rarr; **Install App** / **Add to Home screen**.

Once installed, the app works completely offline.

## Running Locally

Requires Node.js (no npm packages to install):

```bash
git clone https://github.com/<your-username>/Hanny-Montany.git
cd Hanny-Montany
node server.mjs
```

Open `http://localhost:3000` in your browser.

## Hosting on GitHub Pages

1. In your GitHub repository, go to **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Branch**, select `main` and root `/`.
3. Click **Save**. The app serves as static files with zero build step.

## Privacy Model

* **No Network Calls:** Content Security Policy restricts connections to `'self'`.
* **In-Memory Only:** No cookies, `localStorage`, `sessionStorage`, or `IndexedDB`. Closing the tab erases all working buffers.
* **Metadata Removal:** Canvas re-encoding drops camera EXIF, GPS location tags, and device timestamps upon export.

## License

MIT License.
