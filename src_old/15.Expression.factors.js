Expression.prototype.factors = function (vars, yes, no) {
	no(this, false);
};
Expression.prototype.terms = function (vars, yes, no) {
	no(this, false);
};
Expression.prototype.factorize = function (vars) {
	throw('Inefficent');
	var prod = Global.One;
	var prod_c = Global.One;
	this.factors(vars,
		function (x) {
			prod = prod['*'](x);
		},
		function (x) {
			// TODO: See solver (don't try to solve this part!)
			prod_c = prod_c['*'](x);
		}
	);
	return {
		dep: prod,
		not_dep: prod_c
	};
};
Expression.Symbol.Real.prototype.factors = function (vars, yes, no) {
	if (vars.indexOf(this) !== -1) {
		yes(this, false);
	} else {
		no(this, false);
	}
};
Expression.Symbol.Real.prototype.terms = function (vars, yes, no) {
	if (vars.indexOf(this) !== -1) {
		yes(this, false);
	} else {
		no(this, false);
	}
};

Expression.List.Real.prototype.terms = function (vars, yes, no) {
	switch (this.operator) {
		case '+':
			this[0].terms(vars, yes, no);
			this[1].terms(vars, yes, no);
			return;
		case '-':
			this[0].terms(vars, yes, no);
			this[1].terms(vars,
				function (y) {
					yes(y['@-']());
				},
				function (n) {
					no(n['@-']());
				}
			);
			return;
		case '*':
			var Ay = [];
			var An = Global.Zero;
			var By = [];
			var Bn = Global.Zero;
		
			this[0].terms(vars,
				function (y) {
					Ay.push(y);
				},
				function (n) {
					An = An['*'](n);
				}
			);
			this[1].terms(vars,
				function (y) {
					By.push(y);
				},
				function (n) {
					Bn = Bn['*'](n);
				}
			);
			/* 
			(AN + a1 + a2 + ... + an) * (BN + b1 + b2 + ... + bn)
			= a1b1 + a1b2 + ...
			*/
			no(An['*'](Bn));
			var i = 0;
			for (i = 0; i < Ay.length; i++) {
				var j;
				for (j = 0; j < By.length; j++) {
					yes(Ay[i]['*'](By[j]));
				}
			}
			return;
		case '/':
			var self = this;
			if(this[1] instanceof Expression.Constant) {
				this[0].terms(vars,
					function (y) {
						yes(y['/'](self[1]));
					},
					function (n) {
						no(n['/'](self[1]));
					}
				);
				return;
				
			}
			throw('Expansion in denominator required');
	}
};
Expression.List.Real.prototype.factors = function (vars, yes, no, collect_recip) {
	var id = ~~(1000*Math.random());
	console.log("("+ id+") Attempt to find factors of: ", this);
	switch (this.operator) {
		case '-':
			// TODO: add a factor of -1 to b
		case '+':
			// TODO: Ensure that once this is performed, that the object
			//       is mutated so that this need not be repeated.
			var a = [];
			var a_c = Global.One;
			var b = [];
			var b_c = Global.One;
			// Should it get terms(), or factors() (e.g. x+x+x+x+x will give multiple common factors (one at each addition level))
			this[0].factors(vars,
				function (x){
					console.log(id+"< a: ", x);
					a.push(x);
				},
				function (x){
					// TODO: Should these be combined? Would this combine things like (1+x) + 3 = (4+x) ?
					console.log(id+"< a_c: ", x);
					a_c = a_c['*'](x);
				}
			);
			this[1].factors(vars,
				function (x){
					console.log(id+"< b: ", x);
					b.push(x);
				},
				function (x){
					console.log(id+"< b_c: ", x);
					b_c = b_c['*'](x);
				}
			);
			// Common factors: 
			var common = [];
			var a_i, a_l = a.length;
			var b_i, b_l = b.length;
			var a_x = Global.One;
			var b_x = Global.One;
			for (a_i = 0; a_i < a_l; a_i++) {
				var was_co = false;
				for (b_i = 0; b_i < b_l; b_i++) {
					if(b[b_i] === undefined) {
						continue;
					}
					// Match?
					if (a[a_i] === b[b_i]) {
						common.push(a[a_i]);
						// a[a_i] = b[b_i] = Global.One; // Ignore flag
						b[b_i] = undefined;
						was_co = true;
						break;
					} else {
						// TODO: following is WRONG!
						//b_x = b_x['*'](b[b_i]);
					}
				}
				if (!was_co) {
					a_x = a_x['*'](a[a_i]);
				}
			}
			// Leftover b
			for (b_i = 0; b_i < b_l; b_i++) {
				if(b[b_i] === undefined) {
					continue;
				}
				b_x = b_x['*'](b[b_i]);
			}
			if (common.length) {
				console.log("common:", common, "of: ", a,b);
				common.forEach(yes);
				// The no will be a sum
				// TODO: a_c, and b_c
				// result: common * (a_c * a + b_c * b)
				// TODO: a_c never needs to be factorised again w.r.t. vars (it is constant)
				console.log("(a,b) = ", a_x, b_x);
				console.log("(a_c,b_c) = ", a_c, b_c);
				yes(a_x['*'](a_c)['+'](b_x['*'](b_c)));
			} else {
				// Pointless! (unless we remember not to do it again)
				no(this);
			}
			return;
		case '*':
			this[0].factors(vars, yes, no);
			this[1].factors(vars, yes, no);
			return;
		case '/':
			this[0].factors(vars, yes, no);
			if(collect_recip === false) {
				return;
			}
			this[1].factors(vars,
				function (x, r){
					yes(x, !r)
				},
				function (x, r){
					no(x, !r);
				}
			);
			return;
	}
};

(function () {
	Expression.prototype.factors = function (vars) {
	return new Multiset();
};
Expression.Symbol.Real.prototype.factors = function (vars) {
	var r = new Multiset([this], [1]);
	r.vars = []; // TODO: Should have two outputs (callbacks?) (that don't require a O(n) search)
	return r;
};
Expression.List.Real.prototype.factors = function (vars) {
	// TODO: IMPORTANT: Is it better to calculate with (auto-counted) multisets,
	//       or to count after (which would require counting on a user facing .factors)?
	/*
		adding: (n-1)*n/2
		+ union: 
		vs.
		
		count: (n-1)*n/2
	
	*/
	// TODO: Combine factors which have no vars.
	switch (this.operator) {
		case '+':
		case '-':
			// Find common factors:
			var a = this[0].factors(vars);
			var b = this[0].factors(vars);
			if(this.operator === '-') {
				b.add(Global.One['@-']());
			}
			return Multiset([this], [1]);
		case '*':
			var a = (this[0].factors(vars));
			var b = (this[1].factors(vars));
			return a.union(b);
		case '/':
			var a = (this[0].factors(vars));
			var b = (this[1].factors(vars)).map(Global.One['/']);
			return a.union(b);
		case '@-':
			// TODO: Should be deeper
			return Multiset(this[0].factors(vars).add(Global.One['@-']()));
	}
};
});