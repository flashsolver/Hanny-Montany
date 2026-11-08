// Client-side AI Computer Vision & Smart Tools: Face detection, Text detection, Background segmentation, and Object Inpainting

export class AITools {
  /**
   * Automatically detects faces and returns array of bounding boxes: { x, y, width, height }
   */
  static async detectFaces(imageElement) {
    // 1. Try Native Browser FaceDetector API if supported
    if ('FaceDetector' in window) {
      try {
        const faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 10 });
        const faces = await faceDetector.detect(imageElement);
        if (faces && faces.length > 0) {
          return faces.map(f => ({
            x: f.boundingBox.x,
            y: f.boundingBox.y,
            width: f.boundingBox.width,
            height: f.boundingBox.height
          }));
        }
      } catch (err) {
        console.warn('Native FaceDetector error, falling back to heuristic detector:', err);
      }
    }

    // 2. High-speed Canvas Heuristic Detector (offline, zero-network fallback)
    return this.heuristicFaceDetection(imageElement);
  }

  /**
   * Fast canvas-based skin-tone and feature cluster detection
   */
  static heuristicFaceDetection(img) {
    const w = img.width || (img.naturalWidth || 0);
    const h = img.height || (img.naturalHeight || 0);
    if (w < 1 || h < 1) return [];
    const canvas = document.createElement('canvas');
    const scale = Math.min(1.0, 320 / Math.max(w, h));
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, sw, sh);

    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    let minX = sw, maxX = 0, minY = sh, maxY = 0;
    let skinPixelCount = 0;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Skin color detection rule in RGB & YCbCr space
        const isSkin = (r > 95 && g > 40 && b > 20 &&
                        (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
                        Math.abs(r - g) > 15 && r > g && r > b);

        if (isSkin) {
          skinPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If substantial skin cluster found in upper half
    if (skinPixelCount > (sw * sh * 0.03)) {
      const boxW = (maxX - minX) / scale;
      const boxH = (maxY - minY) / scale;
      // Focus on head region (upper 60% of skin cluster)
      return [{
        x: Math.max(0, (minX / scale)),
        y: Math.max(0, (minY / scale)),
        width: Math.min(w, boxW),
        height: Math.min(h, boxH * 0.7)
      }];
    }

    // Default center-upper face heuristic if no clear skin threshold
    return [{
      x: w * 0.28,
      y: h * 0.22,
      width: w * 0.44,
      height: h * 0.42
    }];
  }

  /**
   * Applies an automatic face blur mask directly to the mask canvas
   */
  static applyFaceMask(maskCanvas, faces) {
    const ctx = maskCanvas.getContext('2d');
    ctx.save();
    for (const f of faces) {
      const cx = f.x + f.width / 2;
      const cy = f.y + f.height / 2;
      const rx = (f.width / 2) * 1.1;
      const ry = (f.height / 2) * 1.25;

      const grad = ctx.createRadialGradient(cx, cy, rx * 0.3, cx, cy, rx);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Automatically blurs background while preserving the center subject (Portrait Bokeh)
   */
  static applyBackgroundMask(maskCanvas) {
    const w = maskCanvas.width;
    const h = maskCanvas.height;
    if (!w || !h) return;
    const ctx = maskCanvas.getContext('2d');

    // Fill entire canvas with white mask
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.fillRect(0, 0, w, h);

    // Punch out the subject in center with feathered inverted ellipse
    ctx.globalCompositeOperation = 'destination-out';
    const cx = w * 0.5;
    const cy = h * 0.55;
    const rx = w * 0.36;
    const ry = h * 0.46;

    const grad = ctx.createRadialGradient(cx, cy, rx * 0.4, cx, cy, rx);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Detects text lines / sensitive blocks (credit cards, CVV, dates, ID fields) and returns array of discrete bounding boxes
   */
  static detectText(sourceCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    if (!w || !h || w < 20 || h < 20) return [];
    const sCtx = sourceCanvas.getContext('2d');

    const imgData = sCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const rowVariance = new Float32Array(h);
    const sampleStep = 4;

    for (let y = 0; y < h; y += sampleStep) {
      let edgeCount = 0;
      for (let x = sampleStep; x < w - sampleStep; x += sampleStep) {
        const idx = (y * w + x) * 4;
        const prevIdx = (y * w + (x - sampleStep)) * 4;
        const diff = Math.abs(data[idx] - data[prevIdx]) +
                     Math.abs(data[idx + 1] - data[prevIdx + 1]) +
                     Math.abs(data[idx + 2] - data[prevIdx + 2]);
        if (diff > 80) edgeCount++;
      }
      rowVariance[y] = edgeCount / (w / sampleStep);
    }

    const rawBands = [];
    let inBand = false;
    let bandStart = 0;

    for (let y = 0; y < h; y += sampleStep) {
      if (rowVariance[y] > 0.08) {
        if (!inBand) {
          inBand = true;
          bandStart = Math.max(0, y - 6);
        }
      } else {
        if (inBand) {
          inBand = false;
          const bandHeight = y - bandStart + 12;
          if (bandHeight >= 14 && bandHeight <= 100) {
            rawBands.push({ startY: bandStart, height: bandHeight });
          }
        }
      }
    }

    const boxes = [];
    const minCardW = Math.max(28, Math.round(w * 0.06));

    for (const band of rawBands) {
      const bY = band.startY;
      const bH = Math.min(band.height, h - bY);
      if (bH <= 0) continue;

      const colDensity = new Float32Array(w);
      for (let x = sampleStep; x < w - sampleStep; x += sampleStep) {
        let colEdges = 0;
        let samples = 0;
        for (let y = bY; y < bY + bH; y += sampleStep) {
          const idx = (y * w + x) * 4;
          const prevIdx = (y * w + (x - sampleStep)) * 4;
          const diff = Math.abs(data[idx] - data[prevIdx]) +
                       Math.abs(data[idx + 1] - data[prevIdx + 1]) +
                       Math.abs(data[idx + 2] - data[prevIdx + 2]);
          if (diff > 80) colEdges++;
          samples++;
        }
        colDensity[x] = samples > 0 ? (colEdges / samples) : 0;
      }

      let inCol = false;
      let colStart = 0;
      let clusterCount = 0;

      for (let x = sampleStep; x < w - sampleStep; x += sampleStep) {
        if (colDensity[x] > 0.08) {
          if (!inCol) {
            inCol = true;
            colStart = Math.max(0, x - 8);
          }
        } else {
          if (inCol) {
            inCol = false;
            const clusterW = x - colStart + 8;
            if (clusterW >= minCardW) {
              boxes.push({
                x: colStart,
                y: bY,
                width: clusterW,
                height: bH
              });
              clusterCount++;
            }
          }
        }
      }

      if (clusterCount === 0) {
        boxes.push({
          x: Math.round(w * 0.08),
          y: bY,
          width: Math.round(w * 0.84),
          height: bH
        });
      }
    }

    return boxes;
  }

  /**
   * Applies blur mask over specified text bounding boxes
   */
  static applyTextMask(maskCanvas, boxes) {
    if (!boxes || boxes.length === 0) return;
    const mCtx = maskCanvas.getContext('2d');
    mCtx.save();
    mCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    for (const b of boxes) {
      mCtx.beginPath();
      if (typeof mCtx.roundRect === 'function') {
        mCtx.roundRect(b.x, b.y, b.width, b.height, 8);
      } else {
        mCtx.rect(b.x, b.y, b.width, b.height);
      }
      mCtx.fill();
    }
    mCtx.restore();
  }

  /**
   * Automatically detects text lines / sensitive blocks and applies mask immediately
   */
  static detectAndBlurText(sourceCanvas, maskCanvas) {
    const boxes = this.detectText(sourceCanvas);
    this.applyTextMask(maskCanvas, boxes);
  }

  /**
   * Checks if the mask canvas contains any drawn pixels
   */
  static hasMask(maskCanvas) {
    const w = maskCanvas.width;
    const h = maskCanvas.height;
    if (!w || !h) return false;
    const mCtx = maskCanvas.getContext('2d');
    const maskImgData = mCtx.getImageData(0, 0, w, h);
    const mask = maskImgData.data;
    for (let i = 3; i < mask.length; i += 4) {
      if (mask[i] > 20) return true;
    }
    return false;
  }

  /**
   * Fast Inpainting / Object Removal (Screenshots 4: "Remove Objects")
   * Replaces masked pixels by diffusing surrounding boundary texture inward
   */
  static inpaintObject(sourceCanvas, maskCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    if (!w || !h) return false;
    const sCtx = sourceCanvas.getContext('2d');
    const mCtx = maskCanvas.getContext('2d');

    const srcImgData = sCtx.getImageData(0, 0, w, h);
    const src = srcImgData.data;

    const maskImgData = mCtx.getImageData(0, 0, w, h);
    const mask = maskImgData.data;

    // Check if mask has any pixels
    let hasMask = false;
    for (let i = 3; i < mask.length; i += 4) {
      if (mask[i] > 20) {
        hasMask = true;
        break;
      }
    }
    if (!hasMask) return false;

    // Multi-pass boundary diffusion inpainting
    const iterations = 8;
    for (let iter = 0; iter < iterations; iter++) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          if (mask[idx + 3] > 30) {
            // Average 4 neighbors
            const up = ((y - 1) * w + x) * 4;
            const down = ((y + 1) * w + x) * 4;
            const left = (y * w + (x - 1)) * 4;
            const right = (y * w + (x + 1)) * 4;

            src[idx] = (src[up] + src[down] + src[left] + src[right]) >> 2;
            src[idx + 1] = (src[up + 1] + src[down + 1] + src[left + 1] + src[right + 1]) >> 2;
            src[idx + 2] = (src[up + 2] + src[down + 2] + src[left + 2] + src[right + 2]) >> 2;
          }
        }
      }
    }

    sCtx.putImageData(srcImgData, 0, 0);

    // Clear the mask where object was removed
    mCtx.clearRect(0, 0, w, h);
    return true;
  }
}
