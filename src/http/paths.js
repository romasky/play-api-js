/** Single source of truth for every endpoint path. */
const BASE = '/api/v1';

module.exports = {
  BASE,
  HEALTH:             `${BASE}/health`,
  LOGIN:              `${BASE}/login`,
  AUTH_BASIC:         `${BASE}/auth/basic`,
  VERIFY_RECAPTCHA:   `${BASE}/verify-recaptcha`,

  USERS_CREATE:       `${BASE}/users/create`,
  USERS_CREATE_ADMIN: `${BASE}/users/create-admin`,
  USERS_LIST:         `${BASE}/users/list`,
  USERS_OPTIONS:      `${BASE}/users/options`,
  usersGet:     (id) => `${BASE}/users/get/${id}`,
  usersExists:  (id) => `${BASE}/users/exists/${id}`,
  usersUpdate:  (id) => `${BASE}/users/update/${id}`,
  usersPatch:   (id) => `${BASE}/users/patch/${id}`,
  usersDelete:  (id) => `${BASE}/users/delete/${id}`,
  usersLogout:  (id) => `${BASE}/users/logout/${id}`,

  JWT_LOGIN:          `${BASE}/jwt/login`,
  JWT_ME:             `${BASE}/jwt/me`,
  JWT_REFRESH:        `${BASE}/jwt/refresh`,
  JWT_DECODE:         `${BASE}/jwt/decode`,
  STORE_LOGIN:        `${BASE}/store/login`,

  ADMIN_STATS:        `${BASE}/admin/stats`,
  ADMIN_USERS:        `${BASE}/admin/users`,
  adminUser:     (id) => `${BASE}/admin/users/${id}`,
  adminUserRole: (id) => `${BASE}/admin/users/${id}/role`,

  MAIL_CREATE:        `${BASE}/mail/create`,
  mailGet:      (token)     => `${BASE}/mail/${token}`,
  mailMessages: (token)     => `${BASE}/mail/${token}/messages`,
  mailMessage:  (token, id) => `${BASE}/mail/${token}/messages/${id}`,
  mailSend:     (token)     => `${BASE}/mail/${token}/send`,
  mailSendTo:   (token)     => `${BASE}/mail/${token}/send-to`,

  FILES:              `${BASE}/files`,
  FILES_UPLOAD:       `${BASE}/files/upload`,
  file:         (id) => `${BASE}/files/${id}`,
  fileDownload: (id) => `${BASE}/files/${id}/download`,

  WEBHOOKS_INBOX:     `${BASE}/webhooks/inbox`,
  webhook:        (token)     => `${BASE}/webhooks/${token}`,
  webhookEvents:  (token)     => `${BASE}/webhooks/${token}/events`,
  webhookEvent:   (token, id) => `${BASE}/webhooks/${token}/events/${id}`,
  webhookIngest:  (ingest)    => `${BASE}/webhooks/in/${ingest}`,

  BUG_REPORTS:        `${BASE}/bug-reports`,
  bugReport:    (id) => `${BASE}/bug-reports/${id}`,
  BUGGY:              `${BASE}/buggy`,
  BUGGY_ITEMS:        `${BASE}/buggy/items`,
  BUGGY_CART_TOTAL:   `${BASE}/buggy/cart/total`,
  BUGGY_SCHEDULE:     `${BASE}/buggy/schedule`,

  CHAOS_CACHE:          `${BASE}/chaos/cache`,
  CHAOS_ECHO:           `${BASE}/chaos/echo`,
  CHAOS_FLAKY:          `${BASE}/chaos/flaky`,
  CHAOS_FLAKY_SEQUENCE: `${BASE}/chaos/flaky/sequence`,
  CHAOS_GZIP:           `${BASE}/chaos/gzip`,
  CHAOS_TIMEOUT:        `${BASE}/chaos/timeout`,
  chaosDelay:     (seconds) => `${BASE}/chaos/delay/${seconds}`,
  chaosFlakyStep: (index)   => `${BASE}/chaos/flaky/step/${index}`,
  chaosRedirect:  (hops)    => `${BASE}/chaos/redirect/${hops}`,
  chaosStatus:    (code)    => `${BASE}/chaos/status/${code}`,

  CHALLENGES:           `${BASE}/challenges`,
  CHALLENGES_PROGRESS:  `${BASE}/challenges/progress`,
  challengeHints:  (id) => `${BASE}/challenges/${id}/hints`,
  challengeReveal: (id) => `${BASE}/challenges/${id}/hints/reveal`,
  challengeStart:  (id) => `${BASE}/challenges/${id}/start`,
  challengeVerify: (id) => `${BASE}/challenges/${id}/verify`,

  SSE_PROGRESS:       `${BASE}/sse/progress`,
  WS_ECHO:            `${BASE}/ws/echo`,
  // downloadable API descriptions, by the name the features use
  API_DOCUMENTS: {
    'OpenAPI JSON':        `${BASE}/openapi.json`,
    'OpenAPI YAML':        `${BASE}/openapi.yaml`,
    'Postman collection':  `${BASE}/postman/collection.json`,
    'Postman environment': `${BASE}/postman/environment.json`,
  },
};
