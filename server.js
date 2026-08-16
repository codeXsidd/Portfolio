/**
 * server.js — Portfolio Backend
 * Contact form uses Resend (HTTP API) — NOT nodemailer SMTP.
 *
 * WHY RESEND: Render free tier blocks all outbound SMTP (ports 25, 465, 587).
 * Resend uses HTTPS so it works everywhere with zero network restrictions.
 *
 * Setup (one time):
 *   1. Go to https://resend.com → sign up free (3000 emails/month)
 *   2. Create an API key → copy it
 *   3. On Render: Dashboard → Environment → add RESEND_API_KEY=re_xxxx
 *   4. Also set CONTACT_EMAIL=your@gmail.com (where you want to receive messages)
 */

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { Resend } = require('resend');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Env vars ─────────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL  = process.env.CONTACT_EMAIL;

if (!RESEND_API_KEY) {
    console.warn('[WARN] RESEND_API_KEY not set — contact form will not send emails.');
    console.warn('       → Get a free key at https://resend.com and set it on Render.');
}
if (!CONTACT_EMAIL) {
    console.warn('[WARN] CONTACT_EMAIL not set — emails will have no destination address.');
}

const resend = new Resend(RESEND_API_KEY || 'missing');

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
        mailer:  'resend',
        ready:   !!(RESEND_API_KEY && CONTACT_EMAIL)
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
    if (!RESEND_API_KEY || !CONTACT_EMAIL) {
        console.error('[contact] Missing RESEND_API_KEY or CONTACT_EMAIL env vars.');
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
        const { data, error } = await resend.emails.send({
            from:     'Portfolio Contact <onboarding@resend.dev>',
            reply_to: `${name} <${email}>`,
            to:       [CONTACT_EMAIL],
            subject:  subject ? `[Portfolio] ${subject}` : '[Portfolio] New message',
            html: `
              <div style="font-family:monospace;background:#0d0d0d;color:#e0e0e0;padding:24px;border-radius:8px;max-width:600px;">
                <h2 style="color:#00d4ff;margin-top:0;">📨 New Portfolio Message</h2>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#00d4ff;">${escapeHtml(email)}</a></p>
                <p><strong>Subject:</strong> ${escapeHtml(subject || '(none)')}</p>
                <hr style="border-color:#333;margin:16px 0;">
                <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
              </div>`
        });

        if (error) {
            console.error('[contact] ❌ Resend error:', error);
            return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
        }

        console.log(`[contact] ✅ Email sent via Resend — id: ${data.id} | from: ${name} <${email}>`);
        res.json({ message: 'success' });
    } catch (err) {
        console.error('[contact] ❌ Unexpected error:', err.message);
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
    console.log(`📧 Mailer: Resend (HTTP API — works on Render free tier)`);
    if (RESEND_API_KEY && CONTACT_EMAIL) {
        console.log(`✅ Config OK — emails will be delivered to ${CONTACT_EMAIL}`);
    } else {
        console.warn(`⚠️  Missing env vars: ${!RESEND_API_KEY ? 'RESEND_API_KEY ' : ''}${!CONTACT_EMAIL ? 'CONTACT_EMAIL' : ''}`);
    }
});
