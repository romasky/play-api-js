module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['src/support/**/*.js', 'src/steps/**/*.js', 'node_modules/allure-cucumberjs/dist/cjs/index.js'],
    format: [
      'progress',
      // a formatter without a target claims stdout — and only one can: without the file target the Allure
      // formatter (which prints nothing) silenced `progress`, so CI logs showed no result at all.
      // Its results still go to allure-results/.
      'allure-cucumberjs/reporter:reports/allure-formatter.log',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    tags: '@Run and not @Ignore and not @Bug and not @NotImplemented',
    // keep 1: rate limits are per IP and paced in-process (src/http/throttle.js); scale via the CI matrix
    parallel: 1,
  },
};
