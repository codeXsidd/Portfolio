/**
 * server.js — Portfolio Backend
 * Serves static files and handles the contact form via Nodemailer + Gmail SMTP.
 * Uses a Gmail App Password (not your regular Gmail password).
 * Generate one at: https://myaccount.google.com/apppasswords
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter (Gmail SMTP) ─────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER, // your Gmail address
        pass: process.env.SMTP_PASS  // your Gmail App Password (16-char)
    }
});

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
        subject: subject || 'New message',
        html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br />${message}</p>
    `
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
