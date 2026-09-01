const LATIN    = 'abcdefghijklmnopqrstuvwxyz';
const NUMERIC  = '0123456789';
const SPECIAL  = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const CYRILLIC = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

function randomFrom(chars, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

module.exports = {
  alphanumericString:(n)      => randomFrom(LATIN + NUMERIC, n),

  email:             ()       => randomFrom(LATIN + NUMERIC, 10) + '@play-qa.com',
  username:          ()       => 'user_' + randomFrom(LATIN + NUMERIC, 8).toLowerCase(),
  password:          ()       => 'Pass_' + randomFrom(LATIN + NUMERIC, 10) + '!1',
  firstName:         ()       => 'Test' + randomFrom(LATIN, 6),
  lastName:          ()       => 'User' + randomFrom(LATIN, 6),
  phoneNumber:       ()       => '+1' + randomFrom(NUMERIC, 10),
  senderEmail:       ()       => randomFrom(LATIN + NUMERIC, 8).toLowerCase() + '@example.com',
  messageSubject:    ()       => 'Subject ' + randomFrom(LATIN + NUMERIC, 6),
  messageBody:       ()       => 'Body ' + randomFrom(LATIN + NUMERIC, 10),
  invalidEmail:      ()       => 'notanemail_' + randomFrom(LATIN + NUMERIC, 4),
  shortPassword:     ()       => randomFrom(LATIN + NUMERIC, 4),
  fakeMongoId:       ()       => randomFrom(NUMERIC, 24),
  fakeUuid:          ()       => '00000000-0000-0000-0000-' + randomFrom(NUMERIC, 12),

  string: (length, { cyrillic = false, latin = true, numeric = false, spaces = false, special = false } = {}) => {
    let pool = '';
    if (latin)    pool += LATIN;
    if (numeric)  pool += NUMERIC;
    if (special)  pool += SPECIAL;
    if (spaces)   pool += ' ';
    if (cyrillic) pool += CYRILLIC;
    if (!pool)    pool = LATIN;
    return randomFrom(pool, length);
  },
};
