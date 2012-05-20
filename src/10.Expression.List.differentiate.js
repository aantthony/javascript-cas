Expression.List.prototype.differentiate = function(x) {
	switch (this.operator) {
		case undefined:
			//TODO: Ensure left expr is not a function, so we know it is scalar multiplication.
			//throw('.differentiate() method invoked for Expression without operator?');
			
			// D(f(g(x))) = D(f) * D(g)
			// d f(g(x))/dx = df/dx = df/dg * dg/dx
			if(this[0] instanceof Expression.Function) {
				var da = this[1].differentiate(x);
				if(da === Global.Zero) {
					return da;
				}
				return this[0].differentiate().default(this[1])['*'](da);
			}
		case '*':
			return this[0]
				.differentiate(x)['*'](
					this[1]
				)['+'](
					this[1]
					.differentiate(x)['*'](
						this[0]
					)
				);
		case '@+':
		case '@-':
			return this[0].differentiate(x)[this.operator]();
		case '+':
		case '-':
			return this[0]
				.differentiate(x)[this.operator](
					this[1]
					.differentiate(x)
				);
		case '^':
			return this[0]['^'](
					this[1]['-'](Global.One)
				)['*'](
					this[1]['*'](
						this[0].differentiate(x)
					)['+'](
						this[0]['*'](
							Global.log.default(this[0])['*'](
								this[1].differentiate(x)
							)
						)
					)
				);
		case '/':
			return this[0]
				.differentiate(x)['*'](
					this[1]
				)['-'](
					this[0]
					.differentiate(x)['*'](
						this[1]
					)
				)['/'](
					this[1]['^'](
						new Expression.NumericalReal(2,0)
					)
				);
		default:
			throw('Cannot differentiate ' + this.operator + ' operator.');
	}
};

Expression.prototype.differentiateN = function(x, n) {
	if (n === 0) {
		return this;
	} else if(n <= -1) {
		return this.integrateN(x, n);
	} else if(n > 1) {
		return this.differentiate(x).differentiateN(x, n - 1);
	} else if (n === 1) {
		return this.differentiate(x);
	}
};
