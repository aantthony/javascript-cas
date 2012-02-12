Expression.NumericalReal = function(e) {
	this.value = e;
};

Expression.NumericalReal.prototype = Object.create(Expression.Constant.prototype);
Expression.NumericalReal.prototype.valueOf = function() {
	return this.value;
}
Expression.NumericalReal.prototype.NumericalReal = function() {
	return this;
};
Expression.NumericalReal.prototype.imag = function() {
	return new Expression.NumericalReal(0);
};
Expression.NumericalReal.prototype.conjugate = function() {
	return this;
};
Expression.NumericalReal.prototype.apply = function(operator, argument) {
	if(argument === undefined){
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
	} else if(argument.constructor === this.constructor){
		switch (operator) {
			case '*':
				return new Expression.NumericalReal(this.value * argument);
			case '+':
				return new Expression.NumericalReal(this.value + argument);
			case '-':
				return new Expression.NumericalReal(this.value - argument);
			case '/':
				return new Expression.NumericalReal(this.value / argument);
			case '^':
				return new Expression.NumericalReal(Math.pow(this.value, argument));
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
				return argument;
			}
			break;
		case "*":
			if(this.value === 1){
				return argument;
			}
			//Note: There is not meant to be a break here.
		case "/":
			if(this.value === 0){
				return Global.Zero; //Contradics x/0 = Infinity
			}
	}
	return Expression.List([this, arguments], operator);
};
Expression.NumericalReal.prototype.constructor = Expression.NumericalReal;
