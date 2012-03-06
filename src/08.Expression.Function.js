Expression.LambdaExpression = function (expr, bound_symbols){
	this.expr = expr;
	this.symbols = bound_symbols;
};
Expression.LambdaExpression.prototype = Object.create(Expression.prototype);

Expression.LambdaExpression.prototype.apply = function (operator) {
	
};