function Statement(x, y, operator) {
	this.a = x;
	this.b = y;
	this.operator = operator;
}
Statement.prototype = Object.create(Expression.prototype);
Statement.prototype.constructor = Statement;
Statement.prototype['='] = function () {
	
};
Statement.prototype['<'] = function () {
	
};
Statement.prototype.solve = function (vars) {
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