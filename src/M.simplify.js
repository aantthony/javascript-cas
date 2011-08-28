
Array.prototype.simplify=function(){
	
	//Rules:
	// simplify ∘ simplify ≠ simpify
	
	// Algorithm:
	// O(2^n???)
	O("?", "simplify");
	if(this.length===1){
		var a = this[0].simplify();
		
		return a.apply(this.type);
	} else if(this.length===2){
		var a = this[0].simplify();
		var b = this[1].simplify();
		//In place?
		return a.apply(this.type, b);
	}
};