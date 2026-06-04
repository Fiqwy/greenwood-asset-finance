/* ============================================================
   GREENWOOD ASSET FINANCE — engine
   Vanilla JS. Reads window.GW (config) and hydrates behaviour.
   Each subsystem is isolated in try/catch so one failure can
   never blank the page.
   ============================================================ */
(function () {
  'use strict';

  var D = document;
  var root = D.documentElement;
  var GW = window.GW || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';

  var $  = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function isInView(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < (window.innerHeight || 0); }
  function revealAllNow() { root.classList.add('gw-failsafe'); }

  /* ───────────────────── Boot ───────────────────── */
  function ready() {
    if (window.__gwReveal) clearTimeout(window.__gwReveal);   // cancel the head failsafe
    safe(initLenisGsap, 'scroll');
    safe(wireBrand, 'brand');
    safe(initReveals, 'reveals');
    safe(initNav, 'nav');
    safe(initFaq, 'faq');
    safe(initEstimator, 'estimator');
    safe(initForm, 'form');
    safe(initFooter, 'footer');
    safe(initHero, 'hero');
    safe(initMagnetic, 'magnetic');
    if (hasGSAP && window.ScrollTrigger) {
      window.addEventListener('load', function () { window.ScrollTrigger.refresh(); });
    }
    root.classList.add('gw-ready');
  }
  function safe(fn, label) { try { fn(); } catch (e) { console.warn('[GW] ' + label + ' failed:', e); if (label === 'reveals' || label === 'scroll') revealAllNow(); } }

  /* ─────────────── Smooth scroll + GSAP ─────────────── */
  function initLenisGsap() {
    if (hasGSAP && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);

    var lenis = null;
    if (hasLenis && !reduce) {
      lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, smoothTouch: false });
      if (hasGSAP) {
        lenis.on('scroll', function () { window.ScrollTrigger.update(); });
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
      }
      window.__lenis = lenis;
    }

    // Anchor links → smooth scroll with nav offset
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      a.addEventListener('click', function (e) {
        var target = D.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        var top = id === '#top';
        if (lenis) lenis.scrollTo(top ? 0 : target, { offset: top ? 0 : -64, duration: 1.1 });
        else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ─────────────── Brand / phone wiring ─────────────── */
  function wireBrand() {
    var b = GW.brand || {};
    var tel = (b.phone_tel || '').trim();
    var disp = (b.phone_display || '').trim();
    var hasPhone = !!(tel && disp);

    $$('.js-call').forEach(function (el) {
      var numbered = el.classList.contains('js-call--numbered') || el.classList.contains('js-call-bar');
      if (hasPhone) {
        el.setAttribute('href', 'tel:' + tel);
        el.removeAttribute('hidden');
        var num = $('.js-phone-number', el); if (num) num.textContent = disp;
        var txt = $('.js-call-text', el); var lc = el.getAttribute('data-label-call'); if (txt && lc) txt.textContent = lc;
      } else {
        if (numbered) { el.setAttribute('hidden', ''); return; }   // pure phone affordance, keep hidden
        el.setAttribute('href', '#enquire');
        var ntxt = $('.js-call-text', el); var ln = el.getAttribute('data-label-nophone');
        if (ntxt && ln) ntxt.textContent = ln;
      }
    });

    // If no phone, the hero "Start an enquiry" secondary duplicates the primary — hide it.
    if (!hasPhone) { var sec = $('[data-secondary-enquire]'); if (sec) sec.setAttribute('hidden', ''); }
  }

  /* ─────────────── Scroll reveals ─────────────── */
  function initReveals() {
    var items = $$('[data-reveal]').filter(function (el) { return !el.closest('.hero'); });
    var rules = $$('[data-rule], [data-line]');
    if (reduce || !hasGSAP) {
      items.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      rules.forEach(function (r) { r.style.transform = 'none'; });
      return;
    }
    // IntersectionObserver fires reliably however the user scrolls (jump, fast, smooth).
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        window.gsap.to(el, { opacity: 1, y: 0, x: 0, duration: 0.95, ease: 'expo.out', delay: Math.min(idx, 6) * 0.05, overwrite: true });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });

    var ruleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        ruleIO.unobserve(en.target);
        window.gsap.to(en.target, { scaleX: 1, duration: 1.0, ease: 'power3.out' });
      });
    }, { threshold: 0.3 });
    rules.forEach(function (r) { ruleIO.observe(r); });
  }

  /* ─────────────── Nav + mobile call bar ─────────────── */
  function initNav() {
    var nav = $('[data-nav]');
    var bar = $('.js-call-bar');
    var ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (nav) nav.classList.toggle('is-scrolled', y > 60);
      if (bar && !bar.hasAttribute('hidden')) bar.classList.toggle('is-visible', y > (window.innerHeight * 0.65));
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // Mobile menu toggle
    var toggle = $('.nav-toggle');
    var links = $('#nav-links');
    if (toggle && nav) {
      var closeMenu = function () { nav.classList.remove('nav--open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); };
      var openMenu = function () { nav.classList.add('nav--open'); toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close menu'); };
      toggle.addEventListener('click', function () { nav.classList.contains('nav--open') ? closeMenu() : openMenu(); });
      if (links) $$('a', links).forEach(function (a) { a.addEventListener('click', closeMenu); });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }
  }

  /* ─────────────── FAQ accordion + schema ─────────────── */
  function initFaq() {
    var items = $$('.faq__item');
    if (hasGSAP && !reduce) {
      items.forEach(function (item) {
        var sum = $('summary', item); var ans = $('.faq__a', item);
        sum.addEventListener('click', function (e) {
          e.preventDefault();
          if (item.open) {
            window.gsap.to(ans, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut', onComplete: function () { item.open = false; ans.style.height = ''; ans.style.opacity = ''; } });
          } else {
            // close siblings for a tidy accordion
            items.forEach(function (o) { if (o !== item && o.open) { var oa = $('.faq__a', o); window.gsap.to(oa, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.inOut', onComplete: function () { o.open = false; oa.style.height = ''; oa.style.opacity = ''; } }); } });
            item.open = true;
            window.gsap.fromTo(ans, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' });
          }
        });
      });
    }
    // FAQPage JSON-LD from the DOM (single source of truth)
    try {
      var faqs = items.map(function (it) {
        return { '@type': 'Question', name: $('summary', it).textContent.replace(/\s+/g, ' ').trim(),
          acceptedAnswer: { '@type': 'Answer', text: $('.faq__a', it).textContent.replace(/\s+/g, ' ').trim() } };
      });
      if (faqs.length) {
        var s = D.createElement('script'); s.type = 'application/ld+json';
        s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs });
        D.head.appendChild(s);
      }
    } catch (e) { /* schema is non-critical */ }
  }

  /* ─────────────── Repayment estimator ─────────────── */
  function initEstimator() {
    var card = $('[data-estimator]'); if (!card) return;
    var cfg = GW.estimator || {};
    var amount = $('#est-amount'), term = $('#est-term'), rate = $('#est-rate');
    var amountOut = $('#est-amount-out'), termOut = $('#est-term-out'), rateOut = $('#est-rate-out');
    var monthlyEl = $('#est-monthly'), weeklyEl = $('#est-weekly'), fortEl = $('#est-fortnightly');
    applyCfg(amount, cfg.amount); applyCfg(term, cfg.term); applyCfg(rate, cfg.rate);

    var prevMonthly = 0;
    function applyCfg(el, c) { if (!el || !c) return; el.min = c.min; el.max = c.max; el.step = c.step; el.value = c.value; }
    function fill(el) { var pct = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--fillPct', pct + '%'); }
    function calc() {
      var P = +amount.value, n = +term.value, r = (+rate.value) / 100 / 12;
      var monthly = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      if (!isFinite(monthly)) monthly = 0;
      amountOut.textContent = money.format(+amount.value);
      termOut.textContent = term.value + ' months';
      rateOut.textContent = (+rate.value).toFixed(1) + '% p.a.';
      [amount, term, rate].forEach(fill);
      weeklyEl.textContent = money.format(monthly * 12 / 52);
      fortEl.textContent = money.format(monthly * 12 / 26);
      animateNumber(monthlyEl, prevMonthly, monthly);
      prevMonthly = monthly;
    }
    function animateNumber(el, from, to) {
      if (reduce || !hasGSAP) { el.textContent = money.format(to); return; }
      var obj = { v: from };
      window.gsap.to(obj, { v: to, duration: 0.5, ease: 'power2.out', onUpdate: function () { el.textContent = money.format(obj.v); } });
      if (from && from !== to) window.gsap.fromTo(el, { scale: 1.05 }, { scale: 1, duration: 0.4, ease: 'power2.out' });
    }
    [amount, term, rate].forEach(function (el) { if (el) el.addEventListener('input', calc); });
    calc();

    // "Send these numbers as an enquiry" → prefill hidden field + scroll to form
    var send = $('[data-estimator-send]');
    if (send) send.addEventListener('click', function (e) {
      e.preventDefault();
      var form = $('[data-form]'); if (!form) return;
      var hidden = form.querySelector('input[name="estimate"]');
      if (!hidden) { hidden = D.createElement('input'); hidden.type = 'hidden'; hidden.name = 'estimate'; form.appendChild(hidden); }
      hidden.value = money.format(+amount.value) + ' over ' + term.value + ' months (est. ' + monthlyEl.textContent + '/mo)';
      var what = $('#f-what'); if (what) what.value = 'Multiple assets';
      var target = D.getElementById('enquire');
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -64 }); else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(function () { var nm = $('#f-name'); if (nm) nm.focus({ preventScroll: true }); }, 700);
    });
  }

  /* ─────────────── Enquiry form ─────────────── */
  function initForm() {
    var form = $('[data-form]'); if (!form) return;
    var status = $('[data-form-status]', form);
    var submit = $('[data-submit]', form);
    var b = GW.brand || {};
    var msgs = (GW.form && GW.form.messages) || {};
    var key = (GW.form && GW.form.web3formsKey || '').trim();
    var hasPhone = !!(b.phone_tel && b.phone_display);

    function err(name, message) {
      var slot = form.querySelector('[data-error-for="' + name + '"]');
      var field = form.querySelector('[name="' + name + '"]');
      if (slot) slot.textContent = message || '';
      if (field) field.closest('.field').classList.toggle('is-invalid', !!message);
    }
    function validate() {
      var ok = true;
      var name = form.name.value.trim(), phone = form.phone.value.trim();
      if (name.length < 2) { err('name', 'Your name please.'); ok = false; } else err('name', '');
      if (phone.replace(/[^0-9]/g, '').length < 8) { err('phone', 'A number we can reach you on.'); ok = false; } else err('phone', '');
      return ok;
    }
    ['name', 'phone'].forEach(function (n) { var f = form[n]; if (f) f.addEventListener('input', function () { if (f.closest('.field').classList.contains('is-invalid')) validate(); }); });

    function show(kind, html) {
      status.className = 'cta__form-status is-' + kind;
      status.innerHTML = html;
      status.removeAttribute('hidden');
    }
    function mailtoLink() {
      var lines = ['Name: ' + form.name.value.trim(), 'Phone: ' + form.phone.value.trim(), 'Financing: ' + form.what.value];
      var est = form.querySelector('input[name="estimate"]'); if (est && est.value) lines.push('Estimate: ' + est.value);
      return 'mailto:' + (b.email || '') + '?subject=' + encodeURIComponent('Website enquiry — ' + form.name.value.trim()) + '&body=' + encodeURIComponent(lines.join('\n'));
    }
    function fallback() {
      var call = hasPhone ? ' or call <a href="tel:' + b.phone_tel + '">' + b.phone_display + '</a>' : '';
      show('error', (msgs.fallbackLead || 'We could not send that automatically.') + ' <a href="' + mailtoLink() + '">' + (msgs.fallbackButton || 'Open in email') + '</a>' + call);
    }
    function succeed() {
      var call = hasPhone ? ' Prefer to talk now? Call <a href="tel:' + b.phone_tel + '">' + b.phone_display + '</a>.' : '';
      show('success', (msgs.success || 'Thank you, we will be in touch shortly.') + call);
      submit.disabled = true; submit.textContent = 'Sent';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) { succeed(); return; }  // honeypot: pretend success to bots
      if (!validate()) return;
      if (!key) { fallback(); return; }                              // no key wired → honest fallback

      submit.disabled = true; submit.textContent = (msgs.sending || 'Sending...');
      var fd = new FormData(form);
      fd.append('access_key', key);
      fd.append('subject', 'New enquiry — Greenwood Asset Finance');
      fd.append('from_name', 'Greenwood website');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function (r) { return r.json().catch(function () { return { success: r.ok }; }); })
        .then(function (data) { if (data && data.success) succeed(); else { submit.disabled = false; submit.textContent = 'Send enquiry'; fallback(); } })
        .catch(function () { submit.disabled = false; submit.textContent = 'Send enquiry'; fallback(); });
    });
  }

  /* ─────────────── Footer / legal / proof ─────────────── */
  function initFooter() {
    var year = new Date().getFullYear();
    var cp = $('[data-copyright]'); if (cp) cp.textContent = '© ' + year + ' Greenwood Asset Finance Pty Ltd';

    var legal = GW.legal || {};
    if (legal.enabled) {
      var el = $('[data-legal]');
      if (el) {
        var parts = ['Greenwood Asset Finance Pty Ltd'];
        if (legal.abn) parts.push('ABN ' + legal.abn);
        if (legal.acl) parts.push('Australian Credit Licence ' + legal.acl);
        if (legal.licenseeNote) parts.push(legal.licenseeNote);
        el.textContent = parts.join(' · ');
        el.removeAttribute('hidden');
      }
    }
    // Proof slots stay hidden until enabled (rendering added when Troy supplies data).
  }

  /* ─────────────── Hero signature animation ─────────────── */
  function initHero() {
    var canvas = $('[data-hero-canvas]');
    var heroEl = $('.hero');
    var heroReveals = $$('.hero [data-reveal]');

    // Text intro: masked headline lines rise from their clip, then the rest fades up.
    // Pixel-based y (measured per line) so the tween advances reliably.
    var lines = $$('.hero__line-in');
    if (hasGSAP && !reduce) {
      lines.forEach(function (el, i) {
        var h = el.offsetHeight || 84;
        window.gsap.fromTo(el, { y: h + 8, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', delay: 0.15 + i * 0.1 });
      });
      window.gsap.to(heroReveals, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', stagger: 0.1, delay: 0.5 });
    } else {
      lines.forEach(function (el) { el.style.opacity = 1; });
      heroReveals.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    }
    if (!canvas || !heroEl) return;

    var ctx = canvas.getContext('2d');
    var css = getComputedStyle(root);
    function rgb(varName, fallback) {
      var h = (css.getPropertyValue(varName).trim() || fallback).replace('#', '');
      if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
      var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var forest = rgb('--brand-sage', '#9BA5A0');      // visible nodes on dark forest
    var sage = rgb('--brand-sage', '#9BA5A0');        // faint connecting lines
    var brass = rgb('--brand-sage-light', '#B9C7BE'); // brighter accent nodes

    var W = 0, H = 0, DPR = 1, nodes = [], intro = 0, rafId = 0, running = false;
    var mouse = { x: -9999, y: -9999, active: false };

    function count() { return window.innerWidth < 700 ? 34 : 74; }
    function build() {
      var n = count(); nodes = [];
      var ratio = (W / Math.max(H, 1)) || 1.4;
      var cols = Math.max(3, Math.round(Math.sqrt(n * ratio)));
      var rows = Math.ceil(n / cols), i = 0;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        if (i >= n) break;
        var hx = (c + 0.5) / cols * W + Math.sin(r * 12.9 + c) * 16;
        var hy = (r + 0.5) / rows * H + Math.cos(c * 7.7 + r) * 16;
        nodes.push({ hx: hx, hy: hy, x: Math.random() * W, y: Math.random() * H, ph: Math.random() * 6.28, sp: 0.35 + Math.random() * 0.7, br: Math.random() < 0.16 });
        i++;
      }
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect(); W = rect.width; H = rect.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }
    function frame(t) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);
      if (intro < 1) intro = Math.min(1, intro + 0.012);
      var e = 1 - Math.pow(1 - intro, 3);
      var time = (t || 0) * 0.001;
      var i, nd;
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        var tx = nd.hx + Math.sin(time * nd.sp + nd.ph) * 14;
        var ty = nd.hy + Math.cos(time * nd.sp * 0.9 + nd.ph) * 14;
        nd.x += (tx - nd.x) * (0.02 + 0.06 * e);
        nd.y += (ty - nd.y) * (0.02 + 0.06 * e);
        if (mouse.active) {
          var mdx = nd.x - mouse.x, mdy = nd.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < 190 && md > 0.01) { var f = (1 - md / 190) * 0.9; nd.x += (mdx / md) * f; nd.y += (mdy / md) * f; }
        }
      }
      var TH = Math.min(W, H) * 0.16 + 120, TH2 = TH * TH;
      for (i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < TH2) {
            var al = (1 - Math.sqrt(d2) / TH) * 0.16 * e;
            ctx.strokeStyle = 'rgba(' + sage[0] + ',' + sage[1] + ',' + sage[2] + ',' + al + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i]; var col = nd.br ? brass : forest;
        ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + ((nd.br ? 0.9 : 0.5) * e) + ')';
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.br ? 2.2 : 1.5, 0, 6.283); ctx.fill();
      }
    }
    function start() { if (running) return; running = true; rafId = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(rafId); }
    function staticFrame() { intro = 1; for (var i = 0; i < nodes.length; i++) { nodes[i].x = nodes[i].hx; nodes[i].y = nodes[i].hy; } running = true; frame(0); running = false; }

    resize();
    window.addEventListener('resize', debounce(resize, 200));

    if (reduce) { staticFrame(); return; }

    if (finePointer) {
      heroEl.addEventListener('mousemove', function (ev) { var r = canvas.getBoundingClientRect(); mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top; mouse.active = true; });
      heroEl.addEventListener('mouseleave', function () { mouse.active = false; mouse.x = mouse.y = -9999; });
    }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? start() : stop(); }); }, { threshold: 0.02 });
    io.observe(heroEl);
    D.addEventListener('visibilitychange', function () { if (D.hidden) stop(); else if (isInView(heroEl)) start(); });

    if (hasGSAP && window.ScrollTrigger) {
      window.gsap.to(canvas, { opacity: 0, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
      window.gsap.to('.hero__inner', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  /* ─────────────── Magnetic primary CTAs ─────────────── */
  function initMagnetic() {
    if (reduce || !finePointer) return;
    $$('.btn--primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (mx * 0.14) + 'px,' + (my * 0.22) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ───────────────────── Go ───────────────────── */
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
