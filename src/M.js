var msg={
	"latexParse":"Unable to parse LaTeX string",
	"parenMismatch":"There are mismatched parentheses"
};

var parse = (function (language) {
	O(1, "parse - build");
	//Begin parse building space.
	//This context will be accessible to parse()
	var types = {
		number: 1,
		operator: 2,
		paren: 3,
		variable: 4
	};
	
	var names = ["none","num","op","paren","var"];

	

	//Operator characters
	//TODO: calculate programmatically
	
	var ochars=":>-.+~!^%/*<=&|?,;±∘'∫∑∫√¬_$";
	
	//TODO: Allow 1e+2 format
	var nummustbe="1234567890.";
	var parenmustbe="([{}\"])";
	var varcannotbe=ochars+parenmustbe+nummustbe;
	var match=[0,
		function(e){
			return !isNaN(e);
		},
		function(e){
			if(operators[e]){
				return true;
			}
			return false;
			//return ochars.indexOf(e)!==-1;
		},
		function(e){
			return e.length === 1 && parenmustbe.indexOf(e)!=-1;
		},
		function(e){
			//Assumtions: It will only be ONE character ahead of a valid var.
			if(M.global[e]!==undefined){
				return true;
			}
			
			return (e.length === 1) && (varcannotbe.indexOf(e)==-1);
		}
	];
	window.match = match;
	//TODO: rewrite this in a way that can split variables also
	function split_operators(t){
		if(operators[t]){
			return [t];
		}
		for (var i = t.length - 1; i > 0; i--){
			var a = t.substring(0,i);
			if(operators[a]){
				return [a].concat(split_operators(t.substring(i)));
			}
		}
		throw("Expression '"+t+"' did not contain any operator prefix codes.");
	}
	
	//TODO: this should be secondary_unary
	
	//parse:
	return function (s){
		O(1, "parse");
		var current_type=0;
		var i=0,len=s.length;
		var current_token=s[0];
		current_type=4;
		for(var t=1;t<4;t++){
			if(match[t](current_token)){
				current_type=t;
				break;
			}
		}
		
		//Stack of tokens for the shunting yard algorithm
		var stack=[];
		//Stack of tokens for RPN notation. ('evaluated' to a tree representation)
		var rpn_stack=[];
		
		//The evelauation part of the shunting yard algorithm inside out.
		function next_rpn(token){
			O(1, "next_rpn");
			// While there are input tokens left

			// Read the next token from input.
			//console.log("rpn: ",token);
			// If the token is a value
			if(token.t===types.number || token.t===types.variable){
				// Push it onto the stack.
				//console.log("push: ",token.v, " onto: rpn_stack = ",rpn_stack.clone());
				rpn_stack.push(token.v);
			}
			// Otherwise, 
			else{
				//the token is an operator (operator here includes both operators, and functions).
				// It is known a priori that the operator takes n arguments.
				var n=operators[token.v][2];
				// If there are fewer than n values on the stack
				if(rpn_stack.length<n){
					// (Error) The user has not input sufficient values in the expression.
					throw(new SyntaxError("The "+token.v+" operator requires exactly "+n+" operands, whereas only "+rpn_stack.length+" "+(rpn_stack.length===1?"was":"were")+" supplied."));
				// Else,
				}else{
					// Pop the top n values from the stack.
					var values=rpn_stack.splice(-n);
					// Evaluate the operator, with the values as arguments.
					//var evaled=("("+values[0]+token.v+values[1]+")");
					values.type=token.v;
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
			if (token.t === types.variable) {
				//'Keyword' search: eg. break, if. Stuff like that.
				if (operators[token.v]) {
					token.t = types.operator;
				} else if(token.v==="false"){
					token.v=false;
				} else if(token.v==="true"){
					token.v=true;
				} else if(token.v==="Infinity"){
					token.v=Infinity;
				}
			}
			console.log("token: ", token.v, names[token.t]);
			//Comments from http://en.wikipedia.org/wiki/Shunting-yard_algorithm
			// Read a token.
			// If the token is a number, then add it to the output queue.
			if(token.t==types.number || token.t==types.variable){
				if(token.t==types.number){
					token.v=Number(token.v);
				}
				next_rpn(token);
			}
			// If the token is a function token, then push it onto the stack.
			if(token.t===types.func){
				stack.push(token);
			}
			
			// If the token is a function argument separator (e.g., a comma):
			if(token.t===types.comma){
				// Until the token at the top of the stack is a left parenthesis,
				while(stack[stack.length-1].v!="("){

					// If no left parentheses are encountered,
					if(!stack.length){
						// either the separator was misplaced or parentheses were mismatched.
						throw("either the separator was misplaced or parentheses were mismatched.")
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

			}
			// If the token is an operator
			if(token.t===types.operator){
				//, o1, then:
				var o1=token;
				var o1precedence=precedence(o1.v);
				//var o1associative=associativity(o1.v);
				var o1associative=operators[o1.v][0];
				// ("o2" is assumed to exist)
				var o2;
				// while
				while(

					//there is an operator token, o2, at the top of the stack
					(stack.length && (o2 = stack[stack.length-1]).t===types.operator)
					//and
					&&
				// either
				 (
					(
						//o1 is left-associative
						o1associative==left
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
						o1associative!=left

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

				){
					// pop o2 off the stack, onto the output queue;
					next_rpn(stack.pop());
				}

				// push o1 onto the stack.
				stack.push(o1);
			}
			// If the token is a left parenthesis,
			if(token.v == "("){
				//then push it onto the stack.
				stack.push(token);
			}
			// If the token is a right parenthesis:
			if(token.v == ")"){
				// Until the token at the top of the stack is a left parenthesis,
				while(stack[stack.length-1].v!="("){

					// If the stack runs out without finding a left parenthesis, then
					if(!stack.length){
						//there are mismatched parentheses.
						throw(new SyntaxError(msg.parenMismatch));
					}
					// pop operators off the stack onto the output queue.
					next_rpn(stack.pop());
				}

				// Pop the left parenthesis from the stack, but not onto the output queue.
				if(stack.pop().v!="("){
					throw("Pop the left parenthesis from the stack: Not found!")
				}

				// If the token at the top of the stack is a function token, pop it onto the output queue.
				if(stack.length && stack[stack.length-1].t===types.func){
					next_rpn(stack.pop);
				}
			}

		};
		var op_last=true;
		
		function next_tokens(token) {
			console.log("lot: ", token.v);
			var tokens=[];
			var v=token.v;
			if(token.t===types.paren){
				v=v.replace(/[ \n\t]+/, "");
			}
			var _tokens=
			v
			.split((token.t===types.paren)?"":/[ \n\t]+/);
			if(token.t===types.operator){
				_tokens
				.forEach(function(t) {
					if(t.length){
						tokens=tokens.concat(split_operators(t));
					}
				});
			}else{
				tokens=_tokens;
			}
			
			tokens
			.forEach(function (t) {
				if(t.length) {
					if(token.t!=types.paren){
						if(!op_last && token.t!=types.operator){
							next_token({v:"∘",t:types.operator});
							//throw("No operator before "+t);
						}
						if(token.t==types.operator && !postfix(t)){
							if(op_last && op_last!=")" && unary(t)){
								t=unary(t);
							}
							op_last=true;
						}else{
							op_last=false;
						}
					}else{
						if(t=="(" && (op_last==false||op_last==")")){
							next_token({v:"∘",t:types.operator});
							op_last=t;
						}else if(t=="("){
							op_last=t;
						}else if(t==")"){
							
							op_last=t;
						}
					}
					next_token({v:t,t:token.t});
				}
			});
		}
		window.match=match;
		//Tokenize:
		while(i<len) {
			i++;
			var c;
			if(!(i < len)){
				//Reached the end; use whatever is in the current_token buffer.
				next_tokens({v: current_token, t: current_type});
				current_token = "";
				break;
			}else if ((c=s[i]) === " " || c === "\t" || c === "\n") {
				//whitespace is not removed yet.
				//(It is required for some tokens, e.g. strings, and seperator string tokens)
				current_token += c;
			} else if (match[current_type](current_token + c)) {
				//The next character fits onto the current_token
				current_token += c;
			}else{
				//console.log("change detected at "+s[i]);
				
				//A new token type was reached, push the old one:
				next_tokens({v:current_token,t:current_type});
				
				//move on
				if(current_type === types.operator || current_type === types.paren){
					//console.log("just finished op: ",current_token.s, names[current_type]);
					//console.log("now @ "+c);
					//Just finished an operator.
					//send operator: Wait no, don't send it.
					current_type = 4;
					for(var t = 1; t < 4; t++){
						if(match[t](c)){
							current_type=t;
							break;
						}
					}
					//console.log("just found out that ",c.s," is a "+names[current_type]);


				} else {
					if (match[types.operator](c)) {
					//We've got an operator!

						current_type = types.operator;
						//DO NOT SEND OPERATOR TOKEN YET.

					}else if (match[types.paren](c)) {
						current_type = types.paren;

					} else {
						//Let's assume multiplication
						next_tokens({v:"∘",t:types.operator});
						current_type = types.variable;
						//console.warn("Operator was expected between ", current_token, " and ", c, "( ∘ assumed)");
					}
				}
				current_token=c;
			}
		}
		/*
		if(current_token.length){
			//Unsure what should be happening here.
			console.warn("final token: ",current_token);
		}
		*/


	//Shunting yard algorithm:
	// (The final part that does not read tokens)
	
	// When there are no more tokens to read:

		// While there are still operator tokens in the stack:
		while(stack.length){
			var the_operator;
			// If the operator token on the top of the stack is a parenthesis, then
			if((the_operator=stack.pop()).t===types.paren){
				//there are mismatched parentheses.
				throw("there are mismatched parentheses.");

			}
			//Pop the operator onto the output queue.
			next_rpn(the_operator);

		}
		if(rpn_stack.length!==1){
			console.warn("Stack not the right size! ", rpn_stack);
			//who gives?
			
			return rpn_stack;
		}
		return rpn_stack[0];
		//eturn output.map(function(o){return o.v}).join(" ");
	}

})(language);
//The main javascript-cas object: window.M:
var M = function (expression, context) {
	return p(expression, context);
};
function p(expression, context){
	//TODO?: Apply context?
	return parse(expression);
}
M.Context = function(){
	
};



//BEGIN MATH


Array.prototype.valid=function(){
	if(this.type==="/" && this[1]===0){
		return false;
	}
	return true;
};

var truth=[1,1].setType("=");
Array.prototype.impliedBy=function(context){
	if(this===truth){
		return true;
	}
	if(this.type===","){
		for (var i = this.length - 1; i >= 0; i--){
			if(!this[i].impliedBy(context)){
				return false;
			}
		}
		return true;
	}
	
	if(this.type==="="){
		return false;
	}
	//Sub-statements? Too slow?
	
		for (var i = this.length - 1; i >= 0; i--){
			if(!this[i].impliedBy(context)){
				return false;
			}
		}
		return true;
};
Array.prototype.eval=function(){
	return this.simplify();
};
Array.prototype.Function=function(x){
	
	//DANGER!!!!!!!!!!!
	if(x===undefined){
		return new Function("return "+this.toString());
	}
	return new Function(x,"return "+this.toString());
}






M.toString=function(){
	//Yes, this is necessary
	return "function M() {\n    [awesome code]\n}";
};
M.toString.toString=function(){
	return "function toString() {\n    [native code]\n}";
};

M.toString.toString.toString=M.toString.toString;
window.M = M;
