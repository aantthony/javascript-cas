Expression.NumericalReal = function(e){
	this.value = e;
};

Expression.NumericalReal.prototype = Object.create(Expression.Scalar.prototype);
Expression.NumericalReal.prototype.valueOf = function(){
	return this.value;
}
Expression.NumericalReal.prototype.NumericalReal = function(){
	return this;
};
Expression.NumericalReal.prototype.imag = function(){
	return new Expression.NumericalReal(0);
};
Expression.NumericalReal.prototype.conjugate = function(){
	return this;
};
Expression.NumericalReal.prototype.apply = function(operator, argument){
	if(argument.constructor === this.constructor){
		switch(operator){
			case '*':
				return new Expression.NumericalReal(this * argument);
			case '+':
				return new Expression.NumericalReal(this + argument);
			case '-':
				return new Expression.NumericalReal(this - argument);
			case '/':
				return new Expression.NumericalReal(this / argument);
			case '^':
				return new Expression.NumericalReal(Math.pow(this, argument));
			default:
				
		}
	}
	return ExpressionWithArray([this, arguments], operator);
};
Expression.NumericalReal.prototype.constructor = Expression.NumericalReal;
