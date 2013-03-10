Expression.Conditional = function Conditional(cond, a, b) {
	if(a instanceof Expression.Symbol.Real || a instanceof Expression.List.Real) {
		return new Expression.Conditional.Real(cond, a, b);
	}
	this.cond = cond;
	this.a = a;
	this.b = b || Global.undefined;
};
_ = extend(Expression.Conditional, Expression);

_.s = function (lang) {
	throw('Not real... too confusing');
};
function expandThrough(c, func) {
	return new Expression.Conditional(c.cond, func(c.a), func(c.b));
}
_.real = function (x) {
	return expandThrough(this, function (y) {
		return y.real();
	});
};
_.imag = function (x) {
	return expandThrough(this, function (y) {
		return y.imag();
	});
};
_.realimag = function (x) {
	return expandThrough(this, function (y) {
		return y.realimag();
	});
};
_.differentiate = function (x) {
	return expandThrough(this, function (y) {
		return y.differentiate(x);
	});
};
Expression.Conditional.Real = function ConditionalReal(cond, a, b) {
	this.cond = cond;
	this.a = a;
	this.b = b || Global.undefined;
};
_ = Expression.Conditional.Real.prototype = Object.create(Expression.Conditional.prototype);
_.constructor = Expression.Conditional.Real;
_.real = function () {
	return this;
};
_.imag = function () {
	return Global.Zero;
};
_.realimag = function () {
	return new Expression.List.ComplexCartesian([this, Global.Zero]);
};
_.s = function (lang) {
	if (lang === 'text/latex') {
		
	}
	if (lang === 'text/javascript' || lang == 'x-shader/x-fragment') {
		var ca = this.a.s(lang);
		var cb = this.b.s(lang);
		console.log('code', ca, cb);
		var ccond = this.cond.s(lang);
		var ca_s = ca.s;
		var c = ca.merge(cb);
		// Use parentheses anyway...
		return c.merge(ccond, '(' + ccond.s +') ? ' + ca_s + ' : ' + cb.s);
	}
};