Expression.List.Real = function (x) {
	
}
Expression.List.Real.prototype = Object.create(Expression.List);
Expression.List.Real.realimag = function (){
	return [
		this,
		Global.Zero
	];
};
Expression.List.Real.real = function (){
	return this;
};
Expression.List.Real.imag = function (){
	return Global.Zero;
};
Expression.List.Real.polar = function () {
	return [
		this,
		M.Global.Zero
	];
};
Expression.List.Real.abs = function (){
	return this;
};
Expression.List.Real.arg = function (){
	return Global.Zero;
};