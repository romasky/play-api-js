/** /challenges/* — guided exercises: start issues a sandbox user, the player acts on it, verify scores it. */
const { request } = require('../http/client');
const paths = require('../http/paths');

module.exports = {
  catalog:  (params)                    => request('GET',  paths.CHALLENGES, { params }),
  progress: (headers)                   => request('GET',  paths.CHALLENGES_PROGRESS, { headers }),
  hints:    (id)                        => request('GET',  paths.challengeHints(id)),
  reveal:   (id, body, headers)         => request('POST', paths.challengeReveal(id), { json: body, headers }),
  start:    (id, headers, params)       => request('POST', paths.challengeStart(id), { params, headers }),
  verify:   (id, headers, body)         => request('POST', paths.challengeVerify(id), { json: body, headers }),
};
