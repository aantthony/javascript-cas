function Expression(e, c) {
	var n = language.parse(e, c);
	return n;
}

Expression.prototype = Object.create(Array.prototype);
Expression.prototype = {};
Expression.prototype.identity = function() {
    deprecated("Slow");
	return this;
};

Expression.prototype.toString = function() {
    deprecated("Slow");
	return this.toTypedString("text/latex").s;
};

Expression.prototype.constructor = Expression;

// =========== List ============ //
Expression.List = function(e, operator) {
    e.__proto__ = Expression.List.prototype;
	e.operator = operator;
	return e;
};
Expression.List.prototype = Object.create(Expression.prototype);
Expression.List.prototype.constructor = Expression.List;