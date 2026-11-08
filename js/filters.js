// High-performance image filter routines
// Pre-renders filtered layer copies for seamless real-time masking

export class FilterEngine {
  /**
   * Applies the selected filter to a source canvas/image and returns a filtered canvas
   * @param {HTMLCanvasElement|HTMLImageElement} source 
   * @param {string} filterType - 'natural_blur' | 'heavy_blur' | 'mosaic' | 'hex_mosaic' | 'frosted' | 'motion' | 'halftone' | 'blackout'
   * @param {number} intensity - 0 to 100
   * @param {number} sizeParam - 0 to 100
   * @param {string} colorParam - e.g. '#000000'
   * @param {number} angleParam - 0 to 180 (for directional brush smear, defaults to 0 horizontal)
   */
  static applyFilter(source, filterType, intensity = 50, sizeParam = 50, colorParam = '#000000', angleParam = 0) {
    const width = source.width;
    const height = source.height;
    const canvas = document.createElement('canvas');
    if (!width || !height) return canvas;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw base copy
    ctx.drawImage(source, 0, 0);

    switch (filterType) {
      case 'natural_blur': {
        const radius = Math.max(2, Math.round((intensity / 100) * 45));
        this.fastStackBlur(ctx, 0, 0, width, height, radius);
        break;
      }

      case 'heavy_blur': {
        const radius = Math.max(8, Math.round((intensity / 100) * 90));
        this.fastStackBlur(ctx, 0, 0, width, height, radius);
        break;
      }

      case 'mosaic': {
        // Block size based on sizeParam (4px to 64px)
        const blockSize = Math.max(4, Math.round(4 + (sizeParam / 100) * 60));
        this.applySquareMosaic(ctx, width, height, blockSize);
        break;
      }

      case 'hex_mosaic': {
        const radius = Math.max(6, Math.round(6 + (sizeParam / 100) * 50));
        this.applyHexMosaic(ctx, width, height, radius);
        break;
      }

      case 'frosted': {
        const strength = Math.max(3, Math.round((intensity / 100) * 35));
        this.applyFrostedGlass(ctx, width, height, strength);
        break;
      }

      case 'motion': {
        const distance = Math.max(5, Math.round((intensity / 100) * 60));
        this.applyMotionBlur(ctx, width, height, distance);
        break;
      }

      case 'brush_stroke': {
        const distance = Math.max(6, Math.round((intensity / 100) * 75));
        this.applyBrushStrokeBlur(ctx, width, height, distance, sizeParam, angleParam);
        break;
      }

      case 'zoom_blur': {
        const factor = Math.max(0.04, (intensity / 100) * 0.28);
        this.applyRadialZoomBlur(ctx, width, height, factor);
        break;
      }

      case 'chromatic': {
        const distance = Math.max(4, Math.round((intensity / 100) * 40));
        this.applyChromaticBlur(ctx, width, height, distance);
        break;
      }

      case 'pop_art': {
        const levels = Math.max(2, Math.min(6, Math.round(2 + (sizeParam / 100) * 4)));
        this.applyPopArt(ctx, width, height, levels, intensity);
        break;
      }

      case 'color_separation': {
        const shift = Math.max(2, Math.round(2 + (intensity / 100) * 28));
        this.applyColorSeparation(ctx, width, height, shift);
        break;
      }

      case 'thermal': {
        this.applyThermalHeatmap(ctx, width, height, intensity);
        break;
      }

      case 'duotone': {
        this.applyDuotone(ctx, width, height, intensity);
        break;
      }

      case 'glitch': {
        const shift = Math.max(4, Math.round(4 + (intensity / 100) * 40));
        const blockSize = Math.max(4, Math.round(4 + (sizeParam / 100) * 24));
        this.applyGlitch(ctx, width, height, shift, blockSize);
        break;
      }

      case 'matrix_ascii': {
        const cellSize = Math.max(8, Math.round(8 + (sizeParam / 100) * 16));
        this.applyMatrixAscii(ctx, width, height, cellSize, intensity);
        break;
      }

      case 'liquid_swirl': {
        const twist = ((intensity / 100) * 8.0 - 4.0) || 2.5;
        const radius = Math.max(30, Math.round(30 + (sizeParam / 100) * 120));
        this.applyLiquidSwirl(ctx, width, height, twist, radius);
        break;
      }

      case 'reeded_glass': {
        const pitch = Math.max(12, Math.round(12 + (sizeParam / 100) * 40));
        const amplitude = Math.max(3, Math.round(3 + (intensity / 100) * 30));
        this.applyReededGlass(ctx, width, height, pitch, amplitude);
        break;
      }

      case 'ai_cloaking': {
        const strength = Math.max(5, Math.round(5 + (intensity / 100) * 45));
        this.applyAiCloaking(ctx, width, height, strength);
        break;
      }

      case 'halftone': {
        const dotSize = Math.max(6, Math.round(6 + (sizeParam / 100) * 30));
        this.applyHalftone(ctx, width, height, dotSize);
        break;
      }

      case 'blackout': {
        ctx.fillStyle = colorParam || '#000000';
        ctx.fillRect(0, 0, width, height);
        break;
      }

      default:
        // Default to natural blur
        this.fastStackBlur(ctx, 0, 0, width, height, 16);
    }

    return canvas;
  }

  // --- SQUARE MOSAIC / PIXELATE ---
  static applySquareMosaic(ctx, width, height, blockSize) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        // Sample center of block
        const sampleX = Math.min(width - 1, x + Math.floor(blockSize / 2));
        const sampleY = Math.min(height - 1, y + Math.floor(blockSize / 2));
        const sampleIdx = (sampleY * width + sampleX) * 4;

        const r = data[sampleIdx];
        const g = data[sampleIdx + 1];
        const b = data[sampleIdx + 2];
        const a = data[sampleIdx + 3];

        // Fill entire block
        const blockW = Math.min(blockSize, width - x);
        const blockH = Math.min(blockSize, height - y);

        for (let by = 0; by < blockH; by++) {
          for (let bx = 0; bx < blockW; bx++) {
            const idx = ((y + by) * width + (x + bx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = a;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- HEXAGONAL MOSAIC ---
  static applyHexMosaic(ctx, width, height, radius) {
    const srcImgData = ctx.getImageData(0, 0, width, height);
    const src = srcImgData.data;

    // Create fresh canvas to render geometric hex paths
    ctx.clearRect(0, 0, width, height);

    const s = radius;
    const h = s * Math.sqrt(3) / 2;

    const cols = Math.ceil(width / (s * 1.5)) + 2;
    const rows = Math.ceil(height / (h * 2)) + 2;

    for (let col = -1; col < cols; col++) {
      for (let row = -1; row < rows; row++) {
        const cx = col * 1.5 * s;
        const cy = row * 2 * h + (col % 2 !== 0 ? h : 0);

        // Sample center color
        const clampX = Math.max(0, Math.min(width - 1, Math.round(cx)));
        const clampY = Math.max(0, Math.min(height - 1, Math.round(cy)));
        const idx = (clampY * width + clampX) * 4;

        ctx.fillStyle = `rgb(${src[idx]}, ${src[idx + 1]}, ${src[idx + 2]})`;
        ctx.strokeStyle = `rgba(0, 0, 0, 0.15)`;
        ctx.lineWidth = 1;

        // Draw hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + s * Math.cos(angle);
          const hy = cy + s * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // --- FROSTED GLASS / CRYSTAL ---
  static applyFrostedGlass(ctx, width, height, strength) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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

    ctx.putImageData(outImg, 0, 0);
    // Smooth out frost with light 2px blur
    this.fastStackBlur(ctx, 0, 0, width, height, 2);
  }

  // --- MOTION BLUR ---
  static applyMotionBlur(ctx, width, height, distance) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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
    ctx.putImageData(outImg, 0, 0);
  }

  // --- RADIAL ZOOM / BURST BLUR ---
  // High-energy optical zoom burst radiating outward from image center
  static applyRadialZoomBlur(ctx, width, height, factor, centerX = width / 2, centerY = height / 2) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
    const out = outImg.data;

    const samples = 14;
    const weights = new Float32Array(samples);
    let totalWeight = 0;
    for (let s = 0; s < samples; s++) {
      // Gentle taper towards outer rays
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- CHROMATIC PRISM BLUR ---
  // Staggered RGB channel split with directional prismatic dispersion
  static applyChromaticBlur(ctx, width, height, distance) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
    const out = outImg.data;

    const angle = 0.58; // ~33 degrees diagonal prism angle
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
      // Red shifted forward along prism axis
      redOffsetsX[s] = Math.round(s * step * cosA);
      redOffsetsY[s] = Math.round(s * step * sinA);
      // Blue shifted backward along prism axis
      blueOffsetsX[s] = Math.round(-s * step * cosA);
      blueOffsetsY[s] = Math.round(-s * step * sinA);
      // Green centered with mild softness
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- PAINT BRUSH STROKE BLUR ---
  // Directional painterly blur similar to motion blur, infused with natural wrist angle,
  // Hann-window weighted pigment smear, and multi-strand bristle hair striations.
  static applyBrushStrokeBlur(ctx, width, height, distance, sizeParam = 50, angleDeg = 135) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
    const out = outImg.data;

    // Angle of hand sweep (0° horizontal, 90° vertical, 135° diagonal wrist sweep)
    const angle = -((angleDeg % 180)) * (Math.PI / 180);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpCos = -sinA;
    const perpSin = cosA;

    // Scale sample count with distance while keeping execution snappy
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
      // Hann-window cosine bell taper for velvety painterly blending
      const w = 0.54 + 0.46 * Math.cos((s / halfSamples) * Math.PI * 0.85);
      weights[idx] = w;
      totalWeight += w;
    }
    for (let i = 0; i < samples; i++) {
      weights[i] /= totalWeight;
    }

    // Precomputed 512-entry bristle texture LUT (harmonic hair striations & micro-grooves)
    const bristleLUT = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const h1 = Math.sin(i * 0.18) * 0.07;
      const h2 = Math.sin(i * 0.53 + 1.2) * 0.04;
      const h3 = Math.cos(i * 1.15 + 2.7) * 0.025;
      bristleLUT[i] = 1.0 + (h1 + h2 + h3);
    }

    const bristleFreq = 0.35 / Math.max(0.2, (sizeParam / 50));
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

        // Apply bristle track modulation along orthogonal brush plane
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- POP ART POSTERIZE ---
  // High-contrast tonal quantization into bold screenprint pop-art palette
  static applyPopArt(ctx, width, height, levels = 4, intensity = 50) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Iconic pop-art screenprint palettes
    const palette4 = [
      [15, 23, 42],    // Deep Ink
      [220, 38, 38],   // Vibrant Crimson
      [245, 158, 11],  // Amber Gold
      [254, 243, 199]  // Vintage Paper
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

    // Precompute 256-entry LUT for instant mapping
    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const tier = Math.min(numColors - 1, Math.floor((i / 256) * numColors));
      const c = activePalette[tier];
      lut[i * 3] = c[0];
      lut[i * 3 + 1] = c[1];
      lut[i * 3 + 2] = c[2];
    }

    const contrastBoost = 1.0 + (intensity / 100) * 0.5;

    for (let i = 0; i < data.length; i += 4) {
      let lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      if (contrastBoost !== 1.0) {
        lum = Math.max(0, Math.min(255, Math.round(128 + (lum - 128) * contrastBoost)));
      }
      const idx = lum * 3;
      data[i] = lut[idx];
      data[i + 1] = lut[idx + 1];
      data[i + 2] = lut[idx + 2];
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // --- COLOR SEPARATION (CMYK OFFSET) ---
  // Vintage mechanical printing press misregistration with shifted color plates
  static applyColorSeparation(ctx, width, height, shift = 10) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
    const out = outImg.data;

    const angle = 0.52; // ~30 degrees plate shift
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
        out[dIdx] = src[idxCyan];        // Cyan/Red plate shifted
        out[dIdx + 1] = src[idxCenter + 1]; // Magenta/Green plate centered
        out[dIdx + 2] = src[idxYellow + 2]; // Yellow/Blue plate shifted
        out[dIdx + 3] = src[idxCenter + 3];
      }
    }

    ctx.putImageData(outImg, 0, 0);
  }

  // --- THERMAL HEATMAP ---
  // False-color infrared temperature spectrum (Navy -> Purple -> Orange -> White)
  static applyThermalHeatmap(ctx, width, height, intensity = 50) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

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

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      const idx = lum * 3;
      data[i] = lut[idx];
      data[i + 1] = lut[idx + 1];
      data[i + 2] = lut[idx + 2];
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // --- DUOTONE / RISOGRAPH ---
  // Graphic two-tone gradient mapping (Deep Navy to Electric Coral)
  static applyDuotone(ctx, width, height, intensity = 50) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const dark = [15, 23, 42];     // Deep Navy (#0f172a)
    const light = [251, 113, 133]; // Electric Coral (#fb7185)

    const lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      lut[i * 3] = Math.round(dark[0] * (1 - t) + light[0] * t);
      lut[i * 3 + 1] = Math.round(dark[1] * (1 - t) + light[1] * t);
      lut[i * 3 + 2] = Math.round(dark[2] * (1 - t) + light[2] * t);
    }

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      const idx = lum * 3;
      data[i] = lut[idx];
      data[i + 1] = lut[idx + 1];
      data[i + 2] = lut[idx + 2];
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // --- HALFTONE DOTS ---
  static applyHalftone(ctx, width, height, dotSpacing) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

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
          ctx.beginPath();
          ctx.arc(sx, sy, currentR, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill();
        }
      }
    }
  }

  // --- FAST MULTI-PASS BOX BLUR (STACK BLUR APPROXIMATION) ---
  static fastStackBlur(ctx, x, y, width, height, radius) {
    if (radius < 1) return;
    const imgData = ctx.getImageData(x, y, width, height);
    const pixels = imgData.data;

    // 3 passes of box blur yields high-quality Gaussian approximation
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
  static applyGlitch(ctx, width, height, shift, blockSize) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- RETRO ASCII / MATRIX TERMINAL ---
  static applyMatrixAscii(ctx, width, height, cellSize, intensity) {
    const src = ctx.getImageData(0, 0, width, height).data;

    ctx.fillStyle = '#060a08';
    ctx.fillRect(0, 0, width, height);

    ctx.font = `bold ${Math.round(cellSize * 0.9)}px "Courier New", Courier, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillText(char, x + cellSize / 2, y + cellSize / 2);
      }
    }
  }

  // --- HYDRODYNAMIC LIQUID SWIRL ---
  static applyLiquidSwirl(ctx, width, height, twist, radius) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- REEDED / FLUTED PRIVACY GLASS ---
  static applyReededGlass(ctx, width, height, pitch, amplitude) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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

    ctx.putImageData(outImg, 0, 0);
  }

  // --- ADVERSARIAL AI CLOAKING / ANTI-FACIAL RECOGNITION ---
  static applyAiCloaking(ctx, width, height, strength) {
    const srcImg = ctx.getImageData(0, 0, width, height);
    const src = srcImg.data;
    const outImg = ctx.createImageData(width, height);
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

    ctx.putImageData(outImg, 0, 0);
  }
}
