Expression.Vector = function (e) {
	e.__proto__ = Expression.Vector.prototype;
	return e;
};

Expression.Vector.prototype = Object.create(Expression.prototype);
Expression.Vector.prototype.constructor = Expression.Vector;
Expression.Vector.prototype[','] = function (x) {
	this[this.length] = x;
	return this;
};
Expression.Vector.prototype.default = function (x) {
	var l = this.length;
	if (x.constructor === Expression.Vector) {
		// Dot product
		if(l !== x.length) {
			throw('Vector Dimension mismatch.');
		}
		var i;
		var sum = Global.Zero;
		for (i = 0; i < l; i++) {
			sum = sum['+'](
				(this[i]) ['*'] (x[i])
			);
		}
		return sum;
	} else if (x.constructor === Expression.Matrix) {
		
	} else if (x.constructor) {
		// Scalar Multiplication
		var i;
		var n = new Array(l);
		for (i = 0; i < l; i++) {
			n[i] = this[i]['*'](x);
		}
		return Expression.Vector(n);
	}
};
Expression.Vector.prototype['*'] = Expression.Vector.prototype.default;
Expression.Vector.prototype['+'] = function (x, op) {
	var l = this.length;
	if(l != x.length) {
		throw('Vector Dimension mismatch.');
	}
	var i;
	var n = new Array(l);
	for (i = 0; i < l; i++) {
		n[i] = this[i][op || '+'](e[i]);
	}
	return Expression.Vector(n);
};
Expression.Vector.prototype['-'] = function (x) {
	return Expression.Vector.prototype.call(this, x, '-');
};
Expression.Vector.prototype['/'] = null;
Expression.Vector.prototype['^'] = function (x) {
	
	throw ('Unimplemented operator: Vector ^');
	if(x.constructor === this.constructor){
		
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.Complex(this.value + x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['+'](this);
	} else {
		throw ('Unknown Type for Vector ^');
	}
	return this.default(this['^'](x['-'](Global.One)));
};
Expression.Vector.prototype.apply = function(operator, e) {
	var l = this.length;
	switch (operator) {
		case ',':
			//Array.prototype.push.apply(this, [e]);
			//Faster:
			//MODIFIES!!!!!!!!!
			this[l] = e;
			return this;
		case undefined:
		case '*':
			if(l != e.length) {
				throw('Vector Dimension mismatch.');
			}
			var i;
			var sum = M.Global.Zero;
			for (i = 0; i < l; i++) {
				sum = sum.apply('+', this[i].apply('*', e[i]));
			}
			return sum;
		case '+':
		case '-':
			if(l != e.length) {
				throw('Vector Dimension mismatch.');
			}
			var i;
			var n = new Array(l);
			for (i = 0; i < l; i++) {
				n[i] = this[i].apply(operator, e[i]);
			}
			return Expression.Vector(n);
		case '/':
		case '^':
		default:
			throw('Vector operation not allowed.');
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
