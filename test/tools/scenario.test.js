const { test } = require('node:test');
const assert = require('node:assert/strict');
const { namePattern, scenarioCount, main } = require('../../tools/scenario');

const matches = (title, name) => new RegExp(namePattern(title)).test(name);

test('a title is matched literally, regex metacharacters included', () => {
  const title = 'An authenticated report is saved (201) with a report id and a 24 h lifetime';
  assert.ok(matches(title, title));
  assert.ok(matches('A body of 64 KiB + 1 byte returns 413', 'A body of 64 KiB + 1 byte returns 413'));
  assert.ok(!matches('a.c', 'abc'));
});

test('the whole title must match, not a prefix or a suffix', () => {
  assert.ok(!matches('Get user returns 404', 'Get user returns 404 twice'));
  assert.ok(!matches('user returns 404', 'Get user returns 404'));
});

test('an Outline title selects every row: each <placeholder> matches the value filled in', () => {
  const outline = 'Events per_page <per_page> is <behaviour> (only page is validated)';
  assert.ok(matches(outline, 'Events per_page 0 is rejected (only page is validated)'));
  assert.ok(matches(outline, 'Events per_page 101 is accepted (only page is validated)'));
  assert.ok(!matches(outline, 'Events page 0 is rejected (only page is validated)'));
});

test('the scenario count is read from the summary formatter', () => {
  assert.equal(scenarioCount('1 scenario (1 skipped)\n2 steps (2 skipped)'), 1);
  assert.equal(scenarioCount('3 scenarios (3 skipped)\n'), 3);
  assert.equal(scenarioCount('0 scenarios\n0 steps\n'), 0);
});

/** main() against a fake cucumber: `selected` scenarios on the dry run, `status` for the live run. */
function cli(argv, { selected = 1, status = 0 } = {}) {
  const calls = [];
  const cucumber = (args) => {
    calls.push(args);
    return args.includes('--dry-run') ? { stdout: `${selected} scenario${selected === 1 ? '' : 's'} (${selected} skipped)\n` } : { status };
  };
  const { log, error } = console;
  const printed = [];
  console.log = console.error = (line) => printed.push(line);
  try {
    return { code: main(argv, cucumber), calls, printed };
  } finally {
    Object.assign(console, { log, error });
  }
}

test('a matching title is dry-run first, then run live with the same escaped --name', () => {
  const { code, calls } = cli(['Get user (by id) returns 404'], { status: 1 });
  assert.equal(code, 1); // the live run's status: a red scenario fails the command
  assert.deepEqual(calls, [
    ['--dry-run', '--format', 'summary', '--name', '^Get user \\(by id\\) returns 404$'],
    ['--name', '^Get user \\(by id\\) returns 404$'],
  ]);
});

test('a title that selects nothing is refused before any live call', () => {
  const { code, calls, printed } = cli(['No such scenario'], { selected: 0 });
  assert.equal(code, 2);
  assert.equal(calls.length, 1);
  assert.match(printed[0], /no scenario matches "No such scenario"/);
});

test('--dry only counts', () => {
  const { code, calls, printed } = cli(['Events with page=<page> returns 400', '--dry'], { selected: 4 });
  assert.equal(code, 0);
  assert.equal(calls.length, 1);
  assert.equal(printed[0], '4 scenario(s) match ^Events with page=.+? returns 400$');
});

test('no title is a usage error', () => {
  assert.equal(cli([]).code, 2);
});

test('a live run killed by a signal (no exit status) fails the command', () => {
  assert.equal(cli(['Get user returns 404'], { status: null }).code, 1);
});
