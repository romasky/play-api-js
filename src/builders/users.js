/**
 * Request bodies for /users/*. camelCase in, snake_case out; undefined fields are dropped, so a builder
 * call only sends what the scenario set.
 */
const gen = require('../utils/generator');
const config = require('../config/config');

const compact = (fields) => JSON.parse(JSON.stringify(fields));

const createUserReq = ({ email, username, password, profile, contacts, address, employment, settings } = {}) =>
  compact({ email, username, password, profile, contacts, address, employment, settings });

const profileReq = ({ firstName: first_name, lastName: last_name, middleName: middle_name,
  gender, bio, dateOfBirth: date_of_birth, interests, avatarUrl: avatar_url } = {}) =>
  compact({ first_name, last_name, middle_name, gender, bio, date_of_birth, interests, avatar_url });

const contactsReq = ({ phone, telegram, whatsapp, linkedin, github, website } = {}) =>
  compact({ phone, telegram, whatsapp, linkedin, github, website });

const addressReq = ({ country, state, city, street, building, apartment, zipCode: zip_code, coordinates } = {}) =>
  compact({ country, state, city, street, building, apartment, zip_code, coordinates });

const employmentReq = ({ status, company, position, department, startDate: start_date, salary } = {}) =>
  compact({ status, company, position, department, start_date, salary });

const settingsReq = ({ language, timezone, theme, notificationsEnabled: notifications_enabled,
  twoFactorEnabled: two_factor_enabled, privateProfile: private_profile } = {}) =>
  compact({ language, timezone, theme, notifications_enabled, two_factor_enabled, private_profile });

const minimalProfile = () => profileReq({ firstName: gen.firstName(), lastName: gen.lastName() });

/**
 * A valid random user (email + password returned too, for a later login). `country` isolates the user in
 * shared list queries (`filter=address.country:…`).
 */
function minimalUser({ country } = {}) {
  const email = gen.email();
  const password = gen.password();
  const address = country ? addressReq({ country }) : undefined;
  return { email, password, body: createUserReq({ email, username: gen.username(), password, profile: minimalProfile(), address }) };
}

/** A valid POST /users/create-admin body; `seedCode: null` omits the field entirely. */
function adminUser({ seedCode = config.adminSeedCode, email = gen.email() } = {}) {
  const password = gen.password();
  const body = compact({ email, username: gen.username(), password, profile: minimalProfile(), seed_code: seedCode ?? undefined });
  return { email, password, body };
}

/** Every optional section filled with valid values. */
const fullUser = () => createUserReq({
  email: gen.email(),
  username: gen.username(),
  password: gen.password(),
  profile: profileReq({
    firstName: gen.firstName(), lastName: gen.lastName(), middleName: 'Michael',
    gender: 'other', bio: 'Short bio here.', dateOfBirth: '1990-01-15',
    interests: ['coding', 'travel'], avatarUrl: 'https://example.com/avatar.jpg',
  }),
  contacts: contactsReq({
    phone: gen.phoneNumber(), telegram: '@tester', whatsapp: gen.phoneNumber(),
    linkedin: 'https://linkedin.com/in/tester', github: 'https://github.com/tester', website: 'https://tester.dev',
  }),
  address: addressReq({
    country: 'US', state: 'California', city: 'San Francisco', street: 'Market St',
    building: '100', apartment: '5A', zipCode: '94105', coordinates: { latitude: 37.7749, longitude: -122.4194 },
  }),
  employment: employmentReq({
    status: 'employed', company: 'Acme Inc', position: 'Engineer', department: 'R&D',
    startDate: '2020-03-01', salary: { amount: 120000, currency: 'USD' },
  }),
  settings: settingsReq({
    language: 'en', timezone: 'America/Los_Angeles', theme: 'dark',
    notificationsEnabled: true, twoFactorEnabled: false, privateProfile: false,
  }),
});

/** Valid random bodies for scenarios that test auth, not payload validation. */
const randomUpdateBody = () => createUserReq({ email: gen.email(), username: gen.username(), profile: minimalProfile() });
const randomPatchBody  = () => ({ username: gen.username() });

module.exports = {
  createUserReq, profileReq, contactsReq, addressReq, employmentReq, settingsReq,
  minimalProfile, minimalUser, adminUser, fullUser, randomUpdateBody, randomPatchBody,
};
