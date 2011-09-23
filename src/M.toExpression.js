var exportLanguages={
	"text/javascript": function (o,a,b){ //operands a,b
		switch(o){
			case "+":
			case "-": // TODO: this depends on context, it may be a prefix unary
			case "/":
			case "*":
			case "?":
			case ":":
			case ",":
			case "&&":
			case "==":
			case "<":
			case ">":
			case "<=":
			case ">=":
			case "!==":
			case "====":
			case ">>":
			case "<<":
			case "&":
			case "%":
			return {s:a.s+o+b.s, t: types.number};
			case "_":
			if(a.t === types.variable && (b.t === types.variable || b.t == types.number)){
				return {s:a.s+o+b.s, t: types.variable};
			}else{
				throw("Operator '_' does not exist in javaScript for those types.");
			}
			case "~":
			return o+a.s;
			case "@-":
			case "@+":
			return {s:o.substring(1)+a.s,t:types.number};
			case "^":
			return {s:"Math.pow("+a.s+","+b.s+")",t:types.number};
			case "∘":
			if(a.t===types.function){
				return {s:a.s+"("+b.s+")",t:types.number};
			}else{
				return {s:a.s+"("+b.s+")",t:types.number};
			}
			case "#":
			return {s:"function(x){return "+a.s+"}", t:types.function};
			case "√":
			return {s:"Math.sqrt("+a.s+")",t:types.number};
			case "!":
			return {s:"factorial("+a.s+")",t:types.number};
			default:
			throw("Could not translate operator: '"+o+"' into javscript!");
		}
	}
};


Array.prototype.toTypedExpression=function(language,__matrix__){
	//Infix
	/*
	
	*/
	return exportLanguages[language].apply(this,
		[this.type].concat(
			this.map(function(x){
				return x.toTypedExpression(language);
			})
		)
	);
};
Number.prototype.toTypedExpression=function(){
	if(Number(this)===Infinity){
		return "Infinity";
	}
	//Note: this does work for numbers that result in a string like 3e+12, but it won't work for exporting to latex
	return {s:this.toString(),t:types.number};
};

String.prototype.toTypedExpression=function(){
	var s = String(this);
	var t=types.variable;
	if(M.global[s]){
		//and check type of that expression...
	}
	if(Math[s]){
		s="Math."+s;
		if(typeof Math[s] === "function"){
			t=types.function;
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
	return this.toTypedExpression(language).s;
}