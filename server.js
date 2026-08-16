/**
 * server.js — Portfolio Backend
 * Contact form handled by Nodemailer + Gmail SMTP (port 587 / STARTTLS).
 *
 * KEY FIX FOR RENDER FREE TIER:
 *   Render's infrastructure returns only IPv6 addresses from DNS.
 *   Render free instances have NO IPv6 outbound routing → ENETUNREACH.
 *   Solution: use dns.resolve4() which explicitly fetches A records (IPv4 only),
 *   then pass that raw IP as the SMTP host. TLS still validates against
 *   'smtp.gmail.com' via tls.servername so the certificate check passes.
 */

'use strict';

const dns        = require('dns').promises;
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Env vars ─────────────────────────────────────────────────────
const SMTP_USER     = process.env.SMTP_USER;
const SMTP_PASS     = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || SMTP_USER;

if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[smtp] ⚠️  SMTP_USER / SMTP_PASS not set — emails will not send.');
    console.warn('[smtp]    → On Render: Dashboard → Environment → add SMTP_USER, SMTP_PASS, CONTACT_EMAIL');
}

// ── Build a nodemailer transporter using a resolved IPv4 address ──
// dns.resolve4() requests only A records → always returns IPv4 even on Render.
// We then pass that IP as `host` and set tls.servername so Gmail's TLS cert
// is still validated correctly against 'smtp.gmail.com'.
async function buildTransporter() {
    let smtpHost = 'smtp.gmail.com'; // fallback

    try {
        const addresses = await dns.resolve4('smtp.gmail.com');
        smtpHost = addresses[0];
        console.log(`[smtp] Resolved smtp.gmail.com → ${smtpHost} (IPv4 ✅)`);
    } catch (err) {
        console.warn(`[smtp] IPv4 DNS resolve failed (${err.message}), using hostname.`);
    }

    return nodemailer.createTransport({
        host:   smtpHost,
        port:   587,
        secure: false,             // STARTTLS (upgrades automatically)
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        tls: {
            servername:         'smtp.gmail.com', // validate TLS cert against the real hostname
            rejectUnauthorized: true
        },
        connectionTimeout: 15000,
        greetingTimeout:   15000,
        socketTimeout:     20000
    });
}

// ── Helpers ──────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

// ── Middleware ───────────────────────────────────────────────────
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

// ── Serve static frontend ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/health ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status:  'ok',
        service: 'portfolio-api',
        smtp:    !!(SMTP_USER && SMTP_PASS)
    });
});

// ── Rate limiter (5 req / IP / 15 min) ──────────────────────────
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

// ── POST /api/contact ────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    if (!SMTP_USER || !SMTP_PASS) {
        return res.status(503).json({ error: 'Email service not configured.' });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
        // Build a fresh transporter with a resolved IPv4 host each time.
        // This is lightweight (one DNS query) and ensures we never hit an IPv6 address.
        const transporter = await buildTransporter();

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
              </div>`
        };

        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 25000))
        ]);

        console.log(`[contact] ✅ Sent from ${name} <${email}> — id: ${info.messageId}`);
        res.json({ message: 'success' });
    } catch (err) {
        console.error('[contact] ❌ Error:', err.message, '| code:', err.code);
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body.' });
    }
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    if (SMTP_USER && SMTP_PASS) {
        // Warm up: verify SMTP using an IPv4-resolved transporter
        buildTransporter()
            .then(t => t.verify())
            .then(() => console.log('[smtp] ✅ Gmail SMTP ready — emails will work'))
            .catch(err => {
                console.error('[smtp] ❌ SMTP verify failed:', err.message, '| code:', err.code);
                if (err.code === 'ENETUNREACH') {
                    console.error('[smtp]    → Network unreachable. Render may be blocking this connection.');
                } else if (err.responseCode === 535) {
                    console.error('[smtp]    → Auth failed. Check SMTP_USER and SMTP_PASS on Render.');
                    console.error('[smtp]    → SMTP_PASS must be a Gmail App Password (not your login password).');
                    console.error('[smtp]    → Generate one: https://myaccount.google.com/apppasswords');
                }
            });
    } else {
        console.warn('[smtp] ⚠️  No credentials — set SMTP_USER, SMTP_PASS, CONTACT_EMAIL on Render');
    }
});
