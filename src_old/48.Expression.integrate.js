Expression.prototype.integrate = function(x) {
	throw('Could not integrate expression.');
};
Expression.prototype.integrateN = function(x, n) {
	if (n === 0) {
		return this;
	} else if(n <= -1) {
		return this.differentiateN(x, n);
	} else if(n > 1) {
		return this.integrate(x).integrateN(x, n - 1);
	} else if (n === 1) {
		return this.integrate(x);
	}
};