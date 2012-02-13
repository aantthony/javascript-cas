Expression.List.prototype.differentiate = function(x) {
	switch (this.operator) {
		case undefined:
			if(this[0].apply_differentiate && this.length === 2) {
				return this[0].apply_differentiate(this.operator, this[1], x);
			}
			//TODO: Ensure left expr is not a function, so we know it is scalar multiplication.
			//throw(".differentiate() method invoked for Expression without operator?");
		case '*':
			return this[0]
				.differentiate(x)
				.apply('*',
					this[1]
				)
				.apply('+',
					this[1]
					.differentiate(x)
					.apply('*',
						this[0]
					)
				);
		case '+':
		case '-':
			return this[0]
				.differentiate(x)
				.apply(this.operator,
					this[1]
					.differentiate(x)
				);
		case '^':
			return this[0]
				.apply("^",
					this[1].apply("-", Global.One)
				)
				.apply("*",
					this[1]
					.apply("*",
						this[0].differentiate(x)
					)
					.apply("+",
						this[0]
						.apply("*",
							Global.log.apply(undefined, this[0])
							.apply("*",
								this[1].differentiate(x)
							)
						)
					)
				);
		case '/':
			return this[0]
				.differentiate(x)
				.apply('*',
					this[1]
				)
				.apply('-',
					this[0]
					.differentiate(x)
					.apply('*',
						this[1]
					)
				)
				.apply('/',
					this[1].apply('^',
						new Expression.NumericalReal(2,0)
					)
				);
		default:
			throw("Cannot differentiate "+this.operator + " operator.");
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
