//Information for the shunting parser to use:
var languages = {};	
var language = "javascript+math";
var left,right;
var L = left = 0;
var R = right = 1;
/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/


languages[language] = [
	[";"],			/*L / R makes no difference???!??!? */
	[","],
	[["=","+=","-=","*=","/=","%=","&=","^=","|="],R],
	[["?",":"],R,2],
	[["∨"]],
	[["&&"]],
	[["|"]],
	[["^"]],//XOR
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
	[["**"]],//e**x
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
];

