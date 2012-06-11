Expression.Constant = function() {
	throw new Error('Expression.Constant created directly');
};
_ = Expression.Constant.prototype = Object.create(Expression.prototype);
_.simplify = function() {
	return this;
};
_.differentiate = function() {
	return M.Global.Zero;
};
_.default = function (x){
	return this['*'](x);
};