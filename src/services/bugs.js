/**
 * /buggy/* — endpoints with INTENTIONAL, permanent bugs (off-by-one, wrong cart sum, timezone shift) — and
 * /bug-reports, the auto-scored reports against them (auth optional on POST).
 */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  catalog:   ()       => request('GET',  paths.BUGGY),
  items:     (params) => request('GET',  paths.BUGGY_ITEMS, { params }),
  cartTotal: (body)   => request('POST', paths.BUGGY_CART_TOTAL, { json: body }),
  schedule:  (params) => request('GET',  paths.BUGGY_SCHEDULE, { params }),

  submitReport: (body, headers)    => request('POST', paths.BUG_REPORTS, { json: body, headers }),
  listReports:  (headers, params)  => request('GET',  paths.BUG_REPORTS, { params, headers }),
  getReport:    (id, headers)      => request('GET',  paths.bugReport(id), { headers }),
};
