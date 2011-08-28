
Number.prototype.toStrings=function(){
	return this.toString().replace(/e([\+\-])([\d\.]+)/,"\\cdot 10^{$2}");
};

var _Array_prototype_toString=Array.prototype.toString;
Array.prototype.toStrings=function(){
	if(!this.type){
		return _Array_prototype_toString.apply(this,arguments);
	}
	//Infix
	if(this.length>=2){
		var self=this;
		return this.map(function(t){
			var a = t.toStrings();
			if(t.requiresParentheses(self.type)){
				a="("+a+")";
			}
			return a;
		}).join(this.type);
	}
	//Postfix
	if(this.length==1){
		return this[0].toStrings()+this.type;
	}
	
	//Prefix
	if(false && this.length==2){
		return this[0].toStrings()+this.type+this[1].toStrings();
	}
};

Boolean.prototype.toStrings=Boolean.prototype.toString;
String.prototype.toStrings=String.prototype.toString;

