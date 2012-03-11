Expression.Function = function (expr, bound_symbols) {
	this.expr = expr;
	this.symbols = bound_symbols;
};
Expression.Function.prototype = Object.create(Expression.prototype);
Expression.Function.prototype = {};
	
Expression.Function.prototype.apply = function (operator, argument) {
	return
};
Expression.Function.Symbolic = function (application) {
	
};
