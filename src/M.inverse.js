
String.prototype.root=function(x){
	if(String(this)===x){
		return new Set([0]);
	}
	return EmptySet;
};
Boolean.prototype.root=
Number.prototype.root=function(){
	return EmptySet;
};
function indep(){
	//Linearly independent
	return false;
}
//inverse(o,b,d,side);

Array.prototype.root=function(x){
	if(x===undefined){
		console.warn("Variable not specified (Assume x)");
		x="x";
	}
	var domain = undefined;
	//Danger: assumes field
	if(this.type==="*"){
		var roots=new Set();
		this.forEach(function(f){
			//union
			roots.union(f.root(x));
		});
		return roots;
	}else if(false && this.type==="+" && indep(this[0],this[1])){
		//THIS IS WRONG. I want it to solve x^2 + y^2 = 0 types. (x^2 AND y^2 have to be zero)
		var roots=[];//new Set();
		this.forEach(function(f){
			roots.intersect(f.root(x));
		});
	}
	var lhs = this;
	var rhs = 0;
	var temp = 0;
	
	//FACTORISE!!!
	
	
	
	//OTHERWISE: (?? what condition)
	
	//TODO: this is a really slow algoritm. A tree path for the one and only x should be found first, instead of calculating it every single time!
	if(lhs.vars("x").length===1){
		while(lhs!==x){
			//console.log(lhs.clone(),"=",rhs.clone());
			
			var op = lhs.type;
			if(lhs[0].vars("x").length){
				
				// f(x) . B = k
				// f(x) . B / B= k / B
				//Danger: assumes right associativity
				//Right inverse of B:
				var side = L;
				rhs = inverse(op,lhs[1-side],rhs, side);
				if(rhs===undefined){
					throw("Could not solve");
				}
				lhs=lhs[side];
			}else if(lhs[1].vars("x").length){
				// A . f(x) = k
				// A^-1 . A . f(x) = A^-1 k
				// f(x) = A^-1 k
				//left inverse of A
				//Danger: assumes left associativity
				var side = R;
				rhs = inverse(op,lhs[1-side],rhs, side);
				if(rhs===undefined){
					throw("Could not solve");
				}
				lhs=lhs[side];
			}else{
				throw("The "+x+" variable is missing now!!!!")
			}
			
			
			
			if(temp++>40){
				throw("infinite loop!");
				break;
			}
		}
		return new Set([rhs])/*.simplify()*/; //TODO: may not be one value
	}else{
		throw("I don't know how to solve those");
	}
	
};
Array.prototype.inverse=function(y,x){
	//multivalued (as always)
	return this.apply("-",x).root(y);
};
Array.prototype.solve=function(x){
	function findValueThatIsZeroWhenItIsSatisfied(){
		//TODO: be more careful here!
		//Assumes this.type = "="
		return this[0].apply("-", this[1]);
		
	}
	if(this.type===";"){
		alert("solve set");
	}else if(this.type==="="){
		//make RHS = 0
		return findValueThatIsZeroWhenItIsSatisfied.apply(this).inverse(0);
	}
};