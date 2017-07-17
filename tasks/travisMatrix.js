module.exports = {
  v6: {
    test: function() {
      return /^v6/.test(process.version);
    },
    tasks: ['istanbul:unit', 'shell:codeclimate']
  },
  other: {
    test: function() {
      return !/^v6/.test(process.version);
    },
    tasks: ['mocha']
  }
};
