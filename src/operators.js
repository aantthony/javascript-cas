

var operators={};

var op_precedence=0;
function op(v,assoc,arg_c){
	//Register an operator
	var memsave=[assoc,op_precedence++,arg_c];
	if(typeof v==="object") {
		for(var i=0;i<v.length;i++){
			operators[v[i]]=memsave;
		}
	}else{
		operators[v]=memsave;
	}
}

languages[language||"jsMath"].forEach(function(o) {
	op(o[0],o[1]||L,(o[2]===undefined)?2:o[2]);
});


function precedence(v){
	if(!operators[v]){
		throw("Precedence of "+v+" not known!");
	}
	return operators[v][1];
}
window.precedence=precedence;

function postfix(o){
	var op=operators[o];
	return op[0]==0 && op[2]==1;
}
function unary(o){
	var unary_secondarys=["+","-","±"];
	return (unary_secondarys.indexOf(o)!=-1)?("@"+o):false;
}



function inverse(o,b,d,side){
	var SideError = "Side must be specified for noncommutative operations!";
	b=b.clone();
	d=d.clone();
	// d (old) = [A, B], where b = A if L, and b = B if R.
	switch(o){
		case "+":
			return [d, b].setType("-");
		case "-":
			if(side===L){
				// d = b - ?
				// ? = b - d
				return [b, d].setType("-");
			}else if(side===R){
				// d = ? - b
				// ? = d + b
				return [d, b].setType("+");
			}else{
				throw(SideError);
			}
		case "/":
			if(side===L){
				// d = b / ?
				// d * ? = b / ? * ?
				// ? = (1/d) b
				
				//TODO: THIS ASSUMES A*B = B*A
				// ? = b/d
				if(d===0){
					return false; //DIVISION BY ZERO
				}
				return [b, d].setType("/");
			}else if(side===R){
				// d = ? / b
				// d * b = ?
				return [d, b].setType("*");
			}else{
				throw(SideError);
			}
		case "*":
			// d = b * ?
			// 1/b * d = ?
			
			//TODO: THIS ASSUMES A*B = B*A
			// ? = d / b
			if(b===0){
				return false;
			}
			return [d, b].setType("/");
		case "^":
			if(side===L){
				// d = b ^ ?
				// d = e ^ (? * log b)
				// log(d) = ? * log b
				// log(d) / log(b) = ?
				//Log should really be an operator
				return [["log",d].setType("∘"), ["log",b].setType("∘")].setType("/");
			}else if(side===R){
				// d = ? ^ b
				// d ^ (1/b) = ?^(b/b)
				// d ^ (1/b) = ?
				if(b===0){
					return false;
				}
				return [d, [1, b].setType("/")].setType("^");
			}else{
				throw(SideError);
			}
		default:
			return;
	}
	
	/*
	//Commutative operators:
	var os={
		"+":"-",
		"*":"/",
		"^":{"L":["^","/"], "R":["log", ]},
		"-":{"L": "-", "R":"+"},
		"/":{"L": "/", "R":"*"},
		"&&":["∨","¬","&&","$0"],
		
		"∘":["∘","/"],//TODO: NEEDS DEBUG CHECK: check this junk
		"matrix multiplication":I
	};
	if(os[o]){
		var c=b.clone();
		var op = os[o];
		if(typeof op==="object" && !op.length){
			if(side===R){
				op = op.R;
			}else if(side===L){
				op = op.L;
			}else{
				throw("Side must be specified for non-commutative operations.");
			}
		}
		if(typeof op==="object"){
			for (var i = op.length - 1; i > 0; i--){
				c=[identity(op[i]),c].setType(op[i]);
				if(!c.valid()){
					return false;
				}
			};	
		}
		c=[undefined,c].setType(os[o]);
		
		if(!c.valid()){
			return false;
		}
		
		return c;
		
		
	}*/
	
}



function identity(o){
	var os={
		"+":0,
		"*":1,
		"^":0,
		
		"/":1, //Implied by inverse?()
		"-":0,
		"&&":true,
		"∨":false,
		
		"%":Infinity, //Bounds of real numbers
		"^":1,
		"matrix multiplication":I
		
		
	};
	if(os[o]!==undefined){
		return os[o];
	}
	return undefined;
}



//Commute?
function commutative(o){
	return ["*","+","="].indexOf(o)!=-1;
}
window.commutative=commutative;
//Is the operator o left-distributive over operator p?
function distributive(o, p){
	var os={
		"*":["+","-",",",/*,"∨" messy*/],
		"/":["+","-"],
		"^":["*"],
		"cross-product":"+",
		"matrix-multiplication":"+",
		"set-union":"intersect",
		"∨":"&&",
		"conjugtion":["disjunction", "exclusive disjunction"],
		"max":"min",
		"gcd":"lcm",
		"D":["+","-",","],
		"+":["max","min",","]
	};
	
	
	//TODO: (if better/faster): use fact (?) that (* distributes over '+' (which distributes over ',')) => (* distributes over ',')
	// This doesn't hold for the binomial theorem.
	if(os[o]){
		if(os[o]===p || (os[o].indexOf && os[o].indexOf(p)!=-1)){
			return true;
		}
	}
	return false;
}




//n-ary operators: Good for factorising?? For converting +(1 +(2 3)) to +(1 2 3)
function associative(o){
	var able=["*","+","=","∘"];
	//Is this a good idea????
	if(able.indexOf(o)!=-1){
		return true;
	}
	return false;
}




Array.prototype.requiresParentheses=function(o){
	return precedence(o)>precedence(this.type) || 
	(o=="^" && this.type==="^");
};
Number.prototype.requiresParentheses=function(o){
	if(o==="^" && Number(this)<0){
		return true;
	}
	return false;
};
String.prototype.requiresParentheses=
Boolean.prototype.requiresParentheses=
_false;// Or should it be true for strings, parens = ", and "
