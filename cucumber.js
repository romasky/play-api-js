module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['src/steps/**/*.js'],
    format: [
      'progress',
      './node_modules/allure-cucumberjs/dist/index.js',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html',
    ],
    tags: '@Run and not @Ignore and not @Bug and not @NotImplemented',
    parallel: 1,
  },
};
