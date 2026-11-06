/* Ascend Labs website behaviour. Plain JS, no dependencies. */
(function () {
  'use strict';

  var doc = document;
  // Tells the stylesheet that scripting is available (used for reveal-on-scroll and the pricing tabs).
  doc.documentElement.classList.add('js');
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header dropdowns (Products, Sign in) ---------- */
  (function () {
    var wrap = $('[data-header]');
    if (!wrap) return;
    var btns = $$('[data-menu]', wrap);

    function setOpen(btn, open) {
      var menu = doc.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.classList.toggle('is-open', open);
      if (menu) menu.hidden = !open;
    }
    function closeAll(except) {
      btns.forEach(function (b) { if (b !== except) setOpen(b, false); });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = b.getAttribute('aria-expanded') === 'true';
        closeAll(b);
        setOpen(b, !open);
      });
    });
    doc.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) closeAll();
    });
    wrap.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !wrap.contains(e.relatedTarget)) closeAll();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openBtn = btns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
      if (openBtn) { closeAll(); openBtn.focus(); }
    });
  })();

  /* ---------- Mobile menu dialog ---------- */
  (function () {
    var toggle = $('[data-mobile-toggle]');
    var menu = $('#mobile-menu');
    if (!toggle || !menu) return;
    var closeBtn = $('[data-mobile-close]', menu);
    var desktop = window.matchMedia('(min-width: 900px)');

    function focusables() {
      return $$('a[href], button:not([disabled])', menu).filter(function (el) { return el.offsetParent !== null; });
    }
    function open() {
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      doc.documentElement.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }
    function close(returnFocus) {
      if (menu.hidden) return;
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      doc.documentElement.style.overflow = '';
      if (returnFocus) toggle.focus();
    }
    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    doc.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    var onChange = function (e) { if (e.matches) close(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);

    var acc = $('[data-m-acc]', menu);
    if (acc) {
      acc.addEventListener('click', function () {
        var open = acc.getAttribute('aria-expanded') === 'true';
        acc.setAttribute('aria-expanded', open ? 'false' : 'true');
        var panel = doc.getElementById(acc.getAttribute('aria-controls'));
        if (panel) panel.hidden = open;
      });
    }
  })();

  /* ---------- FAQ accordions (one open at a time) ---------- */
  $$('[data-faq]').forEach(function (root) {
    var items = $$('.faq-item', root);
    function setItem(item, open) {
      var b = $('.faq-q', item), a = $('.faq-a', item), s = $('.faq-sign', item);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (a) a.hidden = !open;
      if (s) s.textContent = open ? '−' : '+';
    }
    items.forEach(function (item) {
      $('.faq-q', item).addEventListener('click', function () {
        var open = $('.faq-q', item).getAttribute('aria-expanded') === 'true';
        items.forEach(function (it) { setItem(it, false); });
        if (!open) setItem(item, true);
      });
    });
  });

  /* ---------- Pricing tabs + billing period (all plans are in the HTML; this only toggles) ---------- */
  (function () {
    var root = $('[data-pricing]');
    if (!root) return;
    var tabs = $$('[data-tab]');
    var periods = $$('[data-period]');
    var panels = {};
    tabs.forEach(function (t) { panels[t.getAttribute('data-tab')] = doc.getElementById(t.getAttribute('aria-controls')); });

    function selectTab(name) {
      if (!panels[name]) return;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[t.getAttribute('data-tab')].hidden = !on;
      });
    }
    function setPeriod(p) {
      root.setAttribute('data-billing', p);
      periods.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-period') === p ? 'true' : 'false'); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); n.focus(); n.click(); }
      });
    });
    periods.forEach(function (b) {
      b.addEventListener('click', function () { setPeriod(b.getAttribute('data-period')); });
    });

    // pricing.html#crm and pricing.html#agent open the matching tab.
    function fromHash(scroll) {
      var h = (location.hash || '').replace('#', '');
      selectTab(panels[h] ? h : 'crm');
      if (scroll && panels[h]) {
        var c = $('[data-pricing-controls]');
        if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' });
      }
    }
    window.addEventListener('hashchange', function () { fromHash(false); });
    setPeriod('monthly');
    fromHash(true);
  })();

  /* ---------- Campaign attribution: keep UTM / click-id params for the session (first-party, sessionStorage only) ---------- */
  var ATTR_KEY = 'ascend_attr';
  var ATTR_MAP = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign', utm_content: 'utmContent', utm_term: 'utmTerm', gclid: 'gclid', fbclid: 'fbclid' };
  function readAttr() {
    try { return JSON.parse(window.sessionStorage.getItem(ATTR_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  (function captureAttribution() {
    try {
      var q = new URLSearchParams(window.location.search);
      var stored = readAttr();
      var changed = false;
      Object.keys(ATTR_MAP).forEach(function (k) {
        var v = q.get(k);
        if (v) { stored[ATTR_MAP[k]] = v.slice(0, 200); changed = true; }
      });
      if (changed) window.sessionStorage.setItem(ATTR_KEY, JSON.stringify(stored));
    } catch (e) { /* storage blocked: attribution is optional */ }
  })();

  /* ---------- Contact form ---------- */
  (function () {
    var form = $('#contact-form');
    if (!form) return;

    var endpoint = form.getAttribute('data-endpoint') || '';
    var mailTo = form.getAttribute('data-mailto') || '';
    var fields = ['name', 'email', 'company', 'role', 'product', 'intent', 'message'];
    var roleLabels = { brokerage_or_developer: 'Brokerage or developer (Ascend CRM)', sales_agent: 'Sales agent (Ascend Agent)' };
    var productLabels = { crm: 'Ascend CRM', agent: 'Ascend Agent', bundle: 'Both', other: 'Not sure yet' };
    var intentLabels = { demo: 'Book a demo', quote: 'Get a quote', question: 'Ask a question' };
    var attempted = false;
    var phase = 'idle';
    /* Bot check (Cloudflare Turnstile). Off unless the form carries a site key; the widget script is only loaded then. */
    var siteKey = form.getAttribute('data-turnstile-sitekey') || '';
    var tsToken = null;
    var tsWidget = null;
    if (siteKey) {
      var tsBox = $('#turnstile-box');
      if (tsBox) {
        tsBox.hidden = false;
        window.__ascendTurnstileReady = function () {
          tsWidget = window.turnstile.render(tsBox, {
            sitekey: siteKey,
            callback: function (t) { tsToken = t; },
            'expired-callback': function () { tsToken = null; },
            'error-callback': function () { tsToken = null; }
          });
        };
        var tsScript = document.createElement('script');
        tsScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__ascendTurnstileReady';
        tsScript.async = true;
        tsScript.defer = true;
        document.head.appendChild(tsScript);
      }
    }
    function resetCheck() {
      tsToken = null;
      if (tsWidget !== null && window.turnstile) window.turnstile.reset(tsWidget);
    }

    var summary = $('#form-summary');
    var errorBox = $('#form-error');
    var errorText = $('#form-error-text');
    var errorDefault = errorText ? errorText.innerHTML : '';
    var submit = $('#form-submit');
    var submitLabel = $('#form-submit-label');
    var spinner = $('#form-spinner');
    var successBox = $('#form-success');
    var live = $('#form-status');

    function el(k) { return doc.getElementById('f-' + k); }
    function val(k) { return (el(k).value || '').trim(); }
    function announce(msg) { if (live) live.textContent = msg; }
    function values() {
      return {
        name: val('name'), email: val('email'), company: val('company'), role: el('role').value, product: el('product').value,
        intent: el('intent').value, message: val('message'), consent: !!$('#f-consent').checked
      };
    }
    function validate(v) {
      var e = {};
      if (!v.name) e.name = 'Enter your name.';
      if (!v.email) e.email = 'Enter your business email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = 'Enter a valid email, like name@company.com.';
      if (!v.company) e.company = 'Enter your company name.';
      if (!v.role) e.role = 'Choose the option that describes you.';
      if (!v.product) e.product = 'Choose a product, or “Not sure yet”.';
      if (!v.intent) e.intent = 'Tell us what you need.';
      if (v.message.length < 10) e.message = 'Add a short message (at least 10 characters).';
      return e;
    }
    function showErrors(errors) {
      var count = 0;
      fields.forEach(function (k) {
        var input = el(k), slot = doc.getElementById('e-' + k);
        var msg = errors[k];
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) {
          count++;
          slot.textContent = msg;
          slot.hidden = false;
        } else {
          slot.textContent = '';
          slot.hidden = true;
        }
      });
      if (count) {
        summary.textContent = 'Please fix the ' + count + ' highlighted ' + (count === 1 ? 'field' : 'fields') + '.';
        summary.hidden = false;
      } else {
        summary.hidden = true;
      }
      return count;
    }
    function setPhase(p, message) {
      phase = p;
      var loading = p === 'loading';
      submit.disabled = loading;
      submit.setAttribute('aria-busy', loading ? 'true' : 'false');
      spinner.hidden = !loading;
      submitLabel.textContent = loading ? 'Sending…' : (p === 'error' ? 'Try again' : 'Send message');
      if (p === 'error') {
        if (errorText) {
          if (message) errorText.textContent = message; else errorText.innerHTML = errorDefault;
        }
        errorBox.hidden = false;
      } else {
        errorBox.hidden = true;
      }
      if (loading) announce('Sending your message…');
    }
    function showSuccess(mode, v) {
      var first = (v.name || 'there').split(' ')[0];
      $('#success-title').textContent = mode === 'mail' ? 'Almost there, ' + first + '.' : 'Thanks, ' + first + ' — message received.';
      var body = $('#success-body');
      body.textContent = '';
      if (mode === 'mail') {
        body.appendChild(doc.createTextNode('We opened your email app with your message ready to send. If nothing opened, email us at '));
        var a = doc.createElement('a');
        a.href = 'mailto:' + mailTo;
        a.textContent = mailTo;
        body.appendChild(a);
        body.appendChild(doc.createTextNode('.'));
      } else {
        body.appendChild(doc.createTextNode('We’ll reply to '));
        var b = doc.createElement('b');
        b.textContent = v.email;
        body.appendChild(b);
        body.appendChild(doc.createTextNode('. In the meantime, you can explore the products.'));
      }
      form.hidden = true;
      successBox.hidden = false;
      announce(mode === 'mail' ? 'Your email app should open with your message.' : 'Message sent. We will reply to ' + v.email + '.');
      successBox.focus();
    }
    function mailtoUrl(v) {
      var lines = [
        'Name: ' + v.name,
        'Email: ' + v.email,
        'Company: ' + v.company,
        'I am a: ' + (roleLabels[v.role] || v.role),
        'Product of interest: ' + (productLabels[v.product] || v.product),
        'What I need: ' + (intentLabels[v.intent] || v.intent),
        '',
        v.message,
        '',
        'Product updates: ' + (v.consent ? 'yes, send me occasional updates' : 'no')
      ];
      return 'mailto:' + mailTo + '?subject=' + encodeURIComponent('Enquiry from ascend-labs.cc — ' + (intentLabels[v.intent] || 'general')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    }
    function mailFallback(v) {
      setPhase('idle');
      window.location.href = mailtoUrl(v);
      showSuccess('mail', v);
    }
    function payloadFor(v) {
      var payload = {
        name: v.name, email: v.email, company: v.company, role: v.role, product: v.product, intent: v.intent,
        message: v.message, marketingOptIn: v.consent,
        website: ($('#f-website') || {}).value || '',
        page: window.location.pathname
      };
      var attr = readAttr();
      Object.keys(attr).forEach(function (k) { if (attr[k]) payload[k] = attr[k]; });
      return payload;
    }

    fields.forEach(function (k) {
      var input = el(k);
      var handler = function () { if (attempted) showErrors(validate(values())); };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // Preselect from ?product=crm|agent|bundle|other and ?intent=demo|quote|question.
    // (?product=campaigns is an old link; that tool is now part of Ascend Agent.)
    try {
      var params = new URLSearchParams(window.location.search);
      var qp = params.get('product');
      if (qp === 'campaigns') qp = 'agent';
      if (qp && productLabels[qp]) el('product').value = qp;
      var qi = params.get('intent');
      if (qi && intentLabels[qi]) el('intent').value = qi;
    } catch (err) { /* ignore */ }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (phase === 'loading') return;
      var v = values();
      var errors = validate(v);
      attempted = true;
      var count = showErrors(errors);
      if (count) {
        announce('Please fix ' + count + (count === 1 ? ' field.' : ' fields.'));
        for (var i = 0; i < fields.length; i++) {
          if (errors[fields[i]]) { el(fields[i]).focus(); break; }
        }
        return;
      }

      if (siteKey && !tsToken) {
        setPhase('error', 'Please complete the security check above, then send again.');
        errorBox.focus();
        return;
      }
      setPhase('loading');
      if (!endpoint) { window.setTimeout(function () { mailFallback(v); }, 300); return; }

      var headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (tsToken) headers['X-Turnstile-Token'] = tsToken;
      fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(payloadFor(v)) })
        .then(function (r) {
          resetCheck(); // a token works once
          if (r.status === 202 || r.ok) { setPhase('idle'); showSuccess('api', v); return; }
          if (r.status === 503) { mailFallback(v); return; }          // email unavailable on the server: hand over to the visitor's email app
          if (r.status === 429) {
            setPhase('error', 'You’ve sent several messages in a short time. Please wait a few minutes and try again, or email us at ' + mailTo + '.');
            errorBox.focus();
            return;
          }
          if (r.status === 400) {
            return r.json().then(function (body) { return body || {}; }, function () { return {}; }).then(function (body) {
              var errs = {};
              if (body.field && fields.indexOf(body.field) !== -1) errs[body.field] = body.message || 'Check this field.';
              if (Object.keys(errs).length) {
                attempted = true;
                setPhase('idle');
                showErrors(errs);
                el(body.field).focus();
              } else {
                setPhase('error', body.message || undefined);
                errorBox.focus();
              }
            });
          }
          setPhase('error');
          errorBox.focus();
        })
        .catch(function () { mailFallback(v); });                     // network error, blocked request or CORS failure
    });

    var again = $('#form-reset');
    if (again) again.addEventListener('click', function () {
      form.reset();
      attempted = false;
      showErrors({});
      setPhase('idle');
      successBox.hidden = true;
      form.hidden = false;
      announce('');
      el('name').focus();
    });
  })();

  /* ---------- Section reveal on scroll ----------
   * Content is visible by default (see site.css). Only sections that start below the fold are hidden,
   * and they are revealed when they come near the viewport, when they are already above it (anchor jumps,
   * restored scroll, fast scrolling), on print, and by a safety net if the observer never reports. */
  (function () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var targets = $$('main .sec > .container, main .sec-b > .container, main .sec > .faq-narrow, main .sec-b > .faq-narrow');
    if (!targets.length) return;
    var pending = [];
    var reported = false;

    function show(t) {
      t.classList.add('is-visible');
      var i = pending.indexOf(t);
      if (i !== -1) pending.splice(i, 1);
      io.unobserve(t);
    }
    function showAll() { pending.slice().forEach(show); }
    // Reveal anything at or above the bottom of the viewport (covers sections scrolled past too quickly to intersect).
    function sweep() {
      var limit = window.innerHeight * 1.1;
      pending.slice().forEach(function (t) { if (t.getBoundingClientRect().top < limit) show(t); });
    }

    var io = new IntersectionObserver(function (entries) {
      reported = true;
      entries.forEach(function (en) {
        if (en.isIntersecting || en.boundingClientRect.top < 0) show(en.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 120px 0px' });

    targets.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return; // in view or above: never hidden, no animation
      t.classList.add('reveal');
      pending.push(t);
      io.observe(t);
    });

    var timer = null;
    window.addEventListener('scroll', function () {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(sweep, 120);
    }, { passive: true });
    window.addEventListener('hashchange', function () { window.setTimeout(sweep, 50); });
    window.addEventListener('resize', sweep);
    window.addEventListener('beforeprint', showAll);
    window.addEventListener('pageshow', sweep);
    window.addEventListener('load', function () {
      sweep();
      window.setTimeout(function () { if (!reported) showAll(); }, 1500); // observer never reported: show everything
    });
    if (location.hash) window.setTimeout(sweep, 50);
  })();
})();
