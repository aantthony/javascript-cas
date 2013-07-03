/*

	The root javascript cas class:
	
	All objects returned by M(...) must be Expression objects.
	
*/

function Expression(e, c) {
	var n = language.parse(e, c);
	return n;
}

_ = Expression.prototype;

// Trigger an error when a math expression is used with the javascript + operator:
_.toString = null;
_.valueOf = null;

_.identity = function () {
	deprecated('Slow');
	return this;
};

_.imageURL = function () {
	return 'http://latex.codecogs.com/gif.latex?' +
		encodeURIComponent(this.s('text/latex').s);
};
_.renderLaTeX = function () {
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

// crossProduct is the '&times;' character
_[crossProduct] = function (x) {
	return this['*'](x);
};

// The default operator occurs when two expressions are adjacent to eachother: S -> e e.
// Depending on the type, it usually represents associative multiplication.
// See below for the default '*' operator implementation.
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

// This may look like we are assuming that x is a number, but really the important assumption is simply that it is finite. Thus infinities and indeterminates should ALWAYS override this operator

_['*'] = function (x) {
	if(x === Global.Zero) {
		return x;
	}
	if(x === Global.One) {
		return this;
	}
	return new Expression.List([this, x], '*');
};




// =========== List ============ //

/*

	Expression.List should be avoided whenever Expression.List.Real can be used. However, knowing when to use Real is an impossible (?) task, so sometimes this will have to do as a fallback.
*/
Expression.List = function(e, operator) {
	e.__proto__ = Expression.List.prototype;
	e.operator = operator;
	return e;
};
_ = extend(Expression.List, Expression);

// Substition x -> y
_.sub = function (x, y) {
	var a = this[0].sub(x, y);
	if(this.length === 1) {
		return a[this.operator]();
	}
	var b = this[1].sub(x, y);
	
	// Re-evaluate:
	return a[this.operator || 'default'](b);
};

// @ signifies a unary operator. eg: "y = @-2" <==> y = -2. Users never input or see @.
_['@-'] = function () {
	if(this.operator === '@-') {
		return this[0];
	}
	return new Expression.List([this], '@-');
};
