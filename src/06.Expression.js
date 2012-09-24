function Expression(e, c) {
	var n = language.parse(e, c);
	return n;
}
//_ = Object.create(Array.prototype);
//_ = {};
_ = Expression.prototype;
_.valueOf = null;
_.identity = function () {
    deprecated('Slow');
	return this;
};

_.toString = null;
_.imageURL = function () {
	return 'http://latex.codecogs.com/gif.latex?' + encodeURIComponent(this.s('text/latex').s);
};
_.image = function () {
	var image = new Image();
	image.src = this.imageURL();
	return image;
};
_.sub = function () {
	return this;
};
_.lim = function (x, y) {
	return this.sub(x, y);
};
// Global Root operators:
_[','] = function (x) {
	if(x instanceof Expression.Statement) {
		return new Expression.Conditional(x, this);
	}
	return Expression.Vector([this, x]);
};
_['='] = function (x) {
	return new Expression.Statement(this, x, '=');
};
_['!='] = function (x) {
	return new Expression.Statement(this, x, '!=');
};

_['>'] = function (x) {
	return new Expression.Statement(this, x, '>');
};
_['>='] = function (x) {
	return new Expression.Statement(this, x, '>=');
};
_['<'] = function (x) {
	return new Expression.Statement(this, x, '<');
};
_['<='] = function (x) {
	return new Expression.Statement(this, x, '<=');
};

_['*'] = function (x) {
	if(x === Global.Zero) {
		return x;
	}
	if(x === Global.One) {
		return this;
	}
	return new Expression.List([this, x], '*');
};
_.default = function (x) {
	return this['*'](x);
};

_['/'] = function (x) {
	return new Expression.List([this, x], '/');
};

_['+'] = function (x) {
	return new Expression.List([this, x], '+');
};

_['-'] = function (x) {
	return new Expression.List([this, x], '-');
};

_['@-'] = function (x) {
	return new Expression.List([this], '@-');
};

_['^'] = function (x) {
	return new Expression.List([this, x], '^');
};

_['%'] = function (x) {
	return new Expression.List([this, x], '%');
};








// =========== List ============ //
Expression.List = function(e, operator) {
    e.__proto__ = Expression.List.prototype;
	e.operator = operator;
	return e;
};
_ = Expression.List.prototype = Object.create(_);
_.constructor = Expression.List;


_.sub = function (x, y) {
	var a = this[0].sub(x, y);
	if(this.length === 1) {
		return a[this.operator]();
	}
	var b = this[1].sub(x, y);
	
	return a[this.operator || 'default'](b);
};

_['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return new Expression.List([this], '@-');
};
