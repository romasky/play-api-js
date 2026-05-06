/**
 * Helpers for the standard error envelope:
 * { success, error: { code, message, details, field, validation }, timestamp, request_id }
 */

function getCode(res) {
  return res.data?.error?.code;
}

function getMessage(res) {
  return res.data?.error?.message;
}

function getDetails(res) {
  return res.data?.error?.details;
}

function getField(res) {
  return res.data?.error?.field;
}

function getValidation(res) {
  return res.data?.error?.validation ?? [];
}

function getRequestId(res) {
  return res.data?.request_id;
}

function assertCode(res, expected) {
  const actual = getCode(res);
  if (actual !== expected) {
    throw new Error(`Expected error code '${expected}' but got '${actual}'. Body: ${JSON.stringify(res.data)}`);
  }
}

module.exports = { getCode, getMessage, getDetails, getField, getValidation, getRequestId, assertCode };
