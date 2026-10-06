/* ============================================================
   Who is browsing

   Must load before the GTM container, so that user_id is already
   on the dataLayer when the Google tag fires. A user_id published
   after that tag runs is too late: the page_view and session_start
   of that page would go out unattributed.

   Load order on every page:  identity.js -> consent.js -> gtm.js
   ============================================================ */

window.dataLayer = window.dataLayer || [];

(function () {
  var user = null;
  try {
    user = JSON.parse(localStorage.getItem('lumen_user'));
  } catch (e) { /* private mode */ }

  window.dataLayer.push({
    user_id: user ? user.user_id : undefined,
    logged_in: Boolean(user)
  });
})();
