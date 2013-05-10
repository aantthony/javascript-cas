
function Infinitesimal(x) {
	this.x = x;
}
_ = extend(Infinitesimal, Expression);

_['+'] = function (x) {
	if(x instanceof Infinitesimal) {
		throw('Infinitesimal addition');
	}
	return x;
};
_['/'] = function (x) {
	if(x instanceof Infinitesimal) {
		if(x.x instanceof Expression.Symbol) {
			return this.x.differentiate(x.x);
		}
		throw('Confusing infitesimal division');
	}
	this.x = this.x['/'](x);
	return this;
};
_['*'] = function (x) {
	// d^2 = 0
	if(x instanceof Infinitesimal) {
		return Global.Zero;
	}
	this.x = this.x['*'](x);
};
_.s = function (lang) {
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
_ = extend(Derivative, Expression.Function);
_.default = function (x) {
	return x.differentiate(this.x);
};
