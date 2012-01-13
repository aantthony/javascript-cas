#!/usr/bin/env node

var sys = require('sys');
var exec = require('child_process').exec;
exec('make', function(err, stdout, stderr){
    var stderr= process.stderr,
		stdout= process.stdout;
		
    var M = require('./build/math.js');
    function color(str){
		return '\x1b[1m' + (str || "") + '\x1b[22m';
	}
	function _(){
	    console.log("  ----");
	}
    function run(){
        var i,l;
        for(i=0,l=arguments.length;i<l;i++){
            stdout.write(color("Test: "+ (arguments[i].name.replace('_',' ') || i+1))+"\n");
            arguments[i]();
            console.log("------");
        }
    }
    run(
        function three(){
            M("  3  ");
        },
        function Simple_Addition(){
            M("3 +  x");
        },
        function Parenthesis(){
            M("3+(x)/[((+))]")
        },
        function Mutlicharacter_Operators(){
            M("x++");
        },
        function Implied_Multiplication(){
            M("2x");
            _();
            M("x x");
            _();
            M(" x(x)");
            _();
            M("(x)x");
        }
    );
})
