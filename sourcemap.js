var fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var child;
if(isNaN(process.argv[2])){
	throw('Usage: node lookup.js line_number');
}
Array.prototype.mapAsync = function (f) {
	var i;
	var count = 0;
	var finish;
	var l = this.length;
	var self = this;
	var arr = new Array(l);
	setTimeout(function () {
		for(i = 0; i < l; i++) {
			arr[i] = undefined;
			(function (i){
				f(self[i], function (n){
					arr[i] = n;
					count++;
					if(count === l) {
						finish(arr);
					}
				});
			}(i));
			
		}
	}, 0);
	return function (done) {
		finish = done;
	};
};
child = exec('echo $(for i in src/*.js ; do printf "%s\n" "$i" ; done | sort -n)', function (error, stdout, stderr) {
	var files = stdout.split(" ");
	
	var search = Number(process.argv[2]);
	files.map(function(s) {
		return s.trim();
	}).mapAsync(function (e, f){
		stdout
		exec('cat ' + e + ' | wc -l', function (error, stdout, stderr) {
			var result = {
				filename: e,
				lines: Number(stdout.trim())
			};
			f(result);
		});
	})(function (a){
		var sum = 0;
		var i, l;
		for(i = 0, l = a.length; i < l; i++) {
			if((sum + a[i].lines) >= search) {
				console.log("Found in " + a[i].filename + " on line "+ (search - sum));
				break;
			}
			sum += a[i].lines;
		}
	});
});