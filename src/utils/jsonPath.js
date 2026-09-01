/**
 * Dotted-path helpers for typed response-body checks (used instead of
 * JSON.stringify().includes() substring matching).
 *
 *   getPath(body, 'metadata.role')  → value or undefined, never throws
 *   hasPath(body, 'profile.bio')    → true only if every segment is an OWN property
 */
function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function hasPath(obj, path) {
  let current = obj;
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) return false;
    current = current[key];
  }
  return true;
}

module.exports = { getPath, hasPath };
