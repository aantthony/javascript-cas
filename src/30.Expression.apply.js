Expression.prototype.apply = function(operator, /* Expression */ e) {
	throw('UNKNOWN COMPLEX CART/POLAR');
	if (operator === ',') {
		//Maybe this should be a new object type??? Vector?
		console.log('APPLY: ', this.constructor, this, e);
		return Expression.Vector([this, e]);
	}
	if (e === undefined) {
		//Unary:
		switch (operator) {
			case '!':
				return Global.Gamma.apply(undefined, this.apply('+', Global.One));
			default:
		}
		return Expression.List([this], operator);
	} else {
		// Simplification:
		switch (e.constructor){
			case Expression.Complex:
				switch(operator){
					case '+':
					case '-':
						if(e._real === 0 && e._imag === 0){
							return this;
						}
						break;
					case '*':
						if(e._real === 1 && e._imag === 0){
							return this;
						} else if(e._real === 0 && e._imag === 0){
							return Global.Zero;
						}
						break;
					case '^':
						if(e._real === 1 && e._imag === 0){
							return this;
						} else if(e._real === 0 && e._imag === 0){
							return Global.One;
						}
						break;
					case '/':
						if(e._real === 1 && e._imag === 0){
							return this;
						} else if(e._real === 0 && e._imag === 0){
							return Global.Infinity;
						}
						break;
				}
				break;
			case Expression.NumericalReal:
				switch(operator){
					case '+':
					case '-':
						if(e.value === 0){
							return this;
						}
						break;
					case '*':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Zero;
						}
						break;
					case '^':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.One;
						}
						break;
					case '/':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Infinity;
						}
						break;
				}
		}
		return Expression.List([this, e], operator);
	}
};
