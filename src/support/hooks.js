const { After, setDefaultTimeout, setDefinitionFunctionWrapper } = require('@cucumber/cucumber');
const { scrub } = require('../http/attach');
const { ContractError } = require('../contracts');

// Rate-limited calls are paced in the client (http/throttle.js): one /login waits up to 12.5 s, so the
// cucumber default of 5 s per step is far too short.
setDefaultTimeout(60_000);

// Every step / hook error passes this one choke point: secrets (whsec_…) are scrubbed from it — failure messages
// are published with the report — and assertion failures are classified. The wrapper keeps cucumber's arity.
// The checks throw plain Errors and the client a ContractError: both mean "the API answered wrongly", so they are
// renamed AssertionError — Allure then reports them `failed` (product defect) instead of `broken`, which stays for
// real breakage (TypeError, network errors, an unexpected client timeout).
const isAssertion = (err) => err.constructor === Error || err instanceof ContractError;

// Promise-transparent on purpose: an always-async wrapper would break callback-style steps.
function scrubbed(err) {
  if (err instanceof Error) {
    if (isAssertion(err)) err.name = 'AssertionError';
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
