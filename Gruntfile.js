var fs = require('fs');

module.exports = function(grunt) {
	var sourceFiles = fs.readdirSync('src')
		.filter(function (f) {
			return /\.js$/.test(f);
		})
		.sort(function (a, b) {
			var A = Number(/^(\d+)\./.exec(a)[1]);
			var B = Number(/^(\d+)\./.exec(b)[1]);
			return A - B;
		})
		.map(function (f) {
			return 'src/' + f;
	});
	sourceFiles.splice(1, 0, 'build/grammar.js');
	
  // Project configuration.
  grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				files: {
					'build/<%= pkg.name %>.js': sourceFiles
				}
			}
		},
		jison: {
			'./build/grammar.js': 'grammar/calculator.jison'
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
		var grammar = fs.readFileSync(this.data).toString();
		var _ = console.log;
		console.log = function () {
			// SHUT THE FUCK UP JISON!!!
		};
		try {
			var Parser = require('jison').Parser,
					parser = new Parser(grammar, {debug: true});
		} finally {
			console.log = _;
		}
		
		fs.writeFileSync(this.target, parser.generate());
	});
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['jison', 'concat', 'uglify']);

};