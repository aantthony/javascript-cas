Expression.List.Real = function List_Real(x, operator) {
	x.__proto__ = Expression.List.Real.prototype;
	if(operator !== undefined) {
		x.operator = operator;
	}
	return x;
};
Expression.List.Real.prototype = Object.create(Expression.List.prototype);
Expression.List.Real.prototype.realimag = function (){
	return Expression.List.ComplexCartesian([
		this,
		Global.Zero
	]);
};
Expression.List.Real.prototype.real = function (){
	return this;
};
Expression.List.Real.prototype.imag = function (){
	return Global.Zero;
};
Expression.List.Real.prototype.polar = function () {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
Expression.List.Real.prototype.abs = function (){
	return Expression.List.Real([Global.abs, this]);
};
Expression.List.Real.prototype.arg = function (){
	return Expression.List.Real([Global.arg, this]);
};
Expression.List.Real.prototype['+'] = function (x) {
	if(this === x) {
		return x['*'](new Expression.Integer(2));
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return this;
		}
	}
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '+' && this[1] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0], this[1]['+'](x)], this.operator);
		}
		if(this.operator === '-' && this[1] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0], x['-'](this[1])], '+');
		}
		
		return Expression.List.Real([this, x], '+');
	}
	
	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '+');
	}
	return x['+'](this);
	
};
Expression.List.Real.prototype['-'] = function (x) {
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return this;
		}
	}
	
	if(x === this) {
		return Global.Zero;
	}
	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
		return Expression.List.Real([this, x], '-');
	}
	return this.realimag()['-'](x);
};
Expression.List.Real.prototype['*'] = function (x) {
	
	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return Global.Zero;
		}
	}
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0]['*'](x), this[1]], this.operator);
		}
		return Expression.List.Real([x, this], '*');
	}
	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '*');
	}
	return x['*'](this);
	
};
Expression.List.Real.prototype['/'] = function (x) {

	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}

	if(x === this) {
		return Global.One;
	}

	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/') {
			return Expression.List.Real([this[0]['/'](x), this[1]], this.operator);
		}
		return Expression.List.Real([this, x], '/');
	}

	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '/');
	}
	return this.realimag()['/'](x);
};

Expression.List.Real.prototype['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return Expression.List.Real([this], '@-');
};
Expression.List.Real.prototype['^'] = function (x) {
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0]['*'](x), this[1]['^'](x)], this.operator);
		}
	}
	return Expression.Symbol.Real.prototype['^'].call(this, x);
	
};

Expression.List.Real.prototype.constructor = Expression.List.Real;