const { After, setDefaultTimeout, setDefinitionFunctionWrapper } = require('@cucumber/cucumber');
const { scrub } = require('../http/attach');

// Rate-limited calls are paced in the client (http/throttle.js): one /login waits up to 12.5 s, so the
// cucumber default of 5 s per step is far too short.
setDefaultTimeout(60_000);

// Failure messages are published with the report: scrub secrets (whsec_…) from EVERY step / hook error at this
// one choke point, whatever value an assertion message echoes. The wrapper keeps the arity cucumber relies on.
// Promise-transparent on purpose: an always-async wrapper would break callback-style steps.
function scrubbed(err) {
  if (err instanceof Error) {
    err.message = scrub(err.message);
    err.stack = scrub(err.stack);
  }
  return err;
}

setDefinitionFunctionWrapper((fn) => {
  const wrapped = function (...args) {
    try {
      const result = fn.apply(this, args);
      return typeof result?.then === 'function' ? result.then(undefined, (err) => { throw scrubbed(err); }) : result;
    } catch (err) {
      throw scrubbed(err);
    }
  };
  Object.defineProperty(wrapped, 'length', { value: fn.length });
  return wrapped;
});

// Deferred cleanups (LIFO), pass or fail. A failed cleanup is logged, never turns the scenario red.
After({ timeout: 120_000 }, async function () {
  while (this.cleanups.length > 0) {
    const cleanup = this.cleanups.pop();
    try {
      await cleanup();
    } catch (err) {
      console.warn(`scenario cleanup failed: ${err.message}`);
    }
  }
});
