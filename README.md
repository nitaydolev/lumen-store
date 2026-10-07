# Lumen Store

A fictional e-commerce site, built to implement and then analyse a full
GA4 ecommerce measurement setup end to end: dataLayer, Google Tag Manager,
Consent Mode, and a synthetic traffic generator that keeps the property fed
with sessions around the clock.

**Live:** https://lumen-store-orcin.vercel.app

Lumen is not a real brand and sells nothing. No payments are taken, no real
credentials are collected, and the site is excluded from search indexing.

---

## Why this exists

GA4 and GTM are easy to read about and hard to learn without a property of
your own. Google's demo account shows you finished reports; it does not let
you decide what to measure, break it, and fix it.

So the store was built first, instrumented second, and filled with traffic
third. Everything below was a decision, not a default.

---

## Measurement plan

Seventeen events are pushed to the dataLayer. Sixteen are forwarded to GA4;
`consent_update` is kept inside GTM deliberately (see Limitations).

### Ecommerce

All twelve carry a standard GA4 `ecommerce` object and are handled by a
single generic tag.

| Event | Fires when | Notable parameters |
|---|---|---|
| `view_promotion` | A banner slide becomes visible | `promotion_id`, `creative_name`, `creative_slot` |
| `select_promotion` | The banner is clicked | same |
| `view_item_list` | A product grid renders | `item_list_id`, `item_list_name` |
| `select_item` | A product is clicked in a list | `item_list_id` identifies which list |
| `view_item` | A product page opens | `currency`, `value`, `items[]` |
| `add_to_cart` | Add to Bag, or `+` in the cart | `item_variant`, `discount` |
| `view_cart` | The cart page opens | full cart in `items[]` |
| `remove_from_cart` | Remove, or `-` in the cart | |
| `begin_checkout` | Check Out is clicked | |
| `add_shipping_info` | Shipping step submitted | `shipping_tier`, `coupon` |
| `add_payment_info` | Payment step submitted | `payment_type`, `coupon` |
| `purchase` | The confirmation page loads | `transaction_id`, `value`, `tax`, `shipping`, `coupon` |

Four product lists are tracked separately, so their contribution to revenue
can be compared: `home_featured`, `category_<id>`, `search_results`,
`pdp_recommended`, and `nav_menu_<id>` from the hover menu.

### Everything else

| Event | Fires when | Parameters |
|---|---|---|
| `view_search_results` | A search returns | `search_term`, `search_results_count` |
| `sign_up` | An account is created | `method` |
| `login` | A user signs in | `method` |
| `generate_lead` | Newsletter signup in the footer | `lead_source` |
| `consent_update` | The cookie banner is answered | `consent_choice` |

### User scope

`user_id` and `logged_in` are published to the dataLayer **before** the GTM
container loads, so the Google tag and the first `page_view` of every page
already carry them. `user_id` is a non-reversible hash of the email address;
the address itself is never sent to Google.

---

## How the data flows

```
site code  ──►  dataLayer  ──►  GTM  ──►  GA4
```

Nothing is scraped from the page. Every event is declared by the site,
which means a redesign cannot silently break tracking.

### GTM

Three tags, three triggers, four Data Layer Variables.

| Tag | Trigger | Purpose |
|---|---|---|
| `GA4 - Google Tag` | Initialization - All Pages | Loads GA4, carries `user_id` |
| `GA4 - Event - Ecommerce` | `CE - GA4 Ecommerce` | All twelve ecommerce events |
| `GA4 - Event - Other` | `CE - GA4 Other Events` | Search, login, sign up, lead |

Both event tags set **Event Name** to `{{Event}}` rather than a literal
string, so one tag serves a whole family of events. The ecommerce tag relies
on *Send Ecommerce data: Data Layer*; the other maps three Data Layer
Variables as parameters, and GTM drops the ones that are empty for a given
event.

Adding a new ecommerce event to the site needs no change in GTM at all.

### GA4

- **Key events:** `purchase`, `generate_lead`, `sign_up`
- **Custom dimensions:** `Lead Source` (event scope), `Logged In` (user scope)
- Every other parameter in use maps to a built-in dimension, because the
  official event and parameter names were used throughout rather than
  invented ones.
- Currency USD, reporting time zone Israel.

### Consent

Consent Mode v2 is set to denied by default and updated when the banner is
answered. The defaults are declared in `js/consent.js`, which loads before
the container, with `wait_for_update: 500`.

---

## Traffic generator

`traffic-generator/` drives real headless browsers through the live site, so
generated sessions travel the same path a visitor does and exercise the
actual implementation rather than bypassing it.

The behaviour model lives in `traffic-generator/config.js`:

- Six channels with their own conversion rates, carrying UTM parameters.
  Email converts several times better than paid social, on purpose.
- A weighted catalogue, so demand is concentrated rather than flat.
- A device mix, an hourly curve and a day-of-week factor, so the shape of
  the data survives a glance at "users by hour of day".
- Consent is accepted by about 86% of visitors, which leaves a realistic
  share of sessions measured without cookies.

```bash
cd traffic-generator
npm install && npx playwright install chromium

node generate.js --sessions 300 --workers 6     # one burst, as fast as it can
node generate.js --forever --daily 1200         # continuous, paced by the clock
node generate.js --batch 350 --daily 1200       # the same, with a stopwatch
```

A GitHub Actions workflow (`.github/workflows/traffic.yml`) runs the last of
these around the clock, so the store keeps receiving visitors with no machine
of mine switched on.

The timed slice matters more than it looks. A run that fires all its visits
at once and then sleeps produces a sawtooth no real store has, and makes
"users in the last 30 minutes" meaningless. So the slice sends one visitor at
a time with a randomised gap, sized from the hourly curve, until its clock
runs out. Consecutive slices read as one stream.

### Scheduling, and why it is shaped like that

The first version woke up every thirty minutes. It should have run 48 times
a day; overnight it ran once, 26 minutes late. GitHub fires scheduled
workflows on a best effort basis and a free public repository sits at the
back of that queue.

So the job was made as long as GitHub allows, just under six hours, and the
schedule left hourly. Only four firings a day need to land. The extra ones
are not wasted: the concurrency group keeps exactly one run pending, and a
pending run starts the instant the running one exits, which hands traffic
over without a gap. Each hourly firing is another chance to refill that slot,
so it would take a six hour drought to leave the store quiet.

A six hour browser session is long enough to bloat, so the paced loop closes
Chromium and launches a fresh one every 120 visits.

---

## Limitations, on purpose and otherwise

- **Consent defaults are global.** Denied everywhere, including outside the
  EEA, where it is not required. GTM's container diagnostics flags this, and
  the flag is correct. Region-scoped defaults are the next thing to add.
- **`consent_update` is not sent to GA4.** Sending an event that reports a
  refusal, to the system the refusal applies to, needs tag-level consent
  settings to be defensible. Left out rather than done carelessly.
- **Geography is meaningless.** Generated traffic originates from GitHub's
  US data centres, so every session reports one country.
- **The data is synthetic.** Any pattern found in it is a property of
  `config.js`, not of real customers. It is useful for learning the tooling
  and the reports, not for drawing conclusions.
- **No server.** Cart, accounts and consent all live in the browser. There
  is no database and no backend to speak of.

---

## Repository layout

```
index.html, product.html, ...   the eight pages
css/style.css                   all styling
js/identity.js                  publishes user_id, loads first
js/consent.js                   Consent Mode defaults
js/gtm.js                       the GTM container snippet
js/store.js                     catalogue, cart, chrome, and every event
traffic-generator/              the synthetic visitor
.github/workflows/traffic.yml   runs it every 30 minutes
```

## Running it locally

Any static file server will do:

```bash
npx live-server --port=4321 .
```

The site is plain HTML, CSS and JavaScript. There is no build step.

---

*Built as a learning project. The brand, the products and every figure in
the data are invented.*
