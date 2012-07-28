var sys = require('util');
var exec = require('child_process').exec;

var bstr = 'make';
exec(bstr,
    function (error, stdout, stderr) {
        console.log(stdout);
    }
);

var stdin = process.openStdin();
stdin.on("data", function () {
	
});