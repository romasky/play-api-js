require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://www.play-qa.com',
  connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '20000'),
  socketTimeout: parseInt(process.env.SOCKET_TIMEOUT || '20000'),
};
