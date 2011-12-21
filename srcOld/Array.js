
Array.prototype.setType=function(type){
	this.type=type;
	return this;
};
Array.prototype.clone=function(){
	return Array.prototype.slice.apply(this).setType(this.type);
};
function I(){
	return this.constructor(this);
}
function _false(){
	return false;
}
function _true(){
	return true;
}
Number.prototype.eval=
Number.prototype.simplify=
String.prototype.eval=
String.prototype.simplify=
Boolean.prototype.simplify=
Boolean.prototype.toLatex=
Number.prototype.clone=
Boolean.prototype.clone=
String.prototype.clone=
I;
Number.prototype.requiresParentheses=
String.prototype.requiresParentheses=
Boolean.prototype.requiresParentheses=
_false;
Number.prototype.impliedBy=
String.prototype.impliedBy=
Boolean.prototype.impliedBy=
_true;
