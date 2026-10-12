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

// ── In-Memory Rate Limiting (Per-Instance Abuse Protection) ───────
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

async function buildTransporter(smtpUser, smtpPass) {
    let smtpHost = 'smtp.gmail.com';
    try {
        const addresses = await dns.resolve4('smtp.gmail.com');
        if (addresses && addresses.length > 0) {
            smtpHost = addresses[0];
        }
    } catch (_) {
        // Fallback to hostname
    }

    return nodemailer.createTransport({
        host:   smtpHost,
        port:   587,
        secure: false, // STARTTLS
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        tls: {
            servername:         'smtp.gmail.com',
            rejectUnauthorized: true
        },
        connectionTimeout: 10000,
        greetingTimeout:   10000,
        socketTimeout:     15000
    });
}

module.exports = async (req, res) => {
    // Generate request identifier for safe log tracing
    const reqId = 'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

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

    // Read and sanitize environment variables at runtime
    const rawUser    = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
    // Strip spaces if user pasted a 16-character Google App Password with spaces
    const rawPass    = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
    const rawContact = process.env.CONTACT_EMAIL ? process.env.CONTACT_EMAIL.trim() : rawUser;

    if (!rawUser || !rawPass) {
        console.warn(`[contact][${reqId}] ⚠️ Missing SMTP_USER or SMTP_PASS`);
        return res.status(503).json({ error: 'Email service not configured.' });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // Resilient body parsing (handles parsed object or raw string)
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (_) {
            return res.status(400).json({ error: 'Invalid JSON in request body.' });
        }
    }

    const { name, email, subject, message } = body || {};

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
        const transporter = await buildTransporter(rawUser, rawPass);
        const cleanName   = trimmedName.replace(/["\\]/g, '');

        const info = await Promise.race([
            transporter.sendMail({
                from:    `"${cleanName} via Portfolio" <${rawUser}>`,
                replyTo: `"${cleanName}" <${trimmedEmail}>`,
                to:      rawContact,
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
            new Promise((_, reject) => {
                const timeoutErr = new Error('SMTP operation timeout');
                timeoutErr.code = 'ETIMEDOUT';
                setTimeout(() => reject(timeoutErr), 20000);
            })
        ]);

        console.log(`[contact][${reqId}] ✅ Email sent successfully (id: ${info.messageId})`);
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        // Safe diagnostic logging: never print passwords or private message bodies
        console.error(`[contact][${reqId}] ❌ SMTP error:`, {
            code: err.code || 'UNKNOWN',
            responseCode: err.responseCode || null,
            command: err.command || null,
            message: err.message ? err.message.replace(rawPass || '###', '[REDACTED]') : 'Unknown error'
        });

        if (err.code === 'ETIMEDOUT' || err.message === 'SMTP operation timeout') {
            return res.status(504).json({ error: 'Email service timed out. Please try again later.' });
        }

        return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
};
