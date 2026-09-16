import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import nodemailer from 'nodemailer';
import { services } from './src/content.mjs';
const root = resolve('dist');
const maxBody = 4500000;
const validServices = new Set([...services.map((s) => s.name), 'General inquiry']);
export function validateInquiry(data) {
  if (!data || typeof data !== 'object') return 'Please complete the inquiry form.';

  for (const key of ['name', 'email', 'service', 'message', 'source'])
    if (typeof data[key] !== 'string') return 'Please complete all required fields.';

  if (
    !data.name.trim() ||
    data.name.length > 120 ||
    !/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    data.email.length > 254 ||
    /[\r\n]/.test(data.email)
  )
    return 'Please provide a valid name and email address.';

  if (
    !validServices.has(data.service) ||
    data.message.trim().length < 20 ||
    data.message.length > 5000 ||
    data.consent !== true
  )
    return 'Please select a service, describe your matter and provide consent.';

  const sourceService = services.find((s) => data.source === '/services/' + s.slug);
  if (data.source !== '/contact' && !sourceService)
    return 'Please submit your inquiry from a service or contact page.';

  for (const key of ['phone', 'company', 'contactMethod', 'urgency', 'requestType', 'date', 'time'])
    if (data[key] !== undefined && (typeof data[key] !== 'string' || data[key].length > 200))
      return 'Please check your contact and consultation details.';

  if (data.contactMethod === 'Phone' && !data.phone?.trim())
    return 'Please provide a phone number for your preferred contact method.';

  if (
    data.date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
      !Number.isFinite(Date.parse(data.date)) ||
      data.date < new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }))
  )
    return 'Please choose a valid future consultation date.';

  if (data.document) {
    const d = data.document;
    if (
      typeof d.name !== 'string' ||
      d.name.length > 200 ||
      typeof d.data !== 'string' ||
      d.data.length > 4200000 ||
      !d.name.toLowerCase().endsWith('.pdf') ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(d.data)
    )
      return 'Please attach a valid PDF no larger than 3 MB.';

    const buf = Buffer.from(d.data, 'base64');
    if (buf.length > 3 * 1024 * 1024 || buf.subarray(0, 5).toString() !== '%PDF-')
      return 'Please attach a valid PDF no larger than 3 MB.';
  }
  return null;
}


export function createServer({ sendMail, configured } = {}) {
  const ready =
    configured ??
    Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_FROM &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
    );
  const transport =
    ready && !sendMail
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          connectionTimeout: 10000,
          socketTimeout: 20000,
        })
      : null;
  const rate = new Map();
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    const json = (code, message) => {
      res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ message }));
    };
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      return json(400, 'Invalid request.');
    }
    if (url.pathname === '/api/inquiry') {
      if (req.method !== 'POST') return json(405, 'Method not allowed.');
      if (req.headers['sec-fetch-site'] === 'cross-site')
        return json(403, 'Please submit the form from this website.');
      if (!req.headers['content-type']?.startsWith('application/json'))
        return json(415, 'JSON content is required.');
      const ip = req.socket.remoteAddress,
        now = Date.now();
      for (const [key, value] of rate) if (value.until < now) rate.delete(key);
      const entry = rate.get(ip) || { count: 0, until: now + 15 * 60 * 1000 };
      entry.count++;
      rate.set(ip, entry);
      if (entry.count > 10)
        return json(429, 'Too many attempts. Please wait 15 minutes or contact the firm by email.');
      try {
        let data = req.body;
        if (data === undefined) {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > maxBody)
              return json(413, 'Your attachment is too large. Maximum PDF size is 3 MB.');
            chunks.push(chunk);
          }
          data = Buffer.concat(chunks).toString();
        }
        if (typeof data === 'string' || Buffer.isBuffer(data)) {
          try {
            data = JSON.parse(data.toString());
          } catch {
            return json(400, 'Invalid form data.');
          }
        }
        const invalid = validateInquiry(data);
        if (invalid) return json(400, invalid);
        if (!ready)
          return json(
            503,
            'Online inquiry delivery is not available yet. Your inquiry has not been sent. Please email info@makhadoattorneys.co.za.',
          );
        const labels = {
          name: 'Full name',
          email: 'Email',
          phone: 'Phone',
          company: 'Organisation',
          service: 'Service requested',
          source: 'Originating page',
          contactMethod: 'Preferred contact method',
          requestType: 'Request type',
          urgency: 'Timeframe',
          date: 'Preferred date',
          time: 'Preferred time',
          message: 'Matter description',
        };
        const mail = {
          from: process.env.SMTP_FROM,
          to: process.env.INQUIRY_TO || 'info@makhadoattorneys.co.za',
          replyTo: data.email,
          subject: `Website inquiry: ${data.service}`,
          text:
            Object.entries(labels)
              .map(([k, label]) => `${label}: ${data[k] || 'Not provided'}`)
              .join('\n\n') + '\n\nPrivacy consent: provided',
          attachments: data.document
            ? [
                {
                  filename: 'supporting-document.pdf',
                  content: Buffer.from(data.document.data, 'base64'),
                  contentType: 'application/pdf',
                },
              ]
            : [],
        };
        const sent = await (sendMail ? sendMail(mail) : transport.sendMail(mail));
        if (sent?.rejected?.length || !sent?.accepted?.length)
          return json(
            502,
            'Your inquiry could not be delivered. Please email info@makhadoattorneys.co.za.',
          );
        return json(200, 'Inquiry sent.');
      } catch {
        return json(
          502,
          'Your inquiry could not be delivered. Please try again or email info@makhadoattorneys.co.za.',
        );
      }
    }
    if (!['GET', 'HEAD'].includes(req.method)) return json(405, 'Method not allowed.');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return json(400, 'Invalid path.');
    }
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) return json(403, 'Forbidden.');
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    } catch {
      file = resolve(root, '404.html');
      status = 404;
    }
    try {
      const body = await readFile(file);
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.xml': 'application/xml',
        '.txt': 'text/plain',
      };
      res.writeHead(status, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, '0.0.0.0', () =>
    console.log(`Makhado & Associates: http://localhost:${port}`),
  );
}
