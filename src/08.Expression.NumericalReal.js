Expression.NumericalReal = function(e) {
	this.value = e;
};

Expression.NumericalReal.prototype = Object.create(Expression.Constant.prototype);
Expression.NumericalReal.prototype.valueOf = function() {
	return this.value;
}
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
	if(x === undefined){
		//Unary
		switch (operator) {
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
				return new Expression.NumericalReal(this.value * x);
			case '+':
				return new Expression.NumericalReal(this.value + x);
			case '-':
				return new Expression.NumericalReal(this.value - x);
			case '/':
				return new Expression.NumericalReal(this.value / x);
			case '^':
				return new Expression.NumericalReal(Math.pow(this.value, x));
			default:
			
		}
	} else if (x.constructor === Expression.Complex) {
		switch (operator) {
			case '*':
			case undefined:
				// (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
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

			    var hlm = 0.5 * Math.log(a*a);
			    var hmld_tc = hlm * d;
			    var e_hmlc_td = Math.exp(hlm * c);
                return new Expression.Complex(
                    (e_hmlc_td * Math.cos(hmld_tc)),
			        (e_hmlc_td * Math.sin(hmld_tc))
                );
			default:
		}
	}
	
	switch (operator){
		case "^":
			if(this.value === 0) {
				return Global.Zero; // Contradicts x^0 = 1
			}
			break;
		case "+":
		case "-":
			if(this.value === 0) {
				return x;
			}
			break;
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
	return Expression.List([this, xs], operator);
};
Expression.NumericalReal.prototype.constructor = Expression.NumericalReal;
