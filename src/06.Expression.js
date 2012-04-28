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
	return 'http://latex.codecogs.com/gif.latex?' + encodeURIComponent(this.toTypedString('text/latex').s);
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
	return new Statement(this, x, '=');
};
Expression.prototype['!='] = function (x) {
	return new Statement(this, x, '!=');
};
Expression.prototype['>'] = function (x) {
	return new Statement(this, x, '>');
};
Expression.prototype['>='] = function (x) {
	return new Statement(this, x, '>=');
};
Expression.prototype['<'] = function (x) {
	return new Statement(this, x, '<');
};
Expression.prototype['<='] = function (x) {
	return new Statement(this, x, '<=');
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
	var b = this[1].sub(x, y);
	if(this.length !== 2) {
		console.error('TODO: Simplify after (i.e., [0].apply(...))');
	}
	return a[this.operator](b);
	return Expression.List(Array.prototype.map.call(this, function (t) {
		return t.sub(x, y);
	}), this.operator);
};
Expression.prototype['*'] = function (x) {
	return new Expression.List([this, x], '*');
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

