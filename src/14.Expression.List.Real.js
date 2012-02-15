Expression.List.Real = function List_Real(x, operator) {
	x.__proto__ = Expression.List.Real.prototype;
	if(operator !== undefined) {
		x.operator = operator;
	}
	return x;
};
Expression.List.Real.prototype = Object.create(Expression.List.prototype);
Expression.List.Real.prototype.realimag = function (){
	return [
		this,
		Global.Zero
	];
};
Expression.List.Real.prototype.real = function (){
	return this;
};
Expression.List.Real.prototype.imag = function (){
	return Global.Zero;
};
Expression.List.Real.prototype.polar = function () {
	throw("WRONG, Might be pi if this is negative");
	return [
		this,
		M.Global.Zero
	];
};
Expression.List.Real.prototype.abs = function (){
	return this;
};
Expression.List.Real.prototype.arg = function (){
	return Global.Zero;
};
Expression.List.Real.prototype.apply = function(o, x){
	console.warn("Expression.List.Real.prototype.apply");
	if (x.constructor === this.constructor) {
		switch(o) {
			case "+":
			case "-":
			case undefined:
			case "*":
			case "/":
				return Expression.List.Real([this, x], o);
			
			case "^":
				//The most confusing of them all:
				//Some checks first? >0 ?
				console.warn("Real ^ Please check");
				var half = new Expression.NumericalReal(0.5, 0);
				var hlm = half.apply('*',
					Global.log.apply(undefined,
						this.apply('*',
							this
						)
					)
				);
				//TODO: zero -> optimize
				var theta = Global.atan2.apply(undefined, Expression.Vector([Global.Zero, this]));
				var hmld_tc = theta.apply('*', x);

				var e_hmlc_td = Global.e.apply("^",
					hlm.apply('*',
						x
					)
				);
				return Expression.List.ComplexCartesian([
					(e_hmlc_td.apply('*', Global.cos.apply(undefined, hmld_tc))),
					(e_hmlc_td.apply('*', Global.sin.apply(undefined, hmld_tc)))
				]);
			case "!":
			default:
		}
	} else if (x.constructor === Expression.List.ComplexPolar){
		switch (o) {
			case "*":
			case "/":
				//(x+yi)/A*e^(ik)
				var cc_dd = x[0].apply("*", x[0]);
				var b = x.realimag();
				//Clean this up? Sub?
				return Expression.List.ComplexCartesian([
					(this[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
					(this[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
				]);
			case "^":
				//http://www.wolframalpha.com/input/?i=Re%28%28x%2Byi%29%5E%28A*e%5E%28ik%29%29%29
				//(x+yi)^(A*e^(ik))
			case "+":
			case "-":
				return this.apply(o, x.realimag());
		}
	} else if (x.constructor === Expression.Complex) {
		return this.apply(o, x.realimag());
	} else if (x.constructor === Expression.NumericalReal) {
		switch(o) {
			case "+":
			case "-":
			case undefined:
			case "*":
			case "/":
				return Expression.List.Real([this, x], o);
			
			case "^":
				//The most confusing of them all:
				//Some checks first? >0 ?
				var half = new Expression.NumericalReal(0.5, 0);
				var hlm = half.apply('*',
					Global.log.apply(undefined,
						this.apply('*',
							this
						),
						{
							positive: true
						}
					)
				);
				//TODO: zero -> optimize
				var theta = Global.atan2.apply(undefined, Expression.Vector([Global.Zero, this]));
				var hmld_tc = theta.apply('*', x);

				var e_hmlc_td = Global.e.apply("^",
					hlm.apply('*',
						x
					)
				);
				return Expression.List.ComplexCartesian([
					(e_hmlc_td.apply('*', Global.cos.apply(undefined, hmld_tc))),
					(e_hmlc_td.apply('*', Global.sin.apply(undefined, hmld_tc)))
				]);
			case "!":
			default:
		}
	}
	throw("REAL.LIST * " + o, x.constructor);
};
Expression.List.Real.prototype.constructor = Expression.List.Real;
