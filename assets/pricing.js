/* Ascend Labs pricing model.
 * Shared by the browser (pricing.html) and the static page generator.
 * Prices are placeholders until PRICES_CONFIRMED is true. Replace the numbers
 * below with the real plan data, then flip the flags.
 */
(function (root) {
  'use strict';

  var FLAGS = {
    PRICES_CONFIRMED: false, // false: show "[Price]" with a Placeholder badge and a notice
    TRIAL_LIVE: false        // true: show "Start free trial" and "no card required" copy
  };

  var CONFIG = {
    crm: { name: 'Ascend CRM', unit: '/ user / month', plans: [
      { id: 'starter', name: 'Starter', desc: 'For small teams getting organised.', monthly: 29, annual: 24, trial: true, points: ['Lead capture & import', 'Assignment & follow-ups', 'Meetings & reminders', 'Standard reports'] },
      { id: 'growth', name: 'Growth', desc: 'For growing teams that need more control.', monthly: 49, annual: 41, trial: true, featured: true, points: ['Everything in Starter', 'First-response tracking & alerts', 'Team roles & permissions', 'Advanced dashboards'] },
      { id: 'custom', name: 'Custom', desc: 'For larger teams with specific needs.', contact: true, points: ['Everything in Growth', 'Onboarding & data import help', 'Custom configuration', 'Priority support'] }
    ] },
    campaigns: { name: 'Ascend Campaigns', unit: '/ month', plans: [
      { id: 'starter', name: 'Starter', desc: 'For teams sending regular updates.', monthly: 19, annual: 16, trial: true, points: ['Campaign builder', 'Templates & preview', 'Test sends', 'Unsubscribe handling'] },
      { id: 'growth', name: 'Growth', desc: 'For teams running campaigns every week.', monthly: 39, annual: 33, trial: true, featured: true, points: ['Everything in Starter', 'Scheduling', 'Audience filters', 'Engagement reporting'] },
      { id: 'custom', name: 'Custom', desc: 'For high volume or special requirements.', contact: true, points: ['Everything in Growth', 'Volume options', 'Onboarding help', 'Priority support'] }
    ] },
    bundles: { name: 'Bundle', unit: '/ month', plans: [
      { id: 'duo', name: 'CRM + Campaigns', desc: 'Both live products, billed together.', monthly: 69, annual: 58, featured: true, points: ['Ascend CRM — Growth', 'Ascend Campaigns — Growth', 'One quote for both', 'Separate sign-ins per app'] },
      { id: 'suite', name: 'Suite', desc: 'Every current Ascend product for one team.', contact: true, points: ['All live products', 'New products as they launch [TBC]', 'Onboarding help', 'Priority support'] }
    ] }
  };

  var ROWS = {
    crm: [
      ['Lead capture & import', ['yes', 'yes', 'yes']],
      ['Assignment & follow-ups', ['yes', 'yes', 'yes']],
      ['Meetings & reminders', ['yes', 'yes', 'yes']],
      ['First-response tracking & alerts', ['no', 'yes', 'yes']],
      ['Team roles & permissions', ['TBC', 'yes', 'yes']],
      ['Onboarding & data import help', ['no', 'TBC', 'yes']],
      ['Users included', ['TBC', 'TBC', 'Custom']]
    ],
    campaigns: [
      ['Campaign builder & templates', ['yes', 'yes', 'yes']],
      ['Test sends', ['yes', 'yes', 'yes']],
      ['Unsubscribe handling', ['yes', 'yes', 'yes']],
      ['Scheduling', ['no', 'yes', 'yes']],
      ['Engagement reporting', ['TBC', 'yes', 'yes']],
      ['Monthly sending volume', ['TBC', 'TBC', 'Custom']]
    ],
    bundles: [
      ['Ascend CRM', ['Growth', 'Included']],
      ['Ascend Campaigns', ['Growth', 'Included']],
      ['Future Ascend products', ['—', 'TBC']],
      ['Onboarding help', ['TBC', 'yes']]
    ]
  };

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var CHECK = '<svg class="check" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';

  function plansFor(tab, period) {
    var cfg = CONFIG[tab] || CONFIG.crm;
    var annual = period === 'annual';
    return cfg.plans.map(function (p) {
      var amount = annual ? p.annual : p.monthly;
      var price = p.contact ? 'Custom' : (FLAGS.PRICES_CONFIRMED && amount != null ? '$' + amount : '[Price]');
      var tag = p.contact ? ['Contact sales', 'badge-contact'] : (FLAGS.PRICES_CONFIRMED ? ['Confirmed', 'badge-live'] : ['Placeholder', 'badge-warn']);
      var cta = p.contact ? 'Contact sales' : (FLAGS.TRIAL_LIVE && p.trial ? 'Start free trial' : 'Get a quote');
      var btn = p.featured ? 'btn-primary' : (p.contact ? 'btn-dark' : 'btn-secondary');
      var trialLine = !p.contact && p.trial ? (FLAGS.TRIAL_LIVE ? '14 days free · no card required' : 'Free trial available once self-serve signup launches') : '';
      return {
        name: p.name, desc: p.desc, points: p.points, featured: !!p.featured, price: price,
        unit: p.contact ? '' : cfg.unit,
        billNote: p.contact ? 'Tailored to your team' : (annual ? 'Billed annually' : 'Billed monthly'),
        tag: tag[0], tagClass: tag[1], cta: cta, btn: btn, trialLine: trialLine
      };
    });
  }

  function renderPlans(tab, period) {
    return plansFor(tab, period).map(function (p) {
      return '<article class="plan' + (p.featured ? ' plan-featured' : '') + '">' +
        (p.featured ? '<span class="plan-flag">Most popular</span>' : '') +
        '<div class="plan-head"><h3 class="plan-name">' + p.name + '</h3><span class="badge ' + p.tagClass + '">' + p.tag + '</span></div>' +
        '<p class="plan-desc">' + esc(p.desc) + '</p>' +
        '<div><span class="plan-price">' + p.price + '</span><span class="plan-unit"> ' + p.unit + '</span><div class="plan-note">' + p.billNote + '</div></div>' +
        '<a href="contact.html" class="btn ' + p.btn + '">' + p.cta + '</a>' +
        (p.trialLine ? '<p class="plan-trial">' + p.trialLine + '</p>' : '') +
        '<ul class="plan-points">' + p.points.map(function (pt) { return '<li>' + CHECK + esc(pt) + '</li>'; }).join('') + '</ul>' +
        '</article>';
    }).join('');
  }

  function cell(v) {
    if (v === 'yes') return '<span role="cell" class="cell cell-yes">✓ Included</span>';
    if (v === 'no') return '<span role="cell" class="cell cell-no">— Not included</span>';
    if (v === 'TBC') return '<span role="cell" class="cell cell-tbc">TBC</span>';
    return '<span role="cell" class="cell">' + esc(v) + '</span>';
  }

  function renderCompare(tab, period) {
    var plans = plansFor(tab, period);
    var cols = '2fr ' + plans.map(function () { return '1fr'; }).join(' ');
    var head = '<div role="row" class="cmp-row cmp-head" style="grid-template-columns:' + cols + '"><span role="columnheader" class="cell">Feature</span>' +
      plans.map(function (p) { return '<span role="columnheader" class="cell">' + esc(p.name) + '</span>'; }).join('') + '</div>';
    var rows = (ROWS[tab] || ROWS.crm).map(function (r) {
      return '<div role="row" class="cmp-row" style="grid-template-columns:' + cols + '"><span role="rowheader" class="cell cell-label">' + r[0] + '</span>' + r[1].map(cell).join('') + '</div>';
    }).join('');
    return head + rows;
  }

  var api = {
    FLAGS: FLAGS, CONFIG: CONFIG, ROWS: ROWS,
    renderPlans: renderPlans, renderCompare: renderCompare,
    tabName: function (tab) { return (CONFIG[tab] || CONFIG.crm).name; },
    saveLabel: function () { return FLAGS.PRICES_CONFIRMED ? 'Save ~17% annually' : 'Annual saving [TBC]'; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AscendPricing = api;
})(typeof window !== 'undefined' ? window : this);
