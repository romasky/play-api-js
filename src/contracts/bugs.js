/**
 * /buggy/* and /bug-reports contracts — the buggy shapes are correct; the VALUES are deliberately wrong
 * (pinned by the steps). Anonymous bug-report submissions answer 200 without report_id / expires_at.
 */
const { str, int, num, bool, object, arr, obj, entry } = require('./schema');

const BuggyCatalogResponse = obj({
  success: bool, total: int,
  bugs: arr(obj({ bug_id: str, method: str, path: str, title: str, description: str, expected: str })),
});

const BuggyItemsResponse = obj({
  success: bool, bug_id: str, page: int, per_page: int, total: int,
  items: arr(obj({ id: int, sku: str, name: str, price: num })),
});

const CartTotalResponse = obj({ success: bool, bug_id: str, items_count: int, currency: str, total: num });

const ScheduleResponse = obj({
  success: bool, bug_id: str, requested_date: str, tz: str, event_local: str, event_start: str, event_start_utc: str,
});

// `params` is present only on failed criteria
const Score = obj({
  total: int, max: int, breakdown: object,
  feedback: arr(obj({ criterion: str, ok: bool, key: str }, { params: object })),
});

const BugReportSubmitted = obj(
  { success: bool, bug_id: str, owner: str, saved: bool, created_at: str, score: Score },
  { report_id: str, expires_at: str }, // authenticated only
);

const BugReportsList = obj({ success: bool, user_id: str, total: int, returned: int, reports: arr(object) });

const BugReportDetail = obj({
  success: bool, report_id: str, bug_id: str, title: str, steps: arr(str), expected: str, actual: str,
  severity: str, score: Score, created_at: str, expires_at: str,
});

const CONTRACTS_2XX = [
  entry('GET',  '/buggy',              'BuggyCatalogResponse', BuggyCatalogResponse),
  entry('GET',  '/buggy/items',        'BuggyItemsResponse',   BuggyItemsResponse),
  entry('POST', '/buggy/cart/total',   'CartTotalResponse',    CartTotalResponse),
  entry('GET',  '/buggy/schedule',     'ScheduleResponse',     ScheduleResponse),
  entry('POST', '/bug-reports',        'BugReportSubmitted',   BugReportSubmitted),
  entry('GET',  '/bug-reports',        'BugReportsList',       BugReportsList),
  entry('GET',  '/bug-reports/[^/]+',  'BugReportDetail',      BugReportDetail),
];

module.exports = { CONTRACTS_2XX };
