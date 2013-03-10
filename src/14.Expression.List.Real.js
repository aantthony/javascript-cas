Expression.List.Real = function List_Real(x, operator) {
	x.__proto__ = Expression.List.Real.prototype;
	if(operator !== undefined) {
		x.operator = operator;
	}
	return x;
};
_ = extend(Expression.List.Real, Expression.List);

_.realimag = function (){
	return Expression.List.ComplexCartesian([
		this,
		Global.Zero
	]);
};
_.real = function (){
	return this;
};
_.imag = function (){
	return Global.Zero;
};
_.polar = function () {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
_.abs = function (){
	return Expression.List.Real([Global.abs, this]);
};
_.arg = function (){
	return Expression.List.Real([Global.arg, this]);
};
_['+'] = function (x) {
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
_['-'] = function (x) {
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return this;
		}
	}
	
	if (x === this) {
		return Global.Zero;
	}
	if (x instanceof Expression.List.Real) {
		if (x.operator === '@-') {
			return Expression.List.Real([this, x[0]], '+');
		}
		return Expression.List.Real([this, x], '-');
	}
	if (x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
		return Expression.List.Real([this, x], '-');
	}
	return this.realimag()['-'](x);
};
_['*'] = function (x) {
	
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
		if (this[0] instanceof Expression.Function) {
			
		}
		return Expression.List.Real([this, x], '*');
	}
	return x['*'](this);
	
};
_['/'] = function (x) {

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
_['%'] = function (x) {
	return Expression.List.Real([this, x], '%');
};
_['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return Expression.List.Real([this], '@-');
};
_['^'] = function (x) {
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0]['^'](x), this[1]['^'](x)], this.operator);
		}
	}
	return Expression.Symbol.Real.prototype['^'].call(this, x);
	
};
