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

  var widgetTabs = null;   // set by initTabs: { activate: fn(name, focus) }

  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function revealAllNow() { root.classList.add('gw-failsafe'); }

  /* Shared: open the enquiry tab, optionally prefill the message, scroll + focus. */
  function goEnquire(prefillMessage) {
    if (widgetTabs) widgetTabs.activate('enquiry');
    var form = $('[data-form]');
    if (form && prefillMessage) { var msg = form.querySelector('[name="message"]'); if (msg) msg.value = prefillMessage; }
    var target = D.getElementById('enquire');
    if (target) {
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -80, duration: 1.1 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    setTimeout(function () { var f = $('#f-first'); if (f) f.focus({ preventScroll: true }); }, 620);
  }

  /* ───────────────────── Boot ───────────────────── */
  function ready() {
    if (window.__gwReveal) clearTimeout(window.__gwReveal);   // cancel the head failsafe
    safe(initLenisGsap, 'scroll');
    safe(wireBrand, 'brand');
    safe(initReveals, 'reveals');
    safe(initNav, 'nav');
    safe(initDropdown, 'dropdown');
    safe(initTabs, 'tabs');
    safe(initFaq, 'faq');
    safe(initEstimator, 'estimator');
    safe(initForm, 'form');
    safe(initServices, 'services');
    safe(initLenders, 'lenders');
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

    // Anchor links → smooth scroll with nav offset.
    // Read href at click time: wireBrand rewrites .js-call hrefs to tel: after this runs,
    // so a stale closure would hijack real phone calls into a scroll. Bail on non-hash hrefs.
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id.charAt(0) !== '#' || id.length < 2) return;
        var target = D.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        var top = id === '#top';
        if (lenis) lenis.scrollTo(top ? 0 : target, { offset: top ? 0 : -80, duration: 1.1 });
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
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        window.gsap.to(el, { opacity: 1, y: 0, x: 0, duration: 0.95, ease: 'expo.out', delay: Math.min(idx, 6) * 0.05, overwrite: true,
          onComplete: function () { el.style.willChange = 'auto'; } });
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
      if (nav) nav.classList.toggle('is-scrolled', y > 40);
      if (bar && !bar.hasAttribute('hidden')) bar.classList.toggle('is-visible', y > (window.innerHeight * 0.65));
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

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

  /* ─────────────── Nav Services dropdown ─────────────── */
  function initDropdown() {
    $$('[data-dropdown]').forEach(function (dd) {
      var btn = $('.nav__link--toggle', dd);
      var menu = $('.nav__menu', dd);
      if (!btn || !menu) return;
      var open = function () { dd.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
      var close = function () { dd.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', function (e) { e.preventDefault(); dd.classList.contains('is-open') ? close() : open(); });
      if (finePointer) {
        dd.addEventListener('mouseenter', open);
        dd.addEventListener('mouseleave', close);
      }
      $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
      D.addEventListener('click', function (e) { if (!dd.contains(e.target)) close(); });
    });
  }

  /* ─────────────── Hero widget tabs (Enquiry | Estimate) ─────────────── */
  function initTabs() {
    var wrap = $('[data-tabs]'); if (!wrap) return;
    var tabs = $$('.widget__tab', wrap);
    var panels = $$('.widget__panel', wrap);

    function activate(name, focusTab) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focusTab) t.focus();
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === name;
        if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var ni = (i + dir + tabs.length) % tabs.length;
        activate(tabs[ni].getAttribute('data-tab'), true);
      });
    });

    widgetTabs = { activate: activate };

    // Links/buttons that target a specific tab (Calculators, Start an enquiry, etc.)
    $$('[data-tab-target]').forEach(function (a) {
      a.addEventListener('click', function () { activate(a.getAttribute('data-tab-target')); });
    });
  }

  /* ─────────────── Service cards → prefilled enquiry ─────────────── */
  function initServices() {
    $$('.service[data-service]').forEach(function (el) {
      var svc = el.getAttribute('data-service');
      function go(e) { e.preventDefault(); goEnquire("I'd like to enquire about " + svc + "."); }
      el.addEventListener('click', go);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); });
    });
  }

  /* ─────────────── Lender wall ─────────────── */
  function initLenders() {
    var wall = $('[data-lender-wall]'); if (!wall) return;
    var L = (GW.proof && GW.proof.lenders) || {};
    if (!L.enabled || !L.items || !L.items.length) {
      var sec = wall.closest('.lenders'); if (sec) sec.setAttribute('hidden', '');
      return;
    }
    var frag = D.createDocumentFragment();
    L.items.forEach(function (it) {
      var li = D.createElement('li');
      li.className = 'lender';
      if (it.file) {
        var img = D.createElement('img');
        img.className = 'lender__logo';
        img.src = 'assets/brands/' + it.file;
        img.alt = it.name;
        img.loading = 'lazy';
        img.decoding = 'async';
        li.appendChild(img);
      } else {
        li.classList.add('lender--word');
        li.textContent = it.name;
      }
      frag.appendChild(li);
    });
    wall.appendChild(frag);
    if (L.note) { var p = D.createElement('p'); p.className = 'lenders__note'; p.textContent = L.note; wall.insertAdjacentElement('afterend', p); }
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
            items.forEach(function (o) { if (o !== item && o.open) { var oa = $('.faq__a', o); window.gsap.to(oa, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.inOut', onComplete: function () { o.open = false; oa.style.height = ''; oa.style.opacity = ''; } }); } });
            item.open = true;
            window.gsap.fromTo(ans, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' });
          }
        });
      });
    }
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

  /* ─────────────── Repayment estimator (deposit + balloon) ─────────────── */
  function initEstimator() {
    var card = $('[data-estimator]'); if (!card) return;
    var cfg = GW.estimator || {};
    var amount = $('#est-amount'), deposit = $('#est-deposit'), balloon = $('#est-balloon'), term = $('#est-term'), rate = $('#est-rate');
    var amountOut = $('#est-amount-out'), depositOut = $('#est-deposit-out'), balloonOut = $('#est-balloon-out'), termOut = $('#est-term-out'), rateOut = $('#est-rate-out');
    var monthlyEl = $('#est-monthly'), weeklyEl = $('#est-weekly'), fortEl = $('#est-fortnightly');
    applyCfg(amount, cfg.amount); applyCfg(deposit, cfg.deposit); applyCfg(balloon, cfg.balloon); applyCfg(term, cfg.term); applyCfg(rate, cfg.rate);

    var inputs = [amount, deposit, balloon, term, rate];
    var prevMonthly = 0;
    function applyCfg(el, c) { if (!el || !c) return; el.min = c.min; el.max = c.max; el.step = c.step; el.value = c.value; }
    function fill(el) { if (!el) return; var pct = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--fillPct', pct + '%'); }
    function calc() {
      var price = +amount.value, dep = +deposit.value, bal = +balloon.value, n = +term.value, r = (+rate.value) / 100 / 12;
      var financed = Math.max(0, price - dep);
      var fv = Math.min(bal, financed);                          // balloon can't exceed financed
      var monthly = r === 0 ? (financed - fv) / n
                            : (financed - fv / Math.pow(1 + r, n)) * r / (1 - Math.pow(1 + r, -n));
      if (!isFinite(monthly) || monthly < 0) monthly = 0;
      amountOut.textContent = money.format(price);
      depositOut.textContent = money.format(dep);
      balloonOut.textContent = money.format(bal);
      termOut.textContent = term.value + ' months';
      rateOut.textContent = (+rate.value).toFixed(1) + '% p.a.';
      inputs.forEach(fill);
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
    inputs.forEach(function (el) { if (el) el.addEventListener('input', calc); });
    calc();

    // "Qualify your quotation" → open enquiry tab, prefill the message with these numbers.
    var send = $('[data-estimator-send]');
    if (send) send.addEventListener('click', function (e) {
      e.preventDefault();
      var price = +amount.value, dep = +deposit.value, bal = +balloon.value;
      var summary = "I'd like a quote on " + money.format(price) + " over " + term.value + " months";
      if (dep > 0) summary += ", " + money.format(dep) + " deposit";
      if (bal > 0) summary += ", " + money.format(bal) + " balloon";
      summary += " (est. " + monthlyEl.textContent + "/mo at " + (+rate.value).toFixed(1) + "% indicative).";
      goEnquire(summary);
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
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function err(name, message) {
      var slot = form.querySelector('[data-error-for="' + name + '"]');
      var field = form.querySelector('[name="' + name + '"]');
      if (slot) slot.textContent = message || '';
      if (field) field.closest('.field').classList.toggle('is-invalid', !!message);
    }
    function validate() {
      var ok = true;
      var first = form.first.value.trim(), last = form.last.value.trim(), email = form.email.value.trim(), phone = form.phone.value.trim();
      if (first.length < 2) { err('first', 'Your first name please.'); ok = false; } else err('first', '');
      if (last.length < 2) { err('last', 'And your last name.'); ok = false; } else err('last', '');
      if (!emailRe.test(email)) { err('email', 'A valid email address.'); ok = false; } else err('email', '');
      if (phone.replace(/[^0-9]/g, '').length < 8) { err('phone', 'A number we can reach you on.'); ok = false; } else err('phone', '');
      return ok;
    }
    ['first', 'last', 'email', 'phone'].forEach(function (n) {
      var f = form[n];
      if (f) f.addEventListener('input', function () { if (f.closest('.field').classList.contains('is-invalid')) validate(); });
    });

    function show(kind, html) { status.className = 'enquiry__status is-' + kind; status.innerHTML = html; status.removeAttribute('hidden'); }
    function fullName() { return (form.first.value.trim() + ' ' + form.last.value.trim()).trim(); }
    function mailtoLink() {
      var lines = [
        'Name: ' + fullName(),
        'Email: ' + form.email.value.trim(),
        'Phone: ' + form.phone.value.trim(),
        'Message: ' + (form.message.value.trim() || '(none)')
      ];
      return 'mailto:' + (b.email || '') + '?subject=' + encodeURIComponent('Website enquiry — ' + fullName()) + '&body=' + encodeURIComponent(lines.join('\n'));
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
      fd.append('name', fullName());
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
        // AR/ACL clause only renders once Troy's AR number is issued (with Viking's ACL).
        if (legal.arNumber && legal.aggregatorAcl && legal.aggregator) {
          parts.push('Authorised Credit Representative ' + legal.arNumber +
                     ' of ' + legal.aggregator + ', Australian Credit Licence ' + legal.aggregatorAcl);
        }
        el.textContent = parts.join(' · ');
        el.removeAttribute('hidden');
      }
    }
  }

  /* ─────────────── Hero intro ─────────────── */
  function initHero() {
    var heroReveals = $$('.hero [data-reveal]');
    var lines = $$('.hero__line-in');
    if (hasGSAP && !reduce) {
      lines.forEach(function (el, i) {
        var h = el.offsetHeight || 64;
        window.gsap.fromTo(el, { y: h + 8, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, ease: 'expo.out', delay: 0.12 + i * 0.09 });
      });
      window.gsap.to(heroReveals, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.4 });
    } else {
      lines.forEach(function (el) { el.style.opacity = 1; });
      heroReveals.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    }

    // Pause the always-on hero column scrollers + glow when the tab is hidden (saves GPU/battery).
    var hero = $('.hero');
    var cols = $$('.hero__col');
    if (hero && cols.length) {
      D.addEventListener('visibilitychange', function () {
        var state = D.hidden ? 'paused' : 'running';
        cols.forEach(function (c) { c.style.animationPlayState = state; });
        hero.classList.toggle('is-hidden', D.hidden);
      });
    }
  }

  /* ─────────────── Magnetic primary CTAs ─────────────── */
  function initMagnetic() {
    if (reduce || !finePointer) return;
    $$('.btn--primary:not(.btn--block)').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (mx * 0.12) + 'px,' + (my * 0.18) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ───────────────────── Go ───────────────────── */
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
