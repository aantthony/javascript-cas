Expression.List.prototype.differentiate = function(x) {
	switch (this.operator) {
		case '*':
			return
				this[0]
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
			return
				this[1]
				.differentiate(x)
				.apply(this.operator,
					this[1]
					.differentiate(x)
				);
		case '/':
			return
				this[0]
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
						2
					)
				)
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
