function Set(discrete){
	var t = [];
	this.discrete = t;
	if(typeof discrete == "object" && discrete.forEach){
		discrete.forEach(function(b) {
			if(t.indexOf(b)==-1){
				t.push(b);
			}
		});
	}
};
Set.prototype.union=function(x){
	var t=this.discrete;
	x.discrete.forEach(function(b) {
		if(t.indexOf(b)==-1){
			t.push(b);
		}
	});
};
Set.prototype.forEach=function(x){
	this.discrete.forEach(x);
};
var EmptySet=new Set();