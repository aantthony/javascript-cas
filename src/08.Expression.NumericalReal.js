Expression.NumericalReal = function NumericalReal(e) {
	this.value = e;
};

Expression.NumericalReal.prototype = Object.create(Expression.Constant.prototype);
Expression.NumericalReal.prototype.valueOf = null;
Expression.NumericalReal.prototype.real = function() {
	return this;
};
Expression.NumericalReal.prototype.imag = function() {
	return Global.Zero;
};
Expression.NumericalReal.prototype.realimag = function() {
	return [
		this,
		Global.Zero
	];
};
Expression.NumericalReal.prototype.conjugate = function() {
	return this;
};
Expression.NumericalReal.prototype.apply = function(operator, x) {
	
	switch (operator){
		case ",":
			return Expression.Vector([this, x]);
		case "^":
			if(this.value === 0) {
				return Global.Zero; // Contradicts x^0 = 1
			}
			break;
		case "+":
			if(this.value === 0) {
				return x;
			}
			break;
		case "-":
			if(this.value === 0) {
				return x.apply('@-');
			}
			break;
		case undefined:
		case "*":
			if(this.value === 1){
				return x;
			}
			//Note: There is not meant to be a break here.
		case "/":
			if(this.value === 0){
				return Global.Zero; //Contradics x/0 = Infinity
			}
	}
	if(x === undefined){
		//Unary
		switch (operator) {
			case "@+":
				return this;
			case "@-":
				return new Expression.NumericalReal(-this.value);
			case "++":
			case "--":
				throw(new TypeError("Postfix " +operator + " operator applied to value that is not a reference."));
			case "+=":
			case "-=":
			case "*=":
			case "/=":
				throw(new ReferenceError("Left side of assignment is not a reference."));
			case "!":
				return Global.Gamma.apply(undefined, new Expression.NumericalReal(this.value + 1));
		}
	} else if(x.constructor === this.constructor){
		switch (operator) {
			case '*':
			case undefined:
				return new Expression.NumericalReal(this.value * x.value);
			case '+':
				return new Expression.NumericalReal(this.value + x.value);
			case '-':
				return new Expression.NumericalReal(this.value - x.value);
			case '/':
				return new Expression.NumericalReal(this.value / x.value);
			case '^':
				if(this.value > 0) {
					return new Expression.NumericalReal(Math.pow(this.value, x.value));
				} else {
					// TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
					var r = Math.pow(-this.value, x.value)
					var theta = Math.PI * x.value;
					return new Expression.Complex(r*Math.cos(theta), r*Math.sin(theta));
				}
			default:
			
		}
	} else if (x.constructor === Expression.Complex) {
		switch (operator) {
			case '*':
			case undefined:
				return new Expression.Complex(this.value * x._real, this.value * x._imag);
			case '+':
				return new Expression.Complex(this.value + x._real, x._imag);
			case '-':
				return new Expression.Complex(this.value - x._real, -x._imag);
			case '/':
				var cc_dd = x._real * x._real + x._imag * x._imag;
				return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value*x._imag)/cc_dd);
			case '^':
			    var a = this.value;
			    var c = x._real;
			    var d = x._imag;
				console.error("Bad implementation ( num ^ complex)");
			    var hlm = 0.5 * Math.log(a*a);
			    var hmld_tc = hlm * d;
			    var e_hmlc_td = Math.exp(hlm * c);
                return new Expression.Complex(
                    (e_hmlc_td * Math.cos(hmld_tc)),
			        (e_hmlc_td * Math.sin(hmld_tc))
                );
			default:
		}
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		switch (operator) {
			case "+":
			case "-":
				return Expression.List.ComplexCartesian([
					x[0].apply(operator, this),
					x[1]
				]);
			case undefined:
				operator = "*";
			case "*":
			case "/":
				return Expression.List.ComplexCartesian([
					x[0].apply(operator, this),
					x[1].apply(operator, this)
				]);
			case "^":
				console.warn("ineffecient: NR ^ CL");
				return this.realimag().apply(operator, x);
			
		}
	} else if(x.constructor === Expression.List.ComplexPolar) {
		switch (operator) {
			case "+":
			case "-":
			case "^":
				//(a+bi)+Ae^(ik)
				return Expression.List([this, x], operator);
				// or ? return this.apply(operator, x.realimag()); //Jump up to above +-
			case undefined:
				operator = "*";
			case "*":
				return Expression.List.ComplexPolar([
					x[0].apply(operator, this),
					x[1]
				]);
			case "/":
				return Expression.List.ComplexPolar([
					x[0].apply(operator, this),
					x[1]
				]);
		}
	} else if (x.constructor === Expression.List.Real) {
		switch(operator) {
			case undefined:
				operator = "*";
			case "*":
			case "+":
			case "-":
			case "/":
				return Expression.List.Real([this, x], operator);
			case "^":
				if(this.value === 0){
					throw("N(0) ^ x");
				}
				if(this.value > 0) {
					return Expression.List.Real([this, x], operator);
				} else {
					return Expression.List.ComplexPolar([
						(new Expression.Numerical(-this.value)).apply("^", x),
						Global.pi.apply('*', x)
					]);
				}
		}
				
	} else if (x.constructor === Expression.Symbol.Real) {
		switch(operator) {
			case undefined:
				operator = "*";
			case "*":
			case "+":
			case "-":
			case "/":
				return Expression.List.Real([this, x], operator);
			case "^":
				if(this.value === 0){
					throw("N(0) ^ x");
				}
				if(this.value > 0) {
					return Expression.List.Real([this, x], operator);
				} else {
					return Expression.List.ComplexPolar([
						Expression.List.Real([(new Expression.NumericalReal(-this.value)), x], "^"),
						Global.pi.apply('*', x)
					]);
				}
		}
	}
	throw("?? - real");
	return Expression.List([this, x], operator);
};
Expression.NumericalReal.prototype.constructor = Expression.NumericalReal;
