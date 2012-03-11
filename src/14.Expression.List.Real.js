Expression.List.Real = function List_Real(x, operator) {
	x.__proto__ = Expression.List.Real.prototype;
	if(operator !== undefined) {
		x.operator = operator;
	}
	return x;
};
Expression.List.Real.prototype = Object.create(Expression.List.prototype);
Expression.List.Real.prototype.realimag = function (){
	return Expression.List.ComplexCartesian([
		this,
		Global.Zero
	]);
};
Expression.List.Real.prototype.real = function (){
	return this;
};
Expression.List.Real.prototype.imag = function (){
	return Global.Zero;
};
Expression.List.Real.prototype.polar = function () {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
Expression.List.Real.prototype.abs = function (){
	return Expression.List.Real([Global.abs, this]);
};
Expression.List.Real.prototype.arg = function (){
	return Expression.List.Real([Global.arg, this]);
};

Expression.List.Real.prototype.apply = Expression.Symbol.Real.prototype.apply;
Expression.List.Real.prototype.constructor = Expression.List.Real;


/*


Expression.List.Real.Positive = function List_Real_Positive(list, operator){
	if(!operator){
		throw('MUST SUPPLY OPERATOR');
	}
	list.__proto__ = Expression.List.Real.Positive.prototype;
};
Expression.List.Real.Positive.prototype = Object.create(Expression.List.Real.prototype);

*/