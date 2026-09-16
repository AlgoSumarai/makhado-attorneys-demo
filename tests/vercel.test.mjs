import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import inquiry from '../api/inquiry.js';
import { validateInquiry } from '../server.mjs';

const valid = {
  name: 'Test Person',
  email: 'test@example.com',
  service: 'Corporate Law',
  message: 'A test inquiry about a business agreement.',
  source: '/services/corporate-law',
  consent: true,
};

test('Vercel adapter accepts a pre-parsed request body without hanging', async () => {
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = JSON.parse(Buffer.concat(chunks).toString());
    return inquiry(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...valid, consent: false }),
      signal: AbortSignal.timeout(3000),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /consent/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('3 MB PDF limit keeps encoded requests below Vercel payload limit', () => {
  const pdf = Buffer.alloc(3 * 1024 * 1024);
  pdf.write('%PDF-');
  const data = { ...valid, document: { name: 'support.pdf', data: pdf.toString('base64') } };
  assert.equal(validateInquiry(data), null);
  assert.ok(Buffer.byteLength(JSON.stringify(data)) < 4.5 * 1000 * 1000);
  data.document.data = Buffer.concat([pdf, Buffer.from('x')]).toString('base64');
  assert.match(validateInquiry(data), /3 MB/);
});
