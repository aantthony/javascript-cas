Expression.prototype.differentiate = function(x){
	switch(this.operator){
		case '*':
			return
				this[0]
				.diff(x)
				.apply('*',
					this[1]
				)
				.apply('+',
					this[1]
					.diff(x)
					.apply('*',
						this[0]
					)
				);
		case '+':
		case '-':
			return
				this[1]
				.diff(x)
				.apply(this.operator,
					this[1]
					.diff(x)
				);
		case '/':
			return
				this[0]
				.diff(x)
				.apply('*',
					this[1]
				)
				.apply('-',
					this[0]
					.diff(x)
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

Expression.prototype.differentiateN = function(x, n){
	if(n===0){
		return this;
	}else if(n<0){
		return this.integrateN(x, n);
	}else if(n>1){
		return this.differentiate(x).differentiateN(x, n-1);
	}else if (n===1){
		return this.differentiate(x);
	}
};

Expression.prototype.diff = Expression.prototype.differentiate;
