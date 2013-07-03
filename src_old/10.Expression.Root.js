Expression.Root = function NthRoot(x, n) {
	this.a = x;
	this.n = n;
};
_ = Expression.Root.prototype = Object.create(Expression.NumericalReal);
_.constructor = Expression.Root;
_['*'] = function (x) {
	if (x.constructor === this.constructor) {
		
	} else {
		return x['*'](this);
	}
};
_.__defineGetter__("value", function () {
	return Math.pow(this.a, 1 / this.n);
});
