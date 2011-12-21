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
	language.forEach(function(o) {
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

var left, right;
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
