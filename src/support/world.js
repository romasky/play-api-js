const { World, setWorldConstructor } = require('@cucumber/cucumber');
const auth = require('./auth');

const PLACEHOLDER = /\$\{(\w+)\}/g;

/**
 * Per-scenario state: Cucumber builds a fresh World for every scenario (every Outline row too),
 * so nothing leaks between scenarios. Run-wide state (the shared JWT session) lives in support/session.js.
 *
 * Gherkin steps share data through string keys. `get()` of an unknown key returns the key itself, so quoted
 * literals work without a prior `Save string` step. Consequence: pick literals that cannot collide with a key
 * (the bio is stored as `profileBio` so the literal "bio" stays usable in assertions).
 *
 * `defer(fn)` registers a teardown action (delete the inbox / file a step created); the After hook runs them
 * LIFO, pass or fail. Server-side quotas (20 webhook inboxes per IP) make this mandatory for anything a
 * scenario creates and does not delete itself.
 */
class PlayWorld extends World {
  constructor(options) {
    super(options);
    this.vars = new Map();
    this.cleanups = [];
  }

  defer(fn) {
    this.cleanups.push(fn);
  }

  save(key, value) {
    this.vars.set(key, value);
  }

  get(key, failIfMissing = false) {
    if (this.vars.has(key)) return this.vars.get(key);
    if (failIfMissing) throw new Error(`Context variable '${key}' not found`);
    return key;
  }

  /** A saved value, or undefined — for optional inputs. */
  opt(key) {
    return this.vars.get(key);
  }

  /** A context value as text; a literal (unknown key) gets its `${key}` placeholders interpolated. */
  str(key) {
    if (!this.vars.has(key) && key.includes('${')) return this.render(key);
    return String(this.get(key));
  }

  /** Interpolate `${key}` placeholders (query strings, raw bodies, headers); an unknown key fails loudly. */
  render(template) {
    return template.replace(PLACEHOLDER, (_, name) => String(this.get(name, true)));
  }

  /**
   * A step's raw query string (`${key}` placeholders interpolated) as URLSearchParams: repeated keys and
   * present-but-empty values survive (the API answers `search=` with 400, but an absent `search` with the default).
   */
  query(text) {
    return new URLSearchParams(this.render(text));
  }

  /** `Authorization: Bearer <token>` for a context token key. */
  bearer(tokenKey) {
    return auth.bearer(this.str(tokenKey));
  }

  /** A verbatim `Authorization` value from step text, `${key}` placeholders interpolated. */
  rawAuth(text) {
    return auth.raw(this.render(text));
  }

  /** A saved HTTP response (fails loudly when missing). */
  res(key) {
    const res = this.get(key, true);
    if (typeof res?.status !== 'number') throw new Error(`Context variable '${key}' is not a saved response: ${res}`);
    return res;
  }

  /** The parsed body of a saved response. */
  body(key) {
    return this.res(key).data;
  }
}

setWorldConstructor(PlayWorld);
