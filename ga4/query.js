#!/usr/bin/env node
/* ============================================================
   Ask the Lumen Store property a question, from the terminal.

   The same numbers the reports show, without the reports. Useful
   for checking a figure quickly, for comparing two days without
   clicking through date pickers, and for looking into something
   odd without taking a screenshot of every step.

     node query.js --dimensions sessionDefaultChannelGroup \
                   --metrics sessions,keyEvents,totalRevenue \
                   --start 2026-10-08 --end 2026-10-08

   Dates accept 'today', 'yesterday' and 'NdaysAgo' as well.
   Every dimension and metric name lives at:
   developers.google.com/analytics/devguides/reporting/data/v1/api-schema
   ============================================================ */

const os = require('os');
const path = require('path');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

/* The service account's key. Kept outside the repository on purpose:
   this file is a password, and the repository is public. */
const KEY = process.env.GA4_KEY ||
  path.join(os.homedir(), '.config', 'lumen-analytics', 'key.json');

const PROPERTY = process.env.GA4_PROPERTY || '555134439';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i === -1 ? fallback : args[i + 1];
  };
  return {
    dimensions: get('--dimensions', 'sessionDefaultChannelGroup').split(','),
    metrics: get('--metrics', 'sessions').split(','),
    start: get('--start', '7daysAgo'),
    end: get('--end', 'yesterday'),
    limit: Number(get('--limit', 25)),
    orderBy: get('--order', null),     // a metric name to sort by, descending
    json: args.includes('--json')
  };
}

/** Print rows as an aligned table, numbers to the right. */
function table(headers, rows) {
  const all = [headers, ...rows];
  const width = headers.map((_, i) =>
    Math.max(...all.map((r) => String(r[i]).length))
  );
  const numeric = headers.map((_, i) =>
    rows.every((r) => r[i] !== '' && !isNaN(Number(String(r[i]).replace(/,/g, ''))))
  );

  const line = (cells) => '  ' + cells.map((c, i) =>
    numeric[i] ? String(c).padStart(width[i]) : String(c).padEnd(width[i])
  ).join('   ');

  console.log('');
  console.log(line(headers));
  console.log('  ' + width.map((w) => '-'.repeat(w)).join('   '));
  rows.forEach((r) => console.log(line(r)));
  console.log('');
}

async function main() {
  const opts = parseArgs();
  const client = new BetaAnalyticsDataClient({ keyFilename: KEY });

  const request = {
    property: 'properties/' + PROPERTY,
    dateRanges: [{ startDate: opts.start, endDate: opts.end }],
    dimensions: opts.dimensions.filter(Boolean).map((name) => ({ name })),
    metrics: opts.metrics.filter(Boolean).map((name) => ({ name })),
    limit: opts.limit
  };
  if (opts.orderBy) {
    request.orderBys = [{ desc: true, metric: { metricName: opts.orderBy } }];
  }

  const [response] = await client.runReport(request);

  if (opts.json) {
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  const headers = [
    ...response.dimensionHeaders.map((h) => h.name),
    ...response.metricHeaders.map((h) => h.name)
  ];

  const rows = (response.rows || []).map((row) => [
    ...row.dimensionValues.map((v) => v.value),
    ...row.metricValues.map((v) => {
      const n = Number(v.value);
      // Keep decimals for rates and revenue, group thousands for counts
      if (!isFinite(n)) return v.value;
      return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2);
    })
  ]);

  console.log('\n  ' + opts.start + '  to  ' + opts.end +
              '   ·   property ' + PROPERTY +
              '   ·   ' + (response.rowCount || 0) + ' rows');
  table(headers, rows);
}

main().catch((e) => {
  console.error('\n  ' + e.message + '\n');
  if (/PERMISSION_DENIED|403/.test(e.message)) {
    console.error('  The service account is not yet allowed to read this property,');
    console.error('  or the grant has not propagated. Wait a minute and try again.\n');
  }
  process.exit(1);
});
