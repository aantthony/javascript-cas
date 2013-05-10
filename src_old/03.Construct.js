var Construct = {};

// These functions map strings from the parser to javascript-cas objects.

Construct.Number = function (o) {
	var predefined = {
		'0': Global.Zero,
		'1': Global.One
	};
	if(predefined[o]) {
		return predefined[o];
	}
	
	if (/^[\d]+$/.test(o)) {
		return new Expression.Integer(Number(o));
	} else if(/^[\d]*\.[\d]+$/.test(o)){
		var d_place = o.indexOf(".");
		// 12.345 -> 12345 / 1000
		// 00.5 -> 5/10
		var denom_p = o.length - d_place - 1;
		var d = Math.pow(10, denom_p);
		var n = Number(o.replace(".", ""));
		
		return new Expression.Rational(n, d).reduce();
	}
	return predefined[o] || new Expression.NumericalReal(Number(o));
};
Construct.String = function (s) {
	return s;
};
Construct.Single = function (s) {
	// Single latex chars for x^3, x^y etc (NOT x^{abc})
	var n = Math.round(s);
	if(n == s) {
		return new Expression.Integer(n);
	}
	return s;
};