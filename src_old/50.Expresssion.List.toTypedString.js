
// For GLSL type checking when compiling
var glsl={
	'void':1,
	'vec3':2,
	'bool':6,
	'int':3,
	'fp':4,
	'vec2':5,
	'vec4':7,
	'mat2':10,
	'mat3':11,
	'mat4':12,
	'func':20
};

// Javascript types
var javascript = {
	'Boolean': 1,
	'Number': 2,
	'String': 3,
	'undefined': 4,
	'Object': 5,
	'Function': glsl.func,
	'Array': 7,
	'ref': 8
};



var defLang = language;
function Code (s, pre){
	this.pre = [] || pre;
	this.s = '' || s;
	this.vars = 0;
	this.p = Infinity;
}
_ = Code.prototype;
Code.newContext = function () {
	Code.contextVariableCount = 0;
};
Code.newContext();
// For faster evaluation multiple statments. For example (x+3)^2 will first calculate x+3, and so on.
_.var = function () {
	return 't' + (Code.contextVariableCount++).toString(36);
}
_.merge = function (o, str, p, pre) {
	this.s = str;
	if (pre) {
		this.pre.push(pre);
	}
	var i;
	this.pre.push.apply(this.pre, o.pre);
	this.vars += o.vars;
	this.p = p;
	return this;
};
_.update = function (str, p, pre) {
	this. p = p;
	if(pre) {
		this.pre.push(pre);
	}
	this.s = str;
	return this;
}
// Javascript compliation
_.compile = function (x) {
	return Function(x, this.pre.join('\n') + 'return ' + this.s);
};
_.glslFunction = function (type, name, parameters) {
	return type + ' ' + name + '(' + parameters + '){\n' + this.pre.join('\n') + 'return ' + this.s + ';\n}\n';
};


Expression.List.prototype._s = function (lang) {
	// TODO: remove this (debug code)
	if(lang === 'text/latex') {
		return Expression.List.Real.prototype._s.call(this, lang);
	}
	throw('Use real(), imag(), or abs(), or arg() first.');
};
Expression.List.Real.prototype._s = function(lang) {

	function paren(x) {
		if(lang === 'text/latex') {
			return '\\left(' + x + '\\right)'; 
		}
		return '('+ x + ')';
	}
	if (this.operator === undefined) {
		if (this[0] instanceof Expression.Function) {
			if(this[0] === Global.abs) {

				var c1 = this[1]._s(lang);

				if(lang === 'text/latex') {
					return c1.update('\\left|' + c1.s + '\\right|', Infinity);
				}
				var c0 = this[0]._s(lang);
				return c1.update(c0.s + '(' + c1.s + ')', Infinity);
			}
			var c0 = this[0]._s(lang);
			if (this[1] instanceof Expression.Vector) {
				var c1s = Array.prototype.map.call(this[1], function (c) {
					return c._s(lang);
				});
				var i;
				var t_s = c1s.map(function (e){
					return e.s;
				});
				if(this[0] === Global.atan) {
					t_s = t_s.reverse();
				}
				var c0_s = c0.s;
				for (i = 0; i < c1s.length; i++) {
					c0.merge(c1s[i]);
				}
				return c0.update(c0_s + paren(t_s), language.precedence('default'));
			}
			var c1 = this[1]._s(lang);
			return c0.merge(c1, c0.s + paren(c1.s), language.precedence('default'));
		} else {
			this.operator = '*';
		}
	}
	var p = language.precedence(this.operator);
	function _(x) {
		if(p > x.p){
			return paren(x.s);
		}
		return x.s;
	}

	if(this.operator === '^') {

		if(lang === 'x-shader/x-fragment') {
			if(this[0] === Global.e) {
				var c1 = this[1]._s(lang);
				return c1.update('exp(' + c1.s + ')');
			}
			if(this[1] instanceof Expression.Integer && this[1].a < 5 && this[1].a > -1) {
				var c0 = this[0]._s(lang);
				var j = language.precedence('*');
				
				var pre = undefined;
				var cs;
				if(this[0] instanceof Expression.Symbol) {
					cs = c0.s;
				} else {
					
					cs = c0.var();
					
					pre = 'float ' + cs + ' = ' + c0.s + ';';
				
				}
				var s = cs;
				var i;
				for(i = 1; i < this[1].a; i++) {
					s+= '*' + cs;
				}
				return c0.update('(' + s + ')', Infinity, pre);
			}
			if(this[1] instanceof Expression.Integer && this[1].a == -1) {
				var c0 = this[0]._s(lang);
				// todo: precedence not necessary
				return c0.update('(1.0/(' + c0.s + '))');
			}
			if(this[1] instanceof Expression.Rational) {
				// a^2, 3, 4, 5, 6 
				// unsure it is gcd
				this[1] = this[1].reduce();
				var even = this[1].a % 2 ? false : true;
				if(even) {
					var c1 = this[1]._s(lang);
					var c0 = this[0]._s(lang);
					
					return c0.merge(c1, 'pow(' + c0.s + ',' + c1.s  + ')');
				} else {

					// x^(a) = (x) * x^(a-1)
					var c1 = this[1]['-'](Global.One)._s(lang);
					var c0 = this[0].s_(lang);
					
					return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
				}
			}
			if (this[0] instanceof Expression.NumericalReal) {

				// Neg or pos.
				var c1 = this[1]['-'](Global.One)._s(lang);
				var c0 = this[0]._s(lang);
				
				return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
				
			}
			var c1 = this[1]['-'](Global.One)._s(lang);
			var c0 = this[0]._s(lang);
				
			// Needs a new function, dependent on power.
			return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
			
		} else if(lang === 'text/javascript') {
			if(this[0] === Global.e) {
				var c1 = this[1]._s(lang);
				return c1.update('Math.exp(' + c1.s + ')');
			}
			if(this[1] instanceof Expression.Rational) {
				// a^2, 3, 4, 5, 6 
				var even = this[1].a % 2 ? false : true;
				if(even) {
					var c1 = this[1]._s(lang);
					var c0 = this[0]._s(lang);
					
					return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s  + ')');
				} else {

					var c1 = this[1]._s(lang);
					var c0 = this[0]._s(lang);
					
					return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
				}
			} else {

				var c1 = this[1]._s(lang);
				var c0 = this[0]._s(lang);
				
				// Needs a new function, dependent on power.
				return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
			}
			
		} else if (lang === 'text/latex'){
			var c0 = this[0]._s(lang);
			var c1 = this[1]._s(lang);
			return c0.merge(c1, _(c0) + '^' + '{' + c1.s + '}')
		}
	}

	var c0 = this[0]._s(lang);

	if(this.operator[0] === '@') {
		return c0.update(this.operator[1] + _(c0), p);
	}

	var c1 = this[1]._s(lang);
	
	if(lang === 'text/latex') {
		if(this.operator === '/') {
			return c0.merge(c1, '\\frac{' + c0.s + '}{' + c1.s + '}')
		}
		if(this.operator === '*') {
			return c0.merge(c1, _(c0) + _(c1), p);
		}
	} else if (lang === 'x-shader/x-fragment') {
		if(this.operator === '%') {
			return c0.merge(c1, 'mod(' + _(c0) + ',' + _(c1) + ')', p);
		}
	}

	return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};
Expression.Statement.prototype._s = Expression.List.Real.prototype.s;
Expression.Symbol.prototype._s = function () {
	return new Code(this.symbol || 'x_{free}');
};
Expression.NumericalReal.prototype._s = function (lang){
	if(lang === 'x-shader/x-fragment') {
		var num = this.value.toExponential();
		if(num.indexOf('.') === -1){
			num = num.replace('e','.e');
		}
		return new Code(num);
	}
	return new Code(this.value.toString());
};
Expression.List.ComplexPolar.prototype._s = function(lang) {
	if(lang !== 'text/latex') {
		throw('Exporting not supported for complex values.');
	}

	var pP = language.precedence('+');
	var pM = language.precedence('*');
	function _(x, o) {
		if(o > x.p){
			return '\\left(' + x.s + '\\right)';
		}
		return x.s;
	}

	var c0 = this[0]._s(lang);
	var c1 = this[1]._s(lang);
	return c0.merge(c1, _(c0, pM) + '' + 'e^{i' + _(c1, pM));
	
};
Expression.List.ComplexCartesian.prototype._s = function(lang) {
	if(lang !== 'text/latex') {
		throw('Exporting not supported for complex values.');
	}
	var pP = language.precedence('+');
	
	function _(x, o) {
		if(o > x.p){
			return '\\left(' + x.s + '\\right)';
		}
		return x.s;
	}

	var c0 = this[0]._s(lang);
	var c1 = this[1]._s(lang);
	return c0.merge(c1, _(c0) + '+' +_(c1, pP)+'i', language.precedence('+'));
};
Expression.NumericalComplex.prototype._s = function(lang) {
	deprecated('NumericalComplex.toTypedString????');
	if (lang === 'text/latex') {
		
		var n = this.realimag();

		if (this._real === 0) {
			if (this._imag === 1) {
				return new Code('i');
			} else if (this._imag === -1) {
				return new Code('-i');
			}
			return new Code(n[1]._s(language).s + 'i');
		} else if(this._imag === 0) {
			return new Code(n[0]._s(language).s);
		}
		if(this._imag === 1) {
			return new Code(n[0]._s(language).s + ' + i');
			
		} else if(this._imag === -1) {
			return new Code(n[0]._s(language).s + ' - i');
		} else if(this._imag < 0) {
			return new Code(n[0]._s(language).s + ' + ' + n[1]._s(language).s + 'i');
		}
		return new Code(n[0] + ' + ' + n[1]._s(language).s + 'i');
	}
	throw('Please use x.realimag()[0 /* or 1 */].toTypedString() to generate code.');
};
Expression.Integer.prototype._s = function (lang) {
	if(lang === 'x-shader/x-fragment') {
		return new Code(this.a.toString() + '.0');
	}
	return new Code(this.a.toString());
};

Expression.Vector.prototype._s = function(lang) {
	var l = this.length;
	var open = '[';
	var close = ']';
	if(lang === 'x-shader/x-fragment') {
		open = 'vec' + this.length + '(';
		close = ')';
	}
	var c = this[0]._s(lang);
	var i;
	var t_s = [];
	for (i = 0; i < l; i++) {
		var c_i = this[i]._s(lang);
		t_s.push(c_i.s);
		c = c.merge(c_i);
	}
	return c.update(open + t_s.join(',') + close, Infinity);
};


Expression.Statement.prototype._s = function (lang) {
	var p = language.precedence(this.operator);
	function _(x) {
		if(p > x.p){
			return paren(x.s);
		}
		return x.s;
	}
	
	var c0 = this[0]._s(lang);
	var c1 = this[1]._s(lang);
	
	return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};
Expression.True._s = function (lang) {
	return new Code('true');
};

Expression.False._s = function (lang) {
	return new Code('false');
};


Expression.prototype.s = function (lang) {
	Code.newContext();
	return this._s(lang);
};


Expression.prototype.compile = function(x){
	return this.s('text/javascript').compile(x);
};
Expression.prototype.glslFunction = function(type, name, args){
	return this.s('x-shader/x-fragment').glslFunction(type, name, args)
};

