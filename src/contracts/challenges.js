/** /challenges/* contracts. */
const { str, int, bool, object, arr, obj, entry } = require('./schema');

const Challenge = obj({
  id: str, title: str, description: str, category: str, difficulty: str, points: int, hint_count: int, params: arr(),
});

const ChallengesResponse = obj({ success: bool, total: int, challenges: arr(Challenge) });

const ProgressResponse = obj({
  success: bool, user_id: str, solved_count: int, total_challenges: int, total_points: int,
  solved: arr(object), hints: arr(object),
});

const HintsResponse = obj({ success: bool, challenge_id: str, hint_count: int, levels: arr(obj({ level: int, kind: str })) });

const RevealResponse = obj({
  success: bool, challenge_id: str, level: int, kind: str, hint: str, revealed_count: int,
  hint_count: int, has_more: bool, revealed: arr(object),
});

// 201 fresh attempt carries target incl. access_token; a repeat start (200) omits the token,
// a missing sandbox (200) has target_missing instead of target, a solved challenge has solved_at
const StartResponse = obj({ success: bool, challenge_id: str, already_solved: bool, attempt_id: str, status: str });

const VerifyResponse = obj({
  success: bool, challenge_id: str, solved: bool, already_solved: bool, points_awarded: int, attempt_id: str,
});

const CONTRACTS_2XX = [
  entry('GET',  '/challenges',                      'ChallengesResponse', ChallengesResponse),
  entry('GET',  '/challenges/progress',             'ProgressResponse',   ProgressResponse),
  entry('GET',  '/challenges/[^/]+/hints',          'HintsResponse',      HintsResponse),
  entry('POST', '/challenges/[^/]+/hints/reveal',   'RevealResponse',     RevealResponse),
  entry('POST', '/challenges/[^/]+/start',          'StartResponse',      StartResponse),
  entry('POST', '/challenges/[^/]+/verify',         'VerifyResponse',     VerifyResponse),
];

module.exports = { CONTRACTS_2XX };
