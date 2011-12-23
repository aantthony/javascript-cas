function Expression(e, c){
	var n = [];
	n.__proto__ = Expression.prototype;
	language.parse(e, c, n);
	return n;
}
function ExpressionWithArray(e, operator){
	e.__proto__ = Expression.prototype;
	e.operator = operator;
}
Expression.prototype = Object.create(Array.prototype);

Expression.prototype.identity = function(){
	return this;
};

Expression.prototype.toString = function(){
	return "[Expression " + '?' + "]";
};