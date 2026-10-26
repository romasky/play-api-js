/** Header helpers — axios lower-cases header names; `Link` (RFC 8288) is parsed here. */

const header = (res, name) => res.headers[name.toLowerCase()];

/** URL of one `Link` relation (`<url>; rel="next", <url>; rel="last"`), or undefined. */
function link(res, rel) {
  for (const part of String(header(res, 'Link') ?? '').split(',')) {
    const match = /<([^>]*)>\s*;(.*)/.exec(part.trim());
    if (match && /\brel="?([^";]+)"?/.exec(match[2])?.[1].split(/\s+/).includes(rel)) return match[1];
  }
  return undefined;
}

module.exports = { header, link };
