// Structured documentation content for the in-app User Manual
// Decoupled from HTML markup to keep index.html lean and maintainable

export const MANUAL_DATA = {
  start: {
    title: 'Privacy, Zero-Storage & Safety Architecture',
    html: `
      <h4 class="manual-heading">100% On-Device Privacy Architecture</h4>
      <p class="manual-p">Hanny Montany Studio was created with a single uncompromising mission: <strong>absolute privacy, security, and child safety</strong>. Your photos never leave your device.</p>
      
      <div class="manual-callout" style="border-left: 3px solid #10b981; background: rgba(16, 185, 129, 0.08);">
        <strong>No File Storage & No Database:</strong> We do not store your photos anywhere. The app uses zero cookies, zero <em>localStorage</em>, zero <em>IndexedDB</em>, and zero cloud databases. When you open a photo, it lives exclusively in temporary computer RAM. The moment you close the browser tab or load another image, the photo is permanently wiped from memory.
      </div>

      <div class="manual-callout" style="border-left: 3px solid #38bdf8; background: rgba(56, 189, 248, 0.08); margin-top: 8px;">
        <strong>Zero Uploads & Network Isolation:</strong> There are no analytics, tracking scripts, telemetry, or remote vision APIs. All face, document, and text detections execute locally using on-device math. An enforced Content-Security-Policy guarantees that the browser cannot transmit data externally.
      </div>

      <div class="manual-callout" style="border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.08); margin-top: 8px;">
        <strong>100% EXIF & GPS Location Scrubbing:</strong> Modern smartphones secretly embed your home or school GPS coordinates, timestamp, camera serial number, and phone model into every photo file. When you export from Hanny Montany, the image is freshly rendered from clean pixel canvas buffers. All EXIF metadata, GPS tags, and device identifiers are permanently erased before you share online.
      </div>

      <h4 class="manual-heading" style="margin-top: 18px;">Built for Family Safety & Sensitive Documents</h4>
      <p class="manual-p">Because processing is completely contained within your device, Hanny Montany is ideal for:</p>
      <ul class="manual-list">
        <li><strong>Protecting Children & Minors:</strong> Easily blur children's faces, school uniforms, and house numbers before posting to social media or group chats.</li>
        <li><strong>Financial & ID Documents:</strong> Redact credit card numbers, CVVs, expiration dates, passport numbers, and home addresses with automated bounding boxes.</li>
        <li><strong>Social Media & Forum Sharing:</strong> Obscure license plates, street signs, and background bystanders without trusting unknown cloud photo services.</li>
      </ul>

      <h4 class="manual-heading" style="margin-top: 18px;">Core 4-Step Workflow</h4>
      <ol class="manual-list">
        <li><strong>Open Photo:</strong> Tap <em>Open</em> or drag and drop any image up to 50MB directly onto the canvas.</li>
        <li><strong>Pick Tool & Apply:</strong> Choose a filter (Blur, Mosaic, Reeded Glass, Face Cloak) or artistic brush, pick a shape (Brush, Box, or Oval), and draw over the sensitive region.</li>
        <li><strong>Inspect with Loupe or Compare:</strong> Press and hold <em>Original</em> (or hold Spacebar) to preview the untouched photo in real time, or toggle the <em>Loupe</em> for a 2.5× magnified inspection.</li>
        <li><strong>Export Clean:</strong> Tap <em>Save</em> to pick PNG (lossless), WebP, or JPEG with quality control.</li>
      </ol>
    `
  },
  install: {
    title: 'Install & Offline App Guide (Chromebook, Mobile, Desktop)',
    html: `
      <h4 class="manual-heading">Do I Need to Run a Server or Terminal?</h4>
      <p class="manual-p"><strong>No! Absolutely not.</strong> Hanny Montany is built as a self-contained Progressive Web App (PWA). There are no Node.js servers to start, no terminal commands, and no port 3000 to manage on Chromebooks or mobile devices. Once opened, everything runs natively inside your browser's offline engine.</p>

      <div class="manual-callout" style="border-left: 3px solid #10b981; background: rgba(16, 185, 129, 0.08);">
        <strong>100% Offline Capability:</strong> Once loaded, the app saves all interface code, brush algorithms, and image filters directly into your browser's persistent service worker cache. You can turn off Wi-Fi, go into airplane mode, or take your Chromebook off the grid, and Hanny Montany will launch instantly.
      </div>

      <h4 class="manual-heading" style="margin-top: 18px;">How to Install on Chromebook (ChromeOS)</h4>
      <ol class="manual-list">
        <li><strong>Open in Chrome:</strong> Open the app's website address in Google Chrome on your Chromebook.</li>
        <li><strong>Click the Install Icon:</strong> Look at the right side of the URL address bar at the top of the browser. Click the <strong>Install</strong> icon (looks like a computer screen with a downward arrow) or click Chrome's 3-dot menu ⋮ &gt; <em>"Install Hanny Montany"</em>.</li>
        <li><strong>Use as a Dedicated Window:</strong> The app immediately pops out into its own standalone, distraction-free desktop window without browser tabs or address bars.</li>
        <li><strong>Pin to Shelf:</strong> Right-click the app's mosaic lens icon on your Chromebook shelf (taskbar) and click <strong>Pin</strong> for instant 1-click launch anytime!</li>
      </ol>

      <h4 class="manual-heading" style="margin-top: 18px;">How to Install on Mobile Devices</h4>
      <div class="manual-step-card">
        <h5>Android Phones &amp; Tablets (Chrome)</h5>
        <p class="manual-p">Tap the 3-dot menu (⋮) in the top-right corner of Chrome, then select <strong>Install app</strong> (or <em>"Add to Home screen"</em>). An app icon will appear on your phone's home screen and app drawer.</p>
      </div>
      <div class="manual-step-card" style="margin-top: 8px;">
        <h5>iPhone &amp; iPad (Safari)</h5>
        <p class="manual-p">Open the link in Safari, tap the <strong>Share</strong> button (box with an arrow pointing up) at the bottom, scroll down, and tap <strong>Add to Home Screen</strong>. It runs full-screen just like a native iOS app.</p>
      </div>
      <div class="manual-step-card" style="margin-top: 8px;">
        <h5>Windows PC &amp; Mac (Chrome / Edge)</h5>
        <p class="manual-p">In Chrome or Edge, click the <strong>Install</strong> button in the address bar to install it as a native desktop application with its own launch shortcut.</p>
      </div>

      <h4 class="manual-heading" style="margin-top: 18px;">Free Web Hosting (Launch Your Own Copy for $0)</h4>
      <p class="manual-p">Because Hanny Montany requires zero backend databases or server runtime, you do not need paid web hosting to share it with friends, family, or colleagues. You can host it for free forever using:</p>
      <ul class="manual-list">
        <li><strong>GitHub Pages (Recommended):</strong> Push this repository to GitHub, go to <em>Settings &gt; Pages</em>, and select your branch. GitHub gives you a free HTTPS web link (<code>https://yourname.github.io/blur-mosaic-web</code>).</li>
        <li><strong>Netlify Drop:</strong> Go to <a href="https://app.netlify.com/drop" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: underline;">app.netlify.com/drop</a> and drag-and-drop this project folder directly onto the webpage for an instant free live URL in 5 seconds.</li>
        <li><strong>Cloudflare Pages:</strong> Connect your Git repository for free global edge deployment with zero bandwidth charges.</li>
      </ul>
    `
  },
  cloak: {
    title: 'Face Cloak (Biometric Privacy) Guide',
    html: `
      <h4 class="manual-heading">What is Face Cloaking?</h4>
      <p class="manual-p">Face Cloaking is an adversarial privacy shield inspired by academic research (<em>Fawkes / LowKey</em>). It protects your portrait photos from automated facial recognition systems, surveillance scrapers, and bot crawlers without disfiguring your face.</p>

      <div class="manual-callout">
        <strong>Do I need to train or configure anything?</strong> No! Everything is baked in. There are no models to download, no accounts, and no setup. You just apply the filter like any other blur.
      </div>

      <h4 class="manual-heading">How to Use Face Cloaking in 3 Simple Steps</h4>
      <div class="manual-step-card">
        <h5>Step 1: Select "Face Cloak" Filter</h5>
        <p class="manual-p">In <strong>Blur</strong> mode, scroll through the bottom carousel and tap the <strong>Face Cloak</strong> preset card.</p>
      </div>
      <div class="manual-step-card">
        <h5>Step 2: Cover the Face</h5>
        <p class="manual-p">In the shape toolbar above the carousel, tap <strong>Oval</strong> (or use the regular Brush) and drag an oval over the person's face. Notice that your face remains natural, clear, and recognizable to your friends, overlaid with only subtle photographic film grain.</p>
      </div>
      <div class="manual-step-card">
        <h5>Step 3: Export at High Quality</h5>
        <p class="manual-p">Tap <strong>Save</strong> and select <strong>PNG (Lossless)</strong> or <strong>JPEG with 90%+ quality</strong>. High quality preserves the micro-gradient perturbations so automated scrapers cannot reverse or bypass the protection.</p>
      </div>

      <h4 class="manual-heading">How Does It Work? (Human Eyes vs Automated Biometric Scrapers)</h4>
      <p class="manual-p">Human eyes recognize a face holistically by looking at expressions, smile, and eye shape. But automated biometric facial recognition algorithms (like FaceNet or InsightFace) do not see faces like humans: they pass pixels through mathematical gradient filters to calculate a 512-number coordinate called a <em>facial embedding</em>.</p>
      <p class="manual-p">The Face Cloak filter injects high-frequency microscopic gradient perturbations into the image. To your friends on social media, you look completely natural. But when an automated scraper analyzes the photo, the micro-gradients scramble its mathematical feature extraction, producing an invalid embedding that matches nothing in its database.</p>
    `
  },
  recipes: {
    title: 'How-To Recipes',
    html: `
      <h4 class="manual-heading">Recipe 1: "Reverse Censor" (Portrait Bokeh / Focal Spotlight)</h4>
      <p class="manual-p">Instead of blurring what you paint, blur the entire background while your subject stays crystal sharp:</p>
      <ol class="manual-list">
        <li>Select <strong>Heavy Bokeh</strong> or <strong>Natural Blur</strong>.</li>
        <li>Use the <strong>Oval</strong> or <strong>Brush</strong> tool to draw over your subject.</li>
        <li>Tap the <strong>Invert</strong> button (in the shape bar or bottom dock).</li>
        <li>Instantly, your subject stays sharp and the entire background melts into beautiful DSLR bokeh!</li>
      </ol>

      <h4 class="manual-heading">Recipe 2: Auto-Censor Credit Cards, Receipts & IDs</h4>
      <ol class="manual-list">
        <li>Switch to <strong>Auto Detect</strong> mode in the bottom dock.</li>
        <li>Tap the <strong>Text & ID</strong> card.</li>
        <li>Our offline computer vision engine scans the image and places individual bounding boxes specifically targeting 16-digit card blocks, expiry dates, and CVVs.</li>
        <li>Tap <strong>Apply Blur</strong> to permanently redact all detected fields with 1 click.</li>
      </ol>

      <h4 class="manual-heading">Recipe 3: One-Tap Auto Face Redaction</h4>
      <ol class="manual-list">
        <li>Switch to <strong>Auto Detect</strong> mode and tap <strong>Face Censor</strong>.</li>
        <li>Every face in the photo is automatically framed in an oval badge.</li>
        <li>Tap any box to toggle it on or off, then tap <strong>Apply Blur</strong>.</li>
      </ol>
    `
  },
  modes: {
    title: 'The 4 Studio Modes',
    html: `
      <h4 class="manual-heading">1. Blur & Mosaic Mode</h4>
      <p class="manual-p">Dual-layer real-time alpha masking. Choose from 20 filters and fine-tune Size (brush diameter / block size) and Intensity (blur radius / displacement).</p>

      <h4 class="manual-heading">2. Artistic Mode</h4>
      <p class="manual-p">Tactile painterly redaction with textured brushes: Multi-Tone Skin swatches, Chalk/Pastel, Oil Palette Knife, Crayon Wax, Glitter Sparkles, and Splatter Mist.</p>

      <h4 class="manual-heading">3. Stickers Mode</h4>
      <p class="manual-p">18 transparent vector disguise & censor stamps across 4 categories (Disguises, Censors, Bows & Accents, Emojis). Tap any placed sticker to reveal transform handles to move, rotate, scale, or adjust opacity.</p>

      <h4 class="manual-heading">4. Auto Detect Mode</h4>
      <p class="manual-p">On-device computer vision actions: Auto Face Censor, Smart Document & Credit Card Redactor, Portrait Bokeh, and boundary-diffusion Object Erase.</p>
    `
  },
  filters: {
    title: '20 Filters Catalogue',
    html: `
      <h4 class="manual-heading">Optical & Cinematic</h4>
      <div class="manual-filter-grid">
        <div class="manual-filter-item"><strong>Natural Blur:</strong> Smooth Gaussian-style optical defocus.</div>
        <div class="manual-filter-item"><strong>Heavy Bokeh:</strong> Deep cinematic portrait blur with creamy light circles.</div>
        <div class="manual-filter-item"><strong>Motion Blur:</strong> Horizontal camera sweep smear.</div>
        <div class="manual-filter-item"><strong>Brush Stroke:</strong> Painterly wet oil pigment smear with directional angle control.</div>
        <div class="manual-filter-item"><strong>Radial Zoom:</strong> High-energy optical burst blur radiating from center.</div>
        <div class="manual-filter-item"><strong>Chromatic Prism:</strong> Staggered RGB channel split for modern editorial censorship.</div>
      </div>

      <h4 class="manual-heading">Graphic, Retro & Texture</h4>
      <div class="manual-filter-grid">
        <div class="manual-filter-item"><strong>Square Mosaic:</strong> Classic pixelated censorship grid.</div>
        <div class="manual-filter-item"><strong>Hex Mosaic:</strong> Architectural honeycomb hexagon tessellation.</div>
        <div class="manual-filter-item"><strong>Frosted Glass:</strong> Textured matte bathroom privacy glass.</div>
        <div class="manual-filter-item"><strong>Glitch:</strong> Cyberpunk horizontal RGB drift and CRT scanlines.</div>
        <div class="manual-filter-item"><strong>ASCII Matrix:</strong> Glowing green retro monospace terminal characters.</div>
        <div class="manual-filter-item"><strong>Liquid Swirl:</strong> Hydrodynamic marble swirl that twists pixels like wet oil paint.</div>
        <div class="manual-filter-item"><strong>Reeded Glass:</strong> Vertical fluted privacy glass with light refraction caustics.</div>
        <div class="manual-filter-item"><strong>Halftone Dots:</strong> Vintage newspaper and comic printing plate dots.</div>
        <div class="manual-filter-item"><strong>Solid Blackout:</strong> Complete opaque redaction block.</div>
      </div>

      <h4 class="manual-heading">Artistic & Privacy Shield</h4>
      <div class="manual-filter-grid">
        <div class="manual-filter-item"><strong>Face Cloak:</strong> Micro-gradient adversarial noise that scrambles biometric facial recognition scrapers.</div>
        <div class="manual-filter-item"><strong>Pop Art:</strong> Andy Warhol / Lichtenstein quantized screenprint.</div>
        <div class="manual-filter-item"><strong>Color Split:</strong> CMYK vintage offset press misregistration.</div>
        <div class="manual-filter-item"><strong>Thermal Heat:</strong> 256-level false-color infrared heatmap.</div>
        <div class="manual-filter-item"><strong>Duotone:</strong> Graphic two-tone navy and coral risograph gradient.</div>
      </div>
    `
  },
  shortcuts: {
    title: 'Shortcuts & Gestures',
    html: `
      <h4 class="manual-heading">Touch Gestures (Mobile & Tablet)</h4>
      <ul class="manual-list">
        <li><strong>1-Finger Drag:</strong> Paint blur or drag censor boxes/ovals.</li>
        <li><strong>2-Finger Pinch:</strong> Zoom in and out of the photo seamlessly.</li>
        <li><strong>2-Finger Drag:</strong> Pan across the photo canvas.</li>
      </ul>

      <h4 class="manual-heading">Keyboard Shortcuts (Chromebook & Desktop)</h4>
      <div class="manual-shortcut-table">
        <div class="shortcut-row"><kbd>Space</kbd> <span>Hold to compare untouched original</span></div>
        <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>Z</kbd> <span>Undo last action</span></div>
        <div class="shortcut-row"><kbd>Ctrl</kbd> + <kbd>Y</kbd> <span>Redo last action</span></div>
        <div class="shortcut-row"><kbd>[</kbd> / <kbd>]</kbd> <span>Decrease / increase brush size</span></div>
        <div class="shortcut-row"><kbd>?</kbd> or <kbd>F1</kbd> <span>Open this User Manual</span></div>
        <div class="shortcut-row"><kbd>Esc</kbd> <span>Close active modal</span></div>
      </div>
    `
  }
};
