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
  // Always same-origin: locally server.js handles /api/*, on Vercel
  // the api/ serverless functions handle /api/* — no hardcoded URLs needed.
  const API_BASE = '';

  // ── Send logic ─────────────────────────────────────────────────
  sendBtn.addEventListener('click', async () => {
    const name    = nameF.input.value.trim();
    const email   = emailF.input.value.trim();
    const subject = subjectF.input.value.trim();
    const message = msgF.input.value.trim();

    // Client-side validation
    if (!name || !email || !message) {
      statusMsg.innerHTML = `<span class="c-error">✗ Name, Email, and Message are required.</span>`;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusMsg.innerHTML = `<span class="c-error">✗ Please enter a valid email address.</span>`;
      return;
    }

    sendBtn.disabled = true;
    cancelBtn.disabled = true;
    sendBtn.textContent = '[ SENDING... ]';
    statusMsg.innerHTML = '';

    // ── Send the message ───────────────────────────────────────────
    try {
      statusMsg.innerHTML = `<span class="c-dim">📨 Sending message...</span>`;

      const res = await fetchWithTimeout(
        `${API_BASE}/api/contact`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name, email, subject, message })
        },
        30000
      );

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        // Response wasn't JSON
      }

      if (res.ok && data.message === 'success') {
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
      } else if (res.status === 429) {
        statusMsg.innerHTML = `<span class="c-error">✗ Too many requests. Please wait 15 minutes and try again.</span>`;
        sendBtn.disabled = false;
        cancelBtn.disabled = false;
        sendBtn.textContent = '[ SEND ]';
      } else if (res.status === 503) {
        statusMsg.innerHTML = `<span class="c-error">✗ Email service temporarily unavailable. Please try emailing directly.</span>`;
        sendBtn.disabled = false;
        cancelBtn.disabled = false;
        sendBtn.textContent = '[ SEND ]';
      } else {
        const errMsg = data.error || 'Message could not be sent. Please try again.';
        statusMsg.innerHTML = `<span class="c-error">✗ ${errMsg}</span>`;
        sendBtn.disabled = false;
        cancelBtn.disabled = false;
        sendBtn.textContent = '[ SEND ]';
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        statusMsg.innerHTML = `<span class="c-error">✗ Request timed out. The server may be overloaded — please try again.</span>`;
      } else {
        statusMsg.innerHTML = `<span class="c-error">✗ Could not reach server. Check your connection and try again.</span>`;
      }
      sendBtn.disabled = false;
      cancelBtn.disabled = false;
      sendBtn.textContent = '[ SEND ]';
    }

    term._scrollToBottom();
  });

  // Focus first field on open
  setTimeout(() => nameF.input.focus(), 50);

  return wrap;
}
