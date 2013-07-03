Expression.Integer = function Integer(x) {
	this.a = x;
};
_ = extend(Expression.Integer, Expression.Rational);
_.b = 1;

_['+'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a + x.a);
	}
	return x['+'](this);
};
_['-'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a - x.a);
	}
	return this.__proto__.__proto__['-'].call(this, x);
};
_['/'] = function (x) {
	if(x instanceof Expression.Integer) {
		if(this.a % x.a === 0) {
			return new Expression.Integer(this.a / x.a);
		}
		return new Expression.Rational(this.a, x.a);
	}
	return this.__proto__.__proto__['/'].call(this, x);
};

_['@-'] = function () {
	return new Expression.Integer(-this.a);
};
_['*'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a * x.a);
	}
	return x['*'](this);
};
_['^'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(Math.pow(this.a, x.a));
	} else if (x.constructor === Expression.Rational) {
		var f = x.reduce();
		if(f.a % 2 == 0) {
			return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
		} else {
			return Expression.NumericalReal.prototype['^'].call(
				this,
				x
			);
		}
	} else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
		if(this.a > 0) {
			return Expression.List.Real([
				this,
				x
			], '^');
		}
	}
	return Expression.NumericalReal.prototype['^'].call(
		this,
		x
	);
	
};
_['%'] = function (x) {
	if(x instanceof Expression.Integer) {
		return new Expression.Integer(this.a % x.a);
	} else if (x.constructor === Expression.Rational) {
		return new Expression.Rational()
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalReal(this % x.value);
	} else {
		return Expression.List.Real([this, x], '%');
	}
};