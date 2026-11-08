// Smooth path interpolation and artistic brush rendering engine

export class BrushEngine {
  constructor(maskCanvas, artisticCanvas = null, effectsCanvas = null) {
    this.maskCanvas = maskCanvas;
    this.maskCtx = maskCanvas ? maskCanvas.getContext('2d') : null;
    this.artisticCanvas = artisticCanvas;
    this.artisticCtx = artisticCanvas ? artisticCanvas.getContext('2d') : null;
    this.effectsCanvas = effectsCanvas;
    this.effectsCtx = effectsCanvas ? effectsCanvas.getContext('2d') : null;

    this.isDrawing = false;
    this.lastPoint = null;
    this.points = [];

    // Settings
    this.brushType = 'smooth'; // 'smooth' | 'chalk' | 'oil' | 'multitone' | 'crayon' | 'glitter' | 'splatter'
    this.strokeStyle = 'soft'; // 'soft' | 'hard' | 'chisel' | 'bristle' | 'spray'
    this.size = 40;
    this.opacity = 1.0;
    this.isEraser = false;
    this.color = '#382216';

    // Stylish multi-tone color swatches (from Screenshot 1)
    this.stylishSwatches = ['#4a2f1d', '#7d5236', '#a67c52', '#d9b28f', '#ecd4ba', '#342116'];
    this.swatchIndex = 0;
  }

  setBrushType(type) {
    this.brushType = type;
  }

  setStrokeStyle(style) {
    this.strokeStyle = style;
  }

  setSize(size) {
    this.size = Math.max(4, Math.min(200, size));
  }

  setOpacity(opacity) {
    this.opacity = Math.max(0.05, Math.min(1.0, opacity));
  }

  setEraser(isEraser) {
    this.isEraser = isEraser;
  }

  setColor(color) {
    this.color = color;
  }

  startStroke(x, y) {
    this.isDrawing = true;
    this.points = [{ x, y }];
    this.lastPoint = { x, y };

    if (this.brushType === 'multitone') {
      this.swatchIndex = (this.swatchIndex + 1) % this.stylishSwatches.length;
    }

    this.renderPoint(x, y);
  }

  continueStroke(x, y) {
    if (!this.isDrawing) return;

    const currentPoint = { x, y };
    const dist = Math.hypot(currentPoint.x - this.lastPoint.x, currentPoint.y - this.lastPoint.y);

    // Spacing between stamp steps
    const stepDist = Math.max(2, this.size * 0.12);
    if (dist < stepDist) return;

    const steps = Math.floor(dist / stepDist);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const interpX = this.lastPoint.x + (currentPoint.x - this.lastPoint.x) * t;
      const interpY = this.lastPoint.y + (currentPoint.y - this.lastPoint.y) * t;
      this.renderPoint(interpX, interpY, currentPoint.x - this.lastPoint.x, currentPoint.y - this.lastPoint.y);
    }

    this.lastPoint = currentPoint;
    this.points.push(currentPoint);
  }

  endStroke() {
    this.isDrawing = false;
    this.points = [];
    this.lastPoint = null;
  }

  isArtistic() {
    return ['chalk', 'oil', 'multitone', 'crayon', 'glitter', 'splatter'].includes(this.brushType);
  }

  renderPoint(x, y, dx = 0, dy = 0) {
    // If eraser is active, it erases from effects, artistic, and mask layers
    if (this.isEraser) {
      if (this.effectsCtx) {
        this.eraseAt(this.effectsCtx, x, y, this.size, dx, dy);
      }
      if (this.artisticCtx) {
        this.eraseAt(this.artisticCtx, x, y, this.size, dx, dy);
      }
      this.eraseAt(this.maskCtx, x, y, this.size, dx, dy);
      return;
    }

    // Strict layer separation: artistic brushes write strictly to artistic layer,
    // while smooth/blur brushes write strictly to the reveal mask layer.
    if (this.isArtistic()) {
      if (this.artisticCtx) {
        this.paintArtisticStamp(this.artisticCtx, x, y, dx, dy);
      }
    } else {
      this.paintMaskStamp(this.maskCtx, x, y, this.size, this.opacity, dx, dy);
    }
  }

  eraseAt(ctx, x, y, size, dx = 0, dy = 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    switch (this.strokeStyle) {
      case 'hard': {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'chisel': {
        const angle = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : -0.52;
        ctx.translate(x, y);
        ctx.rotate(angle);
        const w = Math.max(4, size * 0.35);
        const h = size * 1.1;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill();
        break;
      }

      case 'bristle': {
        const angle = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : 0;
        ctx.translate(x, y);
        ctx.rotate(angle);
        const bristleCount = Math.max(5, Math.floor(size * 0.35));
        const halfSpan = size * 0.5;
        for (let i = 0; i < bristleCount; i++) {
          const offset = -halfSpan + (size / bristleCount) * i;
          const bWidth = Math.max(2, size * 0.1);
          const bLength = Math.max(4, size * 0.35);
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.fillRect(-bLength / 2, offset, bLength, bWidth);
        }
        break;
      }

      case 'spray': {
        const dotCount = Math.max(14, Math.floor(size * 0.6));
        const maxR = size * 0.5;
        for (let i = 0; i < dotCount; i++) {
          const rad = Math.sqrt(Math.random()) * maxR;
          const theta = Math.random() * Math.PI * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.beginPath();
          ctx.arc(x + rad * Math.cos(theta), y + rad * Math.sin(theta), 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'soft':
      default: {
        const grad = ctx.createRadialGradient(x, y, size * 0.2, x, y, size * 0.5);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  paintMaskStamp(ctx, x, y, size, opacity, dx = 0, dy = 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    switch (this.strokeStyle) {
      case 'hard': {
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'chisel': {
        const angle = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : -0.52;
        ctx.translate(x, y);
        ctx.rotate(angle);
        const w = Math.max(4, size * 0.35);
        const h = size * 1.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-w / 2, -h / 2, w, h, 3);
        } else {
          ctx.rect(-w / 2, -h / 2, w, h);
        }
        ctx.fill();
        break;
      }

      case 'bristle': {
        const angle = (dx !== 0 || dy !== 0) ? Math.atan2(dy, dx) : 0;
        ctx.translate(x, y);
        ctx.rotate(angle);
        const bristleCount = Math.max(5, Math.floor(size * 0.35));
        const halfSpan = size * 0.5;
        for (let i = 0; i < bristleCount; i++) {
          const offset = -halfSpan + (size / bristleCount) * i;
          const bWidth = Math.max(1.5, size * 0.08);
          const bLength = Math.max(3, size * 0.3 + (Math.sin(i * 3.7 + x) * 2));
          const bAlpha = opacity * (0.45 + (Math.sin(i * 1.8) * 0.25));
          ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha})`;
          ctx.fillRect(-bLength / 2, offset, bLength, bWidth);
        }
        break;
      }

      case 'spray': {
        const dotCount = Math.max(12, Math.floor(size * 0.5));
        const maxR = size * 0.5;
        for (let i = 0; i < dotCount; i++) {
          const rad = Math.sqrt(Math.random()) * maxR;
          const theta = Math.random() * Math.PI * 2;
          const dotX = x + rad * Math.cos(theta);
          const dotY = y + rad * Math.sin(theta);
          const dotSize = Math.max(1, 1.2 + Math.random() * 2);
          const dotAlpha = opacity * (0.35 + (1 - rad / maxR) * 0.5);
          ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'soft':
      default: {
        const grad = ctx.createRadialGradient(x, y, size * 0.1, x, y, size * 0.5);
        grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        grad.addColorStop(0.8, `rgba(255, 255, 255, ${opacity * 0.7})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  paintArtisticStamp(ctx, x, y, dx, dy) {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    const angle = Math.atan2(dy, dx) || 0;

    switch (this.brushType) {
      case 'oil': {
        // Flat rectangular palette knife stamp with bristle striations
        ctx.translate(x, y);
        ctx.rotate(angle);
        const w = this.size * 0.8;
        const h = this.size * 0.35;

        ctx.fillStyle = this.color;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Subtle lighter impasto ridge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(-w / 2, -h / 2, w, 2);
        ctx.restore();
        return;
      }

      case 'multitone': {
        // Recreates the exact look from Screenshot 1: Broad textured strokes with swatches
        ctx.translate(x, y);
        ctx.rotate(angle || -0.4);

        const swatch = this.stylishSwatches[this.swatchIndex];
        ctx.fillStyle = swatch;

        const w = this.size * 1.2;
        const h = this.size * 0.5;

        // Textured ragged edge
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        for (let i = 0; i < 6; i++) {
          const rx = -w / 2 + (w / 6) * i;
          const ry = -h / 2 + (Math.sin(i * 1.5) * 4);
          ctx.lineTo(rx, ry);
        }
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        return;
      }

      case 'chalk':
      case 'crayon': {
        // Grainy texture scatter
        const count = 14;
        ctx.fillStyle = this.color;
        for (let i = 0; i < count; i++) {
          const r = Math.random() * (this.size * 0.45);
          const theta = Math.random() * Math.PI * 2;
          const px = x + Math.cos(theta) * r;
          const py = y + Math.sin(theta) * r;
          const spotR = 1.5 + Math.random() * 3;
          ctx.beginPath();
          ctx.arc(px, py, spotR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      case 'glitter': {
        // Sparkling stars and glittering speckles
        const count = 5;
        const sparkles = ['#fde047', '#ffffff', '#f472b6', '#38bdf8'];
        for (let i = 0; i < count; i++) {
          const r = Math.random() * (this.size * 0.5);
          const theta = Math.random() * Math.PI * 2;
          const px = x + Math.cos(theta) * r;
          const py = y + Math.sin(theta) * r;
          ctx.fillStyle = sparkles[Math.floor(Math.random() * sparkles.length)];

          ctx.beginPath();
          ctx.arc(px, py, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // occasional 4-point sparkle cross
          if (Math.random() > 0.6) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 5, py);
            ctx.lineTo(px + 5, py);
            ctx.moveTo(px, py - 5);
            ctx.lineTo(px, py + 5);
            ctx.stroke();
          }
        }
        ctx.restore();
        return;
      }

      case 'splatter': {
        // Paint drops
        ctx.fillStyle = this.color;
        const count = 4;
        for (let i = 0; i < count; i++) {
          const r = Math.random() * (this.size * 0.7);
          const theta = Math.random() * Math.PI * 2;
          const px = x + Math.cos(theta) * r;
          const py = y + Math.sin(theta) * r;
          const rad = 1 + Math.random() * (this.size * 0.1);
          ctx.beginPath();
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }

      default:
        ctx.restore();
    }
  }
}
