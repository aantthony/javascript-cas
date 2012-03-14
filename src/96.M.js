function M(a, b) {
    var ne = Expression(a, b || M.Global);
	return ne;
}

M.toString = function() {
	//Yes, this is necessary
	return 'function M() {\n    /*!\n     *  Math JavaScript Library v3.0.0\n     *  https://github.com/aantthony/javascript-cas\n     *  \n     *  Copyright 2010 Anthony Foster. All rights reserved.\n     */\n    [awesome code]\n}';
	return 'function M() {\n    [awesome code]\n}';
};

//Allow extensions
// M.fn = Expression.prototype;

//Allow creation of new Context externally
M['Context'] = Global;

//Allow modification of global context
M['Global'] = Global;

var extensions = {};
M.register = function (name, installer){
	if(Expression.prototype[name]) {
		throw('Method .'+name+' is already in use!');
	}
	extensions[name] = installer;
};
M.load = function(name, config) {
	Expression.prototype[name] = extensions[name](config);
	delete extensions[name];
};


//Debug:

//M.Expression = Expression;

if (typeof module !== 'undefined') {
	//Node
	module['exports'] = M;
} else {
	//In browser
	window['M'] = M;
}
