// Does not work!!!, but a general idea of how it would once bugs are fixed.

function solveLinearIntersect(a,b, c,  d,e, f) {
	// ax + by = c;
	// dx + ey = d;
	console.log('WORKED: ', arguments);
	if(a === 0) {
		var y = c/b;
		var x = (d-e*y)/x;
		return [x, y];
	}
	var denom = e-d/a * b;
	if(denom === 0) {
		// Either infinite solutions or no solutions
		return [undefined, undefined];
	}
	var y = (f-d*c/a)/denom;
	var x = (c-b*y) / a;
	return [x, y];
}

var c = new M.Context();
c.x = M("x", c);
c.y = M("y", c);

function solveSystem(str) {
	var eqs = M(str || "x+5y-2, -3x +6y - 15", c);
	var values = [];
	var i;
	for(i = 0; i < eqs.length; i++) {
		// ith equation:
		var eq = eqs[i];
		var matrix_row = [];
		var constant = M("0");
		var x_co = M("0");
		var y_co = M("0");
		var terms = eq.terms([c.x],
			function (with_x) {
				var coeff = M("0");
				with_x.factors([c.y],
					function (x){
						// Ignore the "x"
						console.log('x factor: (should only be one): ', x);
					},
					function (a){
						console.log('factor_coeff:', a);
						coeff = coeff['*'](a);
					}
				);
				console.log('term coeff: ', coeff);
				x_co = x_co['+'](coeff);

			},
			function (without_x) {
				// Add them up in case there are multiple (e.q. x+2+3)
				// Only collect those without y:
				without_x.terms([c.y],
					function (with_y){
						var coeff = M("0");
						with_y.factors([c.y],
							function (){
								// Ignore the "y"
							},
							function (a){
								coeff = coeff['*'](a);
							});
						y_co = y_co['+'](coeff);
					},
					function (with_const) {
						constant = (constant)['+'](with_const);
					}
				);
			}
		);
		// Although the .terms function looks asyncronous,
		// it won't get to here until its completely finsished.
		values.push(
			x_co,
			y_co,
			constant
		);
	}

	var solution = solveLinearIntersect.apply(this, values.map(function (x) {
		return x.value;
	}));
	return [solution[0], solution[1]];
}