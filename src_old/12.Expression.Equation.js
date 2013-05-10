Expression.Equation = function(e, operator){
	e.__proto__ = Expression.Equation.prototype;
	e.operator = operator;
	return e;
};
//Get toTypedString methods? Maybe we shouldn't.
_ = Expression.Equation.prototype = Object.create(Expression.List.prototype);
_.apply = function(op, e) {
	throw('Operators cannot be applied to equations');
};
