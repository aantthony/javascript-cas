
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
Expression.List.Real.prototype.toTypedString = function(language) {

	if(this.operator === '^') {

		if(language === 'x-shader/x-fragment') {
		
			if(this[1] instanceof Expression.Rational) {
				// a^2, 3, 4, 5, 6 
				var sign_p = this[1].a > 0 ? 1 : -1;
				var ex = this[1].toTypedString(language);
				var ba = this[0].toTypedString(language);
				
				if(sign_p === +1) {
					return {
						s: 'pow(' + ex.s + ',' + ba.s + ')',
						t: javascript.Number,
						p: defLang.precedence('^')
					};
				} else {
					return {
						s: '-pow(' + ex.s + ',' + ba.s + ')',
						t: javascript.Number,
						p: defLang.precedence('^')
					};
				
					
				}
			} else {
				// Needs a new function, dependent on power.
				
			}
		} 
	}
	return exportLanguages[language](
		this.operator,
		Array.prototype.map.call(this, function(x) {
			return x.toTypedString(language);
		})
	);
	
	
}
Expression.List.prototype.toTypedString = function(language) {
	throw('Not Real!');
	return exportLanguages[language](
		this.operator,
		Array.prototype.map.apply(this, [function(x) {
			return x.toTypedString(language);
		}])
	);
};

Expression.List.ComplexPolar.prototype.toTypedString = function(language) {
	if(language !== 'text/latex') {
		throw('Exporting not supported for complex values.');
	}
	return {
		s: this[0].toTypedString(language).s + '\\cdot e^{i' + this[1].toTypedString(language).s + '}',
		t: javascript.Number
	};
};
Expression.List.ComplexCartesian.prototype.toTypedString = function(language) {
	if(language !== 'text/latex') {
		throw('Exporting not supported for complex values.');
	}
	return {
		s: this[0].toTypedString(language).s + '+ i(' + this[1].toTypedString(language).s + ')',
		t: javascript.Number
	};
};
Expression.NumericalComplex.prototype.toTypedString = function(language) {
	deprecated('NumericalComplex.toTypedString????');
	if (language === 'text/latex') {
		if(this === Global.i) {
			return {s: 'i', t: javascript.Number};
		}
		
		var n = this.realimag();

		if (this._real === 0) {
			if (this._imag === 1) {
				return {s: 'i', t: javascript.Number};
			} else if (this._imag === -1) {
				return {s: '-i', t: javascript.Number};
			}
			return {s: n[1].toTypedString(language).s + 'i', t: javascript.Number};
		} else if(this._imag === 0) {
			return {s: n[0].toTypedString(language).s, t: javascript.Number};
		}
		if(this._imag === 1) {
			return {s: n[0].toTypedString(language).s + ' + i', t: javascript.Number};
			
		} else if(this._imag === -1) {
			return {s: n[0].toTypedString(language).s + ' - i', t: javascript.Number};
		} else if(this._imag < 0) {
			return {s: n[0].toTypedString(language).s + ' + ' + n[1].toTypedString(language).s + 'i', t: javascript.Number};
		}
		return {s: n[0] + ' + ' + n[1].toTypedString(language).s + 'i', t: javascript.Number};
	}
	throw('Please use x.realimag()[0 /* or 1 */].toTypedString() to generate code.');
};
Expression.Integer.prototype.toTypedString = function (language) {
	if(language === 'x-shader/x-fragment') {

		return {s: this.a.toString() + '.0', t: javascript.Number};
		
	}
	return {s: this.a.toString(), t: javascript.Number};
};
Expression.NumericalReal.prototype.toTypedString = function(language) {
	switch(language){
		case 'text/javascript':
			if (this === Global.e) {
				return {s: 'Math.E', t:javascript.Number};
			} else if(this === Global.pi) {
				return {s: 'Math.PI', t:javascript.Number};
			}
			if(this.value === Infinity){
				return 'Infinity';
			}
			return {s:this.value.toString(), t:javascript.Number};
		case 'x-shader/x-fragment':
			var num = this.value.toExponential();
			if(num.indexOf('.') === -1){
				num = num.replace('e','.e');
			}
			return {s:num, t:glsl.fp};
		case 'text/latex':
			var s;
			if (this === Global.e) {
				s = 'e';
			} else if(this === Global.pi) {
				s = '\\pi';
			} else if(this === Global.Infinity) {
				s = '\\infty';
			}
			
			return {
				s:s || this.value.toString()
				.replace(/e([\d\.]+)/, '\\cdot 10^{$1}')
				.replace(/e-([\d\.]+)/, '\\cdot 10^{-$1}'),
				t:javascript.Number};
			
	}
};

Expression.Vector.prototype.toTypedString = function(language) {
	var l = this.length;
	var open = '[';
	var close = ']';
	if(language === 'x-shader/x-fragment') {
		open = 'vec' + this.length + '(';
		close = ')';
	}
	return {
		s: open+Array.prototype.map.apply(this, [function(component){
			return component.toTypedString(language).s;
		}]).join(', ')+close,
		t:  javascript.Array
	};
};

Expression.Symbol.prototype.toTypedString=function(language) {
	var s = this.symbol;
	var t = javascript.ref;
	if(language === 'text/javascript'){
		
	}else if(language==='x-shader/x-fragment'){
		t=glsl.fp;
		if(Math[s]){
			t=glsl.func;
		}
	}else{
		//latex
		if(s.length>1){
			s='\\'+s;
		}
	}
	
	return {s:s, t:t};
};



Expression.prototype.compile = function(x){
	var e = this.toTypedString('text/javascript');
	return new Function(x, 'return ' + e.s);
};