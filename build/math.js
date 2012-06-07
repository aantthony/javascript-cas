/**
 *  Math JavaScript Library v3.0.0
 *  https://github.com/aantthony/javascript-cas
 *  
 * Copyright 2010 Anthony Foster. All rights reserved.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


(function(undefined){
	"use strict";
	function deprecated(message){
	var err = new Error(message).stack;
	if(!err){
		return console.warn('Deprecated: ' + message);
	}
    console.warn(err.replace(/^Error\: /, 'Deprecated: '));
}

var startTime = new Date();function Language(language) {
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
Language.prototype.precedence = function (v) {
    //deprecated('Slow');
	if (!this.operators[v]) {
		throw('Precedence of ' + v + ' not known!');
	}
	return this.operators[v][1];
};

Language.prototype.postfix = function (o) {
	var op = this.operators[o];
	return op[0] === 0 && op[2] === 1;
};
Language.prototype.unary = function (o) {
	var unary_secondarys = ['+', '-', '±'];
	return (unary_secondarys.indexOf(o) != -1) ? ('@' + o) : false;
};

Language.prototype.assoc = function(o) {
	return this.operators[o][1] === true;
};

Language.prototype.Number = function(o) {
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
};Language.build = function () {
	function deLaTeX(s) {
		//Converts a latex format equation into a text based one, 
		//where multi-character names keep a preceeding and required \ character

		//A mess!!!!
		var i, l = s.length;
		//indexOf is BAD!!! It is fine only when we only have one type of \expr
		while ((i = s.indexOf('\\begin')) != -1) {
			var n = s.indexOf('}', i+7);

			var type = s.substring(i+7,n);

			var end_string = '\\end{'+type+'}';

			var b = s.indexOf(end_string, n);
			var x = s.substring(n+1,b);
			switch (type) {
				case 'matrix':

					x = x.replace(/\\\:/g, ',').replace(/\\\\/g, ';');
					s = s.split('');

					s[i] = '[';
					s.splice(b, end_string.length - 1);
					s[b] = ']';
					s.splice(n + 1, b - n - 1, x);
					s.splice(i + 1, n + 1 - i - 1);
					s = s.join('');
					break;
				default:
					throw(new SyntaxError('Latex \\begin{' + type + '} block not understood.'))
			}
		}
		while ((i = s.indexOf('\\text')) !== -1) {
			var n = s.indexOf('}', i + 6);
			var text = s.substring(i + 6, n);
			
			s = s.split('');
			
			s.splice(i, n - i + 1,'\\' + text);
			s = s.join('');
		}
		while ((i = s.indexOf('\\frac')) !== -1) {
			var n, good = false;
			var deep = 0;
			for(n = i + 5; n < l; n++){
				if (s[n] === '{') {
					deep++;
				} else if(s[n] === '}') {	
					deep--;
					if (!deep) {
						good = true;
						break;
					}
				}
			}
			if (!good) {
				throw (new SyntaxError(msg.latexParse));
			}
			good = false;
			
			if (s[n+1] !== '{') {
				throw (new SyntaxError('Unexpected \'' + s[n+1] + '\' between \\frac operands'));
			}
			
			var i2 = n + 1;
			var n2;
			for (n2 = i2; n2 < l; n2++) {
				if (s[n2] === '{') {
					deep++;
				} else if (s[n2] === '}') {
					
					deep--;
					if (!deep) {
						good = true;
						break;
					} else {
						
					}
				}
			}
			if (!good) {
				throw (new SyntaxError(msg.latexParse));
			}
			s = s.split('');
			
			//TODO: bad idea. maybe fix requiresParen...
			s[i+5] = '((';
			s[n] = ')';
			s[i2] = '(';
			s[n2] = '))';
			s.splice(i2, 0, '/');
			s.splice(i, 5);
			s = s.join('');
			
		}
		s = s.replace(/\^([^\{\(])/g, '^{$1}');
		s = s.replace(/\\left\|/g, '\\abs(');
		s = s.replace(/\\right\|/g, ')');
		s = s.replace(/\\\:/g, ' ');
		s = s.replace(/\\([a-z\%]+)/g, function(u, x) {
			var s = latexexprs[x];
			return ' '+ ((s !== undefined) ? s : ('\\' + x));
		});

		//Naughty:
		s = s.replace(/[\[\{]/g, '(');
		s = s.replace(/[\]\}]/g, ')');

		return s;
	}
	var latexexprs = {
			'cdot': '*',
			'vee': '∨',
			'wedge': '&&',
			'neg': '¬',
			'left': '',
			'right': '',
			'pm': '±',
			'circ': '∘',
			//'sqrt': '\u221A',
			'div': '/',
			'%': '%',
			'gt': '>',
			'left|': '\\abs(',
			'right|': ')',
			'times': '*',
			':': '',
			'left(': '(',
			'right)': ')',
			'left[': '[',
			'right]': ']',
			'ge': '>=',
			'lt': '<',
			'le': '<=',
			'sim': '~',
			'frac': '',
			'backslash': '\\'
		},
		operators = this.operators,
		token_types = {
			string: 1,
			number: 2,
			operator: 3,
			comment: 4,
			parenopen: 5,
			parenclose: 6,
    		symbol: 7
		},
		nummustbe = '1234567890.',
		operator_str_list = ['+', '-', '@', '*', '/', '^', '++', '=', '!', ',', '@-', '@+', '_', '#', '<', '<=', '>', '>=', '%'],
		parenopenmustbe = '([{',
		parenclosemustbe = '}\'])',
		varcannotbe = operator_str_list.join('') + parenopenmustbe + parenclosemustbe + nummustbe,
		default_operator = 'default',
		match = [
	    	function none() {
	        	throw('NONE');
	    	},
			function string(x) {
				return false;
			},
			function number(x) {
				return nummustbe.indexOf(x[x.length-1]) !== -1;
			},
			function operator(x) {
				return operator_str_list.indexOf(x) !== -1;
			},
			function comment(x) {
				return x[x.length-1] === ' ';
			},
			function parenopen(x) {
				return (x.length == 1) && (parenopenmustbe.indexOf(x) != -1);
			},
			function parenclose(x) {
				return (x.length == 1) && (parenclosemustbe.indexOf(x) != -1);
			},
			function symbol(x) {
		    	return /^[A-Za-z]$/.test(x[x.length-1]);
			},
			function Error(x) {
		    	throw (new SyntaxError('Invalid character: \'' + x + '\''));
			}
		],
		match = [
	    	function none() {
	        	throw('NONE');
	    	},
			function string(x) {
				return false;
			},
			function number(x) {
				//Not correct: e.g, 3.2.5
				return nummustbe.indexOf(x[x.length - 1]) !== -1;
			},
			function operator(x) {
				return operator_str_list.indexOf(x) !== -1;
			},
			function comment(x) {
				return x[x.length-1] === ' ';
			},
			function parenopen(x) {
				return (x.length == 1) && (parenopenmustbe.indexOf(x) != -1);
			},
			function parenclose(x) {
				return (x.length == 1) && (parenclosemustbe.indexOf(x) != -1);
			},
			function symbol(x) {
				if(x[0] === '\\') {
					return (x.length === 1) || /^[A-Za-z]$/.test(x[x.length-1]);
				}
				return x.length === 1 && /^[A-Za-z]$/.test(x[0]);
			},
			function Error(x) {
		    	throw (new SyntaxError('Invalid character: \'' + x + '\''));
			}
		],
		names = match.map(function(e) {return e.name;});
	this.parse = function (s, context) {
		if(s === '') {
			return undefined;
		}
		s = deLaTeX(s);
		var last_token_type = token_types.parenopen;
		
		//Stack of tokens for the shunting yard algorithm
		var stack = [];
		//Stack of tokens for RPN notation. ('evaluated' to a tree representation)
		var rpn_stack = [];
		
		var free_context = {};
		function bind(x) {
			var j = free_context[x];
			delete free_context[x];
			return j;
		}
		
		//The evelauation part of the shunting yard algorithm.
		function next_rpn(token) {
			// While there are input tokens left
			// Read the next token from input.
			// If the token is a value
			if (token.t === token_types.number || token.t === token_types.symbol) {
				// Push it onto the stack.
				rpn_stack.push(token.v);
			}
			// Otherwise,
			else {
				//the token is an operator (operator here includes both operators, and functions).
				// It is known a priori that the operator takes n arguments.
				var n = operators[token.v][2];
				// If there are fewer than n values on the stack
				if (rpn_stack.length < n) {
					// (Error) The user has not input sufficient values in the expression.
					throw (new SyntaxError('The \'' + token.v + '\' operator requires exactly ' + n + ' operands, whereas only ' + rpn_stack.length + ' ' + (rpn_stack.length === 1 ? 'was ': 'were ') + 'supplied, namely '+rpn_stack.toString()));
					// Else,
				} else {
					// Pop the top n values from the stack.
					var spliced = rpn_stack.splice( - n, n);
					//var values = ExpressionWithArray(spliced, token.v);
					// TODO: check non-binary operators
					// var values = spliced[0].apply(token.v, spliced.slice(1)[0]);
					var values = spliced[0][token.v](spliced.splice(1)[0]);
					// Evaluate the operator, with the values as arguments.
					//var evaled=(' ('+values[0]+token.v+values[1]+')');
					// Push the returned results, if any, back onto the stack.
					rpn_stack.push(values);
				}
			}
		}

		//Shunting yard algorithm inside out.
		//Because the algorithm reads one token at a time, we can just
		//give it the token as soon as we get that token (from the tokenizer/parser), and
		//instead of pushing to a temporary array, just call next_token(token).
		//The same applies to the RPN evaluator (above)
		function next_token(token) {
		    if (token.t === token_types.symbol) {
				if (token.v[0] === '\\') {
					//Latex names
					token.v = token.v.substring(1);
				}
				//'Keyword' search: eg. break, if. Stuff like that.
				if (operators[token.v]) {
					token.t = token_types.operator;
				} else if (token.v === 'false') {
					token.v = false;
				} else if (token.v === 'true') {
					token.v = true;
				} else if (token.v === 'Infinity') {
					token.v = Infinity;
				} else if (typeof token.v === 'string') {
				    if (context[token.v]) {
				        //Make .v a pointer to the referenced object.
				        token.v = context[token.v];
					} else if (free_context[token.v]) {
						token.v = free_context[token.v];
				    } else {
    				    token.v = free_context[token.v] = new Expression.Symbol.Real(token.v);
				    }
				}
			}
			//console.log('token: ', token.v, names[token.t]);
			//Comments from http://en.wikipedia.org/wiki/Shunting-yard_algorithm
			// Read a token.
			// If the token is a number, then add it to the output queue.
			if (token.t === token_types.number || token.t === token_types.symbol) {
				if (token.t == token_types.number) {
					token.v = language.Number(token.v);
					//token.v = new Expression.NumericalReal(Number(token.v), 0);
				}
				next_rpn(token);
			}
			// If the token is an operator
			if (token.t === token_types.operator) {
				//, o1, then:
				var o1 = token;
				var o1precedence = operators[o1.v][1];
				//var o1associative=associativity(o1.v);
				var o1associative = operators[o1.v][0];
				// ('o2 ' is assumed to exist)
				var o2;
				// while
				while (
				//there is an operator token, o2, at the top of the stack
				(stack.length && (o2 = stack[stack.length - 1]).t === token_types.operator)
				//and
				&&
				// either
				(
				//o1 is left-associative and its precedence is less than or equal to that of o2,
				(o1associative == left && o1precedence <= operators[o2.v][1])
				//or
				||
				//o1 is right-associative and its precedence is less than that of o2
				(o1associative != left && o1precedence < operators[o2.v][1])

				)

				) {
					// pop o2 off the stack, onto the output queue;
					next_rpn(stack.pop());
				}

				// push o1 onto the stack.
				stack.push(o1);
			}
			// If the token is a left parenthesis,
			if (token.t === token_types.parenopen) {
				//then push it onto the stack.
				stack.push(token);
			}
			// If the token is a right parenthesis:
			if (token.t === token_types.parenclose) {
				// Until the token at the top of the stack is a left parenthesis,
				while (stack[stack.length - 1].t !== token_types.parenopen) {
					// If the stack runs out without finding a left parenthesis, then
					if (!stack.length) {
						//there are mismatched parentheses.
						throw (new SyntaxError(msg.parenMismatch));
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

				// Pop the left parenthesis from the stack, but not onto the output queue.
				if (stack.pop().t !== token_types.parenopen) {
					throw ('Pop the left parenthesis from the stack: Not found ! ')
				}
			}
		}
		function next_raw_token(str, t) {
		    if(t === token_types.comment) {
		        return;
		    }
		    if (t !== token_types.operator && t !== token_types.parenclose) {
		        if(last_token_type !== token_types.parenopen) {
    		        if(last_token_type !== token_types.operator) {
    		            next_raw_token(default_operator, token_types.operator);
    		        }
    		    }
		    } else if (t === token_types.operator && !language.postfix(str)) {
				if (last_token_type === token_types.parenopen || last_token_type === token_types.operator) {
					if (language.unary(str)) {
						str = language.unary(str);
					}
				}
			}
		    next_token({v: str, t: t});
		    last_token_type = t;
		}
		var i = 0;
		var l = s.length;
		var current_token = s[0];
		var t;
		// 8 : Object.keys(token_types).count + 1
		for (t = 1; t < 8; t++) {
			if (match[t](current_token)) {
				break;
			}
		}
        for (i = 1; i < l; i++) {
            var ds = s[i];
            var cds = current_token + ds;
            if (match[t](cds)) {
                current_token = cds;
            } else {
                var nt;
                for (nt = 1; nt < 8; nt++) {
                    if (match[nt](ds)) {
                        break;
                    }
                }
                next_raw_token(current_token, t);
                t = nt;
                current_token = ds;
            }
        }
        next_raw_token(current_token, t);

		//Shunting yard algorithm:
		// (The final part that does not read tokens)
		// When there are no more tokens to read:
		// While there are still operator tokens in the stack:
		while (stack.length) {
			var the_operator;
			// If the operator token on the top of the stack is a parenthesis, then
			var t__ = (the_operator = stack.pop()).t;
			if ((t__ === token_types.parenopen) || (t__ === token_types.parenclose)) {
				//there are mismatched parentheses.
				throw ('There are mismatched parentheses.');
			}
			//Pop the operator onto the output queue.
			next_rpn(the_operator);
		}
		if (rpn_stack.length !== 1) {
			throw('Stack not the right size!');
			//who gives?
			return rpn_stack;
		}
		
		// Free variables: (these could be used to quickly check which variables an equation has).
		// Perhaps every expression should have such a context, but maybe that would take too much ram.
		rpn_stack[0].unbound = free_context;
		return rpn_stack[0];
	};
};//Language.prototype.parse = function(str, context, output) {
//	output.push(str);
//};

// See Language._build (exec on new Language())

var Global = {};
var left, right;
var L = left = 0;
var R = right = 1;

var language = new Language([
	[';'],			/*L / R makes no difference???!??!? */
	[','],
	[['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='],R],
	[['?',':'],R,2],
	[['∨']],
	[['&&']],
	[['|']],
	[['??????']],//XOR
	[['&']],
	[['==', '≠', '!==', '===']],
	[['<', '<=', '>', '>='],L],
	[['>>', '<<']],
	['±', R, 2],
	[['+'], true],
	[['-'], L],
	[['∫', '∑'], R, 1],
	[['*', '%'], R],
	[['@+', '@-', '@±'], R, 1], //unary plus/minus
	[['¬'], L, 1],
	['default', R, 2], //I changed this to R for 5sin(t)
	['∘', R, 2],
	[['/']],
	[['^']],//e**x
	['!', L, 1],
	[['~'], R, 1], //bitwise negation
	[['++', '++', '.', '->'],L,1],
	[['::']],
	[['_'], L, 2],
	['var', R, 1],
	['break', R, 0],
	['throw', R, 1],
	['\'', L, 1],
	['\u221A', R, 1], // Sqrt
	['#', R, 1]	/*anonymous function*/
]);

/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/

var mathematica = new Language([
	[';'],
	[','],
	[['=', '+=']]
]);function Context() {
	
}
Context.prototype = Object.create(Global);
Context.prototype.reset = function() {
	this.splice(0);
};
Context.prototype.impliesExpression = function(expr) {
	return false;
};
Context.prototype.learn = function(expr) {
	this.equations.push(expr);
};function Expression(e, c) {
	var n = language.parse(e, c);
	return n;
}

//Expression.prototype = Object.create(Array.prototype);
//Expression.prototype = {};
Expression.prototype.valueOf = null;
Expression.prototype.identity = function () {
    deprecated('Slow');
	return this;
};

Expression.prototype.toString = null;
Expression.prototype.imageURL = function () {
	return 'http://latex.codecogs.com/gif.latex?' + encodeURIComponent(this.s('text/latex').s);
};
Expression.prototype.image = function () {
	var image = new Image();
	image.src = this.imageURL();
	return image;
};
Expression.prototype.sub = function () {
	return this;
};
Expression.prototype.lim = function (x, y) {
	return this.sub(x, y);
};
// Global Root operators:
Expression.prototype[','] = function (x) {
	return Expression.Vector([this, x]);
};
Expression.prototype['='] = function (x) {
	return new Expression.Statement(this, x, '=');
};
Expression.prototype['!='] = function (x) {
	return new Expression.Statement(this, x, '!=');
};
Expression.prototype['>'] = function (x) {
	return new Expression.Statement(this, x, '>');
};
Expression.prototype['>='] = function (x) {
	return new Expression.Statement(this, x, '>=');
};
Expression.prototype['<'] = function (x) {
	return new Expression.Statement(this, x, '<');
};
Expression.prototype['<='] = function (x) {
	return new Expression.Statement(this, x, '<=');
};




// =========== List ============ //
Expression.List = function(e, operator) {
    e.__proto__ = Expression.List.prototype;
	e.operator = operator;
	return e;
};
Expression.List.prototype = Object.create(Expression.prototype);
Expression.List.prototype.constructor = Expression.List;


Expression.List.prototype.sub = function (x, y) {
	var a = this[0].sub(x, y);
	if(this.length === 1) {
		return a[this.operator]();
	}
	var b = this[1].sub(x, y);
	
	return a[this.operator || 'default'](b);
};
Expression.prototype['*'] = function (x) {
	if(x === Global.Zero) {
		return x;
	}
	if(x === Global.One) {
		return this;
	}
	return new Expression.List([this, x], '*');
};
Expression.prototype.default = function (x) {
	return this['*'](x);
};

Expression.List.prototype['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return new Expression.List([this], '@-');
};
Expression.prototype['/'] = function (x) {
	return new Expression.List([this, x], '/');
};

Expression.prototype['+'] = function (x) {
	return new Expression.List([this, x], '+');
};

Expression.prototype['-'] = function (x) {
	return new Expression.List([this, x], '-');
};

Expression.prototype['^'] = function (x) {
	return new Expression.List([this, x], '^');
};

Expression.prototype['%'] = function (x) {
	return new Expression.List([this, x], '%');
};

/*
// TODO: Linked list?
function Multiset(x) {
	x.__proto__ = Multiset.prototype;
	return x;
}
Multiset.prototype.intersect = function () {
	
};
Multiset.prototype.union = function (x){
	return Multiset(Array.prototype.concat.call(this, x));
};
Multiset.prototype.add = function (x){
	this[this.length] = x;
	return this;
};
Multiset.prototype.remove = function (x) {
	var i = this.indexOf(x);
	this[i] = this[this.length - 1];
	this.length--;
	return this;
};
Multiset.prototype.map = function (x) {
	return Multiset(Array.prototype.map.call(this, x));
};
Multiset.prototype.filter = function (x) {
	return Multiset(Array.prototype.filter.call(this, x));
};
*/
function MultiSet(A, m) {
	this.A = A || [];
	this.m = m || [];
}
MultiSet.prototype.add = function (x) {
	// CHeck if it already exists
	var i = this.A.indexOf(x);
	if (i === -1) {
		var l = this.length;
		this.A[l] = x;
		this.m[l] = 1;
	} else {
		this.m[i]++;
	}
	return this;
};
MultiSet.prototype.remove = function (x) {
	var i = this.A.indexOf(x);
	this.m[i]--;
	return this;
};
MultiSet.prototype.intersect = function (x) {
	// -> Multiset
	throw ('What is multiset intersection?');
};
MultiSet.prototype.map = function (x) {
	// Assumes x has no side effects and is not many to one
	// TODO: Should this supply m(A) ?
	return MultiSet(Array.prototype.map.call(this.A, x), this.m);
};
MultiSet.fromArray = function (arr) {
	throw ('NYI');
	// O(n^2 ?)
	var A = [];
	var m = [];
	return new MultiSet(A, m);
};function Set(x) {
	x.__proto__ = Set.prototype;
	return x;
};
Set.prototype.intersect = function (set) {
	// O(n^2)
	var i;
	var i_l = this.length;
	var j;
	var j_l = set.length;
	var s = new Set([]);
	for (i = 0; i < i_l; i++) {
		// Find in second set:
		for (j = 0; j < j_l; j++) {
			var a = this[i];
			var b = set[j];
			if (a === b) {
				s[s.length] = (a);
				break;
			}
			var my_val = (a)['-'](b);
			if(my_val === Global.Zero) {
				s[s.length] = (a);
				break;
			}
		}
	}
	return a;
}; 
Set.prototype.union = function (set) {
	// TODO: check for duplicates
	return Set(Array.prototype.concat.call(this, set));
}
Set.prototype.remove = function (x) {
	// O(1 + lookup[n])
	var i = this.indexOf(x);
	this[i] = this[this.length - 1];
	this.length--;
	return this;
}
Set.prototype.add = function (x) {
	// O(1 + lookup[n])
	if (this.indexOf(x) === -1) {
		this[this.length] = x;
	}
	return this;
};
Set.prototype.map = function (f) {
	return Set(Array.prototype.map.call(this, f));
};Expression.Statement = function (x, y, operator) {
	var arr = [x,y];
	arr.operator = operator;
	arr.__proto__ = Expression.Statement.prototype;
	return arr;
};
Expression.Statement.prototype = Object.create(Expression.prototype);
Expression.Statement.prototype.constructor = Expression.Statement;
Expression.Statement.prototype['='] = function () {
	
};
Expression.Statement.prototype['<'] = function () {
	// a < b < c
	// (a < b) = b
	// b < c
	
	// a < (b < c)
	// a < b .. (b < c) = b
	// (a < b) = a.
};
Expression.Statement.prototype.solve = function (vars) {
	// a = b
	// If b has an additive inverse?
	
	// a - b = 0
	var a_b = (this.a)['-'](this.b);
	/*
	Examples:
	(1,2,3) - (x,y,z) = 0 (solve for x,y,z)
	(1,2,3) - x = 0 (solve for x)
	*/
	return a_b.roots(vars);
};Expression.Constant = function() {
	throw new Error('Expression.Constant created directly');
};
Expression.Constant.prototype = Object.create(Expression.prototype);
Expression.Constant.prototype.simplify = function() {
	return this;
};
Expression.Constant.prototype.differentiate = function() {
	return M.Global.Zero;
};
Expression.Constant.prototype.default = function (x){
	return this['*'](x);
};Expression.Symbol = function Symbol(str) {
    //Req: str is a String
	this.symbol = str;
};

Expression.Symbol.prototype = Object.create(Expression.prototype);
Expression.Symbol.prototype.constructor = Expression.Symbol;

Expression.Symbol.prototype.differentiate = function (x) {
	return this === x ? Global.One : Global.Zero;
};
Expression.Symbol.prototype.integrate = function (x) {
    if (this === x) {
		return new Expression.NumericalReal(0.5, 0) ['*'] (x ['^'] (new Expression.NumericalReal(2,0)));
    }
	return (this) ['*'] (x);
};
Expression.Symbol.prototype.sub = function (x, y) {
	// TODO: Ensure it is real (for Expression.Symbol.Real)
	return this === x ? y : this;
};

// ============= Real Number ================ //
Expression.Symbol.Real = function Symbol_Real(str) {
    this.symbol = str;
};
Expression.Symbol.Real.prototype = Object.create(Expression.Symbol.prototype);
Expression.Symbol.Real.prototype.realimag = function() {
    return Expression.List.ComplexCartesian([this, Global.Zero]);
};
Expression.Symbol.Real.prototype.real = function() {
    return this;
};
Expression.Symbol.Real.prototype.imag = function() {
    return Global.Zero;
};
Expression.Symbol.Real.prototype.polar = function() {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
Expression.Symbol.Real.prototype.abs = function() {
	return Expression.List.Real([Global.abs, this]);
};
Expression.Symbol.Real.prototype.arg = function() {
	return Expression.List.Real([Global.arg, this]);
};

Expression.Symbol.Real.prototype['+'] = function (x) {
	if (x == Global.Zero) {
		return this;
	}

	if(x instanceof Expression.NumericalReal) {
		return new Expression.List.Real([this, x], '+');
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '+');
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '+');
	}
	return x['+'](this);
};
Expression.Symbol.Real.prototype['-'] = function (x) {
	if(this === x) {
		return Global.Zero;
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '-');
	}
	if(x instanceof Expression.List.Real) {
		if (x.operator === '@-') {
			return new Expression.List.Real([this, x[0]], '+');
		}
		return new Expression.List.Real([this, x], '-');
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '-');
	}
	
	return x['@-']()['+'](this);
};

Expression.Symbol.Real.prototype['@+'] = function (x) {
	return Expression.List.Real([this], '@+');
};

Expression.Symbol.Real.prototype['@-'] = function (x) {
	return Expression.List.Real([this], '@-');
};

Expression.Symbol.Real.prototype['*'] = function (x) {

	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return Global.Zero;
		}
	}
	if(x instanceof Expression.Symbol.Real) {
		return new Expression.List.Real([this, x], '*');
	}
	if(x instanceof Expression.List.Real) {
		return x['*'](this);
	}
	if(x instanceof Expression.Symbol) {
		return new Expression.List([this, x], '*');
	}
	if(x instanceof Expression.NumericalReal) {
		return new Expression.List.Real([x, this], '*');
	}
	if(x instanceof Expression.NumericalComplex) {
		return new Expression.List.Real([this, x], '*');
	}
	if(x instanceof Expression.List.ComplexCartesian) {
		return x['*'](this);
	}
	return x['*'](this);
};
Expression.Symbol.Real.prototype.default = Expression.Symbol.Real.prototype['*'];
Expression.Symbol.Real.prototype['/'] = function (x) {

	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			throw('Division by zero');
		}
	}
	
	return Expression.List.Real([this, x], '/');
};
Expression.Symbol.Real.prototype['^'] = function (x) {
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return Global.One;
		}
	}
	
	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}
	if (x instanceof Expression.Integer) {
		return Expression.List.Real([this, x], '^');
	} else if(x instanceof Expression.Rational) {
		var f = x.reduce();
		if(f.a % 2 === 0) {
			return Expression.List.Real([this, x], '^');
		}
	}
	return Expression.List([this, x], '^');
};
Expression.Symbol.Real.prototype.apply = function(operator, e) {
	throw("Real.apply");
	if (operator === ',') {
		//Maybe this should be a new object type??? Vector?
		console.log('APPLY: ', this.constructor, this, e);
		return Expression.Vector([this, e]);
	} else if (operator === '=') {
		return Expression.Equation([this, e], operator);
	}
	if (e === undefined) {
		//Unary:
		switch (operator) {
			case '!':
				//TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
				return Global.Gamma.apply(undefined, this.apply('+', Global.One));
			case '@-':
				return Expression.List.Real([this], operator);
			default:
		}
		throw('Real Symbol('+this.symbol+') could not handle operator '+ operator);
	} else {
		// Simplification:
		switch (e.constructor){
			case Expression.Symbol.Real:
			case Expression.List.Real:
				/*if(this.positive && e.positive) {
					return Expression.List.Real([this, e], operator);
				}*/
				switch(operator) {
					case '^':
						//TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
						//return Expression.List([this, e], operator);
						return Expression.List.ComplexPolar([
							Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
							Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
						]);
					case undefined:
						return Expression.List.Real([this, e], '*');
					default:
						return Expression.List.Real([this, e], operator);
				}
			case Expression.NumericalReal:
				switch(operator){
					case '+':
					case '-':
						if(e.value === 0){
							return this;
						}
						return Expression.List.Real([this, e], operator);
						break;
					case undefined:
					case '*':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Zero;
						}
						return Expression.List.Real([this, e], '*');
						break;
					case '%':
						return Expression.List.Real([this, e], '%');
					case '^':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.One;
						}
						if(false && opengl_TODO_hack() && e.value === ~~e.value){
							return Expression.List.Real([this, e], operator);
						}
						return Expression.List.ComplexPolar([
							Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
							Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
						]);
						
						break;
					case '/':
						if(e.value === 1){
							return this;
						} else if(e.value === 0){
							return Global.Infinity;
						}
						return Expression.List.Real([this, e], operator);
						break;
				}
				break;
			case Expression.Complex:
				return this.realimag().apply(operator, e); // GO to above (will apply reals)
				break;
			case Expression.List.ComplexCartesian:
				//Maybe there is a way to swap the order? (e.g. a .real = true property for other things to check)
				//or instance of Expression.Real ?
				switch(operator) {
					case '+':
					case '-':
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							e[1]
						]);
					case undefined:
						operator = '*';
					case '*':
						return Expression.List.ComplexCartesian([
							this.apply(operator, e[0]),
							this.apply(operator, e[1])
						]);
					case '/':
						var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
						return Expression.List.ComplexCartesian([
							(this.apply('*',e[0])).apply('/', cc_dd),
							this.apply('*',e[1]).apply('/', cc_dd).apply('@-')
						]);
				}
			case Expression.List.ComplexPolar:
				//Maybe there is a way to swap the order?
				return this.polar().apply(operator, e);
		}
		throw('LIST FROM REAL SYMBOL! '+ operator, e.constructor);
		return Expression.List([this, e], operator);
	}
};


Expression.Symbol.Real.prototype.constructor = Expression.Symbol.Real;Expression.Function = function (p) {
	this.default = p.default;
	this['text/latex'] = (p['text/latex']);
	this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
	this['text/javascript'] = (p['text/javascript']);
	this.derivative = p.derivative;
	this.realimag = p.realimag;
};
Expression.Function.prototype = Object.create(Expression.prototype);
Expression.Function.prototype.constructor = Expression.Function;
Expression.Function.prototype.default = function (argument) {
	return ;
};
Expression.Function.prototype.differentiate = function () {
	if (this.derivative) {
		return this.derivative;
	}
	throw('Function has no derivative defined.');
}

Expression.Function.prototype.s = function (lang) {
	if (this[lang]) {
		return new Code(this[lang]);
	}
	throw('Could not compile function into ' + lang);
};


Expression.Function.Symbolic = function SymbolicFunction(expr, vars) {
	this.expr = expr;
	this.symbols = vars;
	
};
Expression.Function.Symbolic.prototype = Object.create(Expression.Function.prototype);
Expression.Function.Symbolic.prototype.constructor = Expression.Function.Symbolic;

Expression.Function.Symbolic.prototype.default = function (x) {
	if (x.constructor !== Expression.Vector) {
		x = Expression.Vector([x]);
	}
	var expr = this.expr;
	var i, l = this.symbols.length;
	if (l !== x.length) {
		throw ('Invalid domain. Element of F^' + l + ' expected.');
	}
	for(i = 0; i < l; i++) {
		expr = expr.sub(this.symbols[i], x[i])
	}
	return expr;
};


Expression.Function.prototype['+'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['+'](x), [a]);
};

Expression.Function.prototype['@-'] = function (x) {
	var a = new Expression.Symbol();
	return new Expression.Function.Symbolic(this.default(a)['@-'](), [a]);
};
Expression.NumericalComplex = function(real, imag) {
	this._real = real;
	this._imag = imag;
};

Expression.NumericalComplex.prototype = Object.create(Expression.Constant.prototype);
Expression.NumericalComplex.prototype.real = function() {
	return new Expression.NumericalReal(this._real);
};
Expression.NumericalComplex.prototype.imag = function() {
	return new Expression.NumericalReal(this._imag);
};
Expression.NumericalComplex.prototype.realimag = function() {
	return Expression.List.ComplexCartesian([
		new Expression.NumericalReal(this._real),
		new Expression.NumericalReal(this._imag)
	]);
};
Expression.NumericalComplex.prototype.conjugate = function() {
	return new Expression.NumericalComplex(this._real, -this._imag);
};
Expression.NumericalComplex.prototype['+'] = function (x) {
	if(this._real === 0 && this._imag === 0) {
		return x;
	}
	if(x instanceof Expression.NumericalComplex){
		return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
	} else if (x instanceof Expression.NumericalReal) {
		return new Expression.NumericalComplex(this._real + x.value, this._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['+'](this);
	} else {
		throw ('Unknown Type for NumericalComplex +');
	}
};
Expression.NumericalComplex.prototype['-'] = function (x) {
	if(this._real === 0 && this._imag === 0) {
		return x['@-']();
	}
	if(x instanceof Expression.NumericalComplex){
		return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalComplex(this._real - x.value, this._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x['@-']())['+'](this);
	} else {
		throw ('Unknown Type for NumericalComplex -');
	}
};
Expression.NumericalComplex.prototype['*'] = function (x) {
	if(this._imag === 0) {
		if(this._real === 0) {
			return Global.Zero;
		}
		if(this._real === 1) {
			return x;
		}
	}
	
	if(x.constructor === this.constructor){
		return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		return (x)['*'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['*'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['*'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['*'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['*'](this);
	} else {
		throw ('Unknown Type for NumericalComplex *');
	}
};

Expression.NumericalComplex.prototype['/'] = function (x) {
	if(this._imag === 0 && this._real === 0) {
		// TODO: Provided x != 0
		return Global.Zero;
	}
	
	if(x.constructor === this.constructor){
		var cc_dd = x._real * x._real + x._imag * x._imag;
		return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real * x._imag) / cc_dd);
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		return this.realimag()['/'](x);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return this.polar()['/'](x);
	} else if(x.constructor === Expression.List.Real) {
		return Expression.List([this, x], '/');
	} else if(x.constructor === Expression.Symbol.Real) {
		return Expression.List([this, x], '/');
	} else if(x.constructor === Expression.List) {
		return Expression.List([this, x], '/');
	} else {
		throw ('Unknown Type for NumericalComplex /');
	}
};

Expression.NumericalComplex.prototype['!'] = function (){
	return Global.Gamma.default(this);
};
(function(){
	return;
	var one_on_rt2 = 1/Math.sqrt(2);
	Expression.NumericalComplex.prototype.apply = function(operator, x) {
		switch (operator){
			case '^':
				if(this._real === 0 && this._imag === 0) {
					return Global.Zero; // Contradicts x^0 = 1
				}
				break;
			case '+':
				if(this._real === 0 && this._imag === 0) {
					return x;
				}
				break;
			case '-':
				if(this.value === 0) {
					return x.apply('@-');
				}
				break;
			case undefined:
			case '*':
				if(this._real === 1 && this._imag === 0){
					return x;
				}
				//Note: There is not meant to be a break here.
			case '/':
				if(this._real === 0 && this._imag === 0){
					return Global.Zero; //Contradics x/0 = Infinity
				}
		}
		if (operator === ',') {
			return Expression.Vector([this, x]);
		} else if (x === undefined) {
			switch (operator) {
				
				case '@+':
					return this;
				case '@-':
					return new Expression.NumericalComplex(-this._real, -this._imag);
				case '\u221A':
					throw('OLD SQRT. New one is a function, not operator.')
					return new Expression.NumericalComplex(p, q);
				case '++':
				case '--':
					throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
				case '+=':
				case '-=':
				case '*=':
				case '/=':
					throw(new ReferenceError('Left side of assignment is not a reference.'));
				case '!':
					return Global.Gamma.apply(undefined, new Expression.NumericalComplex(this._real + 1, this._imag));
			}
		} else if (x.constructor === Expression.NumericalReal) {
			switch (operator) {
				case '*':
				case undefined:
					return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
				case '+':
					return new Expression.NumericalComplex(this._real + x.value, this._imag);
				case '-':
					return new Expression.NumericalComplex(this._real - x.value, this._imag);
				case '/':
					return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
				case '^':
					var a = this._real;
				    var b = this._imag;
				    var c = x.value;

				    var hlm = 0.5 * Math.log(a*a + b*b);
				    var theta = Math.atan2(b, a);
				    var hmld_tc = theta * c;
				    var e_hmlc_td = Math.exp(hlm * c);
                    return new Expression.NumericalComplex(
                        (e_hmlc_td * Math.cos(hmld_tc)),
				        (e_hmlc_td * Math.sin(hmld_tc))
                    );
				default:
			}
		} else if (x.constructor === this.constructor) {
			switch (operator) {
				case '*':
				case undefined:
					// (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
					return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
				case '+':
					return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
				case '-':
					return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
				case '/':
					//	(a+bi)/(c+di) 
					//= [(a+bi)(c-di)]/[(c+di)(c-di)]
					//= [(a+bi)(c-di)]/[cc + dd]
					//=	[ac -dai +bci + bd]/[cc+dd]
					//= [ac + bd + (bc - da)]/[cc+dd]
					var cc_dd = x._real * x._real + x._imag * x._imag;
					return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real*x._imag)/cc_dd);
				case '^':
				    var a = this._real;
				    var b = this._imag;
				    var c = x._real;
				    var d = x._imag;

				    var hlm = 0.5 * Math.log(a*a + b*b);
				    var theta = Math.atan2(b, a);
				    var hmld_tc = hlm * d + theta * c;
				    var e_hmlc_td = Math.exp(hlm * c - theta * d);
                    return new Expression.NumericalComplex(
                        (e_hmlc_td * Math.cos(hmld_tc)),
				        (e_hmlc_td * Math.sin(hmld_tc))
                    );
				default:
			}
		} else if(x.constructor === Expression.List.ComplexCartesian) {
			return this.realimag().apply(operator, x);
		} else if(x.constructor === Expression.List.ComplexPolar) {
			return this.polar().apply(operator, x);
		} else if(x.constructor === Expression.List.Real) {
			return this.realimag().apply(operator, x);
		} else if(x.constructor === Expression.Symbol.Real) {
			return this.realimag().apply(operator, x);
		}
		console.error('cmplx . ' + operator + ' => E.List?');
		/*
		if(this._real === 0.0 && this._imag === 0.0){
			return this;
		}
		*/
		
		
		return this.realimag().apply(operator, x);
		return Expression.List([this, x], operator);
	}
	
}());

Expression.NumericalComplex.prototype.constructor = Expression.NumericalComplex;Expression.prototype.conjugate = function() {
	throw('Conjugate');
};

Expression.List.prototype.conjugate = function() {
	var i, l = this.length;
	var n = new Array(l);
	for (i = 0; i < l; i++) {
		n[i] = this[i].conjugate();
	}
	return Expression.List(n, this.operator);
};
Expression.NumericalReal = function NumericalReal(e) {
	this.value = e;
};

Expression.NumericalReal.prototype = Object.create(Expression.NumericalComplex.prototype);

Expression.NumericalReal.prototype.constructor = Expression.NumericalReal;
Expression.NumericalReal.prototype.__defineGetter__("_real", function () {
	return this.value;
});
Expression.NumericalReal.prototype._imag = 0;

Expression.NumericalReal.prototype.real = function() {
	return this;
};
Expression.NumericalReal.prototype.imag = function() {
	return Global.Zero;
};
Expression.NumericalReal.prototype.realimag = function() {
	return Expression.List.ComplexCartesian([
		this,
		Global.Zero
	]);
};
Expression.NumericalReal.prototype.conjugate = function() {
	return this;
};

Expression.NumericalReal.prototype['+'] = function (x) {
	if(this.value === 0) {
		return x;
	}
	if(x instanceof Expression.NumericalReal){
		return new Expression.NumericalReal(this.value + x.value);
	}
	return x['+'](this);
};

Expression.NumericalReal.prototype['@-'] = function (x) {
	return new Expression.NumericalReal(-this.value);
};

Expression.NumericalReal.prototype['-'] = function (x) {
	if(this.value === 0) {
		return x;
	}
	if(x instanceof Expression.NumericalReal) {
		return new Expression.NumericalReal(this.value - x.value);
	}
	return x['@-']()['+'](this);
};


Expression.NumericalReal.prototype['%'] = function (x) {
	var nonreal = 'The modular arithmetic operator \'%\' is not defined for non-real numbers.';
	if(this.value === 0) {
		return Global.Zero;
	}
	if(x.constructor === this.constructor){
		return new Expression.NumericalReal(this.value % x.value);
	} else if(x.constructor === Expression.List.Real) {
		return Expression.List.Real([this, x], '%');
	} else if(x.constructor === Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '%');
	} else if(x.constructor === Expression.List) {
		throw('Not sure about this...');
		// Not sure about this
		return Expression.List.Real([this, x], '%');
	} else if (x.constructor === Expression.NumericalComplex) {
		throw(new TypeError(nonreal));
	} else if (x.constructor === Expression.List.ComplexCartesian) {
		throw(new TypeError(nonreal));
	} else if (x.constructor === Expression.List.ComplexPolar) {	
		throw(new TypeError(nonreal));
	} else {
		throw ('Unknown Type for NumericalReal %');
	}
};
Expression.NumericalReal.prototype['*'] = function (x) {
	if(x instanceof Expression.NumericalReal){
		return new Expression.NumericalReal(this.value * x.value);
	}
	return x['*'](this);
};
Expression.NumericalReal.prototype['/'] = function (x) {
	if(this.value === 0) {
		return Global.Zero;
	}
	if(x instanceof Expression.NumericalReal){
		if(x.value === 0) {
			throw('Division by zero not allowed!');
		}
		return new Expression.NumericalReal(this.value / x.value);
	} else if (x.constructor === Expression.NumericalComplex) {
		var cc_dd = x._real * x._real + x._imag * x._imag;
		return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value * x._imag) / cc_dd);
	} else if(x instanceof Expression.List.ComplexCartesian) {
		// a/(x+yi) = a/(x+yi) (x-yi)/(x-yi) = a(x-yi) / (x^2 + y^2)
		var x_conj = Expression.List.ComplexCartesian([
			x[0],
			x[1]['@-']()
		]);
		var two = Expression.NumericalReal(2);
		return x_conj['*'](this)['/'](
			(x[0]['^'])(two)
			['+'] (
				(x[1]['^'])(two)
			)
		);
	} else if(x instanceof Expression.List.ComplexPolar) {
		
	} else if(x instanceof Expression.List.Real) {
		// TODO: given x != 0
		return Expression.List.Real([this, x], '/');
	} else if(x instanceof Expression.Symbol.Real) {
		// TODO: given x != 0
		return Expression.List.Real([this, x], '/');
	} else if(x instanceof Expression.List) {	
		return Expression.List([this, x], '/');
	} else {
		console.log('Unknown type: ', this, x);
		throw ('Unknown Type for NumericalReal /');
	}
};
Expression.NumericalReal.prototype['^'] = function (x) {
	if (this.value === 0) {
		return Global.Zero;
	}
	if (this.value === 1) {
		return Global.One;
	}
	if(x === Global.Zero) {
		return Global.One;
	}
	if(x === Global.One) {
		return this;
	}
	if (x instanceof Expression.Integer) {
		return new Expression.NumericalReal(Math.pow(this.value, x.a));
	} else if(x instanceof Expression.NumericalReal){
		if(this.value > 0) {
			return new Expression.NumericalReal(Math.pow(this.value, x.value));
		}
		// TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
		//      <- I think no, because why else start with a numerical. Implement a rational/integer type
		var r = Math.pow(-this.value, x.value);
		var theta = Math.PI * x.value;
		return new Expression.List.ComplexPolar([
			new Expression.NumericalReal(r),
			new Expression.NumericalReal(theta)
		]);
	} else if (x.constructor === Expression.NumericalComplex) {
		var a = this.value;
		var c = x._real;
		var d = x._imag;
		console.error('Bad implementation ( num ^ complex)');
		var hlm = 0.5 * Math.log(a*a);
		var hmld_tc = hlm * d;
		var e_hmlc_td = Math.exp(hlm * c);
		return new Expression.NumericalComplex(
			(e_hmlc_td * Math.cos(hmld_tc)),
			(e_hmlc_td * Math.sin(hmld_tc))
		);
	} else if (x.constructor === Expression.List.ComplexCartesian) {
		return Expression.List([this, x], '^');
	} else if (x.constructor === Expression.List.ComplexPolar) {
		return Expression.List([this, x], '^');
	} else if (x.constructor === Expression.List.Real) {
		if(this.value > 0) {
			return Expression.List.Real([this, x], '^');
		}
		return Expression.List([this, x], '^');
	} else if (x.constructor === Expression.Symbol.Real) {
		if(this.value > 0) {
			return Expression.List.Real([this, x], '^');
		}
		return Expression.List([this, x], '^');
	} else if (x.constructor === Expression.List) {
		return Expression.List([this, x], '^');
	} else {
		throw console.error ('Unknown Type for NumericalReal ^', x, x instanceof Expression.NumericalReal);
	}
};

Expression.NumericalReal.prototype.apply = function(operator, x) {
	switch (operator){
		case ',':
			return Expression.Vector([this, x]);
		case '^':
			if(this.value === 0) {
				return Global.Zero; // Contradicts x^0 = 1
			}
			break;
		case '+':
			if(this.value === 0) {
				return x;
			}
			break;
		case '-':
			if(this.value === 0) {
				return x.apply('@-');
			}
			break;
		case undefined:
		case '*':
			if(this.value === 1){
				return x;
			}
			//Note: There is not meant to be a break here.
		case '/':
			if(this.value === 0){
				return Global.Zero; //Contradics x/0 = Infinity
			}
	}
	if(x === undefined){
		//Unary
		switch (operator) {
			case '@+':
				return this;
			case '@-':
				return new Expression.NumericalReal(-this.value);
			case '++':
			case '--':
				throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
			case '+=':
			case '-=':
			case '*=':
			case '/=':
				throw(new ReferenceError('Left side of assignment is not a reference.'));
			case '!':
				return Global.Gamma.apply(undefined, new Expression.NumericalReal(this.value + 1));
		}
	} else if(x.constructor === this.constructor){
		switch (operator) {
			case '*':
			case undefined:
				return new Expression.NumericalReal(this.value * x.value);
			case '+':
				return new Expression.NumericalReal(this.value + x.value);
			case '-':
				return new Expression.NumericalReal(this.value - x.value);
			case '/':
				return new Expression.NumericalReal(this.value / x.value);
			case '^':
				if(this.value > 0) {
					return new Expression.NumericalReal(Math.pow(this.value, x.value));
				} else {
					// TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
					var r = Math.pow(-this.value, x.value)
					var theta = Math.PI * x.value;
					return new Expression.Complex(r*Math.cos(theta), r*Math.sin(theta));
				}
			default:
			
		}
	} else if (x.constructor === Expression.Complex) {
		switch (operator) {
			case '*':
			case undefined:
				return new Expression.Complex(this.value * x._real, this.value * x._imag);
			case '+':
				return new Expression.Complex(this.value + x._real, x._imag);
			case '-':
				return new Expression.Complex(this.value - x._real, -x._imag);
			case '/':
				var cc_dd = x._real * x._real + x._imag * x._imag;
				return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value*x._imag)/cc_dd);
			case '^':
			    var a = this.value;
			    var c = x._real;
			    var d = x._imag;
				console.error('Bad implementation ( num ^ complex)');
			    var hlm = 0.5 * Math.log(a*a);
			    var hmld_tc = hlm * d;
			    var e_hmlc_td = Math.exp(hlm * c);
                return new Expression.Complex(
                    (e_hmlc_td * Math.cos(hmld_tc)),
			        (e_hmlc_td * Math.sin(hmld_tc))
                );
			default:
		}
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		switch (operator) {
			case '+':
			case '-':
				return Expression.List.ComplexCartesian([
					x[0].apply(operator, this),
					x[1]
				]);
			case undefined:
				operator = '*';
			case '*':
			case '/':
				return Expression.List.ComplexCartesian([
					x[0].apply(operator, this),
					x[1].apply(operator, this)
				]);
			case '^':
				console.warn('ineffecient: NR ^ CL');
				return this.realimag().apply(operator, x);
			
		}
	} else if(x.constructor === Expression.List.ComplexPolar) {
		switch (operator) {
			case '+':
			case '-':
			case '^':
				//(a+bi)+Ae^(ik)
				return Expression.List([this, x], operator);
				// or ? return this.apply(operator, x.realimag()); //Jump up to above +-
			case undefined:
				operator = '*';
			case '*':
				return Expression.List.ComplexPolar([
					x[0].apply(operator, this),
					x[1]
				]);
			case '/':
				return Expression.List.ComplexPolar([
					x[0].apply(operator, this),
					x[1]
				]);
		}
	} else if (x.constructor === Expression.List.Real) {
		switch(operator) {
			case undefined:
				operator = '*';
			case '*':
			case '+':
			case '-':
			case '/':
				return Expression.List.Real([this, x], operator);
			case '^':
				if(this.value === 0){
					throw('N(0) ^ x');
				}
				if(this.value > 0) {
					return Expression.List.Real([this, x], operator);
				} else {
					return Expression.List.ComplexPolar([
						(new Expression.Numerical(-this.value)).apply('^', x),
						Global.pi.apply('*', x)
					]);
				}
		}
				
	} else if (x.constructor === Expression.Symbol.Real) {
		switch(operator) {
			case undefined:
				operator = '*';
			case '*':
			case '+':
			case '-':
			case '/':
				return Expression.List.Real([this, x], operator);
			case '^':
				if(this.value === 0){
					throw('N(0) ^ x');
				}
				if(this.value > 0) {
					return Expression.List.Real([this, x], operator);
				} else {
					return Expression.List.ComplexPolar([
						Expression.List.Real([(new Expression.NumericalReal(-this.value)), x], '^'),
						Global.pi.apply('*', x)
					]);
				}
		}
	}
	throw('?? - real');
	return Expression.List([this, x], operator);
};
Expression.Rational = function Rational(a, b) {
	this.a = a;
	this.b = b;
};
Expression.Rational.prototype = Object.create(Expression.NumericalReal.prototype); // --> constant
Expression.Rational.prototype.constructor = Expression.Rational;
Expression.Rational.prototype.__defineGetter__("value", function () {
	return this.a / this.b;
});
Expression.Rational.prototype['+'] = function (x) {
	if(this.a === 0) {
		return x;
	}
	if(x instanceof Expression.Rational){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b + this.b * x.a, this.b * x.b);
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.NumericalComplex(this.value + x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['+'](this);
	} else {
		console.warn('Swapped operator order for + with Rational');
		return (x)['+'](this);
		throw ('Unknown Type for Rational +');
	}
	
	
};
Expression.Rational.prototype['-'] = function (x) {
	if(this.a === 0) {
		return x['@-']();
	}
	if(x instanceof Expression.Rational){
		/*
			a   c     ad   cb    ad + bc
		    - + -  =  -- + -- =  -------
			b   d     bd   bd      b d
		*/
		return new Expression.Rational(this.a * x.b - this.b * x.a, this.b * x.b);
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.NumericalComplex(this.value - x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x['@-']())['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x['@-']())['+'](this);
	} else {
		console.warn('Swapped operator order for - with Rational');
		return (x)['+'](this);
		throw ('Unknown Type for Rational +');
	}
};

Expression.Rational.prototype['*'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		return new Expression.Rational(this.a * x.a, this.b * x.b);
	}
	return this.__proto__.__proto__['*'].call(this, x);
};


Expression.Rational.prototype['/'] = function (x) {
	if (this.a === 0) {
		return Global.Zero;
	}
	if (x instanceof this.constructor){
		if (x.a === 0) {
			throw('Division By Zero is not defined for Rational numbers!');
		}
		return new Expression.Rational(this.a * x.b, this.b * x.a).reduce();
	}
	return Expression.NumericalReal.prototype['/'].call(this, x);
};
Expression.Rational.prototype['^'] = function (x) {
	if(x === Global.Zero) {
		return Global.One;
	}
	if(x === Global.One) {
		return this;
	}
	if(this.a === 0) {
		return Global.Zero;
	}
	if(this.a === this.b) {
		return Global.One;
	}
	if(x instanceof Expression.Integer) {
		return new Expression.Rational(
			Math.pow(this.a, x.a),
			Math.pow(this.b, x.a)
		);
	} else if (x instanceof Expression.Rational) {
		
		var f = x.reduce();
		if(f.a % 2 == 0) {
			return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
		}

		return Expression.NumericalReal.prototype['^'].call(
			this,
			x
		);
		
	}

	return Expression.List([this, x], '^');
	
};
Expression.Rational.prototype.reduce = function () {
	function gcd(a, b) {
		if(b === 0) {
			return a;
		}
		return gcd(b, a % b);
	}
	var g = gcd(this.b, this.a);
	this.a /= g;
	this.b /= g;
	if(this.b === 1) {
		return new Expression.Integer(this.a);
	}
	return this;
};
Expression.Integer = function Integer(x) {
	this.a = x;
};
Expression.Integer.prototype = Object.create(Expression.Rational.prototype);
Expression.Integer.prototype.b = 1;
Expression.Integer.prototype.constructor = Expression.Integer;

Expression.Integer.prototype['+'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a + x.a);
	}
	return x['+'](this);
};
Expression.Integer.prototype['-'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a - x.a);
	}
	return this.__proto__.__proto__['-'].call(this, x);
};
Expression.Integer.prototype['/'] = function (x) {
	if(x instanceof Expression.Integer) {
		if(this.a % x.a === 0) {
			return new Expression.Integer(this.a / x.a);
		}
		return new Expression.Rational(this.a, x.a);
	}
	return this.__proto__.__proto__['/'].call(this, x);
};

Expression.Integer.prototype['@-'] = function () {
	return new Expression.Integer(-this.a);
};
Expression.Integer.prototype['*'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(this.a * x.a);
	}
	return x['*'](this);
};
Expression.Integer.prototype['^'] = function (x) {
	if (x instanceof Expression.Integer) {
		return new Expression.Integer(Math.pow(this.a, x.a));
	} else if (x.constructor === Expression.Rational) {
		var f = x.reduce();
		if(f.a % 2 == 0) {
			return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
		} else {
			return Expression.NumericalReal.prototype['^'].call(
				this,
				x
			);
		}
	} else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
		if(this.a > 0) {
			return Expression.List.Real([
				this,
				x
			], '^');
		}
	}
	return Expression.NumericalReal.prototype['^'].call(
		this,
		x
	);
	
};
Expression.Integer.prototype['%'] = function (x) {
	if(x instanceof Expression.Integer) {
		return new Expression.Integer(this.a % x.a);
	} else if (x.constructor === Expression.Rational) {
		return new Expression.Rational()
	} else if (x.constructor === Expression.NumericalReal) {
		return new Expression.NumericalReal(this % x.value);
	} else {
		return Expression.List.Real([this, x], '%');
	}
};Expression.List.prototype.differentiate = function(x) {
	switch (this.operator) {
		case undefined:
			//TODO: Ensure left expr is not a function, so we know it is scalar multiplication.
			//throw('.differentiate() method invoked for Expression without operator?');
			
			// D(f(g(x))) = D(f) * D(g)
			// d f(g(x))/dx = df/dx = df/dg * dg/dx
			if(this[0] instanceof Expression.Function) {
				var da = this[1].differentiate(x);
				if(da === Global.Zero) {
					return da;
				}
				return this[0].differentiate().default(this[1])['*'](da);
			}
		case '*':
			return this[0]
				.differentiate(x)['*'](
					this[1]
				)['+'](
					this[1]
					.differentiate(x)['*'](
						this[0]
					)
				);
		case '@+':
		case '@-':
			return this[0].differentiate(x)[this.operator]();
		case '+':
		case '-':
			return this[0]
				.differentiate(x)[this.operator](
					this[1]
					.differentiate(x)
				);
		case '^':
			var d_a = this[0].differentiate(x);
			var d_b = this[1].differentiate(x);
			if(d_a === Global.Zero) {
				if(d_b === Global.Zero) {
					return Global.Zero;
				}
				return d_b['*'](Global.log.default(this[0]))['*'](this);
			}

			var f_a = this[0]['^'](this[1]['-'](Global.One));
			return f_a['*'](
				d_a['*'](this[1])
				['+'](
					this[0]['*'](Global.log.default(this[0]))['*'](d_b)
				)
			);
			return this[1]['*'](
						this[0].differentiate(x)
					)['+'](
						this[0]['*'](
							Global.log.default(this[0])['*'](
								this[1].differentiate(x)
							)
						)
					)['*'](
					this[0]['^'](
						this[1]['-'](Global.One)
					)
				);
		case '/':
			var da = this[0].differentiate(x);
			var db = this[1].differentiate(x);
			if(db === Global.Zero) {
				return da['/'](this[1]);
			}
			return this[1]['*'](da)['-'](this[0]['*'](db))['/'](
				this[1]['^'](new Expression.Integer(2))
			);
		default:
			throw('Cannot differentiate ' + this.operator + ' operator.');
	}
};

Expression.prototype.differentiateN = function(x, n) {
	if (n === 0) {
		return this;
	} else if(n <= -1) {
		return this.integrateN(x, n);
	} else if(n > 1) {
		return this.differentiate(x).differentiateN(x, n - 1);
	} else if (n === 1) {
		return this.differentiate(x);
	}
};
Expression.Root = function NthRoot(x, n) {
	this.a = x;
	this.n = n;
};
Expression.Root.prototype = Object.create(Expression.NumericalReal);
Expression.Root.constructor = Expression.Root;
Expression.Root.prototype['*'] = function (x) {
	if (x.constructor === this.constructor) {
		
	} else {
		return x['*'](this);
	}
};
Expression.Root.prototype.__defineGetter__("value", function () {
	return Math.pow(this.a, 1 / this.n);
});
Expression.Equation = function(e, operator){
	e.__proto__ = Expression.Equation.prototype;
	e.operator = operator;
	return e;
};
//Get toTypedString methods? Maybe we shouldn't.
Expression.Equation.prototype = Object.create(Expression.List.prototype);
Expression.Equation.prototype.apply = function(op, e) {
	throw('Operators cannot be applied to equations');
};
Expression.List.ComplexPolar = function (x){
	x.__proto__ = Expression.List.ComplexPolar.prototype;
	return x;
}
Expression.List.ComplexPolar.prototype = Object.create(Expression.prototype);
Expression.List.ComplexPolar.prototype.polar = function(){
	return this;
};
Expression.List.ComplexPolar.prototype.realimag = function() {
	//TODO: Return Expression.List.ComplexCartesian
	return Expression.List.ComplexCartesian([
		this[0].apply('*', Global.cos.apply(undefined, this[1])),
		this[0].apply('*', Global.sin.apply(undefined, this[1]))
	]);
};
Expression.List.ComplexPolar.prototype.real = function() {
	return this[0].apply('*', Global.cos.apply(undefined, this[1]));
};
Expression.List.ComplexPolar.prototype.imag = function() {
	return this[0].apply('*', Global.sin.apply(undefined, this[1]));
};
Expression.List.ComplexPolar.prototype.conjugate = function() {
	return Expression.List.ComplexPolar([
		this[0],
		this[1].apply('@-')
	]);
};
Expression.List.ComplexPolar.prototype.differentiate = function(x){
	// d/dx a(x) * e^(ib(x))
	
	//TODO ensure below  f' + if g' part is realimag (f', fg')
	return Global.e
	.apply(
		'^',
		Global.i
		.apply('*',
			this[1]
		)
	)
	.apply('*',
		this[0].differentiate(x)
		.apply('+',
			Global.i
			.apply('*',
				this[0]
			)
			.apply('*',
				this[1].differentiate(x)
			)
		)
	);
};
Expression.List.ComplexPolar.prototype.apply = function(o, x) {
	if (x.constructor === this.constructor) {
		switch (o) {
			case undefined:
			case '*':
				//Fast
				return Expression.List.ComplexPolar([
					this[0].apply('*', x[0]),
					this[1].apply('+', x[1])
				]);
			case '/':
				//Also fast
				return Expression.List.ComplexPolar([
					this[0].apply('/', x[0]),
					this[1].apply('-', x[1])
				]);
			case '+':
			case '-':
				//Very slow, maybe we should switch to cartesian now?
			
			case '^':
				//(Ae^(ik)) ^ (Be^(ij))
				//How slow is this?
				//Very fast for real numbers though
			case '!':
			default:
			
		}
	} else if (x.constructor === Expression.NumericalReal) {
		switch (o) {
			case undefined:
			case '*':
				//Fast
				return Expression.List.ComplexPolar([
					this[0].apply('*', x),
					this[1]
				]);
			case '/':
				//Also fast
				return Expression.List.ComplexPolar([
					this[0].apply('/', x),
					this[1]
				]);
			case '+':
			case '-':
				//Very slow, maybe we should switch to cartesian now?
			
			case '^':
				//Fast:
				return Expression.List.ComplexPolar([
					this[0],
					this[1].apply('*', x)
				]);
			case '!':
			default:
			
		}
	} else if (x.constructor === Expression.Complex) {
		switch (o) {
			case undefined:
			case '*':
				//Fast
				return Expression.List.ComplexPolar([
					this[0].apply('*', new Expression.NumericalReal(x._real)),
					this[1].apply('+', new Expression.NumericalReal(x._imag))
				]);
			case '/':
				//Also fast
				return Expression.List.ComplexPolar([
					this[0].apply('/', new Expression.NumericalReal(x._real)),
					this[1].apply('-', new Expression.NumericalReal(x._imag))
				]);
			case '+':
			case '-':
				//Very slow, maybe we should switch to cartesian now?
			
			case '^':
				//(Ae^(ik)) ^ (Be^(ij))
				//How slow is this?
				//Very fast for real numbers though
			case '!':
			default:
			
		}
	}
	
};
Expression.List.ComplexPolar.prototype.abs = function (){
	return this[0];
};
Expression.List.ComplexPolar.prototype.arg = function (){
	return this[1];
};
Expression.List.ComplexPolar.prototype.constructor = Expression.List.ComplexPolar;Expression.prototype.real = function() {
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
};/*
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
};Expression.List.Real = function List_Real(x, operator) {
	x.__proto__ = Expression.List.Real.prototype;
	if(operator !== undefined) {
		x.operator = operator;
	}
	return x;
};
Expression.List.Real.prototype = Object.create(Expression.List.prototype);
Expression.List.Real.prototype.realimag = function (){
	return Expression.List.ComplexCartesian([
		this,
		Global.Zero
	]);
};
Expression.List.Real.prototype.real = function (){
	return this;
};
Expression.List.Real.prototype.imag = function (){
	return Global.Zero;
};
Expression.List.Real.prototype.polar = function () {
	return Expression.List.ComplexPolar([
		Expression.List.Real([Global.abs, this]),
		Expression.List.Real([Global.arg, this])
	]);
};
Expression.List.Real.prototype.abs = function (){
	return Expression.List.Real([Global.abs, this]);
};
Expression.List.Real.prototype.arg = function (){
	return Expression.List.Real([Global.arg, this]);
};
Expression.List.Real.prototype['+'] = function (x) {
	if(this === x) {
		return x['*'](new Expression.Integer(2));
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return this;
		}
	}
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '+' && this[1] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0], this[1]['+'](x)], this.operator);
		}
		if(this.operator === '-' && this[1] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0], x['-'](this[1])], '+');
		}
		
		return Expression.List.Real([this, x], '+');
	}
	
	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '+');
	}
	return x['+'](this);
	
};
Expression.List.Real.prototype['-'] = function (x) {
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return this;
		}
	}
	
	if (x === this) {
		return Global.Zero;
	}
	if (x instanceof Expression.List.Real) {
		if (x.operator === '@-') {
			return Expression.List.Real([this, x[0]], '+');
		}
		return Expression.List.Real([this, x], '-');
	}
	if (x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
		return Expression.List.Real([this, x], '-');
	}
	return this.realimag()['-'](x);
};
Expression.List.Real.prototype['*'] = function (x) {
	
	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}
	if(x instanceof Expression.Rational) {
		if(x.a === 0) {
			return Global.Zero;
		}
	}
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0]['*'](x), this[1]], this.operator);
		}
		return Expression.List.Real([x, this], '*');
	}
	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		if (this[0] instanceof Expression.Function) {
			
		}
		return Expression.List.Real([this, x], '*');
	}
	return x['*'](this);
	
};
Expression.List.Real.prototype['/'] = function (x) {

	if(x instanceof Expression.Rational) {
		if(x.a === x.b) {
			return this;
		}
	}

	if(x === this) {
		return Global.One;
	}

	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/') {
			return Expression.List.Real([this[0]['/'](x), this[1]], this.operator);
		}
		return Expression.List.Real([this, x], '/');
	}

	if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
		return Expression.List.Real([this, x], '/');
	}
	return this.realimag()['/'](x);
};

Expression.List.Real.prototype['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return Expression.List.Real([this], '@-');
};
Expression.List.Real.prototype['^'] = function (x) {
	if(x instanceof Expression.NumericalReal) {
		if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
			return Expression.List.Real([this[0]['^'](x), this[1]['^'](x)], this.operator);
		}
	}
	return Expression.Symbol.Real.prototype['^'].call(this, x);
	
};

Expression.List.Real.prototype.constructor = Expression.List.Real;Expression.prototype.polar = function() {
	var ri = this.realimag();
	var two = new Expression.Integer(2);
	return Expression.List.ComplexPolar([
		Global.sqrt.default(ri[0]['^'](two)['+'](ri[1]['^'](two))),
		Global.atan2.default(Expression.Vector([ri[1], ri[0]]))
	]);
};
Expression.prototype.abs = function() {
	console.warn('SLOW?');
	var ri = this.realimag();
	var two = new Expression.Integer(2);
	return Global.sqrt.default(ri[0]['^'](two)['+'](ri[1]['^'](two)));
};
Expression.prototype.arg = function() {
	console.warn('Slow?');
	var ri = this.realimag();
	return Global.atan2.default(Expression.Vector([ri[1], ri[0]]));
};Expression.prototype.factors = function (vars, yes, no) {
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
window.test = function (str){
	M(str || "x+x+x+x",c ).factors([c.x], function (x){console.log("Y", x);}, function (x){console.log("N", x);})
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
});Expression.prototype.roots = function (vars) {
	return Set([]);
};
Expression.Symbol.prototype.roots = function (vars) {
	if(vars.indexOf(this) !== -1) {
		return Set([new Statement(this, Global.Zero, '=')]);
	}
	return Set([]);
};
Expression.prototype.dep = function (vars) {
	return false;
};
Expression.Symbol.Real.prototype.dep = function (vars) {
	return vars.indexOf(this) !== -1;
}
Expression.List.prototype.dep = function (vars) {
	// var t; if(t = vars.influcens.definiteValue(this)) {
		// return t;
	//}
	if (this[0].dep(vars)) {
		//vars.influcenes.true(this);
		return true;
	}
	if (this[1].dep(vars)) {
		// vars.influcenes.true(this);
		return true;
	}
	//vars.influcenes.false(this);
	return false;
};
Expression.Function.Symbolic.prototype.inverse = function() {
	// x -> x^2
	// f(x) = x^2
	// f(x) - x^2 = 0
	
};
Expression.List.Real.prototype.roots = function (vars) {
	if(this.operator === '*') {

		// Null
		// (x)(1/x) = 0
		// x = 0, or x = Infinity
		// x = 0: (0) * (1/0) = 0 * Infinity ≠ 0.
		var a = this[0].roots(vars);
		var b = this[1].roots(vars);
		return a.union(b);
	} else if (this.operator === '+') {
		/*
		a(x) + b(x) = 0
		
		if a>0 and b>0
		=> only solutions are the intersect or a(x) = 0, and b(x) = 0
		*/
		var factorised = Global.One;
		this.factors(vars,
			function (x, r) {
				// TODO: Find roots in here? (However, this (in its current form) would re invoke the current function, )
				factorised = factorised['*'](x);
			},
			function () {
				
			},
			false
		);
		if(factorised.operator === '*') {
			return factorised.roots(vars);
		} else {
			// TODO: dep could be calculated via the factor transverse.
			if (!this[1].dep(vars)) {
				/*
				// equivalent to a move onto right side of equation
				// f(x) + b = 0
				// f(x) = - b
				// E.g. x^3 + x + 1 = 0 -> 		... ?
				// E.g. x^3 + 1 = 0 -> x^3 = -1 (only because N(x) <= 1)
				// E.g. x^x + 1 = 0 -> x^x = -1 ... ?
				// E.g. x*x - 1 = 0 -> x*x = 1
					x*x = 1
					x^2 = 1
						-> x = 1
				// E.g x^2 + x - 1 = 0
				x(x + 1) = 1
				
				*/
				
			} else if (!this[0].dep(vars)) {
				// b + f(x) = 0
				
				// repeat above (but swap)
			} else {
				throw ('Cannot solve');
			}
		}
		var a_zero = this[0].roots(vars);
		var b_zero = this[0].roots(vars);
		
		
		/*
		
		*/
	} else if (this.operator === '/') {
		/*
		a/b = 0
		a = b * 0
		a = 0
		*/
		var a = this[0].roots(vars);
		// Test that b ≠ 0
		return a;
	}
};

function Infinitesimal(x) {
	this.x = x;
}
Infinitesimal.prototype = Object.create(Expression.prototype);
Infinitesimal.prototype.constructor = Infinitesimal;
Infinitesimal.prototype['+'] = function (x) {
	if(x instanceof Infinitesimal) {
		throw('Infinitesimal addition');
	}
	return x;
};
Infinitesimal.prototype['/'] = function (x) {
	if(x instanceof Infinitesimal) {
		if(x.x instanceof Expression.Symbol) {
			return this.x.differentiate(x.x);
		}
		throw('Confusing infitesimal division');
	}
	this.x = this.x['/'](x);
	return this;
};
Infinitesimal.prototype['*'] = function (x) {
	// d^2 = 0
	if(x instanceof Infinitesimal) {
		return Global.Zero;
	}
	this.x = this.x['*'](x);
};
Infinitesimal.prototype.s = function(lang) {
	if(lang !== 'text/latex') {
		throw ('Infinitesimal numbers cannot be exported to programming languages');
	}
	var c = this.x.s(lang);
	var p = language.precedence('default')
	if(p > c.p) {
		c.s = '\\left(' + c.s + '\\right)';
	}
	return c.update('d' + c.s, p);
};

function Derivative(x) {
	// technically should be a function / operator
	this.x = x;
}
Derivative.prototype = Object.create(Expression.Function.prototype);
Derivative.prototype.constructor = Derivative;
Derivative.prototype.default = function (x) {
	return x.differentiate(this.x);
};
Expression.List.prototype.lim = function (x, y) {
	switch (this.operator) {
		case '+':
		case '-':
			return this[0].lim(x, y)[this.operator](this[1].lim(x, y));
		case '@-':
		case '@+':
			return this[0].lim(x, y)[this.operator]();
		case '/':
			var top = this[0].sub(x, y);
			var bottom = this[1].sub(x, y);
			if (top === Global.Zero && bottom === Global.Zero) {
				top = this[0].differentiate(x);
				bottom = this[1].differentiate(x);
				return top['/'](bottom).lim(x, y);
			}
			return top['/'](bottom);
		case '*':
			var a = this[0].sub(x, y);
			var b = this[1].sub(x, y);
			if (a === Global.Zero && b == Global.Infinity) {
				var top = this[0].differentiate(x);
				var bottom = Global.One['/'](this[1]).differentiate(x);
				return top['/'](bottom).lim(x, y);
			} else if(b === Global.Zero && a == Global.Infinity) {
				var top = this[0].differentiate(x);
				var bottom = Global.One['/'](this[1]).differentiate(x);
				return top['/'](bottom).lim(x, y);
			}
			return a['*'](b);
		case '^':
			if(this[0] === Global.Zero) {
				return Global.Zero;
			}
			if(this[1] === Global.Zero) {
				if(this[0] !== Global.Zero) {
					return Global.One;
				}
			}
			return this.sub(x, y);
		case '!':
			return this.sub(x, y);
	}
};Expression.Vector = function (e) {
	e.__proto__ = Expression.Vector.prototype;
	return e;
};

Expression.Vector.prototype = Object.create(Expression.prototype);
Expression.Vector.prototype.constructor = Expression.Vector;
Expression.Vector.prototype[','] = function (x) {
	this[this.length] = x;
	return this;
};
Expression.Vector.prototype.differentiate = function (x) {
	return Expression.Vector(Array.prototype.map.call(this, function (c) {
		return c.differentiate(x);
	}));
};
Expression.Vector.prototype.cross = function (x) {
	if (this.length !== 3 || x.length !== 3) {
		throw('Cross product only defined for 3D vectors.');
	}
	/*
	i   j    k
	x   y    z
	a   b    c
	
	= (yc - zb, za - xc, xb - ya)
	*/
	
	return new Expression.Vector([
		this[1]['*'](x[2])['-'](this[2]['*'](x[1])),
		this[2]['*'](x[0])['-'](this[0]['*'](x[2])),
		this[0]['*'](x[1])['-'](this[1]['*'](x[0]))
	]);
};
Expression.Vector.prototype.default = function (x) {
	var l = this.length;
	if (x instanceof Expression.Vector) {
		// Dot product
		if(l !== x.length) {
			throw('Vector Dimension mismatch.');
		}
		var i;
		var sum = Global.Zero;
		for (i = 0; i < l; i++) {
			sum = sum['+'](
				(this[i]) ['*'] (x[i])
			);
		}
		return sum;
	} else if (x instanceof Expression.Matrix) {
		
	} else {
		return Expression.Vector(Array.prototype.map.call(this, function (c) {
			return c['*'](x);
		}));
	}
};
Expression.Vector.prototype['*'] = Expression.Vector.prototype.default;
Expression.Vector.prototype['+'] = function (x, op) {
	var l = this.length;
	if(l != x.length) {
		throw('Vector Dimension mismatch.');
	}
	var i;
	var n = new Array(l);
	for (i = 0; i < l; i++) {
		n[i] = this[i][op || '+'](e[i]);
	}
	return Expression.Vector(n);
};
Expression.Vector.prototype['-'] = function (x) {
	return Expression.Vector.prototype.call(this, x, '-');
};
Expression.Vector.prototype['/'] = function (x) {
	if (x instanceof Expression.Vector) {
		throw('Vector division not defined');
	}
	return Expression.Vector(Array.prototype.map.call(this, function (c) {
		return c['/'](x);
	}));
	
};
Expression.Vector.prototype['^'] = function (x) {
	if(x instanceof Expression.Integer) {
		if(x.a === 0) {
			throw('Raised to zero power');
		}
		if(x.a === 1) {
			return this;
		}
		if (x.a === 2) {
			var S = Global.Zero;
			var i, l = this.length;
			for (i = 0; i < l; i++) {
				S = S['+'](this[i]['^'](x));
			}
			return S;
		} else {
			return this['^'](new Expression.Integer(x.a - 1))['*'](this);
		}
	} else if(x instanceof Expression.Rational){
		return this['^'](x.a)['^'](Global.One['/'](x.b));
	} else if (x.constructor === Expression.NumericalComplex) {
		return new Expression.Complex(this.value + x._real, x._imag);
	} else if(x.constructor === Expression.List.ComplexCartesian) {
		// commute
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.ComplexPolar) {	
		return (x)['+'](this);
	} else if(x.constructor === Expression.List.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.Symbol.Real) {
		return (x)['+'](this);
	} else if(x.constructor === Expression.List) {
		return (x)['+'](this);
	} else {
		throw ('Unknown Type for Vector ^');
	}
	return this.default(this['^'](x['-'](Global.One)));
};
Expression.Vector.prototype.apply = function(operator, e) {
	var l = this.length;
	switch (operator) {
		case ',':
			//Array.prototype.push.apply(this, [e]);
			//Faster:
			//MODIFIES!!!!!!!!!
			this[l] = e;
			return this;
		case undefined:
		case '*':
			if(l != e.length) {
				throw('Vector Dimension mismatch.');
			}
			var i;
			var sum = M.Global.Zero;
			for (i = 0; i < l; i++) {
				sum = sum.apply('+', this[i].apply('*', e[i]));
			}
			return sum;
		case '+':
		case '-':
			if(l != e.length) {
				throw('Vector Dimension mismatch.');
			}
			var i;
			var n = new Array(l);
			for (i = 0; i < l; i++) {
				n[i] = this[i].apply(operator, e[i]);
			}
			return Expression.Vector(n);
		case '/':
		case '^':
		default:
			throw('Vector operation not allowed.');
	}
};

Expression.Vector.prototype.realimag = function(){
	var l = this.length;
	var _x = new Array(l);
	var _y = new Array(l);
	var i;
	for(i = 0; i < l; i++) {
		var ri = this[i].realimag();
		_x[i] = ri[0];
		_y[i] = ri[1];
	}
	return Expression.List.ComplexCartesian([
		Expression.Vector(_x),
		Expression.Vector(_y)
	]);
};
Expression.Matrix = function (e, r, c) {
	e.__proto__ = Expression.Matrix.prototype;
	e.rows = r;
	e.cols = c;
	return e;
};

window.M4 = Expression.Matrix;
Expression.Matrix.prototype = Object.create(Expression.prototype);
Expression.Matrix.prototype.constructor = Expression.Matrix;
Expression.Matrix.prototype.default = Expression.Matrix.prototype['*'] = function (x) {
	if(x.constructor === Expression.Matrix) {
		// Broken
		// O(n^3)
		if (x.rows !== this.cols) {
			throw ('Matrix dimensions do not match.');
		}
		var result = [];
		// result[x.rows * x.cols - 1 ] = undefined;
		var i, j, k, r = 0;
		for (i = 0; i < this.rows; i++) {
			for (j = 0; j < x.cols; j++) {
				var sum = Global.Zero;
				for(k = 0; k < x.rows; k++) {
					sum = sum['+'](x[k * x.cols + j]);
				}
				result[r++] = sum;
			}
		}
		return Expression.Matrix(result);
	} else {
		throw ('Unknown type');
	}
};
Expression.Matrix.prototype.reduce = function (app) {
	var x, y;
	for(y = 0; y < this.rows; y++) {
		for(x = 0; x < y; x++) {
			// Make this[x,y] = 0
			var ma = this[x * this.cols + x];
			// 0 = this - (this/ma) * ma
			if(ma === Global.Zero) {
				throw ('Row swap!');
			}
			var tma = this[y * this.cols + x]['/'](ma);
			var i;
			for (i = x + 1; i < this.cols; i++) {
				this[y * this.cols + i] = this[y * this.cols + i]['-'](tma['*'](this[x * this.cols + i]));
			}
		}
	}
	return this;
};
Expression.Sum = function Summation(x, a, b, f_unbound) {
	this.x = x;
	this.f = f_unbound;
	this.a = a;
	this.b = b;
};
Expression.Sum.prototype = Object.create(Expression.Symbol.prototype);
Expression.Sum.prototype.constructor = Expression.Sum;

Expression.Sum.prototype.s = function (lang) {
	if (lang === 'text/latex') {
		var cf = this.f.s(lang);
		var ca = this.a.s(lang);
		var cb = this.b.s(lang);
		var cx = this.x.s(lang);
		var cf_s = cf.s;
		var c = cf;
		c = cf.merge(ca);
		c = cf.merge(cb);
		return c.merge(cx, '\\sum_{' + cx.s + '=' + ca.s + '}^{' + cb.s + '}' + cf_s, language.precedence('*'));
	}
	if (lang === 'text/javascript') {

		var ca = this.a.s(lang);
		var cb = this.b.s(lang);
		if(!(this.x instanceof Expression.Symbol.Real)) {
			throw('Can only sum over reals in javascript');
		}



		var cx = this.x.s(lang);
		
		var c = cx.merge(ca).merge(cb);
		//c = c.merge(cx);
		
		// Need a summation variable, allocate one:
		var sv = c.var();
		// Total sum value:
		var ts = c.var();

		// Upper limit, (since javascript will recalculate it every time)
		var ul = c.var();
		
		var ll = c.var();
		

		var f_subbed = this.f.sub(this.x, new Expression.Symbol.Real(sv));
		var cf = f_subbed.s(lang);
		
		
		var sumcode = 'var ' + ts + ' = 0, ' + sv + ', ' + ll + ' = ' + ca.s +  ', ' + ul + ' = ' + cb.s + ';\nif(' + ul + ' === Infinity) {\n\t' + ul + ' = 1000;\n}\nif (!(' + ul + ' >= ' + ll + ')) {\n\tthrow("Halting problem solved.")\n}\nfor(' + sv + ' = ' + ll + '; ' + sv + ' < ' + ul +  '; ' + sv + '++) {\n\t' + ts + ' +=' + cf.s + ';\n}\n';
		return c.merge(cf, ts, Infinity, sumcode);
	}
};
Expression.Sum.prototype['^'] = function (x) {
	if(this.b_locked) {
		throw('Sum was upper bounded twice!');
	}
	this.b = x;
	this.b_locked = true;
	return this;
};
Expression.Sum.prototype.default = function (x) {
	if(!this.b_locked) {
		throw('Sum was not upper bounded!');
	}
	if(this.f_locked) {
		throw('Sum already defined');
	}
	this.f = x;
	this.f_locked = true;
	return this;
};Expression.List.prototype.expand = function(vars) {
	var right = 1;
	var left = -1;
	var L = Global.Zero;
	var R = Global.Zero;
	throw("Should be async, don't use this");
	
	if (this[1] instanceof Expression.List) {
		if (this.operator === '+' || this.operator === '-') {
			return this[0].expand(vars)[this.operator](this[1].expand(vars));
		}
		if (this.operator === '*' ) {
			var a = this[0].expand(vars);
			var b = this[1].expand(vars);
			a.terms(vars,
				function (y) {
					L = L['+'](y);
				},
				function (n) {
					R = R['+'](y);
				}
			);
			a.terms(vars,
				function (y) {
					L = L['+'](y);
				},
				function (n) {
					R = R['+'](y);
				}
			);
			
			
		}
	} else {
		return this;
	}
	//Use distributive law
};
Expression.prototype.simplify = function() {
	return this;
};Expression.prototype.integrate = function(x) {
	throw('Could not integrate expression.');
};
Expression.prototype.integrateN = function(x, n) {
	if (n === 0) {
		return this;
	} else if(n <= -1) {
		return this.differentiateN(x, n);
	} else if(n > 1) {
		return this.integrate(x).integrateN(x, n - 1);
	} else if (n === 1) {
		return this.integrate(x);
	}
};
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
	throw('Use real(), imag(), or abs(), or arg() first.');
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

				if(lang === 'text/latex') {
					return c1.update('\\left|' + c1.s + '\\right|', Infinity);
				}
				var c0 = this[0].s(lang);
				return c1.update(c0.s + '(' + c1.s + ')', Infinity);
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
	return new Code(this.symbol || 'x_{free}');
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
};//Use complex numbers by default
Expression.Numerical = Expression.Complex;
//Expression.Numerical = Expression.NumericalReal;
Global['sin'] = new Expression.Function({
	default: function(x) {
		switch (x.constructor) {
			case Expression.ComplexNumerical:
				// sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.ComplexNumerical(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
			case Expression.NumericalReal:
				return new Expression.NumericalReal(Math.sin(x.value));
			case Expression.List.Real:
			case Expression.Symbol.Real:
				return Expression.List.Real([Global.sin, x]);
			default:
				return Expression.List([Global.sin, x]);
		}
	},
	'text/latex': '\\sin',
	'text/javascript': 'Math.sin',
	'x-shader/x-fragment': 'sin',
	title: 'Sine Function',
	description: 'See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent',
	examples: ['\\sin (\\pi)'],
	related: ['cos', 'tan']
});
Global['cos'] = new Expression.Function({
	default: function(x) {
		switch (x.constructor) {
			case Expression.Complex:
				// cos(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
				var exp_b = Math.exp(x._imag);
				var cosh_b = (exp_b + 1 / exp_b) / 2;
				var sinh_b = (exp_b - 1 / exp_b) / 2;
				return new Expression.Complex(Math.cos(x._real) * cosh_b, -Math.sin(x._real) * sinh_b);
			case Expression.NumericalReal:
				return new Expression.NumericalReal(Math.cos(x));
			case Expression.List.Real:
			case Expression.Symbol.Real:
				return Expression.List.Real([Global.cos, x]);
			default:
				return Expression.List([Global.cos, x]);
		}
	},
	derivative: Global.sin['@-'](),
	'text/latex': '\\cos',
	'text/javascript': 'Math.cos',
	'x-shader/x-fragment': 'cos',
	title: 'Cosine Function',
	description: 'Cosine Function desc',
	examples: ['\\cos (\\pi)'],
	related: ['sin', 'tan']
});

Global.sin.derivative = Global.cos;

Global['tan'] = new Expression.Function({
	symbolic: function () {
		
	}
});
Global['log'] = new Expression.Function({
	default: function (x, assumptions) {

		if(x instanceof Expression.Integer && x.a === 1) {
			return Global.Zero;
		} else if(x instanceof Expression.Integer && x.a === 0) {
			return Global.Infinity['@-']();
		} else if(x instanceof Expression.NumericalReal) {
			var v = x.value;
			if(v > 0){
				return new Expression.NumericalReal(Math.log(v));
			}
		}

		if(assumptions && assumptions.positive) {
			return Expression.List.Real([Global.log, x]);
		}
		
		return Expression.List([Global.log, x]);
	},
	realimag: function (x) {
		return CartLog;
	},
	'text/latex': '\\log',
	'text/javascript': 'Math.log',
	'x-shader/x-fragment': 'log',
	title: 'Natural Logarithm',
	description: 'Base e. See http://en.wikipedia.org/wiki/Natural_logarithm',
	examples: ['\\log (ye^(2x))'],
	related: ['exp', 'Log']
});
var Half = new Expression.Rational(1, 2);
var CartLog = new Expression.Function({
	default: function (x) {
		return new Expression.List.ComplexCartesian([
			Global.log.default(x.abs()),
			x.arg()
		])['*'](Half);
	}
});
CartLog.__proto__ = Global.log;
Global['atan2'] = new Expression.Function({
	default: function(x) {
		if(! (x instanceof Expression.Vector)) {
			throw ('atan only takes vector arguments');
		}
		if(x[0] instanceof Expression.NumericalReal) {
			if(x[1] instanceof Expression.NumericalReal) {
				return new Expression.NumericalReal(Math.atan2(x[0].value, x[1].value));
			}
		}
		
		return new Expression.List.Real([Global.atan2, x]);
		
		return Expression.List([Global.atan2, x]);
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		return [Expression.List([Global.atan2, x]), M.Global.Zero];
	},
	'text/latex': '\\tan^{-1}',
	'text/javascript': 'Math.atan2',
	'x-shader/x-fragment': 'atan',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Two argument arctangent function',
	description: 'Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2'
});

Global['atan'] = Global.atan2;

Global['Gamma'] = {
	default: function(x){
		function gammln(xx) {
		    var j;
		    var x, tmp, y, ser;
		    var cof = [
				57.1562356658629235,
				-59.5979603554754912,
				14.1360979747417471,
				-0.491913816097620199,
				0.339946499848118887e-4,
				0.465236289270485756e-4,
				-0.983744753048795646e-4,
				0.158088703224912494e-3,
				-0.210264441724104883e-3,
				0.217439618115212643e-3,
				-0.164318106536763890e-3,
				0.844182239838527433e-4,
				-0.261908384015814087e-4,
				0.368991826595316234e-5
			];
		    if (xx <= 0){
		        throw('bad arg in gammln');
		    }
		    y = x = xx;
		    tmp = x + 5.24218750000000000;
		    tmp = (x + 0.5) * Math.log(tmp) - tmp;
		    ser = 0.999999999999997092;
		    for (j = 0; j < 14; j++){
		        ser += cof[j] / ++y;
		    }
		    return tmp + Math.log(2.5066282746310005 * ser / x);
		}
		if (x instanceof Expression.Integer) {
			var v = x.a;
			if(v < 0) {
				return Global.ComplexInfinity;
			}
			if(v < 15) {
				var p = 1;
				var i = 0;
				for(i = 1; i < v; i++) {
					p *= i;
				}
				return new Expression.Integer(p);
			}
			return Expression.List.Real([Global.Gamma, x]);
		} else if (x instanceof Expression.NumericalReal) {
			var v = x.value;
			if (v === 0) {
		        return Global.Infinity;
		    } else if(v < 0) {
				return new Expression.NumericalReal(-Math.PI / (v * Math.sin(Math.PI * v) * Math.exp(gammln(-v))));
		    }
			return new Expression.NumericalReal(Math.exp(gammln(v)));
		} else if(x instanceof Expression.NumericalComplex) {
			
		}
		return Expression.List([Global.Gamma, x]);
	},
	'text/latex': '\\Gamma',
	'text/javascript': 'M.Global.Gamma.f',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Gamma Function',
	description: 'See http://en.wikipedia.org/wiki/Gamma_function',
	examples: ['\\Gamma (x)', 'x!'],
	related: ['Log', 'LogGamma']
};
Global['Re'] = {
	default: function(x) {
		return x.real();
	},
	apply_realimag: function(op, x) {
		return [x.real(), Global.Zero];
	},
	'text/latex': '\\Re'
};
Global['Im'] = {
	default: function(x) {
		return x.imag();
	},
	distributed_under_differentiation: true,
	apply_realimag: function(op, x) {
		return [x.imag(), Global.Zero];
	},
	'text/latex': '\\Im'
}
Expression.List.Real.prototype.positive = function () {
	if(this.operator === '+') {
		return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
	}
	if(this.operator === '*') {
		if(this[0] === this[1]) {
			return true;
		}
		return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
	}
	if(this.operator === '^') {
		if(this[1] instanceof Expression.Rational) {
			var f = this[1].reduce();
			if(f.a % 2 === 0) {
				return true;
			}
		}
	}
	return false;
};
Expression.NumericalReal.prototype.positive = function () {
	return this.value > 0;
};
Global['sqrt'] = new Expression.Function({
	default: function (x) {
		if (x instanceof Expression.NumericalReal) {
			var v = x.value;
			if(v < 0) {
				return new Expression.List.ComplexCartesian([
					Global.Zero, new Expression.NumericalReal(Math.sqrt(v))
				]);
			}
			return new Expression.NumericalReal(Math.sqrt(v));
		} else if (x instanceof Expression.List.Real) {
			if(x.positive()) {
				return Expression.List.Real([Global.sqrt, x]);
			} else {
				return Expression.List([Global.sqrt, x]);
			}
		} else if (x instanceof Expression.List.ComplexPolar) {
			return new Expression.List.ComplexPolar([
				x[0],
				x[1]['/'](new Expression.Integer(2))
			]);
		} else if (x instanceof Expression.List.ComplexCartesian) {
			return new Expression.List([Global.sqrt, x]);
		}
		return Expression.List([Global.sqrt, x]);
		throw('SQRT: ???');
		switch (x.constructor) {
			case Expression.Complex:
				//http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
				var sgn_b;
				if (x._imag === 0.0) {
					return new Expression.Complex(Math.sqrt(x._real), 0);
				} else if(x._imag>0) {
					sgn_b = 1.0;
				} else {
					sgn_b = -1.0;
				}
				var s_a2_b2 = Math.sqrt(x._real * x._real + x._imag * x._imag);
				var p = one_on_rt2 * Math.sqrt(s_a2_b2 + x._real);
				var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - x._real);
			case Expression.NumericalReal:
				return new Expression.RealNumerical(Math.sqrt(x));
			case Expression.List.Real:
			case Expression.List:
				if (x.operator === '^') {
					return Global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
				}
			default:
				return Expression.List([Global.sqrt, x]);
		}
	},
	apply_realimag: function(op, x) {
		//TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
		
		//Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
		return x['^'](new Expression.Rational(1, 2)).realimag();
		//var ri = x.realimag();
		//return [Expression.List([Global.sqrt, x]), M.Global.Zero];
	},
	'text/latex': '\\sqrt',
	'text/javascript': 'Math.sqrt',
	'x-shader/x-fragment': 'sqrt',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	title: 'Sqrt Function',
	description: 'See http://en.wikipedia.org/wiki/Square_Root',
	examples: ['\\sqrt (x^4)'],
	related: ['pow', 'abs', 'mod']
});
Global['abs'] = new Expression.Function({
	default: function (x) {
		//Using abs is better (I think) because it finds the method through the prototype chain,
		//which is going to be faster than doing an if list / switch case list.
		return x.abs();
	},
	'text/latex': '\\abs',
	'text/javascript': 'Math.abs',
	'x-shader/x-fragment': 'abs',
	titie: 'Absolute Value Function',
	description: 'Abs',
	examples: ['\\abs (-3)', '\\abs (i+3)'],
	related: ['arg', 'tan']
});

// It is self-referential
Global.abs.derivative = (function () {
		var s = new Expression.Symbol.Real();
		var y = s['/'](s.abs());
		return new Expression.Function.Symbolic(y, [s]);
}());
Global['arg'] = {
	default: function (x) {
		console.warn('ARG IS FOR USER INPUT ONLY. USE .arg()');
		//Using abs is better (I think) because it finds the method through the prototype chain,
		//which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
		return x.arg();
	},
	'text/latex': '\\arg', //temp
	'text/javascript': 'Math.arg_real',
	toTypedString: function(language) {
		return {
			s: this[language],
			t:javascript.Function
		}
	},
	titie: 'Arg Function',
	description: 'Arg',
	examples: ['\\arg (-3)', '\\arg (3)', '\\arg(3+2i)'],
	related: ['abs']
}



Global['e'] = new Expression.NumericalReal(Math.E, 0);
Global['e'].title = 'e';
Global['e'].description = 'The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.';
Global.e.s = function (lang) {
	if(lang === 'text/javascript') {
		return new Code('Math.E');
	}
	if(lang == 'text/latex') {
		return new Code('e');
	}
	return new Code('2.718281828459045');
};


Global['pi'] = new Expression.NumericalReal(Math.PI, 0);
Global['pi'].title = 'Pi';
Global['pi'].description = '';
Global.pi.s = function (lang) {
	if(lang === 'text/javascript') {
		return new Code('Math.PI');
	}
	if(lang === 'text/latex') {
		return new Code('\\pi');
	}
	return new Code('3.141592653589793');
};
// The real circle constant:
Global.tau = Global['pi']['*'](new Expression.Integer(2));

Global['Infinity'] = new Expression.NumericalReal(Infinity, 0);
Global['Infinity'].title = 'Infinity';
Global['Infinity'].description = '';
Global['infty'] = Global.Infinity;


Global['Zero'] = new Expression.Integer(0);
Global['Zero'].title = 'Zero';
Global['Zero'].description = 'Additive Identity';
Global['Zero']['*'] = function (x) {
	return Global.Zero;
};
Global['Zero']['+'] = function (x) {
	return x;
};
Global['Zero']['-'] = function (x) {
	return x['@-']();
};

Global['One'] = new Expression.Integer(1);
Global['One'].title = 'One';
Global['One'].description = 'Multiplicative Identity';
Global['One']['*'] = function (x) {
	return x;
};

Global.log.derivative = new Expression.Function.Symbolic(Global.One['/'](new Expression.Symbol.Real()));

Global['i'] = new Expression.List.ComplexCartesian([Global['Zero'], Global['One']]);
Global['i'].title = 'Imaginary Unit';
Global['i'].description = 'A number which satisfies the property <m>i^2 = -1</m>.';
Global['i'].realimag = function(){
	return Expression.List.ComplexCartesian([
		Global.Zero,
		Global.One
	]);
};
Global['i']['*[TODO]'] = function (x) {
	
};

Global['d'] = new Expression.Function({
	default: function(x) {
		return new Infinitesimal(x);
	}
});

Global.d['/'] = function (x) {
	if(x instanceof Infinitesimal) {
		if(x.x instanceof Expression.Symbol) {
	
			// Derivative operator
			
			return new Derivative(x.x);
		}
		if(x.x instanceof Expression.Vector) {
			return Expression.Vector(Array.prototype.map.call(x.x, function (x) {
				return new Derivative(x);
			}));
		}
		throw('Confusing infitesimal division');
	}

	throw('Dividing d by some large number.');
	
};

Global['sum'] = new Expression.Function({
	default: function (x) {
		return 3;
	}
});
Global['sum']['_'] = function (eq) {
	// start: 
	var t = eq[0];
	var v = eq[1];
	return new Expression.Sum(t, v);
}// Note that it is M.Global, and NOT just Global (so the user can set M.Global)
function M(a, b) {
    var ne = Expression(a, b || M.Global);
	return ne;
}
var _M = M;
M = function (a, b) {
	var t = new Date();
	var r = _M(a, b);
	var i;
	var j = 100;
	for(i = 0; i < j; i++) {
		_M(a, b);
	}
	console.log('M: ', a, (new Date() - t)/j + 'ms');
	return r;
}
M.toString = function() {
	return 'function M() {\n    /*!\n     *  Math JavaScript Library v3.0.0\n     *  https://github.com/aantthony/javascript-cas\n     *  \n     *  Copyright 2010 Anthony Foster. All rights reserved.\n     */\n    [awesome code]\n}';
};

//Allow creation of new Context externally
M['Context'] = Context;

M['Expression'] = Expression;
//Allow modification of global context
M['Global'] = Global;

var extensions = {};
M['register'] = function (name, installer){
	if(Expression.prototype[name]) {
		throw('Method .'+name+' is already in use!');
	}
	extensions[name] = installer;
};
M.load = function(name, config) {
	extensions[name](M, Expression, config);
	delete extensions[name];
};

if (typeof module !== 'undefined') {
	// Node
	module['exports'] = M;
} else {
	// In browser
	window['M'] = M;
}

console.log('Load time:', new Date() - startTime, 'ms');}());