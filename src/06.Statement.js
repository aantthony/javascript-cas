Expression.Statement = function (x, y, operator) {
	var arr = [x,y];
	arr.operator = operator;
	arr.__proto__ = Expression.Statement.prototype;
	return arr;
};
Expression.Statement.prototype = Object.create(Expression.prototype);
Expression.Statement.prototype.constructor = Expression.Statement;
Expression.Statement.prototype['='] = function () {
	
};
Expression.Statement.prototype['<'] = function () {
	// a < b < c
	// (a < b) = b
	// b < c
	
	// a < (b < c)
	// a < b .. (b < c) = b
	// (a < b) = a.
};
Expression.Statement.prototype.solve = function (vars) {
	// a = b
	// If b has an additive inverse?
	
	// a - b = 0
	var a_b = (this.a)['-'](this.b);
	/*
	Examples:
	(1,2,3) - (x,y,z) = 0 (solve for x,y,z)
	(1,2,3) - x = 0 (solve for x)
	*/
	return a_b.roots(vars);
};