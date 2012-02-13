/*
	This type is an attempt to avoid having to call .realimag() down the tree all the time.
	
	Maybe this is a bad idea, because it will end up having:
	
	f(x) = >
	[
		Re_f(x),
		Im_f(x)
		
	]
	which requires two evaluations of f(x).

*/
Expression.List.ComplexCartesian = function(x){
	var r = x.realimag();
	r.__proto__ = Expression.List.ComplexCartesian.prototype;
};
Expression.List.ComplexCartesian.prototype = Object.create(Expression.List.prototype);
Expression.List.ComplexCartesian.prototype.realimag = function(){
	return this;
};
Expression.List.ComplexCartesian.prototype.real = function(){
	return this[0];
};
Expression.List.ComplexCartesian.prototype.imag = function(){
	return this[1];
};
Expression.List.ComplexCartesian.prototype.constructor = Expression.List.ComplexCartesian;
Expression.List.ComplexCartesian.prototype.apply = function(o, x){
	if (o.constructor === this.constructor) {
		switch(o) {
			case "+":
			case "-":
				return Expression.List.ComplexCartesian([
					this[0].apply(o, x[0]),
					this[1].apply(o, x[1])
				]);
			case undefined:
				//Function evaluation?
			case "*":
				return Expression.List.ComplexCartesian([
				
					]);
			case "/":
			case "^":
			case "!":
			default:
		}
	} else {
		
	}
};