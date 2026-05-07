module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['src/steps/**/*.js', 'node_modules/allure-cucumberjs/dist/cjs/index.js'],
    format: [
      'progress',
      'allure-cucumberjs/reporter',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    tags: '@Run and not @Ignore and not @Bug and not @NotImplemented',
    parallel: 1,
  },
};
