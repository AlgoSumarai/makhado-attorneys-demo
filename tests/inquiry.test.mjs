import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, validateInquiry } from '../server.mjs';
const valid = {
  name: 'Test Person',
  email: 'test@example.com',
  service: 'Corporate Law',
  message: 'A test inquiry about a business agreement.',
  source: '/services/corporate-law',
  consent: true,
};
test('validates consent, email, source and attachments', () => {
  assert.equal(validateInquiry(valid), null);
  for (const change of [
    { consent: false },
    { email: 'invalid' },
    { source: '/unknown' },
    { message: 'short' },
    { contactMethod: 'Phone' },
    { document: { name: 'file.pdf', data: Buffer.from('not a pdf').toString('base64') } },
  ])
    assert.ok(validateInquiry({ ...valid, ...change }));
});
async function withServer(options, run) {
  const server = createServer(options);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}
const post = (url, data = valid) =>
  fetch(url + '/api/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
test('unconfigured delivery never returns false success', () =>
  withServer({ configured: false }, async (url) => {
    const res = await post(url);
    assert.equal(res.status, 503);
    assert.match((await res.json()).message, /not been sent/);
  }));
test('successful delivery identifies source and selected service', () =>
  withServer(
    {
      configured: true,
      sendMail: async (mail) => {
        assert.match(mail.text, /Originating page: \/services\/corporate-law/);
        assert.match(mail.subject, /Corporate Law/);
        assert.equal(mail.replyTo, valid.email);
        return { accepted: ['info@makhadoattorneys.co.za'] };
      },
    },
    async (url) => assert.equal((await post(url)).status, 200),
  ));
test('delivery rejection is an error', () =>
  withServer(
    { configured: true, sendMail: async () => ({ accepted: [], rejected: ['recipient'] }) },
    async (url) => assert.equal((await post(url)).status, 502),
  ));
test('rejects invalid submissions before mail delivery', () =>
  withServer(
    {
      configured: true,
      sendMail: async () => {
        throw Error('Should not send');
      },
    },
    async (url) => assert.equal((await post(url, { ...valid, consent: false })).status, 400),
  ));
