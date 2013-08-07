// Simpled REPL for JavaScript-Cas

var M = require('../'),
    repl = require('repl');

var last = null;

function REPL() {
    repl.start({
        eval: function (cmd, context, filename, callback) {
            cmd = cmd.substring(1, cmd.length - 2);
            if (cmd === '_') {
                return callback(null, last);
            }
            

            try {
                var result = last = M(cmd);
                callback(null, result.s('text/javascript').s);
            } catch(ex) {
                last = null;
                callback(ex);
            }
            
        },
        prompt: 'J>'
    });

}

module.exports = REPL();
