function buildRequest(fields) {
  return JSON.parse(JSON.stringify(fields));
}

function createUserReq({ email, username, password, profile, contacts, address, employment, settings } = {}) {
  return buildRequest({ email, username, password, profile, contacts, address, employment, settings });
}

function profileReq({ firstName: first_name, lastName: last_name, middleName: middle_name,
  gender, bio, dateOfBirth: date_of_birth, interests, avatarUrl: avatar_url } = {}) {
  return buildRequest({ first_name, last_name, middle_name, gender, bio, date_of_birth, interests, avatar_url });
}

function contactsReq({ phone, telegram, whatsapp, linkedin, github, website } = {}) {
  return buildRequest({ phone, telegram, whatsapp, linkedin, github, website });
}

function addressReq({ country, state, city, street, building, apartment, zipCode: zip_code, coordinates } = {}) {
  return buildRequest({ country, state, city, street, building, apartment, zip_code, coordinates });
}

function employmentReq({ status, company, position, department, startDate: start_date, salary } = {}) {
  return buildRequest({ status, company, position, department, start_date, salary });
}

function settingsReq({ language, timezone, theme, notificationsEnabled: notifications_enabled,
  twoFactorEnabled: two_factor_enabled, privateProfile: private_profile } = {}) {
  return buildRequest({ language, timezone, theme, notifications_enabled, two_factor_enabled, private_profile });
}

module.exports = { createUserReq, profileReq, contactsReq, addressReq, employmentReq, settingsReq };
