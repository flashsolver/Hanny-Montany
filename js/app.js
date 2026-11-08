// Master Application Controller

import { CanvasEngine } from './canvas-engine.js';
import { SAMPLE_IMAGES } from './sample-images.js';
import { STICKERS, STICKER_CATEGORIES, getStickerDataUrl } from './stickers-data.js';
import { AITools } from './ai-tools.js';
import { ModalManager } from './modal-manager.js';

class BlurMosaicApp {
  constructor() {
    this.viewport = document.getElementById('canvas-viewport');
    this.engine = new CanvasEngine(this.viewport);

    this.currentMode = 'blur'; // 'blur' | 'artistic' | 'stickers' | 'smart-ai'
    this.selectedStickerCategory = 'all';
    this.pendingAI = null;

    this.initDOM();
    this.initSampleImages();
    this.initStickersUI();
    this.initFilterCategories();
    this.initQuickSliders();
    this.initEventListeners();
    this.initHistoryObserver();

    // Load initial sample
    this.loadSample('realistic');
  }

  initDOM() {
    this.modeTabs = document.querySelectorAll('.mode-tab');
    this.carouselFilters = document.getElementById('carousel-filters');
    this.filterCategoryTabs = document.getElementById('filter-category-tabs');
    this.carouselArtistic = document.getElementById('carousel-artistic');
    this.carouselStickersContainer = document.getElementById('carousel-stickers-container');
    this.shelfSmartAI = document.getElementById('shelf-smart-ai');
    this.brushStrokesBar = document.getElementById('brush-strokes-bar');
    this.strokePills = document.querySelectorAll('#stroke-style-options .stroke-pill');
    this.shapePills = document.querySelectorAll('.shape-pill');
    this.strokeStyleOptions = document.getElementById('stroke-style-options');
    this.strokeAngleOptions = document.getElementById('stroke-angle-options');
    this.anglePills = document.querySelectorAll('.angle-pill');

    // AI Preview Bar
    this.aiPreviewBar = document.getElementById('ai-preview-bar');
    this.aiPreviewSummary = document.getElementById('ai-preview-summary');
    this.btnAIApply = document.getElementById('btn-ai-apply');
    this.btnAIDismiss = document.getElementById('btn-ai-dismiss');

    // AI Action Buttons
    this.btnAIFace = document.getElementById('btn-ai-face');
    this.btnAIText = document.getElementById('btn-ai-text');
    this.btnAIBackground = document.getElementById('btn-ai-background');
    this.btnInpaintApply = document.getElementById('btn-inpaint-apply');

    // Sliders
    this.sliderSize = document.getElementById('slider-size');
    this.labelSize = document.getElementById('label-size');
    this.groupSize = document.getElementById('group-size');
    this.sliderIntensity = document.getElementById('slider-intensity');
    this.labelIntensity = document.getElementById('label-intensity');
    this.groupIntensity = document.getElementById('group-intensity');
    this.sliderOpacity = document.getElementById('slider-opacity');
    this.labelOpacity = document.getElementById('label-opacity');
    this.groupOpacity = document.getElementById('group-opacity');
    this.btnDeleteSticker = document.getElementById('btn-delete-sticker');

    // History and Action buttons
    this.btnUndo = document.getElementById('btn-undo');
    this.btnRedo = document.getElementById('btn-redo');
    this.btnEraser = document.getElementById('btn-eraser');
    this.btnInvert = document.getElementById('btn-invert');
    this.btnInvertMask = document.getElementById('btn-invert-mask');
    this.btnClear = document.getElementById('btn-clear');
    this.btnExport = document.getElementById('btn-export');
    this.btnResetZoom = document.getElementById('btn-reset-zoom');
    this.btnCompare = document.getElementById('btn-compare');
    this.btnManual = document.getElementById('btn-manual');
    this.toast = document.getElementById('toast-notice');

    this.sampleSelect = document.getElementById('sample-select');
    this.fileInput = document.getElementById('file-input');

    // Modal Dialog Manager (Clear, Export, User Manual)
    this.modals = new ModalManager({
      onClearConfirm: () => {
        this.dismissAIPreview();
        this.engine.resetAll();
        this.showToast('All edits cleared');
      },
      onExportExecute: (format, quality) => {
        this.executeExport(format, quality);
      },
      showToast: (msg) => this.showToast(msg)
    });
  }

  initHistoryObserver() {
    this.engine.onHistoryChanged = ({ canUndo, canRedo }) => {
      this.btnUndo.disabled = !canUndo;
      this.btnRedo.disabled = !canRedo;
    };
  }

  initSampleImages() {
    if (this.sampleSelect) {
      this.sampleSelect.value = 'realistic';
      this.sampleSelect.addEventListener('change', (e) => {
        this.loadSample(e.target.value);
      });
    }
  }

  loadSample(sampleId) {
    const sample = SAMPLE_IMAGES.find(s => s.id === sampleId);
    if (sample) {
      if (this.sampleSelect) {
        this.sampleSelect.value = sampleId;
      }
      this.dismissAIPreview();
      this.engine.loadImage(sample.url, (err) => {
        console.error('Failed to load sample image:', err);
        this.showToast('Could not load sample image');
      });
      this.showToast(`Loaded: ${sample.name}`);
    }
  }

  initFilterCategories() {
    this.filterSubtabBtns = document.querySelectorAll('.filter-subtab-btn');
    this.filterCards = document.querySelectorAll('#carousel-filters .preset-card');

    this.filterSubtabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterSubtabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const cat = btn.dataset.filterCat;
        this.filterCards.forEach(card => {
          const match = (cat === 'all' || card.dataset.category === cat);
          card.style.display = match ? 'flex' : 'none';
        });

        if (this.carouselFilters) {
          this.carouselFilters.scrollTo({ left: 0, behavior: 'smooth' });
        }
      });
    });
  }

  initQuickSliders() {
    const quickSizePills = document.querySelectorAll('.quick-pill[data-quick-size]');
    const quickIntensityPills = document.querySelectorAll('.quick-pill[data-quick-intensity]');

    quickSizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.quickSize, 10);
        this.sliderSize.value = val;
        this.labelSize.textContent = `${val}px`;
        this.engine.brush.setSize(val);
        quickSizePills.forEach(p => p.classList.toggle('active', p === pill));

        this.engine.setFilter(this.engine.currentFilter, parseInt(this.sliderIntensity.value, 10), val);
      });
    });

    quickIntensityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseInt(pill.dataset.quickIntensity, 10);
        this.sliderIntensity.value = val;
        this.labelIntensity.textContent = `${val}%`;
        this.engine.setFilter(this.engine.currentFilter, val, parseInt(this.sliderSize.value, 10));
        quickIntensityPills.forEach(p => p.classList.toggle('active', p === pill));
      });
    });
  }

  initStickersUI() {
    const tabsContainer = document.getElementById('sticker-category-tabs');
    const stickersCarousel = document.getElementById('carousel-stickers');

    // Build category tabs
    tabsContainer.innerHTML = '';
    STICKER_CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `sticker-subtab-btn ${cat.id === this.selectedStickerCategory ? 'active' : ''}`;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        this.selectedStickerCategory = cat.id;
        document.querySelectorAll('.sticker-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderStickerItems();
      });
      tabsContainer.appendChild(btn);
    });

    this.renderStickerItems();
  }

  renderStickerItems() {
    const stickersCarousel = document.getElementById('carousel-stickers');
    stickersCarousel.innerHTML = '';

    const filtered = this.selectedStickerCategory === 'all'
      ? STICKERS
      : STICKERS.filter(s => s.category === this.selectedStickerCategory);

    filtered.forEach(sticker => {
      const card = document.createElement('div');
      card.className = 'preset-card';

      const thumb = document.createElement('div');
      thumb.className = 'preset-thumb';

      const img = document.createElement('img');
      img.className = 'sticker-thumb-img';
      img.src = getStickerDataUrl(sticker.svg);
      img.alt = sticker.name;
      thumb.appendChild(img);

      const title = document.createElement('span');
      title.className = 'preset-title';
      title.textContent = sticker.name;

      card.appendChild(thumb);
      card.appendChild(title);

      card.addEventListener('click', () => {
        // Spawn sticker in center of photo
        const cx = this.engine.sourceCanvas.width / 2;
        const cy = this.engine.sourceCanvas.height / 2;
        this.engine.stickers.addSticker(sticker, cx, cy);
        this.engine.saveHistoryState();
        this.engine.render();
        this.showToast(`Added: ${sticker.name}`);
      });

      stickersCarousel.appendChild(card);
    });
  }

  initEventListeners() {
    // Mode tabs switching
    this.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchMode(tab.dataset.mode);
      });
    });

    // Preset filter selection
    document.querySelectorAll('#carousel-filters .preset-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#carousel-filters .preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const filterType = card.dataset.filter;
        this.engine.setFilter(filterType, parseInt(this.sliderIntensity.value), parseInt(this.sliderSize.value));
        this.showToast(`Filter: ${card.querySelector('.preset-title').textContent}`);
        // Show angle options only for Brush Stroke blur
        if (this.strokeAngleOptions) {
          this.strokeAngleOptions.style.display = (filterType === 'brush_stroke') ? 'flex' : 'none';
        }
      });
    });

    // Mask Drawing Shape selection (Brush / Rect / Oval)
    this.shapePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.shapePills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        const shape = pill.dataset.drawShape;
        this.engine.setDrawShape(shape);
        if (this.strokeStyleOptions) {
          this.strokeStyleOptions.style.display = (shape === 'brush') ? 'flex' : 'none';
        }
        const name = pill.querySelector('span:last-child').textContent;
        this.showToast(`Tool: ${name}`);
      });
    });

    // Brush smear angle selection
    this.anglePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.anglePills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        const angle = parseInt(pill.dataset.angle, 10);
        this.engine.setFilterAngle(angle);
        const name = pill.querySelector('span:last-child').textContent;
        this.showToast(`Smear Angle: ${name}`);
      });
    });

    // Paintbrush Stroke type selection
    this.strokePills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.strokePills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        const strokeType = pill.dataset.stroke;
        this.engine.brush.setStrokeStyle(strokeType);
        const name = pill.querySelector('span:last-child').textContent;
        this.showToast(`Brush Stroke: ${name}`);
      });
    });

    // Artistic brush selection
    document.querySelectorAll('#carousel-artistic .preset-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#carousel-artistic .preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const brushType = card.dataset.brush;
        this.engine.brush.setBrushType(brushType);
        this.showToast(`Brush: ${card.querySelector('.preset-title').textContent}`);
      });
    });

    // Sliders
    this.sliderSize.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.labelSize.textContent = `${val}px`;
      this.engine.brush.setSize(val);
      document.querySelectorAll('.quick-pill[data-quick-size]').forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.quickSize, 10) === val);
      });
      this.engine.setFilter(this.engine.currentFilter, parseInt(this.sliderIntensity.value, 10), val);
    });

    this.sliderIntensity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.labelIntensity.textContent = `${val}%`;
      this.engine.setFilter(this.engine.currentFilter, val, parseInt(this.sliderSize.value, 10));
      document.querySelectorAll('.quick-pill[data-quick-intensity]').forEach(p => {
        p.classList.toggle('active', parseInt(p.dataset.quickIntensity, 10) === val);
      });
    });

    this.sliderOpacity.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.labelOpacity.textContent = `${val}%`;
      this.engine.stickers.setSelectedOpacity(val / 100);
      this.engine.render();
    });

    if (this.btnDeleteSticker) {
      this.btnDeleteSticker.addEventListener('click', () => {
        if (this.engine.stickers.selectedSticker) {
          this.engine.stickers.deleteSelected();
          this.engine.saveHistoryState();
          this.engine.render();
          this.showToast('Sticker deleted');
        }
      });
    }

    this.engine.onStickerDeleted = () => {
      this.showToast('Sticker deleted');
    };

    // History and Action buttons
    this.btnUndo.addEventListener('click', () => {
      if (this.engine.undo()) this.showToast('Undo');
    });

    this.btnRedo.addEventListener('click', () => {
      if (this.engine.redo()) this.showToast('Redo');
    });

    this.btnEraser.addEventListener('click', () => {
      const isEraser = !this.engine.brush.isEraser;
      this.engine.brush.setEraser(isEraser);
      this.btnEraser.classList.toggle('active', isEraser);
      this.btnEraser.setAttribute('aria-pressed', isEraser ? 'true' : 'false');
      this.showToast(isEraser ? 'Eraser: Restoring original image' : 'Brush: Applying blur');
    });

    this.btnInvert.addEventListener('click', () => {
      this.engine.invertMask();
      this.showToast('Mask inverted (reverse censor)');
    });

    if (this.btnInvertMask) {
      this.btnInvertMask.addEventListener('click', () => {
        this.engine.invertMask();
        this.showToast('Mask inverted (reverse censor)');
      });
    }

    // Modal Triggers
    if (this.btnManual) {
      this.btnManual.addEventListener('click', () => this.modals.openManualModal(this.btnManual));
    }
    this.btnClear.addEventListener('click', () => this.modals.openClearModal(this.btnClear));
    this.btnExport.addEventListener('click', () => {
      const hasImage = Boolean(this.engine.sourceCanvas && this.engine.sourceCanvas.width);
      const dimensions = hasImage ? { width: this.engine.sourceCanvas.width, height: this.engine.sourceCanvas.height } : null;
      this.modals.openExportModal(hasImage, this.btnExport, dimensions);
    });

    this.btnResetZoom.addEventListener('click', () => {
      this.engine.fitToScreen();
      this.showToast('Zoom reset to fit');
    });

    // Hold-to-Compare (Original view on pointer hold or Spacebar hold)
    if (this.btnCompare) {
      const startCompare = (e) => {
        if (e) e.preventDefault();
        this.engine.showOriginalOnly = true;
        this.btnCompare.classList.add('holding');
        this.engine.render();
      };
      const stopCompare = () => {
        if (this.engine.showOriginalOnly) {
          this.engine.showOriginalOnly = false;
          this.btnCompare.classList.remove('holding');
          this.engine.render();
        }
      };

      this.btnCompare.addEventListener('pointerdown', startCompare);
      window.addEventListener('pointerup', stopCompare);
      window.addEventListener('pointercancel', stopCompare);
      this.btnCompare.addEventListener('pointerleave', stopCompare);
    }

    // AI Actions
    this.btnAIFace.addEventListener('click', async () => {
      this.showToast('Scanning for faces...');
      try {
        const faces = await AITools.detectFaces(this.engine.sourceCanvas);
        if (!faces || faces.length === 0) {
          this.showToast('No faces found. Draw a box manually.');
          return;
        }
        this.pendingAI = { type: 'faces', data: faces };
        this.engine.setAIPreviewBoxes(faces);
        this.updateAIPreviewSummary();
        this.showAIPreviewBar();
      } catch (err) {
        this.showToast('Could not scan faces.');
      }
    });

    this.btnAIText.addEventListener('click', () => {
      this.showToast('Scanning for text-like areas...');
      try {
        const boxes = AITools.detectText(this.engine.sourceCanvas);
        if (!boxes || boxes.length === 0) {
          this.showToast('No readable text found. Draw a box manually.');
          return;
        }
        this.pendingAI = { type: 'text', data: boxes };
        this.engine.setAIPreviewBoxes(boxes);
        this.updateAIPreviewSummary();
        this.showAIPreviewBar();
      } catch (err) {
        this.showToast('Could not scan text.');
      }
    });

    this.btnAIBackground.addEventListener('click', () => {
      this.pendingAI = { type: 'background' };
      this.updateAIPreviewSummary();
      this.showAIPreviewBar();
    });

    // Wire AI box toggling from canvas clicks
    this.engine.onAIBoxToggled = (boxes) => {
      if (!this.pendingAI) return;
      this.pendingAI.data = boxes;
      this.updateAIPreviewSummary();
    };

    // AI Preview Commit & Dismiss
    this.btnAIApply.addEventListener('click', () => {
      if (!this.pendingAI) return;
      if (this.pendingAI.type === 'faces') {
        const active = (this.pendingAI.data || []).filter(b => b.included !== false);
        if (active.length > 0) {
          AITools.applyFaceMask(this.engine.maskCanvas, active);
        } else {
          this.showToast('Select at least one face to blur.');
          return;
        }
      } else if (this.pendingAI.type === 'text') {
        const active = (this.pendingAI.data || []).filter(b => b.included !== false);
        if (active.length > 0) {
          AITools.applyTextMask(this.engine.maskCanvas, active);
        } else {
          this.showToast('Select at least one text block to blur.');
          return;
        }
      } else if (this.pendingAI.type === 'background') {
        AITools.applyBackgroundMask(this.engine.maskCanvas);
      }
      this.engine.updateFilteredLayer();
      this.engine.saveHistoryState();
      this.dismissAIPreview();
      this.showToast('Blur applied.');
    });

    this.btnAIDismiss.addEventListener('click', () => {
      this.dismissAIPreview();
      this.showToast('Detection dismissed.');
    });

    // Inpaint apply button
    this.btnInpaintApply.addEventListener('click', () => {
      if (!AITools.hasMask(this.engine.maskCanvas)) {
        this.showToast('Brush over the object first, then tap Erase Object');
        this.switchMode('blur');
        return;
      }

      this.showToast('Erasing object...');
      setTimeout(() => {
        const success = AITools.inpaintObject(this.engine.sourceCanvas, this.engine.maskCanvas);
        if (success) {
          this.engine.updateFilteredLayer();
          this.engine.saveHistoryState({ sourceModified: true });
          this.engine.render();
          this.showToast('Object erased.');
        } else {
          this.showToast('Brush over the object first, then tap Erase Object');
          this.switchMode('blur');
        }
      }, 50);
    });

    // File input (custom image upload)
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.openImageFile(file);
        this.fileInput.value = '';
      }
    });

    // Window drag-and-drop for opening images from desktop
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.openImageFile(e.dataTransfer.files[0]);
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Delegate modal keyboard handling (Escape, Tab focus-trap, Enter)
      if (this.modals.handleKeydown(e)) return;

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        this.modals.openManualModal(this.btnManual);
        return;
      } else if (e.key === '[') {
        const cur = parseInt(this.sliderSize.value);
        const next = Math.max(4, cur - 5);
        this.sliderSize.value = next;
        this.sliderSize.dispatchEvent(new Event('input'));
      } else if (e.key === ']') {
        const cur = parseInt(this.sliderSize.value);
        const next = Math.min(150, cur + 5);
        this.sliderSize.value = next;
        this.sliderSize.dispatchEvent(new Event('input'));
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.engine.redo();
        else this.engine.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.engine.redo();
      } else if (e.key === 'Escape') {
        if (this.pendingAI) {
          this.dismissAIPreview();
        }
      } else if (e.key === 'Enter') {
        if (this.pendingAI && !this.btnAIApply.disabled) {
          e.preventDefault();
          this.btnAIApply.click();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.engine.stickers.selectedSticker) {
          this.engine.stickers.deleteSelected();
          this.engine.saveHistoryState();
          this.engine.render();
          this.showToast('Sticker deleted');
        }
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.engine.showOriginalOnly = true;
        if (this.btnCompare) this.btnCompare.classList.add('holding');
        this.engine.render();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.engine.showOriginalOnly) {
        e.preventDefault();
        this.engine.showOriginalOnly = false;
        if (this.btnCompare) this.btnCompare.classList.remove('holding');
        this.engine.render();
      }
    });

    // Sticker selection listener to reflect opacity
    this.engine.stickers.onSelectionChanged = (selected) => {
      if (selected) {
        if (this.currentMode === 'stickers') {
          this.groupOpacity.style.display = 'flex';
        }
        this.sliderOpacity.value = Math.round(selected.opacity * 100);
        this.labelOpacity.textContent = `${this.sliderOpacity.value}%`;
      } else if (this.currentMode !== 'stickers') {
        this.groupOpacity.style.display = 'none';
      }
    };
  }

  updateAIPreviewSummary() {
    if (!this.pendingAI) return;
    if (this.pendingAI.type === 'background') {
      this.aiPreviewSummary.textContent = 'Center focus (fixed ellipse)';
      this.btnAIApply.disabled = false;
      return;
    }
    const boxes = this.pendingAI.data || [];
    const total = boxes.length;
    const included = boxes.filter(b => b.included !== false).length;
    const unit = this.pendingAI.type === 'faces'
      ? (total === 1 ? 'face' : 'faces')
      : (total === 1 ? 'block' : 'blocks');
    this.aiPreviewSummary.textContent = `${included} of ${total} ${unit} selected`;
    this.btnAIApply.disabled = (included === 0);
  }

  showAIPreviewBar(summaryText) {
    if (summaryText) {
      this.aiPreviewSummary.textContent = summaryText;
    }
    this.aiPreviewBar.style.display = 'flex';
  }

  dismissAIPreview() {
    this.pendingAI = null;
    this.engine.clearAIPreviewBoxes();
    if (this.aiPreviewBar) {
      this.aiPreviewBar.style.display = 'none';
    }
  }

  async switchMode(mode) {
    this.currentMode = mode;

    // Update active tab button and aria-pressed attributes
    this.modeTabs.forEach(tab => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Hide all sub-shelves first
    this.carouselFilters.style.display = 'none';
    if (this.filterCategoryTabs) this.filterCategoryTabs.style.display = 'none';
    this.carouselArtistic.style.display = 'none';
    this.carouselStickersContainer.style.display = 'none';
    this.shelfSmartAI.style.display = 'none';

    // Disable eraser when switching modes
    this.engine.brush.setEraser(false);
    this.btnEraser.classList.remove('active');
    this.btnEraser.setAttribute('aria-pressed', 'false');

    switch (mode) {
      case 'blur':
      case 'trace':
        this.carouselFilters.style.display = 'flex';
        if (this.filterCategoryTabs) this.filterCategoryTabs.style.display = 'flex';
        this.groupSize.style.display = 'flex';
        this.groupIntensity.style.display = 'flex';
        this.groupOpacity.style.display = 'none';
        if (this.brushStrokesBar) this.brushStrokesBar.style.display = 'flex';
        this.engine.brush.setBrushType('smooth');
        this.showToast('Blur mode: Brush over areas to obscure');
        break;

      case 'artistic':
        this.carouselArtistic.style.display = 'flex';
        this.groupSize.style.display = 'flex';
        this.groupIntensity.style.display = 'flex';
        this.groupOpacity.style.display = 'none';
        if (this.brushStrokesBar) this.brushStrokesBar.style.display = 'flex';
        this.engine.brush.setBrushType('multitone');
        this.showToast('Artistic mode: Paint with textured strokes');
        break;

      case 'stickers':
        this.carouselStickersContainer.style.display = 'block';
        this.groupSize.style.display = 'none';
        this.groupIntensity.style.display = 'none';
        this.groupOpacity.style.display = 'flex';
        if (this.brushStrokesBar) this.brushStrokesBar.style.display = 'none';
        this.showToast('Stickers: Tap an item to place it');
        break;

      case 'smart-ai':
        this.shelfSmartAI.style.display = 'flex';
        this.groupSize.style.display = 'none';
        this.groupIntensity.style.display = 'none';
        this.groupOpacity.style.display = 'none';
        if (this.brushStrokesBar) this.brushStrokesBar.style.display = 'none';
        this.showToast('Auto Detect: Choose an automated tool');
        break;
    }
  }

  openImageFile(file) {
    if (!file) return;

    // Explicitly reject vector SVG files to eliminate XML/SVG script execution vectors
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
      this.showToast('SVG vector files are not supported. Please select a photo (JPEG, PNG, WebP)');
      return;
    }

    // Validate raster image mime type or common photo extensions
    const isRasterImage = (file.type.startsWith('image/') && file.type !== 'image/svg+xml') ||
                          /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name);
    if (!isRasterImage) {
      this.showToast('Please select a valid image file');
      return;
    }

    // Guard against excessive file sizes (max 50MB) to prevent mobile browser crash
    if (file.size > 50 * 1024 * 1024) {
      this.showToast('Image file is too large (max 50MB)');
      return;
    }

    const onDownscaled = (origW, origH, newW, newH) => {
      this.showToast(`Large photo scaled to ${newW}×${newH} for browser performance`);
    };

    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file, { imageOrientation: 'from-image' }).then(bitmap => {
        this.dismissAIPreview();
        this.engine.loadImageBitmap(bitmap, onDownscaled);
        this.showToast(`Opened: ${file.name}`);
      }).catch(() => {
        this.loadViaObjectUrl(file, onDownscaled);
      });
    } else {
      this.loadViaObjectUrl(file, onDownscaled);
    }
  }

  loadViaObjectUrl(file, onDownscaled) {
    const objectUrl = URL.createObjectURL(file);
    this.dismissAIPreview();
    this.engine.loadImage(objectUrl, () => {
      URL.revokeObjectURL(objectUrl);
      this.showToast('Could not decode image file');
    }, onDownscaled);
    this.showToast(`Opened: ${file.name}`);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  }

  showToast(msg) {
    this.toast.textContent = msg;
    this.toast.classList.add('show');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2200);
  }

  async executeExport(format = 'image/png', quality = 0.95) {
    try {
      if (!this.engine.sourceCanvas.width || !this.engine.sourceCanvas.height) {
        this.showToast('Open or select a photo before saving');
        return;
      }
      this.showToast('Preparing clean export...');
      const blob = await this.engine.exportHighResBlob(format, quality);
      const ext = format === 'image/png' ? 'png' : (format === 'image/webp' ? 'webp' : 'jpg');
      const filename = `hanny-montany-${Date.now()}.${ext}`;

      // Check for native mobile share sheet support
      const file = new File([blob], filename, { type: format });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Hanny Montany Export',
            text: 'Censored photo exported from Hanny Montany'
          });
          this.showToast(`Shared as ${ext.toUpperCase()} (100% clean, EXIF stripped)`);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native share failed, falling back to download:', shareErr);
        }
      }

      // Standard browser download with object URL and immediate revocation
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      this.showToast(`Photo saved as ${ext.toUpperCase()} (100% clean, EXIF stripped)`);
    } catch (err) {
      console.error('Export error:', err);
      this.showToast('Could not save photo');
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new BlurMosaicApp();
});

window.addEventListener('load', () => {
  if (window.app && window.app.engine && !window.app.engine.isUserTransformed) {
    window.app.engine.fitToScreen();
  }
});
