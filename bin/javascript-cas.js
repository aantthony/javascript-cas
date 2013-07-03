// Simpled REPL for JavaScript-Cas

var M = require("../");

function REPL() {
	// global.console.log = function(){};
	function color (str){
		return '\x1b[1m' + (str || "") + '\x1b[22m';
	}
	var stdin = process.openStdin(),
		stderr= process.stderr,
		stdout= process.stdout;

	var line = "";
	stderr.write("Javascript-cas (http://aantthony.github.com/javascript-cas/)\n");
	stderr.write(">> ");
	stdin.on('data', function (c) {
		c = c + ""
		line += c;
		switch (line[line.length - 1]) {
			case '\n': case '\r': case '\u0004':
			line=line.trim();
			if (line == 'exit'){
				stdout.write("\n");
				process.exit()
			} else if (line === 'clear') {
				stdout.write("\x1b[H\x1b[2J");
			} else if (line) {
				try {
				    var expr = M(line).simplify()
					stdout.write(expr.s('text/latex').s + '\n');
				} catch (ex) {
					stderr.write(color(ex) + '\n');
				}
			}	
			stderr.write('>> ');
			line = "";
			break;
		default:
			break
		}
	});
}

module.exports = REPL();
