const request = require('supertest');

// Mock dns.resolve4 to avoid real network calls
jest.mock('dns', () => ({
    promises: {
        resolve4: jest.fn().mockResolvedValue(['127.0.0.1'])
    }
}));

// Mock nodemailer to avoid real SMTP calls
jest.mock('nodemailer', () => ({
    createTransport: () => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
        verify:   jest.fn().mockResolvedValue(true)
    })
}));

// Provide fake SMTP credentials so the handler doesn't 503
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-pass';

const app = require('../server');

const validBody = { name: 'Test', email: 'test@example.com', message: 'Hello' };

describe('POST /api/contact rate limiting', () => {
    it('returns 429 after 5 requests within the window', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/contact')
                .set('X-Forwarded-For', '10.0.0.1')
                .send(validBody);
            expect(res.status).not.toBe(429);
        }
        const blocked = await request(app)
            .post('/api/contact')
            .set('X-Forwarded-For', '10.0.0.1')
            .send(validBody);
        expect(blocked.status).toBe(429);
        expect(blocked.body.error).toMatch(/too many requests/i);
    });
});
