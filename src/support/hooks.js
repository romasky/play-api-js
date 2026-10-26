const { After, setDefaultTimeout } = require('@cucumber/cucumber');

// Rate-limited calls are paced in the client (http/throttle.js): one /login waits up to 12.5 s, so the
// cucumber default of 5 s per step is far too short.
setDefaultTimeout(60_000);

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
