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
			var d_a = this[0].differentiate(x);
			var d_b = this[1].differentiate(x);
			if(d_a === Global.Zero) {
				if(d_b === Global.Zero) {
					return Global.Zero;
				}
				return d_b['*'](Global.log.default(this[0]))['*'](this);
			}

			var f_a = this[0]['^'](this[1]['-'](Global.One));
			return f_a['*'](
				d_a['*'](this[1])
				['+'](
					this[0]['*'](Global.log.default(this[0]))['*'](d_b)
				)
			);
			return this[1]['*'](
						this[0].differentiate(x)
					)['+'](
						this[0]['*'](
							Global.log.default(this[0])['*'](
								this[1].differentiate(x)
							)
						)
					)['*'](
					this[0]['^'](
						this[1]['-'](Global.One)
					)
				);
		case '/':
			var da = this[0].differentiate(x);
			var db = this[1].differentiate(x);
			if(db === Global.Zero) {
				return da['/'](this[1]);
			}
			return this[1]['*'](da)['-'](this[0]['*'](db))['/'](
				this[1]['^'](new Expression.Integer(2))
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
