/**
 * server.js — Portfolio Backend
 * Serves static files and handles the contact form via Nodemailer + Gmail.
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter ──────────────────────────────────────
// Uses Gmail service shorthand which automatically sets host/port/secure.
// `family: 4` forces IPv4 to avoid ENETUNREACH on Render free tier.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    family: 4
});

// ── Middleware ──────────────────────────────────────────────────
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigin = process.env.FRONTEND_URL;
        if (!origin || !allowedOrigin || origin === allowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/health ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'portfolio-api' });
});

// ── POST /api/contact ───────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const toEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
        from: `"${name} via Portfolio" <${process.env.SMTP_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: toEmail,
        subject: `[Portfolio] ${subject || 'New message'} — from ${name}`,
        text: `New contact form message\n\nFrom:    ${name}\nEmail:   ${email}\nSubject: ${subject || '—'}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond to ${name}.`,
        html: `
<div style="font-family:monospace;background:#0B1020;color:#F8FAFC;padding:24px;border-radius:8px;max-width:600px;margin:0 auto;">
  <h2 style="color:#22D3EE;margin:0 0 16px;">📩 New Portfolio Message</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="color:#94A3B8;padding:6px 0;width:80px;">From</td><td style="color:#F8FAFC;">${name}</td></tr>
    <tr><td style="color:#94A3B8;padding:6px 0;">Email</td><td style="color:#22D3EE;"><a href="mailto:${email}" style="color:#22D3EE;">${email}</a></td></tr>
    <tr><td style="color:#94A3B8;padding:6px 0;">Subject</td><td style="color:#F8FAFC;">${subject || '—'}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #1E293B;margin:16px 0;">
  <p style="color:#CBD5E1;white-space:pre-wrap;">${message}</p>
  <hr style="border:none;border-top:1px solid #1E293B;margin:16px 0;">
  <p style="color:#64748B;font-size:12px;">Click Reply to respond directly to ${name} at ${email}.</p>
</div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[contact] Email sent from ${name} <${email}>`);
        res.json({ message: 'success' });
    } catch (err) {
        console.error('[contact] Email error:', err.message);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
});

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
