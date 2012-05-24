
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


var exportLanguages={
	'text/javascript': function (o,x){
		function _(x){
			return '('+x+')';
		}
		// TODO: Fails on f(x)^2
		var p = o === undefined ? language.precedence('default') : language.precedence(o);
		function S_(x){
			if(x.p<=p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case '=':
				return {s:S_(x[0])+o+S_(x[1]), t: javascript.assignment, p: p};
			case '&&':
			case '<':
			case '>':
			case '>=':
			case '<=':
			case '!==':
			case '!=':
			case '==':
			case '===':
			
				return {s:S_(x[0])+o+S_(x[1]), t: javascript.Boolean, p: p};
			
			case '+':
			case '-':
			case '/':
			case '*':
			case '?':
			case ':':
			case ',':
			case '>>':
			case '<<':
			case '&':
			case '%':
				return {s:S_(x[0])+o+S_(x[1]), t: javascript.Number, p: p};
			case '_':
				if(x[0].t === javascript.ref && (x[1].t === javascript.ref || x[1].t == javascript.Number)){
					return {s:S_(x[0])+o+S_(x[1]), t: javascript.ref, p: p};
				}else{
					throw('Operator \'_\' does not exist in javaScript for those types.');
				}
			case '~':
				return {s:o+S_(x[0]),t:javascript.Number, p: p};
			case '@-':
			case '@+':
				return {s:o.substring(1)+S_(x[0]),t:javascript.Number, p: p};
			case '^':
				return {s:'Math.pow('+x[0].s+','+x[1].s+')',t:javascript.Number, p: p};
			case undefined:
				if(x[0].t===javascript.Function){
					return {s:x[0].s+'('+x[1].s+')',t:javascript.Number, p: p};
				}else{
					//this is ugly:
					p=language.precedence('*');
					return {s:S_(x[0])+'*'+S_(x[1]),t:javascript.Number, p: p};
				}
			case '#':
				//p=precedence('return ');
				return {s:'function(x){return '+x[0].s+'}', t:javascript.Function, p: p};
			case '√':
				return {s:'Math.sqrt('+x[0].s+')',t:javascript.Number, p: p};
			case '!':
				return {s:'factorial('+x[1].s+')',t:javascript.Number, p: p};
			default:
				throw('Could not translate operator: \''+o+'\' into javscript!');
		}
	},
	'x-shader/x-fragment':function(o, x){
		//http://www.opengl.org/registry/doc/GLSLangSpec.Full.1.20.8.pdf
		function _(x) {
			return '(' + x + ')';
		}
		// TODO: Fails on f(x)^2
		var p = o === undefined ? language.precedence('default') : language.precedence(o);
		function S_(x) {
			if(x.p <= p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case '&&':
			case '||':
				if(x[0].t === x[1].t && x[1].t === glsl.bool){
					return {s:S_(x[0])+o+S_(x[1]), t: glsl.bool, p: p};
				}
				throw('Operands must also be boolean values');
			case '==':
			case '<':
			case '>':
			case '<=':
			case '>=':
			case '!=':
				if(x[0].t !== x[1].t){
					throw('The equality operators and assignment operator are only allowed if the two operands are same size and type.');
				}
				return {s:S_(x[0])+o+S_(x[1]), t: glsl.bool, p: p};
			
			case ':':
				if(x[0].t !== x[1].t){
					throw('Switching groups must be the same type');
				}
				
				return {s:S_(x[0])+o+S_(x[1]), t: x[1].t, p: p};
			case '?':
				if(x[0].t !== glsl.bool){
					throw('Must be boolean type');
				}
				return {s:S_(x[0])+o+S_(x[1]), t: x[1].t, p: p};
				
			case '+':
			case '-':
			case ',':
				if(x[0].t !== x[1].t){
					throw('Types don\'t match: '+x[0].t+', '+x[1].t);
				}
				return {s:S_(x[0])+o+S_(x[1]), t: glsl.fp, p: p};
			case '*':
			case '/':
				return {s:S_(x[0])+o+S_(x[1]), t: glsl.fp, p: p};
			case '_':
				/*if(a.t === types.variable && (b.t === types.variable || b.t == types.number)){
					return {s:S_(a)+o+S_(b), t: glsl.float, p: p};
				}else{
					throw('Operator '_' does not exist in javaScript for those types.');
				}*/
				throw('Write this later.');
			case '~':
				return {s:o+S_(x[0]),t:javascript.Number, p: p};
			case '@-':
			case '@+':
				return {s:o.substring(1)+S_(x[0]),t:glsl.fp, p: p};
			case '^':
				//TODO: remove this hack
				if (x[0].s === '2.718281828459045e+0') {
					return {s: 'exp('+x[1].s+')', t: glsl.fp, p: p};
				}
				return {s:'pow('+x[0].s+','+x[1].s+')',t:glsl.fp, p: p};
			case undefined:
				if(x[0].t===glsl.func){
					return {s:x[0].s+'('+x[1].s+')',t:glsl.fp, p: p};
				}else{
					//this is ugly:
					p=language.precedence('*');
					return {s:S_(x[0])+'*'+S_(x[1]),t:glsl.fp, p: p};
				}
			case '#':
				throw('Anonymous functions not supported.');
			case '√':
				return {s:'sqrt('+x[0].s+')',t:glsl.fp, p: p};
			case '!':
				//requirements....
				return {s:'factorial('+x[0].s+')',t:glsl.fp, p: p};
			case '%':
				return {s: 'mod('+x[0].s+','+x[1].s+')',t:glsl.fp, p:p};
			case '&':
			case '|':
			//case '%':
			case '~':
			case '>>':
			case '<<':
				throw('Reserved');
			default:
				throw('Could not translate operator: \''+o+'\' into glsl!');
		}
	},
	'text/latex':function(o,x){
		function _(x){
			return '\\left('+x+'\\right)';
		}
		// TODO: Fails on f(x)^2
		var p = o === undefined ? language.precedence('default') : language.precedence(o);
		function S_(x, e){
			if(e){
				if(x.p < p){
					return _(x.s);
				}
				return x.s;
			}
			if(x.p === p) {
				return language.assoc(o) === true ? x.s : _(x.s);
			} else if(x.p <= p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case '/':
				return {s:'\\frac{'+x[0].s+'}{'+x[1].s+'}',t:javascript.Number, p: p};
			case '^':
			case '_':
				return {s:S_(x[0])+o+'{'+x[1].s+'}',t:javascript.ref, p: p};
			case undefined:
			//TODO: CLEANUP, check types
				if (x[0].s === '\\sqrt') {
					return {s: '\\sqrt{'+x[1].s + '}',t:javascript.Number, p: p};
				} else if (x[0].s === '\\abs') {
					return {s: '\\left|'+x[1].s + '\\right|',t:javascript.Number, p: p};
				}
				return {s: S_(x[0], 1) + ' ' + S_(x[1], 1), t: javascript.Number, p: p};
				return {s:S_(x[0])+_(x[1].s),t:javascript.Number, p: p};
			//case '√':
			//	return {s:'\\sqrt{'+x[0].s+'}',t:javascript.Number, p: p};
			case '#':
				return {s:o+_(x[0].s),t:javascript.Fumber};
			case ',':
				return {
					s: '\\left('+x.map(S_).join(o)+'\\right)',
					t: javascript.Array,
					p: p
				};
		}
		if(o[0]=='@'){
			return {s:o[1]+S_(x[0]),t:javascript.Number, p: p};
		}
		if(language.postfix(o)){
			return {s:S_(x[0])+o, t:javascript.Number, p: p};
		}
		var self=this;
		var os={
				//'*':'\\cdot ',
				'*':' ',
				'∨':'\\vee ',
				'&&':'\\wedge ',
				'±':'\\pm ',
				'∘':'\\circ '
		};
		return {
			s: x.map(S_).join(os[o] || o),
			t: javascript.Number,
			p: p
		};
	}
};
var defLang = language;
function Code (s, pre){
	this.pre = [] || pre;
	this.s = '' || s;
	this.vars = 0;
	this.p = Infinity;
}
Code.prototype.var = function () {
	return 't' + (this.vars++).toString(36);
}
Code.prototype.merge = function (o, str, p, pre) {
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
Code.prototype.update = function (str, p, pre) {
	this. p = p;
	if(pre) {
		this.pre.push(pre);
	}
	this.s = str;
	return this;
}
Code.prototype.compile = function (x) {
	return Function(x, this.pre.join('\n') + 'return ' + this.s);
};

Expression.List.prototype.s = function (lang) {
	// TODO: remove this (debug code)
	if(lang === 'text/latex') {
		return Expression.List.Real.prototype.s.call(this, lang);
	}
};
Expression.List.Real.prototype.s = function(lang) {

	function paren(x) {
		if(lang === 'text/latex') {
			return '\\left(' + x + '\\right)'; 
		}
		return '('+ x + ')';
	}
	if (this.operator === undefined) {
		if (this[0] instanceof Expression.Function) {
			if(this[0] === Global.abs) {
				var c1 = this[1].s(lang);
				return c1.update('\\left|' + c1.s + '\\right|', Infinity);
			}
			var c0 = this[0].s(lang);
			if (this[1] instanceof Expression.Vector) {
				var c1s = Array.prototype.map.call(this[1], function (c) {
					return c.s(lang);
				});
				var i;
				var t_s = c1s.map(function (e){
					return e.s;
				});
				var c0_s = c0.s;
				for (i = 0; i < c1s.length; i++) {
					c0.merge(c1s[i]);
				}
				return c0.update(c0_s + paren(t_s), language.precedence('default'));
			}
			var c1 = this[1].s(lang);
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
				var c1 = this[1].s(lang);
				return c1.update('exp(' + c1.s + ')');
			}
			if(this[1] instanceof Expression.Integer && this[1].a < 5) {
				var c0 = this[0].s(lang);
				var cs = c0.s;
				var j = language.precedence('*');
				if (j > c0.p) {
					cs = '(' + cs + ')';
				}
				var s = cs;
				var i;
				for(i = 1; i < this[1].a; i++) {
					s+= '*' + cs;
				}
				return c0.update('(' + s + ')');
			}
			if(this[1] instanceof Expression.Rational) {
				// a^2, 3, 4, 5, 6 
				var even = this[1].a %2 ? false : true;
				if(even) {

					var c1 = this[1].s(lang);
					var c0 = this[0].s(lang);
					
					return c0.merge(c1, 'pow(' + c0.s + ',' + c1.s  + ')');
				} else {

					var c1 = this[1]['-'](Global.One).s(lang);
					var c0 = this[0].s(lang);
					
					return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
				}
			} else if (this[0] instanceof Expression.NumericalReal) {

				// Neg or pos.
				var c1 = this[1]['-'](Global.One).s(lang);
				var c0 = this[0].s(lang);
				
				return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
				
			} else {

				var c1 = this[1]['-'](Global.One).s(lang);
				var c0 = this[0].s(lang);
				
				// Needs a new function, dependent on power.
				return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
			}
		} else if(lang === 'text/javascript') {
			if(this[0] === Global.e) {
				var c1 = this[1].s(lang);
				return c1.update('Math.exp(' + c1.s + ')');
			}
			if(this[1] instanceof Expression.Rational) {
				// a^2, 3, 4, 5, 6 
				var even = this[1].a % 2 ? false : true;
				if(even) {
					var c1 = this[1].s(lang);
					var c0 = this[0].s(lang);
					
					return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s  + ')');
				} else {

					var c1 = this[1].s(lang);
					var c0 = this[0].s(lang);
					
					return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
				}
			} else {

				var c1 = this[1].s(lang);
				var c0 = this[0].s(lang);
				
				// Needs a new function, dependent on power.
				return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
			}
			
		} else if (lang === 'text/latex'){
			var c0 = this[0].s(lang);
			var c1 = this[1].s(lang);
			return c0.merge(c1, _(c0) + '^' + '{' + c1.s + '}')
		}
	}

	var c0 = this[0].s(lang);

	if(this.operator[0] === '@') {
		return c0.update(this.operator[1] + _(c0), p);
	}

	var c1 = this[1].s(lang);
	
	if(lang === 'text/latex') {
		if(this.operator === '/') {
			return c0.merge(c1, '\\frac{' + c0.s + '}{' + c1.s + '}')
		}
		if(this.operator === '*') {
			return c0.merge(c1, _(c0) + _(c1), p);
		}
	}

	return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};
Expression.Statement.prototype.s = Expression.List.Real.prototype.s;
Expression.Symbol.prototype.s = function () {
	return new Code(this.symbol);
};
Expression.NumericalReal.prototype.s = function (lang){
	if(lang === 'x-shader/x-fragment') {
		var num = this.value.toExponential();
		if(num.indexOf('.') === -1){
			num = num.replace('e','.e');
		}
		return new Code(num);
	}
	return new Code(this.value.toString());
};
Expression.List.ComplexPolar.prototype.s = function(lang) {
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

	var c0 = this[0].s(lang);
	var c1 = this[1].s(lang);
	return c0.merge(c1, _(c0, pM) + '' + 'e^{i' + _(c1, pM));
	
};
Expression.List.ComplexCartesian.prototype.s = function(lang) {
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

	var c0 = this[0].s(lang);
	var c1 = this[1].s(lang);
	return c0.merge(c1, _(c0) + '+' +_(c1, pP)+'i', language.precedence('+'));
};
Expression.NumericalComplex.prototype.s = function(lang) {
	deprecated('NumericalComplex.toTypedString????');
	if (lang === 'text/latex') {
		
		var n = this.realimag();

		if (this._real === 0) {
			if (this._imag === 1) {
				return new Code('i');
			} else if (this._imag === -1) {
				return new Code('-i');
			}
			return new Code(n[1].s(language).s + 'i');
		} else if(this._imag === 0) {
			return new Code(n[0].s(language).s);
		}
		if(this._imag === 1) {
			return new Code(n[0].s(language).s + ' + i');
			
		} else if(this._imag === -1) {
			return new Code(n[0].s(language).s + ' - i');
		} else if(this._imag < 0) {
			return new Code(n[0].s(language).s + ' + ' + n[1].s(language).s + 'i');
		}
		return new Code(n[0] + ' + ' + n[1].s(language).s + 'i');
	}
	throw('Please use x.realimag()[0 /* or 1 */].toTypedString() to generate code.');
};
Expression.Integer.prototype.s = function (lang) {
	if(lang === 'x-shader/x-fragment') {
		return new Code(this.a.toString() + '.0');
	}
	return new Code(this.a.toString());
};

Expression.Vector.prototype.s = function(lang) {
	var l = this.length;
	var open = '[';
	var close = ']';
	if(lang === 'x-shader/x-fragment') {
		open = 'vec' + this.length + '(';
		close = ')';
	}
	var c = this[0].s(lang);
	var i;
	var t_s = [];
	for (i = 0; i < l; i++) {
		var c_i = this[i].s(lang);
		t_s.push(c_i.s);
		c = c.merge(c_i);
	}
	return c.update(open + t_s.join(',') + close, Infinity);
};



Expression.prototype.compile = function(x){
	return this.s('text/javascript').compile(x);
};