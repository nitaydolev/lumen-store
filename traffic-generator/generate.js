#!/usr/bin/env node
/* ============================================================
   Lumen traffic generator

   Drives real headless browsers through the store so that every
   session travels the full path: dataLayer -> GTM -> GA4.
   Each session gets a fresh browser context, which means a fresh
   cookie jar, which means GA4 counts it as a new user.

   Two modes:

     a fixed batch, which finishes and prints a summary
       node generate.js --sessions 300 --workers 6

     a continuous run, which never finishes and paces itself by the
       hour of the day, so the store looks alive rather than spiked
       node generate.js --forever --daily 1200

   Other flags:
     --url http://localhost:4321    aim somewhere else
     --headed                       watch the browsers work
   ============================================================ */

const { chromium, devices } = require('playwright');
const C = require('./config');

/* ---------- small helpers ---------- */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Picks one entry from a list of { weight } objects. */
function weighted(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}

/** Human-ish pause, so sessions do not all collapse into one instant. */
const think = () => wait(120 + Math.random() * 450);

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i === -1 ? fallback : args[i + 1];
  };
  return {
    sessions: Number(get('--sessions', 200)),
    workers: Number(get('--workers', 4)),
    baseUrl: String(get('--url', 'https://lumen-store-orcin.vercel.app')).replace(/\/$/, ''),
    headed: args.includes('--headed'),
    forever: args.includes('--forever'),
    daily: Number(get('--daily', 1200)),
    batchMinutes: Number(get('--batch', 0))
  };
}

/* How many sessions this particular hour should receive. */
function sessionsThisHour(dailyTarget, when) {
  const hourShare = C.HOURLY[when.getHours()] / C.HOURLY.reduce((a, b) => a + b, 0);
  return dailyTarget * hourShare * C.DAY_OF_WEEK[when.getDay()];
}

/* ---------- building the landing URL ---------- */

function landingUrl(baseUrl, channel) {
  const landing = weighted(C.LANDING);
  let path;

  if (landing.kind === 'home') path = '/';
  else if (landing.kind === 'category') path = '/category.html?cat=' + pick(C.CATEGORIES);
  else if (landing.kind === 'product') path = '/product.html?id=' + weighted(C.PRODUCTS).id;
  else path = '/search.html?q=' + encodeURIComponent(pick(C.SEARCH_TERMS));

  const url = new URL(baseUrl + path);
  if (channel.utm) {
    for (const [k, v] of Object.entries(channel.utm)) url.searchParams.set(k, v);
  }
  return { url: url.toString(), kind: landing.kind };
}

/* ---------- page actions ---------- */

/** The consent banner only appears on the first page of a fresh context. */
async function answerConsent(page, stats) {
  const accept = chance(C.RATES.acceptCookies);
  const button = accept ? '[data-consent="granted"]' : '[data-consent="denied"]';
  try {
    await page.waitForSelector('#consent-banner', { timeout: 2500 });
    await page.click(button);
    stats.consent[accept ? 'granted' : 'denied']++;
  } catch (e) {
    /* no banner on this load, nothing to answer */
  }
}

async function maybeSignUp(page, baseUrl, stats) {
  if (!chance(C.RATES.signUp)) return;
  await page.goto(baseUrl + '/account.html', { waitUntil: 'domcontentloaded' });
  await think();
  try {
    await page.click('.tab[data-tab="signup"]');
    const email = 'shopper' + Math.floor(Math.random() * 1e6) + '@example.com';
    await page.fill('#signup input[name="email"]', email);
    await page.click('#signup button[type="submit"]');
    await page.waitForLoadState('domcontentloaded');
    stats.signUps++;
  } catch (e) { /* layout changed, skip */ }
}

async function maybeSearch(page, baseUrl, stats) {
  if (!chance(C.RATES.searchDuringVisit)) return;
  const term = pick(C.SEARCH_TERMS);
  await page.goto(baseUrl + '/search.html?q=' + encodeURIComponent(term), { waitUntil: 'domcontentloaded' });
  stats.searches++;
  await think();
}

async function maybeNewsletter(page, stats) {
  if (!chance(C.RATES.newsletter)) return;
  try {
    await page.fill('#newsletter-form input[name="email"]', 'reader' + Math.floor(Math.random() * 1e6) + '@example.com');
    await page.click('#newsletter-form button[type="submit"]');
    stats.leads++;
    await think();
  } catch (e) { /* the form is gone once submitted */ }
}

async function maybeClickPromo(page, stats) {
  if (!chance(C.RATES.viewPromotion)) return;
  try {
    await page.click('.promo-body', { timeout: 1200 });
    await page.waitForLoadState('domcontentloaded');
    stats.promoClicks++;
  } catch (e) { /* no banner on this page */ }
}

async function viewProduct(page, baseUrl, productId) {
  await page.goto(baseUrl + '/product.html?id=' + productId, { waitUntil: 'domcontentloaded' });
  await think();

  // Some visitors try a different colour or capacity before deciding
  if (chance(0.45)) {
    const swatches = await page.$$('.swatch');
    if (swatches.length > 1) {
      await swatches[Math.floor(Math.random() * swatches.length)].click();
      await think();
    }
  }
  if (chance(0.35)) {
    const options = await page.$$('.option');
    if (options.length > 1) {
      await options[Math.floor(Math.random() * options.length)].click();
      await think();
    }
  }
}

async function runCheckout(page, baseUrl, channel, stats) {
  await page.goto(baseUrl + '/cart.html', { waitUntil: 'domcontentloaded' });
  stats.viewCart++;
  await think();

  // A few people change their mind about quantity, or drop the item entirely
  if (chance(0.18)) {
    try { await page.click('.qty button[data-inc]', { timeout: 1000 }); await think(); } catch (e) {}
  }
  if (chance(0.09)) {
    try { await page.click('.link-remove', { timeout: 1000 }); await think(); } catch (e) {}
    const empty = await page.$('.empty');
    if (empty) return false;      // emptied the bag, session ends here
  }

  if (!chance(channel.checkout)) return false;

  await page.click('#checkout');
  await page.waitForLoadState('domcontentloaded');
  stats.beginCheckout++;
  await think();

  if (chance(C.RATES.useCoupon)) {
    try {
      await page.fill('#coupon-form input[name="code"]', pick(C.COUPONS));
      await page.click('#coupon-form button[type="submit"]');
      await think();
    } catch (e) {}
  }

  if (chance(C.RATES.expressShipping)) {
    try { await page.selectOption('#shipping-tier', 'Express'); await think(); } catch (e) {}
  }

  await page.click('#shipping button[type="submit"]');
  stats.addShipping++;
  await think();

  if (!chance(channel.purchase)) return false;   // drops out at payment

  await page.click('#payment button[type="submit"]');
  await page.waitForLoadState('domcontentloaded');
  stats.purchases++;
  await wait(900);                                // let the purchase hit leave
  return true;
}

/* ---------- one visitor ---------- */

async function runSession(browser, baseUrl, stats) {
  const channel = weighted(C.CHANNELS);
  const device = weighted(C.DEVICES);

  const context = await browser.newContext({
    ...devices[device.name],
    locale: 'en-US'
  });
  const page = await context.newPage();

  try {
    const landing = landingUrl(baseUrl, channel);
    await page.goto(landing.url, { waitUntil: 'domcontentloaded' });
    await answerConsent(page, stats);
    await think();

    stats.byChannel[channel.name] = (stats.byChannel[channel.name] || 0) + 1;

    await maybeSignUp(page, baseUrl, stats);
    if (landing.kind === 'home') await maybeClickPromo(page, stats);
    await maybeSearch(page, baseUrl, stats);

    // Browse a few products
    const views = pick(C.RATES.extraProductViews) + 1;
    let lastProduct = null;
    for (let i = 0; i < views; i++) {
      lastProduct = weighted(C.PRODUCTS).id;
      await viewProduct(page, baseUrl, lastProduct);
      stats.productViews++;
    }

    await maybeNewsletter(page, stats);

    if (lastProduct && chance(channel.addToCart)) {
      await page.click('#add');
      stats.addToCart++;
      await think();
      await runCheckout(page, baseUrl, channel, stats);
    }

    await wait(500);          // give the last hits time to go out
    stats.sessions++;
  } catch (err) {
    stats.errors++;
    if (stats.errors <= 3) console.error('  session error:', err.message.split('\n')[0]);
  } finally {
    await context.close();
  }
}

/* ---------- continuous mode ---------- */

/**
 * Runs until stopped. Recomputes the pace before every session, so the
 * rate follows the clock: a few visitors an hour at 04:00, many at 20:00.
 * Gaps are randomised around the target so arrivals are not metronomic.
 */
async function runForever(browser, opts, stats) {
  let hourStamp = -1;
  let hourCount = 0;

  while (true) {
    const now = new Date();

    if (now.getHours() !== hourStamp) {
      if (hourStamp !== -1) {
        console.log('  ' + String(hourStamp).padStart(2, '0') + ':00  ' +
                    hourCount + ' sessions, ' + stats.purchases + ' purchases so far');
      }
      hourStamp = now.getHours();
      hourCount = 0;
      const planned = sessionsThisHour(opts.daily, now);
      console.log('[' + now.toLocaleTimeString() + '] hour ' +
                  String(hourStamp).padStart(2, '0') + ':00, aiming for ' +
                  Math.round(planned) + ' sessions');
    }

    const perHour = Math.max(sessionsThisHour(opts.daily, now), 1);
    const meanGap = 3600000 / perHour;

    await runSession(browser, opts.baseUrl, stats);
    hourCount++;

    // Jitter the gap, and subtract roughly how long the visit itself took
    const gap = meanGap * (0.4 + Math.random() * 1.2) - 8000;
    if (gap > 0) await wait(gap);
  }
}

/* ---------- driver ---------- */

async function main() {
  const opts = parseArgs();

  const stats = {
    sessions: 0, errors: 0, productViews: 0, addToCart: 0, viewCart: 0,
    beginCheckout: 0, addShipping: 0, purchases: 0, searches: 0,
    signUps: 0, leads: 0, promoClicks: 0,
    consent: { granted: 0, denied: 0 },
    byChannel: {}
  };

  /* Batch mode: a scheduled runner wakes up, asks how busy this slice of
     the day should be, runs that many visits and exits. Several of these
     an hour add up to the same curve a continuous run would draw. */
  if (opts.batchMinutes > 0) {
    const planned = sessionsThisHour(opts.daily, new Date()) * (opts.batchMinutes / 60);
    opts.sessions = Math.max(1, Math.round(planned));
    opts.workers = Math.min(4, Math.max(1, Math.ceil(opts.sessions / 8)));
  }

  console.log('Lumen traffic generator');
  console.log('  target   ' + opts.baseUrl);
  if (opts.batchMinutes > 0) {
    console.log('  mode     batch for the next ' + opts.batchMinutes + ' minutes');
    console.log('  clock    ' + new Date().toString());
  }
  if (opts.forever) {
    console.log('  mode     continuous, about ' + opts.daily + ' sessions a day');
    console.log('  stop     Ctrl-C');
  } else {
    console.log('  sessions ' + opts.sessions);
    console.log('  workers  ' + opts.workers);
  }
  console.log('');

  const browser = await chromium.launch({ headless: !opts.headed });
  const started = Date.now();
  let queued = 0;

  if (opts.forever) {
    await runForever(browser, opts, stats);
    return;
  }

  async function worker(id) {
    while (queued < opts.sessions) {
      queued++;
      await runSession(browser, opts.baseUrl, stats);
      if (stats.sessions % 25 === 0 && stats.sessions > 0) {
        const mins = (Date.now() - started) / 60000;
        console.log('  ' + stats.sessions + '/' + opts.sessions +
                    '  purchases ' + stats.purchases +
                    '  (' + Math.round(stats.sessions / Math.max(mins, 0.01)) + '/min)');
      }
    }
  }

  await Promise.all(Array.from({ length: opts.workers }, (_, i) => worker(i)));
  await browser.close();

  const mins = (Date.now() - started) / 60000;
  console.log('\nDone in ' + mins.toFixed(1) + ' minutes\n');
  console.log('  sessions        ' + stats.sessions + '   (errors ' + stats.errors + ')');
  console.log('  product views   ' + stats.productViews);
  console.log('  add to cart     ' + stats.addToCart);
  console.log('  view cart       ' + stats.viewCart);
  console.log('  begin checkout  ' + stats.beginCheckout);
  console.log('  purchases       ' + stats.purchases +
              '   (' + (100 * stats.purchases / Math.max(stats.sessions, 1)).toFixed(2) + '% of sessions)');
  console.log('  searches        ' + stats.searches);
  console.log('  sign ups        ' + stats.signUps);
  console.log('  newsletter      ' + stats.leads);
  console.log('  promo clicks    ' + stats.promoClicks);
  console.log('  consent         granted ' + stats.consent.granted + ', denied ' + stats.consent.denied);
  console.log('\n  by channel');
  for (const [name, n] of Object.entries(stats.byChannel).sort((a, b) => b[1] - a[1])) {
    console.log('    ' + name.padEnd(16) + n);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
