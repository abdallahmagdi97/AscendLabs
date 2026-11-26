/* Ascend motion behaviour. Plain JS, no dependencies. Native scrolling is never intercepted. */
(function () {
  'use strict';
  var doc = document;

  /* Sticky product story: mark which step is nearest the middle of the viewport. */
  var stories = [].slice.call(doc.querySelectorAll('.story'));
  if (stories.length && 'IntersectionObserver' in window) {
    stories.forEach(function (story) {
      var steps = [].slice.call(story.querySelectorAll('[data-step]'));
      story.setAttribute('data-active', '0');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) story.setAttribute('data-active', e.target.getAttribute('data-step'));
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    });
  }

  /* Firefox and older Safari have no CSS scroll timelines: give [data-scroll="rise"] the same effect, once. */
  if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var targets = [].slice.call(doc.querySelectorAll('[data-scroll="rise"], .stage-plane'));
    targets.forEach(function (t) { t.style.transform = 'translate3d(0,24px,0)'; });
    var rise = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        t.style.transition = 'transform 480ms cubic-bezier(.2,0,0,1)';
        t.style.transform = 'none';
        rise.unobserve(t);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    targets.forEach(function (t) { rise.observe(t); });
  }
})();

/* Manifesto: split the line into words so each can light up with scroll (CSS does the timing). */
(function () {
  var el = document.querySelector('[data-lit]');
  if (!el || !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()')) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var n = 0;
  (function walk(node) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span');
          s.className = 'lit-w'; s.style.setProperty('--i', n++); s.textContent = part;
          frag.appendChild(s);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1) { walk(c); }
    });
  })(el);
  el.classList.add('is-lit');
})();
