Expression.List.ComplexPolar = function (x){
	var z = x.polar();
	z.__proto__ = Expression.List.ComplexPolar.prototype;
}
Expression.List.ComplexPolar.prototype = Object.create(Expression.List);
Expression.List.ComplexPolar.prototype.polar = function(){
	return this;
};
Expression.List.ComplexPolar.prototype.realimag = function() {
	//TODO: Return Expression.List.ComplexCartesian
	return [
		this[0].apply("*", Global.cos.apply(undefined, this[1])),
		this[0].apply("*", Global.sin.apply(undefined, this[1])),
	];
};
Expression.List.ComplexPolar.prototype.real = function() {
	return this[0].apply("*", Global.cos.apply(undefined, this[1]));
};
Expression.List.ComplexPolar.prototype.imag = function() {
	return this[0].apply("*", Global.sin.apply(undefined, this[1]));
};
Expression.List.ComplexPolar.prototype.apply = function(o, x) {
	if (x.constructor === this.constructor) {
		switch (o) {
			case "*":
				//Fast
				return Expression.List.ComplexPolar([
					this[0].apply("*", x[0]),
					this[1].apply("+", x[1])
				]);
			case "/":
				//Also fast
				return Expression.List.ComplexPolar([
					this[0].apply("/", x[0]),
					this[1].apply("-", x[1])
				]);
			case "+":
			case "-":
				//Very slow, maybe we should switch to cartesian now?
			
			case "^":
				//(Ae^(ik)) ^ (Be^(ij))
				//How slow is this?
				//Very fast for real numbers though
			case "!":
			default:
			
		}
	} else if (x.constructor === Expression.NumericalReal) {
		switch (o) {
			case "*":
				//Fast
				return Expression.List.ComplexPolar([
					this[0].apply("*", x),
					this[1]
				]);
			case "/":
				//Also fast
				return Expression.List.ComplexPolar([
					this[0].apply("/", x),
					this[1]
				]);
			case "+":
			case "-":
				//Very slow, maybe we should switch to cartesian now?
			
			case "^":
				//Fast:
				return Expression.List.ComplexPolar([
					this[0],
					this[1].apply("*", x)
				]);
			case "!":
			default:
			
		}
	}
	
}
Expression.List.ComplexPolar.prototype.constructor = Expression.List.ComplexPolar;