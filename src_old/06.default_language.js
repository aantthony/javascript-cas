
var left, right;
var L = left = 0;
var R = right = 1;

var language = new Language([
	[';'],			/*L / R makes no difference???!??!? */
	[','],
	[['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='],R],
	[['?',':'],R,2],
	[['∨']],
	[['&&']],
	[['|']],
	[['??????']],//XOR
	[['&']],
	[['==', '≠', '!==', '===']],
	[['<', '<=', '>', '>='],L],
	[['>>', '<<']],
	['±', R, 2],
	[['+'], true],
	[['-'], L],
	[['∫', '∑'], R, 1],
	[['*', '%'], R],
	[crossProduct, R],
	[['@+', '@-', '@±'], R, 1], //unary plus/minus
	[['¬'], L, 1],
	['default', R, 2], //I changed this to R for 5sin(t)
	['∘', R, 2],
	[['/']],
	[['^']],//e**x
	['!', L, 1],
	[['~'], R, 1], //bitwise negation
	[['++', '++', '.', '->'],L,1],
	[['::']],
	[['_'], L, 2],
	['var', R, 1],
	['break', R, 0],
	['throw', R, 1],
	['\'', L, 1],
	['\u221A', R, 1], // Sqrt
	['#', R, 1]	/*anonymous function*/
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

var mathematica = new Language([
	[';'],
	[','],
	[['=', '+=']]
]);