module.exports = {
  v4: {
    test: function() {
      return /^v6/.test(process.version);
    },
    tasks: ['istanbul:unit', 'shell:codeclimate']
  }
};
