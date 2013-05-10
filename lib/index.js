"use strict";

var Expression = require('./Expression');
var Context    = require('./Context');
var MathError  = require('./Error');

var language = require('./Language/default');

var globalContext = require('./global');

module.exports = M;

// Note that it is M.Global, and NOT just Global (so the user can set M.Global)
function M(e, c) {
    return language.parse(e, c || M.Global);
}

M.toString = function() {
    return [
    'function M(expression, context) {',
    '    /*!',
    '     *  Math JavaScript Library v3.9.1',
    '     *  https://github.com/aantthony/javascript-cas',
    '     *  ',
    '     *  Copyright 2010 Anthony Foster. All rights reserved.',
    '     */',
    '    [awesome code]',
    '}'].join('\n');
};

//Allow creation of new Context externally
M['Context'] = Context;

M['Expression'] = Expression;

//Allow modification of global context
M['Global'] = globalContext;

M['Error'] = MathError;

var extensions = {};

M['register'] = function (name, installer){
    if(Expression.prototype[name]) {
        throw('Method .' + name + ' is already in use!');
    }
    extensions[name] = installer;
};

M.load = function(name, config) {
    extensions[name](M, Expression, config);
    delete extensions[name];
};