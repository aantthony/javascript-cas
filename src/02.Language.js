function Language(language){
	
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
	this.operators = operators;
}

Language.prototype.precedence = function (v){
	if(!operators[v]){
		throw("Precedence of "+v+" not known!");
	}
	return operators[v][1];
}

Language.prototype.postfix = function (o){
	var op=operators[o];
	return op[0]==0 && op[2]==1;
}
Language.prototype.unary = function (o){
	var unary_secondarys=["+","-","±"];
	return (unary_secondarys.indexOf(o)!=-1)?("@"+o):false;
}

Language.prototype.inverse = function (o,b,d,side){
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
	
}

var left,right;
var L = left = 0;
var R = right = 1;

var language = new Language([
	[";"],			/*L / R makes no difference???!??!? */
	[","],
	[["=","+=","-=","*=","/=","%=","&=","^=","|="],R],
	[["?",":"],R,2],
	[["∨"]],
	[["&&"]],
	[["|"]],
	[["??????"]],//XOR
	[["&"]],
	[["==","≠","!==","==="]],
	[["<","<=",">",">="],L],
	[[">>","<<"]],
	["±",R,2],
	[["+","-"]],
	[["∫","∑"],R,1],
	[["*","%"]],
	[["@+","@-","@±"],R,1], //unary plus/minus
	[["¬"],L,1],
	["∘",R,2],
	[["/"]],
	[["^"]],//e**x
	["!",L,1],
	[["~"],R,1], //bitwise negation
	[["++","++",".","->"],L,1],
	[["::"]],
	[["_"],L,2],
	["var",R,1],
	["break",R,0],
	["throw",R,1],
	["'",L,1],
	["√",R,1],
	["#",R,1],	/*anonymous function*/
]);

/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/
