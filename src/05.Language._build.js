/*
Todo:
 * Don't evaluate/compute until fully lexed (for parsing ambiguous expressions)
*/

var calculator = parser;


Language.build = function () {
	this.parse = function (s, base) {
		if(s === '') {
			return undefined;
		}
		
		var root = Object.create({});
		var context = root;
		
		var free = {};
		var bound = {};
		
		function down(vars) {
			context = Object.create(context);
			var i;
			for(i in vars) {
				if(vars.hasOwnProperty(i)) {
					context[i] = vars[i];
				}
			}
		}
		function up(entity) {
			context = context.__proto__;
			return entity;
		}
		/*
			Evaluate AST tree (top-down)
			
			Examples:
				* y=x^2
					['=', y, ['^', x, 2]]
		
		*/
		var loose = false;
		function evaluate(ast) {
			if(typeof ast === 'string') {
				var symbol;
				if(symbol = context[ast]) {
					return symbol;
				} else if(symbol = base[ast]) {
					bound[ast] = symbol;
				} else {
					free[ast] = symbol = new Expression.Symbol.Real(ast);
				}
				return root[ast] = symbol;
			}
			if(typeof ast === 'object') {
				
				var ast1 = evaluate(ast[1]);
				
				if(ast.length === 3) {
					switch (ast[0]) {
						case 'frac':
							ast[0] = '/';
							break;
						case '_':
							// Don't bind underneath
							if(ast[1] === 'sum') {
								var limit = ast[2];
								if (limit[0] === '=') {
									// dummy variable: 
									var x = new Expression.Symbol.Real(limit[1]);
									
									// lower limit
									var a = evaluate(limit[2]);
									var summinator = new Expression.Sum.Real(x, a);
									summinator.vars = {};
									summinator.vars[x.symbol] = x;
									return summinator;
								}
							}
							break;
					}
					if(ast[0] === 'default' && ast1.vars) {
						down(ast1.vars);
							var result = ast1[ast[0]](evaluate(ast[2]));
							delete result.vars;
						return up(result);
					}
					return ast1[ast[0]](evaluate(ast[2]));
				}
				if(ast.length === 2) {
					switch(ast[0]) {
						case 'sqrt':
							return Global.sqrt.default(evaluate(ast[1]));
					}
					
					return evaluate(ast[1])[ast[0]]();
				}
				if(ast.length === 4) {
					return evaluate(ast[1])[ast[0]](evaluate(ast[1]), evaluate(ast[2]));
				}
			}
			return ast;
		}
		
		
		// Parse using context free grammar ([graph]/grammar/calculator.jison)
		var ast = calculator.parse(s);
		var result = evaluate(ast);
		result._ast = ast;
		if(root !== context) {
			throw('Context still open');
		}
		
		result.unbound = free;
		result.bound = bound;
		return result;
	};
};


calculator.parseError = function (str, hash) {
	
	// {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected}
	
	
	var er = new SyntaxError(str);
	er.line = hash.line;
	throw er;
};