/**
 * Loaded with `--require` (through NODE_OPTIONS, so `node --test` children get it too) by tools/mutate.js: when
 * UB_MUTANT names a mutant, the one file it targets is compiled with the mutant spliced in. The file on disk is
 * never touched — a crash mid-run cannot leave a mutated tree behind.
 */
const fs = require('fs');
const Module = require('module');

/** The source with the mutant's [start, end) range replaced. */
const apply = (source, { start, end, replacement }) => source.slice(0, start) + replacement + source.slice(end);

if (process.env.UB_MUTANT) {
  const mutant = JSON.parse(process.env.UB_MUTANT);
  const compile = Module.prototype._compile;
  Module.prototype._compile = function (content, filename) {
    if (filename !== mutant.file) return compile.call(this, content, filename);
    fs.writeFileSync(mutant.mark, ''); // proof for tools/mutate.js that the mutant reached the file
    return compile.call(this, apply(content, mutant), filename);
  };
}

module.exports = { apply };
