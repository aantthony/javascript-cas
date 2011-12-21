Expression.prototype.toTypedExpression = function(){
	return {
		s: this.join(this.type)
	};
};