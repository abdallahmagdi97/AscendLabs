/* Ascend Labs website behaviour. Plain JS, no dependencies. */
(function () {
  'use strict';

  var doc = document;
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

  /* ---------- Products directory filter ---------- */
  (function () {
    var chips = $$('[data-filter]');
    var cards = $$('[data-tags]');
    if (!chips.length || !cards.length) return;
    var status = $('#filter-status');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var shown = 0;
        cards.forEach(function (card) {
          var tags = (card.getAttribute('data-tags') || '').split(' ');
          var show = f === 'all' || tags.indexOf(f) !== -1;
          card.hidden = !show;
          if (show) shown++;
        });
        if (status) status.textContent = 'Showing ' + shown + (shown === 1 ? ' product' : ' products');
      });
    });
  })();

  /* ---------- Pricing tabs + billing period ---------- */
  (function () {
    var P = window.AscendPricing;
    var plansEl = $('#plans');
    if (!P || !plansEl) return;
    var tabs = $$('[data-tab]');
    var periods = $$('[data-period]');
    var state = { tab: 'crm', period: 'annual' };
    var panel = $('#plans-panel');

    function render() {
      plansEl.innerHTML = P.renderPlans(state.tab, state.period);
      var cmp = $('#compare-table');
      if (cmp) cmp.innerHTML = P.renderCompare(state.tab, state.period);
      var title = $('#compare-title');
      if (title) title.textContent = 'Compare ' + P.tabName(state.tab) + ' plans';
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === state.tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && panel) panel.setAttribute('aria-labelledby', t.id);
      });
      periods.forEach(function (p) {
        p.setAttribute('aria-pressed', p.getAttribute('data-period') === state.period ? 'true' : 'false');
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { state.tab = t.getAttribute('data-tab'); render(); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); n.focus(); n.click(); }
      });
    });
    periods.forEach(function (p) {
      p.addEventListener('click', function () { state.period = p.getAttribute('data-period'); render(); });
    });
  })();

  /* ---------- Contact form ---------- */
  (function () {
    var form = $('#contact-form');
    if (!form) return;

    var endpoint = form.getAttribute('data-endpoint') || '';
    var mailTo = form.getAttribute('data-mailto') || '';
    var fields = ['name', 'email', 'company', 'product', 'message'];
    var productLabels = { crm: 'Ascend CRM', campaigns: 'Ascend Campaigns', both: 'Both / a bundle', unsure: 'Not sure yet' };
    var attempted = false;
    var phase = 'idle';

    var summary = $('#form-summary');
    var errorBox = $('#form-error');
    var submit = $('#form-submit');
    var submitLabel = $('#form-submit-label');
    var spinner = $('#form-spinner');
    var successBox = $('#form-success');

    function el(k) { return doc.getElementById('f-' + k); }
    function val(k) { return (el(k).value || '').trim(); }
    function values() {
      return {
        name: val('name'), email: val('email'), company: val('company'), product: el('product').value,
        message: val('message'), consent: !!$('#f-consent').checked
      };
    }
    function validate(v) {
      var e = {};
      if (!v.name) e.name = 'Enter your name.';
      if (!v.email) e.email = 'Enter your business email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = 'Enter a valid email, like name@company.com.';
      if (!v.company) e.company = 'Enter your company name.';
      if (!v.product) e.product = 'Choose a product, or “Not sure yet”.';
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
    function setPhase(p) {
      phase = p;
      var loading = p === 'loading';
      submit.disabled = loading;
      submit.setAttribute('aria-busy', loading ? 'true' : 'false');
      spinner.hidden = !loading;
      submitLabel.textContent = loading ? 'Sending…' : (p === 'error' ? 'Try again' : 'Send message');
      errorBox.hidden = p !== 'error';
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
      successBox.setAttribute('tabindex', '-1');
      successBox.focus();
    }
    function mailtoUrl(v) {
      var lines = [
        'Name: ' + v.name,
        'Email: ' + v.email,
        'Company: ' + v.company,
        'Product of interest: ' + (productLabels[v.product] || v.product),
        '',
        v.message,
        '',
        'Product updates: ' + (v.consent ? 'yes, send me occasional updates' : 'no')
      ];
      return 'mailto:' + mailTo + '?subject=' + encodeURIComponent('Enquiry from ascend-labs.cc — ' + (productLabels[v.product] || 'general')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    }

    fields.forEach(function (k) {
      var input = el(k);
      var handler = function () { if (attempted) showErrors(validate(values())); };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // Preselect the product from ?product=crm|campaigns|both|unsure
    try {
      var q = new URLSearchParams(window.location.search).get('product');
      if (q && productLabels[q]) el('product').value = q;
    } catch (err) { /* ignore */ }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (phase === 'loading') return;
      var v = values();
      var errors = validate(v);
      attempted = true;
      var count = showErrors(errors);
      if (count) {
        for (var i = 0; i < fields.length; i++) {
          if (errors[fields[i]]) { el(fields[i]).focus(); break; }
        }
        return;
      }
      // Honeypot: bots fill the hidden field. Pretend success, send nothing.
      var hp = $('#f-website');
      if (hp && hp.value) { showSuccess(endpoint ? 'api' : 'mail', v); return; }

      setPhase('loading');
      if (!endpoint) {
        // No form backend is connected, so hand the message to the visitor's email app.
        window.setTimeout(function () {
          setPhase('idle');
          window.location.href = mailtoUrl(v);
          showSuccess('mail', v);
        }, 400);
        return;
      }
      var payload = {
        name: v.name, email: v.email, company: v.company, product: v.product, message: v.message,
        marketingConsent: v.consent,
        consentText: v.consent ? $('#consent-text').textContent.trim() : '',
        source: window.location.pathname,
        submittedAt: new Date().toISOString()
      };
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); setPhase('idle'); showSuccess('api', v); })
        .catch(function () { setPhase('error'); errorBox.focus && errorBox.focus(); });
    });

    var again = $('#form-reset');
    if (again) again.addEventListener('click', function () {
      form.reset();
      attempted = false;
      showErrors({});
      setPhase('idle');
      successBox.hidden = true;
      form.hidden = false;
      el('name').focus();
    });
  })();

  /* ---------- Section reveal on scroll (once, first appearance only) ---------- */
  (function () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var targets = $$('main .sec > .container, main .sec-b > .container, main .sec > .faq-narrow, main .sec-b > .faq-narrow');
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return; // already in view: no animation
      t.classList.add('reveal');
      io.observe(t);
    });
  })();
})();
