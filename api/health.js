/**
 * api/health.js — Vercel Serverless Function
 * Health check endpoint.
 */

'use strict';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status:  'ok',
        service: 'portfolio-api',
        host:    'vercel',
        smtp:    !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    });
};
