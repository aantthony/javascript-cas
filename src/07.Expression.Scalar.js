Expression.Scalar = function(){
	throw new Error("Expression.Scalar created");
};
Expression.Scalar.prototype = Object.create(Expression.prototype);

Expression.Scalar.prototype.simplify = function(){
	return this;
};
Expression.Scalar.prototype.differentiate = function(){
	return new Expression.Numerical(0, 0);
};
