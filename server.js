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

// ── Validate required env vars ───────────────────────────────────
const SMTP_USER     = process.env.SMTP_USER;
const SMTP_PASS     = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || SMTP_USER;

if (!SMTP_USER || !SMTP_PASS) {
    console.error('[FATAL] SMTP_USER and SMTP_PASS must be set in environment variables.');
    console.error('        Set them in your .env file (local) or on your hosting dashboard (Render/Railway).');
    // Don't exit — still serve static files; /api/contact will return a clear error
}

// ── Nodemailer transporter (Gmail SMTP — port 587 STARTTLS, IPv4 forced) ────
// NOTE: port 465 uses IPv6 on cloud hosts (Render/Railway) which is blocked.
// Port 587 with STARTTLS + family:4 forces IPv4 and works everywhere.
const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,           // STARTTLS (upgrades after connect)
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    },
    family:            4,    // Force IPv4 — Render blocks IPv6 outbound
    connectionTimeout: 15000,
    greetingTimeout:   15000,
    socketTimeout:     20000,
    tls: {
        rejectUnauthorized: true
    }
});

// ── Helpers ─────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
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
    res.json({
        status:  'ok',
        service: 'portfolio-api',
        smtp:    !!(SMTP_USER && SMTP_PASS)
    });
});

// ── Simple rate limiter (5 requests per IP per 15 minutes) ──────
const contactLimiter = new Map();
const RATE_LIMIT  = 5;
const RATE_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
    const now   = Date.now();
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
    // Guard: SMTP not configured
    if (!SMTP_USER || !SMTP_PASS) {
        console.error('[contact] SMTP credentials missing — set SMTP_USER and SMTP_PASS env vars.');
        return res.status(503).json({
            error: 'Email service is not configured. Please contact the administrator.'
        });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
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

    const mailOptions = {
        from:    `"${escapeHtml(name)} via Portfolio" <${SMTP_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to:      CONTACT_EMAIL,
        subject: subject ? `[Portfolio] ${subject}` : '[Portfolio] New message',
        html: `
      <div style="font-family:monospace;background:#0d0d0d;color:#e0e0e0;padding:24px;border-radius:8px;max-width:600px;">
        <h2 style="color:#00d4ff;margin-top:0;">📨 New Portfolio Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#00d4ff;">${escapeHtml(email)}</a></p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || '(none)')}</p>
        <hr style="border-color:#333;margin:16px 0;">
        <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      </div>
    `
    };

    try {
        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout after 20s')), 20000))
        ]);
        console.log(`[contact] ✅ Email sent from ${name} <${email}> — messageId: ${info.messageId}`);
        res.json({ message: 'success' });
    } catch (err) {
        console.error('[contact] ❌ Email error:', err.message);
        console.error('[contact] Error code:', err.code);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
});

// ── Global JSON parse error handler ────────────────────────────
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body.' });
    }
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
    if (SMTP_USER && SMTP_PASS) {
        transporter.verify()
            .then(() => console.log('[smtp] ✅ Gmail SMTP ready — emails will work'))
            .catch(err  => console.error('[smtp] ❌ SMTP verification failed:', err.message, '\n       → Check your SMTP_USER and SMTP_PASS env vars'));
    } else {
        console.warn('[smtp] ⚠️  SMTP credentials not set — contact form emails will NOT send');
    }
});
