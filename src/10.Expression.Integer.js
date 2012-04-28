Expression.Integer = function Integer(x) {
	this.a = x;
};
Expression.Integer.prototype = Object.create(Expression.Rational.prototype);
Expression.Integer.prototype.b = 1;
Expression.Integer.prototype.constructor = Expression.Integer;

Expression.Integer['+'] = function (x) {
	if (x.constructor === this.constructor) {
		return new Expression.Integer(this.a + x.a);
	} else {
		return x['+'](this);
	}
};
Expression.Integer.prototype['-'] = function (x) {
	if (x.constructor === this.constructor) {
		return new Expression.Integer(this.a - x.a);
	}
	return this.__proto__['-'](x);
}
Expression.Integer.prototype['/'] = function (x) {
	if(x.constructor === this.constructor) {
		if(this.a % x.a === 0) {
			return new Expression.Integer(this.a / x.a);
		}
		return new Expression.Rational(this.a, x.a);
	}
	return this.__proto__['/'](x);
};
Expression.Integer.prototype['*'] = function (x) {
	if (x.constructor === this.constructor) {
		return new Expression.Integer(this.a * x.a);
	}
	return this.__proto__['*'](x);
};
Expression.Integer.prototype['^'] = function (x) {
	if (x.constructor === this.constructor) {
		return new Expression.Integer(Math.pow(this.a, x.a));
	} else if (x.constructor === Expression.Rational) {
		
	}
	return this.__proto__['^'](x);
};
Expression.Integer.prototype['%'] = function (x) {
	if(x.constructor === this.constructor) {
		return new Expression.Integer(this.a % x.a);
	} else if (x.constructor === Expression.Rational) {
		return new Expression.Rational()
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalReal(this % x.value);
	} else {
		return Expression.List.Real([this, x], '%');
	}
};