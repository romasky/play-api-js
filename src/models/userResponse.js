/**
 * Helpers for extracting and asserting fields from user response objects.
 * All functions take an axios response and return typed values or throw on missing fields.
 */

function getId(res) {
  return res.data?.id;
}

function getEmail(res) {
  return res.data?.email;
}

function getUsername(res) {
  return res.data?.username;
}

function getAccessToken(res) {
  return res.data?.access_token;
}

function getProfile(res) {
  return res.data?.profile;
}

function getMetadata(res) {
  return res.data?.metadata;
}

function assertNoPassword(res) {
  const body = JSON.stringify(res.data);
  if (body.includes('"password"')) {
    throw new Error('Response should not contain password field');
  }
}

function assertNoAccessToken(res) {
  const body = JSON.stringify(res.data);
  if (body.includes('"access_token"')) {
    throw new Error('Response should not contain access_token field');
  }
}

module.exports = { getId, getEmail, getUsername, getAccessToken, getProfile, getMetadata, assertNoPassword, assertNoAccessToken };
