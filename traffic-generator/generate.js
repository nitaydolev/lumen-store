#!/usr/bin/env node
/* ============================================================
   Lumen traffic generator

   Drives real headless browsers through the store so that every
   session travels the full path: dataLayer -> GTM -> GA4.

   Each session gets its own browser context. A stranger's is empty, so
   GA4 counts them as a new user. A returning visitor's is restored from
   the pool in visitors.js, cookies and all, so GA4 recognises them.

   Three modes:

     a fixed burst, which finishes as fast as it can and prints a summary
       node generate.js --sessions 300 --workers 6

     a continuous run, which never finishes and paces itself by the
       hour of the day, so the store looks alive rather than spiked
       node generate.js --forever --daily 1200

     a timed slice, which is the continuous run with a stopwatch. One
       visitor at a time, properly spaced, until the clock runs out.
       Scheduled back to back, the slices read as one unbroken stream.
       node generate.js --batch 27 --daily 1200

   Other flags:
     --url http://localhost:4321    aim somewhere else
     --headed                       watch the browsers work
   ============================================================ */

const path = require('path');
const { chromium, devices } = require('playwright');
const C = require('./config');
const { VisitorPool, forget } = require('./visitors');

/* Who the store has met before. Kept next to this file so the workflow can
   carry it from one run to the next. */
const VISITORS_FILE = path.join(__dirname, 'visitors.json');

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
/**
 * Make the Google tag send whatever it is holding, right now.
 *
 * GA4 does not transmit an event the moment it happens. The tag queues events
 * and flushes the queue about every five seconds, or when the page is leaving.
 * A visitor who moves on sooner than that takes the queue with them and the
 * events never arrive. Real people linger, so they never meet this; a robot
 * that clicks through in 300ms loses nearly everything except page_view.
 *
 * Telling the page it has just been hidden triggers the tag's own departure
 * handler, which sends the queue by beacon. The page is then handed back its
 * visibility so engagement time keeps being measured normally.
 */
async function flushHits(page) {
  try {
    // A push is not a request yet: GTM has to match it to a trigger and build
    // the hit first. Flushing in the same instant finds an empty queue.
    await wait(260);
    await page.evaluate(() => {
      var visibility = function (value) {
        Object.defineProperty(document, 'visibilityState', {
          value: value, configurable: true
        });
      };
      visibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pagehide'));
      visibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await wait(130);              // give the beacon time to leave
  } catch (e) { /* already navigated away, nothing left to flush */ }
}

/** Pause the way a person would, then let anything queued go out. */
const think = async (page) => {
  await wait(120 + Math.random() * 450);
  if (page) await flushHits(page);
};

/** Go to a page, having first let the page being left finish sending. */
async function goTo(page, url) {
  await flushHits(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

/**
 * Click something that navigates, without losing the event the click itself
 * raises. GTM needs a moment to turn a dataLayer push into a request, and a
 * navigation starting in the same instant cuts it off, so the next document
 * is held at the door while the old page catches up and sends.
 */
async function clickThrough(page, selector, options) {
  const hold = async (route) => {
    if (route.request().isNavigationRequest()) await wait(400);
    await route.continue();
  };
  const isDocument = (url) => String(url).indexOf('.html') !== -1;

  await page.route(isDocument, hold);
  try {
    await page.click(selector, options);
    await flushHits(page);                 // the old page is still alive here
    await page.waitForLoadState('domcontentloaded');
  } finally {
    await page.unroute(isDocument, hold).catch(() => {});
  }
}

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
    batchMinutes: Number(get('--batch', 0)),
    audit: args.includes('--audit')
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
    // Consent Mode is set to hold everything for 500ms waiting for an answer
    // like this one. Flushing before that window closes sends nothing at all,
    // not even the page_view, so the landing page has to be given its moment.
    await wait(650);
  } catch (e) {
    /* no banner on this load, nothing to answer */
  }
}

/** Returns true if an account was actually created. */
async function maybeSignUp(page, baseUrl, stats) {
  if (!chance(C.RATES.signUp)) return false;
  await goTo(page, baseUrl + '/account.html');
  await think(page);
  try {
    await page.click('.tab[data-tab="signup"]');
    const email = 'shopper' + Math.floor(Math.random() * 1e6) + '@example.com';
    await page.fill('#signup input[name="email"]', email);
    await clickThrough(page, '#signup button[type="submit"]');
    stats.signUps++;
    return true;
  } catch (e) { /* layout changed, skip */ }
  return false;
}

async function maybeSearch(page, baseUrl, stats) {
  if (!chance(C.RATES.searchDuringVisit)) return;
  const term = pick(C.SEARCH_TERMS);
  await goTo(page, baseUrl + '/search.html?q=' + encodeURIComponent(term));
  stats.searches++;
  await think(page);
}

async function maybeNewsletter(page, stats) {
  if (!chance(C.RATES.newsletter)) return;
  try {
    await page.fill('#newsletter-form input[name="email"]', 'reader' + Math.floor(Math.random() * 1e6) + '@example.com');
    await page.click('#newsletter-form button[type="submit"]');
    stats.leads++;
    await think(page);
  } catch (e) { /* the form is gone once submitted */ }
}

async function maybeClickPromo(page, stats) {
  if (!chance(C.RATES.viewPromotion)) return;
  try {
    await clickThrough(page, '.promo-body', { timeout: 1200 });
    stats.promoClicks++;
  } catch (e) { /* no banner on this page */ }
}

async function viewProduct(page, baseUrl, productId) {
  await goTo(page, baseUrl + '/product.html?id=' + productId);
  await think(page);

  // Some visitors try a different colour or capacity before deciding
  if (chance(0.45)) {
    const swatches = await page.$$('.swatch');
    if (swatches.length > 1) {
      await swatches[Math.floor(Math.random() * swatches.length)].click();
      await think(page);
    }
  }
  if (chance(0.35)) {
    const options = await page.$$('.option');
    if (options.length > 1) {
      await options[Math.floor(Math.random() * options.length)].click();
      await think(page);
    }
  }
}

async function runCheckout(page, baseUrl, channel, stats) {
  await goTo(page, baseUrl + '/cart.html');
  stats.viewCart++;
  await think(page);

  // A few people change their mind about quantity, or drop the item entirely
  if (chance(0.18)) {
    try { await page.click('.qty button[data-inc]', { timeout: 1000 }); await think(page); } catch (e) {}
  }
  if (chance(0.09)) {
    try { await page.click('.link-remove', { timeout: 1000 }); await think(page); } catch (e) {}
    const empty = await page.$('.empty');
    if (empty) return false;      // emptied the bag, session ends here
  }

  if (!chance(channel.checkout)) return false;

  await clickThrough(page, '#checkout');
  stats.beginCheckout++;
  await think(page);

  if (chance(C.RATES.useCoupon)) {
    try {
      await page.fill('#coupon-form input[name="code"]', pick(C.COUPONS));
      await page.click('#coupon-form button[type="submit"]');
      await think(page);
    } catch (e) {}
  }

  if (chance(C.RATES.expressShipping)) {
    try { await page.selectOption('#shipping-tier', 'Express'); await think(page); } catch (e) {}
  }

  await page.click('#shipping button[type="submit"]');
  stats.addShipping++;
  await think(page);

  if (!chance(channel.purchase)) return false;   // drops out at payment

  await clickThrough(page, '#payment button[type="submit"]');
  stats.purchases++;
  await flushHits(page);                          // let the purchase hit leave
  return true;
}

/* ---------- audit ----------

   An event that the site pushes but Google never receives is invisible: the
   reports simply show a smaller number, and nothing anywhere says a hit was
   lost. That is how the missing add_to_cart went unnoticed for two days.

   With --audit the generator watches both ends of the pipe at once and
   reports the difference, so a regression in the tracking shows up as a
   number rather than as a puzzle in GA4 a week later.
*/

/** Count every event name the page hands to the dataLayer, across navigations. */
async function watchPushes(page, audit) {
  await page.exposeFunction('__auditPush', function (name) {
    audit.pushed[name] = (audit.pushed[name] || 0) + 1;
  });
  // Runs fresh on every document, before the site's own scripts
  await page.addInitScript(function () {
    window.dataLayer = window.dataLayer || [];
    var send = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function () {
      for (var i = 0; i < arguments.length; i++) {
        var entry = arguments[i];
        if (entry && entry.event && String(entry.event).indexOf('gtm.') !== 0) {
          try { window.__auditPush(String(entry.event)); } catch (e) {}
        }
      }
      return send.apply(null, arguments);
    };
  });
}

/** Count every event name that actually reaches Google's collection endpoint. */
function watchHits(page, audit) {
  page.on('request', function (req) {
    var url = req.url();
    if (url.indexOf('/g/collect') === -1) return;

    var names = [];
    try {
      new URL(url).searchParams.getAll('en').forEach(function (n) { names.push(n); });
    } catch (e) {}

    // Batched hits arrive as one event per line in the body
    var body = req.postData();
    if (body) {
      body.split('\n').forEach(function (line) {
        var m = /(?:^|&)en=([^&]+)/.exec(line);
        if (m) names.push(decodeURIComponent(m[1]));
      });
    }

    names.forEach(function (n) {
      audit.delivered[n] = (audit.delivered[n] || 0) + 1;
    });
  });
}

/* Pushed to the dataLayer on purpose, and deliberately not forwarded to GA4.
   Not a loss, so the audit should not call it one. See the README. */
const NOT_FORWARDED = ['consent_update'];

function reportAudit(audit) {
  var names = Object.keys(audit.pushed)
    .concat(Object.keys(audit.delivered))
    .filter(function (n, i, all) { return all.indexOf(n) === i; })
    .sort();

  console.log('\n  GA4 audit   (what the site pushed, what Google received)\n');
  console.log('    ' + 'event'.padEnd(22) + 'pushed'.padStart(8) + 'delivered'.padStart(11) + '   ');

  var lost = [];
  names.forEach(function (n) {
    var pushed = audit.pushed[n] || 0;
    var got = audit.delivered[n] || 0;
    var byDesign = NOT_FORWARDED.indexOf(n) !== -1;
    // page_view and session_start come from the tag itself, never the dataLayer
    var short = pushed > 0 && got < pushed && !byDesign;
    if (short) lost.push(n + ' (' + (pushed - got) + ' of ' + pushed + ')');
    console.log('    ' + n.padEnd(22) + String(pushed).padStart(8) +
                String(got).padStart(11) +
                (short ? '   LOST' : byDesign ? '   not forwarded, by design' : ''));
  });

  console.log('');
  if (lost.length) console.log('    events lost in flight: ' + lost.join(', '));
  else console.log('    nothing lost');
}

/* ---------- one visitor ---------- */

/**
 * A returning visitor arrives differently: rarely through an ad, and more
 * likely to buy. Both are applied here rather than in the walk itself, so
 * the rest of the session code does not care who it is driving.
 */
function returningChannel() {
  const w = C.RETURNING.channelWeights;
  const choice = weighted(
    C.CHANNELS.map((c) => ({ channel: c, weight: w[c.name] || 0.01 }))
  ).channel;

  const lift = C.RETURNING.conversionLift;
  return {
    ...choice,
    addToCart: Math.min(0.95, choice.addToCart * lift),
    checkout: Math.min(0.95, choice.checkout * lift),
    purchase: Math.min(0.95, choice.purchase * lift)
  };
}

async function runSession(browser, baseUrl, stats, pool) {
  // Either somebody the store already knows, or a stranger
  const known = chance(C.RETURNING.share) ? pool.take() : null;
  const person = known || pool.stranger(weighted(C.DEVICES).name);
  const channel = known ? returningChannel() : weighted(C.CHANNELS);

  let state = person.state;
  if (state && !chance(C.RETURNING.keepCart)) forget(state, 'lumen_cart');

  const context = await browser.newContext({
    ...devices[person.device],
    locale: 'en-US',
    storageState: state || undefined
  });
  const page = await context.newPage();
  if (stats.audit) {
    watchHits(page, stats.audit);
    await watchPushes(page, stats.audit);
  }

  try {
    const landing = landingUrl(baseUrl, channel);
    await page.goto(landing.url, { waitUntil: 'domcontentloaded' });
    await answerConsent(page, stats);
    await think(page);

    stats.byChannel[channel.name] = (stats.byChannel[channel.name] || 0) + 1;
    if (known) stats.returning++;

    // Somebody with an account does not sign up again
    if (!person.hasAccount && await maybeSignUp(page, baseUrl, stats)) {
      person.hasAccount = true;
    }
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
      await think(page);
      await runCheckout(page, baseUrl, channel, stats);
    }

    await flushHits(page);    // give the last hits time to go out
    stats.sessions++;
  } catch (err) {
    stats.errors++;
    if (stats.errors <= 3) console.error('  session error:', err.message.split('\n')[0]);
  } finally {
    // Keep whatever the browser ended up holding: cookies, login, consent
    try {
      pool.remember(person, await context.storageState());
    } catch (e) { /* context already gone, this visitor is simply not saved */ }
    await context.close();
  }
}

/* ---------- paced mode ---------- */

/* Sessions to run before the browser is thrown away and relaunched. */
const RECYCLE_AFTER = 120;

/**
 * Sends one visitor at a time, with a realistic gap between them, until
 * `deadline` passes. Pass null for a run that never stops.
 *
 * The pace is recomputed before every session, so the rate follows the
 * clock: a few visitors an hour at 04:00, many at 20:00. Gaps are
 * randomised around the target so arrivals are not metronomic.
 */
async function runPaced(opts, stats, pool, deadline) {
  let hourStamp = -1;
  let hourCount = 0;

  /* This loop can be asked to stay up for six hours, which is long enough
     for a browser process to bloat or wedge. It owns its own browser and
     replaces it periodically rather than trusting one to last the night. */
  const launch = () => chromium.launch({ headless: !opts.headed });
  let browser = await launch();
  let sinceLaunch = 0;

  while (!deadline || Date.now() < deadline) {
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

    await runSession(browser, opts.baseUrl, stats, pool);
    hourCount++;
    sinceLaunch++;

    // Checkpoint, so a run that gets cut short still leaves its visitors behind
    if (stats.sessions % 20 === 0) await pool.save();

    if (sinceLaunch >= RECYCLE_AFTER) {
      await browser.close().catch(() => {});
      browser = await launch();
      sinceLaunch = 0;
      console.log('  [' + new Date().toLocaleTimeString() + '] fresh browser');
    }

    // Jitter the gap, and subtract roughly how long the visit itself took
    let gap = meanGap * (0.4 + Math.random() * 1.2) - 8000;
    // Never sleep past the deadline, or the job sits idle waiting to be killed
    if (deadline) gap = Math.min(gap, deadline - Date.now());
    if (gap > 0) await wait(gap);
  }

  await browser.close().catch(() => {});
}

/* ---------- driver ---------- */

async function main() {
  const opts = parseArgs();

  const stats = {
    sessions: 0, errors: 0, productViews: 0, addToCart: 0, viewCart: 0,
    beginCheckout: 0, addShipping: 0, purchases: 0, searches: 0,
    signUps: 0, leads: 0, promoClicks: 0, returning: 0,
    consent: { granted: 0, denied: 0 },
    byChannel: {},
    audit: opts.audit ? { pushed: {}, delivered: {} } : null
  };

  const pool = new VisitorPool(VISITORS_FILE, C.RETURNING);
  const loaded = await pool.load();

  console.log('Lumen traffic generator');
  console.log('  target   ' + opts.baseUrl);
  console.log('  known    ' + loaded.kept + ' returning visitors' +
              (loaded.found > loaded.kept
                ? ' (' + (loaded.found - loaded.kept) + ' forgotten)' : ''));
  if (opts.batchMinutes > 0) {
    const planned = sessionsThisHour(opts.daily, new Date()) * (opts.batchMinutes / 60);
    console.log('  mode     paced for the next ' + opts.batchMinutes +
                ' minutes, about ' + Math.round(planned) + ' sessions');
    console.log('  clock    ' + new Date().toString());
  }
  if (opts.forever) {
    console.log('  mode     continuous, about ' + opts.daily + ' sessions a day');
    console.log('  stop     Ctrl-C');
  } else if (opts.batchMinutes === 0) {
    console.log('  sessions ' + opts.sessions);
    console.log('  workers  ' + opts.workers);
  }
  console.log('');

  const started = Date.now();
  let queued = 0;

  if (opts.forever) {
    await runPaced(opts, stats, pool, null);
    return;
  }

  if (opts.batchMinutes > 0) {
    /* A scheduled runner wakes up and trickles visitors through the store
       for its whole slice of the day, then exits. Back to back slices look
       like one uninterrupted stream of visitors. */
    await runPaced(opts, stats, pool, started + opts.batchMinutes * 60000);
  } else {
    const browser = await chromium.launch({ headless: !opts.headed });
    async function worker(id) {
      while (queued < opts.sessions) {
        queued++;
        await runSession(browser, opts.baseUrl, stats, pool);
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
  }

  const remembered = await pool.save();

  const mins = (Date.now() - started) / 60000;
  console.log('\nDone in ' + mins.toFixed(1) + ' minutes\n');
  console.log('  sessions        ' + stats.sessions + '   (errors ' + stats.errors + ')');
  console.log('  returning       ' + stats.returning + '   (' +
              (100 * stats.returning / Math.max(stats.sessions, 1)).toFixed(1) +
              '% of sessions, ' + remembered + ' people remembered)');
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
  if (stats.audit) reportAudit(stats.audit);
  console.log('\n  by channel');
  for (const [name, n] of Object.entries(stats.byChannel).sort((a, b) => b[1] - a[1])) {
    console.log('    ' + name.padEnd(16) + n);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
