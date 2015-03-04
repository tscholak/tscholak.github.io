module.exports = function(grunt) {

  grunt.initConfig({
    copy: {
      jquery: {
        files: [{
          expand: true,
          cwd: 'bower_components/jquery/dist/',
          src: 'jquery.min.js',
          dest: 'vendor/js/',
        }]
      },
      jqueryui: {
        files: [{
          expand: true,
          cwd: 'bower_components/jquery-ui/',
          src: 'jquery-ui.min.js',
          dest: 'vendor/js/',
        }]
      },
      fitvids: {
        files: [{
          expand: true,
          cwd: 'bower_components/fitvids/',
          src: 'jquery.fitvids.js',
          dest: 'vendor/js/',
        }]
      }
    },
    exec: {
      jekyll: {
        cmd: 'jekyll build --trace'
      }
    },
    watch: {
      source: {
        files: [
          '_config.yml',
          '_drafts/**/*',
          '_includes/**/*',
          '_layouts/**/*',
          '_plugins/**/*',
          '_posts/**/*',
          '_sass/**/*',
          'assets/**/*',
          '*.html',
          '*.md',
          'feed.xml'
        ],
        tasks: ['exec:jekyll'],      
        options: {
          livereload: true
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 4000,
          base: '_site',
          livereload: true
        }
      }
    },
    buildcontrol: {
      options: {
        dir: '_site',
        commit: true,
        push: true,
        message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
      },
      pages: {
        options: {
          remote: 'git@github.com:tscholak/tscholak.github.io.git',
          branch: 'master'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-build-control');

  grunt.registerTask('build', ['copy', 'exec:jekyll']);
  grunt.registerTask('serve', ['build', 'connect:server', 'watch']);
  grunt.registerTask('deploy', ['build', 'buildcontrol:pages']);
  grunt.registerTask('default', ['deploy']);

};
