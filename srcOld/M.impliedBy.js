var truth=[1,1].setType("=");
Array.prototype.impliedBy=function(context){
	if(this===truth){
		return true;
	}
	if(this.type===";"){
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