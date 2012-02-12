Expression.List.prototype.toTypedString = function() {
    var t = this.real();
    //Returns the real part only
	return {
		s: this.join(this.type)
	};
};