Expression.Symbol = function Symbol(str) {
    //Req: str is a String
	this.symbol = str;
};

Expression.Symbol.prototype = Object.create(Expression.prototype);
Expression.Symbol.prototype.constructor = Expression.Symbol;

Expression.Symbol.prototype.differentiate = function (x) {
	return this === x ? Global.One : Global.Zero;
};
Expression.Symbol.prototype.integrate = function (x) {
    if (this === x) {
		return new Expression.NumericalReal(0.5, 0) ['*'] (x ['^'] (new Expression.NumericalReal(2,0)));
    }
	return (this) ['*'] (x);
};
Expression.Symbol.prototype.sub = function (x, y) {
	// TODO: Ensure it is real (for Expression.Symbol.Real)
	return this === x ? y : this;
};

// ============= Real Number ================ //
Expression.Symbol.Real = function Symbol_Real(str) {
    this.symbol = str;
};
Expression.Symbol.Real.prototype = Object.create(Expression.Symbol.prototype);
Expression.Symbol.Real.prototype.realimag = function() {
    return Expression.List.ComplexCartesian([this, Global.Zero]);
};
Expression.Symbol.Real.prototype.real = function() {
    return this;
};
Expression.Symbol.Real.prototype.imag = function() {
    return Global.Zero;
};
Expression.Symbol.Real.prototype.polar = function() {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
Expression.Symbol.Real.prototype.abs = function() {
	return Expression.List.Real([Global.abs, this]);
};
Expression.Symbol.Real.prototype.arg = function() {
	return Expression.List.Real([Global.arg, this]);
};

Expression.Symbol.Real.prototype['+'] = function (x) {
	if (x == Global.Zero) {
		return this;
	}

	if(x instanceof Expression.NumericalReal) {
		return new Expression.List.Real([this, x], '+');
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '+');
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '+');
	}
	return x['+'](this);
};
Expression.Symbol.Real.prototype['-'] = function (x) {
	if(this === x) {
		return Global.Zero;
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '-');
	}
	if(x instanceof Expression.List.Real) {
		return new Expression.List.Real([this, x], '-');
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '-');
	}
	
	return x['@-']()['+'](this);
};

Expression.Symbol.Real.prototype['@+'] = function (x) {
	return Expression.List.Real([this], '@+');
};

Expression.Symbol.Real.prototype['@-'] = function (x) {
	return Expression.List.Real([this], '@-');
};

Expression.Symbol.Real.prototype['*'] = function (x) {
	if (x === Global.One) {
		return this;
	}
	if (x === Global.Zero) {
		return x;
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '*');
	}
	if(x instanceof Expression.List.Real) {
		return x['*'](this);
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '*');
	}
	if(x instanceof Expression.NumericalReal) {
		return new Expression.List.Real([this, x], '*');
	}
	if(x instanceof Expression.NumericalComplex) {
		return new Expression.List.Real([this, x], '*');
	}
	if(x instanceof Expression.List.ComplexCartesian) {
		return x['*'](this);
	}
};
Expression.Symbol.Real.prototype.default = Expression.Symbol.Real.prototype['*'];
Expression.Symbol.Real.prototype['/'] = function (x) {
	return Expression.List.Real([this, x], '/');
};
Expression.Symbol.Real.prototype['^'] = function (x) {
	if(x === Global.Zero) {
		// Danger?
		return Global.One;
	}
	if(x === Global.One) {
		return this;
	}
	return Expression.List.Real([this, x], '^');
};
Expression.Symbol.Real.prototype.apply = function(operator, e) {
	throw("Real.apply");
	if (operator === ',') {
		//Maybe this should be a new object type??? Vector?
		console.log('APPLY: ', this.constructor, this, e);
		return Expression.Vector([this, e]);
	} else if (operator === '=') {
		return Expression.Equation([this, e], operator);
	}
	if (e === undefined) {
		//Unary:
		switch (operator) {
			case '!':
				//TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
				return Global.Gamma.apply(undefined, this.apply('+', Global.One));
			case '@-':
				return Expression.List.Real([this], operator);
			default:
		}
		throw('Real Symbol('+this.symbol+') could not handle operator '+ operator);
	} else {
		// Simplification:
		switch (e.constructor){
			case Expression.Symbol.Real:
			case Expression.List.Real:
				/*if(this.positive && e.positive) {
					return Expression.List.Real([this, e], operator);
				}*/
				switch(operator) {
					case '^':
						//TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
						//return Expression.List([this, e], operator);
						return Expression.List.ComplexPolar([
							Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
							Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
						]);
					case undefined:
						return Expression.List.Real([this, e], '*');
					default:
						return Expression.List.Real([this, e], operator);
				}
			case Expression.NumericalReal:
				switch(operator){
					case '+':
					case '-':
						if(e.value === 0){
							return this;
						}
						return Expression.List.Real([this, e], operator);
						break;
					case undefined:
					case '*':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Zero;
						}
						return Expression.List.Real([this, e], '*');
						break;
					case '%':
						return Expression.List.Real([this, e], '%');
					case '^':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.One;
						}
						if(false && opengl_TODO_hack() && e.value === ~~e.value){
							return Expression.List.Real([this, e], operator);
						}
						return Expression.List.ComplexPolar([
							Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
							Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
						]);
						
						break;
					case '/':
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
					case '+':
					case '-':
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							e[1]
						]);
					case undefined:
						operator = '*';
					case '*':
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							this.apply(operator, e[1])
						]);
					case '/':
						var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
						return Expression.List.ComplexCartesian([
							(this.apply('*',e[0])).apply('/', cc_dd),
							this.apply('*',e[1]).apply('/', cc_dd).apply('@-')
						]);
				}
			case Expression.List.ComplexPolar:
				//Maybe there is a way to swap the order?
				return this.polar().apply(operator, e);
		}
		throw('LIST FROM REAL SYMBOL! '+ operator, e.constructor);
		return Expression.List([this, e], operator);
	}
};


Expression.Symbol.Real.prototype.constructor = Expression.Symbol.Real;