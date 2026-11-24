/* Anora on the marketing website: a public assistant for visitors. It appears only when the backend says it is on
   (GET /api/anora/public/status), answers from Ascend's published website documentation, and stores nothing in the browser:
   the conversation lives in memory and is sent back (last turns only) with each question. Each question carries a fresh
   Cloudflare Turnstile token. No HTML from the server is ever inserted: text is escaped, only **bold** and line breaks are
   rendered, and a citation link is used only for ascend-labs.cc addresses. */
(function () {
  'use strict';
  var API = 'https://ascend-labs-crm-backend-production.up.railway.app/api/anora/public';
  var script = document.currentScript || document.querySelector('script[src*="anora.js"]');
  var SITE_KEY = (script && script.getAttribute('data-sitekey')) || '0x4AAAAAAGFPWI-W41iWonUC';
  var doc = document;
  var history = [];
  var busy = false;
  var open = false;
  var els = {};
  var tsWidget = null, tsWaiting = null, tsPromise = null;

  function isAr() { return (doc.documentElement.lang || '').toLowerCase().indexOf('ar') === 0; }
  var S = {
    en: { open: 'Ask Anora', title: 'Ask Anora', close: 'Close', send: 'Send', placeholder: 'Ask about our products…',
      hello: 'Hi! I\'m Anora, Ascend Labs\' AI assistant. Ask me what our products do. I answer from our published information.',
      note: 'AI assistant. Answers come from Ascend\'s published information and may be incomplete.',
      sources: 'Sources', team: 'Talk to our team', error: 'Anora could not answer just now. Please try again, or write to info@ascend-labs.cc.',
      check: 'We could not confirm you are not a robot. Please try again.', label: 'Your question', wait: 'Anora is typing' },
    ar: { open: 'اسأل أنورا', title: 'اسأل أنورا', close: 'إغلاق', send: 'إرسال', placeholder: 'اسأل عن منتجاتنا…',
      hello: 'أهلاً! أنا أنورا، مساعدة Ascend Labs بالذكاء الاصطناعي. اسألني عن منتجاتنا. بجاوب من المعلومات المنشورة عندنا.',
      note: 'مساعد ذكاء اصطناعي. الإجابات من معلومات Ascend المنشورة وممكن تكون ناقصة.',
      sources: 'المصادر', team: 'كلّم فريقنا', error: 'أنورا مش قادرة تجاوب دلوقتي. جرّب تاني أو اكتب لنا على info@ascend-labs.cc.',
      check: 'ما قدرناش نتأكد إنك مش روبوت. جرّب تاني.', label: 'سؤالك', wait: 'أنورا بتكتب' }
  };
  function t(k) { return S[isAr() ? 'ar' : 'en'][k]; }

  function h(tag, attrs, children) {
    var n = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  /* Safe rendering: escape by construction (textContent), then **bold** and line breaks only. */
  function render(node, text) {
    node.textContent = '';
    String(text).split('\n').forEach(function (line, i) {
      if (i > 0) node.appendChild(doc.createElement('br'));
      line.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
        if (/^\*\*[^*]+\*\*$/.test(part)) node.appendChild(h('strong', { text: part.slice(2, -2) }));
        else if (part) node.appendChild(doc.createTextNode(part));
      });
    });
  }

  function safeLink(url) {
    try {
      var u = new URL(url);
      return u.protocol === 'https:' && (u.hostname === 'ascend-labs.cc' || /\.ascend-labs\.cc$/.test(u.hostname));
    } catch (e) { return false; }
  }

  function addMessage(role, text) {
    var bubble = h('div', { 'class': 'anora-msg anora-' + role });
    var body = h('div', { 'class': 'anora-body' });
    render(body, text);
    bubble.appendChild(body);
    els.list.appendChild(bubble);
    els.list.scrollTop = els.list.scrollHeight;
    return { bubble: bubble, body: body };
  }

  function addExtras(msg, done) {
    if (done.citations && done.citations.length) {
      var links = done.citations.filter(function (c) { return c.url && safeLink(c.url); });
      if (links.length) {
        var wrap = h('div', { 'class': 'anora-sources' }, [h('span', { text: t('sources') + ': ' })]);
        links.forEach(function (c) {
          wrap.appendChild(h('a', { href: c.url, text: '[' + c.n + '] ' + c.title, rel: 'noopener' }));
        });
        msg.bubble.appendChild(wrap);
      }
    }
    if (done.escalate) msg.bubble.appendChild(h('a', { 'class': 'anora-team', href: 'contact.html', text: t('team') }));
  }

  /* Turnstile: one invisible-until-needed widget, executed again for each question. */
  function loadTurnstile() {
    if (tsPromise) return tsPromise;
    tsPromise = new Promise(function (resolve, reject) {
      if (window.turnstile) { resolve(); return; }
      window.__anoraTurnstileReady = resolve;
      var s = doc.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__anoraTurnstileReady';
      s.async = true; s.defer = true;
      s.onerror = function () { tsPromise = null; reject(new Error('turnstile')); };
      doc.head.appendChild(s);
    });
    return tsPromise;
  }
  function getToken() {
    return loadTurnstile().then(function () {
      return new Promise(function (resolve, reject) {
        tsWaiting = { resolve: resolve, reject: reject };
        if (tsWidget === null) {
          tsWidget = window.turnstile.render(els.ts, {
            sitekey: SITE_KEY, execution: 'execute', appearance: 'interaction-only',
            callback: function (tok) { if (tsWaiting) { tsWaiting.resolve(tok); tsWaiting = null; } },
            'error-callback': function () { if (tsWaiting) { tsWaiting.reject(new Error('turnstile')); tsWaiting = null; } }
          });
        } else window.turnstile.reset(tsWidget);
        window.turnstile.execute(tsWidget);
      });
    });
  }

  /* Reads Server-Sent Events from a fetch body. Calls onEvent(name, data) for each complete event. */
  function readEvents(res, onEvent) {
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        buf += dec.decode(r.value, { stream: true });
        var parts = buf.split('\n\n');
        buf = parts.pop();
        parts.forEach(function (block) {
          var name = '', data = '';
          block.split('\n').forEach(function (l) {
            if (l.indexOf('event: ') === 0) name = l.slice(7); else if (l.indexOf('data: ') === 0) data += l.slice(6);
          });
          if (name && data) { try { onEvent(name, JSON.parse(data)); } catch (e) { /* ignore a malformed event */ } }
        });
        return pump();
      });
    }
    return pump();
  }

  function setBusy(b) {
    busy = b;
    els.send.disabled = b;
    els.input.disabled = b;
    els.list.setAttribute('aria-busy', b ? 'true' : 'false');
  }

  function ask(text) {
    if (busy || !text.trim()) return;
    setBusy(true);
    addMessage('user', text);
    var reply = addMessage('assistant', '');
    reply.bubble.classList.add('anora-typing');
    reply.body.setAttribute('aria-label', t('wait'));
    var shown = '';
    var finished = false;

    function fail(msg) { render(reply.body, msg || t('error')); reply.bubble.classList.remove('anora-typing'); setBusy(false); els.input.focus(); }

    getToken().then(function (token) {
      return fetch(API + '/ask', {
        method: 'POST', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'X-Turnstile-Token': token },
        body: JSON.stringify({ text: text, history: history.slice(-6), language: isAr() ? 'ar' : null })
      });
    }).then(function (res) {
      if (res.status === 400) return res.json().then(function (b) { fail(b && b.code === 'turnstile.failed' ? t('check') : (b && b.message) || t('error')); });
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (b) { fail((b && b.message) || t('error')); });
      return readEvents(res, function (name, data) {
        if (name === 'delta') { shown += data.text; render(reply.body, shown); els.list.scrollTop = els.list.scrollHeight; }
        else if (name === 'done') {
          finished = true;
          render(reply.body, data.text);
          reply.bubble.classList.remove('anora-typing');
          addExtras(reply, data);
          history.push({ role: 'user', content: text }, { role: 'assistant', content: data.text });
          history = history.slice(-6);
        } else if (name === 'error') { finished = true; fail(data.message); }
      }).then(function () { if (!finished) fail(); else { setBusy(false); els.input.focus(); } });
    }).catch(function () { fail(); });
  }

  function setOpen(next) {
    open = next;
    els.panel.hidden = !next;
    els.launcher.setAttribute('aria-expanded', next ? 'true' : 'false');
    els.launcher.hidden = next;
    if (next) els.input.focus(); else els.launcher.focus();
  }

  function build() {
    var launcher = h('button', { 'class': 'anora-launcher', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'anora-panel', text: t('open') });
    var close = h('button', { 'class': 'anora-close', type: 'button', 'aria-label': t('close'), text: '×' });
    var list = h('div', { 'class': 'anora-list', role: 'log', 'aria-live': 'polite' });
    var input = h('input', { 'class': 'anora-input', type: 'text', maxlength: '500', autocomplete: 'off', placeholder: t('placeholder'), 'aria-label': t('label') });
    var send = h('button', { 'class': 'anora-send', type: 'submit', text: t('send') });
    var form = h('form', { 'class': 'anora-form' }, [input, send]);
    var ts = h('div', { 'class': 'anora-ts' });
    var panel = h('div', { 'class': 'anora-panel', id: 'anora-panel', role: 'dialog', 'aria-label': t('title'), hidden: '' }, [
      h('div', { 'class': 'anora-head' }, [h('strong', { text: t('title') }), close]),
      list, h('p', { 'class': 'anora-note', text: t('note') }), form, ts
    ]);
    var root = h('div', { 'class': 'anora', dir: isAr() ? 'rtl' : 'ltr' }, [launcher, panel]);
    doc.body.appendChild(root);
    els = { launcher: launcher, panel: panel, list: list, input: input, send: send, ts: ts };
    launcher.addEventListener('click', function () { setOpen(true); });
    close.addEventListener('click', function () { setOpen(false); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
    addMessage('assistant', t('hello'));
  }

  /* Show the launcher only when the backend says Anora is on for the website. Any other answer leaves the page untouched. */
  fetch(API + '/status', { credentials: 'omit' }).then(function (r) { if (r.ok) build(); }).catch(function () { /* stay hidden */ });
})();
