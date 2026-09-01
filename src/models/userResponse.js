/**
 * Assertions for the UserResponse shape returned by create / get / update / patch.
 */

const CORE_FIELDS = ['id', 'email', 'username', 'profile', 'metadata'];

/** Typed presence check for the fields every UserResponse must carry. */
function assertCoreFields(res) {
  const missing = CORE_FIELDS.filter((field) => res.data?.[field] === undefined || res.data?.[field] === null);

  if (missing.length > 0) {
    throw new Error(`User response is missing core fields [${missing.join(', ')}]. Body: ${JSON.stringify(res.data)}`);
  }
}

module.exports = { assertCoreFields };
