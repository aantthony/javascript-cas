Expression.LambdaExpression = function (f){
	return {
		apply: function (op, e){
			return f.apply(e);
		},
		name: f.name
	};
	this.variables;
};
Expression.LambdaExpression.prototype = Object.create(Expression.prototype);

Expression.LambdaExpression.prototype.apply = function (operator) {
	
};