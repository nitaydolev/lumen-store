/* ============================================================
   Google Consent Mode v2

   This file MUST load before the GTM container, because the default
   consent state has to exist before any tag has a chance to fire.
   Load order on every page:  consent.js  ->  gtm.js
   ============================================================ */

window.dataLayer = window.dataLayer || [];

/* The consent API is addressed through gtag(), which simply pushes its
   raw arguments onto the dataLayer. GTM reads them from there. */
function gtag() { window.dataLayer.push(arguments); }

const CONSENT_KEY = 'lumen_consent';

/** Returns 'granted', 'denied', or null when the visitor has not chosen yet. */
function storedConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}

function consentState(value) {
  return {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
    functionality_storage: value,
    personalization_storage: value,
    security_storage: 'granted'   // strictly necessary, never withheld
  };
}

/* 1. Default: deny everything until the visitor says otherwise.
      wait_for_update gives the banner half a second to answer before
      tags give up and fire in their restricted, cookieless form. */
var defaults = consentState('denied');
defaults.wait_for_update = 500;
gtag('consent', 'default', defaults);

/* 2. If this visitor already answered the banner on an earlier visit,
      apply that answer immediately, before any tag evaluates. */
var saved = storedConsent();
if (saved) {
  gtag('consent', 'update', consentState(saved));
}

/** Called by the banner. Stores the answer and tells Google about it. */
function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  gtag('consent', 'update', consentState(value));
  window.dataLayer.push({
    event: 'consent_update',
    consent_choice: value === 'granted' ? 'accept_all' : 'reject_all'
  });
}
