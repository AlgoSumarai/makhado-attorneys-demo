# Makhado & Associates

A responsive, twelve-page law firm website using the supplied company logo, midnight navy, champagne accents and locally hosted fonts. Real HTML routes provide page-specific metadata without requiring JavaScript for content or navigation.

## Run

Requires Node.js 22.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. After changing templates or assets, run `npm run build` and refresh. Production: `npm run build`, then `npm start`. Deploy the Node server behind HTTPS. `dist/` can also be hosted statically, but the inquiry endpoint requires the server.

## Enable inquiry delivery

Copy `.env.example` to `.env` and supply SMTP host, port, username, password and an authorised sender. The recipient defaults to `info@makhadoattorneys.co.za`. Never put credentials in frontend files. Without configuration the form explicitly states that nothing was sent and provides the firm's email address. It never simulates successful delivery.

Inquiry data is validated on client and server, is not logged or saved to a database, and is sent only through the configured mail transport. Optional PDF attachments are limited to 3 MB. Source page and selected service are included in the message. Consent is required. In-memory rate limiting applies per connection IP; when deploying behind a proxy, add provider-level rate limiting because forwarded IP headers are deliberately not trusted. Configure hosting/email access and retention for the firm's requirements.

Set `SITE_URL` to the final canonical domain before building (default: https://makhadoattorneys.co.za). When building separately, ensure this variable is in the build environment. Confirm the privacy notice, fees, tax treatment, engagement terms and operational email delivery with the firm before public launch. No address, telephone number, attorneys, memberships or testimonials have been fabricated.

## Code formatting

The source uses Prettier with two-space indentation and a shared configuration in `.prettierrc.json`.
HTML template comments enable formatting inside the build script's template literals.

```sh
npm run format
npm run format:check
```

Generated output, dependencies, fonts and images are excluded from formatting.

## Verification

```sh
npm test
npx playwright install chromium
# With the local server running:
npm run test:browser
```

Browser checks cover all pages at desktop, tablet and mobile widths, overflow, menu interaction, service preselection, delivery failure, simulated success and reduced motion. Real email delivery requires valid SMTP credentials and a delivery check.

## Structure and assets

- `src/content.mjs`: practice areas, values and process content.
- `scripts/build.mjs`: reusable templates and static page generation.
- `public/styles.css`: responsive design system and motion preferences.
- `public/app.js`: accessible menu and inquiry interactions.
- `server.mjs`: static hosting and inquiry API.
- Supplied logo: `public/images/logo-original.png`.
- Client logo: `public/images/nn-security-logo.png`, sourced from [NN Security's website](https://nnsecurity.co.za/index.html). Add future clients to the `clients` array in `src/content.mjs`; the home page generates a seamless repeating logo strip from that list.
- Architectural photograph: [Unsplash](https://unsplash.com/photos/2gDwlIim3Uw), source image `photo-1486406146926-c627a92ad1ab`; represents architecture, not a claimed office location.
- Fonts: Cormorant Garamond and Inter, distributed under the SIL Open Font License; locally hosted to avoid third-party font requests.

Rebuild generates optimized WebP assets, sitemap, robots.txt, canonical metadata and Open Graph information. No advertising, analytics or cookies are included.
