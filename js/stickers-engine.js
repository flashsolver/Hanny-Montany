// Sticker management, interactive transform handles, and rendering

export class StickerEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stickers = [];
    this.selectedSticker = null;
    this.activeAction = null; // 'drag' | 'rotate' | 'scale'
    this.dragStart = { x: 0, y: 0 };
    this.initialTransform = null;
    this.onSelectionChanged = null;

    // Cache pre-loaded HTMLImageElements for instant SVG drawing
    this.imageCache = new Map();
  }

  async addSticker(stickerDef, centerX, centerY, targetWidth = null) {
    let img = this.imageCache.get(stickerDef.id);
    if (!img) {
      img = new Image();
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(stickerDef.svg.replace(/\s+/g, ' ').trim())}`;
      await new Promise(r => { img.onload = r; });
      this.imageCache.set(stickerDef.id, img);
    }

    const calculatedWidth = targetWidth || Math.max(120, Math.min(400, (centerX * 2) * 0.22));
    const aspect = img.height / img.width;
    const width = calculatedWidth;
    const height = calculatedWidth * aspect;

    const newSticker = {
      id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      defId: stickerDef.id,
      name: stickerDef.name,
      img,
      x: centerX,
      y: centerY,
      width,
      height,
      rotation: 0, // radians
      opacity: 1.0,
      scale: 1.0
    };

    this.stickers.push(newSticker);
    this.selectedSticker = newSticker;
    if (this.onSelectionChanged) this.onSelectionChanged(this.selectedSticker);
    return newSticker;
  }

  setSelectedOpacity(opacity) {
    if (this.selectedSticker) {
      this.selectedSticker.opacity = opacity;
    }
  }

  deleteSelected() {
    if (!this.selectedSticker) return;
    this.stickers = this.stickers.filter(s => s !== this.selectedSticker);
    this.selectedSticker = null;
    if (this.onSelectionChanged) this.onSelectionChanged(null);
  }

  clear() {
    this.stickers = [];
    this.selectedSticker = null;
    if (this.onSelectionChanged) this.onSelectionChanged(null);
  }

  /**
   * Hit test to find if point (in image coordinates) hits a sticker or its handles
   */
  hitTest(x, y, viewScale = 1.0) {
    // First check handles of selected sticker (delete button, rotate handle, scale handle)
    if (this.selectedSticker) {
      const handle = this.hitTestHandles(this.selectedSticker, x, y, viewScale);
      if (handle) {
        return { sticker: this.selectedSticker, handle };
      }
    }

    // Check stickers from topmost to bottom
    for (let i = this.stickers.length - 1; i >= 0; i--) {
      const s = this.stickers[i];
      // Convert (x, y) to local unrotated space of sticker
      const dx = x - s.x;
      const dy = y - s.y;
      const cos = Math.cos(-s.rotation);
      const sin = Math.sin(-s.rotation);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      const halfW = (s.width * s.scale) / 2;
      const halfH = (s.height * s.scale) / 2;

      if (Math.abs(lx) <= halfW && Math.abs(ly) <= halfH) {
        return { sticker: s, handle: 'body' };
      }
    }

    return null;
  }

  hitTestHandles(s, x, y, viewScale = 1.0) {
    const halfW = (s.width * s.scale) / 2;
    const halfH = (s.height * s.scale) / 2;
    // Ensure handle hit radius is at least 22 screen pixels for touch ergonomics
    const handleRadius = Math.max(18, 22 / (viewScale || 1.0));

    // Local coordinates
    const dx = x - s.x;
    const dy = y - s.y;
    const cos = Math.cos(-s.rotation);
    const sin = Math.sin(-s.rotation);
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    // Delete handle (top-right)
    if (Math.hypot(lx - halfW, ly - (-halfH)) <= handleRadius) return 'delete';
    // Rotate handle (top-center)
    if (Math.hypot(lx - 0, ly - (-halfH - 26)) <= handleRadius) return 'rotate';
    // Scale handle (bottom-right)
    if (Math.hypot(lx - halfW, ly - halfH) <= handleRadius) return 'scale';

    return null;
  }

  startInteraction(x, y, hitResult) {
    if (!hitResult) {
      this.selectedSticker = null;
      if (this.onSelectionChanged) this.onSelectionChanged(null);
      return false;
    }

    this.selectedSticker = hitResult.sticker;
    if (this.onSelectionChanged) this.onSelectionChanged(this.selectedSticker);

    if (hitResult.handle === 'delete') {
      this.deleteSelected();
      return true;
    }

    this.activeAction = hitResult.handle; // 'body' | 'rotate' | 'scale'
    this.dragStart = { x, y };
    this.initialTransform = {
      x: this.selectedSticker.x,
      y: this.selectedSticker.y,
      rotation: this.selectedSticker.rotation,
      scale: this.selectedSticker.scale
    };
    return true;
  }

  continueInteraction(x, y) {
    if (!this.selectedSticker || !this.activeAction) return;

    const s = this.selectedSticker;
    const init = this.initialTransform;

    if (this.activeAction === 'body') {
      s.x = init.x + (x - this.dragStart.x);
      s.y = init.y + (y - this.dragStart.y);
    } else if (this.activeAction === 'rotate') {
      const angle = Math.atan2(y - s.y, x - s.x);
      s.rotation = angle + Math.PI / 2;
    } else if (this.activeAction === 'scale') {
      const initialDist = Math.hypot(this.dragStart.x - s.x, this.dragStart.y - s.y);
      const currentDist = Math.hypot(x - s.x, y - s.y);
      const ratio = currentDist / Math.max(10, initialDist);
      s.scale = Math.max(0.2, Math.min(4.0, init.scale * ratio));
    }
  }

  endInteraction() {
    this.activeAction = null;
    this.initialTransform = null;
  }

  render(ctx = this.ctx, renderHandles = true) {
    for (const s of this.stickers) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.globalAlpha = s.opacity;

      const w = s.width * s.scale;
      const h = s.height * s.scale;
      ctx.drawImage(s.img, -w / 2, -h / 2, w, h);

      // Render selection bounding box & handles if selected
      if (renderHandles && s === this.selectedSticker) {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.setLineDash([]);

        // Rotate stick & handle (top-center)
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, -h / 2 - 24);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -h / 2 - 24, 8, 0, Math.PI * 2);
        ctx.fill();

        // Scale handle (bottom-right)
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Delete button handle (top-right)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(w / 2, -h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 4, -h / 2 - 4);
        ctx.lineTo(w / 2 + 4, -h / 2 + 4);
        ctx.moveTo(w / 2 + 4, -h / 2 - 4);
        ctx.lineTo(w / 2 - 4, -h / 2 + 4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
