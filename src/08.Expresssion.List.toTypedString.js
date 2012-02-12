Expression.List.prototype.toTypedString = function() {
    var t = this.real();
    //Returns the real part only
	return {
		s: Array.prototype.join.apply(this,[this.type])
	};
};