/**
 * server.js — Portfolio Backend
 * Serves static files and handles the contact form via Nodemailer.
 * No database. No unused routes.
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter ──────────────────────────────────────
const smtpPort = process.env.SMTP_PORT || 465;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: Number(smtpPort) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// ── Middleware ──────────────────────────────────────────────────
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigin = process.env.FRONTEND_URL;
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if origin matches FRONTEND_URL. If FRONTEND_URL is not set, allow all for dev.
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
    res.json({
        status: 'ok',
        service: 'portfolio-api'
    });
});

// ── POST /api/contact ───────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const mailOptions = {
        from:    `"Portfolio Contact" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to:      process.env.CONTACT_EMAIL || process.env.RECEIVER_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER,
        subject: `Portfolio Contact: ${subject || '(no subject)'}`,
        text:    `New message from your portfolio.\n\nName:    ${name}\nEmail:   ${email}\nSubject: ${subject || '—'}\n\nMessage:\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[contact] Email received from ${name} <${email}>`);
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
