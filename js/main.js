/* ============================================================
   THE WONDER SOCCER CONSULTING — Main JavaScript
   ============================================================ */

/* ---- i18n ------------------------------------------------- */
let currentLang = localStorage.getItem('wsc_lang') || (navigator.language.startsWith('fr') ? 'fr' : 'en');

function t(key) {
  return (T[currentLang] && T[currentLang][key]) || T['fr'][key] || key;
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else if (el.dataset.i18nHtml !== undefined) {
      el.innerHTML = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  /* Update lang buttons */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  /* Update html lang attribute */
  document.documentElement.lang = currentLang;

  /* Update active nav link */
  markActiveNav();
}

function switchLang(lang) {
  currentLang = lang;
  localStorage.setItem('wsc_lang', lang);
  applyLanguage();
}

/* ---- Navigation ------------------------------------------- */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function markActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header__nav-link, .mobile-nav__link, .bottom-nav-item').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href && href.includes(page) && page !== 'index.html');
  });
}

/* ---- Mobile Menu ------------------------------------------ */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  const toggle = (open) => {
    hamburger.classList.toggle('open', open);
    mobileNav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  hamburger.addEventListener('click', () => toggle(!hamburger.classList.contains('open')));

  mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', () => toggle(false));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggle(false);
  });
}

/* ---- Language buttons ------------------------------------- */
function initLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });
}

/* ---- Scroll Reveal ---------------------------------------- */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, .reveal-fade').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-fade').forEach(el => observer.observe(el));
}

/* ---- Counter Animation ------------------------------------ */
function animateCounter(el, target, suffix) {
  const duration = 1800;
  const start = performance.now();
  const isDecimal = String(target).includes('.');

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;
    el.textContent = (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = document.querySelectorAll('.stats__number[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ---- Back to Top ------------------------------------------ */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---- Cookie Banner ---------------------------------------- */
function initCookieBanner() {
  if (localStorage.getItem('wsc_cookies')) return;
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;

  setTimeout(() => banner.classList.add('visible'), 1200);

  banner.querySelector('.cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem('wsc_cookies', 'accepted');
    banner.classList.remove('visible');
  });

  banner.querySelector('.cookie-decline')?.addEventListener('click', () => {
    localStorage.setItem('wsc_cookies', 'declined');
    banner.classList.remove('visible');
  });
}

/* ---- Ticker duplicate for seamless loop ------------------- */
function initTicker() {
  const track = document.querySelector('.ticker__track');
  if (!track) return;
  /* Clone for seamless infinite scroll */
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}

/* ---- Player Filter ---------------------------------------- */
function initPlayerFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const playerCards = document.querySelectorAll('.player-card[data-pos]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const pos = btn.dataset.filter;
      playerCards.forEach(card => {
        const match = pos === 'all' || card.dataset.pos === pos;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ---- Form Tabs -------------------------------------------- */
function initFormTabs() {
  const tabs = document.querySelectorAll('.form-tab');
  const panels = document.querySelectorAll('.form-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });
}

/* ---- Form Submission (Web3Forms) -------------------------- */
const WEB3FORMS_KEY = 'REPLACE_WITH_WEB3FORMS_KEY'; // Get free key at https://web3forms.com

async function submitForm(form, successKey, errorKey) {
  const honeypot = form.querySelector('.form__honeypot input');
  if (honeypot && honeypot.value) return; /* Bot detected */

  const submitBtn = form.querySelector('[type="submit"]');
  const successEl = form.querySelector('.form__feedback--success');
  const errorEl   = form.querySelector('.form__feedback--error');

  if (successEl) { successEl.classList.remove('show'); successEl.textContent = ''; }
  if (errorEl)   { errorEl.classList.remove('show'); errorEl.textContent = ''; }

  /* Basic validation */
  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#e06060';
      valid = false;
    } else {
      field.style.borderColor = '';
    }
  });
  if (!valid) return;

  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.7'; }

  const formData = new FormData(form);
  formData.append('access_key', WEB3FORMS_KEY);
  formData.append('subject', 'The Wonder Soccer Consulting — Nouveau message');
  formData.append('from_name', 'The Wonder Soccer Consulting');

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      form.reset();
      if (successEl) { successEl.textContent = t(successKey); successEl.classList.add('show'); }
    } else {
      throw new Error(data.message || 'Error');
    }
  } catch {
    if (errorEl) { errorEl.textContent = t(errorKey); errorEl.classList.add('show'); }
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
  }
}

function initForms() {
  const contactForm = document.getElementById('form-contact');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      submitForm(contactForm, 'form.success', 'form.error');
    });
  }

  const talentForm = document.getElementById('form-talent');
  if (talentForm) {
    talentForm.addEventListener('submit', e => {
      e.preventDefault();
      submitForm(talentForm, 'talent.success', 'form.error');
    });
  }
}

/* ---- Init ------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  initHeader();
  initMobileMenu();
  initLangButtons();
  initScrollReveal();
  initCounters();
  initBackToTop();
  initCookieBanner();
  initTicker();
  initPlayerFilter();
  initFormTabs();
  initForms();
});
