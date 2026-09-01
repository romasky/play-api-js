/**
 * Assertions for the standard error envelope:
 * { success, error: { code, message, details, field, validation }, timestamp, request_id }
 */

const getCode      = (res) => res.data?.error?.code;
const getRequestId = (res) => res.data?.request_id;

function assertCode(res, expected) {
  const actual = getCode(res);
  if (actual !== expected) {
    throw new Error(`Expected error code '${expected}' but got '${actual}'. Body: ${JSON.stringify(res.data)}`);
  }
}

function assertHasRequestId(res) {
  const requestId = getRequestId(res);
  if (typeof requestId !== 'string' || requestId.trim() === '') {
    throw new Error(`Expected non-empty 'request_id' in error body. Body: ${JSON.stringify(res.data)}`);
  }
}

module.exports = { assertCode, assertHasRequestId };
