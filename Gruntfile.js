var fs = require('fs');
module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jison: {
            './grammar/parser.js': './grammar/parser.jison'
        },
        jshint: {
            options: {
                eqeqeq: true,
                globals: {
                    require: false,
                    module: true,
                    console: false
                }
            },
            all: ['Gruntfile.js', 'lib/**/*.js', 'test/**.*.js']
        },
        browserify2: {
            main: {
                entry: './index.js',
                compile: 'build/<%= pkg.name %>.js',
                debug: true
                // afterHook: uglifier()
            }
        },
        watch: {
            scripts: {
                files: ['lib/**/*.js'],
                tasks: ['browserify2', 'uglify']
            },
            gramnar: {
                files: ['grammar/*.jison'],
                tasks: ['jison', 'browserify2', 'uglify']
            }
        },
        uglify: {
            options: {
                banner: '/**\n*  <%= pkg.name %> v<%= pkg.version %>\n*  https://github.com/aantthony/javascript-cas\n*  \n*  Copyright 2010 Anthony Foster.\n*  <%= grunt.template.today("yyyy-mm-dd") %>\n*/\n'
            },
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    grunt.registerMultiTask('jison', 'Parser Generator', function () {
        var done = this.async();
        var target = this.target;
        var grammar = fs.readFile(this.data, function (err, data) {
            if (err) throw err;

            var grammar = data.toString();
            var _ = console.log;
            console.log = function () {
                // SHUT THE FUCK UP JISON!!!
            };
            var parser;
            try {
                var Parser = require('jison').Parser;
                parser = new Parser(grammar, {debug: true});
            } finally {
                console.log = _;
            }
            if (parser) {
                fs.writeFile(target, parser.generate(), function (err) {
                    if (err) throw err;

                    done(true);
                });
            }
        });
        
    });
    
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify2');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
    // Default task(s).
    grunt.registerTask('default', ['jison', 'browserify2', 'uglify']);

    grunt.registerTask('live', ['default', 'watch']);
    

};
