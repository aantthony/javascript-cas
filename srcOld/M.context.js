M.Context.prototype.learn=function(x){
	if(x===truth){
		alert("Base fact already known.");
	}
	//Should learn(x) assume logical consistency of x and this
	var handle=" vars: x,y,z";
	var vars = new Set(x.vars());
	var self=this;
	vars.forEach(function(v) {
		if(self[v]){
			throw("Already defined! (TODO: intersect it)");
		}else{
			//Should I solve for it now? Or when required?
			self[v]=true;
		}
	});
	return handle;
};
M.Context.prototype.delete=function(var_name_or_handle){
	if(typeof var_name_or_handle === "object"){
		//handle
	}else{
		delete this[var_name_or_handle];
	}
};

Array.prototype.vars = function(x){
	var v = [];
	this.map(function(e) {
		v.push.apply(v,e.vars(x));
	});
	return v;
};
String.prototype.vars=function(x){
	var t = String(this);
	if(x===undefined || x===t){
		return [t];
	}
	return [];
};
Number.prototype.vars=
Boolean.prototype.vars=
function(){
	return [];
};