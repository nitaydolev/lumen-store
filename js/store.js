/* ============================================================
   Lumen Store - shared logic
   Fictional brand, built to practice GTM + GA4 ecommerce tracking.
   ============================================================ */

/* ---------- 1. Catalog ---------- */

const CURRENCY = 'USD';

const CATEGORIES = [
  { id: 'phones',      name: 'Phones' },
  { id: 'laptops',     name: 'Laptops' },
  { id: 'tablets',     name: 'Tablets' },
  { id: 'audio',       name: 'Audio' },
  { id: 'wearables',   name: 'Wearables' },
  { id: 'accessories', name: 'Accessories' }
];

/* Colour swatches reused across products */
const C = {
  graphite:  { name: 'Graphite',   hex: '#3a3a40' },
  silver:    { name: 'Silver',     hex: '#d4d4d9' },
  midnight:  { name: 'Midnight',   hex: '#1d1d2e' },
  sky:       { name: 'Sky Blue',   hex: '#9cc0e4' },
  starlight: { name: 'Starlight',  hex: '#e6ddcd' },
  deepblue:  { name: 'Deep Blue',  hex: '#2d4e7e' },
  white:     { name: 'White',      hex: '#f5f5f7' },
  spacegrey: { name: 'Space Grey', hex: '#6e6e73' },
  burgundy:  { name: 'Burgundy',   hex: '#6b2737' },
  sage:      { name: 'Sage',       hex: '#9cae9a' }
};

/* storage option sets: label + price difference from the base price */
const S = {
  phone:  [{ label: '128GB', delta: 0 }, { label: '256GB', delta: 100 }, { label: '512GB', delta: 300 }],
  phonePro: [{ label: '256GB', delta: 0 }, { label: '512GB', delta: 200 }, { label: '1TB', delta: 400 }],
  laptop: [{ label: '512GB', delta: 0 }, { label: '1TB', delta: 300 }, { label: '2TB', delta: 800 }],
  tablet: [{ label: '128GB', delta: 0 }, { label: '256GB', delta: 150 }, { label: '512GB', delta: 300 }]
};

const PRODUCTS = [
  /* ---------- Phones ---------- */
  {
    id: 'LUM-ONE', name: 'Lumen One', eyebrow: 'Phone', category: 'phones', art: 'phone',
    tagline: 'A titanium body and the brightest display we have made.',
    price: 1299, colors: [C.graphite, C.silver, C.deepblue], storage: S.phone,
    specs: [['Display', '6.3" Retina XDR'], ['Chip', 'L3 Bionic'], ['Camera', '48MP triple'], ['Battery', 'Up to 29h video'], ['Build', 'Grade 5 titanium']]
  },
  {
    id: 'LUM-ONE-PRO', name: 'Lumen One Pro', eyebrow: 'Phone', category: 'phones', art: 'phone',
    tagline: 'The most capable Lumen phone. Built for people who shoot for a living.',
    price: 1799, colors: [C.graphite, C.midnight, C.deepblue], storage: S.phonePro,
    specs: [['Display', '6.9" Retina XDR'], ['Chip', 'L3 Pro Bionic'], ['Camera', '48MP quad'], ['Battery', 'Up to 33h video'], ['Build', 'Grade 5 titanium']]
  },
  {
    id: 'LUM-ONE-MINI', name: 'Lumen One Mini', eyebrow: 'Phone', category: 'phones', art: 'phone',
    tagline: 'Everything you love, in a size that disappears in your pocket.',
    price: 999, salePrice: 879, colors: [C.starlight, C.sky, C.midnight], storage: S.phone,
    specs: [['Display', '5.8" Retina'], ['Chip', 'L3 Bionic'], ['Camera', '48MP dual'], ['Battery', 'Up to 22h video'], ['Weight', '148g']]
  },
  {
    id: 'LUM-LITE', name: 'Lumen Lite', eyebrow: 'Phone', category: 'phones', art: 'phone',
    tagline: 'The essentials, done properly, at a price that makes sense.',
    price: 749, colors: [C.midnight, C.sage, C.sky], storage: [{ label: '128GB', delta: 0 }, { label: '256GB', delta: 100 }],
    specs: [['Display', '6.1" Liquid Retina'], ['Chip', 'L2'], ['Camera', '32MP dual'], ['Battery', 'Up to 20h video'], ['Build', 'Aluminium']]
  },

  /* ---------- Laptops ---------- */
  {
    id: 'LUM-AIR-13', name: 'Lumen Air 13', eyebrow: 'Laptop', category: 'laptops', art: 'laptop',
    tagline: 'Thin, light and fanless. Power that lasts the whole day.',
    price: 1799, colors: [C.midnight, C.starlight, C.sky], storage: S.laptop,
    specs: [['Display', '13.6" Liquid Retina'], ['Chip', 'L3 Pro'], ['Memory', '16GB unified'], ['Battery', 'Up to 18h'], ['Weight', '1.24kg']]
  },
  {
    id: 'LUM-AIR-15', name: 'Lumen Air 15', eyebrow: 'Laptop', category: 'laptops', art: 'laptop',
    tagline: 'The same impossibly thin design, with room to spread out.',
    price: 2099, colors: [C.midnight, C.starlight, C.silver], storage: S.laptop,
    specs: [['Display', '15.3" Liquid Retina'], ['Chip', 'L3 Pro'], ['Memory', '16GB unified'], ['Battery', 'Up to 18h'], ['Weight', '1.51kg']]
  },
  {
    id: 'LUM-PRO-14', name: 'Lumen Pro 14', eyebrow: 'Laptop', category: 'laptops', art: 'laptop',
    tagline: 'A workstation that fits in a backpack.',
    price: 2899, salePrice: 2649, colors: [C.spacegrey, C.silver], storage: S.laptop,
    specs: [['Display', '14.2" XDR'], ['Chip', 'L3 Max'], ['Memory', '32GB unified'], ['Battery', 'Up to 22h'], ['Ports', '3x USB-C, HDMI, SD']]
  },

  /* ---------- Tablets ---------- */
  {
    id: 'LUM-TAB-11', name: 'Lumen Tab 11', eyebrow: 'Tablet', category: 'tablets', art: 'tablet',
    tagline: 'Your canvas, your desk, your screen. All in one.',
    price: 949, colors: [C.silver, C.sky, C.spacegrey], storage: S.tablet,
    specs: [['Display', '11" Liquid Retina'], ['Chip', 'L2'], ['Pen', 'Lumen Pen 2 ready'], ['Battery', 'Up to 10h'], ['Weight', '462g']]
  },
  {
    id: 'LUM-TAB-PRO', name: 'Lumen Tab Pro 13', eyebrow: 'Tablet', category: 'tablets', art: 'tablet',
    tagline: 'The thinnest product we have ever made, and the fastest.',
    price: 1499, colors: [C.spacegrey, C.silver], storage: S.tablet,
    specs: [['Display', '13" Tandem OLED'], ['Chip', 'L3 Max'], ['Pen', 'Lumen Pen Pro ready'], ['Battery', 'Up to 10h'], ['Weight', '579g']]
  },
  {
    id: 'LUM-TAB-MINI', name: 'Lumen Tab Mini', eyebrow: 'Tablet', category: 'tablets', art: 'tablet',
    tagline: 'Big ideas. One hand.',
    price: 649, colors: [C.starlight, C.midnight, C.sage], storage: [{ label: '128GB', delta: 0 }, { label: '256GB', delta: 150 }],
    specs: [['Display', '8.3" Liquid Retina'], ['Chip', 'L2'], ['Pen', 'Lumen Pen 2 ready'], ['Battery', 'Up to 10h'], ['Weight', '293g']]
  },

  /* ---------- Audio ---------- */
  {
    id: 'LUM-BUDS-PRO', name: 'Lumen Buds Pro', eyebrow: 'Audio', category: 'audio', art: 'buds',
    tagline: 'Adaptive noise cancellation that reads the room.',
    price: 299, colors: [C.white, C.midnight],
    specs: [['Audio', 'Adaptive Spatial'], ['ANC', '2x quieter'], ['Battery', '6h + 24h case'], ['Charging', 'USB-C / wireless'], ['Water', 'IPX4']]
  },
  {
    id: 'LUM-BUDS', name: 'Lumen Buds', eyebrow: 'Audio', category: 'audio', art: 'buds',
    tagline: 'All-day comfort and sound that punches far above its price.',
    price: 179, salePrice: 149, colors: [C.white],
    specs: [['Audio', 'Spatial ready'], ['ANC', 'Transparency mode'], ['Battery', '5h + 20h case'], ['Charging', 'USB-C'], ['Water', 'IPX4']]
  },
  {
    id: 'LUM-STUDIO', name: 'Lumen Studio', eyebrow: 'Audio', category: 'audio', art: 'headphones',
    tagline: 'Over-ear headphones built for long sessions.',
    price: 499, colors: [C.midnight, C.starlight, C.burgundy],
    specs: [['Audio', 'Adaptive Spatial'], ['ANC', 'Pro-grade'], ['Battery', 'Up to 60h'], ['Charging', 'USB-C'], ['Weight', '385g']]
  },

  /* ---------- Wearables ---------- */
  {
    id: 'LUM-BAND', name: 'Lumen Band', eyebrow: 'Wearable', category: 'wearables', art: 'watch',
    tagline: 'Health, fitness and focus on your wrist.',
    price: 479, colors: [C.starlight, C.midnight, C.silver],
    specs: [['Display', '42mm Always-On'], ['Sensors', 'ECG, SpO2, temp'], ['Battery', 'Up to 36h'], ['Water', '50m'], ['Bands', 'Quick-swap']]
  },
  {
    id: 'LUM-BAND-SPORT', name: 'Lumen Band Sport', eyebrow: 'Wearable', category: 'wearables', art: 'watch',
    tagline: 'Lighter, tougher, and made to get wet.',
    price: 349, colors: [C.sky, C.sage, C.midnight],
    specs: [['Display', '40mm Always-On'], ['Sensors', 'HR, SpO2'], ['Battery', 'Up to 30h'], ['Water', '50m'], ['Build', 'Recycled aluminium']]
  },
  {
    id: 'LUM-BAND-ULTRA', name: 'Lumen Band Ultra', eyebrow: 'Wearable', category: 'wearables', art: 'watch',
    tagline: 'For altitude, depth, and everything between.',
    price: 879, salePrice: 779, colors: [C.spacegrey, C.graphite],
    specs: [['Display', '49mm Always-On'], ['Sensors', 'ECG, SpO2, depth'], ['Battery', 'Up to 72h'], ['Water', '100m'], ['Build', 'Titanium']]
  },

  /* ---------- Accessories ---------- */
  {
    id: 'LUM-DOCK', name: 'Lumen Dock', eyebrow: 'Accessory', category: 'accessories', art: 'dock',
    tagline: 'One cable. Every port you actually use.',
    price: 129, colors: [C.spacegrey, C.silver],
    specs: [['Ports', '2x USB-C, 2x USB-A'], ['Video', 'HDMI 4K60'], ['Power', '85W pass-through'], ['Card', 'SD / microSD'], ['Build', 'Aluminium']]
  },
  {
    id: 'LUM-PEN', name: 'Lumen Pen 2', eyebrow: 'Accessory', category: 'accessories', art: 'pen',
    tagline: 'Pixel-perfect precision, with no lag you can feel.',
    price: 119, colors: [C.white, C.midnight],
    specs: [['Latency', 'Under 9ms'], ['Pressure', '4096 levels'], ['Charging', 'Magnetic'], ['Battery', 'Up to 12h'], ['Tilt', 'Supported']]
  },
  {
    id: 'LUM-CHARGER', name: 'Lumen Charger 40W', eyebrow: 'Accessory', category: 'accessories', art: 'charger',
    tagline: 'Small enough to forget, fast enough to notice.',
    price: 59, salePrice: 49, colors: [C.white],
    specs: [['Output', '40W dynamic'], ['Ports', '2x USB-C'], ['Cable', 'Sold separately'], ['Size', '42mm cube'], ['Safety', 'Over-current protection']]
  },
  {
    id: 'LUM-CASE', name: 'Lumen Case', eyebrow: 'Accessory', category: 'accessories', art: 'case',
    tagline: 'Woven from recycled fibre. Shaped to vanish.',
    price: 49, colors: [C.burgundy, C.midnight, C.sage, C.starlight],
    specs: [['Material', 'TechWoven recycled'], ['Magnets', 'MagLock ready'], ['Drop', '2m rated'], ['Buttons', 'Machined aluminium'], ['Care', 'Machine washable']]
  }
];

/* ---------- 2. Catalog helpers ---------- */

function getProduct(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}

function categoryName(catId) {
  var c = CATEGORIES.find(function (x) { return x.id === catId; });
  return c ? c.name : catId;
}

function productsInCategory(catId) {
  return PRODUCTS.filter(function (p) { return p.category === catId; });
}

function searchProducts(q) {
  var needle = (q || '').trim().toLowerCase();
  if (!needle) return [];
  return PRODUCTS.filter(function (p) {
    return (p.name + ' ' + p.tagline + ' ' + p.eyebrow + ' ' + categoryName(p.category)).toLowerCase().indexOf(needle) > -1;
  });
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/** Cross-sell list: others in the same category first, then accessories. */
function relatedProducts(p, n) {
  var same = productsInCategory(p.category).filter(function (x) { return x.id !== p.id; });
  var extra = productsInCategory('accessories').filter(function (x) {
    return x.id !== p.id && same.indexOf(x) === -1;
  });
  return same.concat(extra).slice(0, n || 3);
}

/* Storage choice helpers. storageLabel may be undefined for products without storage. */
function storageDelta(p, storageLabel) {
  if (!p.storage) return 0;
  var s = p.storage.find(function (x) { return x.label === storageLabel; });
  return s ? s.delta : p.storage[0].delta;
}

/** Full list price for the chosen configuration, before any discount. */
function listPrice(p, storageLabel) {
  return p.price + storageDelta(p, storageLabel);
}

/** What the customer actually pays for the chosen configuration. */
function unitPrice(p, storageLabel) {
  var base = p.salePrice || p.price;
  return base + storageDelta(p, storageLabel);
}

/** Money off per unit. 0 when the product is not on sale. */
function unitDiscount(p, storageLabel) {
  return listPrice(p, storageLabel) - unitPrice(p, storageLabel);
}

function isOnSale(p) {
  return Boolean(p.salePrice);
}

function defaultColor(p) {
  return p.colors[0].name;
}

function defaultStorage(p) {
  return p.storage ? p.storage[0].label : null;
}

function colorHex(p, colorName) {
  var c = p.colors.find(function (x) { return x.name === colorName; });
  return c ? c.hex : p.colors[0].hex;
}

/** Human readable variant, e.g. "Graphite / 256GB" or just "Graphite". */
function variantLabel(color, storage) {
  return storage ? color + ' / ' + storage : color;
}

/* ---------- 3. Product artwork (inline SVG, tinted by colour) ---------- */

/* A soft outline so light-coloured products stay visible on a light background.
   On dark products the stroke is effectively invisible, so it is applied to all. */
const EDGE = ' stroke="rgba(0,0,0,0.18)" stroke-width="2"';

const ART = {
  phone: function (c) {
    return '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="6" y="4" width="108" height="192" rx="22" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="12" y="10" width="96" height="180" rx="17" fill="#0b0b0d"/>' +
      '<rect x="18" y="16" width="84" height="168" rx="13" fill="#15151a"/>' +
      '<rect x="46" y="20" width="28" height="7" rx="3.5" fill="#000"/>' +
      '<circle cx="34" cy="44" r="10" fill="#26262c"/><circle cx="34" cy="68" r="10" fill="#26262c"/></svg>';
  },
  laptop: function (c) {
    return '<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="34" y="10" width="172" height="112" rx="8" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="41" y="17" width="158" height="98" rx="4" fill="#0e0e12"/>' +
      '<path d="M8 126h224l-10 14H18z" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="100" y="129" width="40" height="4" rx="2" fill="rgba(0,0,0,0.25)"/></svg>';
  },
  tablet: function (c) {
    return '<svg viewBox="0 0 160 210" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="6" y="6" width="148" height="198" rx="16" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="13" y="13" width="134" height="184" rx="11" fill="#0e0e12"/>' +
      '<rect x="20" y="20" width="120" height="170" rx="8" fill="#191920"/></svg>';
  },
  buds: function (c) {
    return '<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="62" y="30" width="76" height="80" rx="20" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<rect x="96" y="30" width="8" height="80" fill="rgba(0,0,0,0.08)"/>' +
      '<circle cx="40" cy="46" r="17" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<rect x="34" y="58" width="12" height="40" rx="6" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<circle cx="160" cy="46" r="17" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<rect x="154" y="58" width="12" height="40" rx="6" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/></svg>';
  },
  headphones: function (c) {
    return '<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M40 100V88a60 60 0 0 1 120 0v12" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="19" stroke-linecap="round"/>' +
      '<path d="M40 100V88a60 60 0 0 1 120 0v12" fill="none" stroke="' + c + '" stroke-width="16" stroke-linecap="round"/>' +
      '<rect x="22" y="92" width="38" height="62" rx="18" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="140" y="92" width="38" height="62" rx="18" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="30" y="100" width="22" height="46" rx="11" fill="rgba(0,0,0,0.22)"/>' +
      '<rect x="148" y="100" width="22" height="46" rx="11" fill="rgba(0,0,0,0.22)"/></svg>';
  },
  watch: function (c) {
    return '<svg viewBox="0 0 130 200" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M40 6h50v46H40z" fill="' + c + '" opacity="0.65"' + EDGE + '/>' +
      '<path d="M40 148h50v46H40z" fill="' + c + '" opacity="0.65"' + EDGE + '/>' +
      '<rect x="24" y="44" width="82" height="112" rx="26" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="31" y="51" width="68" height="98" rx="21" fill="#0b0b0d"/>' +
      '<rect x="45" y="72" width="40" height="8" rx="4" fill="#2b2b33"/>' +
      '<rect x="45" y="88" width="30" height="8" rx="4" fill="#2b2b33"/>' +
      '<rect x="106" y="80" width="6" height="18" rx="3" fill="rgba(0,0,0,0.3)"/></svg>';
  },
  dock: function (c) {
    return '<svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="14" y="30" width="192" height="50" rx="12" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="14" y="30" width="192" height="24" rx="12" fill="rgba(255,255,255,0.18)"/>' +
      '<rect x="36" y="56" width="26" height="12" rx="3" fill="#2b2b33"/>' +
      '<rect x="74" y="56" width="26" height="12" rx="3" fill="#2b2b33"/>' +
      '<rect x="112" y="58" width="20" height="8" rx="4" fill="#2b2b33"/>' +
      '<rect x="144" y="58" width="20" height="8" rx="4" fill="#2b2b33"/>' +
      '<circle cx="188" cy="62" r="5" fill="#34c759"/></svg>';
  },
  pen: function (c) {
    return '<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="24" y="32" width="150" height="16" rx="8" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<path d="M24 32L8 40l16 8z" fill="#3a3a40"/>' +
      '<rect x="120" y="32" width="3" height="16" fill="rgba(0,0,0,0.15)"/></svg>';
  },
  charger: function (c) {
    return '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="24" y="28" width="92" height="92" rx="20" fill="' + c + '" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>' +
      '<rect x="46" y="96" width="20" height="8" rx="4" fill="#2b2b33"/>' +
      '<rect x="76" y="96" width="20" height="8" rx="4" fill="#2b2b33"/>' +
      '<rect x="56" y="6" width="7" height="24" rx="2" fill="#9a9aa1"/>' +
      '<rect x="78" y="6" width="7" height="24" rx="2" fill="#9a9aa1"/></svg>';
  },
  case: function (c) {
    return '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="6" y="4" width="108" height="192" rx="24" fill="' + c + '"' + EDGE + '/>' +
      '<rect x="16" y="14" width="88" height="172" rx="18" fill="rgba(0,0,0,0.14)"/>' +
      '<rect x="22" y="22" width="52" height="52" rx="16" fill="rgba(0,0,0,0.25)"/>' +
      '<circle cx="60" cy="130" r="22" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3"/></svg>';
  }
};

function artFor(product, colorName) {
  var draw = ART[product.art];
  if (!draw) return '';
  return draw(colorHex(product, colorName || defaultColor(product)));
}

/* ---------- 4. Cart (localStorage) ---------- */

const CART_KEY = 'lumen_cart';

/** A cart line is identified by product + colour + storage. */
function lineKey(id, color, storage) {
  return id + '|' + color + '|' + (storage || '');
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function writeCart(rows) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(rows));
  } catch (e) { /* private mode */ }
  paintCartCount();
}

function addToCart(id, color, storage, qty) {
  var rows = readCart();
  var key = lineKey(id, color, storage);
  var row = rows.find(function (r) { return lineKey(r.id, r.color, r.storage) === key; });
  if (row) { row.qty += qty || 1; } else { rows.push({ id: id, color: color, storage: storage, qty: qty || 1 }); }
  writeCart(rows);
}

function setLineQty(key, qty) {
  var rows = readCart();
  if (qty <= 0) {
    rows = rows.filter(function (r) { return lineKey(r.id, r.color, r.storage) !== key; });
  } else {
    var row = rows.find(function (r) { return lineKey(r.id, r.color, r.storage) === key; });
    if (row) row.qty = qty;
  }
  writeCart(rows);
}

function cartTotal(rows) {
  return rows.reduce(function (sum, r) {
    var p = getProduct(r.id);
    return p ? sum + unitPrice(p, r.storage) * r.qty : sum;
  }, 0);
}

function cartCount(rows) {
  return rows.reduce(function (sum, r) { return sum + r.qty; }, 0);
}

function clearCart() {
  writeCart([]);
}

function paintCartCount() {
  var el = document.querySelector('[data-cart-count]');
  if (!el) return;
  var n = cartCount(readCart());
  el.textContent = n;
  el.hidden = n === 0;
}

/* ---------- 4b. Promotions and coupons ---------- */

const PROMOS = [
  {
    promotion_id: 'PROMO_TRADE_IN',
    promotion_name: 'Trade in and save',
    creative_name: 'banner_trade_in',
    headline: 'Trade in your old phone and get up to $250 off a Lumen One.',
    cta: 'Shop phones',
    href: 'category.html?cat=phones'
  },
  {
    promotion_id: 'PROMO_AUDIO_SALE',
    promotion_name: 'Audio week',
    creative_name: 'banner_audio_week',
    headline: 'Audio week. Lumen Buds now $149, this week only.',
    cta: 'Shop audio',
    href: 'product.html?id=LUM-BUDS'
  },
  {
    promotion_id: 'PROMO_FREE_DELIVERY',
    promotion_name: 'Free delivery',
    creative_name: 'banner_free_delivery',
    headline: 'Free delivery on every order. Always.',
    cta: 'Shop the store',
    href: 'index.html#store'
  }
];

/* Coupon codes the fake checkout accepts. */
const COUPONS = {
  LUMEN10:   { code: 'LUMEN10',   type: 'percent', amount: 10, label: '10% off your order' },
  WELCOME50: { code: 'WELCOME50', type: 'fixed',   amount: 15, label: '$15 off your order' },
  FREESHIP:  { code: 'FREESHIP',  type: 'shipping', amount: 0, label: 'Free express delivery' }
};

function findCoupon(code) {
  return COUPONS[(code || '').trim().toUpperCase()] || null;
}

/* ---------- 4c. Fake accounts (localStorage, no passwords stored) ---------- */

const USER_KEY = 'lumen_user';

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (e) {
    return null;
  }
}

/** Stable, non-reversible id derived from the email, so it survives logout. */
function userIdFor(email) {
  var h = 0, s = email.trim().toLowerCase();
  for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return 'U-' + h.toString(36).toUpperCase();
}

function signIn(email, name) {
  var user = { user_id: userIdFor(email), email: email.trim().toLowerCase(), name: name || email.split('@')[0] };
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch (e) {}
  return user;
}

function signOut() {
  try { localStorage.removeItem(USER_KEY); } catch (e) {}
}

/* ---------- 5. dataLayer helpers (GA4 ecommerce schema) ---------- */

window.dataLayer = window.dataLayer || [];

/* Who is browsing is published by js/identity.js, which loads in the <head>
   before GTM. Doing it here would be too late for the Google tag. */

/**
 * Builds a GA4 ecommerce "item" object.
 * opts: { color, storage, qty, index, listId, listName }
 */
function toItem(product, opts) {
  opts = opts || {};
  var color = opts.color || defaultColor(product);
  var storage = 'storage' in opts ? opts.storage : defaultStorage(product);

  var item = {
    item_id: product.id,
    item_name: product.name,
    item_brand: 'Lumen',
    item_category: categoryName(product.category),
    item_variant: variantLabel(color, storage),
    price: listPrice(product, storage),
    quantity: opts.qty || 1
  };

  var disc = unitDiscount(product, storage);
  if (disc > 0) item.discount = disc;
  if (typeof opts.index === 'number') item.index = opts.index;
  if (opts.listId) { item.item_list_id = opts.listId; item.item_list_name = opts.listName; }

  return item;
}

/** Turns a saved cart row into a GA4 item. */
function cartRowToItem(row, index) {
  return toItem(getProduct(row.id), { color: row.color, storage: row.storage, qty: row.qty, index: index });
}

/** Money value of a list of GA4 items, after discounts. */
function itemsValue(items) {
  return items.reduce(function (sum, i) {
    return sum + (i.price - (i.discount || 0)) * i.quantity;
  }, 0);
}

/**
 * Pushes a GA4 ecommerce event. Clears the previous ecommerce object first,
 * which is the pattern Google recommends so values do not leak between events.
 */
function pushEcommerce(eventName, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
}

/* ---------- 6. Shared page chrome (nav + footer) ---------- */

function renderChrome() {
  var u = currentUser();
  var nav = document.getElementById('site-nav');
  if (nav) {
    nav.innerHTML =
      '<nav class="nav">' +
        '<div class="nav-inner">' +
          '<a class="nav-logo" href="index.html">Lumen</a>' +
          CATEGORIES.map(function (c) {
            return '<a class="nav-link" href="category.html?cat=' + c.id + '" data-cat="' + c.id + '">' + c.name + '</a>';
          }).join('') +
          '<span class="nav-spacer"></span>' +
          '<form class="nav-search" action="search.html" method="get" role="search">' +
            '<input type="search" name="q" placeholder="Search" aria-label="Search the store">' +
          '</form>' +
          '<a class="account-link" href="account.html">' + (u ? u.name : 'Sign In') + '</a>' +
          '<a class="cart-link" href="cart.html">Bag<span class="cart-count" data-cart-count hidden>0</span></a>' +
        '</div>' +
        '<div class="mega" id="mega" hidden></div>' +
      '</nav>';
    wireMegaMenu(nav);
  }

  var foot = document.getElementById('site-footer');
  if (foot) {
    foot.innerHTML =
      '<footer class="footer">' +
        '<div class="wrap newsletter">' +
          '<div>' +
            '<strong>Stay in the loop.</strong>' +
            '<p>New products and offers, about once a month.</p>' +
          '</div>' +
          '<form id="newsletter-form">' +
            '<input type="email" name="email" placeholder="your@email.com" required aria-label="Email address">' +
            '<button class="btn" type="submit">Sign Up</button>' +
          '</form>' +
          '<p class="newsletter-done" id="newsletter-done" hidden>Thanks. You are on the list.</p>' +
        '</div>' +
        '<div class="wrap foot-legal">' +
          '<span>Lumen is a fictional brand built for analytics practice.</span>' +
          '<span><a href="#" id="cookie-settings">Cookie settings</a> &middot; Copyright 2026 Lumen</span>' +
        '</div>' +
      '</footer>';
    wireNewsletter(foot);

    var cookieLink = foot.querySelector('#cookie-settings');
    if (cookieLink) {
      cookieLink.addEventListener('click', function (e) {
        e.preventDefault();
        renderConsentBanner(true);
      });
    }
  }

  paintCartCount();
  renderConsentBanner();
}

/**
 * Cookie banner. The consent defaults themselves live in consent.js, which
 * loads before GTM; this is only the part the visitor sees.
 */
function renderConsentBanner(force) {
  if (!force && typeof storedConsent === 'function' && storedConsent()) return;

  var old = document.getElementById('consent-banner');
  if (old) old.remove();

  var el = document.createElement('div');
  el.className = 'consent';
  el.id = 'consent-banner';
  el.innerHTML =
    '<div class="consent-inner">' +
      '<div class="consent-text">' +
        '<strong>We use cookies</strong>' +
        '<p>Some are needed to run the store. Others help us understand how the store is used. You choose.</p>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button class="btn btn-ghost" data-consent="denied">Reject All</button>' +
        '<button class="btn" data-consent="granted">Accept All</button>' +
      '</div>' +
    '</div>';

  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-consent]');
    if (!b) return;
    setConsent(b.dataset.consent);
    el.remove();
  });

  document.body.appendChild(el);
}

/** Footer newsletter form. Sends the GA4 recommended event generate_lead. */
function wireNewsletter(root) {
  var form = root.querySelector('#newsletter-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    window.dataLayer.push({
      event: 'generate_lead',
      lead_source: 'footer_newsletter',
      currency: CURRENCY,
      value: 0
    });
    form.hidden = true;
    root.querySelector('#newsletter-done').hidden = false;
  });
}

/**
 * Rotating promotion banner.
 * view_promotion fires once per promotion per page load, not on every rotation,
 * so a banner looping for five minutes does not inflate the impression count.
 */
function renderPromoBanner(el) {
  var i = 0;
  var seen = {};

  function show(n) {
    i = (n + PROMOS.length) % PROMOS.length;
    var p = PROMOS[i];

    el.innerHTML =
      '<div class="promo-inner">' +
        '<button class="promo-nav" data-dir="-1" aria-label="Previous offer">&#8249;</button>' +
        '<a class="promo-body" href="' + p.href + '" data-promo="' + p.promotion_id + '">' +
          '<span class="promo-text">' + p.headline + '</span>' +
          '<span class="promo-cta">' + p.cta + ' &#8250;</span>' +
        '</a>' +
        '<button class="promo-nav" data-dir="1" aria-label="Next offer">&#8250;</button>' +
      '</div>' +
      '<div class="promo-dots">' + PROMOS.map(function (x, k) {
        return '<span class="' + (k === i ? 'is-on' : '') + '"></span>';
      }).join('') + '</div>';

    // GA4: view_promotion, deduplicated per page load
    if (!seen[p.promotion_id]) {
      seen[p.promotion_id] = true;
      pushEcommerce('view_promotion', {
        promotion_id: p.promotion_id,
        promotion_name: p.promotion_name,
        creative_name: p.creative_name,
        creative_slot: 'home_top_banner'
      });
    }
  }

  el.addEventListener('click', function (e) {
    var nav = e.target.closest('.promo-nav');
    if (nav) { clearInterval(timer); show(i + Number(nav.dataset.dir)); return; }

    var body = e.target.closest('.promo-body');
    if (!body) return;
    var p = PROMOS.find(function (x) { return x.promotion_id === body.dataset.promo; });

    // GA4: select_promotion
    pushEcommerce('select_promotion', {
      promotion_id: p.promotion_id,
      promotion_name: p.promotion_name,
      creative_name: p.creative_name,
      creative_slot: 'home_top_banner'
    });
  });

  show(0);
  var timer = setInterval(function () { show(i + 1); }, 6000);
}

/**
 * Hover menu under the category links.
 * Deliberately does NOT send view_item_list: a mouse crossing the nav is not
 * a product impression, and firing on hover would flood the reports.
 * Clicking a product in the menu does send select_item, with its own list id.
 */
function wireMegaMenu(root) {
  var mega = root.querySelector('#mega');
  var openCat = null;
  var closeTimer = null;

  function open(catId) {
    clearTimeout(closeTimer);
    if (openCat === catId) return;
    openCat = catId;

    var listId = 'nav_menu_' + catId;
    var listName = 'Nav Menu - ' + categoryName(catId);

    mega.innerHTML =
      '<div class="mega-inner">' +
        '<div class="mega-title">' + categoryName(catId) + '</div>' +
        '<div class="mega-items">' +
          productsInCategory(catId).map(function (p, i) {
            var sale = isOnSale(p);
            return '<a class="mega-item" href="product.html?id=' + p.id + '" data-id="' + p.id + '" data-index="' + i + '">' +
              '<span class="mega-art">' + artFor(p) + '</span>' +
              '<span class="mega-name">' + p.name +
                (sale ? '<span class="mega-tag">Sale</span>' : '') +
                '<span class="mega-price">' +
                  (sale ? '<s>' + money(p.price) + '</s> <strong>' + money(p.salePrice) + '</strong>'
                        : 'From ' + money(p.price)) +
                '</span>' +
              '</span>' +
            '</a>';
          }).join('') +
        '</div>' +
        '<a class="mega-all" href="category.html?cat=' + catId + '">View all ' + categoryName(catId) + '</a>' +
      '</div>';

    mega.dataset.listId = listId;
    mega.dataset.listName = listName;
    mega.hidden = false;
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      mega.hidden = true;
      openCat = null;
    }, 180);
  }

  root.querySelectorAll('.nav-link[data-cat]').forEach(function (link) {
    link.addEventListener('mouseenter', function () { open(link.dataset.cat); });
    link.addEventListener('focus', function () { open(link.dataset.cat); });
    link.addEventListener('mouseleave', scheduleClose);
  });

  mega.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
  mega.addEventListener('mouseleave', scheduleClose);
  root.addEventListener('mouseleave', scheduleClose);

  // GA4: select_item from the nav menu
  mega.addEventListener('click', function (e) {
    var a = e.target.closest('.mega-item');
    if (!a) return;
    pushEcommerce('select_item', {
      item_list_id: mega.dataset.listId,
      item_list_name: mega.dataset.listName,
      items: [toItem(getProduct(a.dataset.id), {
        index: Number(a.dataset.index),
        listId: mega.dataset.listId,
        listName: mega.dataset.listName
      })]
    });
  });
}

/** Renders a grid of product cards and returns the matching GA4 items. */
function renderProductGrid(container, products, listId, listName) {
  container.innerHTML = products.map(function (p, i) {
    var sale = isOnSale(p);
    return '<a class="card" href="product.html?id=' + p.id + '" data-id="' + p.id + '" data-index="' + i + '">' +
      (sale ? '<span class="badge">Sale</span>' : '') +
      '<div class="art">' + artFor(p) + '</div>' +
      '<div class="eyebrow">' + p.eyebrow + '</div>' +
      '<h3>' + p.name + '</h3>' +
      '<div class="tagline">' + p.tagline + '</div>' +
      '<div class="price">' +
        (sale ? '<s>' + money(p.price) + '</s> <strong>' + money(p.salePrice) + '</strong>'
              : 'From ' + money(p.price)) +
      '</div>' +
    '</a>';
  }).join('');

  var items = products.map(function (p, i) {
    return toItem(p, { index: i, listId: listId, listName: listName });
  });

  // GA4: select_item, when a card in this grid is clicked
  container.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card) return;
    pushEcommerce('select_item', {
      item_list_id: listId,
      item_list_name: listName,
      items: [toItem(getProduct(card.dataset.id), { index: Number(card.dataset.index), listId: listId, listName: listName })]
    });
  });

  return items;
}

renderChrome();
