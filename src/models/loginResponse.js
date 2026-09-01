/**
 * Assertions for the POST /login 200 response shape.
 */

const REQUIRED_FIELDS = ['access_token', 'user_id', 'email', 'username', 'expires_at'];

/** success === true and every documented field present. */
function assertSuccessful(res) {
  if (res.data?.success !== true) {
    throw new Error(`Expected success=true in login response. Body: ${JSON.stringify(res.data)}`);
  }
  const missing = REQUIRED_FIELDS.filter((field) => res.data?.[field] === undefined || res.data?.[field] === null);

  if (missing.length > 0) {
    throw new Error(`Login response is missing fields [${missing.join(', ')}]. Body: ${JSON.stringify(res.data)}`);
  }
}

module.exports = { assertSuccessful };
