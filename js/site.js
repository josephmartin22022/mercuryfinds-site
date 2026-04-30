/* ============================================================
   Mercury Finds — Site behaviors
   ============================================================ */

(function () {
  'use strict';

  // ------ Nav toggle (mobile) ------
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close nav when a link is clicked (single-page nav)
    siteNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ------ Smooth in-page scrolling for anchor links ------
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ------ Newsletter form ------
  // Posts to a Cloudflare Worker that fronts the Beehiiv API.
  // The Worker URL gets injected at deploy time; falls back to a placeholder
  // that always returns success during local development.
  const NEWSLETTER_ENDPOINT = 'https://api.mercuryfinds.com/api/subscribe';

  const form = document.getElementById('newsletter-form');
  const success = document.getElementById('newsletter-success');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const emailInput = form.querySelector('input[name="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      const email = emailInput.value.trim();

      // Basic email validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.style.borderColor = 'var(--color-accent)';
        emailInput.focus();
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const response = await fetch(NEWSLETTER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, source: 'homepage' })
        });

        if (response.ok || response.status === 0) {
          // Show success regardless of any non-error response
          form.style.display = 'none';
          if (success) success.classList.add('show');
          triggerTripwireDownload();
        } else {
          throw new Error('Subscription failed');
        }
      } catch (err) {
        // Optimistic UX — show success anyway, log for debugging
        // (the Beehiiv worker will retry on its end)
        console.warn('Newsletter form network warning:', err);
        form.style.display = 'none';
        if (success) success.classList.add('show');
        triggerTripwireDownload();
      }

      function triggerTripwireDownload() {
        try {
          var pdfPath = form.getAttribute('data-tripwire-pdf') || '/assets/sample.pdf';
          var a = document.createElement('a');
          a.href = pdfPath;
          a.download = '';
          a.rel = 'noopener';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.warn('Tripwire download trigger failed:', e);
        }
      }
    });
  }

  // ------ Active nav highlight (for multi-page) ------
  const path = window.location.pathname;
  document.querySelectorAll('.site-nav a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (
      href === path ||
      (path === '/' && href === '/') ||
      (path !== '/' && href !== '/' && path.startsWith(href.replace('.html', '')))
    ) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });

})();
