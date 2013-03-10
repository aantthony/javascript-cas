Expression.Constant = function() {
	throw new Error('Expression.Constant created directly');
};
_ = extend(Expression.Constant, Expression);
_.simplify = function() {
	return this;
};
_.differentiate = function() {
	return Global.Zero;
};
_.default = function (x){
	return this['*'](x);
};