Expression.Function = function (p) {
	this.default = p.default;
	this['text/latex'] = (p['text/latex']);
	this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
	this['text/javascript'] = (p['text/javascript']);
	this.derivative = p.derivative;
	this.realimag = p.realimag;
};
_ = extend(Expression.Function, Expression);

_.default = function (argument) {
	return ;
};
_.differentiate = function () {
	if (this.derivative) {
		return this.derivative;
	}
	throw('Function has no derivative defined.');
}

_._s = function (lang) {
	if (this[lang]) {
		return new Code(this[lang]);
	}
	throw('Could not compile function into ' + lang);
};

_['+'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['+'](x), [a]);
};

_['@-'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['@-'](), [a]);
};


Expression.Function.Symbolic = function SymbolicFunction(expr, vars) {
	this.expr = expr;
	this.symbols = vars;
	
};
_ = Expression.Function.Symbolic.prototype = Object.create(Expression.Function.prototype);
_.constructor = Expression.Function.Symbolic;

_.default = function (x) {
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