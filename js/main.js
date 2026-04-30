'use strict';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWCeZcM34HDZBZReWMYyuh5rfh9LjT15njhfxOyqMJjEITjB1ea790-NGzfVyFOO2J/exec';

function getById(id) {
  return document.getElementById(id);
}

function setTheme(theme) {
  const html = document.documentElement;

  if (theme !== 'light' && theme !== 'dark') {
    theme = 'dark';
  }

  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function loadTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    setTheme(storedTheme);
  } else {
    setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'dark';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function showPage(name) {
  const routes = {
    home: 'index.html',
    about: 'about.html',
    studio: 'studio.html',
    courses: 'courses.html',
    contact: 'contact.html',
  };

  const navLinks = getById('navLinks');
  if (navLinks) {
    navLinks.classList.remove('open');
  }

  window.location.href = routes[name] || routes.home;
}

function toggleMenu() {
  const navLinks = getById('navLinks');
  if (navLinks) {
    navLinks.classList.toggle('open');
  }
}

function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item').forEach((faqItem) => {
    faqItem.classList.remove('open');
  });

  if (!isOpen) {
    item.classList.add('open');
  }
}

function getLeadFormData(form) {
  const formData = new FormData(form);
  return {
    fullName: String(formData.get('fullName') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    courseInterested: String(formData.get('courseInterested') || '').trim(),
    message: String(formData.get('message') || '').trim(),
    website: String(formData.get('website') || '').trim(),
    source: 'website',
  };
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLeadData(data) {
  if (!data.fullName) return 'Please enter your full name.';
  if (!data.phone) return 'Please enter your phone number.';
  if (!isValidEmail(data.email)) return 'Please enter a valid email address.';
  if (data.message.length > 1000) return 'Message must be 1000 characters or fewer.';
  return '';
}

function setFormStatus(form, message, type) {
  const status = form.querySelector('.form-status');
  if (!status) return;

  status.textContent = message;
  status.classList.remove('success', 'error');
  if (type) {
    status.classList.add(type);
  }
}

function setSubmitState(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.innerHTML;
  }

  submitButton.disabled = isSubmitting;
  submitButton.innerHTML = isSubmitting ? 'Sending...' : submitButton.dataset.defaultText;
}

async function submitLeadData(data) {
  const body = new URLSearchParams(data);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body,
    });
    return await response.json();
  } catch (error) {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body,
    });
    return { ok: true, status: 'submitted' };
  }
}

function showLeadSuccess(form, responseData) {
  const status = responseData && responseData.status;
  const message = status === 'duplicate' || status === 'updated'
    ? 'You have already submitted this form. We will contact you soon.'
    : 'Thank you! Your information has been submitted.';

  setFormStatus(form, message, 'success');

  const modal = getById('successModal');
  if (modal) {
    modal.style.display = 'flex';
  }

  form.reset();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = getLeadFormData(form);

  if (data.website) {
    setFormStatus(form, 'Thank you! Your information has been submitted.', 'success');
    form.reset();
    return;
  }

  const validationError = validateLeadData(data);
  if (validationError) {
    setFormStatus(form, validationError, 'error');
    return;
  }

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT')) {
    setFormStatus(form, 'Form is not connected yet. Please add your Google Apps Script URL in js/main.js.', 'error');
    return;
  }

  if (form.dataset.submitting === 'true') return;
  form.dataset.submitting = 'true';
  setSubmitState(form, true);
  setFormStatus(form, '', '');

  try {
    const responseData = await submitLeadData(data);
    if (responseData && responseData.ok === false) {
      throw new Error(responseData.error || 'Submission failed');
    }
    showLeadSuccess(form, responseData);
  } catch (error) {
    setFormStatus(form, 'Something went wrong. Please try again.', 'error');
  } finally {
    form.dataset.submitting = 'false';
    setSubmitState(form, false);
  }
}

function initMobileMenu() {
  window.toggleMenu = toggleMenu;
}

function initThemeToggle() {
  window.toggleTheme = toggleTheme;
}

function initPageNavigation() {
  window.showPage = showPage;
  const currentPage = document.body.dataset.page || 'home';

  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.classList.remove('active');
  });

  const navEl = getById(`nav-${currentPage}`);
  if (navEl) {
    navEl.classList.add('active');
  }
}

function initLeadForm() {
  window.handleFormSubmit = handleFormSubmit;
}

function initFaq() {
  window.toggleFaq = toggleFaq;
}

function initAnimations() {
  const nav = getById('navbar');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 50
      ? '0 4px 30px rgba(0,0,0,0.3)'
      : 'none';
  });
}

function initSmoothScroll() {
  // Native smooth scrolling is defined in CSS; this hook keeps navigation setup explicit.
}

function initApp() {
  loadTheme();
  initThemeToggle();
  initPageNavigation();
  initMobileMenu();
  initFaq();
  initLeadForm();
  initSmoothScroll();
  initAnimations();
}

window.toggleTheme = toggleTheme;
window.showPage = showPage;
window.toggleMenu = toggleMenu;
window.toggleFaq = toggleFaq;
window.handleFormSubmit = handleFormSubmit;

document.addEventListener('DOMContentLoaded', initApp);
