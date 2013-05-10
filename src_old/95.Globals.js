var CartSine = new Expression.Function({
	default: function (x) {
		if(x instanceof Expression.NumericalReal
			|| x instanceof Expression.List.Real
			|| x instanceof Expression.Symbol.Real) {
			return new M.Expression.List.ComplexCartesian([Global.sin.default(x), Global.Zero]);
		} else {
			throw(new Error('Complex Sine Cartesian form not implemented yet.'));
		}
	}
});

Global['sin'] = new Expression.Function({
	default: function(x) {
		if(x instanceof Expression.NumericalReal) {
			return new Expression.NumericalReal(Math.sin(x.value));
		}
		if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
			return Expression.List.Real([Global.sin, x]);
		}
		return Expression.List([Global.sin, x]);
		
		/*
				// sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.ComplexNumerical(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
		*/
	},
	realimag: function () {
		return CartSine;
	},
	'text/latex': '\\sin',
	'text/javascript': 'Math.sin',
	'x-shader/x-fragment': 'sin',
	title: 'Sine Function',
	description: 'See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent',
	examples: ['\\sin (\\pi)'],
	related: ['cos', 'tan']
});
Global['cos'] = new Expression.Function({
	default: function(x) {
		if(x instanceof Expression.NumericalReal) {
			return new Expression.NumericalReal(Math.cos(x.value));
		}
		if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
			return Expression.List.Real([Global.cos, x]);
		}
		return Expression.List([Global.cos, x]);
		
	},
	derivative: Global.sin['@-'](),
	'text/latex': '\\cos',
	'text/javascript': 'Math.cos',
	'x-shader/x-fragment': 'cos',
	title: 'Cosine Function',
	description: 'Cosine Function desc',
	examples: ['\\cos (\\pi)'],
	related: ['sin', 'tan']
});

Global.sin.derivative = Global.cos;

Global['tan'] = new Expression.Function({
	symbolic: function (x) {
		//
	}
});
Global['log'] = new Expression.Function({
	default: function (x, assumptions) {

		if(x instanceof Expression.Integer && x.a === 1) {
			return Global.Zero;
		} else if(x instanceof Expression.Integer && x.a === 0) {
			return Global.Infinity['@-']();
		} else if(x instanceof Expression.NumericalReal) {
			var v = x.value;
			if(v > 0){
				return new Expression.NumericalReal(Math.log(v));
			}
		}

		if(assumptions && assumptions.positive) {
			return Expression.List.Real([Global.log, x]);
		}
		
		return Expression.List([Global.log, x]);
	},
	realimag: function (x) {
		return CartLog;
	},
	'text/latex': '\\log',
	'text/javascript': 'Math.log',
	'x-shader/x-fragment': 'log',
	title: 'Natural Logarithm',
	description: 'Base e. See http://en.wikipedia.org/wiki/Natural_logarithm',
	examples: ['\\log (ye^(2x))'],
	related: ['exp', 'Log']
});
var Half = new Expression.Rational(1, 2);
var CartLog = new Expression.Function({
	default: function (x) {
		return new Expression.List.ComplexCartesian([
			Global.log.default(x.abs()),
			x.arg()
		])['*'](Half);
	}
});
CartLog.__proto__ = Global.log;
Global['atan2'] = new Expression.Function({
	default: function(x) {
		if(! (x instanceof Expression.Vector)) {
			throw ('atan only takes vector arguments');
		}
		if(x[0] instanceof Expression.NumericalReal) {
			if(x[1] instanceof Expression.NumericalReal) {
				return new Expression.NumericalReal(Math.atan2(x[0].value, x[1].value));
			}
		}
		
		return new Expression.List.Real([Global.atan2, x]);
		
		return Expression.List([Global.atan2, x]);
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		return [Expression.List([Global.atan2, x]), M.Global.Zero];
	},
	'text/latex': '\\tan^{-1}',
	'text/javascript': 'Math.atan2',
	'x-shader/x-fragment': 'atan',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Two argument arctangent function',
	description: 'Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2'
});

Global['atan'] = Global.atan2;

Global['Gamma'] = {
	default: function(x){
		function gammln(xx) {
		    var j;
		    var x, tmp, y, ser;
		    var cof = [
				57.1562356658629235,
				-59.5979603554754912,
				14.1360979747417471,
				-0.491913816097620199,
				0.339946499848118887e-4,
				0.465236289270485756e-4,
				-0.983744753048795646e-4,
				0.158088703224912494e-3,
				-0.210264441724104883e-3,
				0.217439618115212643e-3,
				-0.164318106536763890e-3,
				0.844182239838527433e-4,
				-0.261908384015814087e-4,
				0.368991826595316234e-5
			];
		    if (xx <= 0){
		        throw('bad arg in gammln');
		    }
		    y = x = xx;
		    tmp = x + 5.24218750000000000;
		    tmp = (x + 0.5) * Math.log(tmp) - tmp;
		    ser = 0.999999999999997092;
		    for (j = 0; j < 14; j++){
		        ser += cof[j] / ++y;
		    }
		    return tmp + Math.log(2.5066282746310005 * ser / x);
		}
		if (x instanceof Expression.Integer) {
			var v = x.a;
			if(v < 0) {
				return Global.ComplexInfinity;
			}
			if(v < 15) {
				var p = 1;
				var i = 0;
				for(i = 1; i < v; i++) {
					p *= i;
				}
				return new Expression.Integer(p);
			}
			return Expression.List.Real([Global.Gamma, x]);
		} else if (x instanceof Expression.NumericalReal) {
			var v = x.value;
			if (v === 0) {
		        return Global.Infinity;
		    } else if(v < 0) {
				return new Expression.NumericalReal(-Math.PI / (v * Math.sin(Math.PI * v) * Math.exp(gammln(-v))));
		    }
			return new Expression.NumericalReal(Math.exp(gammln(v)));
		} else if(x instanceof Expression.NumericalComplex) {
			
		}
		return Expression.List([Global.Gamma, x]);
	},
	'text/latex': '\\Gamma',
	'text/javascript': 'M.Global.Gamma.f',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Gamma Function',
	description: 'See http://en.wikipedia.org/wiki/Gamma_function',
	examples: ['\\Gamma (x)', 'x!'],
	related: ['Log', 'LogGamma']
};
Global['Re'] = {
	default: function(x) {
		return x.real();
	},
	apply_realimag: function(op, x) {
		return [x.real(), Global.Zero];
	},
	'text/latex': '\\Re'
};
Global['Im'] = {
	default: function(x) {
		return x.imag();
	},
	distributed_under_differentiation: true,
	apply_realimag: function(op, x) {
		return [x.imag(), Global.Zero];
	},
	'text/latex': '\\Im'
}
Expression.List.Real.prototype.positive = function () {
	if(this.operator === '+') {
		return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
	}
	if(this.operator === '*') {
		if(this[0] === this[1]) {
			return true;
		}
		return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
	}
	if(this.operator === '^') {
		if(this[1] instanceof Expression.Rational) {
			var f = this[1].reduce();
			if(f.a % 2 === 0) {
				return true;
			}
		}
	}
	return false;
};
Expression.NumericalReal.prototype.positive = function () {
	return this.value > 0;
};
Global['sqrt'] = new Expression.Function({
	default: function (x) {
		if (x instanceof Expression.NumericalReal) {
			var v = x.value;
			if(v < 0) {
				return new Expression.List.ComplexCartesian([
					Global.Zero, new Expression.NumericalReal(Math.sqrt(v))
				]);
			}
			return new Expression.NumericalReal(Math.sqrt(v));
		} else if (x instanceof Expression.List.Real) {
			if(x.positive()) {
				return Expression.List.Real([Global.sqrt, x]);
			} else {
				return Expression.List([Global.sqrt, x]);
			}
		} else if (x instanceof Expression.List.ComplexPolar) {
			return new Expression.List.ComplexPolar([
				x[0],
				x[1]['/'](new Expression.Integer(2))
			]);
		} else if (x instanceof Expression.List.ComplexCartesian) {
			return new Expression.List([Global.sqrt, x]);
		}
		return Expression.List([Global.sqrt, x]);
		throw('SQRT: ???');
		switch (x.constructor) {
			case Expression.Complex:
				//http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
				var sgn_b;
				if (x._imag === 0.0) {
					return new Expression.Complex(Math.sqrt(x._real), 0);
				} else if(x._imag>0) {
					sgn_b = 1.0;
				} else {
					sgn_b = -1.0;
				}
				var s_a2_b2 = Math.sqrt(x._real * x._real + x._imag * x._imag);
				var p = one_on_rt2 * Math.sqrt(s_a2_b2 + x._real);
				var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - x._real);
			case Expression.NumericalReal:
				return new Expression.RealNumerical(Math.sqrt(x));
			case Expression.List.Real:
			case Expression.List:
				if (x.operator === '^') {
					return Global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
				}
			default:
				return Expression.List([Global.sqrt, x]);
		}
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		
		//Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
		return x['^'](new Expression.Rational(1, 2)).realimag();
		//var ri = x.realimag();
		//return [Expression.List([Global.sqrt, x]), M.Global.Zero];
	},
	'text/latex': '\\sqrt',
	'text/javascript': 'Math.sqrt',
	'x-shader/x-fragment': 'sqrt',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Sqrt Function',
	description: 'See http://en.wikipedia.org/wiki/Square_Root',
	examples: ['\\sqrt (x^4)'],
	related: ['pow', 'abs', 'mod']
});
Global['abs'] = new Expression.Function({
	default: function (x) {
		//Using abs is better (I think) because it finds the method through the prototype chain,
		//which is going to be faster than doing an if list / switch case list.
		return x.abs();
	},
	'text/latex': '\\abs',
	'text/javascript': 'Math.abs',
	'x-shader/x-fragment': 'abs',
	titie: 'Absolute Value Function',
	description: 'Abs',
	examples: ['\\abs (-3)', '\\abs (i+3)'],
	related: ['arg', 'tan']
});

// It is self-referential
Global.abs.derivative = (function () {
		var s = new Expression.Symbol.Real();
		var y = s['/'](s.abs());
		return new Expression.Function.Symbolic(y, [s]);
}());
Global['arg'] = {
	default: function (x) {
		console.warn('ARG IS FOR USER INPUT ONLY. USE .arg()');
		//Using abs is better (I think) because it finds the method through the prototype chain,
		//which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
		return x.arg();
	},
	'text/latex': '\\arg', //temp
	'text/javascript': 'Math.arg_real',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	titie: 'Arg Function',
	description: 'Arg',
	examples: ['\\arg (-3)', '\\arg (3)', '\\arg(3+2i)'],
	related: ['abs']
}



Global['e'] = new Expression.NumericalReal(Math.E, 0);
Global['e'].title = 'e';
Global['e'].description = 'The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.';
Global.e.s = function (lang) {
	if(lang === 'text/javascript') {
		return new Code('Math.E');
	}
	if(lang == 'text/latex') {
		return new Code('e');
	}
	return new Code('2.718281828459045');
};


Global['pi'] = new Expression.NumericalReal(Math.PI, 0);
Global['pi'].title = 'Pi';
Global['pi'].description = '';
Global.pi.s = function (lang) {
	if(lang === 'text/javascript') {
		return new Code('Math.PI');
	}
	if(lang === 'text/latex') {
		return new Code('\\pi');
	}
	return new Code('3.141592653589793');
};
// The real circle constant:
Global.tau = Global['pi']['*'](new Expression.Integer(2));

Global['Infinity'] = new Expression.NumericalReal(Infinity, 0);
Global['Infinity'].title = 'Infinity';
Global['Infinity'].description = '';
Global['infty'] = Global.Infinity;


Global['Zero'] = new Expression.Integer(0);
Global['Zero'].title = 'Zero';
Global['Zero'].description = 'Additive Identity';
Global['Zero']['*'] = function (x) {
	return Global.Zero;
};
Global['Zero']['+'] = function (x) {
	return x;
};
Global['Zero']['@-'] = function (x) {
	return this;
};

Global['Zero']['-'] = function (x) {
	return x['@-']();
};

Global['One'] = new Expression.Integer(1);
Global['One'].title = 'One';
Global['One'].description = 'Multiplicative Identity';
Global['One']['*'] = function (x) {
	return x;
};

Global.log.derivative = new Expression.Function.Symbolic(Global.One['/'](new Expression.Symbol.Real()));

Global['i'] = new Expression.List.ComplexCartesian([Global['Zero'], Global['One']]);
Global['i'].title = 'Imaginary Unit';
Global['i'].description = 'A number which satisfies the property <m>i^2 = -1</m>.';
Global['i'].realimag = function(){
	return Expression.List.ComplexCartesian([
		Global.Zero,
		Global.One
	]);
};
Global['i']['*[TODO]'] = function (x) {
	
};

Global['d'] = new Expression.Function({
	default: function(x) {
		return new Infinitesimal(x);
	}
});

Global.d['/'] = function (x) {
	if(x instanceof Infinitesimal) {
		if(x.x instanceof Expression.Symbol) {
	
			// Derivative operator
			
			return new Derivative(x.x);
		}
		if(x.x instanceof Expression.Vector) {
			return Expression.Vector(Array.prototype.map.call(x.x, function (x) {
				return new Derivative(x);
			}));
		}
		throw('Confusing infitesimal division');
	}

	throw('Dividing d by some large number.');
	
};
Global['undefined'] = {
	s: function (lang){
		if (lang === 'text/javascript') {
			return new Code('undefined');
		} else if (lang === 'x-shader/x-fragment') {
			return new Code('(1.0/0.0)');
		}
	},
	differentiate: function (){
		return this;
	},
	'*': function (){
		return this;
	},
	'+': function (){
		return this;
	},
	'-': function () {
		return this;
	},
	'/': function () {
		return this;
	},
	'^': function () {
		return this;
	},
	'@-': function () {
		return this;
	}
};
Global['sum'] = new Expression.Function({
	default: function (x) {
		throw('Sum not properly constructed yet.');
		return 3;
	}
});
Global['sum']['_'] = function (eq) {
	// start: 
	var t = eq[0];
	var v = eq[1];
	return new Expression.Sum.Real(t, v);
}