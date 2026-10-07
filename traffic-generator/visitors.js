/* ============================================================
   Returning visitors

   GA4 decides whether somebody is new or returning from a cookie it sets on
   their first visit. A fresh browser context carries no cookies, so a
   generator that starts clean every time builds a property in which nobody
   ever comes back: new users at 100%, an empty retention report, no
   cohorts, and no such thing as the time between first visit and purchase.

   So the generator keeps a pool of people the store has already seen. A
   share of visits are handed one of them, who then arrives carrying their
   cookies, their login, and the consent choice they made last time, which
   is what a repeat visit actually looks like.

   The pool is a file, so it outlives the process. The workflow carries that
   file between runs, so it outlives the day, which is the part that makes
   retention mean anything.
   ============================================================ */

const fs = require('fs/promises');

const DAY = 86400000;

/* GA4 closes a session after 30 minutes of inactivity. Sending the same
   person back inside that window would extend their old session rather than
   start a new one, so recent visitors are left alone. */
const COOLDOWN = 35 * 60000;

class VisitorPool {
  constructor(file, opts) {
    this.file = file;
    this.max = opts.poolMax;
    this.forgetAfter = opts.forgetAfterDays * DAY;
    this.people = [];
    this.dirty = false;
  }

  /** Read the pool left behind by previous runs. A miss is not an error. */
  async load() {
    let raw = null;
    try {
      raw = JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch (e) {
      return { found: 0, kept: 0 };          // first ever run, or no cache
    }

    const found = Array.isArray(raw.people) ? raw.people.length : 0;
    const cutoff = Date.now() - this.forgetAfter;
    this.people = (raw.people || []).filter(
      (p) => p && p.state && p.lastSeen > cutoff
    );
    return { found, kept: this.people.length };
  }

  get size() {
    return this.people.length;
  }

  /** Somebody the store has seen before, or null if nobody is available. */
  take() {
    const now = Date.now();
    const available = this.people.filter((p) => now - p.lastSeen > COOLDOWN);
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  /** A stranger. Their device is fixed from here on: one person, one phone. */
  stranger(deviceName) {
    const now = Date.now();
    return {
      device: deviceName,
      firstSeen: now,
      lastSeen: now,
      visits: 0,
      hasAccount: false,
      state: null
    };
  }

  /** Store what the browser ended the visit holding. */
  remember(person, state) {
    person.state = state;
    person.lastSeen = Date.now();
    person.visits++;
    if (!this.people.includes(person)) this.people.push(person);
    this.dirty = true;
  }

  async save() {
    if (this.dirty) {
      // Most recently active first, then truncate, so the pool is a rolling
      // population rather than an ever growing one.
      this.people.sort((a, b) => b.lastSeen - a.lastSeen);
      if (this.people.length > this.max) this.people.length = this.max;
      await fs.writeFile(this.file, JSON.stringify({ people: this.people }));
      this.dirty = false;
    }
    return this.people.length;
  }
}

/**
 * Drop a key from the localStorage a saved visitor carries.
 *
 * Used for the cart: a real shopper does not accumulate every item they ever
 * considered. Most come back to an empty bag, a few to the one they
 * abandoned, which is the interesting case to have in the data.
 */
function forget(state, key) {
  for (const origin of (state && state.origins) || []) {
    origin.localStorage = (origin.localStorage || []).filter(
      (entry) => entry.name !== key
    );
  }
  return state;
}

module.exports = { VisitorPool, forget };
