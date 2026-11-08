// Interactive viewport, high-DPI canvas management, dual-layer compositing, and loupe magnifier

import { FilterEngine } from './filters.js';
import { BrushEngine } from './brush-engine.js';
import { StickerEngine } from './stickers-engine.js';

export class CanvasEngine {
  constructor(containerElement) {
    this.container = containerElement;

    // Create interactive display canvas
    this.displayCanvas = document.createElement('canvas');
    this.displayCanvas.className = 'main-display-canvas';
    this.displayCtx = this.displayCanvas.getContext('2d');
    this.container.appendChild(this.displayCanvas);

    // Create floating Loupe / Magnifier element
    this.loupe = document.createElement('div');
    this.loupe.className = 'magnifier-loupe hidden';
    this.loupeCanvas = document.createElement('canvas');
    this.loupeCanvas.width = 140;
    this.loupeCanvas.height = 140;
    this.loupeCtx = this.loupeCanvas.getContext('2d');
    this.loupe.appendChild(this.loupeCanvas);
    this.container.appendChild(this.loupe);

    // Internal Full-Resolution Offscreen Buffers
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d');

    this.filteredCanvas = document.createElement('canvas');
    this.filteredCtx = this.filteredCanvas.getContext('2d');

    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d');

    this.artisticCanvas = document.createElement('canvas');
    this.artisticCtx = this.artisticCanvas.getContext('2d');

    // Engines
    this.brush = new BrushEngine(this.maskCanvas, this.artisticCanvas);
    this.stickers = new StickerEngine(this.displayCanvas);

    // Inspection & HUD flags
    this.loupeEnabled = true;
    this.showOriginalOnly = false;

    // Drawing Shape ('brush' | 'rect' | 'oval')
    this.drawShape = 'brush';
    this.shapeStart = null;
    this.shapeCurrent = null;

    // Viewport transform
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.minScale = 0.2;
    this.maxScale = 5.0;

    // Filter settings
    this.currentFilter = 'natural_blur'; // 'natural_blur' | 'heavy_blur' | 'mosaic' | 'hex_mosaic' | 'frosted' | 'motion' | 'brush_stroke' ...
    this.filterIntensity = 50;
    this.filterSize = 50;
    this.filterColor = '#000000';
    this.filterAngle = 0; // 0° Horizontal brush stroke smear

    // State & History
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 15;
    this.onHistoryChanged = null;

    // AI Preview Bounding Boxes
    this.aiPreviewBoxes = null;
    this.onAIBoxToggled = null;

    this.resetZoomBtn = document.getElementById('btn-reset-zoom');

    // Multi-touch / gesture state
    this.activePointers = new Map();
    this.prevPinchDist = 0;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this.initEvents();
  }

  loadImage(imageSource, onError = null) {
    const isDataOrBlob = typeof imageSource === 'string' && (imageSource.startsWith('data:') || imageSource.startsWith('blob:'));
    const tryLoad = (useCrossOrigin) => {
      const img = new Image();
      if (useCrossOrigin && !isDataOrBlob) {
        img.crossOrigin = 'anonymous';
      }
      img.onerror = (err) => {
        if (useCrossOrigin && !isDataOrBlob) {
          // Fallback: retry without crossOrigin header if server/browser blocked it
          tryLoad(false);
          return;
        }
        console.error('Failed to load image:', err);
        if (onError) onError(err);
      };
      img.onload = () => {
        let w = img.naturalWidth || img.width || 0;
        let h = img.naturalHeight || img.height || 0;

        if (w < 1 || h < 1) {
          if (onError) onError(new Error('Image has zero dimensions'));
          return;
        }

        // Guard against browser canvas crash on excessive resolutions (e.g. 50MP RAW photos)
        const maxDim = 3200;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        this.sourceCanvas.width = w;
        this.sourceCanvas.height = h;
        this.sourceCtx.drawImage(img, 0, 0, w, h);

        this.maskCanvas.width = w;
        this.maskCanvas.height = h;
        this.maskCtx.clearRect(0, 0, w, h);

        this.artisticCanvas.width = w;
        this.artisticCanvas.height = h;
        this.artisticCtx.clearRect(0, 0, w, h);

        this.stickers.clear();
        this.history = [];
        this.historyIndex = -1;

        // Fit image neatly inside viewport
        this.fitToScreen();
        this.updateFilteredLayer();
        this.saveHistoryState();
        this.render();
      };
      img.src = imageSource;
    };

    tryLoad(true);
  }

  fitToScreen() {
    const containerW = this.container.clientWidth || window.innerWidth;
    const containerH = this.container.clientHeight || window.innerHeight;
    const imgW = this.sourceCanvas.width;
    const imgH = this.sourceCanvas.height;

    if (!imgW || !imgH) return;

    const scaleX = (containerW - 40) / imgW;
    const scaleY = (containerH - 40) / imgH;
    this.scale = Math.min(scaleX, scaleY, 1.0);

    this.offsetX = (containerW - imgW * this.scale) / 2;
    this.offsetY = (containerH - imgH * this.scale) / 2;

    this.updateZoomIndicator();
    this.resizeDisplayCanvas();
  }

  updateZoomIndicator() {
    if (this.resetZoomBtn) {
      const pct = Math.round(this.scale * 100);
      this.resetZoomBtn.textContent = `${pct}% · Fit`;
    }
  }

  resizeDisplayCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.displayCanvas.width = w * dpr;
    this.displayCanvas.height = h * dpr;
    this.displayCanvas.style.width = `${w}px`;
    this.displayCanvas.style.height = `${h}px`;
    this.displayCtx.scale(dpr, dpr);
    this.render();
  }

  updateFilteredLayer() {
    if (!this.sourceCanvas.width) return;
    const filtered = FilterEngine.applyFilter(
      this.sourceCanvas,
      this.currentFilter,
      this.filterIntensity,
      this.filterSize,
      this.filterColor,
      this.filterAngle
    );
    this.filteredCanvas.width = filtered.width;
    this.filteredCanvas.height = filtered.height;
    this.filteredCtx.clearRect(0, 0, filtered.width, filtered.height);
    this.filteredCtx.drawImage(filtered, 0, 0);
    this.render();
  }

  setFilter(type, intensity = this.filterIntensity, size = this.filterSize, color = this.filterColor) {
    this.currentFilter = type;
    this.filterIntensity = intensity;
    this.filterSize = size;
    this.filterColor = color;
    this.updateFilteredLayer();
  }

  setFilterAngle(deg) {
    this.filterAngle = deg;
    this.updateFilteredLayer();
  }

  setDrawShape(shape) {
    this.drawShape = shape;
  }

  // Convert viewport screen coords to image buffer pixel coords
  screenToImageCoords(screenX, screenY) {
    const rect = this.displayCanvas.getBoundingClientRect();
    const x = (screenX - rect.left - this.offsetX) / this.scale;
    const y = (screenY - rect.top - this.offsetY) / this.scale;
    return { x, y };
  }

  imageToScreenCoords(imgX, imgY) {
    const rect = this.displayCanvas.getBoundingClientRect();
    return {
      x: rect.left + this.offsetX + imgX * this.scale,
      y: rect.top + this.offsetY + imgY * this.scale
    };
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.resizeDisplayCanvas();
    });

    const el = this.displayCanvas;

    // Pointer events (handles Mouse & Touch uniformly)
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    el.addEventListener('lostpointercapture', (e) => this.onPointerUp(e));
    window.addEventListener('blur', () => this.cancelAllGestures());

    // Mouse wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));

      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
      this.updateZoomIndicator();
      this.render();
    }, { passive: false });
  }

  onPointerDown(e) {
    if (this.displayCanvas.setPointerCapture) {
      try {
        this.displayCanvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two finger pinch/pan
    if (this.activePointers.size === 2) {
      // Cleanly end single-pointer stroke/interaction before starting pinch
      if (this.brush && this.brush.isDrawing) {
        this.brush.endStroke();
        this.hideLoupe();
      }
      if (this.stickers && this.stickers.activeAction) {
        this.stickers.endInteraction();
      }
      const [p1, p2] = Array.from(this.activePointers.values());
      this.prevPinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.isPanning = true;
      this.hideLoupe();
      return;
    }

    if (this.activePointers.size > 1) return;

    const imgPt = this.screenToImageCoords(e.clientX, e.clientY);

    // Check if clicking an AI preview bounding box to toggle inclusion/exclusion
    if (this.aiPreviewBoxes && this.aiPreviewBoxes.length > 0) {
      const hitBox = this.aiPreviewBoxes.find(b =>
        imgPt.x >= b.x && imgPt.x <= b.x + b.width &&
        imgPt.y >= b.y && imgPt.y <= b.y + b.height
      );
      if (hitBox) {
        hitBox.included = (hitBox.included === false) ? true : false;
        if (typeof this.onAIBoxToggled === 'function') {
          this.onAIBoxToggled(this.aiPreviewBoxes);
        }
        this.render();
        return;
      }
    }

    // Check if clicking sticker handle or body
    const hit = this.stickers.hitTest(imgPt.x, imgPt.y, this.scale);
    if (hit) {
      const isDelete = (hit.handle === 'delete');
      this.stickers.startInteraction(imgPt.x, imgPt.y, hit);
      if (isDelete) {
        this.saveHistoryState();
        if (typeof this.onStickerDeleted === 'function') {
          this.onStickerDeleted();
        }
      }
      this.render();
      return;
    } else {
      // Deselect sticker if clicking empty area while in non-sticker mode
      if (this.stickers.selectedSticker) {
        this.stickers.startInteraction(imgPt.x, imgPt.y, null);
        this.render();
      }
    }

    // Brush painting or shape dragging
    if (this.drawShape === 'brush') {
      this.brush.startStroke(imgPt.x, imgPt.y);
      this.showLoupe(e.clientX, e.clientY, imgPt.x, imgPt.y);
      this.render();
    } else {
      this.shapeStart = { x: imgPt.x, y: imgPt.y };
      this.shapeCurrent = { x: imgPt.x, y: imgPt.y };
      this.showLoupe(e.clientX, e.clientY, imgPt.x, imgPt.y);
      this.render();
    }
  }

  onPointerMove(e) {
    if (!this.activePointers.has(e.pointerId)) return;
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-finger pinch to zoom & pan
    if (this.activePointers.size === 2) {
      const [p1, p2] = Array.from(this.activePointers.values());
      const curDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (this.prevPinchDist > 0) {
        const factor = curDist / this.prevPinchDist;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));

        this.offsetX = midX - (midX - this.offsetX) * (newScale / this.scale);
        this.offsetY = midY - (midY - this.offsetY) * (newScale / this.scale);
        this.scale = newScale;
        this.updateZoomIndicator();
      }
      this.prevPinchDist = curDist;
      this.render();
      return;
    }

    const imgPt = this.screenToImageCoords(e.clientX, e.clientY);

    // Active sticker transform
    if (this.stickers.activeAction) {
      this.stickers.continueInteraction(imgPt.x, imgPt.y);
      this.render();
      return;
    }

    // Active brush stroke or shape dragging
    if (this.drawShape === 'brush') {
      if (this.brush.isDrawing) {
        this.brush.continueStroke(imgPt.x, imgPt.y);
        this.updateLoupe(e.clientX, e.clientY, imgPt.x, imgPt.y);
        this.render();
      }
    } else if (this.shapeStart) {
      this.shapeCurrent = { x: imgPt.x, y: imgPt.y };
      this.updateLoupe(e.clientX, e.clientY, imgPt.x, imgPt.y);
      this.render();
    }
  }

  onPointerUp(e) {
    if (this.displayCanvas.hasPointerCapture && this.displayCanvas.hasPointerCapture(e.pointerId)) {
      try {
        this.displayCanvas.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.delete(e.pointerId);
    }

    // Reset multi-touch pinch/pan state when dropping below 2 fingers
    if (this.activePointers.size < 2) {
      this.prevPinchDist = 0;
      this.isPanning = false;
    }

    if (this.stickers && this.stickers.activeAction) {
      this.stickers.endInteraction();
      this.saveHistoryState();
      this.render();
      return;
    }

    if (this.drawShape === 'brush') {
      if (this.brush && this.brush.isDrawing) {
        this.brush.endStroke();
        this.hideLoupe();
        this.saveHistoryState();
        this.render();
      }
    } else if (this.shapeStart && this.shapeCurrent) {
      this.commitShape(this.shapeStart, this.shapeCurrent, this.drawShape);
      this.shapeStart = null;
      this.shapeCurrent = null;
      this.hideLoupe();
      this.saveHistoryState();
      this.render();
    }
  }

  cancelAllGestures() {
    this.activePointers.clear();
    this.prevPinchDist = 0;
    this.isPanning = false;
    this.shapeStart = null;
    this.shapeCurrent = null;
    if (this.stickers && this.stickers.activeAction) {
      this.stickers.endInteraction();
    }
    if (this.brush && this.brush.isDrawing) {
      this.brush.endStroke();
      this.hideLoupe();
    }
    this.render();
  }

  commitShape(start, end, shape) {
    const isEraser = this.brush.isEraser;
    const isArtistic = this.brush.activeLayer === 'artistic';
    const targetCtx = isArtistic ? this.artisticCtx : this.maskCtx;

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    if (w < 2 && h < 2) return;

    targetCtx.save();
    if (isEraser) {
      targetCtx.globalCompositeOperation = 'destination-out';
      targetCtx.fillStyle = '#ffffff';
    } else {
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.fillStyle = isArtistic ? this.brush.color : '#ffffff';
    }

    if (shape === 'rect') {
      targetCtx.fillRect(minX, minY, w, h);
    } else if (shape === 'oval') {
      const rx = w / 2;
      const ry = h / 2;
      const cx = minX + rx;
      const cy = minY + ry;
      targetCtx.beginPath();
      targetCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      targetCtx.fill();
    }

    targetCtx.restore();
  }

  drawShapePreview(ctx) {
    if (!this.shapeStart || !this.shapeCurrent) return;
    const minX = Math.min(this.shapeStart.x, this.shapeCurrent.x);
    const minY = Math.min(this.shapeStart.y, this.shapeCurrent.y);
    const w = Math.abs(this.shapeCurrent.x - this.shapeStart.x);
    const h = Math.abs(this.shapeCurrent.y - this.shapeStart.y);

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, 1.5 / this.scale);
    ctx.setLineDash([6 / this.scale, 4 / this.scale]);
    ctx.fillStyle = this.brush.isEraser ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.25)';

    if (this.drawShape === 'rect') {
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeRect(minX, minY, w, h);
    } else if (this.drawShape === 'oval') {
      const rx = w / 2;
      const ry = h / 2;
      const cx = minX + rx;
      const cy = minY + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  showLoupe(screenX, screenY, imgX, imgY) {
    if (!this.loupeEnabled) return;
    this.loupe.classList.remove('hidden');
    this.updateLoupe(screenX, screenY, imgX, imgY);
  }

  updateLoupe(screenX, screenY, imgX, imgY) {
    if (!this.loupeEnabled) return;
    const loupeRadius = 70;
    const rect = this.container.getBoundingClientRect();
    const relX = screenX - rect.left;
    const relY = screenY - rect.top;

    // Position loupe 90px above contact point; if near top boundary, flip below
    let topY = relY - loupeRadius - 80;
    if (topY < 12) {
      topY = relY + loupeRadius + 30;
    }
    const leftX = Math.max(12, Math.min(rect.width - loupeRadius * 2 - 12, relX - loupeRadius));

    this.loupe.style.left = `${leftX}px`;
    this.loupe.style.top = `${topY}px`;

    // Render 2.5x zoomed content into loupe canvas
    const lCtx = this.loupeCtx;
    const lW = 140;
    const lH = 140;
    const zoom = 2.5;

    lCtx.save();
    lCtx.clearRect(0, 0, lW, lH);

    // Circular clip with subtle border
    lCtx.beginPath();
    lCtx.arc(lW / 2, lH / 2, loupeRadius - 2, 0, Math.PI * 2);
    lCtx.clip();

    // Fill with neutral background
    lCtx.fillStyle = '#18181b';
    lCtx.fillRect(0, 0, lW, lH);

    // Center zoomed target
    lCtx.translate(lW / 2, lH / 2);
    lCtx.scale(zoom, zoom);
    lCtx.translate(-imgX, -imgY);

    // Draw composited content at full resolution
    this.drawCompositedToContext(lCtx);

    lCtx.restore();

    // Draw precision crosshair and brush indicator
    lCtx.save();
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    lCtx.lineWidth = 1;
    lCtx.beginPath();
    lCtx.moveTo(lW / 2 - 10, lH / 2);
    lCtx.lineTo(lW / 2 + 10, lH / 2);
    lCtx.moveTo(lW / 2, lH / 2 - 10);
    lCtx.lineTo(lW / 2, lH / 2 + 10);
    lCtx.stroke();

    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    lCtx.lineWidth = 1.5;
    lCtx.beginPath();
    lCtx.arc(lW / 2, lH / 2, Math.max(4, (this.brush.size * zoom) / 2), 0, Math.PI * 2);
    lCtx.stroke();
    lCtx.restore();
  }

  hideLoupe() {
    this.loupe.classList.add('hidden');
  }

  // --- RENDERING PIPELINE ---
  render() {
    const ctx = this.displayCtx;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    ctx.clearRect(0, 0, w, h);

    if (!this.sourceCanvas.width) return;

    ctx.save();
    // Apply pan & zoom
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Checkerboard backdrop behind transparent/padded areas
    this.drawCheckerboard(ctx, this.sourceCanvas.width, this.sourceCanvas.height);

    // Render composited photo layers
    this.drawCompositedToContext(ctx);

    if (!this.showOriginalOnly) {
      // Render interactive stickers & handles
      this.stickers.render(ctx, true);

      // Render non-destructive AI detection preview bounding boxes if active
      if (this.aiPreviewBoxes && this.aiPreviewBoxes.length > 0) {
        this.drawAIPreviewBoxes(ctx);
      }

      // Render interactive shape dragging preview
      if (this.shapeStart && this.shapeCurrent) {
        this.drawShapePreview(ctx);
      }
    }

    ctx.restore();
  }

  drawAIPreviewBoxes(ctx) {
    ctx.save();
    for (const b of this.aiPreviewBoxes) {
      const isIncluded = b.included !== false;

      ctx.save();
      if (isIncluded) {
        ctx.strokeStyle = '#0071e3';
        ctx.lineWidth = Math.max(2, 2 / this.scale);
        ctx.setLineDash([6 / this.scale, 4 / this.scale]);
        ctx.fillStyle = 'rgba(0, 113, 227, 0.16)';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Corner accent markers
        const cornerSize = Math.max(6, 6 / this.scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - 1, b.y - 1, cornerSize, 2 / this.scale);
        ctx.fillRect(b.x - 1, b.y - 1, 2 / this.scale, cornerSize);
        ctx.fillRect(b.x + b.width - cornerSize + 1, b.y - 1, cornerSize, 2 / this.scale);
        ctx.fillRect(b.x + b.width - 1, b.y - 1, 2 / this.scale, cornerSize);
      } else {
        // Excluded box (muted outline and subtle strike)
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = Math.max(1.5, 1.5 / this.scale);
        ctx.setLineDash([4 / this.scale, 4 / this.scale]);
        ctx.fillStyle = 'rgba(24, 24, 27, 0.4)';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeRect(b.x, b.y, b.width, b.height);

        // Strike through
        ctx.beginPath();
        ctx.moveTo(b.x + 4 / this.scale, b.y + 4 / this.scale);
        ctx.lineTo(b.x + b.width - 4 / this.scale, b.y + b.height - 4 / this.scale);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  setAIPreviewBoxes(boxes) {
    this.aiPreviewBoxes = boxes.map(b => ({
      ...b,
      included: true
    }));
    this.render();
  }

  clearAIPreviewBoxes() {
    this.aiPreviewBoxes = null;
    this.render();
  }

  drawCheckerboard(ctx, w, h) {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, h);
  }

  drawCompositedToContext(targetCtx) {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;

    // 1. Draw Original Base Photo
    targetCtx.drawImage(this.sourceCanvas, 0, 0);

    // If in Hold-to-Compare mode, only the pristine base photo is drawn
    if (this.showOriginalOnly) {
      return;
    }

    // 2. Draw Filtered Layer masked by Alpha Mask
    // Use an offscreen buffer to apply the mask cleanly
    if (!this._compBuffer) {
      this._compBuffer = document.createElement('canvas');
      this._compCtx = this._compBuffer.getContext('2d');
    }
    const buf = this._compBuffer;
    const bCtx = this._compCtx;

    if (buf.width !== w || buf.height !== h) {
      buf.width = w;
      buf.height = h;
    }

    bCtx.clearRect(0, 0, w, h);
    bCtx.drawImage(this.filteredCanvas, 0, 0);
    bCtx.globalCompositeOperation = 'destination-in';
    bCtx.drawImage(this.maskCanvas, 0, 0);
    bCtx.globalCompositeOperation = 'source-over';

    // Draw masked filter over base
    targetCtx.drawImage(buf, 0, 0);

    // 3. Draw Artistic Overlay Layer (paint strokes, chalk, glitter)
    targetCtx.drawImage(this.artisticCanvas, 0, 0);
  }

  // --- UNDO / REDO HISTORY ---
  saveHistoryState() {
    // Truncate redo states
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;

    // Save mask image data, artistic image data, and clone stickers
    const maskData = this.maskCtx.getImageData(0, 0, w, h);
    const artisticData = this.artisticCtx.getImageData(0, 0, w, h);
    const stickersData = this.stickers.stickers.map(s => ({
      ...s
    }));

    this.history.push({ maskData, artisticData, stickersData });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
    this.notifyHistoryChanged();
  }

  notifyHistoryChanged() {
    if (typeof this.onHistoryChanged === 'function') {
      this.onHistoryChanged({
        canUndo: this.historyIndex > 0,
        canRedo: this.historyIndex < this.history.length - 1
      });
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreHistoryState(this.history[this.historyIndex]);
      this.render();
      this.notifyHistoryChanged();
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreHistoryState(this.history[this.historyIndex]);
      this.render();
      this.notifyHistoryChanged();
      return true;
    }
    return false;
  }

  restoreHistoryState(state) {
    if (!state) return;
    this.maskCtx.putImageData(state.maskData, 0, 0);
    this.artisticCtx.putImageData(state.artisticData, 0, 0);
    this.stickers.stickers = state.stickersData.map(s => ({ ...s }));
    this.stickers.selectedSticker = null;
  }

  resetAll() {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    this.maskCtx.clearRect(0, 0, w, h);
    this.artisticCtx.clearRect(0, 0, w, h);
    this.stickers.clear();
    this.saveHistoryState();
    this.render();
  }

  invertMask() {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    if (!w || !h) return;
    const imgData = this.maskCtx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const invA = 255 - data[i + 3];
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = invA;
    }
    this.maskCtx.putImageData(imgData, 0, 0);
    this.saveHistoryState();
    this.render();
  }

  // --- FULL RESOLUTION EXPORT ---
  exportHighRes(format = 'image/jpeg', quality = 0.95) {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    if (!w || !h) {
      throw new Error('No image loaded to export');
    }
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const eCtx = exportCanvas.getContext('2d');

    // Draw composited photo layers
    this.drawCompositedToContext(eCtx);

    // Draw stickers without handles
    this.stickers.render(eCtx, false);

    return exportCanvas.toDataURL(format, quality);
  }
}
