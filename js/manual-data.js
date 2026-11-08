// Structured documentation content for the in-app User Manual
// Reduced to 3 concise, honest sections: Start, Tools, and Shortcuts

export const MANUAL_DATA = {
  start: {
    title: 'Getting Started & Privacy',
    html: `
      <div class="manual-callout" style="border-left: 3px solid #10b981; background: rgba(16, 185, 129, 0.08); margin-bottom: 12px;">
        <strong>100% On-Device Privacy:</strong> Photos stay in browser memory. Nothing is ever uploaded or stored. Exports are redrawn on a clean canvas, so device EXIF metadata and GPS coordinates are dropped.
      </div>

      <h4 class="manual-heading">4-Step Workflow</h4>
      <ol class="manual-list">
        <li><strong>Open Photo:</strong> Tap <em>Open</em> or drag and drop an image up to 50MB.</li>
        <li><strong>Select Tool & Shape:</strong> Choose a mode (Blur, Artistic, Stickers, Auto Detect) and shape (Brush, Box, Oval).</li>
        <li><strong>Apply Redaction:</strong> Draw directly over sensitive areas, or hold <em>Original</em> (or Spacebar) to compare.</li>
        <li><strong>Save:</strong> Tap <em>Save</em> to export as PNG (lossless), WebP, or JPEG.</li>
      </ol>

      <div class="manual-callout" style="border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.08); margin: 12px 0;">
        <strong>Tip for Highly Sensitive Data:</strong> Blurs and mosaics can theoretically be reconstructed. Use <strong>Solid Blackout</strong> to permanently destroy sensitive text, ID numbers, or faces.
      </div>

      <h4 class="manual-heading">Install as Offline App (PWA)</h4>
      <p class="manual-p">On Chrome or Edge, click <strong>Install</strong> in the address bar. On iOS Safari, tap <strong>Share &rarr; Add to Home Screen</strong>. Runs 100% offline with zero server requirements.</p>
    `
  },
  modes: {
    title: 'Studio Tools & Recipes',
    html: `
      <h4 class="manual-heading">The 4 Studio Modes</h4>
      <ul class="manual-list">
        <li><strong>Blur:</strong> Dual-layer alpha masking across 20 optical, geometric, and distortion filter styles (Natural Blur, Mosaic, Film Grain, Reeded Glass, etc.).</li>
        <li><strong>Artistic:</strong> Tactile textured brushes (Skin swatches, Chalk, Oil knife, Crayon, Glitter, Splatter).</li>
        <li><strong>Stickers:</strong> 18 scalable vector disguise and censor stamps with 360&deg; rotate, scale, and opacity.</li>
        <li><strong>Auto Detect:</strong> Client-side heuristic tools for rough face bounding, finding text-like areas, center focus blur, and object erase.</li>
      </ul>

      <h4 class="manual-heading" style="margin-top: 14px;">Quick Recipes</h4>
      <ul class="manual-list">
        <li><strong>Invert Spotlight (Background Blur):</strong> Paint over your main subject, then tap <strong>Invert</strong> to keep the subject sharp while blurring the background.</li>
        <li><strong>Center Focus:</strong> In Auto Detect mode, tap <strong>Center Focus</strong> to apply a fixed feathered center ellipse blur.</li>
        <li><strong>Auto Redact:</strong> In Auto Detect mode, tap <strong>Scan Faces</strong> or <strong>Scan Text</strong>, review or toggle the highlighted boxes, and tap <strong>Apply Blur</strong>.</li>
      </ul>

      <div class="manual-callout" style="border-left: 3px solid #64748b; background: rgba(100, 116, 139, 0.08); margin-top: 12px;">
        <strong>Experimental Heuristics:</strong> Automatic detection runs on-device using color and edge heuristics. It is a rough assistant&mdash;always verify every suggested box before saving.
      </div>
    `
  },
  shortcuts: {
    title: 'Touch Gestures & Keyboard Shortcuts',
    html: `
      <h4 class="manual-heading">Touch & Mouse Gestures</h4>
      <ul class="manual-list">
        <li><strong>1-Finger Drag:</strong> Paint blur mask or drag censor box/oval.</li>
        <li><strong>2-Finger Pinch / Wheel:</strong> Zoom in and out freely.</li>
        <li><strong>2-Finger Drag / Middle Click:</strong> Pan across zoomed photo.</li>
        <li><strong>Tap Sticker:</strong> Select to drag, rotate (top pin), scale (bottom pin), or adjust opacity.</li>
      </ul>

      <h4 class="manual-heading" style="margin-top: 14px;">Keyboard Shortcuts</h4>
      <ul class="manual-list">
        <li><kbd>Space</kbd> (Hold): Hold to view untouched original photo.</li>
        <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd>: Undo last stroke or sticker action.</li>
        <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>: Redo last action.</li>
        <li><kbd>[</kbd> / <kbd>]</kbd>: Decrease or increase brush diameter by 5px.</li>
        <li><kbd>Delete</kbd> / <kbd>Backspace</kbd>: Delete currently selected sticker.</li>
        <li><kbd>Enter</kbd>: Commit pending detection preview blur.</li>
        <li><kbd>Escape</kbd>: Dismiss detection preview or close dialogs.</li>
        <li><kbd>?</kbd> / <kbd>F1</kbd>: Open this guide.</li>
      </ul>
    `
  }
};
