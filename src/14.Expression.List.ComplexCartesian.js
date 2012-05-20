/*
	This type is an attempt to avoid having to call .realimag() down the tree all the time.
	
	Maybe this is a bad idea, because it will end up having:
	
	f(x) = >
	[
		Re_f(x),
		Im_f(x)
		
	]
	which requires two evaluations of f(x).

*/
Expression.List.ComplexCartesian = function ComplexCartesian(x){
	x.__proto__ = Expression.List.ComplexCartesian.prototype;
	return x;
};
Expression.List.ComplexCartesian.prototype = Object.create(Expression.prototype);
Expression.List.ComplexCartesian.prototype.constructor = Expression.List.ComplexCartesian;
Expression.List.ComplexCartesian.prototype.realimag = function(){
	return this;
};
Expression.List.ComplexCartesian.prototype.real = function(){
	return this[0];
};
Expression.List.ComplexCartesian.prototype.imag = function(){
	return this[1];
};
Expression.List.ComplexCartesian.prototype.conjugate = function () {
	return Expression.List.ComplexCartesian([
		this[0],
		this[1].apply('@-')
	]);
};

Expression.List.ComplexCartesian.prototype['@-'] = function (x) {
	return new Expression.List.ComplexCartesian([
		this[0]['@-'](),
		this[1]['@-']()
	]);
};
Expression.List.ComplexCartesian.prototype['*'] = function (x) {
	if (x instanceof Expression.List.ComplexCartesian) {
		// (a+bi) * (A+Bi) = aA + aBi + bA - bB
		return new Expression.List.ComplexCartesian([
			this[0]['*'](x[0])['+'](this[1]['*'](x[0])),
			this[0]['*'](x[1])['-'](this[1]['*'](x[1]))
		]);
	}
	if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
		return new Expression.List.ComplexCartesian([
			this[0]['*'](x),
			this[1]['*'](x)
		]);
	}
};
Expression.List.ComplexCartesian.prototype['^'] = function (x) {
	if(x instanceof Expression.Integer) {

		if(x instanceof Expression.Rational) {
			if(x.a === x.b) {
				return this;
			}
		}

		if(x instanceof Expression.Rational) {
			if(x.a === 0) {
				return Global.One;
			}
		}
		
		// Binomial expansion
		// (a+b)^N
		var n  = x.a;
		var k;
		var x = this[0];
		var y = this[1];
		var negone = new Expression.Integer(-1);
		var imag_part = Global.Zero;
		
		var real_part = x['^'](
			new Expression.Integer(n)
		);
		
		var ci = 1;
		
		for (k = 1;; k++) {
			if(k === n) {
				var expr = (
					y['^'](
						new Expression.Integer(k)
					)
				);
				
				if (ci === 0) {
					real_part = real_part['+'](expr);
				} else if (ci === 1) {
					imag_part = imag_part['+'](expr);
				} else if (ci === 2) {
					real_part = real_part['-'](expr);
				} else if (ci === 3) {
					imag_part = imag_part['-'](expr);
					ci = -1;
				}
			
				
				break;
			}
			var expr = x['^'](
				new Expression.Integer(n - k)
			)['*'](
				y['^'](
					new Expression.Integer(k)
				)
			);
			if (ci === 0) {
				real_part = real_part['+'](expr);
			} else if (ci === 1) {
				imag_part = imag_part['+'](expr);
			} else if (ci === 2) {
				real_part = real_part['-'](expr);
			} else if (ci === 3) {
				imag_part = imag_part['-'](expr);
				ci = -1;
			}
			
			ci++;
		}
		return new Expression.List.ComplexCartesian([
			real_part,
			imag_part
		]);
	}
	return new Expression.List([this, x], '^');
};
Expression.List.ComplexCartesian.prototype['+'] = function (x) {
	if (x instanceof Expression.List.ComplexCartesian) {
		return new Expression.List.ComplexCartesian([
			this[0]
		]);
	}
	if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
		return new Expression.List.ComplexCartesian([
			this[0]['+'](x),
			this[1]
		]);
	}
	
};

Expression.List.ComplexCartesian.prototype.differentiate = function (x) {
	return Expression.List.ComplexCartesian([
		this[0].differentiate(x),
		this[1].differentiate(x)
	]);
};


Expression.List.ComplexCartesian.prototype.apply = function(o, x){
	//TODO: ensure this has an imaginary part. If it doesn't it is a huge waste of computation
	if (x.constructor === this.constructor) {
		switch(o) {
			case '+':
			case '-':
				return Expression.List.ComplexCartesian([
					this[0].apply(o, x[0]),
					this[1].apply(o, x[1])
				]);
			case undefined:
				//Function evaluation? NO. This is not a function. I think.
			case '*':
				return Expression.List.ComplexCartesian([
					this[0].apply('*', x[0]).apply('-', this[1].apply('*', x[1])),
					this[0].apply('*', x[1]).apply('+', this[1].apply('*', x[0]))
				]);
			case '/':
				var cc_dd = x[0].apply('*', x[0]).apply('+', x[1].apply('*', x[1]));
				return Expression.List.ComplexCartesian([
					(this[0].apply('*',x[0]).apply('+',this[1].apply('*',x[1]))).apply('/', cc_dd),
					(this[1].apply('*',x[0]).apply('-',this[0].apply('*',x[1]))).apply('/', cc_dd)
				]);
			case '^':
				//The most confusing of them all:
				var half = new Expression.NumericalReal(0.5, 0);
				var hlm = half.apply('*',
					Global.log.apply(undefined,
						//The magnitude: if this was for a polar one it could be fast.
						this[0].apply('*',
							this[0]
						).apply('+',
							this[1].apply('*',
								this[1]
							)
						)
					)
				);
				var theta = Global.atan2.apply(undefined, Expression.Vector([this[1], this[0]]));
				var hmld_tc = hlm.apply('*', x[1]).apply('+', theta.apply('*', x[0]));
				/*
				var e_hmlc_td = Global.exp.apply(undefined,
					hlm.apply('*',
						b[0]
					).apply('-',
						theta.apply('*',
							b[1]
						)
					)
				);
				*/

				var e_hmlc_td = Global.e.apply('^',
					hlm.apply('*',
						x[0]
					).apply('-',
						theta.apply('*',
							x[1]
						)
					)
				);

				return Expression.List.ComplexCartesian([
					(e_hmlc_td.apply('*',Global.cos.apply(undefined, hmld_tc))),
					(e_hmlc_td.apply('*',Global.sin.apply(undefined, hmld_tc)))
				]);
			case '!':
			default:
		}
	} else if (x.constructor === Expression.List.ComplexPolar){
		switch (o) {
			case '*':
			case '/':
				//(x+yi)/A*e^(ik)
				var cc_dd = x[0].apply('*', x[0]);
				var b = x.realimag();
				//Clean this up? Sub?
				return Expression.List.ComplexCartesian([
					(this[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
					(this[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
				]);
			case '^':
				//http://www.wolframalpha.com/input/?i=Re%28%28x%2Byi%29%5E%28A*e%5E%28ik%29%29%29
				//(x+yi)^(A*e^(ik))
			case '+':
			case '-':
				return this.apply(o, x.realimag());
		}
	} else if (x.constructor === Expression.Complex) {
		return this.apply(o, x.realimag());
	} else if (x.constructor === Expression.Symbol.Real) {
		console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
		return this.apply(o, x.realimag());
	} else if (x.constructor === Expression.List.Real) {
		console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
		return this.apply(o, x.realimag());
	}
	throw('CMPLX.LIST * ' + o);
};