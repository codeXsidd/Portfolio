/**
 * api/contact.js — Vercel Serverless Function
 * Handles contact form email via Nodemailer + Gmail SMTP.
 * Vercel does NOT block outbound SMTP — this works reliably.
 *
 * Env vars to set on Vercel Dashboard → Settings → Environment Variables:
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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;');
}

async function buildTransporter() {
    let smtpHost = 'smtp.gmail.com';
    try {
        const [ip] = await dns.resolve4('smtp.gmail.com');
        smtpHost = ip;
        console.log(`[smtp] smtp.gmail.com → ${ip} (IPv4)`);
    } catch (e) {
        console.warn('[smtp] resolve4 fallback to hostname:', e.message);
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
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    if (!SMTP_USER || !SMTP_PASS) {
        console.error('[contact] SMTP env vars missing.');
        return res.status(503).json({ error: 'Email service not configured.' });
    }

    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }

    try {
        const transporter = await buildTransporter();

        const info = await Promise.race([
            transporter.sendMail({
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
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 25000))
        ]);

        console.log(`[contact] ✅ Sent: ${name} <${email}> — ${info.messageId}`);
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        console.error('[contact] ❌ Error:', err.message, '| code:', err.code);
        return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
};
