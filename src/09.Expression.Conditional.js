Expression.Conditional = function (cond, a, b) {
	this.cond = code;
	this.a = a;
	this.b = b;
};
_ = Expression.Conditional.prototype = Object.create(Expression.prototype);
_.constructor = Expression.Conditional;
