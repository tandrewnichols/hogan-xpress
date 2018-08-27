var n = require('n-run');
var versions = [ '6', '7', '8', '9', '10' ];

module.exports = function(grunt) {
  grunt.registerTask('compare', function() {
    n.run('node_modules/.bin/grunt baseline:compare', versions, this.async());
  });

  grunt.registerTask('update', function() {
    n.run('node_modules/.bin/grunt baseline:update', versions, this.async());
  });
};
