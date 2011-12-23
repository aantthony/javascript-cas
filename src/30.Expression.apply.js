Expression.prototype.apply = function(operator, /* Expression */ e){
	return ExpressionWithArray([this, e], operator);
};