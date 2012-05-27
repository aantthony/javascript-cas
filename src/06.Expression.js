function Expression(e, c) {
	var n = language.parse(e, c);
	return n;
}

//Expression.prototype = Object.create(Array.prototype);
//Expression.prototype = {};
Expression.prototype.valueOf = null;
Expression.prototype.identity = function () {
    deprecated('Slow');
	return this;
};

Expression.prototype.toString = null;
Expression.prototype.imageURL = function () {
	return 'http://latex.codecogs.com/gif.latex?' + encodeURIComponent(this.s('text/latex').s);
};
Expression.prototype.image = function () {
	var image = new Image();
	image.src = this.imageURL();
	return image;
};
Expression.prototype.sub = function () {
	return this;
};
Expression.prototype.lim = function (x, y) {
	return this.sub(x, y);
};
// Global Root operators:
Expression.prototype[','] = function (x) {
	return Expression.Vector([this, x]);
};
Expression.prototype['='] = function (x) {
	return new Expression.Statement(this, x, '=');
};
Expression.prototype['!='] = function (x) {
	return new Expression.Statement(this, x, '!=');
};
Expression.prototype['>'] = function (x) {
	return new Expression.Statement(this, x, '>');
};
Expression.prototype['>='] = function (x) {
	return new Expression.Statement(this, x, '>=');
};
Expression.prototype['<'] = function (x) {
	return new Expression.Statement(this, x, '<');
};
Expression.prototype['<='] = function (x) {
	return new Expression.Statement(this, x, '<=');
};




// =========== List ============ //
Expression.List = function(e, operator) {
    e.__proto__ = Expression.List.prototype;
	e.operator = operator;
	return e;
};
Expression.List.prototype = Object.create(Expression.prototype);
Expression.List.prototype.constructor = Expression.List;


Expression.List.prototype.sub = function (x, y) {
	var a = this[0].sub(x, y);
	if(this.length === 1) {
		return a[this.operator]();
	}
	var b = this[1].sub(x, y);
	
	return a[this.operator || 'default'](b);
};
Expression.prototype['*'] = function (x) {
	if(x === Global.Zero) {
		return x;
	}
	if(x === Global.One) {
		return this;
	}
	return new Expression.List([this, x], '*');
};
Expression.prototype.default = function (x) {
	return this['*'](x);
};

Expression.List.prototype['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return new Expression.List([this], '@-');
};
Expression.prototype['/'] = function (x) {
	return new Expression.List([this, x], '/');
};

Expression.prototype['+'] = function (x) {
	return new Expression.List([this, x], '+');
};

Expression.prototype['-'] = function (x) {
	return new Expression.List([this, x], '-');
};

Expression.prototype['^'] = function (x) {
	return new Expression.List([this, x], '^');
};

Expression.prototype['%'] = function (x) {
	return new Expression.List([this, x], '%');
};

