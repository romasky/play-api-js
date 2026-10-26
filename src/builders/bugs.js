/**
 * Bug reports (POST /bug-reports, auto-scored) and buggy carts.
 *
 * A report scores 100 when: ≥ 2 steps, one step names the bug's METHOD + path, expected/actual are ≥ 10 chars
 * and differ, the severity is in the bug's allowed set, and the title is ≥ 12 chars.
 */
const { choose } = require('../utils/lookup');

// bug_id → [method, catalogued path (relative to /api/v1, as in GET /buggy), one allowed severity]
const BUGS = {
  'pagination-off-by-one': ['GET',  '/buggy/items',      'low'],
  'cart-total-wrong':      ['POST', '/buggy/cart/total', 'high'],
  'timezone-shift':        ['GET',  '/buggy/schedule',   'medium'],
};

function perfectBugReport(bugId = 'cart-total-wrong', severity) {
  const [method, path, allowed] = BUGS[bugId] ?? ['GET', '/buggy', 'medium'];
  return {
    bug_id: bugId,
    title: `${method} ${path} returns a wrong result`,
    steps: ['Open the Buggy API catalog', `Call ${method} ${path} with the documented example`],
    expected: 'The documented, mathematically correct result',
    actual: 'A result that differs from the documented one',
    severity: severity || allowed,
  };
}

const without = (body, key) => { const { [key]: _, ...rest } = body; return rest; };

// every variant starts from a perfect cart-total-wrong report
const VARIANTS = {
  'zero score':                (b) => ({ ...b, title: 'bug', steps: ['do it'], expected: 'same', actual: 'same', severity: 'low' }),
  'lowercase method in steps': (b) => ({ ...b, steps: ['Open the catalog', 'call post /buggy/cart/total'] }),
  'missing bug_id':            (b) => without(b, 'bug_id'),
  'bug_id 65 chars':           (b) => ({ ...b, bug_id: 'b'.repeat(65) }),
  'missing severity':          (b) => without(b, 'severity'),
  'blocker severity':          (b) => ({ ...b, severity: 'blocker' }),
  'capitalised severity':      (b) => ({ ...b, severity: 'Medium' }),
  'blank title':               (b) => ({ ...b, title: '   ' }),
  'title 201 chars':           (b) => ({ ...b, title: 't'.repeat(201) }),
  'expected 2001 chars':       (b) => ({ ...b, expected: 'e'.repeat(2001) }),
  'no steps':                  (b) => ({ ...b, steps: [] }),
  '21 steps':                  (b) => ({ ...b, steps: Array.from({ length: 21 }, (_, i) => `step ${i}`) }),
  'a blank step':              (b) => ({ ...b, steps: ['first step', '   '] }),
  'oversized body':            (b) => ({ ...b, padding: 'x'.repeat(64 * 1024 + 1) }),
};

const bugReport = (variant) => choose(VARIANTS, variant, 'bug report variant')(perfectBugReport());

/** `10x2, 5.50x3` → two positions: price 10 × qty 2, price 5.50 × qty 3. */
function cart(spec) {
  return {
    items: spec.split(',').map((position) => {
      const [price, qty] = position.trim().split('x');
      return { price: Number(price), qty: parseInt(qty, 10) };
    }),
  };
}

const cartOf = (count) => ({ items: Array.from({ length: count }, () => ({ price: 1, qty: 1 })) });

module.exports = { perfectBugReport, bugReport, cart, cartOf };
