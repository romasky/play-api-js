const { attachment } = require('allure-js-commons');

/**
 * The ONE way anything reaches the Allure report — which is published on GitHub Pages.
 *
 * Webhook inboxes return a `signing_secret` (`whsec_` + 32 hex, the Stripe webhook-secret shape): GitHub
 * secret scanning raises an alert for every published one, so `scrub()` masks it in every attachment,
 * step parameter and assertion message that echoes a body. Large payloads are truncated.
 *
 * `attachment()` is async in allure-js-commons v3 and MUST be awaited inside the step — otherwise it can
 * land after the step closed and break the next hook ("Cannot attach when a step/hook is not running").
 */
const SECRETS = /\bwhsec_[0-9A-Za-z]{16,}/g;
const ATTACH_LIMIT = 64 * 1024;

const scrub = (text) => String(text).replace(SECRETS, 'whsec_***');

/** A value as scrubbed JSON text, for error messages that echo a body. */
const show = (value) => scrub(typeof value === 'string' ? value : JSON.stringify(value));

async function attach(name, content, contentType = 'text/plain') {
  let text = scrub(content);
  if (text.length > ATTACH_LIMIT) text = `${text.slice(0, ATTACH_LIMIT)}\n… truncated (${text.length} chars in total)`;
  await attachment(name, text, contentType);
}

const attachJson = (name, value) => attach(name, JSON.stringify(value, null, 2), 'application/json');

module.exports = { scrub, show, attach, attachJson };
