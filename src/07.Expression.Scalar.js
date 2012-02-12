Expression.Constant = function() {
	throw new Error("Expression.Scalar created");
};
Expression.Constant.prototype = Object.create(Expression.prototype);

Expression.Constant.prototype.simplify = function() {
	return this;
};
Expression.Constant.prototype.differentiate = function() {
	return new Expression.Numerical(0, 0);
};
