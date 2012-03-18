Expression.Function = function (expr, bound_symbols) {
	this.expr = expr;
	this.symbols = bound_symbols;
};
Expression.Function.prototype = Object.create(Expression.prototype);
Expression.Function.prototype.constructor = Expression.Function;
Expression.Function.prototype.default = function (argument) {
	return
};
Expression.Function.Symbolic = function (expr, vars) {
	this.expr = expr;
	this.symbols = vars;
	
};
Expression.Function.Symbolic.prototype = Object.create(Expression.Function.prototype);
Expression.Function.Symbolic.prototype.constructor = Expression.Function.Symbolic;

Expression.Function.Symbolic.prototype.default = function (x) {
	if (x.constructor !== Expresssion.Vector) {
		x = Expression.Vector([x]);
	}
	var expr = this.expr;
	var i, l = this.symbols.length;
	if (l !== x.length) {
		throw ('Invalid domain. Element of F^' + l + ' expected.');
	}
	for(i = 0; i < l; i++) {
		expr = expr.sub(this.symbols[i], x[i])
	}
};