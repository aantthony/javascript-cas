Expression.prototype.roots = function (vars) {
	return Set([]);
};
Expression.Symbol.prototype.roots = function (vars) {
	if(vars.indexOf(this) !== -1) {
		return Set([new Statement(this, Global.Zero, '=')]);
	}
	return Set([]);
};
Expression.prototype.dep = function (vars) {
	return false;
};
Expression.Symbol.Real.prototype.dep = function (vars) {
	return vars.indexOf(this) !== -1;
}
Expression.List.prototype.dep = function (vars) {
	// var t; if(t = vars.influcens.definiteValue(this)) {
		// return t;
	//}
	if (this[0].dep(vars)) {
		//vars.influcenes.true(this);
		return true;
	}
	if(this.operator && this.operator[0] === '@') {
		// Unary operator
		return false;
	}
	if (this[1].dep(vars)) {
		// vars.influcenes.true(this);
		return true;
	}
	//vars.influcenes.false(this);
	return false;
};
Expression.Function.Symbolic.prototype.inverse = function() {
	// x -> x^2
	// f(x) = x^2
	// f(x) - x^2 = 0
	
};
Expression.List.Real.prototype.roots = function (vars) {
	if(this.operator === '*') {

		// Null
		// (x)(1/x) = 0
		// x = 0, or x = Infinity
		// x = 0: (0) * (1/0) = 0 * Infinity ≠ 0.
		var a = this[0].roots(vars);
		var b = this[1].roots(vars);
		return a.union(b);
	} else if (this.operator === '+') {
		/*
		a(x) + b(x) = 0
		
		if a>0 and b>0
		=> only solutions are the intersect or a(x) = 0, and b(x) = 0
		*/
		var factorised = Global.One;
		this.factors(vars,
			function (x, r) {
				// TODO: Find roots in here? (However, this (in its current form) would re invoke the current function, )
				factorised = factorised['*'](x);
			},
			function () {
				
			},
			false
		);
		if(factorised.operator === '*') {
			return factorised.roots(vars);
		} else {
			// TODO: dep could be calculated via the factor transverse.
			if (!this[1].dep(vars)) {
				/*
				// equivalent to a move onto right side of equation
				// f(x) + b = 0
				// f(x) = - b
				// E.g. x^3 + x + 1 = 0 -> 		... ?
				// E.g. x^3 + 1 = 0 -> x^3 = -1 (only because N(x) <= 1)
				// E.g. x^x + 1 = 0 -> x^x = -1 ... ?
				// E.g. x*x - 1 = 0 -> x*x = 1
					x*x = 1
					x^2 = 1
						-> x = 1
				// E.g x^2 + x - 1 = 0
				x(x + 1) = 1
				
				*/
				
			} else if (!this[0].dep(vars)) {
				// b + f(x) = 0
				
				// repeat above (but swap)
			} else {
				throw ('Cannot solve');
			}
		}
		var a_zero = this[0].roots(vars);
		var b_zero = this[0].roots(vars);
		
		
		/*
		
		*/
	} else if (this.operator === '/') {
		/*
		a/b = 0
		a = b * 0
		a = 0
		*/
		var a = this[0].roots(vars);
		// Test that b ≠ 0
		return a;
	}
};
