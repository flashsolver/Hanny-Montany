// High-performance image filter routines
// Pre-renders filtered layer copies for seamless real-time masking

export class FilterEngine {
  /**
   * Internal helper to normalize arguments across dual-context (sCtx, tCtx, width, height, ...)
   * and legacy single-context (ctx, width, height, ...) invocation signatures.
   */
  static _resolveCtx(a1, a2, a3, a4, a5, a6, a7) {
    if (a2 && typeof a2.getImageData === 'function') {
      return { sCtx: a1, tCtx: a2, width: a3, height: a4, p1: a5, p2: a6, p3: a7 };
    }
    return { sCtx: a1, tCtx: a1, width: a2, height: a3, p1: a4, p2: a5, p3: a6 };
  }

  /**
   * Applies the selected filter to a target canvas reading from a pristine source canvas or image.
   * Dual-signature support:
   * 1. applyFilter(sourceCanvas, targetCanvas, filterType, intensity, sizeParam, colorParam, angleParam)
   * 2. applyFilter(sourceCanvas, filterType, intensity, sizeParam, colorParam, angleParam) -> returns new canvas
   *
   * @param {HTMLCanvasElement|HTMLImageElement|ImageBitmap} source
   * @param {HTMLCanvasElement|string} targetOrType
   * @param  {...any} rest
   * @returns {HTMLCanvasElement}
   */
  static applyFilter(source, targetOrType, ...rest) {
    if (!source || !source.width || !source.height) {
      return (targetOrType && typeof targetOrType === 'object') ? targetOrType : document.createElement('canvas');
    }

    const width = source.width;
    const height = source.height;

    let target;
    let filterType;
    let intensity;
    let sizeParam;
    let colorParam;
    let angleParam;

    if (targetOrType && typeof targetOrType === 'object' && ('getContext' in targetOrType || targetOrType.nodeName === 'CANVAS')) {
      target = targetOrType;
      filterType = rest[0];
      intensity = rest[1] !== undefined ? rest[1] : 50;
      sizeParam = rest[2] !== undefined ? rest[2] : 50;
      colorParam = rest[3] !== undefined ? rest[3] : '#000000';
      angleParam = rest[4] !== undefined ? rest[4] : 0;
    } else {
      target = document.createElement('canvas');
      filterType = targetOrType;
      intensity = rest[0] !== undefined ? rest[0] : 50;
      sizeParam = rest[1] !== undefined ? rest[1] : 50;
      colorParam = rest[2] !== undefined ? rest[2] : '#000000';
      angleParam = rest[3] !== undefined ? rest[3] : 0;
    }

    if (target.width !== width || target.height !== height) {
      target.width = width;
      target.height = height;
    }

    const tCtx = target.getContext('2d');
    if (!tCtx) return target;

    // Source context (if source is a canvas and distinct from target)
    const isSourceCanvas = typeof source.getContext === 'function';
    const sCtx = (isSourceCanvas && source !== target) ? source.getContext('2d') : null;

    // Populate target canvas cleanly with a fresh copy of source
    tCtx.clearRect(0, 0, width, height);
    tCtx.drawImage(source, 0, 0);

    const readCtx = sCtx || tCtx;

    switch (filterType) {
      case 'natural_blur': {
        const radius = Math.max(2, Math.round((intensity / 100) * 45));
        this.fastStackBlur(tCtx, 0, 0, width, height, radius);
        break;
      }

      case 'heavy_blur': {
        const radius = Math.max(8, Math.round((intensity / 100) * 90));
        this.fastStackBlur(tCtx, 0, 0, width, height, radius);
        break;
      }

      case 'mosaic': {
        const blockSize = Math.max(4, Math.round(4 + (sizeParam / 100) * 60));
        this.applySquareMosaic(readCtx, tCtx, width, height, blockSize);
        break;
      }

      case 'hex_mosaic': {
        const radius = Math.max(6, Math.round(6 + (sizeParam / 100) * 50));
        this.applyHexMosaic(readCtx, tCtx, width, height, radius);
        break;
      }

      case 'frosted': {
        const strength = Math.max(3, Math.round((intensity / 100) * 35));
        this.applyFrostedGlass(readCtx, tCtx, width, height, strength);
        break;
      }

      case 'motion': {
        const distance = Math.max(5, Math.round((intensity / 100) * 60));
        this.applyMotionBlur(readCtx, tCtx, width, height, distance);
        break;
      }

      case 'brush_stroke': {
        const distance = Math.max(6, Math.round((intensity / 100) * 75));
        this.applyBrushStrokeBlur(readCtx, tCtx, width, height, distance, sizeParam, angleParam);
        break;
      }

      case 'zoom_blur': {
        const factor = Math.max(0.04, (intensity / 100) * 0.28);
        this.applyRadialZoomBlur(readCtx, tCtx, width, height, factor);
        break;
      }

      case 'chromatic': {
        const distance = Math.max(4, Math.round((intensity / 100) * 40));
        this.applyChromaticBlur(readCtx, tCtx, width, height, distance);
        break;
      }

      case 'pop_art': {
        const levels = Math.max(2, Math.min(6, Math.round(2 + (sizeParam / 100) * 4)));
        this.applyPopArt(readCtx, tCtx, width, height, levels, intensity);
        break;
      }

      case 'color_separation': {
        const shift = Math.max(2, Math.round(2 + (intensity / 100) * 28));
        this.applyColorSeparation(readCtx, tCtx, width, height, shift);
        break;
      }

      case 'thermal': {
        this.applyThermalHeatmap(readCtx, tCtx, width, height, intensity);
        break;
      }

      case 'duotone': {
        this.applyDuotone(readCtx, tCtx, width, height, intensity);
        break;
      }

      case 'glitch': {
        const shift = Math.max(4, Math.round(4 + (intensity / 100) * 40));
        const blockSize = Math.max(4, Math.round(4 + (sizeParam / 100) * 24));
        this.applyGlitch(readCtx, tCtx, width, height, shift, blockSize);
        break;
      }

      case 'matrix_ascii': {
        const cellSize = Math.max(8, Math.round(8 + (sizeParam / 100) * 16));
        this.applyMatrixAscii(readCtx, tCtx, width, height, cellSize, intensity);
        break;
      }

      case 'liquid_swirl': {
        const twist = ((intensity / 100) * 8.0 - 4.0) || 2.5;
        const radius = Math.max(30, Math.round(30 + (sizeParam / 100) * 120));
        this.applyLiquidSwirl(readCtx, tCtx, width, height, twist, radius);
        break;
      }

      case 'reeded_glass': {
        const pitch = Math.max(12, Math.round(12 + (sizeParam / 100) * 40));
        const amplitude = Math.max(3, Math.round(3 + (intensity / 100) * 30));
        this.applyReededGlass(readCtx, tCtx, width, height, pitch, amplitude);
        break;
      }

      case 'film_grain':
      case 'ai_cloaking': {
        const strength = Math.max(5, Math.round(5 + (intensity / 100) * 45));
        this.applyFilmGrain(readCtx, tCtx, width, height, strength);
        break;
      }

      case 'halftone': {
        const dotSize = Math.max(6, Math.round(6 + (sizeParam / 100) * 30));
        this.applyHalftone(readCtx, tCtx, width, height, dotSize);
        break;
      }

      case 'blackout': {
        tCtx.fillStyle = colorParam || '#000000';
        tCtx.fillRect(0, 0, width, height);
        break;
      }

      default:
        this.fastStackBlur(tCtx, 0, 0, width, height, 16);
    }

    return target;
  }

  // --- SQUARE MOSAIC / PIXELATE ---
  static applySquareMosaic(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: blockSize } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImgData = sCtx.getImageData(0, 0, width, height);
    const src = srcImgData.data;

    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const sampleX = Math.min(width - 1, x + Math.floor(blockSize / 2));
        const sampleY = Math.min(height - 1, y + Math.floor(blockSize / 2));
        const sampleIdx = (sampleY * width + sampleX) * 4;

        const r = src[sampleIdx];
        const g = src[sampleIdx + 1];
        const b = src[sampleIdx + 2];
        const a = src[sampleIdx + 3];

        const blockW = Math.min(blockSize, width - x);
        const blockH = Math.min(blockSize, height - y);

        for (let by = 0; by < blockH; by++) {
          for (let bx = 0; bx < blockW; bx++) {
            const idx = ((y + by) * width + (x + bx)) * 4;
            out[idx] = r;
            out[idx + 1] = g;
            out[idx + 2] = b;
            out[idx + 3] = a;
          }
        }
      }
    }
    tCtx.putImageData(outImg, 0, 0);
  }

  // --- HEXAGONAL MOSAIC ---
  static applyHexMosaic(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: radius } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImgData = sCtx.getImageData(0, 0, width, height);
    const src = srcImgData.data;

    tCtx.clearRect(0, 0, width, height);

    const s = radius;
    const h = s * Math.sqrt(3) / 2;

    const cols = Math.ceil(width / (s * 1.5)) + 2;
    const rows = Math.ceil(height / (h * 2)) + 2;

    for (let col = -1; col < cols; col++) {
      for (let row = -1; row < rows; row++) {
        const cx = col * 1.5 * s;
        const cy = row * 2 * h + (col % 2 !== 0 ? h : 0);

        const clampX = Math.max(0, Math.min(width - 1, Math.round(cx)));
        const clampY = Math.max(0, Math.min(height - 1, Math.round(cy)));
        const idx = (clampY * width + clampX) * 4;

        tCtx.fillStyle = `rgb(${src[idx]}, ${src[idx + 1]}, ${src[idx + 2]})`;
        tCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        tCtx.lineWidth = 1;

        tCtx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + s * Math.cos(angle);
          const hy = cy + s * Math.sin(angle);
          if (i === 0) tCtx.moveTo(hx, hy);
          else tCtx.lineTo(hx, hy);
        }
        tCtx.closePath();
        tCtx.fill();
        tCtx.stroke();
      }
    }
  }

  // --- FROSTED GLASS / CRYSTAL ---
  static applyFrostedGlass(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: strength } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const pseudoRandom = (x, y) => {
      const dot = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return dot - Math.floor(dot);
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const angle = pseudoRandom(x, y) * Math.PI * 2;
        const dist = pseudoRandom(y, x) * strength;
        const sx = Math.max(0, Math.min(width - 1, Math.round(x + Math.cos(angle) * dist)));
        const sy = Math.max(0, Math.min(height - 1, Math.round(y + Math.sin(angle) * dist)));

        const sIdx = (sy * width + sx) * 4;
        const dIdx = (y * width + x) * 4;

        out[dIdx] = src[sIdx];
        out[dIdx + 1] = src[sIdx + 1];
        out[dIdx + 2] = src[sIdx + 2];
        out[dIdx + 3] = src[sIdx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
    this.fastStackBlur(tCtx, 0, 0, width, height, 2);
  }

  // --- MOTION BLUR ---
  static applyMotionBlur(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: distance } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const samples = 15;
    const step = distance / samples;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;

        for (let s = -samples / 2; s <= samples / 2; s++) {
          const sx = Math.max(0, Math.min(width - 1, Math.round(x + s * step)));
          const idx = (y * width + sx) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
          a += src[idx + 3];
          count++;
        }

        const dIdx = (y * width + x) * 4;
        out[dIdx] = r / count;
        out[dIdx + 1] = g / count;
        out[dIdx + 2] = b / count;
        out[dIdx + 3] = a / count;
      }
    }
    tCtx.putImageData(outImg, 0, 0);
  }

  // --- RADIAL ZOOM / BURST BLUR ---
  static applyRadialZoomBlur(a1, a2, a3, a4, a5, a6, a7) {
    const { sCtx, tCtx, width, height, p1: factor, p2: centerXParam, p3: centerYParam } = this._resolveCtx(a1, a2, a3, a4, a5, a6, a7);
    const centerX = centerXParam !== undefined ? centerXParam : width / 2;
    const centerY = centerYParam !== undefined ? centerYParam : height / 2;

    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const samples = 14;
    const weights = new Float32Array(samples);
    let totalWeight = 0;
    for (let s = 0; s < samples; s++) {
      const w = 1 - (s / samples) * 0.45;
      weights[s] = w;
      totalWeight += w;
    }
    for (let s = 0; s < samples; s++) {
      weights[s] /= totalWeight;
    }

    for (let y = 0; y < height; y++) {
      const dy = y - centerY;
      const rowIdx = y * width * 4;

      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        let r = 0, g = 0, b = 0, a = 0;

        for (let s = 0; s < samples; s++) {
          const scale = 1 - (s / samples) * factor;
          const sx = Math.max(0, Math.min(width - 1, Math.round(centerX + dx * scale)));
          const sy = Math.max(0, Math.min(height - 1, Math.round(centerY + dy * scale)));
          const idx = (sy * width + sx) * 4;
          const w = weights[s];

          r += src[idx] * w;
          g += src[idx + 1] * w;
          b += src[idx + 2] * w;
          a += src[idx + 3] * w;
        }

        const dIdx = rowIdx + x * 4;
        out[dIdx] = r | 0;
        out[dIdx + 1] = g | 0;
        out[dIdx + 2] = b | 0;
        out[dIdx + 3] = a | 0;
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- CHROMATIC PRISM BLUR ---
  static applyChromaticBlur(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: distance } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const angle = 0.58;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const samples = 7;
    const halfSamples = Math.floor(samples / 2);
    const step = distance / samples;

    const redOffsetsX = new Int32Array(samples);
    const redOffsetsY = new Int32Array(samples);
    const blueOffsetsX = new Int32Array(samples);
    const blueOffsetsY = new Int32Array(samples);
    const greenOffsetsX = new Int32Array(samples);
    const greenOffsetsY = new Int32Array(samples);

    for (let s = 0; s < samples; s++) {
      redOffsetsX[s] = Math.round(s * step * cosA);
      redOffsetsY[s] = Math.round(s * step * sinA);
      blueOffsetsX[s] = Math.round(-s * step * cosA);
      blueOffsetsY[s] = Math.round(-s * step * sinA);
      const gs = s - halfSamples;
      greenOffsetsX[s] = Math.round(gs * (step * 0.4) * cosA);
      greenOffsetsY[s] = Math.round(gs * (step * 0.4) * sinA);
    }

    for (let y = 0; y < height; y++) {
      const rowIdx = y * width * 4;
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;

        for (let s = 0; s < samples; s++) {
          const rx = Math.max(0, Math.min(width - 1, x + redOffsetsX[s]));
          const ry = Math.max(0, Math.min(height - 1, y + redOffsetsY[s]));
          r += src[(ry * width + rx) * 4];

          const gx = Math.max(0, Math.min(width - 1, x + greenOffsetsX[s]));
          const gy = Math.max(0, Math.min(height - 1, y + greenOffsetsY[s]));
          g += src[(gy * width + gx) * 4 + 1];

          const bx = Math.max(0, Math.min(width - 1, x + blueOffsetsX[s]));
          const by = Math.max(0, Math.min(height - 1, y + blueOffsetsY[s]));
          b += src[(by * width + bx) * 4 + 2];
        }

        const centerIdx = (y * width + x) * 4;
        const dIdx = rowIdx + x * 4;

        out[dIdx] = (r / samples) | 0;
        out[dIdx + 1] = (g / samples) | 0;
        out[dIdx + 2] = (b / samples) | 0;
        out[dIdx + 3] = src[centerIdx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- PAINT BRUSH STROKE BLUR ---
  static applyBrushStrokeBlur(a1, a2, a3, a4, a5, a6, a7) {
    const { sCtx, tCtx, width, height, p1: distance, p2: sizeParam, p3: angleDeg } = this._resolveCtx(a1, a2, a3, a4, a5, a6, a7);
    const size = sizeParam !== undefined ? sizeParam : 50;
    const angleValue = angleDeg !== undefined ? angleDeg : 135;

    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const angle = -((angleValue % 180)) * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpCos = -sinA;
    const perpSin = cosA;

    const samples = Math.min(21, Math.max(11, Math.round(distance / 3) | 1));
    const halfSamples = Math.floor(samples / 2);
    const step = distance / samples;

    const sampleDX = new Int32Array(samples);
    const sampleDY = new Int32Array(samples);
    const weights = new Float32Array(samples);
    let totalWeight = 0;

    for (let s = -halfSamples; s <= halfSamples; s++) {
      const idx = s + halfSamples;
      const t = s * step;
      sampleDX[idx] = Math.round(t * cosA);
      sampleDY[idx] = Math.round(t * sinA);
      const w = 0.54 + 0.46 * Math.cos((s / halfSamples) * Math.PI * 0.85);
      weights[idx] = w;
      totalWeight += w;
    }
    for (let i = 0; i < samples; i++) {
      weights[i] /= totalWeight;
    }

    const bristleLUT = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const h1 = Math.sin(i * 0.18) * 0.07;
      const h2 = Math.sin(i * 0.53 + 1.2) * 0.04;
      const h3 = Math.cos(i * 1.15 + 2.7) * 0.025;
      bristleLUT[i] = 1.0 + (h1 + h2 + h3);
    }

    const bristleFreq = 0.35 / Math.max(0.2, (size / 50));
    const sampleSys = new Int32Array(samples);

    for (let y = 0; y < height; y++) {
      const rowBaseY = y * width;
      const rowPerp = y * perpSin;

      for (let s = 0; s < samples; s++) {
        const sy = Math.max(0, Math.min(height - 1, y + sampleDY[s]));
        sampleSys[s] = sy * width;
      }

      let dIdx = rowBaseY * 4;
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;

        for (let s = 0; s < samples; s++) {
          const sx = Math.max(0, Math.min(width - 1, x + sampleDX[s]));
          const idx = (sampleSys[s] + sx) * 4;
          const w = weights[s];
          r += src[idx] * w;
          g += src[idx + 1] * w;
          b += src[idx + 2] * w;
          a += src[idx + 3] * w;
        }

        const perp = rowPerp + x * perpCos;
        const lutIdx = Math.abs((perp * bristleFreq * 16) | 0) & 511;
        const bristleMod = bristleLUT[lutIdx];

        out[dIdx] = Math.min(255, Math.max(0, (r * bristleMod) | 0));
        out[dIdx + 1] = Math.min(255, Math.max(0, (g * bristleMod) | 0));
        out[dIdx + 2] = Math.min(255, Math.max(0, (b * bristleMod) | 0));
        out[dIdx + 3] = a | 0;
        dIdx += 4;
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- POP ART POSTERIZE ---
  static applyPopArt(a1, a2, a3, a4, a5, a6) {
    const { sCtx, tCtx, width, height, p1: levelsParam, p2: intensityParam } = this._resolveCtx(a1, a2, a3, a4, a5, a6);
    const levels = levelsParam !== undefined ? levelsParam : 4;
    const intensity = intensityParam !== undefined ? intensityParam : 50;

    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const palette4 = [
      [15, 23, 42],
      [220, 38, 38],
      [245, 158, 11],
      [254, 243, 199]
    ];

    const palette6 = [
      [10, 15, 30],
      [180, 25, 45],
      [225, 29, 72],
      [234, 88, 12],
      [250, 204, 21],
      [255, 251, 235]
    ];

    const activePalette = levels <= 4 ? palette4 : palette6;
    const numColors = activePalette.length;

    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const tier = Math.min(numColors - 1, Math.floor((i / 256) * numColors));
      const c = activePalette[tier];
      lut[i * 3] = c[0];
      lut[i * 3 + 1] = c[1];
      lut[i * 3 + 2] = c[2];
    }

    const contrastBoost = 1.0 + (intensity / 100) * 0.5;

    for (let i = 0; i < src.length; i += 4) {
      let lum = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
      if (contrastBoost !== 1.0) {
        lum = Math.max(0, Math.min(255, Math.round(128 + (lum - 128) * contrastBoost)));
      }
      const idx = lum * 3;
      out[i] = lut[idx];
      out[i + 1] = lut[idx + 1];
      out[i + 2] = lut[idx + 2];
      out[i + 3] = src[i + 3];
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- COLOR SEPARATION (CMYK OFFSET) ---
  static applyColorSeparation(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: shiftParam } = this._resolveCtx(a1, a2, a3, a4, a5);
    const shift = shiftParam !== undefined ? shiftParam : 10;

    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const angle = 0.52;
    const dx = Math.round(shift * Math.cos(angle));
    const dy = Math.round(shift * Math.sin(angle));

    for (let y = 0; y < height; y++) {
      const yCyan = Math.max(0, y - dy);
      const yYellow = Math.min(height - 1, y + dy);
      const rowIdx = y * width * 4;

      for (let x = 0; x < width; x++) {
        const xCyan = Math.max(0, x - dx);
        const xYellow = Math.min(width - 1, x + dx);

        const idxCyan = (yCyan * width + xCyan) * 4;
        const idxCenter = (y * width + x) * 4;
        const idxYellow = (yYellow * width + xYellow) * 4;

        const dIdx = rowIdx + x * 4;
        out[dIdx] = src[idxCyan];
        out[dIdx + 1] = src[idxCenter + 1];
        out[dIdx + 2] = src[idxYellow + 2];
        out[dIdx + 3] = src[idxCenter + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- THERMAL HEATMAP ---
  static applyThermalHeatmap(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let r, g, b;
      if (t < 0.25) {
        const s = t / 0.25;
        r = Math.round(10 + s * 25);
        g = Math.round(10 + s * 45);
        b = Math.round(85 + s * 140);
      } else if (t < 0.5) {
        const s = (t - 0.25) / 0.25;
        r = Math.round(35 + s * 165);
        g = Math.round(55 - s * 25);
        b = Math.round(225 - s * 65);
      } else if (t < 0.75) {
        const s = (t - 0.5) / 0.25;
        r = Math.round(200 + s * 55);
        g = Math.round(30 + s * 185);
        b = Math.round(160 - s * 140);
      } else {
        const s = (t - 0.75) / 0.25;
        r = 255;
        g = Math.round(215 + s * 40);
        b = Math.round(20 + s * 235);
      }
      lut[i * 3] = r;
      lut[i * 3 + 1] = g;
      lut[i * 3 + 2] = b;
    }

    for (let i = 0; i < src.length; i += 4) {
      const lum = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
      const idx = lum * 3;
      out[i] = lut[idx];
      out[i + 1] = lut[idx + 1];
      out[i + 2] = lut[idx + 2];
      out[i + 3] = src[i + 3];
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- DUOTONE / RISOGRAPH ---
  static applyDuotone(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const dark = [15, 23, 42];
    const light = [251, 113, 133];

    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      lut[i * 3] = Math.round(dark[0] * (1 - t) + light[0] * t);
      lut[i * 3 + 1] = Math.round(dark[1] * (1 - t) + light[1] * t);
      lut[i * 3 + 2] = Math.round(dark[2] * (1 - t) + light[2] * t);
    }

    for (let i = 0; i < src.length; i += 4) {
      const lum = (src[i] * 77 + src[i + 1] * 150 + src[i + 2] * 29) >> 8;
      const idx = lum * 3;
      out[i] = lut[idx];
      out[i + 1] = lut[idx + 1];
      out[i + 2] = lut[idx + 2];
      out[i + 3] = src[i + 3];
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- HALFTONE DOTS ---
  static applyHalftone(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: dotSpacing } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;

    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += dotSpacing) {
      for (let x = 0; x < width; x += dotSpacing) {
        const sx = Math.min(width - 1, x + Math.floor(dotSpacing / 2));
        const sy = Math.min(height - 1, y + Math.floor(dotSpacing / 2));
        const idx = (sy * width + sx) * 4;

        const r = src[idx];
        const g = src[idx + 1];
        const b = src[idx + 2];
        const luminance = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        const maxR = dotSpacing * 0.7;
        const currentR = luminance * maxR;

        if (currentR > 0.5) {
          tCtx.beginPath();
          tCtx.arc(sx, sy, currentR, 0, Math.PI * 2);
          tCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          tCtx.fill();
        }
      }
    }
  }

  // --- FAST MULTI-PASS BOX BLUR (STACK BLUR APPROXIMATION) ---
  static fastStackBlur(ctx, x, y, width, height, radius) {
    if (radius < 1) return;
    const imgData = ctx.getImageData(x, y, width, height);
    const pixels = imgData.data;

    this.boxBlurPass(pixels, width, height, radius);
    this.boxBlurPass(pixels, width, height, radius);
    this.boxBlurPass(pixels, width, height, radius);

    ctx.putImageData(imgData, x, y);
  }

  // Cached scratch buffer to eliminate garbage-collection pressure during real-time slider drags
  static _scratchBuffer = null;

  static boxBlurPass(data, w, h, r) {
    const total = w * h;
    const neededSize = total * 4;
    if (!this._scratchBuffer || this._scratchBuffer.length < neededSize) {
      this._scratchBuffer = new Float32Array(neededSize);
    }
    const temp = this._scratchBuffer;

    // Horizontal pass
    for (let y = 0; y < h; y++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;
      const rowOffset = y * w;

      for (let i = -r; i <= r; i++) {
        const clampedX = Math.max(0, Math.min(w - 1, i));
        const idx = (rowOffset + clampedX) * 4;
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        sumA += data[idx + 3];
      }

      const div = r * 2 + 1;
      for (let x = 0; x < w; x++) {
        const curIdx = (rowOffset + x) * 4;
        temp[curIdx] = sumR / div;
        temp[curIdx + 1] = sumG / div;
        temp[curIdx + 2] = sumB / div;
        temp[curIdx + 3] = sumA / div;

        const xLeft = Math.max(0, x - r);
        const xRight = Math.min(w - 1, x + r + 1);
        const idxL = (rowOffset + xLeft) * 4;
        const idxR = (rowOffset + xRight) * 4;

        sumR += data[idxR] - data[idxL];
        sumG += data[idxR + 1] - data[idxL + 1];
        sumB += data[idxR + 2] - data[idxL + 2];
        sumA += data[idxR + 3] - data[idxL + 3];
      }
    }

    // Vertical pass
    for (let x = 0; x < w; x++) {
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

      for (let i = -r; i <= r; i++) {
        const clampedY = Math.max(0, Math.min(h - 1, i));
        const idx = (clampedY * w + x) * 4;
        sumR += temp[idx];
        sumG += temp[idx + 1];
        sumB += temp[idx + 2];
        sumA += temp[idx + 3];
      }

      const div = r * 2 + 1;
      for (let y = 0; y < h; y++) {
        const curIdx = (y * w + x) * 4;
        data[curIdx] = Math.round(sumR / div);
        data[curIdx + 1] = Math.round(sumG / div);
        data[curIdx + 2] = Math.round(sumB / div);
        data[curIdx + 3] = Math.round(sumA / div);

        const yTop = Math.max(0, y - r);
        const yBottom = Math.min(h - 1, y + r + 1);
        const idxT = (yTop * w + x) * 4;
        const idxB = (yBottom * w + x) * 4;

        sumR += temp[idxB] - temp[idxT];
        sumG += temp[idxB + 1] - temp[idxT + 1];
        sumB += temp[idxB + 2] - temp[idxT + 2];
        sumA += temp[idxB + 3] - temp[idxT + 3];
      }
    }
  }

  // --- CYBERPUNK GLITCH & DATA-BEND ---
  static applyGlitch(a1, a2, a3, a4, a5, a6) {
    const { sCtx, tCtx, width, height, p1: shift, p2: blockSize } = this._resolveCtx(a1, a2, a3, a4, a5, a6);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const numSlices = Math.ceil(height / blockSize);
    const sliceOffsets = new Int32Array(numSlices);
    for (let s = 0; s < numSlices; s++) {
      const rand = Math.sin(s * 91.37 + 13.5) * 43758.5453;
      const frac = rand - Math.floor(rand);
      if (frac > 0.35) {
        sliceOffsets[s] = Math.round((frac * 2 - 1) * shift);
      } else {
        sliceOffsets[s] = 0;
      }
    }

    const rgbOffset = Math.max(2, Math.round(shift * 0.4));

    for (let y = 0; y < height; y++) {
      const sliceIdx = Math.floor(y / blockSize);
      const xOffset = sliceOffsets[sliceIdx];
      const isScanline = (y % 3 === 0);
      const scanDim = isScanline ? 0.8 : 1.0;

      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;

        const rx = Math.max(0, Math.min(width - 1, x + xOffset - rgbOffset));
        const rIdx = (y * width + rx) * 4;

        const gx = Math.max(0, Math.min(width - 1, x + xOffset));
        const gIdx = (y * width + gx) * 4;

        const bx = Math.max(0, Math.min(width - 1, x + xOffset + rgbOffset));
        const bIdx = (y * width + bx) * 4;

        out[destIdx] = Math.min(255, Math.round(src[rIdx] * scanDim));
        out[destIdx + 1] = Math.min(255, Math.round(src[gIdx] * scanDim));
        out[destIdx + 2] = Math.min(255, Math.round(src[bIdx] * scanDim));
        out[destIdx + 3] = src[gIdx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- RETRO ASCII / MATRIX TERMINAL ---
  static applyMatrixAscii(a1, a2, a3, a4, a5, a6) {
    const { sCtx, tCtx, width, height, p1: cellSize, p2: intensity } = this._resolveCtx(a1, a2, a3, a4, a5, a6);
    const src = sCtx.getImageData(0, 0, width, height).data;

    tCtx.fillStyle = '#060a08';
    tCtx.fillRect(0, 0, width, height);

    tCtx.font = `bold ${Math.round(cellSize * 0.9)}px "Courier New", Courier, monospace`;
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';

    const chars = [' ', '.', ':', '-', '=', '+', '*', '%', '#', '@'];
    const boost = 1 + (intensity / 100) * 0.5;

    for (let y = 0; y < height; y += cellSize) {
      for (let x = 0; x < width; x += cellSize) {
        let sumL = 0;
        let count = 0;
        const maxY = Math.min(height, y + cellSize);
        const maxX = Math.min(width, x + cellSize);

        for (let py = y; py < maxY; py += 2) {
          for (let px = x; px < maxX; px += 2) {
            const idx = (py * width + px) * 4;
            sumL += 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
            count++;
          }
        }

        const avgL = count > 0 ? (sumL / count) : 0;
        if (avgL < 15) continue;

        const charIdx = Math.min(chars.length - 1, Math.floor((avgL / 255) * chars.length));
        const char = chars[charIdx];

        const g = Math.min(255, Math.round(Math.min(255, 60 + avgL * 0.8) * boost));
        const r = Math.round(g * 0.18);
        const b = Math.round(g * 0.28);

        tCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        tCtx.fillText(char, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // --- HYDRODYNAMIC LIQUID SWIRL ---
  static applyLiquidSwirl(a1, a2, a3, a4, a5, a6) {
    const { sCtx, tCtx, width, height, p1: twist, p2: radius } = this._resolveCtx(a1, a2, a3, a4, a5, a6);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const step = Math.max(40, Math.round(radius * 1.3));
    const centers = [];
    for (let cy = Math.round(radius * 0.5); cy < height + radius; cy += step) {
      for (let cx = Math.round(radius * 0.5); cx < width + radius; cx += step) {
        const dir = ((Math.floor(cx / step) + Math.floor(cy / step)) % 2 === 0) ? 1 : -1;
        centers.push({ x: cx, y: cy, dir: dir });
      }
    }

    const rSq = radius * radius;
    const absTwist = Math.abs(twist) > 0.05 ? twist : 2.5;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let nearestCenter = null;
        let minDSq = Infinity;

        for (let i = 0; i < centers.length; i++) {
          const c = centers[i];
          const dx = x - c.x;
          const dy = y - c.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDSq) {
            minDSq = dSq;
            nearestCenter = c;
          }
        }

        let sx = x;
        let sy = y;

        if (nearestCenter && minDSq < rSq) {
          const dist = Math.sqrt(minDSq);
          const ratio = (1 - dist / radius);
          const angle = absTwist * nearestCenter.dir * ratio * ratio;

          const dx = x - nearestCenter.x;
          const dy = y - nearestCenter.y;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          sx = Math.round(nearestCenter.x + dx * cosA - dy * sinA);
          sy = Math.round(nearestCenter.y + dx * sinA + dy * cosA);

          sx = Math.max(0, Math.min(width - 1, sx));
          sy = Math.max(0, Math.min(height - 1, sy));
        }

        const destIdx = (y * width + x) * 4;
        const srcIdx = (sy * width + sx) * 4;

        out[destIdx] = src[srcIdx];
        out[destIdx + 1] = src[srcIdx + 1];
        out[destIdx + 2] = src[srcIdx + 2];
        out[destIdx + 3] = src[srcIdx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- REEDED / FLUTED PRIVACY GLASS ---
  static applyReededGlass(a1, a2, a3, a4, a5, a6) {
    const { sCtx, tCtx, width, height, p1: pitch, p2: amplitude } = this._resolveCtx(a1, a2, a3, a4, a5, a6);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const twoPi = Math.PI * 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const phase = (x % pitch) / pitch;
        const sinVal = Math.sin(phase * twoPi);
        const cosVal = Math.cos(phase * twoPi);

        const dispG = sinVal * amplitude;
        const dispR = sinVal * (amplitude * 1.05);
        const dispB = sinVal * (amplitude * 0.95);

        const rx = Math.max(0, Math.min(width - 1, Math.round(x + dispR)));
        const gx = Math.max(0, Math.min(width - 1, Math.round(x + dispG)));
        const bx = Math.max(0, Math.min(width - 1, Math.round(x + dispB)));

        const rIdx = (y * width + rx) * 4;
        const gIdx = (y * width + gx) * 4;
        const bIdx = (y * width + bx) * 4;
        const destIdx = (y * width + x) * 4;

        const specular = cosVal > 0.88 ? Math.round((cosVal - 0.88) * 85) : 0;

        out[destIdx] = Math.min(255, src[rIdx] + specular);
        out[destIdx + 1] = Math.min(255, src[gIdx + 1] + specular);
        out[destIdx + 2] = Math.min(255, src[bIdx + 2] + specular);
        out[destIdx + 3] = src[gIdx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // --- FILM GRAIN & ANALOG TEXTURE ---
  static applyFilmGrain(a1, a2, a3, a4, a5) {
    const { sCtx, tCtx, width, height, p1: strength } = this._resolveCtx(a1, a2, a3, a4, a5);
    const srcImg = sCtx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = tCtx.createImageData(width, height);
    const out = outImg.data;

    const amp = (strength / 100) * 14;

    for (let y = 0; y < height; y++) {
      const yWave = Math.sin(y * 0.73);
      for (let x = 0; x < width; x++) {
        const xWave = Math.cos(x * 0.89);
        const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

        const delta = Math.round((xWave * yWave * 0.75 + noise * 0.25) * amp);

        const idx = (y * width + x) * 4;
        out[idx] = Math.max(0, Math.min(255, src[idx] + delta));
        out[idx + 1] = Math.max(0, Math.min(255, src[idx + 1] + delta));
        out[idx + 2] = Math.max(0, Math.min(255, src[idx + 2] + delta));
        out[idx + 3] = src[idx + 3];
      }
    }

    tCtx.putImageData(outImg, 0, 0);
  }

  // Backwards compatibility alias
  static applyAiCloaking(a1, a2, a3, a4, a5) {
    return this.applyFilmGrain(a1, a2, a3, a4, a5);
  }
}
