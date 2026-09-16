import { mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import nodeProcess from 'node:process';
import { clients, services, steps, values } from '../src/content.mjs';
const origin = (
  nodeProcess.env.SITE_URL ||
  (nodeProcess.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${nodeProcess.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://makhadoattorneys.co.za')
).replace(/\/$/, '');
const assetVersion = createHash('sha256')
  .update(await readFile('public/styles.css'))
  .update(await readFile('public/app.js'))
  .digest('hex')
  .slice(0, 12);
await mkdir('dist', { recursive: true });
await sharp('public/images/logo-original.png')
  .resize({ width: 640 })
  .webp({ quality: 92 })
  .toFile('public/images/logo.webp');
await sharp('public/images/architecture.jpg')
  .resize({ width: 1500 })
  .webp({ quality: 82 })
  .toFile('public/images/architecture.webp');
await sharp('public/images/architecture.jpg')
  .resize({ width: 750 })
  .webp({ quality: 80 })
  .toFile('public/images/architecture-small.webp');
await sharp('public/images/logo-original.png')
  .extract({ left: 210, top: 25, width: 1370, height: 660 })
  .resize(96, 48)
  .png()
  .toFile('public/images/favicon.png');
await cp('public', 'dist', { recursive: true });
const arrow = '<span aria-hidden="true">↗</span>';
const link = (href, text, cls = 'button') =>
  /* HTML */ `<a class="${cls}" href="${href}">${text}${arrow}</a>`;
const eyebrow = (t) => /* HTML */ `<p class="eyebrow"><span></span>${t}</p>`;
const image = (cls = '', lazy = true) =>
  /* HTML */ `<img
    class="${cls}"
    src="/images/architecture.webp"
    srcset="/images/architecture-small.webp 750w, /images/architecture.webp 1500w"
    sizes="(max-width: 700px) 100vw, 55vw"
    width="1500"
    height="1000"
    alt="Geometric glass architecture viewed from below"
    ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'}
  />`;
const icon = (name) => {
  const shapes = {
    building:
      '<path d="M8 28V7h16v21M4 28h24M12 11h2m4 0h2m-8 5h2m4 0h2m-8 5h2m4 0h2M14 28v-3h4v3"/>',
    scales: '<path d="M16 4v24M9 28h14M5 10h22M8 10 3 21h10L8 10Zm16 0-5 11h10l-5-11ZM13 6h6"/>',
    document: '<path d="M8 3h11l6 6v20H8ZM19 3v7h6M12 15h9m-9 5h9m-9 5h5"/>',
    dialogue: '<path d="M4 5h24v17H12l-8 6ZM9 11h14M9 16h9"/>',
  };
  return /* HTML */ `<svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    aria-hidden="true"
  >
    ${shapes[name]}
  </svg>`;
};
const nav = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/services', 'Services'],
  ['/our-process', 'Our Process'],
  ['/fees', 'Fees'],
  ['/contact', 'Contact'],
];
function header(path) {
  return /* HTML */ `<a href="#main" class="skip-link">Skip to content</a>
    <header class="header">
      <div class="container nav-wrap">
        <a class="brand" href="/" aria-label="Makhado & Associates home"
          ><img src="/images/logo.webp" width="196" height="96" alt="Makhado & Associates" /></a
        ><button class="menu-toggle" aria-controls="navigation" aria-expanded="false">
          <span>Menu</span><span aria-hidden="true">☰</span>
        </button>
        <nav id="navigation" aria-label="Main navigation">
          ${nav.map(([url, title]) => /* HTML */ `<a ${path === url || (url === '/services' && path.startsWith('/services/')) ? 'aria-current="page"' : ''} href="${url}">${title}</a>`).join('')}${link('/contact', 'Request a consultation', 'button nav-cta')}
        </nav>
      </div>
    </header>`;
}
const footer = () =>
  /* HTML */ `<footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="/"
          ><img src="/images/logo.webp" width="226" height="111" alt="Makhado & Associates"
        /></a>
        <p>Professional legal advisory & services.<br />Grounded in integrity. Guided by you.</p>
      </div>
      <div>
        <h2>Explore</h2>
        ${nav.map(([u, t]) => /* HTML */ `<a href="${u}">${t}</a>`).join('')}
      </div>
      <div>
        <h2>Practice areas</h2>
        ${services.map((s) => /* HTML */ `<a href="/services/${s.slug}">${s.name}</a>`).join('')}
      </div>
      <div>
        <h2>Start a conversation</h2>
        <a class="email" href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a>
        <p>Considered advice begins<br />with understanding your needs.</p>
        ${link('/contact', 'Get in touch', 'text-link')}
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} Makhado & Associates.</span>
      <div><a href="/privacy">Privacy Policy</a><a href="/legal">Legal Notice</a></div>
    </div>
    <p class="container disclaimer">
      The information on this website is general information and is not legal advice. Submitting an
      inquiry does not establish an attorney-client relationship.
    </p>
  </footer>`;
const cta = () =>
  /* HTML */ `<section class="cta">
    <div class="container cta-inner">
      <div>
        ${eyebrow('LET’S FIND A WAY FORWARD')}
        <h2>Every legal matter begins<br />with a <em>conversation.</em></h2>
        <p>Tell us what you need. We’ll help you understand the next step.</p>
      </div>
      <div class="cta-actions">
        ${link('/contact?type=consultation', 'Request a consultation')}${link('/contact', 'Send an inquiry', 'text-link')}
      </div>
    </div>
  </section>`;
function heading(k, h, p = '') {
  return /* HTML */ `<div class="section-heading">
    ${eyebrow(k)}
    <h2>${h}</h2>
    ${p ? /* HTML */ `<p>${p}</p>` : ''}
  </div>`;
}
function cards() {
  return /* HTML */ `<div class="service-grid">
    ${services
      .map(
        (s, i) =>
          /* HTML */ `<article class="service-card reveal">
            <div class="card-top">${icon(s.icon)}<span>0${i + 1}</span></div>
            <h3><a href="/services/${s.slug}">${s.name}</a></h3>
            <p>${s.short}</p>
            <div class="card-links">
              ${link('/services/' + s.slug, 'Learn more', 'text-link')}<a
                href="/services/${s.slug}#inquiry"
                >Send inquiry</a
              >
            </div>
          </article>`,
      )
      .join('')}
  </div>`;
}
function process() {
  return /* HTML */ `<div class="process-grid">
    ${steps
      .map(
        ([title, desc], i) =>
          /* HTML */ `<article class="process-step reveal">
            <span class="step-number">0${i + 1}</span>
            <h3>${title}</h3>
            <p>${desc}</p>
          </article>`,
      )
      .join('')}
  </div>`;
}
function pageHero(k, title, description) {
  return /* HTML */ `<section class="page-hero">
    <div class="container">
      ${eyebrow(k)}
      <h1>${title}</h1>
      <p>${description}</p>
    </div>
    <span class="hero-watermark" aria-hidden="true">MA</span>
  </section>`;
}
function form(service = '') {
  return /* HTML */ `<form
    class="inquiry-form"
    id="inquiry-form"
    method="post"
    action="/api/inquiry"
  >
    <noscript
      ><p class="form-note">
        Please enable JavaScript to use this form, or email info@makhadoattorneys.co.za directly.
      </p></noscript
    ><input
      type="hidden"
      name="source"
      value="${service ? '/services/' + services.find((s) => s.name === service).slug : '/contact'}"
    />
    <div class="form-grid">
      <label
        >Full name <span>*</span
        ><input
          name="name"
          autocomplete="name"
          required
          maxlength="120"
          placeholder="Your full name" /></label
      ><label
        >Email address <span>*</span
        ><input
          type="email"
          name="email"
          autocomplete="email"
          required
          maxlength="254"
          placeholder="you@example.com" /></label
      ><label
        >Phone number<input
          name="phone"
          type="tel"
          autocomplete="tel"
          maxlength="40"
          placeholder="Your contact number" /></label
      ><label
        >Company / organisation<input
          name="company"
          autocomplete="organization"
          maxlength="160"
          placeholder="If applicable" /></label
      ><label
        >Service required <span>*</span
        ><select name="service" required>
          <option value="">Select a practice area</option>
          ${services.map((s) => /* HTML */ `<option ${s.name === service ? 'selected' : ''}>${s.name}</option>`).join('')}
          <option>General inquiry</option>
        </select></label
      ><label
        >Preferred contact method<select name="contactMethod">
          <option>Email</option>
          <option>Phone</option>
        </select></label
      ><label
        >Urgency / preferred timeframe<select name="urgency">
          <option>No specific deadline</option>
          <option>Within a week</option>
          <option>Within a month</option>
          <option>Time-sensitive matter</option>
        </select></label
      ><label
        >Request type<select name="requestType">
          <option>Service inquiry</option>
          <option>Consultation request</option>
        </select></label
      ><label>Preferred consultation date<input type="date" name="date" /></label
      ><label
        >Preferred consultation time<select name="time">
          <option value="">No preference</option>
          <option>Morning</option>
          <option>Afternoon</option>
        </select></label
      ><label class="full"
        >Brief description of your legal matter <span>*</span
        ><textarea
          name="message"
          required
          minlength="20"
          maxlength="5000"
          rows="5"
          placeholder="Briefly outline your matter and how we can assist (at least 20 characters). Please avoid highly sensitive details at this stage."
        ></textarea></label
      ><label class="full upload"
        >Supporting document <small>Optional · PDF only · maximum 3 MB</small
        ><input type="file" name="document" accept="application/pdf,.pdf"
      /></label>
    </div>
    <label class="consent"
      ><input type="checkbox" name="consent" required /><span
        >I consent to the use of my information to respond to this inquiry, as described in the
        <a href="/privacy">Privacy Policy</a>. <span aria-hidden="true">*</span></span
      ></label
    >
    <p class="form-note">
      Submitting an inquiry does not establish an attorney-client relationship. Consultation dates
      are requests and are subject to confirmation. Please do not use this form for urgent
      deadlines.
    </p>
    <button class="button" type="submit">Send inquiry ${arrow}</button>
    <div class="form-status" role="status" aria-live="polite" tabindex="-1"></div>
    <p class="direct-email">
      Prefer email? <a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a>
    </p>
  </form>`;
}
const inquiry = (service) =>
  /* HTML */ `<section class="section paper" id="inquiry">
    <div class="container inquiry-layout">
      <div>
        ${heading('TAKE THE NEXT STEP', 'Let’s discuss<br><em>your matter.</em>', 'Share a little about your circumstances. Your inquiry will help us understand how we may assist.')}
        <div class="inquiry-aside">
          ${icon('dialogue')}
          <h3>A considered first step</h3>
          <p>
            Professional guidance begins with listening. We approach every inquiry with care and
            discretion.
          </p>
          <a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a>
        </div>
      </div>
      ${form(service)}
    </div>
  </section>`;
function clientMarquee() {
  const repetitions = Math.max(1, Math.ceil(5 / clients.length));
  const logoGroup = (groupIndex) =>
    Array.from({ length: repetitions }, (_, repetition) =>
      clients
        .map((client) => {
          const duplicate = groupIndex > 0 || repetition > 0;
          return /* HTML */ `
            <a
              class="client-logo"
              href="${client.website}"
              target="_blank"
              rel="noopener noreferrer"
              ${duplicate ? 'aria-hidden="true" tabindex="-1"' : ''}
            >
              <img
                src="${client.logo}"
                alt="${duplicate ? '' : client.name}"
                width="244"
                height="80"
                loading="lazy"
              />
              <span aria-hidden="true">${client.name}</span>
            </a>
          `;
        })
        .join(''),
    ).join('');

  return /* HTML */ `
    <section class="clients-section" aria-labelledby="clients-heading">
      <div class="container clients-heading">
        <span class="tiny-line" aria-hidden="true"></span>
        <h2 id="clients-heading">Our clients</h2>
      </div>
      <div class="clients-marquee">
        <div class="clients-track">
          <div class="clients-group">${logoGroup(0)}</div>
          <div class="clients-group" aria-hidden="true">${logoGroup(1)}</div>
        </div>
      </div>
    </section>
  `;
}

const home = () =>
  /* HTML */ `<section class="hero">
      <div class="hero-photo">
        ${image('', false)}
        <div class="photo-caption">
          <span>CLARITY. INTEGRITY. CONFIDENCE.</span><span>MA /</span>
        </div>
      </div>
      <div class="container hero-content">
        ${eyebrow('MAKHADO & ASSOCIATES')}
        <h1>Sound advice.<br />Strong principles.<br /><em>Your way forward.</em></h1>
        <p>
          Professional legal guidance for the decisions that matter.<br class="desktop-only" />
          Rooted in integrity. Focused on you.
        </p>
        <div class="hero-actions">
          ${link('/contact?type=consultation', 'Request a consultation')}${link('/services', 'Explore our services', 'text-link')}
        </div>
        <div class="hero-note">
          <span class="tiny-line"></span>PROFESSIONAL LEGAL ADVISORY & SERVICES
        </div>
      </div>
    </section>
    <section class="marquee" aria-label="Our legal capabilities">
      <div class="marquee-track">
        ${[0, 1].map((i) => /* HTML */ `<div class="marquee-group" ${i ? 'aria-hidden="true"' : ''}>${['Corporate law', 'Litigation & dispute resolution', 'Contract & legal drafting', 'Legal consultation', 'Legal advisory', 'Regulatory compliance', 'Legal documentation', 'Legal representation'].map((t) => /* HTML */ `<span>${t}</span><b aria-hidden="true">✦</b>`).join('')}</div>`).join('')}
      </div>
    </section>
    <section class="section paper">
      <div class="container about-preview">
        <div>
          ${eyebrow('A FIRM BUILT ON PRINCIPLE')}
          <h2>Legal clarity.<br /><em>Human understanding.</em></h2>
        </div>
        <div>
          <p class="lead">
            Behind every legal matter is a person, a business, or a future worth protecting.
          </p>
          <p>
            At Makhado & Associates, we bring careful analysis and a considered approach to your
            legal needs. Our work is grounded in integrity, accuracy and a commitment to clear,
            practical solutions.
          </p>
          ${link('/about', 'Get to know our firm', 'text-link dark-link')}
        </div>
      </div>
    </section>
    ${clientMarquee()}
    <section class="section practice-section">
      <div class="container">
        <div class="heading-row">
          ${heading('OUR PRACTICE AREAS', 'Expertise for what<br><em>matters to you.</em>')}${link('/services', 'View all services', 'text-link dark-link')}
        </div>
        ${cards()}
      </div>
    </section>
    <section class="values-section">
      <div class="container values-layout">
        <div>
          ${heading('THE MAKHADO & ASSOCIATES APPROACH', 'Principled in practice.<br><em>Personal in approach.</em>')}
          <p>
            Trust is built in the way we work: carefully, transparently and with your needs at the
            centre.
          </p>
        </div>
        <div class="values-grid">
          ${values
            .map(
              ([t, d], i) =>
                /* HTML */ `<article class="reveal">
                  <span>0${i + 1}</span>
                  <h3>${t}</h3>
                  <p>${d}</p>
                </article>`,
            )
            .join('')}
        </div>
      </div>
    </section>
    <section class="section paper">
      <div class="container">
        <div class="heading-row">
          ${heading('A CLEAR PATH FORWARD', 'From first conversation<br>to <em>next steps.</em>')}${link('/our-process', 'How we work', 'text-link dark-link')}
        </div>
        ${process()}
      </div>
    </section>
    <section class="section audience-section">
      <div class="container audience-layout">
        ${image('audience-photo')}
        <div>
          ${heading('WHO WE ASSIST', 'Different needs.<br>The same <em>commitment.</em>')}
          <p>Thoughtful legal support, tailored to your circumstances.</p>
          <ul class="editorial-list">
            <li><span>01</span>Corporate & business entities</li>
            <li><span>02</span>Individuals</li>
            <li><span>03</span>Organisations & institutions</li>
          </ul>
        </div>
      </div>
    </section>
    <section class="fees-preview paper">
      <div class="container heading-row">
        <div>
          ${eyebrow('CLARITY FROM THE OUTSET')}
          <h2>Considered advice.<br /><em>Transparent fees.</em></h2>
          <p>Understand the cost of your legal support before the next step.</p>
          ${link('/fees', 'Explore our fee structure', 'text-link dark-link')}
        </div>
        <div class="fee-highlight">
          <span>INITIAL CONSULTATION</span><strong>R2,500<span> / up to 60 minutes</span></strong>
          <p>
            A focused conversation about your legal needs.<br />Payable upon consultation. All fees
            in ZAR.
          </p>
        </div>
      </div>
    </section>
    ${cta()}`;
const about = () =>
  /* HTML */ `${pageHero('ABOUT OUR FIRM', 'Grounded in integrity.<br><em>Focused on people.</em>', 'Professional legal assistance, delivered with care, clarity and a commitment to ethical practice.')}
    <section class="section paper">
      <div class="container about-preview">
        ${heading('WHO WE ARE', 'A considered approach<br>to <em>legal service.</em>')}
        <div>
          <p class="lead">
            Makhado & Associates is committed to professional legal services built on integrity,
            accuracy and confidentiality.
          </p>
          <p>
            We believe sound legal guidance begins with understanding. Through clear legal analysis
            and strategic solutions, we help clients consider their options and make informed
            decisions.
          </p>
          <p>
            Our work brings together legal advisory, representation, documentation and compliance
            support for businesses, individuals and institutions.
          </p>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container vision-grid">
        <article>
          ${eyebrow('OUR VISION')}
          <h2>“To become a trusted law firm that delivers reliable and ethical legal services.”</h2>
        </article>
        <article>
          ${eyebrow('OUR MISSION')}
          <ul class="editorial-list">
            <li>Provide professional legal assistance</li>
            <li>Uphold integrity and legal responsibility</li>
            <li>Deliver clear and effective legal solutions</li>
          </ul>
        </article>
      </div>
    </section>
    <section class="values-section">
      <div class="container">
        ${heading('OUR VALUES', 'The principles behind <em>our practice.</em>')}
        <div class="values-grid four">
          ${values
            .map(
              ([t, d]) =>
                /* HTML */ `<article>
                  <h3>${t}</h3>
                  <p>${d}</p>
                </article>`,
            )
            .join('')}
        </div>
      </div>
    </section>
    <section class="section paper">
      <div class="container two-columns">
        <article>
          ${heading('ETHICS & RESPONSIBILITY', 'Trust through<br><em>professional conduct.</em>')}
          <p>
            Our approach is guided by ethical legal practice, applicable laws and regulations,
            transparency and professional responsibility. We take confidentiality seriously and aim
            to communicate clearly about the scope and progress of each matter.
          </p>
        </article>
        <article>
          ${heading('LOOKING AHEAD', 'Committed to<br><em>continual development.</em>')}
          <p>
            We aim to strengthen our legal expertise, expand the quality of our services and adapt
            to legal developments while maintaining professional standards. Our focus remains on
            reliable assistance that responds to the needs of our clients.
          </p>
        </article>
      </div>
    </section>
    ${cta()}`;
const servicesPage = () =>
  /* HTML */ `${pageHero('OUR PRACTICE AREAS', 'Clear advice.<br><em>Considered solutions.</em>', 'Legal assistance shaped around your circumstances, your responsibilities and your next step.')}
    <section class="section paper">
      <div class="container">
        ${cards()}
        <div class="support-band">
          <h2>Connected legal support</h2>
          <p>
            Across our practice areas, we provide legal advisory and consultation, representation
            and assistance, documentation and review, and compliance and regulatory support. We’ll
            help identify the appropriate scope for your inquiry.
          </p>
        </div>
      </div>
    </section>
    ${cta()}`;
const servicePage = (s) =>
  /* HTML */ `${pageHero('OUR PRACTICE AREAS', s.name, s.intro)}
    <div class="service-subnav container">
      <a href="/services">← All practice areas</a>${link('#inquiry', 'Send an inquiry', 'button')}
    </div>
    <section class="section paper">
      <div class="container service-overview">
        <div>
          ${heading('UNDERSTANDING YOUR NEEDS', 'Legal guidance with<br><em>your context in mind.</em>')}
          <p class="lead">${s.overview}</p>
        </div>
        ${image('service-photo')}
      </div>
    </section>
    <section class="section">
      <div class="container two-columns">
        ${heading('HOW WE CAN ASSIST', 'Support for your<br><em>legal needs.</em>')}
        <div>
          <ul class="editorial-list">
            ${s.matters.map((m, i) => /* HTML */ `<li><span>0${i + 1}</span>${m}</li>`).join('')}
          </ul>
          <p class="form-note">
            The appropriate scope of assistance depends on an assessment of your circumstances.
            Outcomes cannot be guaranteed.
          </p>
        </div>
      </div>
    </section>
    <section class="section paper">
      <div class="container">
        ${heading('WHAT TO EXPECT', 'A clear process, <em>at every step.</em>')}${process()}
      </div>
    </section>
    ${inquiry(s.name)}`;
const processPage = () =>
  /* HTML */ `${pageHero('OUR PROCESS', 'Careful consideration.<br><em>Clear next steps.</em>', 'A structured approach to your matter, with understanding and communication at its heart.')}
    <section class="section paper">
      <div class="container long-process">
        ${steps
          .map(
            ([t, d], i) =>
              /* HTML */ `<article class="reveal">
                <span class="step-number">0${i + 1}</span>
                <div>
                  <h2>${t}</h2>
                  <p>${d}</p>
                  <p>
                    ${['Bring a brief summary of your matter, relevant documents and any known dates or deadlines. This helps us understand the context and discuss whether we can assist.', 'We consider the relevant facts and documents, discuss the available options and explain the proposed scope of work and fees before proceeding.', 'The steps depend on your matter and may include drafting, reviewing documents, negotiation or representation. We keep the agreed objectives in view.', 'As your matter develops, we consider whether the approach needs to change and discuss any further assistance that may be appropriate.'][i]}
                  </p>
                </div>
              </article>`,
          )
          .join('')}${link('/contact?type=consultation', 'Discuss your matter with us')}
      </div>
    </section>
    ${cta()}`;
const fees = () =>
  /* HTML */ `${pageHero('OUR FEES', 'Transparency is part<br>of <em>our commitment.</em>', 'Clear fee structures to help you plan your legal support. All amounts are in South African Rand (ZAR).')}
    <section class="section paper">
      <div class="container">
        <div class="pricing-intro">
          <article class="pricing-card">
            ${eyebrow('HOURLY BILLING')}
            <h2>R1,700<span> per hour</span></h2>
            <p>For legal work billed according to time spent.</p>
            <div>Billing occurs in 0.1-hour increments.</div>
          </article>
          <article class="pricing-card">
            ${eyebrow('INITIAL CONSULTATION')}
            <h2>R2,500<span> up to 60 minutes</span></h2>
            <p>A focused discussion of your circumstances and legal needs.</p>
            <div>Consultation fee payable upon consultation.</div>
          </article>
        </div>
        <div class="retainers">
          ${heading('ONGOING LEGAL SUPPORT', 'A retainer for<br><em>continuing peace of mind.</em>', 'Retainer options are intended for ongoing legal needs and general counsel support.')}
          <div class="retainer-grid">
            ${[
              ['Bronze', '10', '17,000'],
              ['Silver', '20', '34,000'],
              ['Gold', '40', '68,000'],
            ]
              .map(
                ([n, h, p]) =>
                  /* HTML */ `<article class="pricing-card">
                    <span class="retainer-tier">${n}</span>
                    <h3>R${p}</h3>
                    <p>${h} hours of legal support</p>
                    ${link('/contact?type=consultation', 'Discuss this option', 'text-link dark-link')}
                  </article>`,
              )
              .join('')}
          </div>
          <p class="retainer-note">
            Unused retainer hours may roll over for up to six months. The scope of work and
            applicable terms will be discussed with you before engagement.
          </p>
          ${link('/contact', 'Discuss your requirements')}
        </div>
      </div>
    </section>
    ${cta()}`;
const contact = () =>
  /* HTML */ `${pageHero('CONTACT & CONSULTATION', 'Your next step<br>starts <em>here.</em>', 'Request a consultation or send a service inquiry. Let’s begin with an understanding of what you need.')}
    <div class="contact-strip container">
      <span>DIRECT EMAIL</span
      ><a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za ${arrow}</a>
    </div>
    ${inquiry('')}`;
const legal = (privacy) =>
  /* HTML */ `${pageHero(privacy ? 'PRIVACY POLICY' : 'LEGAL NOTICE', privacy ? 'Your information.<br><em>Handled with care.</em>' : 'Clear information.<br><em>Responsible use.</em>', privacy ? 'How information submitted through this website is used.' : 'Please read these terms when using this website.')}
    <section class="section paper">
      <div class="container legal-copy">
        ${
          privacy
            ? /* HTML */ `<h2>Information you choose to share</h2>
                <p>
                  The inquiry form collects your name, contact details, selected service, matter
                  description and any optional consultation preferences or supporting PDF you
                  supply. Please provide only the information needed for an initial inquiry and
                  avoid highly sensitive material.
                </p>
                <h2>Why we use your information</h2>
                <p>
                  Your information is used to assess and respond to your inquiry, discuss a possible
                  consultation and communicate about your requested services. Submitting the form
                  does not establish an attorney-client relationship.
                </p>
                <h2>Delivery, access and retention</h2>
                <p>
                  When email delivery is enabled, inquiries are sent to the firm’s designated email
                  address through its email provider. The website does not store inquiry content in
                  browser storage or an application database. The firm may retain correspondence as
                  needed to respond to your matter and meet applicable obligations. Access should be
                  limited to those who need it to handle the inquiry.
                </p>
                <h2>Your choices</h2>
                <p>
                  You may contact
                  <a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a> to
                  request access to or correction of your information, ask about deletion, withdraw
                  consent, or raise a privacy concern, subject to applicable obligations.
                </p>
                <h2>Website technology</h2>
                <p>
                  This website does not use advertising cookies or analytics trackers. Hosting and
                  email providers may process technical information needed to operate and secure
                  their services. Fonts and images are served with the site.
                </p>
                <h2>Questions</h2>
                <p>
                  For questions about information handling, email
                  <a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a>.
                </p>`
            : /* HTML */ `<h2>General information</h2>
                <p>
                  This website describes the services and approach of Makhado & Associates. Its
                  content is general information and should not be treated as legal advice for a
                  particular matter. Seek advice based on your individual circumstances before
                  acting.
                </p>
                <h2>No attorney-client relationship</h2>
                <p>
                  Browsing this site, sending an inquiry or requesting a consultation does not by
                  itself establish an attorney-client relationship. Any engagement is subject to
                  acceptance and agreement on the scope of work and fees.
                </p>
                <h2>No guarantee of outcomes</h2>
                <p>
                  Legal matters depend on their individual facts and circumstances. No statement on
                  this website promises a particular result.
                </p>
                <h2>Consultations and fees</h2>
                <p>
                  Consultation requests are subject to confirmation. Fees shown are in South African
                  Rand. The applicable scope, fee terms and any additional costs should be confirmed
                  with the firm before work begins.
                </p>
                <h2>Urgent matters</h2>
                <p>
                  Website inquiries may not be reviewed immediately. Do not rely on this form to
                  meet a legal deadline.
                </p>
                <h2>Contact</h2>
                <p>
                  Please send website or service questions to
                  <a href="mailto:info@makhadoattorneys.co.za">info@makhadoattorneys.co.za</a>.
                </p>`
        }
      </div>
    </section>`;
const routes = [
  [
    '/',
    'Professional Legal Advisory & Services',
    'Professional legal assistance grounded in integrity. Explore corporate law, dispute resolution, legal drafting and consultations at Makhado & Associates.',
    home,
  ],
  [
    '/about',
    'About Our Firm',
    'Learn about the principles, vision and professional approach of Makhado & Associates.',
    about,
  ],
  [
    '/services',
    'Legal Services & Practice Areas',
    'Explore corporate law, litigation, contract drafting and legal consultation services.',
    servicesPage,
  ],
  ...services.map((s) => ['/services/' + s.slug, s.name, s.intro, () => servicePage(s)]),
  [
    '/our-process',
    'Our Process',
    'Understand our approach from initial consultation through assessment, action and follow-up.',
    processPage,
  ],
  [
    '/fees',
    'Fees & Retainers',
    'Review hourly billing, initial consultation fees and retainer options in South African Rand.',
    fees,
  ],
  [
    '/contact',
    'Contact & Consultation',
    'Contact Makhado & Associates or request a consultation about your legal matter.',
    contact,
  ],
  [
    '/privacy',
    'Privacy Policy',
    'How information provided through this website is handled.',
    () => legal(true),
  ],
  [
    '/legal',
    'Legal Notice',
    'General information, website terms and legal disclaimers.',
    () => legal(false),
  ],
];
for (const [path, title, description, render] of routes) {
  const html = /* HTML */ `<!doctype html>
    <html lang="en-ZA">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#101e2b" />
        <title>${title} | Makhado & Associates</title>
        <meta name="description" content="${description}" />
        <link rel="canonical" href="${origin}${path === '/' ? '' : path}" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Makhado & Associates" />
        <meta property="og:title" content="${title} | Makhado & Associates" />
        <meta property="og:description" content="${description}" />
        <meta property="og:url" content="${origin}${path === '/' ? '' : path}" />
        <meta property="og:image" content="${origin}/images/logo.webp" />
        <link rel="icon" href="/images/favicon.png" />
        <link rel="preload" href="/fonts/serif.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="stylesheet" href="/styles.css?v=${assetVersion}" />
        <script defer src="/app.js?v=${assetVersion}"></script>
        <script type="application/ld+json">
          ${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'Makhado & Associates', url: origin, email: 'info@makhadoattorneys.co.za', logo: origin + '/images/logo.webp' })}
        </script>
      </head>
      <body>
        ${header(path)}
        <main id="main">${render()}</main>
        ${footer()}
      </body>
    </html>`;
  const dir = path === '/' ? 'dist' : `dist${path}`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/index.html`, html);
}
await writeFile(
  'dist/404.html',
  /* HTML */ `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Page not found | Makhado & Associates</title>
        <link rel="stylesheet" href="/styles.css?v=${assetVersion}" />
      </head>
      <body>
        ${header('')}
        <main id="main">
          ${pageHero('404', 'A different<br><em>way forward.</em>', 'This page could not be found.')}
          <div class="container section">${link('/', 'Return home')}</div>
        </main>
        ${footer()}
        <script src="/app.js?v=${assetVersion}"></script>
      </body>
    </html>`,
);
await writeFile(
  'dist/sitemap.xml',
  /* HTML */ `<?xml version="1.0" encoding="UTF-8"?><urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      >${routes.map(([p]) => /* HTML */ `<url><loc>${origin}${p === '/' ? '' : p}</loc></url>`).join('')}</urlset
    >`,
);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Built ${routes.length} pages.`);
