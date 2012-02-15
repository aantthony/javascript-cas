Expression.Symbol = function Symbol(str) {
    //Req: str is a String
	this.symbol = str;
};

Expression.Symbol.prototype = Object.create(Expression.prototype);

Expression.Symbol.prototype.differentiate = function(x) {
    if (this.symbol === x.symbol) {
        return M.Global.One;
    } else {
        return M.Global.Zero;
    }
};
Expression.Symbol.prototype.integrate = function(x) {
    if (this.symbol === x) {
        return new Expression.NumericalReal(0.5, 0).apply('*', x.apply('^', new Expression.NumericalReal(2,0)));
    } else {
        return this.apply('*', x);
    }
};

Expression.Symbol.prototype.toString = function() {
	return this.symbol;
};

Expression.Symbol.prototype.constructor = Expression.Symbol;

// ============= Real Number ================ //
Expression.Symbol.Real = function Symbol_Real(str) {
    this.symbol = str;
};
Expression.Symbol.Real.prototype = Object.create(Expression.Symbol.prototype);
Expression.Symbol.Real.prototype.realimag = function() {
    return Expression.List.ComplexCartesian([this, M.Global.Zero]);
};
Expression.Symbol.Real.prototype.real = function() {
    return this;
};
Expression.Symbol.Real.prototype.imag = function() {
    return Global.Zero;
};
Expression.Symbol.Real.prototype.polar = function() {
	return Expression.List.ComplexPolar([
		Global.abs.apply(undefined, this),
		Global.arg.apply(undefined, this)
	]);
};
Expression.Symbol.Real.prototype.abs = function() {
	return Global.abs.apply(undefined, this);
};
Expression.Symbol.Real.prototype.arg = function() {
	return Global.arg.apply(undefined, this);
};
Expression.Symbol.Real.prototype.apply = function(operator, e) {
	if (operator === ",") {
		//Maybe this should be a new object type??? Vector?
		console.log("APPLY: ", this.constructor, this, e);
		return Expression.Vector([this, e]);
	} else if (operator === "=") {
		return Expression.Equation([this, e], operator);
	}
	if (e === undefined) {
		//Unary:
		switch (operator) {
			case "!":
				//TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
				return Global.Gamma.apply(undefined, this.apply("+", Global.One));
			case "@+":
			case "@-":
				
				return Expression.List.Real([this], operator);
			default:
		}
		throw("Real Symbol("+this.symbol+") could not handle operator "+ operator);
	} else {
		// Simplification:
		switch (e.constructor){
			case Expression.Symbol.Real:
				/*if(this.positive && e.positive) {
					return Expression.List.Real([this, e], operator);
				}*/
				switch(operator) {
					case "^":
						//TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
						return Expression.List([this, e], operator);
					default:
						return Expression.List.Real([this, e], operator);
				}
			case Expression.NumericalReal:
				switch(operator){
					case "+":
					case "-":
						if(e.value === 0){
							return this;
						}
						return Expression.List.Real([this, e], operator);
						break;
					case "*":
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Zero;
						}
						return Expression.List.Real([this, e], operator);
						break;
					case "^":
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.One;
						}
						
						// Im(a^b) = (a^2)^(b/2) * sin(b arg(a))
						/*if(this.positive) {
							if(e.value > 0) {
								return Expression.List.Real([this, e], operator);
							}
						}*/
						/*
							if sin(b arg(a)) == 0 
							if b arg(a) == n pi
							if b * arg(a)/pi == n
							if b == n
								return Real
						*/
						//Is this useless: ?
						if(e.value === ~~e.value){
							return Expression.List.Real([this, e], operator);
						}
						FIX_ME;p-3p---
						return Expression.List.ComplexPolar([
							//Global.abs.apply(undefined, this).apply("^", )
							Expression.List.Real([Expression.List.Real([Global.abs, this]), e],"^"),
							Expression.List.Real([Expression.List.Real([Global.arg, this]), e],"*")
						]);
						
						break;
					case "/":
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Infinity;
						}
						return Expression.List.Real([this, e], operator);
						break;
				}
				break;
			case Expression.Complex:
				return this.realimag().apply(operator, e); // GO to above (will apply reals)
				break;
			case Expression.List.ComplexCartesian:
				//Maybe there is a way to swap the order? (e.g. a .real = true property for other things to check)
				//or instance of Expression.Real ?
				switch(operator) {
					case "+":
					case "-":
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							e[1]
						]);
					case "*":
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							this.apply(operator, e[1]),
						]);
					case "/":
						var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
						return Expression.List.ComplexCartesian([
							(this.apply('*',e[0])).apply('/', cc_dd),
							this.apply('*',e[1]).apply('/', cc_dd).apply("@-")
						]);
				}
			case Expression.List.ComplexPolar:
				//Maybe there is a way to swap the order?
				return this.polar().apply(operator, e);
		}
		throw("LIST FROM REAL SYMBOL!");
		return Expression.List([this, e], operator);
	}
};


Expression.Symbol.Real.prototype.constructor = Expression.Symbol.Real;