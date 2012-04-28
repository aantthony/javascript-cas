Expression.Root = function NthRoot(x, n) {
	this.a = x;
	this.n = n;
};
Expression.Root.prototype = Object.create(Expression.NumericalReal);
Expression.Root.constructor = Expression.Root;
Expression.Root.prototype['*'] = function (x) {
	if (x.constructor === this.constructor) {
		
	} else {
		return x['*'](this);
	}
};
Expression.Root.prototype.__defineGetter__("value", function () {
	return Math.pow(this.a, 1 / this.n);
});
