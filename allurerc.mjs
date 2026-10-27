// Allure Report 3 configuration (`npx allure generate` reads allurerc.* — an allure.config.js is ignored).
const env = process.env;
const ciRun = env.GITHUB_RUN_ID && `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;

export default {
  name: 'play-api-js — play-qa.com API',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'play-api-js — play-qa.com API',
        // epic → feature file (the default groups by file path only)
        groupBy: ['epic', 'feature'],
        ...(ciRun && { ci: { type: 'github', url: ciRun, name: `run #${env.GITHUB_RUN_NUMBER}` } }),
      },
    },
  },
  variables: {
    'Base URL': env.BASE_URL || 'https://www.play-qa.com',
    'Node.js': process.version,
    'Spec snapshot': 'spec/openapi.json (79 operations)',
  },
  // First match wins, so the specific rules come first. Assertion failures are `failed` (the step wrapper in
  // src/support/hooks.js marks them), anything else that throws is `broken`.
  categories: [
    {
      name: 'API outage (Cloudflare 52x — origin down)',
      matchedStatuses: ['failed', 'broken'],
      messageRegex: 'but got 52\\d|origin_down',
    },
    {
      name: 'Rate limited (429) — a pacing interval in src/http/throttle.js is too short',
      matchedStatuses: ['failed', 'broken'],
      messageRegex: 'but got 429|RATE_LIMIT_EXCEEDED|TOO_MANY_INBOXES',
    },
    {
      name: 'Contract violations — a 2xx body no longer matches its schema',
      matchedStatuses: ['failed'],
      messageRegex: 'contract violated',
    },
    {
      name: 'Wrong status code or error code',
      matchedStatuses: ['failed'],
      messageRegex: 'Expected status|Expected error code',
    },
    {
      name: 'Wrong response content',
      matchedStatuses: ['failed'],
    },
    {
      name: 'Client timeouts',
      matchedStatuses: ['broken'],
      messageRegex: 'timed out after',
    },
    {
      name: 'Test infrastructure errors',
      matchedStatuses: ['broken'],
    },
  ],
};
