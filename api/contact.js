/**
 * api/contact.js — Vercel Serverless Function
 * Handles contact form email via Nodemailer + Gmail SMTP.
 *
 * Env vars configured in Vercel Dashboard → Settings → Environment Variables:
 *   SMTP_USER     = your_gmail@gmail.com
 *   SMTP_PASS     = your_16_char_app_password  (Google App Password)
 *   CONTACT_EMAIL = your_gmail@gmail.com
 */

'use strict';

const dns        = require('dns').promises;
const nodemailer = require('nodemailer');

const SMTP_USER     = process.env.SMTP_USER;
const SMTP_PASS     = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || SMTP_USER;

// ── In-Memory Rate Limiting (Per-Instance Abuse Protection) ───────
// Note: In serverless environments, in-memory Maps protect individual lambda instances.
// Durable, globally coordinated rate limiting across cold starts and separate regions
// would require an external distributed key-value store (e.g., Upstash Redis or Vercel KV).
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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

async function buildTransporter() {
    let smtpHost = 'smtp.gmail.com';
    try {
        const [ip] = await dns.resolve4('smtp.gmail.com');
        smtpHost = ip;
    } catch (_) {
        // Fallback to hostname
    }

    return nodemailer.createTransport({
        host:   smtpHost,
        port:   587,
        secure: false,
        auth:   { user: SMTP_USER, pass: SMTP_PASS },
        tls: {
            servername:         'smtp.gmail.com',
            rejectUnauthorized: true
        },
        connectionTimeout: 15000,
        greetingTimeout:   15000,
        socketTimeout:     20000
    });
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!SMTP_USER || !SMTP_PASS) {
        return res.status(503).json({ error: 'Email service not configured.' });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { name, email, subject, message } = req.body || {};

    // Validate types
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

    // Enforce reasonable maximum lengths
    if (trimmedName.length > 100 || trimmedEmail.length > 100 || trimmedSubject.length > 200 || trimmedMessage.length > 5000) {
        return res.status(400).json({ error: 'Input exceeds maximum allowed length.' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Sanitize email header values to reject CR/LF injection
    if (/[\r\n]/.test(trimmedName) || /[\r\n]/.test(trimmedEmail) || /[\r\n]/.test(trimmedSubject)) {
        return res.status(400).json({ error: 'Invalid characters in input.' });
    }

    try {
        const transporter = await buildTransporter();
        const cleanName   = trimmedName.replace(/["\\]/g, '');

        const info = await Promise.race([
            transporter.sendMail({
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
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 25000))
        ]);

        console.log(`[contact] ✅ Email sent successfully (id: ${info.messageId})`);
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        console.error('[contact] ❌ Error:', err.message, '| code:', err.code);
        return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
};
