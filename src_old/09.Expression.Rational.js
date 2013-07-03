Expression.Rational = function Rational(a, b) {
	this.a = a;
	this.b = b;
};
_ = extend(Expression.Rational, Expression.NumericalReal); // --> constant

_.__defineGetter__("value", function () {
	return this.a / this.b;
});
_['+'] = function (x) {
	if(this.a === 0) {
		return x;
	}
	if(x instanceof Expression.Rational){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b + this.b * x.a, this.b * x.b);
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.NumericalComplex(this.value + x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['+'](this);
	} else {
		console.warn('Swapped operator order for + with Rational');
		return (x)['+'](this);
		throw ('Unknown Type for Rational +');
	}
	
	
};
_['-'] = function (x) {
	if(this.a === 0) {
		return x['@-']();
	}
	if(x instanceof Expression.Rational){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b - this.b * x.a, this.b * x.b);
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.NumericalComplex(this.value - x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x['@-']())['+'](this);
	} else {
		console.warn('Swapped operator order for - with Rational');
		return (x)['+'](this);
		throw ('Unknown Type for Rational +');
	}
};

_['*'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		return new Expression.Rational(this.a * x.a, this.b * x.b);
	}
	return this.__proto__.__proto__['*'].call(this, x);
};


_['/'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		if (x.a === 0) {
			throw('Division By Zero is not defined for Rational numbers!');
		}
		return new Expression.Rational(this.a * x.b, this.b * x.a).reduce();
	}
	return Expression.NumericalReal.prototype['/'].call(this, x);
};
_['^'] = function (x) {
	if(x === Global.Zero) {
		return Global.One;
	}
	if(x === Global.One) {
		return this;
	}
	if(this.a === 0) {
		return Global.Zero;
	}
	if(this.a === this.b) {
		return Global.One;
	}
	if(x instanceof Expression.Integer) {
		return new Expression.Rational(
			Math.pow(this.a, x.a),
			Math.pow(this.b, x.a)
		);
	} else if (x instanceof Expression.Rational) {
		
		var f = x.reduce();
		if(f.a % 2 == 0) {
			return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
		}

		return Expression.NumericalReal.prototype['^'].call(
			this,
			x
		);
		
	}

	return Expression.List([this, x], '^');
	
};
_.reduce = function () {
	// mutable.
	function gcd(a, b) {
		if(b === 0) {
			return a;
		}
		return gcd(b, a % b);
	}
	var g = gcd(this.b, this.a);
	this.a /= g;
	this.b /= g;
	if(this.b === 1) {
		return new Expression.Integer(this.a);
	}
	if(this.b < 0) {
		this.a = -this.a;
		this.b = -this.b;
	}
	
	return this;
};
