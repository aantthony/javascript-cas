Expression.Function = function (p) {
	this.default = p.default;
	this['text/latex'] = (p['text/latex']);
	this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
	this['text/javascript'] = (p['text/javascript']);
	this.derivative = p.derivative;
	this.realimag = p.realimag;
};
Expression.Function.prototype = Object.create(Expression.prototype);
Expression.Function.prototype.constructor = Expression.Function;
Expression.Function.prototype.default = function (argument) {
	return ;
};
Expression.Function.prototype.differentiate = function () {
	if (this.derivative) {
		return this.derivative;
	}
	throw('Function has no derivative defined.');
}

Expression.Function.prototype.s = function (lang) {
	if (this[lang]) {
		return new Code(this[lang]);
	}
	throw('Could not compile function into ' + lang);
};


Expression.Function.Symbolic = function (expr, vars) {
	this.expr = expr;
	this.symbols = vars;
	
};
Expression.Function.Symbolic.prototype = Object.create(Expression.Function.prototype);
Expression.Function.Symbolic.prototype.constructor = Expression.Function.Symbolic;

Expression.Function.Symbolic.prototype.default = function (x) {
	if (x.constructor !== Expression.Vector) {
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
	return expr;
};


Expression.Function.prototype['+'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['+'](x), [a]);
};

Expression.Function.prototype['@-'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['@-'](), [a]);
};
