Expression.prototype.polar = function() {
	///TODO: should this just be the complex cartesian one?
	var ri = this.realimag();
	return Expression.List.ComplexPolar([
		ri[0].apply("*", ri[0]).apply("+", ri[1].apply("*", ri[1])),
		Global.atan2.apply(undefined, Expression.Vector([ri[1],r[0]]))
	]);
};
//TODO: DUPLICATED (OVERWRITTEN)
Expression.prototype.abs = function() {
	var ri = this.realimag();
	return ri[0].apply("*", ri[0]).apply("+", ri[1].apply("*", ri[1]));
};
Expression.prototype.arg = function() {
	var ri = this.realimag();
	return Global.atan2.apply(undefined, Expression.Vector([ri[1],r[0]]));
};