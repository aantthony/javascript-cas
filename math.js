/*! 
 *  Math JavaScript Library v2.0.0
 *  https://github.com/aantthony/javascript-cas
 *  
 *  Copyright 2011 Anthony Foster. All rights reserved.
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

/*
TODO: x*0 = 0
I becomes buggy

*/

(function (window, undefined) {
	"use strict";
var navigator = window.navigator,
	document = window.document,
	_M = window.M;
var M = (function (){

var msg={
	"latexParse":"Unable to parse LaTeX string",
	"parenMismatch":"There are mismatched parentheses"
};

//Information for the shunting parser to use:
var languages = {};	
var language = "javascript+math";
var left,right;
var L = left = 0;
var R = right = 1;
/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/


languages[language] = [
	[";",L,1],			/*L / R makes no difference???!??!? */
	[","],
	["function",R,2],	/*anonymous function*/
	[["=","+=","-=","*=","/=","%=","&=","^=","|="],R],
	[["?",":"],R,2],
	[["||"]],
	[["&&"]],
	[["|"]],
	[["^"]],//XOR
	[["&"]],
	[["==","!=","!==","==="]],
	[["<","<=",">",">="],L],
	[[">>","<<"]],
	["±",R,2],
	[["+","-"]],
	[["@+","@-","@±"],R,1], //unary plus/minus
	[["*","/","%"]],
	["∘",R,2],
	[["**"]],//e**x
	[["!","~"],R,1],
	[["++","++",".","->"],L,1],
	[["::"]],
	["var",R,1],
	["break",R,0],
	["throw",R,1],
	["'",L,1]
];

var operators={};
function precedence(v){
	if(!operators[v]){
		throw("Precedence of "+v+" not known!");
	}
	return operators[v][1];
}
var p_internal = (function (language) {
	//Begin p_internal building space.
	//This context will be accessible to p_internal()
	var types = {
		number: 1,
		operator: 2,
		paren: 3,
		variable: 4
	};
	
	var names = ["none","num","op","paren","var"];

	var op_precedence=0;
	function op(v,assoc,arg_c){
		//Register an operator
		var memsave=[assoc,op_precedence++,arg_c];
		if(typeof v==="object") {
			for(var i=0;i<v.length;i++){
				operators[v[i]]=memsave;
			}
		}else{
			operators[v]=memsave;
		}
	}
	languages[language||"jsMath"].forEach(function(o) {
		op(o[0],o[1]||L,(o[2]===undefined)?2:o[2]);
	});

	//Operator characters
	//TODO: calculate programmatically
	
	var ochars=":>-.+~!^%/*<=&|?,;±∘'";
	
	//TODO: Allow 1e+2 format
	var nummustbe="1234567890.";
	var parenmustbe="([{}\"])";
	var varcannotbe=ochars+parenmustbe+nummustbe;
	var regex=[0,
		function(e){return nummustbe.indexOf(e)!==-1;},
		function(e){return ochars.indexOf(e)!==-1;},
		function(e){return parenmustbe.indexOf(e)!=-1;},
		function(e){return varcannotbe.indexOf(e)==-1;}
	];

	
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
	function postfix(o){
		var op=operators[o];
		return op[0]==0 && op[2]==1;
	}
	
	//TODO: this should be secondary_unary
	function unary(o){
		var unary_secondarys=["+","-","±"];
		return (unary_secondarys.indexOf(o)!=-1)?("@"+o):false;
	}
	window.operators=operators;
	
	//p_internal:
	return function (s){
		//O(n)
		var current_type=0;
		var i=0,len=s.length;
		var current_token=s[0];
		current_type=4;
		for(var t=1;t<4;t++){
			if(regex[t](current_token)){
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
			// While there are input tokens left

			// Read the next token from input.
			console.log("rpn: ",token);
			// If the token is a value
			if(token.t===types.number || token.t===types.variable){
				// Push it onto the stack.
				console.log("push: ",token.v, " onto: rpn_stack = ",rpn_stack.clone());
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
					console.log("values: ",values.clone());
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
			//console.log("token: ", token.v, names[token.t]);
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
			
			var tokens=[],
				_tokens=
			token.v
			.split(token.t===types.paren?"":/[ \n\t]+/);
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
			} else if (regex[current_type](c)) {
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
						if(regex[t](c)){
							current_type=t;
							break;
						}
					}
					//console.log("just found out that ",c.s," is a "+names[current_type]);


				} else {
					if (regex[types.operator](c)) {
					//We've got an operator!

						current_type = types.operator;
						//DO NOT SEND OPERATOR TOKEN YET.

					}else if (regex[types.paren](c)) {
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
	return p_internal(expression);
}
M.Context = function(){
	
};
M.Context.prototype.reset=function(){
	for(var i in this){
		if(this.hasOwnProperty(i)){
			delete this[i];
		}
	}
	return this;
};
//Like jquery noConflict
M.noConflict = function() {
	window.M=_M;
	return M;
};
//Latex parser -> javascript+math
M.latex={
	"stringify":function(){},
	"parse":function(s){
		// O(n * k), n=string length, k = amount of '\frac's
		//Currently only parses \frac
		var i,l=s.length
		//indexOf is BAD!!! It is fine only when we only have one type of \expr
		
		while((i = s.indexOf("\\frac"))!=-1){
			var n,good=false;
			var deep=0;
			for(n = i+5;n<l ;n++){
				if(s[n]=="{"){
					deep++;
				} else if(s[n]=="}"){	
					deep--;
					if(!deep){
						good=true;
						break;
					}
				}
			}
			if(!good){
				throw(new SyntaxError(msg.latexParse));
			}
			good=false;
			
			if(s[n+1]!="{"){
				throw(new SyntaxError("Unexpected '"+s[n+1]+"' between \\frac operands"))
			}
			
			var i2=n+1;
			var n2;
			for(n2 = i2;n2<l ;n2++){
				if(s[n2]=="{"){
					deep++;
				} else if(s[n2]=="}"){
					
					deep--;
					if(!deep){
						good=true;
						break;
					}else{
						
					}
				}
			}
			if(!good){
				throw(new SyntaxError(msg.latexParse));
			}
			s=s.split("");
			s[i+5]="(";
			s[n]=")";
			s[i2]="(";
			s[n2]=")";
			s.splice(i2,0,"/");
			s.splice(i,5);
			s=s.join("");
			
		}
		var latexexprs = {
			"cdot":"*",
			"vee":"||",
			"wedge":"&&",
			"neg":"!",
			"left":"",
			"right":"",
			"pm":"±",
			"circ":"∘",
			"infty":"Infinity"
		};
		s=s.replace(/\\([a-z]+)/g,function(u,x){
			var s=latexexprs[x];
			return (s!=undefined)?s:x;
		});
		
		
		//Naughty:
		s=s.replace(/[\[\{]/g,"(");
		s=s.replace(/[\]\}]/g,")");
		
		s=s.replace(/\\:/g," ");
		s=s.replace(/\\/g,"");
		s=s.replace(/\^/g,"**");
		return s;
	}
};
M.global = {};
//Array prototype extensions:
var _Array_prototype_toString=Array.prototype.toString;
Array.prototype.toString=function(){
	console.error("Inefficency",this);
	if(!this.type){
		return _Array_prototype_toString.apply(this,arguments);
	}
	//Infix
	if(this.length>=2){
		var self=this;
		return this.map(function(t){
			var a = t.toString();
			if(t.requiresParentheses(self.type)){
				a="("+a+")";
			}
			return a;
		}).join(this.type);
	}
	//Postfix
	if(this.length==1){
		return this[0].toString()+this.type;
	}
	
	//Prefix
	if(false && this.length==2){
		return this[0].toString()+this.type+this[1].toString();
	}
	
};
Array.prototype.toString=null;
function latexExprForOperator(o){
	var os={
		"*":"\\cdot ",
		"||":"\\vee ",
		"&&":"\\wedge ",
		"±":"\\pm ",
		"∘":"\\circ "
	};
	return os[o]||o;
}
var latexFuncs="log|exp|asinh|acosh|atanh|sinh|sech|cosh|coth|tanh|sin|cos|tan|cot|sec|exp|log".split("|");
Array.prototype.toLatex=function(){
	//Infix
	if(this.length>=2){
		if(this.type==="/"){
			
			return "\\frac{"+this[0].toLatex()+"}{"+this[1].toLatex()+"}";
		} else if(this.type==="**"){
			
			var a = this[0].toLatex();
			if(this[0].requiresParentheses(this.type)){
				a="\\left("+a+"\\right)";
			}
			return a+"^{"+this[1].toLatex()+"}";
		} else if(this.type==="∘"){
			var a = this[0].toLatex();
			
			if(latexFuncs.indexOf(a)!==-1){
				a="\\"+a;
			}else if(this[0].requiresParentheses(this.type)){
				a="\\left("+a+"\\right)";
			}
			
			return a+"\\left("+this[1].toLatex()+"\\right)";
		} else {
			var self=this;
			return this.map(function(t){
				var a = t.toLatex();
				if(t.requiresParentheses(self.type)){
					a="\\left("+a+"\\right)";
				}
				return a;
			}).join(latexExprForOperator(this.type));
			return a+this.type+b;
		}
	}
	//Postfix/Prefix Unary operators
	if(this.length==1){
		var a = this[0].toLatex();
		if(this[0].requiresParentheses(this.type)){
			a="\\left("+a+"\\right)";
		}
		if(this.type[0]=="@"){
			//Prefix
			return this.type.substring(1)+a;
		}
		return a+this.type;
	}
	
	//Prefix
	if(false && this.length==2){
		return this[0].toLatex()+this.type+this[1].toLatex();
	}
	
};
Number.prototype.toLatex=function(){
	if(Number(this)===Infinity){
		return "\\infty";
	}
	return this.toString();
};

Array.prototype.setType=function(type){
	this.type=type;
	return this;
};
Array.prototype.clone=function(){
	return Array.prototype.slice.apply(this).setType(this.type);
};


//BEGIN MATH


//n-ary operators: Good for factorising?? For converting +(1 +(2 3)) to +(1 2 3)
function associative(o){
	var able=["*","+","=","∘"];
	//Is this a good idea????
	if(able.indexOf(o)!=-1){
		return true;
	}
	return false;
}

//Commute?
function commutative(o){
	return ["*","+","="].indexOf(o)!=-1;
}

//Is the operator o left-distributive over operator p?
function distributive(o, p){
	var os={
		"*":["+","-",/*,"||" messy*/],
		"/":["+","-"],
		"cross-product":"+",
		"matrix-multiplication":"+",
		"set-union":"intersect",
		"||":"&&",
		"conjugtion":["disjunction", "exclusive disjunction"],
		"max":"min",
		"gcd":"lcm",
		"+":["max","min",","]
	};
	//TODO: (if better/faster): use fact (?) that (* distributes over '+' (which distributes over ',')) => (* distributes over ',')
	if(os[o]){
		if(os[o]===p || (os[o].indexOf && os[o].indexOf(p)!=-1)){
			return true;
		}
	}
	return false;
}

function identity(o){
	var os={
		"+":0,
		"*":1,
		"^":0,
		
		"/":1, //Implied by inverse?()
		"-":0,
		"&&":true,
		"||":false,
		
		"%":Infinity, //Bounds of real numbers
		"**":1,
		"matrix multiplication":I
		
		
	};
	if(os[o]!==undefined){
		return os[o];
	}
	return undefined;
}
function inverse(o,b){
	var os={
		"+":"-",
		"*":"/",
		"^":"^",
		
		"&&":["||","!","&&","$0"],
		
		"**":["^","/"],
		"∘":["∘","/"],//DEBUG: check this junk
		"matrix multiplication":I
		
		
	};
	if(os[o]){
		var c=b.clone();
		if(typeof os[o]==="object"){
			for (var i = os[o].length - 1; i > 0; i--){
				c=[identity(os[o][i]),c].setType(os[o][i]);
				if(!c.valid()){
					return false;
				}
			};	
		}
		c=[undefined,c].setType(os[o]);
		
		if(!c.valid()){
			return false;
		}
		
		return c;
		
		
	}
	
}
Array.prototype.valid=function(){
	if(this.type==="/" && this[1]===0){
		return false;
	}
	return true;
};
Array.prototype.requiresParentheses=function(o){
	return precedence(o)>precedence(this.type);
};

window.distributive=distributive;
window.inverse=inverse;
window.identity=identity;
Array.prototype.apply=function(o, x){
	if(identity(o)===x){
		return this;
	}
	if(inverse(o,x)===false){
		return x;
	}
	//Distributive law:
	if(distributive(o,this.type)){
		
		console.log("attempting to apply distributve to multiply "+this.toLatex()+" by "+x.toLatex());
		for (var i = this.length - 1; i >= 0; i--){
			
			//console.log(" - multiply ("+o+") the "+this[i].toString()+" factor by "+x);
			this[i]=this[i].apply(o,x);
			//console.log(" X multiply ("+o+") the "+this[i].toString()+" factor by "+x);
			
		};
		return this;
	}
	//DEBUG, the only logical order I can think of
	//is linking numbers, but thats kinda crap.
	if(typeof x==="number" || typeof x==="boolean"){ //!isNaN(x))
	
	//Associative law:
	if(this.type == o && associative(o)){
		//It can apply itself to ONE and only one
		//of the sub exprs of a.
		var found=false;
		//TODO Which one/order though?
		for (var i = this.length - 1; i >= 0; i--){
			if(!isNaN(this[i])){
				this[i]=this[i].apply(o,x);
				found=true;
				break;
			}
		}
		if(found){
			return this;
		}
	}
	}
	return [this,x].setType(o);
};
String.prototype.apply=function(o, b, __commuted__){
	
	if(identity(o)===b){
		return String(this);
	}
	if(inverse(o,b)===false){
		return b;
	}
	if(!__commuted__ && commutative(o)){
		return b.clone().apply(o, this, true);
	}
	return [String(this), b].setType(o);
}
var truth=[1,1].setType("=");
Number.prototype.apply=function(o, b, __commuted__){
	
	
	if(o==="∘"){
		//∘ commutes with scalars
		if(__commuted__){
			return [b, Number(this)].setType("*");
		}else{
			return b.clone().apply("*", Number(this), true);
		}
	}
	
	//TODO Identity and inverse can be combined if the left operand is included in
	// the calculation?
	
	if(b&& identity(o)===b){
		return Number(this);
	}
	var a = Number(this);
	if(b===undefined || (typeof b==="number" || typeof b==="boolean")){ // !isNaN(b)
		switch(o){
			case "+":
				return a+b;
			case "@+":
				return a;
			case "@-":
				return -a;
			case "*":
				return a*b;
			case "/":
				return a/b;
			case "-":
				return a-b;
			case "**":
				return Math.pow(a,b);
			case "===":
				return a===b;
			case "==":
				return a==b;
			case ">":
				return a>b;
			case "<":
				return a<b;
			case ">=":
				return a>=b;
			case "<=":
				return a<=b;
			case "&":
				return a&b;
			case "^":
				return a^b;
			case "||":
				return a||b;
			case "|":
				return a|b;
			case "%":
				return a%b;
			case "&&":
				return a&&b;
			case "∘":
				//assume multiplication
				return a*b;
			case "!":
				return !a;
			case "~":
				return ~a;
			case "±":
				return [a+b,a-b].setType(",");
			case "@±":
				return [a,-a].setType(",");
			case ",":
				//TODO: fix this
				if(a.type===","){
					return a.push(b);
				}else if(b.type === ","){
					return b.push(a);
				}
				return [a,b].setType(o);
				
			case "=":
				if(a==b){
					return truth;
				}
				window.a=a;
				window.b=b;
				throw(new Error("The statement is always false: "+a+" ≠ "+b))
				throw(new ReferenceError("Left side of assignment is not a reference."))
			default:
				throw("Operator '"+o+"' is not yet numerically implemented.");	
		}
	}
	if(commutative(o)){
		
		if(identity(o)==Number(this)){
			return b;
		}
		if(__commuted__){
			return [b, Number(this)].setType(o);
		}else{
			return b.clone().apply(o, Number(this), true);
		}
	}
	//Messy hack: null factor law:
	if(a===0 && o=="/"){
		return [0,["δ",b].setType("∘")].setType("±");
		return [[b,0].setType("=="),NaN].setType("*");
	}
	return [Number(this), b].setType(o);
};
Boolean.prototype.apply=Number.prototype.apply;
Array.prototype.simplify=function(){
	if(this.length===1){
		var a = this[0].simplify();
		
		return a.apply(this.type);
	}
	else if(this.length===2){
		var a = this[0].simplify();
		var b = this[1].simplify();
		
		//In place?
		return a.apply(this.type, b);
		/*
		//The NaN junk below is kind of bad. It should carry through NaNs.
		// Ie., 1+2+3....+x + 11 + 12 + 13 + ... = 
		//      6 + x + 11 + 12 + 13 + ... with the code below. But we want 
		// x+ (6+11+12+13+...),
		// and it may be better done without the intermediate step via
		// x+(1+2+3...)+11+12+13... (which would be bringing the 1+2+3... up the expr tree) 
		if(!isNaN(a) && !isNaN(b)){
			
			a=Number(a);
			b=Number(b);
			
			//BAD: the following code may destory information due to floating point error
			// fractions should remain intact?
			switch(this.type){
				case "+":
					return a+b;
				case "*":
					return a*b;
				case "/":
					return a/b;
				case "-":
					return a-b;
				case "**":
					return Math.pow(a,b);
				case "===":
					return a===b;
				case "==":
					return a==b;
				case ">":
					return a>b;
				case "<":
					return a<b;
				case ">=":
					return a>=b;
				case "<=":
					return a<=b;
				case "&":
					return a&b;
				case "^":
					return a^b;
				case "||":
					return a||b;
				case "|":
					return a|b;
				case "%":
					return a%b;
				case "&&":
					return a&&b;
				case "=":
					throw(new ReferenceError("Left side of assignment is not a reference."))
				default:
					throw("Operator '"+this.type+"' is not yet numerically implemented.");
					
			}
		}else if(!isNaN(a)) {
			switch(this.type){
				case "&&":
					return a?b:false;
				case "||":
					return true;
				case "^":
					return a?!b:b;
				default:
					//Commute?
					return [a,b].setType(this.type);
					break;
				
			}
		}else if(!isNaN(b)) {
			switch(this.type){
				case "&&":
					return b?a:false;
				case "||":
					return true;
				case "^":
					return b?!a:a;
				default:
					//Commute?
					return [a,b].setType(this.type);
					break;
				
			}
		}else{
			return [a,b].setType(this.type);
		}
		*/
	}
};
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


//END MATH
function I(){
	return this.constructor(this);
}
function _false(){
	return false;
}
function _true(){
	return true;
}
Number.prototype.eval=
Number.prototype.simplify=
String.prototype.eval=
String.prototype.simplify=
Boolean.prototype.simplify=
String.prototype.toLatex=
Boolean.prototype.toLatex=
Number.prototype.clone=
Boolean.prototype.clone=
String.prototype.clone=
I;
Number.prototype.requiresParentheses=
String.prototype.requiresParentheses=
Boolean.prototype.requiresParentheses=
_false;// Or should it be true for strings, parens = ", and "
Number.prototype.impliedBy=
String.prototype.impliedBy=
Boolean.prototype.impliedBy=
_true;

if(Array.prototype.toString){
	Array.prototype.toString.toString=function(){
		//Hide our hacks!
		return "function toString() {\n    [native code]\n}";
	};
}

return M;
})();


M.toString=function(){
	//Yes, this is necessary
	return "function M() {\n    [awesome code]\n}";
};
M.toString.toString=function(){
	return "function toString() {\n    [native code]\n}";
};

M.toString.toString.toString=M.toString.toString;

window.M = M;

/*
var scripts = document.getElementsByTagName("script"),
	i=0,
	len=scripts.length,
	source;
for(; i<len; i++){
	source=document.getElementsByTagName("script")[i];
	if(source.firstChild && source.firstChild.nodeValue){
		if(source.type==="text/javascript+math"){
			M(source.firstChild.nodeValue, M.global).eval();
		}
	}
}
*/

})(window);
