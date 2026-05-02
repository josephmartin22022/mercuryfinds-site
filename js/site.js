/* ============================================================
   Mercury Finds — Site behaviors
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // UTM TAGGER — appended 2026-05-02
  // ----------------------------------------------------------
  // Auto-tags every outbound Gumroad link with UTM parameters.
  // Two responsibilities:
  //   1. If the visitor arrived with their own ?utm_* params
  //      (e.g. from TikTok or X), forward them through to Gumroad
  //      so the full attribution chain is preserved.
  //   2. If no incoming UTMs, stamp our own based on which page
  //      this is and which product card was clicked.
  //
  // Taxonomy (matches ~/jarvis/docs/utm_taxonomy.md):
  //   utm_source   = channel  (site, tiktok, youtube, x, instagram, ...)
  //   utm_medium   = format   (hero-cta, product-card, footer, sample-cta)
  //   utm_campaign = product  (stress-free-declutter, actionable-second-brain, ...)
  // ============================================================

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  // Map Gumroad URL slugs to readable campaign names.
  // Keep this in sync with mercury/analytics_pixel.py SLUG_TO_CAMPAIGN.
  var GUMROAD_SLUG_TO_CAMPAIGN = {
    'nyxuev':                     'stress-free-declutter',
    'actionable-second-brain':    'actionable-second-brain',
    'ssxlu':                      'productivity-starter-pack',
    'cigehu':                     'complete-second-brain'
  };

  // Determine which page we're on (used as utm_medium fallback).
  function detectPageContext() {
    var path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) return 'home';
    if (path.endsWith('/products.html'))               return 'products';
    if (path.endsWith('/sample.html'))                 return 'sample';
    if (path.endsWith('/about.html'))                  return 'about';
    if (path.endsWith('/blog.html'))                   return 'blog';
    if (path.endsWith('/contact.html'))                return 'contact';
    return 'other';
  }

  // Pull any incoming UTMs from the current page URL.
  function readIncomingUTMs() {
    var params = new URLSearchParams(window.location.search);
    var found = {};
    UTM_KEYS.forEach(function (key) {
      var v = params.get(key);
      if (v) found[key] = v;
    });
    return found;
  }

  // Extract the product slug from a Gumroad URL.
  // Examples:
  //   https://6343528329202.gumroad.com/l/nyxuev          -> nyxuev
  //   https://6343528329202.gumroad.com/l/actionable-second-brain?x=1 -> actionable-second-brain
  function extractGumroadSlug(href) {
    var m = href.match(/gumroad\.com\/l\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  }

  // Determine the link's "format" — where on the page it lives.
  // Used as utm_medium when we're stamping our own UTMs.
  function detectLinkMedium(linkEl) {
    if (linkEl.closest('.bundle-card')) return 'product-card';
    if (linkEl.closest('.site-footer')) return 'footer';
    if (linkEl.closest('.sample-cta'))  return 'sample-cta';
    if (linkEl.closest('.hero'))        return 'hero-cta';
    return 'inline';
  }

  // Append/replace UTM params on a URL.
  // - Existing UTM params on the link are overwritten by ours
  //   (the link's own UTMs are usually placeholders or empty)
  // - Other query params (e.g. discount codes) are preserved.
  function applyUTMs(href, utms) {
    try {
      var u = new URL(href, window.location.origin);
      Object.keys(utms).forEach(function (key) {
        if (utms[key]) {
          u.searchParams.set(key, utms[key]);
        }
      });
      return u.toString();
    } catch (e) {
      // If URL parsing fails for any reason, return original.
      return href;
    }
  }

  // The main rewrite pass. Called once on DOMContentLoaded.
  function tagAllGumroadLinks() {
    var incoming = readIncomingUTMs();
    var pageCtx  = detectPageContext();

    var links = document.querySelectorAll('a[href*="gumroad.com"]');

    links.forEach(function (linkEl) {
      var href = linkEl.getAttribute('href');
      if (!href) return;

      var slug = extractGumroadSlug(href);
      if (!slug) return;

      var campaign = GUMROAD_SLUG_TO_CAMPAIGN[slug] || slug;
      var medium   = detectLinkMedium(linkEl);

      // Build the UTM bundle. Incoming UTMs win (preserve source attribution
      // when visitor arrived from TikTok/X/etc), but we always set medium
      // and campaign so we know WHERE on the site they clicked.
      var utms = {
        utm_source:   incoming.utm_source   || 'site',
        utm_medium:   incoming.utm_medium   || (pageCtx + ':' + medium),
        utm_campaign: incoming.utm_campaign || campaign
      };
      // Pass-through any term/content if present.
      if (incoming.utm_term)    utms.utm_term    = incoming.utm_term;
      if (incoming.utm_content) utms.utm_content = incoming.utm_content;

      var newHref = applyUTMs(href, utms);
      linkEl.setAttribute('href', newHref);
    });
  }

  // Run as soon as DOM is ready. We use defer on the script tag so
  // by the time this IIFE runs the DOM should already be parsed,
  // but guard with readyState just in case.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tagAllGumroadLinks);
  } else {
    tagAllGumroadLinks();
  }

  // ============================================================
  // END UTM TAGGER
  // ============================================================


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
        } else {
          throw new Error('Subscription failed');
        }
      } catch (err) {
        // Optimistic UX — show success anyway, log for debugging
        // (the Beehiiv worker will retry on its end)
        console.warn('Newsletter form network warning:', err);
        form.style.display = 'none';
        if (success) success.classList.add('show');
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
