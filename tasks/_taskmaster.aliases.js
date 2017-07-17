module.exports = {
  mocha: ['mochaTest:test'],
  default: ['eslint:lib', 'mocha'],
  coverage: ['istanbul:unit', 'open:coverage'],
  ci: ['eslint:lib', 'travisMatrix']
};
