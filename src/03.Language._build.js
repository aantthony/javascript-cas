Language.prototype._build = function() {
	var operators = this.operators;
	var token_types = {
		string: 1,
		number: 2,
		operator: 3,
		comment: 4,
		parenopen: 5,
		parenclose: 6,
    	symbol: 7
	};
	var nummustbe = "1234567890.";
	var operator_str_list = ["+", "-", "*", "/", "^", "++", "=", "!", ","];
	var parenopenmustbe = "([{";
	var parenclosemustbe = "}\"])";
	var varcannotbe = operator_str_list.join("") + parenopenmustbe + parenclosemustbe + nummustbe;
	var default_operator = undefined;
	var match = [
	    function none() {
	        throw("NONE");
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
			return x[x.length-1] === " ";
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
		    throw (new SyntaxError("Invalid character: '" + x + "'"));
		}
	];
	var names = match.map(function(e) {return e.name;});
	this.parse = function (s, context) {
		var last_token_type = token_types.parenopen;
		
		//Stack of tokens for the shunting yard algorithm
		var stack = [];
		//Stack of tokens for RPN notation. ('evaluated' to a tree representation)
		var rpn_stack = [];
		
		//The evelauation part of the shunting yard algorithm inside out.
		function next_rpn(token) {
			// While there are input tokens left
			// Read the next token from input.
			//console.log("rpn: ",token);
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
					throw (new SyntaxError("The '" + token.v + "' operator requires exactly " + n + " operands, whereas only " + rpn_stack.length + " " + (rpn_stack.length === 1 ? "was ": "were ") + "supplied, namely "+rpn_stack.toString()));
					// Else,
				} else {
					// Pop the top n values from the stack.
					var spliced = rpn_stack.splice( - n, n);
					//var values = ExpressionWithArray(spliced, token.v);
					//TODO: check non-binary operators
					var values = spliced[0].apply(token.v, spliced.slice(1)[0]);
					// Evaluate the operator, with the values as arguments.
					//var evaled=(" ("+values[0]+token.v+values[1]+")");
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
				//'Keyword' search: eg. break, if. Stuff like that.
				if (operators[token.v]) {
					token.t = token_types.operator;
				} else if (token.v === "false") {
					token.v = false;
				} else if (token.v === "true") {
					token.v = true;
				} else if (token.v === "Infinity") {
					token.v = Infinity;
				} else if (typeof token.v === "string") {
				    if (context[token.v]) {
				        //Make .v a pointer to the referenced object.
				        token.v = context[token.v];
				    } else {
    				    token.v = new Expression.Symbol.Real(token.v);
				    }
				}
			}
			//console.log("token: ", token.v, names[token.t]);
			//Comments from http://en.wikipedia.org/wiki/Shunting-yard_algorithm
			// Read a token.
			// If the token is a number, then add it to the output queue.
			if (token.t === token_types.number || token.t === token_types.symbol) {
				if (token.t == token_types.number) {
					token.v = new Expression.NumericalReal(Number(token.v), 0);
				}
				next_rpn(token);
			}
			// If the token is a function token, then push it onto the stack.
			if (token.t === token_types.func) {
				stack.push(token);
			}

			// If the token is a function argument separator (e.g., a comma):
			if (0 && token.t === token_types.comma) {
				// Until the token at the top of the stack is a left parenthesis,
				while (stack[stack.length - 1].t !== token_types.parenopen) {

					// If no left parentheses are encountered,
					if (!stack.length) {
						// either the separator was misplaced or parentheses were mismatched.
						throw(new SyntaxError("Unexpected EOF"));
						throw("either the separator was misplaced or parentheses were mismatched.");
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

			}
			// If the token is an operator
			if (token.t === token_types.operator) {
				//, o1, then:
				var o1 = token;
				var o1precedence = operators[o1.v][1];
				//var o1associative=associativity(o1.v);
				var o1associative = operators[o1.v][0];
				// ("o2 " is assumed to exist)
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
					throw ("Pop the left parenthesis from the stack: Not found ! ")
				}

				// If the token at the top of the stack is a function token, pop it onto the output queue.
				if (stack.length && stack[stack.length - 1].t === token_types.func) {
					next_rpn(stack.pop());
				}
			}
		}
		function next_raw_token(str, t) {
		    if(t === token_types.comment) {
		        return;
		    }
		    if(t !== token_types.operator && t !== token_types.parenclose) {
		        if(last_token_type !== token_types.parenopen) {
    		        if(last_token_type !== token_types.operator) {
    		            next_raw_token(default_operator, token_types.operator);
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
				throw ("There are mismatched parentheses.");
			}
			//Pop the operator onto the output queue.
			next_rpn(the_operator);
		}
		if (rpn_stack.length !== 1) {
			console.warn("Stack not the right size! ", rpn_stack);
			throw("Stack not the right size!");
			//who gives?
			return rpn_stack;
		}
		return rpn_stack[0];
	};
};