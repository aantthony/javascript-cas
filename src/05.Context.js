function Context(){
	
}
Context.prototype = Object.create(Global);
Context.prototype.reset = function(){
	this.splice(0);
};
Context.prototype.impliesExpression = function(expr){
	return false;
};
Context.prototype.learn = function(expr){
	this.equations.push(expr);
};