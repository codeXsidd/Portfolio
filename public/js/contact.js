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
  sendBtn.textContent = '[ SEND ]';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel';
  cancelBtn.textContent = '[ CANCEL ]';

  actions.appendChild(sendBtn);
  actions.appendChild(cancelBtn);
  wrap.appendChild(actions);

  // Status message
  const statusMsg = document.createElement('div');
  statusMsg.style.cssText = 'padding:0 16px 12px;font-size:12px;';
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

  // Send logic
  sendBtn.addEventListener('click', async () => {
    const name    = nameF.input.value.trim();
    const email   = emailF.input.value.trim();
    const subject = subjectF.input.value.trim();
    const message = msgF.input.value.trim();

    if (!name || !email || !message) {
      statusMsg.innerHTML = `<span class="c-error">✗ Name, Email, and Message are required.</span>`;
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = '[ SENDING... ]';
    statusMsg.innerHTML = `<span class="c-dim">Connecting to server...</span>`;

    // Helper: fetch with timeout
    async function fetchWithTimeout(url, options, ms = 30000) {
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

    // Wake up the Render server first (it may be sleeping)
    try {
      statusMsg.innerHTML = `<span class="c-dim">Waking up server (may take ~10s)...</span>`;
      await fetchWithTimeout('/api/health', {}, 20000).catch(() => {});
    } catch (_) {}

    // Now send the actual request
    try {
      statusMsg.innerHTML = `<span class="c-dim">Sending message...</span>`;
      const res = await fetchWithTimeout('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      }, 30000);

      const data = await res.json();

      if (res.ok && data.message === 'success') {
        wrap.innerHTML = '';
        const success = document.createElement('div');
        success.className = 'banner success';
        success.innerHTML = `✓ Message sent successfully.<br><span style="font-size:11px;color:var(--t2);margin-top:4px;display:block;">Thank you for contacting Siddharth.</span>`;
        wrap.appendChild(success);
      } else {
        statusMsg.innerHTML = `<span class="c-error">✗ ${data.error || 'Message could not be sent. Please try again.'}</span>`;
        sendBtn.disabled = false;
        sendBtn.textContent = '[ SEND ]';
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        statusMsg.innerHTML = `<span class="c-error">✗ Server is waking up. Please try again in 30 seconds.</span>`;
      } else {
        statusMsg.innerHTML = `<span class="c-error">✗ Network error. Please try again later.</span>`;
      }
      sendBtn.disabled = false;
      sendBtn.textContent = '[ SEND ]';
    }

    term._scrollToBottom();
  });

  // Focus first field
  setTimeout(() => nameF.input.focus(), 50);

  return wrap;
}
