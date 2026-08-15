/**
 * server.js — Portfolio Backend
 * Serves static files and handles contact form via Nodemailer + Brevo SMTP.
 * Brevo supports port 587 AND 2525 (2525 bypasses Render free tier port blocks).
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Nodemailer transporter via Brevo SMTP ───────────────────────
// Brevo SMTP works on Render free tier (port 587 + 2525 both supported)
// Sign up free at https://app.brevo.com → SMTP & API → SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    family: 4 // Force IPv4
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
