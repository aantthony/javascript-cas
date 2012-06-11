function Context() {
	
}
_ = Context.prototype = Object.create(Global);
_.reset = function() {
	this.splice(0);
};
_.impliesExpression = function(expr) {
	return false;
};
_.learn = function(expr) {
	this.equations.push(expr);
};