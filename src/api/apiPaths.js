const BASE = '/api/v1';

module.exports = {
  HEALTH:        `${BASE}/health`,
  LOGIN:         `${BASE}/login`,
  USERS_CREATE:  `${BASE}/users/create`,
  USERS_LIST:    `${BASE}/users/list`,
  USERS_OPTIONS: `${BASE}/users/options`,
  MAIL_CREATE:   `${BASE}/mail/create`,

  usersGet:     (id)        => `${BASE}/users/get/${id}`,
  usersExists:  (id)        => `${BASE}/users/exists/${id}`,
  usersUpdate:  (id)        => `${BASE}/users/update/${id}`,
  usersPatch:   (id)        => `${BASE}/users/patch/${id}`,
  usersDelete:  (id)        => `${BASE}/users/delete/${id}`,
  usersLogout:  (id)        => `${BASE}/users/logout/${id}`,
  mailGet:      (token)     => `${BASE}/mail/${token}`,
  mailMessages: (token)     => `${BASE}/mail/${token}/messages`,
  mailMessage:  (token, id) => `${BASE}/mail/${token}/messages/${id}`,
  mailSend:     (token)     => `${BASE}/mail/${token}/send`,
  mailDelete:   (token)     => `${BASE}/mail/${token}`,
};
