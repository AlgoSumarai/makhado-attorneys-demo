const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navigation?.classList.contains('open')) {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.header')) closeMenu();
});
matchMedia('(min-width:901px)').addEventListener('change', (e) => {
  if (e.matches) closeMenu();
});
const form = document.querySelector('#inquiry-form');
const serviceSearch = document.querySelector('#service-search');
if (serviceSearch) {
  const cards = [...document.querySelectorAll('[data-service-search]')];
  const status = document.querySelector('#service-search-status');
  const empty = document.querySelector('.service-search-empty');
  const normalize = (value) =>
    value
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  const index = cards.map((card) => ({ card, text: normalize(card.dataset.serviceSearch) }));
  const filterServices = () => {
    const words = normalize(serviceSearch.value).split(' ').filter(Boolean);
    let count = 0;
    for (const { card, text } of index) {
      card.hidden = !words.every((word) => text.includes(word));
      if (!card.hidden) count++;
    }
    empty.hidden = count !== 0;
    status.textContent = words.length
      ? `${count} ${count === 1 ? 'service' : 'services'} found.`
      : `Browse all ${count} services or search for your legal needs.`;
  };
  serviceSearch.closest('.service-search').hidden = false;
  serviceSearch.addEventListener('input', filterServices);
  serviceSearch.addEventListener('search', filterServices);
  filterServices();
}
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}
if (form) {
  const date = form.elements.date;
  const now = new Date();
  date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (new URLSearchParams(location.search).get('type') === 'consultation')
    form.elements.requestType.value = 'Consultation request';
  form.elements.contactMethod.addEventListener('change', () => {
    form.elements.phone.required = form.elements.contactMethod.value === 'Phone';
  });
  const status = form.querySelector('.form-status');
  const message = (text, state) => {
    status.textContent = text;
    status.className = `form-status ${state}`;
    status.focus();
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type=submit]');
    const file = form.elements.document.files[0];
    if (file && (file.size > 3 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf'))) {
      message('Please attach a PDF no larger than 3 MB.', 'error');
      return;
    }
    button.disabled = true;
    button.textContent = 'Sending inquiry…';
    status.textContent = '';
    try {
      const fields = Object.fromEntries(new FormData(form));
      delete fields.document;
      fields.consent = form.elements.consent.checked;
      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
          throw new Error('Please attach a valid PDF document.');
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192)
          binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        fields.document = { name: file.name, data: btoa(binary) };
      }
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Your inquiry could not be sent. Please try again.');
      form.reset();
      form.elements.phone.required = false;
      message(
        'Thank you. Your inquiry has been sent to Makhado & Associates. The firm will contact you using the details provided. Any consultation appointment will be confirmed separately.',
        'success',
      );
    } catch (error) {
      message(
        error.name === 'TimeoutError'
          ? 'Delivery could not be confirmed. Please contact info@makhadoattorneys.co.za before resubmitting.'
          : error.message === 'Failed to fetch'
            ? 'Unable to connect. Your details remain in the form. Please try again or email info@makhadoattorneys.co.za.'
            : error.message,
        'error',
      );
    } finally {
      button.disabled = false;
      button.innerHTML = 'Send inquiry <span aria-hidden="true">↗</span>';
    }
  });
}
