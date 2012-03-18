Expression.prototype.conjugate = function() {
	throw('Conjugate');
};

Expression.List.prototype.conjugate = function() {
	var i, l = this.length;
	var n = new Array(l);
	for (i = 0; i < l; i++) {
		n[i] = this[i].conjugate();
	}
	return Expression.List(n, this.operator);
};
