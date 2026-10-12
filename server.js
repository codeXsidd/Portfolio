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
// Render free instances have NO IPv6 outbound routing → ENETUNREACH when connecting to IPv6.
// We resolve to an IPv4 address via dns.lookup(family: 4) or dns.resolve4(),
// and set tls.servername so Gmail's TLS certificate validates against 'smtp.gmail.com'.
async function resolveIpv4Host(hostname) {
    try {
        const res = await dns.lookup(hostname, { family: 4 });
        if (res && res.address) {
            console.log(`[smtp] dns.lookup(${hostname}) → ${res.address} (IPv4 ✅)`);
            return res.address;
        }
    } catch (err) {
        console.warn(`[smtp] dns.lookup(${hostname}) failed: ${err.message}`);
    }

    try {
        const addresses = await dns.resolve4(hostname);
        if (addresses && addresses.length > 0) {
            console.log(`[smtp] dns.resolve4(${hostname}) → ${addresses[0]} (IPv4 ✅)`);
            return addresses[0];
        }
    } catch (err) {
        console.warn(`[smtp] dns.resolve4(${hostname}) failed: ${err.message}`);
    }

    return hostname;
}

async function buildTransporter() {
    const smtpHost = await resolveIpv4Host('smtp.gmail.com');

    return nodemailer.createTransport({
        host:   smtpHost,
        port:   587,
        secure: false,             // STARTTLS (upgrades automatically)
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        tls: {
            servername: 'smtp.gmail.com',
            rejectUnauthorized: true
        },
        connectionTimeout: 15000,
        greetingTimeout:   15000,
        socketTimeout:     20000
    });
}

let isSmtpVerified  = false;
let lastSmtpError   = null;
let lastEmailSentAt = null;

// ── Helpers ──────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
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
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// ── Serve static frontend ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/health ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status:          'ok',
        service:         'portfolio-api',
        smtpConfigured:  !!(SMTP_USER && SMTP_PASS),
        smtpVerified:    isSmtpVerified,
        smtp:            !!(SMTP_USER && SMTP_PASS),
        lastSmtpError:   lastSmtpError,
        lastEmailSentAt: lastEmailSentAt
    });
});

// ── Rate limiter (5 req / IP / 15 min) ──────────────────────────
const ipRequestLog = new Map();
const RATE_LIMIT  = 5;
const RATE_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
    const now   = Date.now();
    const entry = ipRequestLog.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW) {
        ipRequestLog.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequestLog) {
        if (now - entry.start > RATE_WINDOW) ipRequestLog.delete(ip);
    }
}, RATE_WINDOW).unref();

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

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const trimmedName    = name.trim();
    const trimmedEmail   = email.trim();
    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
        return res.status(400).json({ error: 'Name, email, and message cannot be empty.' });
    }

    if (trimmedName.length > 100 || trimmedEmail.length > 100 || trimmedSubject.length > 200 || trimmedMessage.length > 5000) {
        return res.status(400).json({ error: 'Input exceeds maximum allowed length.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Reject header injection
    if (/[\r\n]/.test(trimmedName) || /[\r\n]/.test(trimmedEmail) || /[\r\n]/.test(trimmedSubject)) {
        return res.status(400).json({ error: 'Invalid characters in input.' });
    }

    try {
        const transporter = await buildTransporter();
        const cleanName   = trimmedName.replace(/["\\]/g, '');

        const mailOptions = {
            from:    `"${cleanName} via Portfolio" <${SMTP_USER}>`,
            replyTo: `"${cleanName}" <${trimmedEmail}>`,
            to:      CONTACT_EMAIL,
            subject: trimmedSubject ? `[Portfolio] ${trimmedSubject}` : '[Portfolio] New message',
            html: `
              <div style="font-family:monospace;background:#0d0d0d;color:#e0e0e0;padding:24px;border-radius:8px;max-width:600px;">
                <h2 style="color:#00d4ff;margin-top:0;">📨 New Portfolio Message</h2>
                <p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
                <p><strong>Email:</strong> <a href="mailto:${escapeHtml(trimmedEmail)}" style="color:#00d4ff;">${escapeHtml(trimmedEmail)}</a></p>
                <p><strong>Subject:</strong> ${escapeHtml(trimmedSubject || '(none)')}</p>
                <hr style="border-color:#333;margin:16px 0;">
                <p><strong>Message:</strong><br>${escapeHtml(trimmedMessage).replace(/\n/g, '<br>')}</p>
              </div>`
        };

        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 25000))
        ]);

        console.log(`[contact] ✅ Email sent successfully (id: ${info.messageId})`);
        isSmtpVerified  = true;
        lastSmtpError   = null;
        lastEmailSentAt = new Date().toISOString();
        res.json({ message: 'success' });
    } catch (err) {
        lastSmtpError = { message: err.message, code: err.code, time: new Date().toISOString() };
        console.error('[contact] ❌ Error:', err.message, '| code:', err.code);
        res.status(500).json({ error: 'Failed to send email. Please try again later.', details: err.message });
    }
});

// Reject unsupported methods on /api/contact
app.all('/api/contact', (req, res) => {
    res.set('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed.' });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.status === 400) {
        return res.status(400).json({ error: 'Invalid JSON in request body.' });
    }
    if (err.status === 413) {
        return res.status(413).json({ error: 'Request body exceeds maximum allowed size.' });
    }
    console.error('[server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ────────────────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        if (SMTP_USER && SMTP_PASS) {
            // Warm up: verify SMTP using an IPv4-resolved transporter
            buildTransporter()
                .then(t => t.verify())
                .then(() => {
                    isSmtpVerified = true;
                    console.log('[smtp] ✅ Gmail SMTP ready — emails will work');
                })
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
}

// Export the Express app for Vercel serverless function support
module.exports = app;
