module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: {
        src: ['*.js',],
        options: {
          jshintrc: true
        }
      }
    },

    mochaTest: {
      src: ['test/*.js'],
      options: {

      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('default', ['jshint', 'mochaTest']);
};
