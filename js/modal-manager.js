// Modal Dialog Manager
// Centralizes Clear Confirmation, Export Options, and User Manual dialogs
// Handles accessibility focus-trapping, ARIA attributes, and keyboard shortcuts

import { MANUAL_DATA } from './manual-data.js';

export class ModalManager {
  /**
   * @param {Object} options
   * @param {Function} options.onClearConfirm - Callback when user confirms clearing edits
   * @param {Function} options.onExportExecute - Callback(format, quality) when user downloads photo
   * @param {Function} options.showToast - Function to display brief toast notices
   */
  constructor({ onClearConfirm, onExportExecute, showToast }) {
    this.onClearConfirm = onClearConfirm;
    this.onExportExecute = onExportExecute;
    this.showToast = showToast;

    // Clear Confirmation Modal elements
    this.modalClear = document.getElementById('modal-clear-confirm');
    this.btnCancelClear = document.getElementById('btn-cancel-clear');
    this.btnConfirmClear = document.getElementById('btn-confirm-clear');

    // Export Options Modal elements
    this.modalExport = document.getElementById('modal-export');
    this.btnCancelExport = document.getElementById('btn-cancel-export');
    this.btnConfirmExport = document.getElementById('btn-confirm-export');
    this.formatPills = document.querySelectorAll('.format-pill');
    this.exportQualityGroup = document.getElementById('export-quality-group');
    this.exportQualitySlider = document.getElementById('export-quality-slider');
    this.exportQualityVal = document.getElementById('export-quality-val');
    this.exportDimensionsVal = document.getElementById('export-dimensions-val');
    this.selectedExportFormat = 'image/png';
    this.selectedExportQuality = 0.95;

    // User Manual Modal elements
    this.modalManual = document.getElementById('modal-manual');
    this.btnCloseManual = document.getElementById('btn-close-manual');
    this.btnDoneManual = document.getElementById('btn-done-manual');
    this.manualNavPills = document.querySelectorAll('.manual-nav-pill');
    this.manualScrollArea = document.querySelector('.manual-scroll-area');
    this.activeManualTab = 'start';

    this.initEvents();
  }

  initEvents() {
    // 1. Clear Modal
    if (this.btnCancelClear) {
      this.btnCancelClear.addEventListener('click', () => this.closeClearModal());
    }
    if (this.btnConfirmClear) {
      this.btnConfirmClear.addEventListener('click', () => {
        this.closeClearModal();
        if (typeof this.onClearConfirm === 'function') {
          this.onClearConfirm();
        }
      });
    }
    if (this.modalClear) {
      this.modalClear.addEventListener('click', (e) => {
        if (e.target === this.modalClear) this.closeClearModal();
      });
    }

    // 2. Export Modal
    if (this.btnCancelExport) {
      this.btnCancelExport.addEventListener('click', () => this.closeExportModal());
    }
    if (this.btnConfirmExport) {
      this.btnConfirmExport.addEventListener('click', () => {
        this.closeExportModal();
        if (typeof this.onExportExecute === 'function') {
          this.onExportExecute(this.selectedExportFormat, this.selectedExportQuality);
        }
      });
    }
    if (this.modalExport) {
      this.modalExport.addEventListener('click', (e) => {
        if (e.target === this.modalExport) this.closeExportModal();
      });
    }

    // Export format selector pills
    this.formatPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.formatPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        this.selectedExportFormat = pill.dataset.format;

        // Show quality slider only for lossy formats (JPEG / WebP)
        if (this.exportQualityGroup) {
          const isLossy = this.selectedExportFormat !== 'image/png';
          this.exportQualityGroup.style.display = isLossy ? 'flex' : 'none';
        }
      });
    });

    if (this.exportQualitySlider) {
      this.exportQualitySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (this.exportQualityVal) this.exportQualityVal.textContent = `${val}%`;
        this.selectedExportQuality = val / 100;
      });
    }

    // 3. User Manual Modal
    if (this.btnCloseManual) {
      this.btnCloseManual.addEventListener('click', () => this.closeManualModal());
    }
    if (this.btnDoneManual) {
      this.btnDoneManual.addEventListener('click', () => this.closeManualModal());
    }
    if (this.modalManual) {
      this.modalManual.addEventListener('click', (e) => {
        if (e.target === this.modalManual) this.closeManualModal();
      });
    }

    this.manualNavPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.switchManualTab(pill.dataset.manualTab);
      });
    });
  }

  // --- CLEAR CONFIRMATION MODAL ---
  openClearModal(triggerBtn = null) {
    this._lastFocusTrigger = triggerBtn;
    if (this.modalClear) {
      this.modalClear.style.display = 'flex';
      if (this.btnCancelClear) this.btnCancelClear.focus();
    }
  }

  closeClearModal() {
    if (this.modalClear) {
      this.modalClear.style.display = 'none';
      if (this._lastFocusTrigger) this._lastFocusTrigger.focus();
    }
  }

  // --- EXPORT MODAL ---
  openExportModal(hasImage = true, triggerBtn = null, dimensions = null) {
    if (!hasImage) {
      if (this.showToast) this.showToast('Open or select a photo before saving');
      return;
    }
    if (this.exportDimensionsVal) {
      if (dimensions && dimensions.width && dimensions.height) {
        this.exportDimensionsVal.textContent = `${dimensions.width} × ${dimensions.height} px`;
      } else {
        this.exportDimensionsVal.textContent = 'Original Resolution';
      }
    }
    this._lastFocusTrigger = triggerBtn;
    if (this.modalExport) {
      this.modalExport.style.display = 'flex';
      if (this.btnConfirmExport) this.btnConfirmExport.focus();
    }
  }

  closeExportModal() {
    if (this.modalExport) {
      this.modalExport.style.display = 'none';
      if (this._lastFocusTrigger) this._lastFocusTrigger.focus();
    }
  }

  // --- USER MANUAL MODAL ---
  openManualModal(triggerBtn = null) {
    this._lastFocusTrigger = triggerBtn;
    if (this.modalManual) {
      this.modalManual.style.display = 'flex';
      this.switchManualTab(this.activeManualTab || 'start');
      if (this.btnCloseManual) this.btnCloseManual.focus();
    }
  }

  closeManualModal() {
    if (this.modalManual) {
      this.modalManual.style.display = 'none';
      if (this._lastFocusTrigger) this._lastFocusTrigger.focus();
    }
  }

  switchManualTab(tabKey) {
    if (!tabKey || !MANUAL_DATA[tabKey]) return;
    this.activeManualTab = tabKey;

    this.manualNavPills.forEach(pill => {
      const isActive = pill.dataset.manualTab === tabKey;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (this.manualScrollArea) {
      const data = MANUAL_DATA[tabKey];
      this.manualScrollArea.innerHTML = `
        <div id="manual-sec-${tabKey}" class="manual-section active">
          ${data.html}
        </div>
      `;
      this.manualScrollArea.scrollTop = 0;
    }
  }

  // --- ACCESSIBILITY FOCUS TRAP & KEYBOARD SHORTCUTS ---
  handleKeydown(e) {
    // 1. Clear modal active
    if (this.modalClear && this.modalClear.style.display !== 'none') {
      if (e.key === 'Tab') {
        const focusables = [this.btnCancelClear, this.btnConfirmClear].filter(Boolean);
        if (focusables.length >= 2) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return true;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeClearModal();
        return true;
      }
      return false;
    }

    // 2. Export modal active
    if (this.modalExport && this.modalExport.style.display !== 'none') {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeExportModal();
        return true;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.closeExportModal();
        if (typeof this.onExportExecute === 'function') {
          this.onExportExecute(this.selectedExportFormat, this.selectedExportQuality);
        }
        return true;
      }
      return false;
    }

    // 3. User manual active
    if (this.modalManual && this.modalManual.style.display !== 'none') {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeManualModal();
        return true;
      }
      return false;
    }

    return false;
  }

  get isAnyModalOpen() {
    return (
      (this.modalClear && this.modalClear.style.display !== 'none') ||
      (this.modalExport && this.modalExport.style.display !== 'none') ||
      (this.modalManual && this.modalManual.style.display !== 'none')
    );
  }
}
