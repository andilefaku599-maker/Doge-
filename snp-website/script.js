/* ═══════════════════════════════════════════
   SNP Consulting — site behaviour
   ═══════════════════════════════════════════ */

'use strict';

// ── Sticky nav hairline ──────────────────────────────────────────────────────

const nav = document.getElementById('nav');

const onScroll = () => {
  nav.classList.toggle('is-stuck', window.scrollY > 8);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile menu ──────────────────────────────────────────────────────────────

const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');

const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
};

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

mobileMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    burger.focus();
  }
});

// Close the menu if the viewport grows past the mobile breakpoint.
window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

// ── Reveal on scroll ─────────────────────────────────────────────────────────

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealables = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealables.forEach((el, i) => {
    // Stagger siblings slightly so grids cascade rather than pop as one block.
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 55}ms`;
    observer.observe(el);
  });
}

// ── Contact form ─────────────────────────────────────────────────────────────
//
// No backend: the form composes a mailto: draft. To switch to a hosted handler
// (Formspree, Netlify Forms, Web3Forms), see README.md — set ENDPOINT below and
// the submit handler will POST instead.

const ENDPOINT = '';                                // e.g. 'https://formspree.io/f/xxxxxxx'
const INBOX = 'hello@snpconsulting.co.za';

const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

const setNote = (text) => { note.textContent = text; };

const validate = () => {
  let firstInvalid = null;

  form.querySelectorAll('input, textarea').forEach((input) => {
    const field = input.closest('.field');
    const ok = input.checkValidity();
    field.classList.toggle('has-error', !ok);
    if (!ok && !firstInvalid) firstInvalid = input;
  });

  return firstInvalid;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstInvalid = validate();
  if (firstInvalid) {
    setNote('Please complete the highlighted fields.');
    firstInvalid.focus();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  if (ENDPOINT) {
    setNote('Sending…');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setNote('Thank you — we will come back to you within one business day.');
    } catch (err) {
      setNote(`Could not send. Please email ${INBOX} directly.`);
    }
    return;
  }

  const body = [
    `Name: ${data.name}`,
    `Company: ${data.company}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || '-'}`,
    `Systems involved: ${data.systems || '-'}`,
    '',
    'What is getting stuck:',
    data.message,
  ].join('\n');

  const href = `mailto:${INBOX}?subject=${encodeURIComponent(
    `Website enquiry — ${data.company}`
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = href;
  setNote('Your email client should now be open. If it did not open, email ' + INBOX + '.');
});

form.querySelectorAll('input, textarea').forEach((input) => {
  input.addEventListener('input', () => {
    if (input.checkValidity()) input.closest('.field').classList.remove('has-error');
  });
});

// ── Footer year ──────────────────────────────────────────────────────────────

document.getElementById('year').textContent = String(new Date().getFullYear());
