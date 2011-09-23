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
			case "∘": // This could mean scalar multiplication. THe variables need to be typed, and this function should return a type
			return {s:a.s+"("+b.s+")",t:types.number};
			case "#":
			return {s:"function(x){return "+a.s+"}", t:types.variable};//should really be a "function type"
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
	//TODO: this won't work for numbers that result in a string like 3e+12
	return {s:this.toString(),t:types.number};
};

String.prototype.toTypedExpression=function(){
	return {s:String(this),t:types.variable};
};

//TODO: make the following work for latex because it is much neater.
Object.prototype.toExpression=function(language){
	return this.toTypedExpression(language).s;
}