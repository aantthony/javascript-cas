#!/usr/bin/env node

var sys = require('sys');
var exec = require('child_process').exec;
exec('make', function(err, stdout, stderr){
    var stderr = process.stderr,
		stdout = process.stdout;
		
    var M = require('./build/math.js');
    function color(str){
		return '\x1b[1m' + (str || "") + '\x1b[22m';
	}
	function _(){
	    //console.log("  ----");
	}
	function assert(cond){
	    if(!cond){
	        throw(new Error("Assertion Failed."));
	    }
	}
    function run(){
        var i,l;
        for(i=0,l=arguments.length;i<l;i++){
            stdout.write(color("Test: "+ (arguments[i].name.replace('_',' ') || i+1))+"\n");
            arguments[i]();
            //console.log("------");
        }
    }
    //console.log(M("3"));
    console.log("------");
    
    run(
        function three(){
            M("  3  ");
        },
        function Simple_Addition(){
            M("3 +  x");
        },
		function Equality(){
			M("x=2");
		},
        function Parenthesis(){
	console.log("A");
            M("(1)");
		console.log("B");
            M("3/(2)");
		console.log("C");
            M("3+(x)/[((5))]");
            //M("3/(+2)");
        },
        function Mutlicharacter_Operators(){
            //M("x++");
        },
        function Implied_Multiplication(){
            M("2x");
            _();
            M("x x");
            _();
            M(" x(x)");
            _();
            M("(x)x");
            _();
            assert(M("(3)2").value == 6);
        },
        function Numerical(){
            assert(M("0.4").value == 0.4);
            assert(M("3+2").value == 5);
            assert(M("3-5").value == -2);
        },
        function Complex_Numerical(){
            assert(M("i").toString() === "i");
            assert(M("i*i").toString() === "-1");
            //assert(M("i^2").toString() === "-1 + 0i");
        },
        function Complex(){
        }
    );
})
