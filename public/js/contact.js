/**
 * contact.js — Terminal-Style Contact Form
 * Uses EmailJS to send emails directly from the browser.
 * No SMTP credentials exposed. No backend required.
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
  const emailF   = makeField('Email',   'email', 'email',   'your@email.com');
  const subjectF = makeField('Subject', 'text',  'subject', 'Subject...');
  const msgF     = makeField('Message', 'text',  'message', 'Write your message...', true);

  [nameF, emailF, subjectF, msgF].forEach(f => fields.appendChild(f.row));
  wrap.appendChild(fields);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'contact-btn-row';
  const sendBtn   = document.createElement('button');
  sendBtn.className = 'term-btn term-btn-primary';
  sendBtn.id = 'cf-send';
  sendBtn.textContent = '[ SEND ]';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'term-btn';
  cancelBtn.id = 'cf-cancel';
  cancelBtn.textContent = '[ CANCEL ]';
  btnRow.appendChild(sendBtn);
  btnRow.appendChild(cancelBtn);
  wrap.appendChild(btnRow);

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

  // Send logic using EmailJS
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
    statusMsg.innerHTML = `<span class="c-dim">Sending...</span>`;

    try {
      // EmailJS send
      const result = await emailjs.send(
        window.EMAILJS_SERVICE_ID   || 'YOUR_SERVICE_ID',
        window.EMAILJS_TEMPLATE_ID  || 'YOUR_TEMPLATE_ID',
        {
          from_name:    name,
          from_email:   email,
          subject:      subject || '(no subject)',
          message:      message,
          reply_to:     email
        },
        window.EMAILJS_PUBLIC_KEY   || 'YOUR_PUBLIC_KEY'
      );

      if (result.status === 200) {
        wrap.innerHTML = '';
        const success = document.createElement('div');
        success.className = 'banner success';
        success.innerHTML = `
          <div style="font-size:16px;margin-bottom:6px;">✓ Message sent!</div>
          <div style="font-size:12px;color:var(--t2);">Thank you ${name}. Siddharth will reply to <span style="color:var(--cyan)">${email}</span> soon.</div>
        `;
        wrap.appendChild(success);
        term._scrollToBottom();
      } else {
        throw new Error('EmailJS returned status ' + result.status);
      }
    } catch (err) {
      console.error('EmailJS error:', err);
      statusMsg.innerHTML = `<span class="c-error">✗ Failed to send. Please try again or email directly at <a href="mailto:siddharth291206@gmail.com" style="color:var(--cyan)">siddharth291206@gmail.com</a></span>`;
      sendBtn.disabled = false;
      sendBtn.textContent = '[ SEND ]';
    }

    term._scrollToBottom();
  });

  // Focus first field
  setTimeout(() => nameF.input.focus(), 50);

  return wrap;
}
