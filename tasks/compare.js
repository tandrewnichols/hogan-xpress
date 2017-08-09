var n = require('n-run');
var versions = ['4', '5', '6', '7', '8'];

module.exports = function(grunt) {
  grunt.registerTask('compare', function() {
    n.run('node_modules/.bin/grunt baseline:compare', versions, this.async());
  });

  grunt.registerTask('update', function() {
    n.run('node_modules/.bin/grunt baseline:update', versions, this.async());
  });
};
