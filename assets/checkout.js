// The Ascend checkout page (backend docs/superpowers/specs/2026-11-22-own-checkout-design.md). The session id in ?s= is the only authority:
// the page reads the session, opens Paymob's embedded card form (Pixel) and then asks the backend whether the payment went through. Only the
// verified Paymob callback marks a session paid; the page never decides that itself. Card data stays inside Paymob's form.

const API = 'https://ascend-labs-crm-backend-production.up.railway.app/api/billing/checkout-sessions/';
const params = new URLSearchParams(location.search);
// Paymob appends its result to the return address; if it starts with "?" the session id would carry it, so cut it off.
const id = (params.get('s') || '').split('?')[0];
// Back from the bank's check: Paymob adds the transaction id (id=…) to the address, in either form.
const backFromBank = params.has('id') || /[?&]id=/.test((params.get('s') || ''));
let paying = false; // the card form is in use: hiding the tab (the bank's SMS, a redirect) is not leaving checkout
let leftSent = false;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const openedAt = Date.now();
let settled = false; // paid or expired: leaving the page is no longer "leaving checkout"
let session = null;
let pixelShown = false;
let cardUpdate = false; // this session replaces the saved card instead of buying a plan

function show(view) {
  $$('[data-view]').forEach((el) => { el.hidden = el.getAttribute('data-view') !== view; });
}

function step(name, detail) {
  if (!id) return;
  try {
    fetch(API + encodeURIComponent(id) + '/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: name, clientAt: new Date().toISOString(), detail: detail || null }),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch (e) { /* recording must never break checkout */ }
}

function setError(message) {
  const el = $('[data-error]');
  el.textContent = message || '';
  el.hidden = !message;
}

function usd(minor) {
  return '$' + (minor / 100).toFixed(2);
}

function failedText() {
  return cardUpdate
    ? 'The payment did not go through. Your current card is still in use. You can try again.'
    : 'The payment did not go through. You can try again.';
}

/**
 * The look of Paymob's card form, one style for every use: dark surface and the site's own colours, a hairline border, 8px corners,
 * Inter, no card-brand icons or heading, short plain placeholders and error texts. Pixel documents no single-line card row, so this is
 * the quietest version of its own layout.
 */
function pixelStyle() {
  return {
    Font_Family: 'Inter',
    Color_Primary: '#2D69FB',
    Color_Container: '#262623',
    Color_Input_Fields: '#1E1E1C',
    Color_Border_Input_Fields: 'rgba(216,203,179,.30)',
    Color_Border_Payment_Button: '#2D69FB',
    Color_Disabled: 'rgba(216,203,179,.25)',
    Color_Error: '#E57373',
    Text_Color_For_Label: '#D8CBB3',
    Text_Color_For_Input_Fields: '#D8CBB3',
    Color_For_Text_Placeholder: 'rgba(216,203,179,.55)',
    Text_Color_For_Payment_Button: '#FFFFFF',
    Font_Size_Label: '13',
    Font_Size_Input_Fields: '15',
    Font_Size_Payment_Button: '15',
    Font_Weight_Label: 500,
    Font_Weight_Input_Fields: 400,
    Font_Weight_Payment_Button: 600,
    Radius_Border: '8',
    Width_of_Container: '100%',
    Container_Padding: '0',
    Vertical_Padding: '0',
    Vertical_Spacing_between_components: '10',
    HideCardIcons: true,
    HideCardLabel: true,
    Placeholder_Text: { holderName: 'Name on card', cardNumber: 'Card number', expiryDate: 'MM / YY', securityCode: 'CVV' },
    Error_Text: {
      cardNumber: { required: 'Enter your card number', invalid: 'That card number does not look right' },
      expiryDate: { required: 'Enter the expiry date', invalid: 'That date does not look right' },
      securityCode: 'Enter the CVV',
      holderName: 'Enter the name on the card',
    },
    Button_Text: { payBtn: cardUpdate ? 'Check and save card' : 'Pay' },
  };
}

function render(v) {
  session = v;
  $$('[data-return]').forEach((a) => { a.href = v.returnUrl; });
  $('[data-test-mode]').hidden = !v.testMode;
  cardUpdate = v.kind === 'card_update';
  if (v.status === 'expired') { settled = true; show('expired'); return; }
  if (v.status === 'paid') {
    settled = true;
    if (cardUpdate) {
      $('[data-paid-title]').textContent = 'Your card is updated.';
      $('[data-paid-note]').textContent = 'The ' + (v.egpAmount || 'small') + ' check is being refunded.';
    }
    show('paid');
    return;
  }

  $$('[data-purchase-only]').forEach((el) => { el.hidden = cardUpdate; });
  $$('[data-card-only]').forEach((el) => { el.hidden = !cardUpdate; });
  if (cardUpdate) {
    $('[data-plan-name]').textContent = 'Update your card';
    $('[data-check-text]').textContent = 'We charge ' + (v.egpAmount || 'a small amount') + ' to check the new card, then refund it straight away. Your plan and renewal date do not change.';
    $('[data-current-card]').textContent = v.currentCard
      ? 'Current card: ' + v.currentCard.brand + ' ending ' + v.currentCard.last4 + ' · expires ' + String(v.currentCard.expiryMonth).padStart(2, '0') + '/' + String(v.currentCard.expiryYear).padStart(2, '0')
      : '';
    $('[data-continue]').textContent = 'Check and save card';
    $('[data-continue]').disabled = false;
    $('[data-buyer-name]').textContent = v.buyerName;
    $('[data-buyer-email]').textContent = v.buyerEmail;
    if (!$('#phone').value) $('#phone').value = v.buyerPhone || '';
    show('checkout');
    return;
  }

  $('[data-plan-name]').textContent = v.planName + (v.interval === 'year' ? ' · yearly' : ' · monthly');
  $('[data-usd]').textContent = usd(v.usdMinor) + (v.interval === 'year' ? ' / year' : ' / month') + (v.promo ? ' (Founder’s Club)' : '');
  $('[data-egp]').textContent = v.egpAmount || '—';
  $('[data-rate]').textContent = v.egpAmount
    ? 'Charged in Egyptian pounds at the Central Bank of Egypt rate (' + (v.fxSource || 'today') + ').'
    : 'Prices in EGP cannot be shown right now. Please try again in a few minutes.';
  $('[data-continue]').disabled = !v.egpAmount;
  $('[data-buyer-name]').textContent = v.buyerName;
  $('[data-buyer-email]').textContent = v.buyerEmail;
  if (!$('#phone').value) $('#phone').value = v.buyerPhone || '';
  show('checkout');
}

async function load() {
  if (!id) { show('invalid'); return; }
  let res;
  try {
    res = await fetch(API + encodeURIComponent(id), { credentials: 'omit' });
  } catch (e) {
    show('invalid');
    return;
  }
  if (!res.ok) { show('invalid'); return; }
  const v = await res.json();
  render(v);
  if (v.status === 'expired' || v.status === 'paid') return;
  step('page_opened');
  // Back from the bank's check (a redirect), or the page was reloaded mid-payment: wait for Paymob's confirmation.
  if (backFromBank && v.status === 'paying') poll();
  if (backFromBank && v.status === 'failed') {
    setError(failedText());
    $('[data-continue]').textContent = 'Try again';
  }
}

async function start() {
  setError('');
  if (!$('[data-consent]').checked) { setError('Agree to keep your card on file to continue.'); return; }
  const phone = $('#phone').value.trim();
  if (!phone) { setError('Add a phone number to pay.'); return; }
  const button = $('[data-continue]');
  button.disabled = true;
  try {
    const res = await fetch(API + encodeURIComponent(id) + '/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true, buyerPhone: phone }),
      credentials: 'omit',
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 404) { show('invalid'); return; }
    if (!res.ok) {
      if (body.code === 'session_not_open') { await load(); return; }
      setError(body.message || (cardUpdate ? 'The card check could not be started. Please try again.' : 'The payment could not be started. Please try again.'));
      button.disabled = false;
      return;
    }
    mountPixel(body);
  } catch (e) {
    setError('The payment could not be started. Please check your connection and try again.');
    button.disabled = false;
  }
}

function mountPixel(credentials) {
  $('[data-continue]').hidden = true;
  $('[data-pay]').hidden = false;
  $('#pixel').innerHTML = '';
  if (typeof window.Pixel !== 'function') {
    setError('The card form could not be loaded. Please reload the page.');
    return;
  }
  // eslint-disable-next-line no-new
  new window.Pixel({
    publicKey: credentials.publicKey,
    clientSecret: credentials.clientSecret,
    paymentMethods: ['card'],
    elementId: 'pixel',
    // The buyer agreed to keep the card on file above; renewals charge it.
    forceSaveCard: true,
    beforePaymentComplete: async () => {
      paying = true;
      step('pay_pressed');
      return true;
    },
    afterPaymentComplete: async (result) => {
      if (result && result.success === false) step('payment_failed', 'pixel');
      poll();
    },
    customStyle: pixelStyle(),
  });
  if (!pixelShown) { pixelShown = true; step('pay_form_shown'); }
}

let polling = false;
async function poll() {
  if (polling) return;
  polling = true;
  paying = true;
  $('[data-confirming]').hidden = false;
  $('[data-continue]').hidden = true;
  const until = Date.now() + 60000;
  while (Date.now() < until) {
    try {
      const res = await fetch(API + encodeURIComponent(id) + '/status', { credentials: 'omit' });
      if (res.ok) {
        const { status } = await res.json();
        if (status === 'paid') { settled = true; show('paid'); polling = false; return; }
        if (status === 'failed') {
          $('[data-confirming]').hidden = true;
          setError(failedText());
          $('[data-pay]').hidden = true;
          const button = $('[data-continue]');
          button.hidden = false;
          button.disabled = false;
          button.textContent = 'Try again';
          polling = false;
          paying = false;
          return;
        }
        if (status === 'expired') { settled = true; show('expired'); polling = false; return; }
      }
    } catch (e) { /* keep trying until the time is up */ }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  $('[data-confirming]').textContent = cardUpdate
    ? 'We’re confirming your new card. You can close this page; your card will switch once Paymob confirms.'
    : 'We’re confirming your payment. You can close this page; your plan will switch on when Paymob confirms.';
  polling = false;
}

document.addEventListener('DOMContentLoaded', () => {
  $('[data-continue]').addEventListener('click', start);
  $('[data-consent]').addEventListener('change', (e) => { if (e.target.checked) step('consent_ticked'); });
  load();
});

function left() {
  if (settled || paying || leftSent || !session) return;
  leftSent = true;
  step('page_left', 'seconds=' + Math.round((Date.now() - openedAt) / 1000));
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') left(); });
window.addEventListener('pagehide', left);
