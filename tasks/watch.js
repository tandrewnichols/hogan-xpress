module.exports = {
  tests: {
    files: ['lib/**/*.js', 'test/**/*.*'],
    tasks: ['mocha'],
    options: {
      atBegin: true
    }
  }
};
