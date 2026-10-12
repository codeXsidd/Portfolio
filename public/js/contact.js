/**
 * contact.js — Terminal-Style Contact Form
 * Uses the existing Node.js / Nodemailer backend at /api/contact
 * No SMTP credentials are exposed here.
 */

function buildContactForm(term) {
  const wrap = document.createElement('div');
  wrap.className = 'contact-form-wrap';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'term-box-header';
  hdr.innerHTML = `<span style="color:var(--cyan);">◉</span> SEND MESSAGE`;
  wrap.appendChild(hdr);

  // Fields
  const fields = document.createElement('div');
  fields.className = 'contact-fields';

  function makeField(labelText, type, name, placeholder, isTextarea) {
    const row = document.createElement('div');
    row.className = 'contact-field';
    const label = document.createElement('label');
    label.setAttribute('for', `cf-${name}`);
    label.textContent = labelText;
    row.appendChild(label);
    let input;
    if (isTextarea) {
      input = document.createElement('textarea');
      input.rows = 4;
    } else {
      input = document.createElement('input');
      input.type = type;
    }
    input.id = `cf-${name}`;
    input.name = name;
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    row.appendChild(input);
    return { row, input };
  }

  const nameF    = makeField('Name',    'text',  'name',    'Your name...');
  const emailF   = makeField('Email',   'email', 'email',   'your@gmail.com');
  const subjectF = makeField('Subject', 'text',  'subject', 'Subject...');
  const msgF     = makeField('Message', 'text',  'message', 'Write your message...', true);

  [nameF, emailF, subjectF, msgF].forEach(f => fields.appendChild(f.row));
  wrap.appendChild(fields);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'contact-actions';

  const sendBtn = document.createElement('button');
  sendBtn.className = 'btn-send';
  sendBtn.id = 'contact-send-btn';
  sendBtn.textContent = '[ SEND ]';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.id = 'contact-cancel-btn';
  cancelBtn.textContent = '[ CANCEL ]';

  actions.appendChild(sendBtn);
  actions.appendChild(cancelBtn);
  wrap.appendChild(actions);

  // Status message
  const statusMsg = document.createElement('div');
  statusMsg.id = 'contact-status';
  statusMsg.style.cssText = 'padding:0 16px 12px;font-size:12px;min-height:20px;';
  wrap.appendChild(statusMsg);

  // Cancel logic
  cancelBtn.addEventListener('click', () => {
    wrap.remove();
    const cancelled = document.createElement('div');
    cancelled.className = 'c-dim';
    cancelled.style.fontSize = '12px';
    cancelled.textContent = 'Contact form cancelled.';
    term.outputEl.lastElementChild?.appendChild(cancelled);
    term._scrollToBottom();
    term.focus();
  });

  // ── Fetch with timeout helper ──────────────────────────────────
  async function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return r;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  // ── API base URL ───────────────────────────────────────────────
  // Architecture: Vercel (siddharths.dev) = static frontend only
  //               Render (portfolio-os-diee.onrender.com) = Node.js/Express backend
  // When on Vercel → call Render backend for API
  // When on localhost or Render → use same-origin (relative path)
  const RENDER_BACKEND = 'https://portfolio-os-diee.onrender.com';
  const API_BASE = (location.hostname === 'siddharths.dev')
    ? RENDER_BACKEND
    : '';

  // Helpers for safe DOM-based status updates
  function setStatusError(msg) {
    statusMsg.textContent = '';
    const span = document.createElement('span');
    span.className = 'c-error';
    span.textContent = `✗ ${msg}`;
    statusMsg.appendChild(span);
  }

  function setStatusDim(msg) {
    statusMsg.textContent = '';
    const span = document.createElement('span');
    span.className = 'c-dim';
    span.textContent = msg;
    statusMsg.appendChild(span);
  }

  let isSubmitting = false;

  function resetButtons() {
    isSubmitting = false;
    sendBtn.disabled = false;
    cancelBtn.disabled = false;
    sendBtn.textContent = '[ SEND ]';
  }

  // ── Send logic ─────────────────────────────────────────────────
  sendBtn.addEventListener('click', async () => {
    if (isSubmitting) return;

    const name    = nameF.input.value.trim();
    const email   = emailF.input.value.trim();
    const subject = subjectF.input.value.trim();
    const message = msgF.input.value.trim();

    // Client-side validation
    if (!name || !email || !message) {
      setStatusError('Name, Email, and Message are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatusError('Please enter a valid email address.');
      return;
    }

    isSubmitting = true;
    sendBtn.disabled = true;
    cancelBtn.disabled = true;
    sendBtn.textContent = '[ SENDING... ]';
    statusMsg.textContent = '';

    // ── Send the message ───────────────────────────────────────────
    try {
      setStatusDim('📨 Sending message...');

      const res = await fetchWithTimeout(
        `${API_BASE}/api/contact`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name, email, subject, message })
        },
        30000
      );

      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (parseErr) {
          console.warn('[contact] Failed to parse JSON response:', parseErr.message);
        }
      } else {
        try {
          const textPreview = await res.text();
          console.warn(`[contact] Non-JSON response received (HTTP ${res.status}):`, textPreview.slice(0, 160));
        } catch (_) {}
      }

      if (res.ok && data && data.message === 'success') {
        // ── Success ──
        wrap.innerHTML = '';
        const banner = document.createElement('div');
        banner.className = 'banner success';
        banner.innerHTML = `
          ✓ Message sent successfully!<br>
          <span style="font-size:11px;color:var(--t2);margin-top:6px;display:block;">
            Thank you for reaching out, Siddharth will get back to you soon.
          </span>`;
        wrap.appendChild(banner);
        return;
      }

      console.error(`[contact] Request returned HTTP ${res.status} (${res.statusText})`);

      if (res.status === 404) {
        setStatusError('API endpoint not found (HTTP 404). Backend service unavailable.');
      } else if (res.status === 405) {
        setStatusError('Request method not allowed (HTTP 405).');
      } else if (res.status === 429) {
        setStatusError('Too many requests (HTTP 429). Please wait 15 minutes and try again.');
      } else if (res.status === 503) {
        setStatusError('Email service temporarily unavailable (HTTP 503). Please email directly.');
      } else if (res.status === 504) {
        setStatusError('Gateway timeout (HTTP 504). The server took too long to respond.');
      } else if (res.status === 500) {
        const errMsg = (data && typeof data.error === 'string') ? data.error : 'Failed to send email. Please try again later.';
        setStatusError(errMsg);
      } else {
        const errMsg = (data && typeof data.error === 'string') ? data.error : `Request failed (HTTP ${res.status}).`;
        setStatusError(errMsg);
      }

      resetButtons();
    } catch (err) {
      console.error('[contact] Network or timeout failure:', err.name);
      if (err.name === 'AbortError') {
        setStatusError('Request timed out. The server may be overloaded — please try again.');
      } else {
        setStatusError('Could not reach server. Check your connection and try again.');
      }
      resetButtons();
    }

    term._scrollToBottom();
  });

  // Global Escape shortcut to cancel active form
  function handleGlobalEsc(e) {
    if (e.key === 'Escape' && document.body.contains(wrap)) {
      e.preventDefault();
      document.removeEventListener('keydown', handleGlobalEsc);
      cancelBtn.click();
    }
  }
  document.addEventListener('keydown', handleGlobalEsc);

  // Escape key cancels form from anywhere in form
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      document.removeEventListener('keydown', handleGlobalEsc);
      cancelBtn.click();
    }
  });

  // Keyboard shortcuts (Enter to submit, Escape to cancel)
  [nameF.input, emailF.input, subjectF.input].forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelBtn.click();
      }
    });
  });

  msgF.input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      sendBtn.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelBtn.click();
    }
  });

  // Focus first field on open
  setTimeout(() => nameF.input.focus(), 50);

  return wrap;
}
