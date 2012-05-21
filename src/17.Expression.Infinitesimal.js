
function Infinitesimal(x) {
	this.x = x;
}
Infinitesimal.prototype = Object.create(Expression.prototype);
Infinitesimal.prototype.constructor = Infinitesimal;
Infinitesimal.prototype['+'] = function (x) {
	if(x instanceof Infinitesimal) {
		throw('Infinitesimal addition');
	}
	return x;
};
Infinitesimal.prototype['/'] = function (x) {
	if(x instanceof Infinitesimal) {
		if(x.x instanceof Expression.Symbol) {
			return this.x.differentiate(x.x);
		}
		throw('Confusing infitesimal division');
	}
	this.x = this.x['/'](x);
	return this;
};
Infinitesimal.prototype['*'] = function (x) {
	// d^2 = 0
	if(x instanceof Infinitesimal) {
		return Global.Zero;
	}
	this.x = this.x['*'](x);
};
Infinitesimal.prototype.s = function(lang) {
	if(lang !== 'text/latex') {
		throw ('Infinitesimal numbers cannot be exported to programming languages');
	}
	var c = this.x.s(lang);
	var p = language.precedence('default')
	if(p > c.p) {
		c.s = '\\left(' + c.s + '\\right)';
	}
	return c.update('d' + c.s, p);
};

function Derivative(x) {
	// technically should be a function / operator
	this.x = x;
}
Derivative.prototype = Object.create(Expression.Function.prototype);
Derivative.prototype.constructor = Derivative;
Derivative.prototype.default = function (x) {
	return x.differentiate(this.x);
};
