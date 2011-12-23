Expression.prototype.mod2 = function(){
	return this
		.apply('*',
			this.conjugate()
		);
};
Expression.prototype.abs = function(){
	return this.mod2().apply("\u221A");
};