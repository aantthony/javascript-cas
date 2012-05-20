Expression.Integer = function Integer(x) {
	this.a = x;
};
Expression.Integer.prototype = Object.create(Expression.Rational.prototype);
Expression.Integer.prototype.b = 1;
Expression.Integer.prototype.constructor = Expression.Integer;

Expression.Integer.prototype['+'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a + x.a);
	}
	return x['+'](this);
};
Expression.Integer.prototype['-'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a - x.a);
	}
	return this.__proto__.__proto__['-'].call(this, x);
};
Expression.Integer.prototype['/'] = function (x) {
	if(x instanceof Expression.Integer) {
		if(this.a % x.a === 0) {
			return new Expression.Integer(this.a / x.a);
		}
		return new Expression.Rational(this.a, x.a);
	}
	return this.__proto__.__proto__['/'].call(this, x);
};

Expression.Integer.prototype['@-'] = function () {
	return new Expression.Integer(-this.a);
};
Expression.Integer.prototype['*'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a * x.a);
	}
	return x['*'](this);
};
Expression.Integer.prototype['^'] = function (x) {
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
	}
	return this.__proto__.__proto__['^'].call(this, x);
};
Expression.Integer.prototype['%'] = function (x) {
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