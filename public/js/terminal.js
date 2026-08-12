/**
 * terminal.js — Core Terminal Engine
 * Handles I/O, history, prompt, scrolling, and rendering.
 * Requires: filesystem.js, commands.js, autocomplete.js, contact.js
 */

class Terminal {
  constructor(opts = {}) {
    this.outputEl  = document.getElementById('terminal-output');
    this.inputEl   = document.getElementById('terminal-input');
    this.promptEl  = document.getElementById('prompt-path');
    this.acPopup   = document.getElementById('autocomplete-popup');

    this.path      = [];       // current virtual fs path parts
    this.history   = [];       // command history
    this.histIdx   = -1;       // history navigation index
    this.disabled  = false;
    this.inputBuffer = '';     // saved input when browsing history

    this._bindEvents();
    this._updateSidebarPath();
  }

  /* ── Node helpers ─────────────────────────────────────────── */
  currentNode() {
    return fsNavigate(this.path) || FILESYSTEM;
  }

  setPath(parts) {
    this.path = [...parts];
    this.updatePrompt();
    this._updateSidebarPath();
  }

  updatePrompt() {
    if (!this.promptEl) return;
    const pathStr = this.path.length ? '/' + this.path.join('/') : '~';
    this.promptEl.textContent = pathStr;
    this._updateSidebarPath();
  }

  _updateSidebarPath() {
    const el = document.getElementById('sb-path');
    if (el) el.textContent = this.path.length ? '/' + this.path.join('/') : '~';
  }

  /* ── Output helpers ───────────────────────────────────────── */
  appendBlock(cmdText, resultEl) {
    const block = document.createElement('div');
    block.className = 'output-block';

    if (cmdText !== null) {
      const cmdLine = document.createElement('div');
      cmdLine.className = 'output-cmd-line';
      cmdLine.innerHTML = `
        <span class="prompt-user">siddharth</span>
        <span class="prompt-at">@</span>
        <span class="prompt-host">portfolio</span>
        <span class="prompt-sym">:</span>
        <span class="c-dim">${this.path.length ? '/' + this.path.join('/') : '~'}</span>
        <span class="prompt-sym" style="margin-left:4px;">$</span>
        <span class="c-white" style="margin-left:6px;">${this._esc(cmdText)}</span>`;
      block.appendChild(cmdLine);
    }

    if (resultEl) {
      const result = document.createElement('div');
      result.className = 'output-result';
      result.appendChild(typeof resultEl === 'string'
        ? Object.assign(document.createElement('p'), { textContent: resultEl })
        : resultEl);
      block.appendChild(result);
    }

    this.outputEl.appendChild(block);
    
    // Scroll to the start of this block instead of blindly to the bottom
    requestAnimationFrame(() => {
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  clearOutput() {
    this.outputEl.innerHTML = '';
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }

  /* ── Command execution ────────────────────────────────────── */
  executeCommand(raw) {
    const input = raw.trim();
    if (!input) return;

    // Save history
    if (input !== this.history[this.history.length - 1]) {
      this.history.push(input);
    }
    this.histIdx = -1;
    this.inputBuffer = '';

    // Update sidebar history
    this._updateSidebarHistory(input);

    const result = executeCommand(input, this);

    if (input.toLowerCase() !== 'clear') {
      this.appendBlock(input, result);
    }
  }

  _updateSidebarHistory(cmd) {
    const el = document.getElementById('sb-last-cmd');
    if (el) el.textContent = cmd;
  }

  /* ── Contact form ─────────────────────────────────────────── */
  showContactForm() {
    const form = buildContactForm(this);
    this.appendBlock('run contact', form);
  }

  /* ── Disable (exit) ───────────────────────────────────────── */
  disable() {
    this.disabled = true;
    this.inputEl.disabled = true;
    this.inputEl.placeholder = 'Session ended.';
  }

  /* ── Focus ─────────────────────────────────────────────────── */
  focus() {
    this.inputEl.focus();
  }

  /* ── Welcome screen ───────────────────────────────────────── */
  welcome() {
    this.executeCommand('whoami');

    const wrap = document.createElement('div');
    wrap.className = 'output-block';
    wrap.innerHTML = `
      <div style="margin-top: 14px;">
        <div style="font-size: 10px; letter-spacing: 0.1em; color: var(--t4); margin-bottom: 6px;">QUICK ACCESS</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="term-btn" onclick="TERM.executeCommand('run about')">&gt; ABOUT</button>
          <button class="term-btn" onclick="TERM.executeCommand('run skills')">&gt; SKILLS</button>
          <button class="term-btn" onclick="TERM.executeCommand('run projects')">&gt; PROJECTS</button>
          <button class="term-btn" onclick="TERM.executeCommand('run experience')">&gt; EXPERIENCE</button>
          <button class="term-btn" onclick="TERM.executeCommand('run resume')">↓ RESUME</button>
          <button class="term-btn" onclick="TERM.executeCommand('run contact')">&gt; CONTACT</button>
        </div>
      </div>
      <div style="margin-top: 18px; padding: 12px; border: 1px solid var(--term-border); border-radius: var(--r-sm); background: rgba(34,211,238,0.02);">
        <div style="font-size: 11px; color: var(--t2); margin-bottom: 4px;">NEW HERE?</div>
        <div style="font-size: 12.5px; color: var(--t0);">You don't need to know terminal commands.</div>
        <div style="font-size: 12.5px; color: var(--t1); margin-bottom: 8px;">Use the shortcuts above, or type <span class="c-cyan">"help"</span>.</div>
        <button class="term-btn" style="border-color: var(--violet-border); color: var(--violet);" onclick="TERM.executeCommand('help')">? HELP</button>
      </div>`;
    this.outputEl.appendChild(wrap);
    this._scrollToBottom();
  }

  /* ── Event binding ────────────────────────────────────────── */
  _bindEvents() {
    this.inputEl.addEventListener('keydown', (e) => this._onKeyDown(e));

    // Click anywhere in terminal → focus input
    document.getElementById('terminal-window')
      ?.addEventListener('click', (e) => {
        const tag = e.target.tagName.toLowerCase();
        // Don't steal focus if clicking on interactive elements
        if (['input', 'textarea', 'button', 'a'].includes(tag)) return;
        // Don't steal focus if the user is highlighting text to copy
        if (window.getSelection().toString().length > 0) return;
        this.focus();
      });

    // Sidebar quick commands
    document.querySelectorAll('.sb-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const cmd = el.dataset.cmd;
        if (cmd) {
          this.focus();
          this.inputEl.value = cmd;
          this.executeCommand(cmd);
          this.inputEl.value = '';
        }
      });
    });
  }

  _onKeyDown(e) {
    if (this.disabled) { e.preventDefault(); return; }

    // Ctrl+L
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      this.clearOutput();
      return;
    }

    // Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = this.inputEl.value;
      this.inputEl.value = '';
      this._hideAC();
      this.executeCommand(val);
      return;
    }

    // Tab
    if (e.key === 'Tab') {
      e.preventDefault();
      handleAutocomplete(this);
      return;
    }

    // Arrow Up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.histIdx === -1) this.inputBuffer = this.inputEl.value;
      const newIdx = Math.min(this.histIdx + 1, this.history.length - 1);
      if (newIdx >= 0 && this.history.length > 0) {
        this.histIdx = newIdx;
        this.inputEl.value = this.history[this.history.length - 1 - this.histIdx];
        this._moveCursorToEnd();
      }
      return;
    }

    // Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.histIdx <= 0) {
        this.histIdx = -1;
        this.inputEl.value = this.inputBuffer;
      } else {
        this.histIdx--;
        this.inputEl.value = this.history[this.history.length - 1 - this.histIdx];
      }
      this._moveCursorToEnd();
      return;
    }

    // Escape: hide autocomplete
    if (e.key === 'Escape') {
      this._hideAC();
    }
  }

  _moveCursorToEnd() {
    const el = this.inputEl;
    setTimeout(() => { el.selectionStart = el.selectionEnd = el.value.length; }, 0);
  }

  _hideAC() {
    if (this.acPopup) this.acPopup.classList.remove('visible');
  }
}
