function Expression(e, c){
	var n = language.parse(e, c);
	return n;
}
function ExpressionWithArray(e, operator){
	e.__proto__ = Expression.prototype;
	e.operator = operator;
	return e;
}
Expression.prototype = Object.create(Array.prototype);
Expression.prototype = {};
Expression.prototype.identity = function(){
	return this;
};

Expression.prototype.toString = function(){
	return "[Expression " + '?' + "]";
};
Expression.prototype.constructor = Expression;