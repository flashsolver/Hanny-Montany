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
   * Fast canvas-based skin-tone connected-components clustering
   * Returns discrete bounding boxes for candidate face regions, or [] if none found.
   */
  static heuristicFaceDetection(img) {
    const w = img.width || (img.naturalWidth || 0);
    const h = img.height || (img.naturalHeight || 0);
    if (w < 20 || h < 20) return [];

    const canvas = document.createElement('canvas');
    const scale = Math.min(1.0, 320 / Math.max(w, h));
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);
    if (sw < 10 || sh < 10) return [];

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, sw, sh);

    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    const totalPixels = sw * sh;
    const skinMask = new Uint8Array(totalPixels);
    let totalSkinCount = 0;

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Normalized skin color heuristic in RGB & YCbCr space
        const isSkin = (r > 95 && g > 40 && b > 20 &&
                        (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
                        Math.abs(r - g) > 15 && r > g && r > b);

        if (isSkin) {
          skinMask[y * sw + x] = 1;
          totalSkinCount++;
        }
      }
    }

    // Minimum skin pixels needed in the whole image (~0.8% of image area)
    if (totalSkinCount < totalPixels * 0.008) {
      return [];
    }

    // Connected components extraction via BFS
    const visited = new Uint8Array(totalPixels);
    const components = [];
    const minCompPixels = Math.max(40, Math.round(totalPixels * 0.003));
    const qX = new Int16Array(totalPixels);
    const qY = new Int16Array(totalPixels);

    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const pIdx = y * sw + x;
        if (skinMask[pIdx] === 0 || visited[pIdx] === 1) continue;

        let qHead = 0;
        let qTail = 0;
        qX[qTail] = x;
        qY[qTail] = y;
        qTail++;
        visited[pIdx] = 1;

        let compMinX = x;
        let compMaxX = x;
        let compMinY = y;
        let compMaxY = y;
        let pixelCount = 0;

        while (qHead < qTail) {
          const cx = qX[qHead];
          const cy = qY[qHead];
          qHead++;
          pixelCount++;

          if (cx < compMinX) compMinX = cx;
          if (cx > compMaxX) compMaxX = cx;
          if (cy < compMinY) compMinY = cy;
          if (cy > compMaxY) compMaxY = cy;

          // 4-connected neighbors
          const neighbors = [
            cx + 1, cy,
            cx - 1, cy,
            cx, cy + 1,
            cx, cy - 1
          ];

          for (let n = 0; n < 8; n += 2) {
            const nx = neighbors[n];
            const ny = neighbors[n + 1];
            if (nx >= 0 && nx < sw && ny >= 0 && ny < sh) {
              const nIdx = ny * sw + nx;
              if (skinMask[nIdx] === 1 && visited[nIdx] === 0) {
                visited[nIdx] = 1;
                qX[qTail] = nx;
                qY[qTail] = ny;
                qTail++;
              }
            }
          }
        }

        const compW = compMaxX - compMinX + 1;
        const compH = compMaxY - compMinY + 1;
        const aspect = compW / compH;

        // Human face aspect ratio roughly 0.35 to 2.8
        if (pixelCount >= minCompPixels && aspect >= 0.35 && aspect <= 2.8) {
          // If cluster is unusually tall (torso/neck + face), isolate upper portion
          let finalMaxY = compMaxY;
          if (compH > compW * 1.4) {
            finalMaxY = Math.min(compMaxY, Math.round(compMinY + compW * 1.35));
          }

          components.push({
            minX: compMinX,
            maxX: compMaxX,
            minY: compMinY,
            maxY: finalMaxY,
            pixels: pixelCount
          });
        }
      }
    }

    if (components.length === 0) {
      return [];
    }

    // Sort components by pixel count descending
    components.sort((a, b) => b.pixels - a.pixels);

    // Keep components that are substantial relative to the largest cluster
    const largestPixels = components[0].pixels;
    const validComponents = components.filter(comp => comp.pixels >= Math.max(minCompPixels, Math.round(largestPixels * 0.18)));

    // Limit to top 6 distinct face candidates and scale back to original image coordinates
    return validComponents.slice(0, 6).map(comp => {
      const bw = (comp.maxX - comp.minX + 1) / scale;
      const bh = (comp.maxY - comp.minY + 1) / scale;
      const bx = comp.minX / scale;
      const by = comp.minY / scale;

      const padX = bw * 0.08;
      const padY = bh * 0.08;

      const finalX = Math.max(0, Math.round(bx - padX));
      const finalY = Math.max(0, Math.round(by - padY));
      const finalW = Math.min(w - finalX, Math.round(bw + padX * 2));
      const finalH = Math.min(h - finalY, Math.round(bh + padY * 2));

      return {
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH
      };
    });
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
   * Blurs background while preserving the center subject (Center Focus / Fixed Ellipse)
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
   * Edge-inward onion-peel diffusion inpainting
   * Restricts processing to mask bounding box and diffuses boundary pixels inward to eliminate dark smears
   */
  static inpaintObject(sourceCanvas, maskCanvas) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    if (!w || !h) return false;
    const sCtx = sourceCanvas.getContext('2d');
    const mCtx = maskCanvas.getContext('2d');

    const maskImgData = mCtx.getImageData(0, 0, w, h);
    const mask = maskImgData.data;

    // 1. Find mask bounding box and verify if mask has content
    let minX = w, maxX = -1, minY = h, maxY = -1;
    let maskPixelCount = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (mask[idx + 3] > 20) {
          maskPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maskPixelCount === 0 || minX > maxX || minY > maxY) {
      return false;
    }

    // Expand bounding box by 6px margin for boundary texture sampling
    const pad = 6;
    const bMinX = Math.max(0, minX - pad);
    const bMaxX = Math.min(w - 1, maxX + pad);
    const bMinY = Math.max(0, minY - pad);
    const bMaxY = Math.min(h - 1, maxY + pad);

    const bW = bMaxX - bMinX + 1;
    const bH = bMaxY - bMinY + 1;

    // 2. Extract only bounding box from source image
    const srcImgData = sCtx.getImageData(bMinX, bMinY, bW, bH);
    const src = srcImgData.data;

    // 3. Pixel status grid: 0 = KNOWN, 1 = TARGET (needs inpaint), 2 = FILLED
    const status = new Uint8Array(bW * bH);
    let remainingTargets = 0;

    for (let by = 0; by < bH; by++) {
      const gy = bMinY + by;
      for (let bx = 0; bx < bW; bx++) {
        const gx = bMinX + bx;
        const gIdx = (gy * w + gx) * 4;
        const lIdx = by * bW + bx;

        if (mask[gIdx + 3] > 20) {
          status[lIdx] = 1; // TARGET
          remainingTargets++;
        } else {
          status[lIdx] = 0; // KNOWN
        }
      }
    }

    if (remainingTargets === 0) return false;

    // 4. Edge-inward onion-peel diffusion
    const maxIter = Math.min(120, Math.max(20, Math.round(Math.max(bW, bH) * 0.75)));
    const frontierX = new Int32Array(bW * bH);
    const frontierY = new Int32Array(bW * bH);
    const newColorsR = new Uint8Array(bW * bH);
    const newColorsG = new Uint8Array(bW * bH);
    const newColorsB = new Uint8Array(bW * bH);

    for (let iter = 0; iter < maxIter && remainingTargets > 0; iter++) {
      let frontierCount = 0;

      // Identify boundary target pixels touching at least one known/filled pixel
      for (let by = 0; by < bH; by++) {
        for (let bx = 0; bx < bW; bx++) {
          const lIdx = by * bW + bx;
          if (status[lIdx] !== 1) continue;

          // Check 8-neighborhood for known/filled pixels
          let sumR = 0, sumG = 0, sumB = 0, totalWeight = 0;

          for (let dy = -2; dy <= 2; dy++) {
            const ny = by + dy;
            if (ny < 0 || ny >= bH) continue;
            for (let dx = -2; dx <= 2; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = bx + dx;
              if (nx < 0 || nx >= bW) continue;

              const nIdx = ny * bW + nx;
              if (status[nIdx] !== 1) { // KNOWN or FILLED
                const distSq = dx * dx + dy * dy;
                const weight = 1.0 / distSq;
                const pIdx = nIdx * 4;
                sumR += src[pIdx] * weight;
                sumG += src[pIdx + 1] * weight;
                sumB += src[pIdx + 2] * weight;
                totalWeight += weight;
              }
            }
          }

          if (totalWeight > 0) {
            frontierX[frontierCount] = bx;
            frontierY[frontierCount] = by;
            newColorsR[frontierCount] = Math.round(sumR / totalWeight);
            newColorsG[frontierCount] = Math.round(sumG / totalWeight);
            newColorsB[frontierCount] = Math.round(sumB / totalWeight);
            frontierCount++;
          }
        }
      }

      if (frontierCount === 0) break;

      // Apply computed colors to frontier pixels and mark as FILLED
      for (let i = 0; i < frontierCount; i++) {
        const bx = frontierX[i];
        const by = frontierY[i];
        const lIdx = by * bW + bx;
        const pIdx = lIdx * 4;

        src[pIdx] = newColorsR[i];
        src[pIdx + 1] = newColorsG[i];
        src[pIdx + 2] = newColorsB[i];
        status[lIdx] = 2; // FILLED
        remainingTargets--;
      }
    }

    // 5. Light smoothing pass over filled pixels to seamlessly blend seams
    const smoothR = new Uint8Array(bW * bH);
    const smoothG = new Uint8Array(bW * bH);
    const smoothB = new Uint8Array(bW * bH);
    const smoothed = new Uint8Array(bW * bH);

    for (let by = 1; by < bH - 1; by++) {
      for (let bx = 1; bx < bW - 1; bx++) {
        const lIdx = by * bW + bx;
        if (status[lIdx] === 0) continue; // Skip untouched original pixels

        let r = 0, g = 0, b = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = (by + dy) * bW + (bx + dx);
            const pIdx = nIdx * 4;
            r += src[pIdx];
            g += src[pIdx + 1];
            b += src[pIdx + 2];
            cnt++;
          }
        }
        smoothR[lIdx] = Math.round(r / cnt);
        smoothG[lIdx] = Math.round(g / cnt);
        smoothB[lIdx] = Math.round(b / cnt);
        smoothed[lIdx] = 1;
      }
    }

    for (let by = 1; by < bH - 1; by++) {
      for (let bx = 1; bx < bW - 1; bx++) {
        const lIdx = by * bW + bx;
        if (smoothed[lIdx]) {
          const pIdx = lIdx * 4;
          src[pIdx] = smoothR[lIdx];
          src[pIdx + 1] = smoothG[lIdx];
          src[pIdx + 2] = smoothB[lIdx];
        }
      }
    }

    // 6. Write back inpainted bounding region to source canvas
    sCtx.putImageData(srcImgData, bMinX, bMinY);

    // 7. Clear the mask canvas
    mCtx.clearRect(0, 0, w, h);
    return true;
  }
}
