Expression.prototype.real = function() {
	console.warn('TODO: don\'t calculate both parts (Expression.prototype.real)');
	return this.realimag()[0];
};
Expression.prototype.imag = function() {
	console.warn('TODO: don\'t calculate both parts (Expression.prototype.imag)');
	return this.realimag()[1];
};


// ========= List ========= //
Expression.List.prototype.realimag = function() {
	console.error('Only the user can call this function');
	switch (this.operator) {
		case undefined:
			if (this[0] instanceof Expression.Function) {
				return this[0].realimag().default(this[1]);
			}
			//throw('.realimag() method invoked for Expression without operator?');
			
		case '*':
			var a = this[0].realimag();
			var b = this[1].realimag();
			return Expression.List.ComplexCartesian([
				a[0]['*'](b[0])['-'](a[1]['*'](b[1])),
				a[0]['*'](b[1])['+'](a[1]['*'](b[0]))
			]);
		case '@+':
		case '@-':
			var a = this[0].realimag();
			return Expression.List.ComplexCartesian([
				a[0][this.operator](),
				a[1][this.operator]()
			]);
		case '+':
		case '-':
			var a = this[0].realimag();
			var b = this[1].realimag();
			return Expression.List.ComplexCartesian([
				a[0][this.operator](b[0]),
				a[1][this.operator](b[1])
			]);
		case '/':
			var a = this[0].realimag();
			var b = this[1].realimag();
			var cc_dd = b[0]['*'](b[0])['+'](b[1]['*'](b[1]));
			return Expression.List.ComplexCartesian([
				(a[0]['*'](b[0])['+'](a[1]['*'](b[1])))['/'](cc_dd),
				(a[1]['*'](b[0])['-'](a[0]['*'](b[1])))['/'](cc_dd)
			]);
		case '^':
			//TODO: simplify in case of real numbers only, or some zeros
			var a = this[0].realimag();
			var b = this[1].realimag();

			var half = new Expression.Rational(1, 2);
			var two = new Expression.Integer(2);
			
			var hlmtheta = Global.log.realimag().default(a);
			var hlm = hlmtheta[0];
			var theta = hlmtheta[1];
			var hmld_tc = hlm['*'](b[1])['+'](theta['*'](b[0]));
			
			
			var e_hmlc_td = Global.e['^'](
				hlm['*'](
					b[0]
				)['-'](
					theta['*'](
						b[1]
					)
				)
			);

			return Expression.List.ComplexCartesian([
				(e_hmlc_td['*'](Global.cos.default(hmld_tc))),
				(e_hmlc_td['*'](Global.sin.default(hmld_tc)))
			]);
	}
};