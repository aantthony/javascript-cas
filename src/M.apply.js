Array.prototype.sub=function(a,b){
	var c=[].setType(this.type);
	if(this.type==="#" && this[1]!=a){
		//TODO: checl this
		return this.clone();
	}else{
		var i,l=this.length;
		for(i=0;i<l;i++){
			c.push(this[i].sub(a,b));
		}
	}
	//TODO: WARNING - DOES NOT SIMPLIFY.
	return c;
};
String.prototype.sub=function(a,b){
	var t = String(this);
	if(t===a){
		return b;
	}
	return t;
};
Number.prototype.sub=I;

Array.prototype.apply=function(o, x, __commuted__){
	console.log("Apply ",o,x," to ",this,this.type);
	if(o==="∘" && this.type==="_"){
		//TODO: check if it is symbolic.
		return M.global[this[0]](x, this[1]);
	}
	if(o==="∘" && this.type==="#"){
		return this[0]
		.sub("x", x)
	}
	if(o === "," && this.type === ","){
		return this.concat([x]).setType(this.type);
	} else if(o === ";" && this.type === ";"){
		return this.concat([x]).setType(this.type);
	} else if(o === ";" && this.type === ","){
		
		//TODO: BUG, assumes ; only has two operands.
		M.assume([(x.type==",")?1:0,1].setType("="));
		return [this,x].setType(";");
	}
	if(x!==undefined && identity(o)===x){
		console.log("identity");
		return this;
	}
	if(x!==undefined && inverse(o,x)===false){
		console.log("identity - inverse");
		return x;
	}
	console.log(5);
	//Distributive law:
	if(this.type === "," && x.type === ","){
		// Vector-Vector operations:
		if(o === "*" || o === "+" || o === "-"){
			for (var i = x.length - 1; i >= 0; i--){
				this[i]=this[i].apply(o,x[i]);
			}
		}else{
			throw("Vector-vector operator: "+ o + "not understood");
		}
		if(o === "*"){
			var sum=0;
			for (var i = this.length - 1; i >= 0; i--){
				sum=sum.apply("+",this[i]);
			}
			return sum;
		}
		return this;
	}else if(distributive(o,this.type)){
		
		console.log("attempting to apply distributve to multiply "+this.toLatex()+" by "+x.toLatex());
		for (var i = this.length - 1; i >= 0; i--){
			
			//console.log(" - multiply ("+o+") the "+this[i].toString()+" factor by "+x);
			this[i]=this[i].apply(o,x);
			//console.log(" X multiply ("+o+") the "+this[i].toString()+" factor by "+x);
			
		}
		return this;
	}
	//DEBUG, the only logical order I can think of
	//is linking numbers, but thats kinda crap.
	if(x!==undefined && typeof x==="number" || typeof x==="boolean"){ //!isNaN(x))
	
	//Associative law:
	if(this.type == o && associative(o)){
		//It can apply itself to ONE and only one
		//of the sub exprs of a.
		var found=false;
		//TODO Which one/order though?
		//TODO: this.length??? OLD CODE??? It should only be 2 except for vectors
		for (var i = this.length - 1; i >= 0; i--){
			if(typeof this[i] == "number" || typeof this[i]=="boolean"){
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
	
	
	//Somtimes commuting will be useless. It is also annoying!
	if(!__commuted__ && this.type==="*") {
		if(o==="/" && x.type === "/"){
			return x.reverse().apply("*",this);
		}
	}
	if(x===undefined){
		return [this].setType(o);
	}
	return [this,x].setType(o);
};
String.prototype.apply=function(o, b, __commuted__){
	
	var t=String(this);
	if(operators[o][2]==1){
		return [t].setType(o);
	}
	
	/*hack for without doing string conversion*/
	var ident=identity(o);
	if(ident===b){
		return t;
	}else if(ident===true && typeof b==="number" && b){
		return t;
	}else if(ident===false && typeof b==="number" && !b){
		return t;
	}
	
	if(inverse(o,b)===false){
		return b;
	}
	if(!__commuted__ && commutative(o)){
		return b.clone().apply(o, t, true);
	}
	//Global functions:
	if(o==="∘" && M.global[t]){
		if(M.global[t].symbolic){
			return M.global[t](b);
		}
		if(typeof b === "number" || typeof b === "boolean"){
			return M.global[t](b);
		}
		
	}
	return [t, b].setType(o);
}


Number.prototype.apply=function(o, b, __commuted__){
	
	if(o==="∘"){
		//∘ commutes with scalars
		if(__commuted__){
			return [b, Number(this)].setType("*");
		}else{
			return b.clone().apply("*", Number(this), true);
		}
	}
	
	
	var a = Number(this);
	//TODO Identity and inverse can be combined if the left operand is included in
	// the calculation?
	if(b){
		var ident=identity(o);
		if(ident===b){
			return a;
		}else if(ident===true && this){
			return b;
		}else if(ident===false && !this){
			return b;
		}
	}
	
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
				if(b===0){
					throw("Division by zero is not defined.");
				}
				return a/b;
			case "-":
				return a-b;
			case "√":
				//TODO: make sure ^(1/2) and this are equiv.
				if(a<0){
					return Math.pow(-a,0.5).apply("*","i");
				}
				return Math.pow(a, 0.5);
			case "^":
				return Math.pow(a,b);
			case "===":
				return a===b;
			case "==":
				return a==b;
			case "≠":
				return a!=b;
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
			case "∨":
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
			case "¬":
				return !a;
			case "~":
				return ~a;
			case "±":
				return [a+b,a-b].setType(",");
			case "@±":
				return [a,-a].setType(",");
			case ";":
			case ",":
				//TODO: fix this
				if(b.type === o){
					return b.push(a);
				}
				return [a,b].setType(o);
			case "!":
				return M.Context.prototype.factorial(a);
			case "=":
				if(a==b){
					return truth;
				}
				window.a=a;
				window.b=b;
				throw(new Error("The statement is always false: "+a+" ≠ "+b))
				throw(new ReferenceError("Left side of assignment is not a reference."))
			default:
				if(b===undefined){
					return [a].setType(o);
				}
				return [a,b].setType(o);
				//TODO: maybe this should be thrown
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
		M.assume([b,0].setType("≠"));
		return 0;
		return [["δ",b].setType("∘")].setType("@±");
	}
	return [Number(this), b].setType(o);
};

Boolean.prototype.apply=Number.prototype.apply;

