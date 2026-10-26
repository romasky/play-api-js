module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['src/support/**/*.js', 'src/steps/**/*.js', 'node_modules/allure-cucumberjs/dist/cjs/index.js'],
    format: [
      'progress',
      'allure-cucumberjs/reporter',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    tags: '@Run and not @Ignore and not @Bug and not @NotImplemented',
    // keep 1: rate limits are per IP and paced in-process (src/http/throttle.js); scale via the CI matrix
    parallel: 1,
  },
};
