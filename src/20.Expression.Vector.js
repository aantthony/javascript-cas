Expression.Vector = function (e){
	e.__proto__ = Expression.Vector.prototype;
	return e;
};

Expression.Vector.prototype = Object.create(Expression.List.prototype);
Expression.Vector.prototype.apply = function(operator, e) {
	var l = this.length;
	switch (operator) {
		case ",":
			//Array.prototype.push.apply(this, [e]);
			//Faster:
			//MODIFIES!!!!!!!!!
			this[l] = e;
			return this;
		case "*":
			if(l != e.length) {
				throw("Vector Dimension mismatch.");
			}
			var i;
			var sum = M.Global.Zero;
			for (i = 0; i < l; i++) {
				sum = sum.apply("+", this[i].apply("*", e[i]));
			}
			return sum;
		case "+":
		case "-":
			if(l != e.length) {
				throw("Vector Dimension mismatch.");
			}
			var i;
			var n = new Array(l);
			for (i = 0; i < l; i++) {
				n[i] = this[i].apply(operator, e[i]);
			}
			return Expression.List(e, ",");
		case "/":
		case "^":
		default:
			throw("Vector operation not allowed.");
	}
};

Expression.Vector.prototype.toTypedString = function(language) {
	var l = this.length;
	return "vec"+l+"("+Array.prototype.join.apply(this, [", "])+")"
};