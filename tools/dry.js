#!/usr/bin/env node
/**
 * Duplication gate — pairs of functions with the same structure.
 *
 * Each function is reduced to its shape: the token stream with every identifier `ID` and every literal `LIT`, so a
 * copy with renamed variables and other strings is identical. Similarity is the Dice coefficient of the two shapes'
 * 5-token shingles. Functions under --min-tokens are ignored (one-line service wrappers are a table, not a copy).
 * Fails on a pair at or above --threshold beyond quality/dry-baseline.json (tools/lib/baseline.js).
 *
 *   node tools/dry.js                      # gate (threshold 0.8, min 60 tokens)
 *   node tools/dry.js --update             # shrink the baseline (refused while anything is new or worse)
 *   node tools/dry.js --update --accept    # record today's pairs — say why in the commit
 */
const path = require('path');
const acorn = require('acorn');
const { ROOT } = require('./spec');
const { allFunctions } = require('./lib/functions');
const { gate } = require('./lib/baseline');
const { option, flag } = require('./lib/args');

const BASELINE = path.join(ROOT, 'quality', 'dry-baseline.json');
const SHINGLE = 5;
const ABSTRACT = { name: 'ID', privateId: 'ID', string: 'LIT', num: 'LIT', regexp: 'LIT', template: 'LIT', bigint: 'LIT' };

/** The function's tokens, identifiers and literals abstracted. */
const shape = (source, node) => [...acorn.tokenizer(source.slice(node.start, node.end), { ecmaVersion: 'latest' })]
  .map(({ type }) => ABSTRACT[type.label] ?? type.label);

/** shingle → count */
function shingles(tokens) {
  const counts = new Map();
  for (let i = 0; i + SHINGLE <= tokens.length; i += 1) {
    const key = tokens.slice(i, i + SHINGLE).join(' ');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

const size = (counts) => [...counts.values()].reduce((sum, n) => sum + n, 0);

/** Dice coefficient of two shingle multisets: 1 = same shape, 0 = nothing in common. */
function dice(a, b) {
  let common = 0;
  for (const [key, n] of a) common += Math.min(n, b.get(key) ?? 0);
  return (2 * common) / (size(a) + size(b));
}

const similarity = (a, b) => dice(shingles(a), shingles(b));

/** One function nested in the other is not a copy of it. */
const nested = (a, b) => a.file === b.file && a.start <= b.start && b.end <= a.end;

/** Pairs with similarity ≥ threshold as { key: 'a ~ b', similarity }, most similar first. */
function duplicates(units, { threshold, minTokens }) {
  const big = units.filter((u) => u.tokens.length >= minTokens)
    .map((u) => ({ ...u, id: `${u.file}::${u.name}`, shingles: shingles(u.tokens) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const pairs = [];
  big.forEach((a, i) => big.slice(i + 1).forEach((b) => {
    if (nested(a, b) || nested(b, a)) return;
    const score = Math.round(dice(a.shingles, b.shingles) * 100) / 100;
    if (score >= threshold) pairs.push({ key: `${a.id} ~ ${b.id}`, similarity: score });
  }));
  return pairs.sort((a, b) => b.similarity - a.similarity); // stable: equal scores keep their key order
}

function main(argv) {
  const options = { threshold: option(argv, '--threshold', 0.8, Number), minTokens: option(argv, '--min-tokens', 60, Number) };
  const units = allFunctions().map((fn) => ({ ...fn, tokens: shape(fn.source, fn.node) }));
  const pairs = duplicates(units, options);
  console.log(`similarity ≥ ${options.threshold} (functions of ${options.minTokens}+ tokens): ${pairs.length} pair(s)`);
  for (const pair of pairs) console.log(`${pair.similarity.toFixed(2)}  ${pair.key}`);
  return gate(BASELINE, Object.fromEntries(pairs.map((pair) => [pair.key, pair.similarity])), { update: flag(argv, '--update'), accept: flag(argv, '--accept') });
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { shape, similarity, duplicates };
