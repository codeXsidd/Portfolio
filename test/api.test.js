/**
 * test/api.test.js
 * Automated test suite for Portfolio OS backend endpoints:
 * - Express local/Render backend (server.js)
 * - Vercel serverless functions (api/contact.js, api/health.js)
 * Uses mocked nodemailer transport to avoid sending real emails.
 */

'use strict';

const assert = require('assert');
const nodemailer = require('nodemailer');
const dns = require('dns').promises;
dns.resolve4 = async () => ['127.0.0.1'];

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'mockpassword1234';
process.env.CONTACT_EMAIL = 'owner@example.com';

let sentMails = [];
let mockSendMailError = null;

// Mock nodemailer.createTransport
const originalCreateTransport = nodemailer.createTransport;
nodemailer.createTransport = function(options) {
  return {
    verify: async () => true,
    sendMail: async (mailOptions) => {
      if (mockSendMailError) throw mockSendMailError;
      sentMails.push(mailOptions);
      return { messageId: '<mock-msg-id-123@portfolio>' };
    }
  };
};

// Helper mock req/res for Vercel serverless handler testing
function createMockReqRes({ method = 'GET', url = '/', headers = {}, body = null } = {}) {
  const req = {
    method,
    url,
    headers: { ...headers },
    body,
    socket: { remoteAddress: '127.0.0.1' }
  };

  let statusCode = 200;
  let headersSent = {};
  let responseData = null;
  let ended = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader(key, value) {
      headersSent[key.toLowerCase()] = value;
      return this;
    },
    json(obj) {
      responseData = obj;
      ended = true;
      return this;
    },
    end(data) {
      responseData = data;
      ended = true;
      return this;
    },
    get statusCode() { return statusCode; },
    get headers() { return headersSent; },
    get data() { return responseData; },
    get ended() { return ended; }
  };

  return { req, res };
}

async function runTests() {
  console.log('🧪 Starting Portfolio OS API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}\n     ${err.message}`);
      failed++;
    }
  }

  async function testAsync(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}\n     ${err.message}`);
      failed++;
    }
  }

  console.log('--- 1. Vercel Serverless Function: api/health.js ---');
  const vercelHealth = require('../api/health.js');

  await testAsync('health.js GET returns 200 with service status', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await vercelHealth(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert.strictEqual(res.data.host, 'vercel');
    assert.strictEqual(res.data.smtpConfigured, true);
    assert.strictEqual(res.data.smtpVerified, false);
  });

  await testAsync('health.js OPTIONS returns 204', async () => {
    const { req, res } = createMockReqRes({ method: 'OPTIONS' });
    await vercelHealth(req, res);
    assert.strictEqual(res.statusCode, 204);
  });

  await testAsync('health.js POST returns 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes({ method: 'POST' });
    await vercelHealth(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  console.log('\n--- 2. Vercel Serverless Function: api/contact.js ---');
  const vercelContact = require('../api/contact.js');

  await testAsync('contact.js OPTIONS returns 204', async () => {
    const { req, res } = createMockReqRes({ method: 'OPTIONS' });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 204);
  });

  await testAsync('contact.js GET returns 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 405);
  });

  await testAsync('contact.js rejects missing fields with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: { name: 'Alice', email: 'alice@example.com' } // missing message
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testAsync('contact.js rejects invalid email with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.2' },
      body: { name: 'Alice', email: 'not-an-email', message: 'Hello' }
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await testAsync('contact.js rejects header injection (CR/LF in name/email) with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.3' },
      body: { name: 'Alice\r\nBcc: hacker@example.com', email: 'alice@example.com', message: 'Hello' }
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.error, 'Invalid characters in input.');
  });

  await testAsync('contact.js rejects excessive length input with 400', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.4' },
      body: { name: 'A'.repeat(150), email: 'alice@example.com', message: 'Hello' }
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.error, 'Input exceeds maximum allowed length.');
  });

  await testAsync('contact.js successfully sends email with valid payload', async () => {
    sentMails = [];
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.5' },
      body: { name: 'Alice', email: 'alice@example.com', subject: 'Inquiry', message: 'Hi there!' }
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.message, 'success');
    assert.strictEqual(sentMails.length, 1);
    assert.strictEqual(sentMails[0].to, 'owner@example.com');
  });

  await testAsync('contact.js correctly parses stringified JSON body', async () => {
    sentMails = [];
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.6' },
      body: JSON.stringify({ name: 'Alice', email: 'alice@example.com', message: 'String payload' })
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.message, 'success');
  });

  await testAsync('contact.js returns 400 on malformed JSON string body', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.7' },
      body: '{ not valid json '
    });
    await vercelContact(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.error, 'Invalid JSON in request body.');
  });

  await testAsync('contact.js returns 503 when SMTP_USER or SMTP_PASS is missing', async () => {
    const origUser = process.env.SMTP_USER;
    try {
      delete process.env.SMTP_USER;
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.8' },
        body: { name: 'Alice', email: 'alice@example.com', message: 'Hello' }
      });
      await vercelContact(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.data.error, 'Email service not configured.');
    } finally {
      process.env.SMTP_USER = origUser;
    }
  });

  await testAsync('contact.js returns 500 when Gmail SMTP authentication fails (535)', async () => {
    mockSendMailError = new Error('Invalid login: 535-5.7.8 Username and Password not accepted');
    mockSendMailError.code = 'EAUTH';
    mockSendMailError.responseCode = 535;
    try {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.9' },
        body: { name: 'Alice', email: 'alice@example.com', message: 'Hello' }
      });
      await vercelContact(req, res);
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.data.error, 'Failed to send email. Please try again later.');
    } finally {
      mockSendMailError = null;
    }
  });

  await testAsync('contact.js returns 504 when SMTP connection times out', async () => {
    mockSendMailError = new Error('Connection timed out');
    mockSendMailError.code = 'ETIMEDOUT';
    try {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.10' },
        body: { name: 'Alice', email: 'alice@example.com', message: 'Hello' }
      });
      await vercelContact(req, res);
      assert.strictEqual(res.statusCode, 504);
      assert.strictEqual(res.data.error, 'Email service timed out. Please try again later.');
    } finally {
      mockSendMailError = null;
    }
  });

  await testAsync('contact.js enforces per-instance rate limiting (429)', async () => {
    const ip = '10.0.0.99';
    let lastRes;
    for (let i = 0; i < 7; i++) {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
        body: { name: 'Bob', email: 'bob@example.com', message: `Msg ${i}` }
      });
      await vercelContact(req, res);
      lastRes = res;
    }
    assert.strictEqual(lastRes.statusCode, 429);
  });

  console.log('\n--- 3. Express Application: server.js ---');
  const app = require('../server.js');
  const http = require('http');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await testAsync('Express GET /api/health returns 200 and accurate smtpConfigured', async () => {
      const r = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(r.status, 200);
      const json = await r.json();
      assert.strictEqual(json.status, 'ok');
      assert.strictEqual(json.smtpConfigured, true);
    });

    await testAsync('Express GET /api/contact returns 405 Method Not Allowed', async () => {
      const r = await fetch(`${baseUrl}/api/contact`);
      assert.strictEqual(r.status, 405);
    });

    await testAsync('Express POST /api/contact with invalid email returns 400', async () => {
      const r = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bob', email: 'bademail', message: 'Hello' })
      });
      assert.strictEqual(r.status, 400);
    });

    await testAsync('Express POST /api/contact with CR/LF header injection returns 400', async () => {
      const r = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bob\nInjected: true', email: 'bob@example.com', message: 'Hello' })
      });
      assert.strictEqual(r.status, 400);
    });

    await testAsync('Express POST /api/contact with valid payload returns 200 and sends email', async () => {
      sentMails = [];
      const r = await fetch(`${baseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie', email: 'charlie@example.com', subject: 'Hire', message: 'Nice work!' })
      });
      assert.strictEqual(r.status, 200);
      const json = await r.json();
      assert.strictEqual(json.message, 'success');
      assert.strictEqual(sentMails.length, 1);
    });
  } finally {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }

  console.log('\n--- 4. Frontend Response Interpretation & Diagnostics ---');
  // Replicate the frontend response evaluation function from public/js/contact.js
  function interpretResponse(status, contentType, responseBodyText) {
    let data = null;
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseBodyText);
      } catch (_) {}
    }

    if (status === 200 && data && data.message === 'success') {
      return { success: true, message: 'Message sent successfully!' };
    }
    if (status === 404) {
      return { success: false, error: 'API endpoint not found (HTTP 404). Backend service unavailable.' };
    }
    if (status === 405) {
      return { success: false, error: 'Request method not allowed (HTTP 405).' };
    }
    if (status === 429) {
      return { success: false, error: 'Too many requests (HTTP 429). Please wait 15 minutes and try again.' };
    }
    if (status === 503) {
      return { success: false, error: 'Email service temporarily unavailable (HTTP 503). Please email directly.' };
    }
    if (status === 504) {
      return { success: false, error: 'Gateway timeout (HTTP 504). The server took too long to respond.' };
    }
    if (status === 500) {
      const errMsg = (data && typeof data.error === 'string') ? data.error : 'Failed to send email. Please try again later.';
      return { success: false, error: errMsg };
    }
    const errMsg = (data && typeof data.error === 'string') ? data.error : `Request failed (HTTP ${status}).`;
    return { success: false, error: errMsg };
  }

  test('Frontend correctly identifies HTTP 404 with non-JSON plain text body', () => {
    const res = interpretResponse(404, 'text/plain', 'The page could not be found\n\nNOT_FOUND');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /API endpoint not found \(HTTP 404\)/);
  });

  test('Frontend correctly identifies HTTP 405 Method Not Allowed', () => {
    const res = interpretResponse(405, 'application/json', '{"error":"Method not allowed."}');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /HTTP 405/);
  });

  test('Frontend correctly handles HTTP 429 Rate Limit', () => {
    const res = interpretResponse(429, 'application/json', '{"error":"Too many requests"}');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /Too many requests \(HTTP 429\)/);
  });

  test('Frontend correctly handles HTTP 503 Service Unavailable', () => {
    const res = interpretResponse(503, 'application/json', '{"error":"Email service not configured."}');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /Email service temporarily unavailable \(HTTP 503\)/);
  });

  test('Frontend correctly handles HTTP 504 Gateway Timeout', () => {
    const res = interpretResponse(504, 'application/json', '{"error":"Email service timed out."}');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /Gateway timeout \(HTTP 504\)/);
  });

  test('Frontend safely renders server 500 errors', () => {
    const res = interpretResponse(500, 'application/json', '{"error":"Failed to send email. Please try again later."}');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Failed to send email. Please try again later.');
  });

  test('Frontend gracefully handles HTML error pages without crashing JSON parser', () => {
    const res = interpretResponse(502, 'text/html', '<html><body>Bad Gateway</body></html>');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Request failed (HTTP 502).');
  });

  test('Frontend recognizes valid success response', () => {
    const res = interpretResponse(200, 'application/json', '{"message":"success"}');
    assert.strictEqual(res.success, true);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
  setTimeout(() => process.exit(0), 100);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
