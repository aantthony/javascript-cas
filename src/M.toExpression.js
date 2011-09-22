function jsExprForOperator(o,a,b){ //operands a,b
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
		case "_":
			return a+o+b;
		case "~":
			return o+a;
		case "^":
			return "Math.pow("+a+","+b+")";
		case "∘": // This could mean scalar multiplication. THe variables need to be typed, and this function should return a type
			return a+"("+b+")";
		case "#":
			return "function(x){return "+a+"}";
		case "√":
			return "Math.sqrt("+a+")";
		case "!":
			return "factorial("+a+")";
		default:
			throw("Could not translate operator: '"+o+"' into javscript!");
	}
}


Array.prototype.toExpression=function(type,__matrix__){
	//Infix
	/*
	
	*/
	return jsExprForOperator.apply(this,
		[this.type].concat(
			this.map(function(x){
				return x.toExpression(type);
			})
		)
	);
};
Number.prototype.toExpression=function(){
	if(Number(this)===Infinity){
		return "Infinity";
	}
	return this.toString().replace(/e([\+\-])([\d\.]+)/,"\\cdot 10^{$2}");
};

String.prototype.toExpression=function(){
	return String(this);
};