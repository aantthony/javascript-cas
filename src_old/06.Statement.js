Expression.TruthValue = function TruthValue(v) {

};

_ = extend(Expression.TruthValue, Expression);

Expression.True = new Expression.TruthValue();
Expression.False = new Expression.TruthValue();

//Only difference: NOT operator
Expression.False['~'] = function () {
	return Expression.True;
};

// negation operator
_['~'] = function () {
	return Expression.False;
};

// disjunction
_['V'] = function (e) {
	return e === Expression.True ? e : this;
};

// conjunction
_['^'] = function (e) {
	return e === Expression.True ? this : e;
};


Expression.Statement = function (x, y, operator) {
	var arr = [x,y];
	arr.operator = operator;
	
	// subclass an array
	arr.__proto__ = Expression.Statement.prototype;
	return arr;
};
//todo: truth value type?
_ = extend(Expression.Statement, Expression);

_['='] = function () {
	
};
_['<'] = function () {
	// a < b < c
	// (a < b) = b
	// b < c
	
	// a < (b < c)
	// a < b .. (b < c) = b
	// (a < b) = a.
};
_.solve = function (vars) {
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