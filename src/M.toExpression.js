
var glsl={
	"void":1,
	"vec3":2,
	"bool":6,/*types.bool*/
	"int":3,
	"float":4,
	"vec2":5,
	"vec4":7,
	"mat2":10,
	"mat3":11,
	"mat4":12,
	"function":20
};

var exportLanguages={
	"text/javascript": function (o,a,b){
		function _(x){
			return "("+x+")";
		}
		
		var p = precedence(o);
		function S_(x){
			if(x.p<=p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case "=":
				return {s:S_(a)+o+S_(b), t: types.assignment, p: p};
			case "&&":
			case "<":
			case ">":
			case ">=":
			case "<=":
			case "!==":
			case "!=":
			case "==":
			case "===":
			
				return {s:S_(a)+o+S_(b), t: types.bool, p: p};
			
			case "+":
			case "-":
			case "/":
			case "*":
			case "?":
			case ":":
			case ",":
			case ">>":
			case "<<":
			case "&":
			case "%":
				return {s:S_(a)+o+S_(b), t: types.number, p: p};
			case "_":
				if(a.t === types.variable && (b.t === types.variable || b.t == types.number)){
					return {s:S_(a)+o+S_(b), t: types.variable, p: p};
				}else{
					throw("Operator '_' does not exist in javaScript for those types.");
				}
			case "~":
				return {s:o+S_(a),t:types.number, p: p};
			case "@-":
			case "@+":
				return {s:o.substring(1)+S_(a),t:types.number, p: p};
			case "^":
				return {s:"Math.pow("+a.s+","+b.s+")",t:types.number, p: p};
			case "∘":
				if(a.t===types.function){
					return {s:a.s+"("+b.s+")",t:types.number, p: p};
				}else{
					//this is ugly:
					p=precedence("*");
					return {s:S_(a)+"*"+S_(b),t:types.number, p: p};
				}
			case "#":
				//p=precedence("return ");
				return {s:"function(x){return "+a.s+"}", t:types.function, p: p};
			case "√":
				return {s:"Math.sqrt("+a.s+")",t:types.number, p: p};
			case "!":
				return {s:"factorial("+a.s+")",t:types.number, p: p};
			default:
				throw("Could not translate operator: '"+o+"' into javscript!");
		}
	},
	"x-shader/x-fragment":function(o,a,b){
		//http://www.opengl.org/registry/doc/GLSLangSpec.Full.1.20.8.pdf
		function _(x){
			return "("+x+")";
		}
		var p = precedence(o);
		function S_(x){
			if(x.p<=p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case "&&":
			case "||":
				if(a.t === b.t && b.t === glsl.bool){
					return {s:S_(a)+o+S_(b), t: glsl.bool, p: p};
				}
				throw("Operands must also be boolean values");
			case "==":
			case "<":
			case ">":
			case "<=":
			case ">=":
			case "!=":
				if(a.t !== b.t){
					throw("The equality operators and assignment operator are only allowed if the two operands are same size and type.");
				}
				return {s:S_(a)+o+S_(b), t: glsl.bool, p: p};
			
			case ":":
				if(a.t !== b.t){
					throw("Switching groups must be the same type");
				}
				
				return {s:S_(a)+o+S_(b), t: b.t, p: p};
			case "?":
				if(a.t !== glsl.bool){
					throw("Must be boolean type");
				}
				return {s:S_(a)+o+S_(b), t: b.t, p: p};
				
			case "+":
			case "-":
			case ",":
				if(a.t !== b.t){
					throw("Types don't match: "+a.t+", "+b.t);
				}
				return {s:S_(a)+o+S_(b), t: glsl.float, p: p};
			case "*":
			case "/":
				return {s:S_(a)+o+S_(b), t: glsl.float, p: p};
			case "_":
				/*if(a.t === types.variable && (b.t === types.variable || b.t == types.number)){
					return {s:S_(a)+o+S_(b), t: glsl.float, p: p};
				}else{
					throw("Operator '_' does not exist in javaScript for those types.");
				}*/
				throw("Write this later.");
			case "~":
				return {s:o+S_(a),t:types.number, p: p};
			case "@-":
			case "@+":
				return {s:o.substring(1)+S_(a),t:glsl.float, p: p};
			case "^":
				return {s:"pow("+a.s+","+b.s+")",t:glsl.float, p: p};
			case "∘":
				if(a.t===glsl.function){
					return {s:a.s+"("+b.s+")",t:glsl.float, p: p};
				}else{
					//this is ugly:
					p=precedence("*");
					return {s:S_(a)+"*"+S_(b),t:glsl.float, p: p};
				}
			case "#":
				throw("Anonymous functions not supported.");
			case "√":
				return {s:"sqrt("+a.s+")",t:glsl.float, p: p};
			case "!":
				//requirements....
				return {s:"factorial("+a.s+")",t:glsl.float, p: p};
			case "%":
				return {s: "mod("+a.s+","+b.s+")",t:glsl.float, p:p};
			case "&":
			case "|":
			//case "%":
			case "~":
			case ">>":
			case "<<":
				throw("Reserved");
			default:
				throw("Could not translate operator: '"+o+"' into javscript!");
		}
	},
	"text/latex":function(o,a,b){
		function _(x){
			return "\\left("+x+"\\right)";
		}
		var p = precedence(o);
		function S_(x){
			if(x.p<=p){
				return _(x.s);
			}
			return x.s;
		}
		switch(o){
			case "/":
				return {s:"\\frac{"+a.s+"}{"+b.s+"}",t:types.number, p: p};
			case "^":
			case "_":
				return {s:S_(a)+o+"{"+b.s+"}",t:types.variable, p: p};
			case "∘":
				return {s:S_(a)+_(b.s),t:types.number, p: p};
			case "√":
				return {s:"\\sqrt{"+a.s+"}",t:types.number, p: p};
			case "#":
				return {s:o+_(a.s),t:types.function};
			case ",":
				return {
					s: "\\left("+Array.prototype.slice.apply(arguments,[1]).map(
						S_
					).join(o)+"\\right)",
					t: types.vector,
					p: p
				};
		}
		if(o[0]=="@"){
			return {s:o[1]+S_(a),t:types.number, p: p};
		}
		if(postfix(o)){
			return {s:S_(a)+o,t:types.number, t:types.number, p: p};
		}
		var self=this;
		var os={
				"*":"\\cdot ",
				"∨":"\\vee ",
				"&&":"\\wedge ",
				"±":"\\pm ",
				"∘":"\\circ "
		};
		return {
			s: Array.prototype.slice.apply(arguments,[1]).map(
				S_
			).join(os[o] || o),
			t: types.number,
			p: p
		};
		
		/*
		
		var latexFuncs="log|exp|asinh|acosh|atanh|sinh|sech|cosh|coth|tanh|sin|cos|tan|cot|sec|exp|log".split("|");

		function latexExprForOperator(o){
			var os={
				"*":"\\cdot ",
				"∨":"\\vee ",
				"&&":"\\wedge ",
				"±":"\\pm ",
				"∘":"\\circ "
			};
			return os[o]||o;
		}


		Array.prototype.toLatex=function(__matrix__){
			//Infix
			if(this.length>=2){
				if(this.type==="/"){

					return "\\frac{"+this[0].toLatex()+"}{"+this[1].toLatex()+"}";
				} else if(this.type==="^" || this.type ==="_"){

					var a = this[0].toLatex();
					if(this[0].requiresParentheses(this.type)){
						a="\\left("+a+"\\right)";
					}
					return a+this.type+"{"+this[1].toLatex()+"}";
				} else if(this.type==="∘"){
					var a = this[0].toLatex();

					if(latexFuncs.indexOf(a)!==-1){
						a="\\"+a;
					}else if(this[0].requiresParentheses(this.type)){
						a="\\left("+a+"\\right)";
					}

					return a+"\\left("+this[1].toLatex()+"\\right)";
				} else if(this.type==="," && __matrix__){
					var self=this;
					return this.map(function(t){
						var a = t.toLatex();
						if(t.requiresParentheses(self.type)){
							a="\\left("+a+"\\right)";
						}
						return a;
					}).join(latexExprForOperator("\\:"));
				} else if(this.type===";" && false){

					var self=this;
					return "\\begin{matrix}"+this.map(function(t){
						var a = t.toLatex(true);
						if(t.requiresParentheses(self.type)){
							a="\\left("+a+"\\right)";
						}
						return a;
					}).join("\\\\")+"\\end{matrix}";

				} else {
					var self=this;
					return this.map(function(t){
						var a = t.toLatex();
						if(t.requiresParentheses(self.type)){
							a="\\left("+a+"\\right)";
						}
						return a;
					}).join(latexExprForOperator(this.type));
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
				} else if(this.type==="√"){
					return "\\sqrt{"+this[0].toLatex()+"}";
				}
				if(postfix(this.type)){
					return a+this.type;
				}
				return this.type+a;
			}

			//Prefix
			if(false && this.length==2){
				return this[0].toLatex()+this.type+this[1].toLatex();
			}

		};

		*/
		
	}
};


Array.prototype.toTypedExpression=function(language, context){
	return exportLanguages[language].apply(this,
		[this.type].concat(
			this.map(function(x){
				return x.toTypedExpression(language, context);
			})
		)
	);
};
/*
Number.prototype.toLatex=function(){
	if(Number(this)===Infinity){
		return "\\infty";
	}
	return this.toString().replace(/e([\+\-])([\d\.]+)/,"\\cdot 10^{$2}");
};*/
Number.prototype.toTypedExpression=function(language){
	if(language === "text/javascript"){
		if(Number(this) === Infinity){
			return "Infinity";
		}
		//Note: this does work for numbers that result in a string like 3e+12, but it won't work for exporting to latex
		return {s:this.toString(),t:types.number};
	}else if(language==="x-shader/x-fragment"){
		var num=this.toExponential();
		if(num.indexOf(".")===-1){
			num=num.replace("e",".e");
		}
		return {s:num,t:glsl.float};
	}
	
	if(Number(this)===Infinity){
		return "\\infty";
	}
	return {s:this.toString().replace(/e([\+\-])([\d\.]+)/,"\\cdot 10^{$2}"),t:types.number};
};
/*
String.prototype.toLatex=function(){
	var s = String(this);
	if((s.length>1) || (latexVars.indexOf(s)!=-1)){
		return "\\"+s;
	}
	return s;
};

*/

String.prototype.toTypedExpression=function(language){
	var s = String(this);
	var t=types.variable;
	if(language==="text/javascript"){
		if(M.global[s]){
			//and check type of that expression...
		}
		if(Math[s]){
			s="Math."+s;
			t=types.function;
		}
	}else if(language==="x-shader/x-fragment"){
		t=glsl.float;
		if(Math[s]){
			t=glsl.function;
		}
	}else{
		//latex
		if(s.length>1){
			s="\\"+s;
		}
	}
	
	return {s:s,t:t};
};

//TODO: make the following work for latex because it is much neater.
Function.prototype.toExpression=
String.prototype.toExpression=
Array.prototype.toExpression=
Number.prototype.toExpression=
function(language){
	return this.toTypedExpression(language||"text/latex").s;
}


