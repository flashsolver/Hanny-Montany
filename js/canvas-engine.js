// Interactive viewport, high-DPI canvas management, and dual-layer compositing

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

    // Internal Full-Resolution Offscreen Buffers
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d');

    // Pristine original image buffer (preserves untouched photo across object erasures)
    this.originalCanvas = document.createElement('canvas');
    this.originalCtx = this.originalCanvas.getContext('2d');
    this._sourceWasModified = false;
    this._lastSourceData = null;

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
    this.isUserTransformed = false;

    // Filter settings
    this.currentFilter = 'natural_blur';
    this.filterIntensity = 50;
    this.filterSize = 50;
    this.filterColor = '#000000';
    this.filterAngle = 0;

    // State & History (~150MB dynamic memory budget)
    this.history = [];
    this.historyIndex = -1;
    this.maxHistoryBytes = 150 * 1024 * 1024;
    this.maxHistoryItems = 30;
    this.onHistoryChanged = null;

    // AI Preview Bounding Boxes
    this.aiPreviewBoxes = null;
    this.onAIBoxToggled = null;

    // Interaction state
    this.activePointers = new Map();
    this.isPanning = false;
    this.prevPinchDist = 0;
    this.panStart = { x: 0, y: 0 };

    this.initEvents();
  }

  loadImage(imageSource, onError = null, onDownscaled = null) {
    return new Promise((resolve, reject) => {
      const isDataOrBlob = typeof imageSource === 'string' && (imageSource.startsWith('data:') || imageSource.startsWith('blob:'));
      const tryLoad = (useCrossOrigin) => {
        const img = new Image();
        if (useCrossOrigin && !isDataOrBlob) {
          img.crossOrigin = 'anonymous';
        }
        img.onerror = (err) => {
          if (useCrossOrigin && !isDataOrBlob) {
            tryLoad(false);
            return;
          }
          console.error('Failed to load image:', err);
          if (onError) onError(err);
          reject(err);
        };
        img.onload = () => {
          let w = img.naturalWidth || img.width || 0;
          let h = img.naturalHeight || img.height || 0;

          if (w < 1 || h < 1) {
            const err = new Error('Image has zero dimensions');
            if (onError) onError(err);
            reject(err);
            return;
          }

          const origW = w;
          const origH = h;
          let wasDownscaled = false;

          const maxDim = 3200;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
            wasDownscaled = true;
          }

          this.sourceCanvas.width = w;
          this.sourceCanvas.height = h;
          this.sourceCtx.drawImage(img, 0, 0, w, h);

          this.originalCanvas.width = w;
          this.originalCanvas.height = h;
          this.originalCtx.drawImage(this.sourceCanvas, 0, 0);
          this._sourceWasModified = false;
          this._lastSourceData = null;

          this.maskCanvas.width = w;
          this.maskCanvas.height = h;
          this.maskCtx.clearRect(0, 0, w, h);

          this.artisticCanvas.width = w;
          this.artisticCanvas.height = h;
          this.artisticCtx.clearRect(0, 0, w, h);

          this.stickers.clear();
          this.history = [];
          this.historyIndex = -1;

          this.fitToScreen();
          this.updateFilteredLayer();
          this.saveHistoryState();
          this.render();

          // Settle check: re-fit once layout has settled
          requestAnimationFrame(() => {
            if (!this.isUserTransformed) {
              this.fitToScreen();
            }
          });
          setTimeout(() => {
            if (!this.isUserTransformed) {
              this.fitToScreen();
            }
          }, 60);
          setTimeout(() => {
            if (!this.isUserTransformed) {
              this.fitToScreen();
            }
          }, 250);

          if (wasDownscaled && typeof onDownscaled === 'function') {
            onDownscaled(origW, origH, w, h);
          }
          resolve();
        };
        img.src = imageSource;
      };

      tryLoad(true);
    });
  }

  loadImageBitmap(bitmap, onDownscaled = null) {
    let w = bitmap.width;
    let h = bitmap.height;
    if (w < 1 || h < 1) return;

    const origW = w;
    const origH = h;
    let wasDownscaled = false;
    const maxDim = 3200;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      wasDownscaled = true;
    }

    this.sourceCanvas.width = w;
    this.sourceCanvas.height = h;
    this.sourceCtx.drawImage(bitmap, 0, 0, w, h);

    this.originalCanvas.width = w;
    this.originalCanvas.height = h;
    this.originalCtx.drawImage(this.sourceCanvas, 0, 0);
    this._sourceWasModified = false;
    this._lastSourceData = null;

    this.maskCanvas.width = w;
    this.maskCanvas.height = h;
    this.maskCtx.clearRect(0, 0, w, h);

    this.artisticCanvas.width = w;
    this.artisticCanvas.height = h;
    this.artisticCtx.clearRect(0, 0, w, h);

    this.stickers.clear();
    this.history = [];
    this.historyIndex = -1;

    this.fitToScreen();
    this.updateFilteredLayer();
    this.saveHistoryState();
    this.render();

    requestAnimationFrame(() => {
      if (!this.isUserTransformed) {
        this.fitToScreen();
      }
    });

    if (wasDownscaled && typeof onDownscaled === 'function') {
      onDownscaled(origW, origH, w, h);
    }
  }

  fitToScreen() {
    const rect = this.container.getBoundingClientRect();
    const cw = Math.round(rect.width) || this.container.clientWidth;
    const ch = Math.round(rect.height) || this.container.clientHeight;
    const imgW = this.sourceCanvas.width;
    const imgH = this.sourceCanvas.height;

    if (!imgW || !imgH || !cw || !ch) return;

    const pad = 24;
    const availW = Math.max(10, cw - pad * 2);
    const availH = Math.max(10, ch - pad * 2);

    const scaleX = availW / imgW;
    const scaleY = availH / imgH;
    this.scale = Math.min(scaleX, scaleY, 1.0);

    this.offsetX = Math.round((cw - imgW * this.scale) / 2);
    this.offsetY = Math.round((ch - imgH * this.scale) / 2);
    this.isUserTransformed = false;

    this.render();
  }

  screenToImageCoords(screenX, screenY) {
    const rect = this.container.getBoundingClientRect();
    const localX = screenX - rect.left - this.offsetX;
    const localY = screenY - rect.top - this.offsetY;
    return {
      x: localX / this.scale,
      y: localY / this.scale
    };
  }

  imageToScreenCoords(imgX, imgY) {
    const rect = this.container.getBoundingClientRect();
    return {
      x: imgX * this.scale + this.offsetX + rect.left,
      y: imgY * this.scale + this.offsetY + rect.top
    };
  }

  setFilter(name, intensity = 50, size = 50, color = null, angle = null) {
    this.currentFilter = name;
    this.filterIntensity = intensity;
    this.filterSize = size;
    if (color !== null) this.filterColor = color;
    if (angle !== null) this.filterAngle = angle;
    this.updateFilteredLayer();
    this.render();
  }

  updateFilteredLayer() {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    if (!w || !h) return;

    if (this.filteredCanvas.width !== w || this.filteredCanvas.height !== h) {
      this.filteredCanvas.width = w;
      this.filteredCanvas.height = h;
    }

    FilterEngine.applyFilter(
      this.sourceCanvas,
      this.filteredCanvas,
      this.currentFilter,
      this.filterIntensity,
      this.filterSize,
      this.filterColor,
      this.filterAngle
    );
  }

  setShape(shape) {
    this.drawShape = shape;
  }

  setDrawShape(shape) {
    this.setShape(shape);
  }

  setFilterAngle(angle) {
    this.filterAngle = angle;
    this.updateFilteredLayer();
    this.render();
  }

  initEvents() {
    const c = this.displayCanvas;

    c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    c.addEventListener('pointermove', (e) => this.onPointerMove(e));
    c.addEventListener('pointerup', (e) => this.onPointerUp(e));
    c.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    c.addEventListener('lostpointercapture', () => this.cancelAllGestures());
    window.addEventListener('blur', () => this.cancelAllGestures());

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * zoomFactor));
      if (newScale === this.scale) return;

      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
      this.scale = newScale;
      this.isUserTransformed = true;

      this.render();
    }, { passive: false });

    c.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    const handleResize = () => {
      if (!this.isUserTransformed) {
        this.fitToScreen();
      } else {
        this.render();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  onPointerDown(e) {
    if (this.displayCanvas.setPointerCapture) {
      try {
        this.displayCanvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Middle-click pan or Spacebar pan
    if (e.button === 1 || e.buttons === 4 || e.altKey) {
      this.isPanning = true;
      this.isUserTransformed = true;
      this.panStart = { x: e.clientX - this.offsetX, y: e.clientY - this.offsetY };
      return;
    }

    // Two finger pinch/pan
    if (this.activePointers.size === 2) {
      this.isUserTransformed = true;
      if (this.brush && this.brush.isDrawing) {
        this.brush.endStroke();
      }
      if (this.stickers && this.stickers.activeAction) {
        this.stickers.endInteraction();
      }
      const [p1, p2] = Array.from(this.activePointers.values());
      this.prevPinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.isPanning = true;
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

    // Sticker interaction hit testing
    if (this.stickers && this.stickers.stickers.length > 0) {
      const hit = this.stickers.handlePointerDown(imgPt.x, imgPt.y, this.scale);
      if (hit) {
        this.render();
        return;
      }
    }

    // Brush painting or shape dragging
    if (this.drawShape === 'brush') {
      this.brush.startStroke(imgPt.x, imgPt.y);
      this.render();
    } else {
      this.shapeStart = { x: imgPt.x, y: imgPt.y };
      this.shapeCurrent = { x: imgPt.x, y: imgPt.y };
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
        const rect = this.container.getBoundingClientRect();
        const lX = midX - rect.left;
        const lY = midY - rect.top;

        const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
        this.offsetX = lX - (lX - this.offsetX) * (newScale / this.scale);
        this.offsetY = lY - (lY - this.offsetY) * (newScale / this.scale);
        this.scale = newScale;
        this.render();
      }
      this.prevPinchDist = curDist;
      return;
    }

    if (this.isPanning) {
      this.offsetX = e.clientX - this.panStart.x;
      this.offsetY = e.clientY - this.panStart.y;
      this.render();
      return;
    }

    const imgPt = this.screenToImageCoords(e.clientX, e.clientY);

    // Active sticker transform
    if (this.stickers && this.stickers.activeAction) {
      this.stickers.continueInteraction(imgPt.x, imgPt.y);
      this.render();
      return;
    }

    // Active brush stroke or shape dragging
    if (this.drawShape === 'brush') {
      if (this.brush.isDrawing) {
        this.brush.continueStroke(imgPt.x, imgPt.y);
        this.render();
      }
    } else if (this.shapeStart) {
      this.shapeCurrent = { x: imgPt.x, y: imgPt.y };
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
        this.saveHistoryState();
        this.render();
      }
    } else if (this.shapeStart && this.shapeCurrent) {
      this.commitShape(this.shapeStart, this.shapeCurrent, this.drawShape);
      this.shapeStart = null;
      this.shapeCurrent = null;
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
    }
    this.render();
  }

  commitShape(start, end, shape) {
    const isEraser = this.brush.isEraser;
    const isArtistic = (typeof this.brush.isArtistic === 'function')
      ? this.brush.isArtistic()
      : ['chalk', 'oil', 'multitone', 'crayon', 'glitter', 'splatter'].includes(this.brush.brushType);
    const targetCtx = isArtistic ? this.artisticCtx : this.maskCtx;

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    if (w < 2 && h < 2) return;

    if (isEraser) {
      this.maskCtx.save();
      this.maskCtx.globalCompositeOperation = 'destination-out';
      this.maskCtx.fillStyle = 'rgba(0,0,0,1)';
      this.maskCtx.beginPath();
      if (shape === 'rect') {
        this.maskCtx.rect(minX, minY, w, h);
      } else if (shape === 'oval') {
        this.maskCtx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      }
      this.maskCtx.fill();
      this.maskCtx.restore();

      if (this.artisticCtx) {
        this.artisticCtx.save();
        this.artisticCtx.globalCompositeOperation = 'destination-out';
        this.artisticCtx.fillStyle = 'rgba(0,0,0,1)';
        this.artisticCtx.beginPath();
        if (shape === 'rect') {
          this.artisticCtx.rect(minX, minY, w, h);
        } else if (shape === 'oval') {
          this.artisticCtx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        }
        this.artisticCtx.fill();
        this.artisticCtx.restore();
      }
      return;
    }

    targetCtx.save();
    if (isArtistic) {
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.fillStyle = this.brush.color;
    } else {
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.fillStyle = 'rgba(255,255,255,1)';
    }

    targetCtx.beginPath();
    if (shape === 'rect') {
      targetCtx.rect(minX, minY, w, h);
    } else if (shape === 'oval') {
      targetCtx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    }
    targetCtx.fill();
    targetCtx.restore();
  }

  drawShapePreview(ctx) {
    if (!this.shapeStart || !this.shapeCurrent || this.drawShape === 'brush') return;

    const p1 = this.imageToScreenCoords(this.shapeStart.x, this.shapeStart.y);
    const p2 = this.imageToScreenCoords(this.shapeCurrent.x, this.shapeCurrent.y);

    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

    ctx.beginPath();
    if (this.drawShape === 'rect') {
      ctx.rect(minX, minY, w, h);
    } else if (this.drawShape === 'oval') {
      ctx.ellipse(minX + w / 2, minY + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- RENDERING PIPELINE ---
  render() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.round(rect.width) || this.container.clientWidth;
    const h = Math.round(rect.height) || this.container.clientHeight;

    if (!w || !h) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (this.displayCanvas.width !== targetW || this.displayCanvas.height !== targetH) {
      this.displayCanvas.width = targetW;
      this.displayCanvas.height = targetH;

      // Automatically re-center whenever the viewport dimensions change (e.g. mobile layout settle, rotation)
      if (!this.isUserTransformed && this.sourceCanvas.width && this.sourceCanvas.height) {
        const pad = 24;
        const availW = Math.max(10, w - pad * 2);
        const availH = Math.max(10, h - pad * 2);
        const scaleX = availW / this.sourceCanvas.width;
        const scaleY = availH / this.sourceCanvas.height;
        this.scale = Math.min(scaleX, scaleY, 1.0);
        this.offsetX = Math.round((w - this.sourceCanvas.width * this.scale) / 2);
        this.offsetY = Math.round((h - this.sourceCanvas.height * this.scale) / 2);
      }
    }

    const ctx = this.displayCtx;
    ctx.save();
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.scale(dpr, dpr);

    // Draw dark workspace checkerboard background
    this.drawCheckerboard(ctx, w, h);

    if (this.sourceCanvas.width && this.sourceCanvas.height) {
      // Apply viewport transform (pan & zoom)
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);

      // Render composited photo layers
      this.drawCompositedToContext(ctx);

      // Draw stickers and active transformation handles
      if (this.stickers && !this.showOriginalOnly) {
        this.stickers.render(ctx, true);
      }
    }

    ctx.restore();

    // Draw active shape selection preview (on top of viewport transform)
    if (this.shapeStart && this.shapeCurrent) {
      ctx.save();
      ctx.scale(dpr, dpr);
      this.drawShapePreview(ctx);
      ctx.restore();
    }

    // Draw AI bounding box detection previews
    if (this.aiPreviewBoxes && this.aiPreviewBoxes.length > 0 && !this.showOriginalOnly) {
      ctx.save();
      ctx.scale(dpr, dpr);
      this.drawAIPreviewBoxes(ctx);
      ctx.restore();
    }
  }

  drawAIPreviewBoxes(ctx) {
    for (const b of this.aiPreviewBoxes) {
      const p1 = this.imageToScreenCoords(b.x, b.y);
      const w = b.width * this.scale;
      const h = b.height * this.scale;
      const isIncluded = (b.included !== false);

      ctx.save();
      if (isIncluded) {
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#64748b';
        ctx.fillStyle = 'rgba(100, 116, 139, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
      }

      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(p1.x, p1.y, w, h, 6);
      } else {
        ctx.rect(p1.x, p1.y, w, h);
      }
      ctx.fill();
      ctx.stroke();

      // Checkmark or cross badge in upper-left corner
      const badgeR = 9;
      const badgeX = p1.x + badgeR + 3;
      const badgeY = p1.y + badgeR + 3;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = isIncluded ? '#10b981' : '#475569';
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      if (isIncluded) {
        ctx.moveTo(badgeX - 4, badgeY);
        ctx.lineTo(badgeX - 1, badgeY + 3);
        ctx.lineTo(badgeX + 4, badgeY - 3);
      } else {
        ctx.moveTo(badgeX - 3, badgeY - 3);
        ctx.lineTo(badgeX + 3, badgeY + 3);
        ctx.moveTo(badgeX + 3, badgeY - 3);
        ctx.lineTo(badgeX - 3, badgeY + 3);
      }
      ctx.stroke();

      ctx.restore();
    }
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

    // If in Hold-to-Compare mode, only the pristine base photo is drawn
    if (this.showOriginalOnly) {
      targetCtx.drawImage(this.originalCanvas || this.sourceCanvas, 0, 0);
      return;
    }

    // 1. Draw Current Base Photo (including any inpainted areas)
    targetCtx.drawImage(this.sourceCanvas, 0, 0);

    // 2. Draw Filtered Layer masked by Alpha Mask
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
  saveHistoryState(options = {}) {
    // Truncate redo states
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    if (!w || !h) return;

    // Save mask image data, artistic image data, and clone stickers
    const maskData = this.maskCtx.getImageData(0, 0, w, h);
    const artisticData = this.artisticCtx.getImageData(0, 0, w, h);
    const stickersData = this.stickers.stickers.map(s => ({
      ...s
    }));

    let sourceData = null;
    let sourceIsShared = false;

    if (options.sourceModified) {
      sourceData = this.sourceCtx.getImageData(0, 0, w, h);
      this._lastSourceData = sourceData;
      this._sourceWasModified = true;
    } else if (this._lastSourceData) {
      sourceData = this._lastSourceData;
      sourceIsShared = true;
    }

    const state = {
      maskData,
      artisticData,
      stickersData,
      sourceData,
      sourceIsShared
    };

    // Calculate dynamic byte footprint for memory budget
    let byteSize = maskData.data.byteLength + artisticData.data.byteLength;
    if (sourceData && !sourceIsShared) {
      byteSize += sourceData.data.byteLength;
    }
    state.byteSize = byteSize;

    this.history.push(state);

    // Evict oldest states when exceeding 150MB byte budget or item limit
    const calcTotalBytes = () => this.history.reduce((acc, s) => acc + (s.byteSize || 0), 0);

    while (this.history.length > 1 && (calcTotalBytes() > this.maxHistoryBytes || this.history.length > this.maxHistoryItems)) {
      this.history.shift();
      if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    }

    this.historyIndex = this.history.length - 1;
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

    if (state.sourceData) {
      this.sourceCtx.putImageData(state.sourceData, 0, 0);
      this.updateFilteredLayer();
      this._lastSourceData = state.sourceData;
    } else if (this._sourceWasModified) {
      this.sourceCtx.drawImage(this.originalCanvas, 0, 0);
      this.updateFilteredLayer();
      this._lastSourceData = null;
    }
  }

  resetAll() {
    const w = this.sourceCanvas.width;
    const h = this.sourceCanvas.height;
    this.maskCtx.clearRect(0, 0, w, h);
    this.artisticCtx.clearRect(0, 0, w, h);
    this.stickers.clear();
    if (this._sourceWasModified) {
      this.sourceCtx.drawImage(this.originalCanvas, 0, 0);
      this.updateFilteredLayer();
      this._sourceWasModified = false;
      this._lastSourceData = null;
    }
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

  // --- FULL RESOLUTION EXPORT (BLOB & STREAMING) ---
  async exportHighResBlob(format = 'image/jpeg', quality = 0.95) {
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

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas blob export failed'));
      }, format, quality);
    });
  }

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
