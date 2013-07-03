// Note that it is M.Global, and NOT just Global (so the user can set M.Global)
function M(a, b) {
	var e = Expression(a, b || M.Global);
	return e;
}

M.toString = function() {
	return 'function M(expression, context) {\n    /*!\n     *  Math JavaScript Library v3.9.1\n     *  https://github.com/aantthony/javascript-cas\n     *  \n     *  Copyright 2010 Anthony Foster. All rights reserved.\n     */\n    [awesome code]\n}';
};

//Allow creation of new Context externally
M['Context'] = Context;

M['Expression'] = Expression;
//Allow modification of global context
M['Global'] = Global;
M['Error'] = MathError;
var extensions = {};
M['register'] = function (name, installer){
	if(Expression.prototype[name]) {
		throw('Method .'+name+' is already in use!');
	}
	extensions[name] = installer;
};
M.load = function(name, config) {
	extensions[name](M, Expression, config);
	delete extensions[name];
};

if (typeof module !== 'undefined') {
	// Node
	module['exports'] = M;
} else {
	// In browser
	window['M'] = M;
}

console.log('Load time:', new Date() - startTime, 'ms');