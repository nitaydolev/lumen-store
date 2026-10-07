/* ============================================================
   Traffic generator - behaviour model

   Everything that decides "what kind of visitor is this" lives here,
   so the shape of the data can be changed without touching the driver.
   ============================================================ */

/* ---------- Traffic sources ----------
   weight     = share of all sessions
   addToCart  = chance this visitor puts something in the bag
   checkout   = chance of starting checkout, given they added to the bag
   purchase   = chance of completing, given they started checkout

   The three multiply out to the channel's conversion rate. Email is set
   far above paid social on purpose: an existing customer who clicked a
   newsletter is not the same person as a cold click on an ad.
*/
const CHANNELS = [
  {
    name: 'Organic Search',
    weight: 0.34,
    utm: { utm_source: 'google', utm_medium: 'organic' },
    addToCart: 0.26, checkout: 0.42, purchase: 0.33
  },
  {
    name: 'Direct',
    weight: 0.20,
    utm: null,
    addToCart: 0.30, checkout: 0.48, purchase: 0.38
  },
  {
    name: 'Paid Search',
    weight: 0.15,
    utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'brand_always_on' },
    addToCart: 0.28, checkout: 0.44, purchase: 0.34
  },
  {
    name: 'Paid Social',
    weight: 0.16,
    utm: { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'autumn_prospecting' },
    addToCart: 0.17, checkout: 0.26, purchase: 0.21
  },
  {
    name: 'Email',
    weight: 0.10,
    utm: { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'october_offers' },
    addToCart: 0.44, checkout: 0.62, purchase: 0.52
  },
  {
    name: 'Referral',
    weight: 0.05,
    utm: { utm_source: 'techreview.example', utm_medium: 'referral' },
    addToCart: 0.22, checkout: 0.38, purchase: 0.28
  }
];

/* ---------- Returning visitors ----------
   Somebody who has been here before does not behave like a stranger, and
   the difference is most of what makes a returning user worth reporting on.
*/
const RETURNING = {
  share: 0.35,            // of all sessions, once there are people to send
  poolMax: 800,           // visitors remembered at any one time
  forgetAfterDays: 45,    // not back in this long, dropped from the pool
  keepCart: 0.25,         // the rest come back to an empty bag

  /* Nobody clicks a prospecting ad for a shop they already bought from.
     They type the name, search for it, or follow the newsletter they
     subscribed to. These are shares of returning sessions, not of all. */
  channelWeights: {
    'Direct': 0.40,
    'Organic Search': 0.27,
    'Email': 0.22,
    'Paid Search': 0.06,
    'Referral': 0.04,
    'Paid Social': 0.01
  },

  /* Coming back means knowing what you want. Multiplies the channel's own
     add to cart, checkout and purchase rates. */
  conversionLift: 1.35
};

/* ---------- Where the visitor lands ---------- */
const LANDING = [
  { kind: 'home',     weight: 0.44 },
  { kind: 'category', weight: 0.28 },
  { kind: 'product',  weight: 0.22 },
  { kind: 'search',   weight: 0.06 }
];

/* ---------- Device mix ---------- */
const DEVICES = [
  { name: 'Desktop Chrome', weight: 0.58 },
  { name: 'iPhone 13',      weight: 0.30 },
  { name: 'Pixel 5',        weight: 0.12 }
];

/* ---------- Catalogue, mirrored from the store ----------
   Weighted, because real catalogues are never flat: a handful of
   products carry most of the demand and the long tail barely moves.
*/
const PRODUCTS = [
  { id: 'LUM-ONE',         weight: 16 },
  { id: 'LUM-ONE-PRO',     weight: 14 },
  { id: 'LUM-ONE-MINI',    weight: 9 },
  { id: 'LUM-LITE',        weight: 7 },
  { id: 'LUM-AIR-13',      weight: 9 },
  { id: 'LUM-AIR-15',      weight: 5 },
  { id: 'LUM-PRO-14',      weight: 4 },
  { id: 'LUM-TAB-11',      weight: 6 },
  { id: 'LUM-TAB-PRO',     weight: 3 },
  { id: 'LUM-TAB-MINI',    weight: 3 },
  { id: 'LUM-BUDS-PRO',    weight: 11 },
  { id: 'LUM-BUDS',        weight: 8 },
  { id: 'LUM-STUDIO',      weight: 4 },
  { id: 'LUM-BAND',        weight: 7 },
  { id: 'LUM-BAND-SPORT',  weight: 4 },
  { id: 'LUM-BAND-ULTRA',  weight: 3 },
  { id: 'LUM-DOCK',        weight: 5 },
  { id: 'LUM-PEN',         weight: 4 },
  { id: 'LUM-CHARGER',     weight: 6 },
  { id: 'LUM-CASE',        weight: 6 }
];

const CATEGORIES = ['phones', 'laptops', 'tablets', 'audio', 'wearables', 'accessories'];

const SEARCH_TERMS = [
  'band', 'buds', 'laptop', 'case', 'charger', 'pro', 'tablet',
  'air', 'watch', 'phone', 'dock', 'pen', 'headphones', 'usb c',
  'cheap phone', 'best laptop', 'refurbished', 'xyz'   // the last ones return nothing, on purpose
];

const COUPONS = ['LUMEN10', 'WELCOME50', 'FREESHIP', 'SAVE20'];  // SAVE20 is invalid, on purpose

/* ---------- When people shop ----------
   Share of a day's traffic by hour, local time. Quiet overnight, a
   morning climb, a plateau through the working day and the real peak
   in the evening. Without this the data has no shape, and "users by
   hour of day" is the first report that gives a store away as fake.
*/
const HOURLY = [
  1.5, 1.0, 0.7, 0.5, 0.5, 0.8,   // 00 - 05
  1.5, 2.5, 3.5, 4.5, 5.5, 6.0,   // 06 - 11
  6.0, 5.5, 5.5, 5.5, 5.5, 6.0,   // 12 - 17
  6.5, 7.5, 8.0, 7.0, 5.0, 3.0    // 18 - 23
];

/* Day of week factor, Sunday first. Retail softens over the weekend. */
const DAY_OF_WEEK = [0.90, 1.05, 1.05, 1.00, 1.00, 0.95, 0.85];

/* ---------- Rates that are not channel specific ---------- */
const RATES = {
  acceptCookies: 0.86,   // the rest reject, which is what real consent data looks like
  signUp: 0.05,          // creates an account, so the session carries a user_id
  newsletter: 0.07,      // subscribes in the footer
  searchDuringVisit: 0.18,
  useCoupon: 0.34,       // of those who reach checkout
  expressShipping: 0.22,
  viewPromotion: 0.5,    // clicks the top banner
  extraProductViews: [0, 1, 1, 2, 2, 3, 4]   // how many more products before deciding
};

module.exports = {
  CHANNELS, LANDING, DEVICES, PRODUCTS, CATEGORIES,
  SEARCH_TERMS, COUPONS, RATES, HOURLY, DAY_OF_WEEK, RETURNING
};
