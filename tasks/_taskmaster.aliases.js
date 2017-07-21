module.exports = {
  mocha: ['mochaTest:test'],
  default: ['eslint:lib', 'mocha', 'baseline:compare'],
  coverage: ['istanbul:unit', 'open:coverage'],
  ci: ['eslint:lib', 'travisMatrix']
};
