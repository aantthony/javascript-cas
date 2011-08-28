var latexVars="Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|lLambda|lambda|delta|sigma|sum".split("|");


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
Number.prototype.toLatex=function(){
	if(Number(this)===Infinity){
		return "\\infty";
	}
	return this.toString().replace(/e([\+\-])([\d\.]+)/,"\\cdot 10^{$2}");
};

String.prototype.toLatex=function(){
	var s = String(this);
	if(latexVars.indexOf(s)!=-1){
		return "\\"+s;
	}
	return s;
};