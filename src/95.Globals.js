//Define symbolic functions here:
//The apply has nothing to do with Function.prototype.apply, for now.

Global.sin = {
	apply: function(op, x) {
		switch (x.constructor) {
			case Expression.Complex:
				// sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.Complex(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
			case Expression.NumericalReal:
				return new Expression.NumericalReal(Math.sin(x));
			case Expression.List.Real:
			case Expression.Symbol.Real:
				return Expression.List.Real([Global.sin, x]);
			default:
				return Expression.List([Global.sin, x]);
		}
	},
	apply_realimag: function(op, x) {
		switch (x.constructor) {
			case Expression.Complex:
				throw("???");
			case Expression.NumericalReal:
				throw("???");
			case Expression.List:
				var ri = x.realimag();
				var exp_b = Global.e.apply("^", ri[1]);
				var one_o_exp_b = Global.One.apply("/", exp_b);
				var two = new Expression.NumericalReal(2);
				var cosh_b = exp_b.apply("+", one_o_exp_b).apply("/", two);
				var sinh_b = exp_b.apply("-", one_o_exp_b).apply("/", two);

				return [Global.sin.apply(undefined, ri[0]).apply("*", cosh_b),
					Global.cos.apply(undefined, ri[0]).apply("*", sinh_b)
				];
			default:
				console.error("realimag unchecked!");
				return [Expression.List([Global.sin, x]), M.Global.Zero];
		}
	},
	apply_differentiate: function(op, x, t) {
		return Global.cos.apply(undefined, x).apply("*", x.differentiate(t));
	},
	"text/latex": "\\sin",
	"text/javascript": "Math.sin",
	"x-shader/x-fragment": "sin",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Sine Function",
	description: "See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent",
	examples: ["\\sin (\\pi)"],
	related: ["cos", "tan"]
};
Global.cos = {
	apply: function(op, x) {
		switch (x.constructor) {
			case Expression.Complex:
				// cos(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.Complex(Math.cos(x._real) * cosh_b, -Math.sin(x._real) * sinh_b);
			case Expression.NumericalReal:
				return new Expression.NumericalReal(Math.cos(x));
			case Expression.List.Real:
			case Expression.Symbol.Real:
				return Expression.List.Real([Global.cos, x]);
			default:
				return Expression.List([Global.cos, x]);
		}
	},
	apply_realimag: function(op, x) {
		switch (x.constructor) {
			case Expression.Complex:
				throw("???");
			case Expression.NumericalReal:
				throw("???");
			case Expression.List:
				var ri = x.realimag();
				var exp_b = Global.e.apply("^", ri[1]);
				var one_o_exp_b = Global.One.apply("/", exp_b);
				var two = new Expression.NumericalReal(2);
				var cosh_b = exp_b.apply("+", one_o_exp_b).apply("/", two);
				var nsinh_b = one_o_exp_b.apply("-", exp_b).apply("/", two);

				return [Global.cos.apply(undefined, ri[0]).apply("*", cosh_b),
					Global.sin.apply(undefined, ri[0]).apply("*", nsinh_b)
				];
			default:
				console.error("realimag unchecked!");
				return [Expression.List([Global.cos, x]), M.Global.Zero];
		}
	},
	apply_differentiate: function(op, x, t) {
		return Global.sin.apply(undefined, x).apply("*", x.differentiate(t)).apply('*', new Expression.NumericalReal(-1));
	},
	"text/latex": "\\cos",
	"text/javascript": "Math.cos",
	"x-shader/x-fragment": "cos",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Cosine Function",
	description: "Cosine Function desc",
	examples: ["\\cos (\\pi)"],
	related: ["sin", "tan"]
};
Global.log = {
	apply: function (op, x, assumptions) {
		switch (x.constructor) {
			case Expression.Complex:
				throw("Not ready Type!: " + x.constructor);
			case Expression.NumericalReal:
				if(x.value > 0){
					return new Expression.NumericalReal(Math.log(x));
				}
				throw("-Log");
			case Expression.List.Real:
			case Expression.Symbol.Real:
				if(assumptions && massumptions.positive) {
					return Expression.List.Real([Global.log, x]);
				}
			default:
				
				return Expression.List([Global.log, x]);
		}
	},
	apply_realimag: function(op, x) {
		switch (x.constructor) {
			case Expression.List:
				var ri = x.realimag();

			default:
				console.error("realimag unchecked!");
				return [Expression.List([Global.log, x]), M.Global.Zero];
		}
	},
	differentiate: function(x) {
		return Global.One.apply("/", x);
	},
	apply_differentiate: function(op, x, t) {
		return Global.One.apply("/", x).apply("*", x.differentiate(t));
		return Global.cos.apply(undefined, x).apply("*", x.differentiate(t));
	},
	"text/latex": "\\log",
	"text/javascript": "Math.log",
	"x-shader/x-fragment": "log",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Natural Logarithm",
	description: "Base e. See http://en.wikipedia.org/wiki/Natural_logarithm",
	examples: ["\\log (ye^(2x))"],
	related: ["exp", "Log"]
};
Global.atan2 = {
	apply: function(op, x) {
		console.log("Apply atan2");
		switch (x[0].constructor) {
			case Expression.Complex:
				switch (x[1].constructor) {
					case Expression.Complex:
						throw("???");
					case Expression.NumericalReal:
						throw("???");
				}
			case Expression.NumericalReal:
				switch (x[1].constructor) {
					case Expression.Complex:
						throw("???");
					case Expression.NumericalReal:
						return new Expression.NumericalReal(Math.atan2(x[0], x[1]));
				}
			case Expression.List.Real:
				return Expression.List.Real([Global.atan2, x]);
			default:
				switch(x[1].constructor) {
					case Expression.Complex:
						if(x[1]._real === 0 && x[1]._imag === 0) {
							
						}
					case Expression.NumericalReal:
						if(x[1].value === 0) {
							
						}
				}
		}
		return Expression.List([Global.atan2, x]);
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		return [Expression.List([Global.atan2, x]), M.Global.Zero];
	},
	"text/latex": "\\atan2",
	"text/javascript": "Math.atan2",
	"x-shader/x-fragment": "atan",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Two argument arctangent function",
	description: "Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2"
};
Global.atan = Global.atan2;

Global.Gamma = {
	apply: function(op, x){
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
		        throw("bad arg in gammln");
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
		switch(x.constructor) {
			case Expression.Complex:
				return new Expression.Complex(5,3);
			case Expression.NumericalReal:
				x += 0;
				if (x === 0) {
			        return Global.Infinity;
			    } else if(x < 0) {
					return new Expression.NumericalReal(-Math.PI / (x * Math.sin(Math.PI * x) * Math.exp(gammln(-x))));
			    }
				return new Expression.NumericalReal(Math.exp(gammln(x)));
			default:
				return Expression.List([Global.Gamma, x]);
		}
	},
	"text/latex": "\\Gamma",
	"text/javascript": "M.Global.Gamma.f",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Gamma Function",
	description: "See http://en.wikipedia.org/wiki/Gamma_function",
	examples: ["\\Gamma (x)", "x!"],
	related: ["Log", "LogGamma"]
};
Global.Re = {
	apply: function(op, x) {
		return x.real();
	},
	apply_realimag: function(op, x) {
		return [x.real(), Global.Zero];
	},
	"text/latex": "\\Re"
};
Global.Im = {
	apply: function(op, x) {
		return x.imag();
	},
	distributed_under_differentiation: true,
	apply_realimag: function(op, x) {
		return [x.imag(), Global.Zero];
	},
	"text/latex": "\\Im"
}
Global.sqrt = {
	apply: function (op, x) {
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
			case Expression.List:
				if (x.operator === "^") {
					return Global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
				}
			default:
				return Expression.List([Global.sqrt, x]);
		}
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		
		//Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
		return x.apply("^", new Expression.NumericalReal(0.5,0)).realimag();
		//var ri = x.realimag();
		//return [Expression.List([Global.sqrt, x]), M.Global.Zero];
	},
	"text/latex": "\\sqrt",
	"text/javascript": "Math.sqrt",
	"x-shader/x-fragment": "sqrt",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: "Sqrt Function",
	description: "See http://en.wikipedia.org/wiki/Square_Root",
	examples: ["\\sqrt (x^4)"],
	related: ["pow", "abs", "mod"]
};
Global.abs = {
	apply: function (op, x) {
			console.warn("ABS IS FOR USER INPUT ONLY. USE .abs()");
			//Using abs is better (I think) because it finds the method through the prototype chain,
			//which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
			return x.abs();
		}
	},
	"text/latex": "\\abs", //temp
	"text/javascript": "Math.abs",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	titie: "Absolute Value Function",
	description: "Abs",
	examples: ["\\abs (-3)", "\\abs (i+3)"],
	related: ["arg", "tan"]
};
Global.arg = {
	apply: function (op, x) {
			console.warn("ARG IS FOR USER INPUT ONLY. USE .arg()");
			//Using abs is better (I think) because it finds the method through the prototype chain,
			//which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
			return x.arg();
		}
	},
	"text/latex": "\\arg", //temp
	"text/javascript": "Math.arg_real",
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	titie: "Arg Function",
	description: "Arg",
	examples: ["\\arg (-3)", "\\arg (3)", "\\arg(3+2i)"],
	related: ["abs"]
}



Global.e = new Expression.NumericalReal(Math.E, 0);
Global.e.title = "e";
Global.e.description = "The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.";


Global.pi = new Expression.NumericalReal(Math.PI, 0);
Global.pi.title = "Pi";
Global.pi.description = "";



Global.Infinity = new Expression.NumericalReal(Infinity, 0);
Global.Infinity.title = "Infinity";
Global.Infinity.description = "";

Global.Zero = new Expression.NumericalReal(0, 0);
Global.Zero.title = "Zero";
Global.Zero.description = "Additive Identity";

Global.One = new Expression.NumericalReal(1, 0);
Global.One.title = "One";
Global.One.description = "Multiplicative Identity";

Global.i = new Expression.Complex(0, 1);
Global.i.title = "Imaginary Unit";
Global.i.description = "A number which satisfies the property <m>i^2 = -1</m>.";
Global.i.realimag = function(){
	return Expression.List.ComplexCartesian([
		Global.Zero,
		Global.One
	]);
};