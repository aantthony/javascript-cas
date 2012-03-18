Expression.Matrix = function (e) {
	e.__proto__ = Expression.Matrix.prototype;
	this.rows = 0;
	this.cols = 0;
	return e;
};

Expression.Matrix.prototype = Object.create(Expression.prototype);
Expression.Matrix.prototype.constructor = Expression.Matrix;
Expression.Matrix.prototype.default = function (x) {
	if(x.constructor === Expression.Matrix) {
		
	}
};