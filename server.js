/**
 * server.js — Portfolio Backend
 * Serves static files and handles the contact form via Nodemailer + Gmail SMTP.
 * Uses a Gmail App Password (16-char, no spaces).
 * Generate one at: https://myaccount.google.com/apppasswords
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter (Gmail SMTP over SSL on port 465) ────
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

// ── Helpers ─────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Middleware ──────────────────────────────────────────────────
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('/{*splat}', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/health ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'portfolio-api' });
});

// ── Simple rate limiter (5 requests per IP per 15 minutes) ──────
const contactLimiter = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
    const now = Date.now();
    const entry = contactLimiter.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW) {
        contactLimiter.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of contactLimiter) {
        if (now - entry.start > RATE_WINDOW) contactLimiter.delete(ip);
    }
}, RATE_WINDOW);

// ── POST /api/contact ───────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    const toEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
        from: `"${escapeHtml(name)} via Portfolio" <${process.env.SMTP_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: toEmail,
        subject: subject || 'New message',
        html: `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong><br />${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `
    };

    try {
        await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 20000))
        ]);
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
    transporter.verify()
        .then(() => console.log('[smtp] Gmail SMTP ready'))
        .catch(err => console.error('[smtp] SMTP failed:', err.message));
});
