Expression.Vector = function (e) {
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
		case undefined:
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
			return Expression.Vector(n);
		case "/":
		case "^":
		default:
			throw("Vector operation not allowed.");
	}
};

Expression.Vector.prototype.realimag = function(){
	var l = this.length;
	var _x = new Array(l);
	var _y = new Array(l);
	var i;
	for(i = 0; i < l; i++) {
		var ri = this[i].realimag();
		_x[i] = ri[0];
		_y[i] = ri[1];
	}
	return Expression.List.ComplexCartesian([
		Expression.Vector(_x),
		Expression.Vector(_y)
	]);
};
Expression.Vector.prototype.constructor = Expression.Vector;
