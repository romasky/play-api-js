module.exports = ({ domain, localPart: local_part } = {}) =>
  JSON.parse(JSON.stringify({ domain, local_part }));
