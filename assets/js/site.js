/* ==========================================================================
   GridPe.com — core site script
   Handles: config, theme, nav, forms, obfuscated contact, banners, utilities
   No dependencies. Works on GitHub Pages (pure static).
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  1. SITE CONFIG — the only place you edit to go live
   * ------------------------------------------------------------------ */
  var CONFIG = window.GRIDPE_CONFIG = {
    // Form relay endpoint. Leave '' to use the built-in obfuscated mail fallback.
    // Recommended: FormSubmit hashed endpoint  -> https://formsubmit.co/ajax/<your-hash>
    //          or: Formspree                   -> https://formspree.io/f/<id>
    formEndpoint: '',

    // Donations / support rails (fill these in when accounts are live)
    upiVpa: '',                  // e.g. 'yourname@okhdfcbank'
    upiName: 'GridPe',
    razorpayPage: '',            // e.g. 'https://rzp.io/l/gridpe'
    razorpayButtonId: '',        // e.g. 'pl_XXXXXXXXXXXX'
    bmcSlug: '',                 // buymeacoffee slug
    kofiSlug: '',                // ko-fi slug
    paypalMe: '',                // paypal.me username (overseas only)

    // AdSense
    adsenseClient: 'ca-pub-0000000000000000',
    adsenseEnabled: false,       // flip to true after approval

    // YouTube
    youtubeChannel: '',          // channel URL
    youtubeHandle: '@gridpe',

    domainEnquiryUrl: 'https://web.works/contact',
    siteName: 'GridPe',
    siteUrl: 'https://gridpe.com'
  };

  /* ------------------------------------------------------------------ *
   *  2. Obfuscated contact address
   *     Never rendered as plain text anywhere in the DOM or source.
   * ------------------------------------------------------------------ */
  var _K = 'bW9jLmxpYW1nQDFhc2tyb3diZXc=';
  function inbox() {
    try { return atob(_K).split('').reverse().join(''); }
    catch (e) { return ''; }
  }
  window.gridpeMail = function (subject, body) {
    var u = 'mailto:' + inbox();
    var q = [];
    if (subject) q.push('subject=' + encodeURIComponent(subject));
    if (body) q.push('body=' + encodeURIComponent(body));
    return u + (q.length ? '?' + q.join('&') : '');
  };

  /* ------------------------------------------------------------------ *
   *  3. Small utilities
   * ------------------------------------------------------------------ */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }
    catch (e) { return null; }
  }
  window.gp = window.gp || {};
  window.gp.$ = $; window.gp.$$ = $$;

  // Indian number formatting
  window.gp.inr = function (n, dec) {
    if (!isFinite(n)) return '—';
    var d = dec === undefined ? 0 : dec;
    return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
  };
  window.gp.num = function (n, dec) {
    if (!isFinite(n)) return '—';
    var d = dec === undefined ? 0 : dec;
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
  };
  window.gp.compactINR = function (n) {
    if (!isFinite(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    if (a >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
    if (a >= 1e3) return '₹' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return '₹' + Math.round(n);
  };
  window.gp.animateTo = function (el, target, fmt, ms) {
    if (!el) return;
    var from = parseFloat(el.getAttribute('data-v') || '0') || 0;
    var t0 = performance.now(), dur = ms || 520;
    function tick(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = from + (target - from) * e;
      el.textContent = fmt ? fmt(v) : Math.round(v);
      if (p < 1) requestAnimationFrame(tick); else el.setAttribute('data-v', target);
    }
    requestAnimationFrame(tick);
  };
  window.gp.getJSON = function (path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  };
  // Resolve data/asset paths whether we are at root or in /guides/
  window.gp.base = (function () {
    var p = location.pathname;
    return /\/guides\//.test(p) ? '../' : '';
  })();

  /* ------------------------------------------------------------------ *
   *  4. Theme
   * ------------------------------------------------------------------ */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    store('gp-theme', t);
    $$('.js-theme').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  var saved = store('gp-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  /* ------------------------------------------------------------------ *
   *  5. Toast
   * ------------------------------------------------------------------ */
  var toastEl;
  window.gp.toast = function (msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add('show'); });
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600);
  };

  /* ------------------------------------------------------------------ *
   *  6. Form engine  (lead, contact, donation-intent, careers, contest)
   * ------------------------------------------------------------------ */
  function fieldError(input, msg) {
    input.classList.add('err');
    var e = input.parentNode.querySelector('.err-msg');
    if (!e) { e = document.createElement('div'); e.className = 'err-msg'; input.parentNode.appendChild(e); }
    e.textContent = msg;
  }
  function clearError(input) {
    input.classList.remove('err');
    var e = input.parentNode.querySelector('.err-msg');
    if (e) e.remove();
  }
  function validate(scope) {
    var ok = true;
    $$('[required]', scope).forEach(function (i) {
      if (i.offsetParent === null && i.type !== 'hidden') return; // skip hidden steps
      clearError(i);
      var v = (i.value || '').trim();
      if (i.type === 'checkbox') {
        if (!i.checked) { ok = false; fieldError(i, 'Required'); }
        return;
      }
      if (!v) { ok = false; fieldError(i, 'This field is required'); return; }
      if (i.dataset.type === 'phone' && !/^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10))) {
        ok = false; fieldError(i, 'Enter a valid 10-digit Indian mobile number');
      }
      if (i.dataset.type === 'pin' && !/^\d{6}$/.test(v)) { ok = false; fieldError(i, 'Enter a valid 6-digit PIN code'); }
      if (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { ok = false; fieldError(i, 'Enter a valid email address'); }
    });
    if (!ok) { var f = $('.err', scope); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    return ok;
  }
  window.gp.validate = validate;

  function collect(form) {
    var out = {}, fd = new FormData(form);
    fd.forEach(function (v, k) {
      if (k.charAt(0) === '_') return;
      if (out[k]) { out[k] = [].concat(out[k], v); } else { out[k] = v; }
    });
    // include derived/result values the calculators stash on the form
    $$('[data-carry]', document).forEach(function (el) {
      if (el.dataset.carry && el.textContent) out[el.dataset.carry] = el.textContent.trim();
    });
    return out;
  }

  function toText(obj, title) {
    var lines = [title, '='.repeat(title.length), ''];
    Object.keys(obj).forEach(function (k) {
      lines.push(k.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + ': ' + obj[k]);
    });
    lines.push('', '— Submitted from ' + location.href, 'Time: ' + new Date().toString());
    return lines.join('\n');
  }

  function showSuccess(form, headline, sub) {
    var box = document.createElement('div');
    box.className = 'success-box';
    box.innerHTML =
      '<div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h3 style="margin-bottom:.3em">' + headline + '</h3><p class="mb0">' + sub + '</p>';
    form.parentNode.replaceChild(box, form);
    box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function handleSubmit(e) {
    var form = e.target;
    if (!form.classList.contains('js-form')) return;
    e.preventDefault();
    if (!validate(form)) return;

    var btn = form.querySelector('[type=submit]');
    var label = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Sending…'; }

    var data = collect(form);
    var kind = form.dataset.kind || 'Enquiry';
    data._subject = '[GridPe] ' + kind + (data.name ? ' — ' + data.name : '');
    data._source = location.href;

    var done = function () {
      showSuccess(form,
        form.dataset.successTitle || 'Request received',
        form.dataset.successMsg || 'Our team will get back to you within one working day. Check your inbox (and spam folder) for our reply.');
      try { if (window.gtag) gtag('event', 'generate_lead', { kind: kind }); } catch (x) { }
    };
    var fallback = function () {
      // No relay configured (or relay failed): open the visitor's mail client with
      // everything pre-filled. The destination address is never printed on the page.
      window.location.href = window.gridpeMail(data._subject, toText(data, 'GridPe — ' + kind));
      setTimeout(done, 700);
    };

    if (CONFIG.formEndpoint) {
      fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { if (!r.ok) throw new Error('relay'); done(); })
        .catch(fallback);
    } else {
      fallback();
    }
  }

  /* ------------------------------------------------------------------ *
   *  7. Multi-step forms
   * ------------------------------------------------------------------ */
  function initSteps(root) {
    var panels = $$('.step-panel', root);
    var pips = $$('.step-pip', root);
    if (!panels.length) return;
    var i = 0;
    function show(n, quiet) {
      panels.forEach(function (p, k) { p.classList.toggle('active', k === n); });
      pips.forEach(function (p, k) { p.classList.toggle('done', k <= n); });
      i = n;
      if (!quiet) root.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    root.addEventListener('click', function (e) {
      var n = e.target.closest('[data-step-next]');
      var p = e.target.closest('[data-step-prev]');
      if (n) { e.preventDefault(); if (validate(panels[i])) show(Math.min(i + 1, panels.length - 1)); }
      if (p) { e.preventDefault(); show(Math.max(i - 1, 0)); }
    });
    show(0, true);
  }

  /* ------------------------------------------------------------------ *
   *  8. Boot
   * ------------------------------------------------------------------ */
  function boot() {
    // year
    $$('.js-year').forEach(function (e) { e.textContent = new Date().getFullYear(); });

    // contact links — build mailto at runtime, address never in the markup
    $$('[data-mail]').forEach(function (a) {
      var s = a.getAttribute('data-subject') || 'Enquiry via GridPe.com';
      a.setAttribute('href', window.gridpeMail(s, ''));
      a.setAttribute('rel', 'nofollow');
    });

    // theme toggle
    $$('.js-theme').forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme');
        if (!cur) cur = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    });

    // mobile nav
    var burger = $('.burger'), links = $('.nav-links');
    if (burger && links) {
      burger.addEventListener('click', function () {
        var o = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    }
    // dropdowns
    $$('.has-drop').forEach(function (d) {
      var b = $('.drop-btn', d);
      if (!b) return;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = d.classList.contains('open');
        $$('.has-drop').forEach(function (o) { o.classList.remove('open'); });
        d.classList.toggle('open', !wasOpen);
      });
    });
    document.addEventListener('click', function () { $$('.has-drop').forEach(function (o) { o.classList.remove('open'); }); });

    // active nav highlight
    var here = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-links a[href]').forEach(function (a) {
      var h = a.getAttribute('href').split('/').pop();
      if (h && h === here) a.classList.add('active');
    });

    // FAQ
    $$('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        var it = q.closest('.faq-item');
        it.classList.toggle('open');
        q.setAttribute('aria-expanded', it.classList.contains('open') ? 'true' : 'false');
      });
    });

    // forms
    document.addEventListener('submit', handleSubmit);
    $$('[data-steps]').forEach(initSteps);
    $$('input,select,textarea').forEach(function (i) {
      i.addEventListener('input', function () { clearError(i); });
    });

    // reveal on scroll
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      $$('.reveal').forEach(function (e) { io.observe(e); });
    } else {
      $$('.reveal').forEach(function (e) { e.classList.add('in'); });
    }

    // copy buttons
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-copy');
        if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { window.gp.toast('Copied'); });
      });
    });

    // YouTube facade -> only loads the iframe on click (fast + privacy friendly)
    $$('.video-facade').forEach(function (f) {
      f.addEventListener('click', function () {
        var id = f.getAttribute('data-yt');
        if (!id) return;
        var fr = document.createElement('iframe');
        fr.setAttribute('src', 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0');
        fr.setAttribute('title', f.getAttribute('data-title') || 'GridPe video');
        fr.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        fr.setAttribute('allowfullscreen', '');
        fr.setAttribute('loading', 'lazy');
        f.parentNode.appendChild(fr);
        f.remove();
      });
    });

    // support banner (sitewide, dismissible for 30 days)
    var sb = $('.support-banner');
    if (sb) {
      var dismissed = store('gp-sb');
      var fresh = dismissed && (Date.now() - Number(dismissed) < 30 * 864e5);
      if (!fresh) setTimeout(function () { sb.classList.add('show'); }, 6500);
      var x = $('.x', sb);
      if (x) x.addEventListener('click', function () { sb.classList.remove('show'); store('gp-sb', String(Date.now())); });
    }

    // AdSense units
    if (CONFIG.adsenseEnabled) {
      $$('.ad-slot ins.adsbygoogle').forEach(function () {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
