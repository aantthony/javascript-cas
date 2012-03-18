Expression.Constant = function() {
	throw new Error('Expression.Constant created directly');
};
Expression.Constant.prototype = Object.create(Expression.prototype);
Expression.Constant.prototype.simplify = function() {
	return this;
};
Expression.Constant.prototype.differentiate = function() {
	return M.Global.Zero;
};
Expression.Constant.prototype.default = function (x){
	return this['*'](x);
};