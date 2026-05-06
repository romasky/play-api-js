/**
 * Helpers for GET /users/list response shape.
 */

function getUsers(res) {
  return res.data?.users ?? [];
}

function getPage(res) {
  return res.data?.page;
}

function getPerPage(res) {
  return res.data?.per_page;
}

function getTotalPages(res) {
  return res.data?.total_pages;
}

function assertNotEmpty(res) {
  const users = getUsers(res);
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('Expected non-empty users list');
  }
}

module.exports = { getUsers, getPage, getPerPage, getTotalPages, assertNotEmpty };
