Language.prototype._build = function(){
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
	var operator_str_list = ["+","-","*","/","^", "++"];
	var parenopenmustbe = "([{";
	var parenclosemustbe = "}\"])";
	var varcannotbe = operator_str_list.join("") + parenopenmustbe + parenclosemustbe + nummustbe;
	var default_operator = "*";
	var match = [
	    function none(){
	        throw("NONE");
	    },
		function string(x){
			return false;
		},
		function number(x){
			return nummustbe.indexOf(x[x.length-1]) !== -1;
		},
		function operator(x){
			return operator_str_list.indexOf(x) !== -1;
		},
		function comment(x){
			return x[x.length-1] === " ";
		},
		function parenopen(x){
			return (x.length == 1) && (parenopenmustbe.indexOf(x) != -1);
		},
		function parenclose(x){
			return (x.length == 1) && (parenclosemustbe.indexOf(x) != -1);
		},
		function symbol(x){
		    return /^[A-Za-z]$/.test(x[x.length-1]);
		}
	];
	var names = match.map(function(e){return e.name;});
	this.parse = function (s, output) {
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
			if (token.t === token_types.number || token.t === token_types.variable) {
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
					throw (new SyntaxError("The " + token.v + "operator requires exactly " + n + "operands, whereas only " + rpn_stack.length + "" + (rpn_stack.length === 1 ? "was ": "were ") + "supplied."));
					// Else,
				} else {
					// Pop the top n values from the stack.
					var values = rpn_stack.splice( - n, n);
					// Evaluate the operator, with the values as arguments.
					//var evaled=(" ("+values[0]+token.v+values[1]+")");
					values.type = token.v;
					// Push the returned results, if any, back onto the stack.
					//console.log("values: ",values.clone());
					rpn_stack.push(values);
				}
			}
		}

		//Shunting yard algorithm inside out.
		//Because the algorithm reads one token at a time, we can just
		//give it the token as soon as we get that token (from the tokenizer/parser), and
		//instead of pushing to a temporary array, just call next_token(token).
		//The same applies to the RPN evaluator (above)
		function next_token(token){
		    if (token.t === token_types.variable) {
				//'Keyword' search: eg. break, if. Stuff like that.
				if (operators[token.v]) {
					token.t = token_types.operator;
				} else if (token.v === "false ") {
					token.v = false;
				} else if (token.v === "true ") {
					token.v = true;
				} else if (token.v === "Infinity ") {
					token.v = Infinity;
				}
			}
			//console.log("token: ", token.v, names[token.t]);
			//Comments from http://en.wikipedia.org/wiki/Shunting-yard_algorithm
			// Read a token.
			// If the token is a number, then add it to the output queue.
			if (token.t == token_types.number || token.t == token_types.variable) {
				if (token.t == token_types.number) {
					token.v = Number(token.v);
				}
				next_rpn(token);
			}
			// If the token is a function token, then push it onto the stack.
			if (token.t === token_types.func) {
				stack.push(token);
			}

			// If the token is a function argument separator (e.g., a comma):
			if (token.t === token_types.comma) {
				// Until the token at the top of the stack is a left parenthesis,
				while (stack[stack.length - 1].v != " (") {

					// If no left parentheses are encountered,
					if (!stack.length) {
						// either the separator was misplaced or parentheses were mismatched.
						throw ("either the separator was misplaced or parentheses were mismatched.")
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

			}
			// If the token is an operator
			if (token.t === token_types.operator) {
				//, o1, then:
				var o1 = token;
				var o1precedence = precedence(o1.v);
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
				(
				//o1 is left-associative
				o1associative == left
				//and
				&&
				//its precedence is
				o1precedence
				//less than or equal to
				<=
				//that of o2,
				precedence(o2.v)
				)
				//or
				||
				(
				//o1 is right-associative
				o1associative != left

				//and
				&&

				//its precedence is
				o1precedence

				//less than
				<

				//that of o2
				precedence(o2.v)
				)

				)

				) {
					// pop o2 off the stack, onto the output queue;
					next_rpn(stack.pop());
				}

				// push o1 onto the stack.
				stack.push(o1);
			}
			// If the token is a left parenthesis,
			if (token.v == " (") {
				//then push it onto the stack.
				stack.push(token);
			}
			// If the token is a right parenthesis:
			if (token.v == ")") {
				// Until the token at the top of the stack is a left parenthesis,
				while (stack[stack.length - 1].v != " (") {

					// If the stack runs out without finding a left parenthesis, then
					if (!stack.length) {
						//there are mismatched parentheses.
						throw (new SyntaxError(msg.parenMismatch));
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

				// Pop the left parenthesis from the stack, but not onto the output queue.
				if (stack.pop().v != " (") {
					throw ("Pop the left parenthesis from the stack: Not found ! ")
				}

				// If the token at the top of the stack is a function token, pop it onto the output queue.
				if (stack.length && stack[stack.length - 1].t === token_types.func) {
					next_rpn(stack.pop);
				}
			}
		}
		function next_raw_token(str, t){
		    if(t === token_types.comment){
		        console.log('/*' + str + '*/');
		        return;
		    }
		    if(t !== token_types.operator && t !== token_types.parenclose){
		        if(last_token_type !== token_types.parenopen){
    		        if(last_token_type !== token_types.operator){
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
		for (t = 1; t < 8; t++) {
			if (match[t](current_token)) {
				break;
			}
		}
        for(i=1; i<l; i++){
            var ds = s[i];
            var cds = current_token + ds;
            if(match[t](cds)){
                current_token = cds;
            }else{
                var nt;
                for(nt = 1; nt < 8; nt++){
                    if(match[nt](ds)){
                        break;
                    }
                }
                next_raw_token(current_token, t);
                t = nt;
                current_token = ds;
            }
        }
        next_raw_token(current_token, t);
	};
};