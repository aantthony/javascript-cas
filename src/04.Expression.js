function Expression(e, c){
	this.push(3);
	//Expression.parse(this, e, c);
}
Expression.prototype = Object.create(Array.prototype);

Expression.prototype.identity = function(){
	return this;
};
