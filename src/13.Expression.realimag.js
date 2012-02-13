Expression.prototype.real = function() {
	console.warn("TODO: don't calculate both parts (Expression.prototype.real)");
	return this.realimag()[0];
};
Expression.prototype.imag = function() {
	console.warn("TODO: don't calculate both parts (Expression.prototype.imag)");
	return this.realimag()[1];
};


// ========= List ========= //
Expression.List.prototype.realimag = function() {
	switch (this.operator) {
		case undefined:
			if(this[0].apply_realimag && this.length === 2) {
				return this[0].apply_realimag(this.operator, this[1]);
			}
			//throw(".realimag() method invoked for Expression without operator?");
			
		case '*':
			var a = this[0].realimag();
			var b = this[1].realimag();
			return Expression.List.ComplexCartesian([
				a[0].apply('*',b[0]).apply('-', a[1].apply('*',b[1])),
				a[0].apply('*',b[1]).apply('+',a[1].apply('*',b[0]))
			]);
		case "@+":
		case "@-":
			var a = this[0].realimag();
			return Expression.List.ComplexCartesian([
				a[0].apply(this.operator),
				a[1].apply(this.operator)
			]);
		case '+':
		case '-':
			var a = this[0].realimag();
			var b = this[1].realimag();
			return Expression.List.ComplexCartesian([
				a[0].apply(this.operator,b[0]),
				a[1].apply(this.operator,b[1])
			]);
		case '/':
			var a = this[0].realimag();
			var b = this[1].realimag();
			var cc_dd = b[0].apply('*',b[0]).apply('+',b[1].apply('*',b[1]));
			return Expression.List.ComplexCartesian([
				(a[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
				(a[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
			]);
		case '^':
			//TODO: simplify in case of real numbers only, or some zeros
			var a = this[0].realimag();
			var b = this[1].realimag();

			var half = new Expression.NumericalReal(0.5, 0);
			var hlm = half.apply('*',
				Global.log.apply(undefined,
					a[0].apply('*',
						a[0]
					).apply('+',
						a[1].apply('*',
							a[1]
						)
					)
				)
			);
			var theta = Global.atan2.apply(undefined, Expression.Vector([a[1], a[0]]));
			var hmld_tc = hlm.apply('*', b[1]).apply('+', theta.apply('*', b[0]));
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
			
			var e_hmlc_td = Global.e.apply("^",
				hlm.apply('*',
					b[0]
				).apply('-',
					theta.apply('*',
						b[1]
					)
				)
			);

			return Expression.List.ComplexCartesian([
				(e_hmlc_td.apply('*',Global.cos.apply(undefined, hmld_tc))),
				(e_hmlc_td.apply('*',Global.sin.apply(undefined, hmld_tc)))
			]);
	}
};