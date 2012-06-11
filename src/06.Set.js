function Set(x) {
	x.__proto__ = Set.prototype;
	return x;
};
_ = Set.prototype;
_.intersect = function (set) {
	// O(n^2)
	var i;
	var i_l = this.length;
	var j;
	var j_l = set.length;
	var s = new Set([]);
	for (i = 0; i < i_l; i++) {
		// Find in second set:
		for (j = 0; j < j_l; j++) {
			var a = this[i];
			var b = set[j];
			if (a === b) {
				s[s.length] = (a);
				break;
			}
			var my_val = (a)['-'](b);
			if(my_val === Global.Zero) {
				s[s.length] = (a);
				break;
			}
		}
	}
	return a;
}; 
_.union = function (set) {
	// TODO: check for duplicates
	return Set(Array.prototype.concat.call(this, set));
}
_.remove = function (x) {
	// O(1 + lookup[n])
	var i = this.indexOf(x);
	this[i] = this[this.length - 1];
	this.length--;
	return this;
}
_.add = function (x) {
	// O(1 + lookup[n])
	if (this.indexOf(x) === -1) {
		this[this.length] = x;
	}
	return this;
};
_.map = function (f) {
	return Set(Array.prototype.map.call(this, f));
};