/**
 * api/health.js — Vercel Serverless Function
 * Health check endpoint.
 */

'use strict';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    res.status(200).json({
        status:         'ok',
        service:        'portfolio-api',
        host:           'vercel',
        smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
        smtpVerified:   false, // Serverless execution distinguishes configured env from active connection verification
        smtp:           !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    });
};
