/*
 Contexts contain the set of all current variables, and restrictions/assumptions on their type and value.
 
 Contradictions should perhaps trigger an error. (e.g., storing y = 2x+1, and y = 2x + 2 in the same context)
*/

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