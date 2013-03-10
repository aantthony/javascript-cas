var crossProduct = String.fromCharCode(215); // &times; character

/*
  The language class represents both a parser, and information about precedence of operators for string exporter.
  
  These really should be seperate.
  
  At the moment, information is doubled up since precedence of the default language is specified in both the .jison grammar and default_language.js. There is most likely no way around this.
  
*/
function Language(language) {
	var operators = {};
	var op_precedence = 0;
	
	function op(v, assoc,arg_c) {
		//Register an operator
		var memsave = [assoc, op_precedence++, arg_c];
		if (typeof v === 'object') {
			for (var i=0; i<v.length; i++) {
				operators[v[i]] = memsave;
			}
		} else {
			operators[v] = memsave;
		}
	}
	language.forEach(function(o) {
		op(o[0], o[1] || L, (o[2] === undefined) ? 2 : o[2]);
	});
	this.operators = operators;
	Language.build.call(this);
}
_ = Language.prototype;
_.precedence = function (v) {
    //deprecated('Slow');
	if (!this.operators[v]) {
		throw('Precedence of ' + v + ' not known!');
	}
	return this.operators[v][1];
};

_.postfix = function (o) {
	var op = this.operators[o];
	return op[0] === 0 && op[2] === 1;
};
_.unary = function (o) {
	var unary_secondarys = ['+', '-', '±'];
	return (unary_secondarys.indexOf(o) != -1) ? ('@' + o) : false;
};

_.assoc = function(o) {
	return this.operators[o][1] === true;
};

_.Number = function(o) {
	// Support for integers
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