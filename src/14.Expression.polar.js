Expression.prototype.polar = function() {
	var ri = this.realimag();
	return [
		ri[0].apply("*", ri[0]).apply("+", ri[1].apply("*", ri[1])),
		Global.atan2.apply(undefined, Expression.Vector([ri[1],r[0]]))
	];
};