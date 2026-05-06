/**
 * Helpers for the POST /login 200 response shape.
 */

function getAccessToken(res) {
  return res.data?.access_token;
}

function getUserId(res) {
  return res.data?.user_id;
}

function getEmail(res) {
  return res.data?.email;
}

function getUsername(res) {
  return res.data?.username;
}

function getExpiresAt(res) {
  return res.data?.expires_at;
}

module.exports = { getAccessToken, getUserId, getEmail, getUsername, getExpiresAt };
