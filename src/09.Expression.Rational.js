Expression.Rational = function Rational(a, b) {
	this.a = a;
	this.b = b;
};
Expression.Rational.prototype = Object.create(Expression.NumericalReal.prototype); // --> constant
Expression.Rational.prototype.constructor = Expression.Rational;
Expression.Rational.prototype.__defineGetter__("value", function () {
	return this.a / this.b;
});
Expression.Rational.prototype['+'] = function (x) {
	if(this.a === 0) {
		return x;
	}
	if(x.constructor === this.constructor){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b + this.b + x.a, this.b * x.b);
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
Expression.Rational.prototype['-'] = function (x) {
	if(this.a === 0) {
		return x['@-']();
	}
	if(x.constructor === this.constructor){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b - this.b + x.a, this.b * x.b);
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

Expression.Rational.prototype['*'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		return new Expression.Rational(this.a * x.a, this.b * x.b);
	}
	return this.__proto__['*'](x);
};


Expression.Rational.prototype['/'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		if (x.a === 0) {
			throw('Division By Zero is not defined for Rational numbers!');
		}
		return new Expression.Rational(this.a * x.b, this.b * x.a).reduce();
	}
	return this.__proto__['*'](x);
};
Expression.Rational.prototype['^'] = function (x) {
	if(this.a === 0) {
		return Global.Zero;
	}
	if(this.a === 1) {
		if(this.b === 1) {
			return this;
		} else {
			if (x.constructor === this.constructor) {
				/*
				(1/x) ^(a/b)
				*/
				return Expression.List.Real([new Expression.Rational(1, Math.pow(this.b, x.a)), new Expression.Rational(1, x.b)], '^');
			}
		}
	}
};
Expression.Rational.prototype.reduce = function () {
	function gcd(a, b) {
		if(b === 0) {
			return a;
		}
		return gcd(b, a % b);
	}
	var g = gcd(this.b, this.a);
	this.a /= g;
	this.b /= g;
	return this;
};
