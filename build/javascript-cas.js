;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
'use strict';

var M = require('./lib');

if (typeof window !== 'undefined') {
    var _M = window.M;
    window.M = M;
    M.noConflict = function () {
        window.M = _M;
        return M;
    };
}
if (typeof module !== 'undefined') {
    module.exports = M;
}

},{"./lib":2}],2:[function(require,module,exports){
(function(){/*jslint node: true */

// not sure if this is required:
/*jshint sub: true */

"use strict";

var Expression  = require('./Expression'),
    Context     = require('./Context'),
    MathError   = require('./Error'),
    language    = require('./Language/default'),
    Code        = require('./Language').Code,
    Global      = require('./global');

// Define sin, cos, tan, etc.
var defaults    = require('./global/defaults');
defaults.attach(Global);

module.exports = M;

function M(e, c) {
    return language.parse(e, c || Global);
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

M['Context']    = Context;
M['Expression'] = Expression;
M['Global']     = Global;
M['Error']      = MathError;

Expression.prototype.s = function (lang) {
    Code.language = language;
    Code.newContext();
    return this._s(Code, lang);
};
Expression.prototype.compile = function (x) {
    return this.s('text/javascript').compile(x);
}

var extensions = {};

M['register'] = function (name, installer){
    if(Expression.prototype[name]) {
        throw('Method .' + name + ' is already in use!');
    }
    extensions[name] = installer;
};

M['load'] = function(name, config) {
    extensions[name](M, Expression, config);
    delete extensions[name];
};

})()
},{"./Language/default":3,"./global/defaults":4,"./Expression":5,"./Context":6,"./Error":7,"./Language":8,"./global":9}],7:[function(require,module,exports){
function MathError(str) {
    this.message = str;
}
MathError.prototype = Object.create(Error.prototype);

module.exports = MathError;

},{}],9:[function(require,module,exports){
(function(){var global = {};

module.exports = global;

})()
},{}],10:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":11}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],11:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":12}],3:[function(require,module,exports){
(function(){var Language = require('./');

var Expression = require('../Expression'),
    Global     = require('../global');

var crossProduct = String.fromCharCode(215); // &times; character

// Built by Jison:
var parser = require('../../grammar/parser.js');

parser.parseError = function (str, hash) {
    // {
    //     text: this.lexer.match,
    //     token: this.terminals_[symbol] || symbol,
    //     line: this.lexer.yylineno,
    //     loc: yyloc,
    //     expected:
    //     expected
    // }
    var er = new SyntaxError(str);
    er.line = hash.line;
    throw er;
};


var left = 'left', right = 'right';
var L = left;
var R = right;



var language = module.exports = new Language(parser, {
        Number: function (str) {
            if (str === '1') {
                return Global.One;
            } else if (str === '0') {
                return Global.Zero;
            }

            if (/^\d+$/.test(str)) {
                return new Expression.Integer(Number(str));
            }
            if (/^[\d]*\.[\d]+$/.test(str)) {
                var decimalPlace = str.indexOf('.');
                // 12.345 -> 12345 / 1000
                // 00.5 -> 5/10
                var denom_p = str.length - decimalPlace - 1;
                var d = Math.pow(10, denom_p);
                var n = Number(str.replace('.', ''));
                
                return new Expression.Rational(n, d).reduce();
            }
            return new Expression.NumericalReal(Number(str));
        },
        String: function (str) {
            return str;
        },
        Single: function (str) {
            // Single latex chars for x^3, x^y etc (NOT x^{abc})
            if (!isNaN(str)) {
                return new Expression.Integer(Number(str));
            }
            
            return new Expression.Symbol.Real(str);
        }
    },
    [
    [';'],          /*L / R makes no difference???!??!? */
    [','],
    [['=', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='],R],
    [['?',':'],R,2],
    [['∨']],
    [['&&']],
    [['|']],
    [['??????']],//XOR
    [['&']],
    [['==', '≠', '!==', '===']],
    [['<', '<=', '>', '>='],L],
    [['>>', '<<']],
    ['±', R, 2],
    [['+'], true],
    [['-'], L],
    [['∫', '∑'], R, 1],
    [['*', '%'], R],
    [crossProduct, R],
    [['@+', '@-', '@±'], R, 1], //unary plus/minus
    [['¬'], L, 1],
    ['default', R, 2], //I changed this to R for 5sin(t)
    ['∘', R, 2],
    [['/']],
    [['^']],//e**x
    ['!', L, 1],
    [['~'], R, 1], //bitwise negation
    [['++', '++', '.', '->'],L,1],
    [['::']],
    [['_'], L, 2],
    ['var', R, 1],
    ['break', R, 0],
    ['throw', R, 1],
    ['\'', L, 1],
    ['\u221A', R, 1], // Sqrt
    ['#', R, 1] /*anonymous function*/
]);

/*
 Language spec columns in order of _increasing precedence_:
 * operator string representation(s). These are different operators, but share all properties.
 * Associativity
 * Operand count (Must be a fixed number) 
 * (TODO??) commute group? - or should this be derived?
 * (TODO?) associative? commutative?  - Should be calculated?
 * (TODO?) Identity?
*/

// var mathematica = new Language([
//     [';'],
//     [','],
//     [['=', '+=']]
// ]);

})()
},{"../../grammar/parser.js":13,"./":8,"../Expression":5,"../global":9}],13:[function(require,module,exports){
(function(process){/* parser generated by jison 0.4.10 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"S":4,"EOF":5,"e":6,"stmt":7,"=":8,"!=":9,"<=":10,"<":11,">":12,">=":13,"csl":14,",":15,"vector":16,"(":17,")":18,"+":19,"-":20,"*":21,"/":22,"POWER{":23,"}":24,"_{":25,"_SINGLE":26,"SQRT{":27,"FRAC{":28,"{":29,"^SINGLE":30,"identifier":31,"number":32,"IDENTIFIER":33,"LONGIDENTIFIER":34,"DECIMAL":35,"INTEGER":36,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"=",9:"!=",10:"<=",11:"<",12:">",13:">=",15:",",17:"(",18:")",19:"+",20:"-",21:"*",22:"/",23:"POWER{",24:"}",25:"_{",26:"_SINGLE",27:"SQRT{",28:"FRAC{",29:"{",30:"^SINGLE",33:"IDENTIFIER",34:"LONGIDENTIFIER",35:"DECIMAL",36:"INTEGER"},
productions_: [0,[3,2],[4,1],[4,1],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[14,3],[14,3],[16,3],[6,3],[6,3],[6,3],[6,3],[6,4],[6,4],[6,2],[6,3],[6,6],[6,2],[6,2],[6,2],[6,3],[6,1],[6,1],[6,1],[31,1],[31,1],[32,1],[32,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 2:this.$ = $$[$0];
break;
case 3:this.$ = $$[$0];
break;
case 4:this.$ = ['=', $$[$0-2], $$[$0]];
break;
case 5:this.$ = ['!=', $$[$0-2], $$[$0]];
break;
case 6:this.$ = ['<=', $$[$0-2], $$[$0]];
break;
case 7:this.$ = ['<', $$[$0-2], $$[$0]];
break;
case 8:this.$ = ['>', $$[$0-2], $$[$0]];
break;
case 9:this.$ = ['>=', $$[$0-2], $$[$0]];
break;
case 10:this.$ = [',.', $$[$0-2], $$[$0]];
break;
case 11:this.$ = [',', $$[$0-2], $$[$0]];
break;
case 12:this.$ = $$[$0-1];
break;
case 13:this.$ = ['+', $$[$0-2], $$[$0]];
break;
case 14:this.$ = ['-', $$[$0-2], $$[$0]];
break;
case 15:this.$ = ['*', $$[$0-2], $$[$0]];
break;
case 16:this.$ = ['/', $$[$0-2], $$[$0]];
break;
case 17:this.$ = ['^', $$[$0-3], $$[$0-1]];
break;
case 18:this.$ = ['_', $$[$0-3], $$[$0-1]];
break;
case 19:this.$ = ['_', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 20:this.$ = ['sqrt', $$[$0-1]];
break;
case 21:this.$ = ['frac', $$[$0-4], $$[$0-1]];
break;
case 22:this.$ = ['^', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 23:this.$ = ['@-', $$[$0]]
break;
case 24:this.$ = ['default', $$[$0-1], $$[$0]];
break;
case 25:this.$ = $$[$0-1]
break;
case 26:this.$ = $$[$0];
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = $$[$0];
break;
case 29:this.$ = yytext;
break;
case 30:this.$ = yytext.substring(1);
break;
case 31:this.$ = {type: 'Number', primitive: yytext};
break;
case 32:this.$ = {type: 'Number', primitive: yytext};
break;
}
},
table: [{3:1,4:2,6:3,7:4,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{1:[3]},{5:[1,16]},{5:[2,2],6:25,8:[1,26],9:[1,27],10:[1,28],11:[1,29],12:[1,30],13:[1,31],16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,2],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,3],24:[2,3]},{6:32,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:33,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:34,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:35,14:36,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,26],8:[2,26],9:[2,26],10:[2,26],11:[2,26],12:[2,26],13:[2,26],15:[2,26],17:[2,26],18:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],27:[2,26],28:[2,26],30:[2,26],33:[2,26],34:[2,26],35:[2,26],36:[2,26]},{5:[2,27],8:[2,27],9:[2,27],10:[2,27],11:[2,27],12:[2,27],13:[2,27],15:[2,27],17:[2,27],18:[2,27],19:[2,27],20:[2,27],21:[2,27],22:[2,27],23:[2,27],24:[2,27],25:[2,27],26:[2,27],27:[2,27],28:[2,27],30:[2,27],33:[2,27],34:[2,27],35:[2,27],36:[2,27]},{5:[2,28],8:[2,28],9:[2,28],10:[2,28],11:[2,28],12:[2,28],13:[2,28],15:[2,28],17:[2,28],18:[2,28],19:[2,28],20:[2,28],21:[2,28],22:[2,28],23:[2,28],24:[2,28],25:[2,28],26:[2,28],27:[2,28],28:[2,28],30:[2,28],33:[2,28],34:[2,28],35:[2,28],36:[2,28]},{5:[2,29],8:[2,29],9:[2,29],10:[2,29],11:[2,29],12:[2,29],13:[2,29],15:[2,29],17:[2,29],18:[2,29],19:[2,29],20:[2,29],21:[2,29],22:[2,29],23:[2,29],24:[2,29],25:[2,29],26:[2,29],27:[2,29],28:[2,29],30:[2,29],33:[2,29],34:[2,29],35:[2,29],36:[2,29]},{5:[2,30],8:[2,30],9:[2,30],10:[2,30],11:[2,30],12:[2,30],13:[2,30],15:[2,30],17:[2,30],18:[2,30],19:[2,30],20:[2,30],21:[2,30],22:[2,30],23:[2,30],24:[2,30],25:[2,30],26:[2,30],27:[2,30],28:[2,30],30:[2,30],33:[2,30],34:[2,30],35:[2,30],36:[2,30]},{5:[2,31],8:[2,31],9:[2,31],10:[2,31],11:[2,31],12:[2,31],13:[2,31],15:[2,31],17:[2,31],18:[2,31],19:[2,31],20:[2,31],21:[2,31],22:[2,31],23:[2,31],24:[2,31],25:[2,31],26:[2,31],27:[2,31],28:[2,31],30:[2,31],33:[2,31],34:[2,31],35:[2,31],36:[2,31]},{5:[2,32],8:[2,32],9:[2,32],10:[2,32],11:[2,32],12:[2,32],13:[2,32],15:[2,32],17:[2,32],18:[2,32],19:[2,32],20:[2,32],21:[2,32],22:[2,32],23:[2,32],24:[2,32],25:[2,32],26:[2,32],27:[2,32],28:[2,32],30:[2,32],33:[2,32],34:[2,32],35:[2,32],36:[2,32]},{1:[2,1]},{6:37,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:38,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:39,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:40,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:41,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{4:42,6:3,7:4,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],15:[2,19],17:[2,19],18:[2,19],19:[2,19],20:[2,19],21:[2,19],22:[2,19],23:[2,19],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],30:[2,19],33:[2,19],34:[2,19],35:[2,19],36:[2,19]},{5:[2,22],8:[2,22],9:[2,22],10:[2,22],11:[2,22],12:[2,22],13:[2,22],15:[2,22],17:[2,22],18:[2,22],19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],30:[2,22],33:[2,22],34:[2,22],35:[2,22],36:[2,22]},{5:[2,24],6:25,8:[2,24],9:[2,24],10:[2,24],11:[2,24],12:[2,24],13:[2,24],15:[2,24],16:9,17:[1,8],18:[2,24],19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[1,21],24:[2,24],25:[2,24],26:[2,24],27:[2,24],28:[2,24],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:43,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:44,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:45,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:46,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:47,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:48,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,49],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,50],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,23],6:25,8:[2,23],9:[2,23],10:[2,23],11:[2,23],12:[2,23],13:[2,23],15:[2,23],16:9,17:[1,8],18:[2,23],19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[1,21],24:[2,23],25:[2,23],26:[2,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,15:[1,52],16:9,17:[1,8],18:[1,51],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{15:[1,54],18:[1,53]},{5:[2,13],6:25,8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],15:[2,13],16:9,17:[1,8],18:[2,13],19:[2,13],20:[2,13],21:[1,19],22:[1,20],23:[1,21],24:[2,13],25:[2,13],26:[2,13],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,14],6:25,8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],15:[2,14],16:9,17:[1,8],18:[2,14],19:[2,14],20:[2,14],21:[2,23],22:[2,23],23:[1,21],24:[2,14],25:[2,14],26:[2,14],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,15],6:25,8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],15:[2,15],16:9,17:[1,8],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[1,21],24:[2,15],25:[2,15],26:[2,15],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,16],6:25,8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],15:[2,16],16:9,17:[1,8],18:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[1,21],24:[2,16],25:[2,16],26:[2,16],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,55],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{24:[1,56]},{5:[2,4],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,4],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,5],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,5],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,6],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,6],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,7],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,7],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,8],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,8],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,9],6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,9],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],15:[2,20],17:[2,20],18:[2,20],19:[2,20],20:[2,20],21:[2,20],22:[2,20],23:[2,20],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],30:[2,20],33:[2,20],34:[2,20],35:[2,20],36:[2,20]},{29:[1,57]},{5:[2,25],8:[2,25],9:[2,25],10:[2,25],11:[2,25],12:[2,25],13:[2,25],15:[2,25],17:[2,25],18:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[2,25],24:[2,25],25:[2,25],26:[2,25],27:[2,25],28:[2,25],30:[2,25],33:[2,25],34:[2,25],35:[2,25],36:[2,25]},{6:58,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],15:[2,12],17:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],30:[2,12],33:[2,12],34:[2,12],35:[2,12],36:[2,12]},{6:59,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,17],8:[2,17],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],15:[2,17],17:[2,17],18:[2,17],19:[2,17],20:[2,17],21:[2,17],22:[2,17],23:[2,17],24:[2,17],25:[2,17],26:[2,17],27:[2,17],28:[2,17],30:[2,17],33:[2,17],34:[2,17],35:[2,17],36:[2,17]},{5:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],15:[2,18],17:[2,18],18:[2,18],19:[2,18],20:[2,18],21:[2,18],22:[2,18],23:[2,18],24:[2,18],25:[2,18],26:[2,18],27:[2,18],28:[2,18],30:[2,18],33:[2,18],34:[2,18],35:[2,18],36:[2,18]},{6:60,16:9,17:[1,8],20:[1,7],27:[1,5],28:[1,6],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,15:[2,11],16:9,17:[1,8],18:[2,11],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,15:[2,10],16:9,17:[1,8],18:[2,10],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{6:25,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,61],25:[1,22],26:[1,23],27:[1,5],28:[1,6],30:[1,24],31:10,32:11,33:[1,12],34:[1,13],35:[1,14],36:[1,15]},{5:[2,21],8:[2,21],9:[2,21],10:[2,21],11:[2,21],12:[2,21],13:[2,21],15:[2,21],17:[2,21],18:[2,21],19:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],30:[2,21],33:[2,21],34:[2,21],35:[2,21],36:[2,21]}],
defaultActions: {16:[2,1]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
undefined/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 'TEXT'
break;
case 2:return 17
break;
case 3:return 18
break;
case 4:return 28
break;
case 5:return 27
break;
case 6:return 21
break;
case 7:return 10
break;
case 8:return 13
break;
case 9:return 'NE'
break;
case 10:return 34
break;
case 11:return 33
break;
case 12:return 35
break;
case 13:return 36
break;
case 14:return 8
break;
case 15:return 21
break;
case 16:return 21
break;
case 17:return 22
break;
case 18:return 20
break;
case 19:return 19
break;
case 20:return 10
break;
case 21:return 13
break;
case 22:return 11
break;
case 23:return 12
break;
case 24:return 9
break;
case 25:return '&&'
break;
case 26:return 26
break;
case 27:return 30
break;
case 28:return 25
break;
case 29:return 23
break;
case 30:return '!'
break;
case 31:return '%'
break;
case 32:return 15
break;
case 33:return '?'
break;
case 34:return ':'
break;
case 35:return 17
break;
case 36:return 18
break;
case 37:return 29
break;
case 38:return 24
break;
case 39:return '['
break;
case 40:return ']'
break;
case 41:return 5
break;
}
},
rules: [/^(?:\s+)/,/^(?:\$[^\$]*\$)/,/^(?:\\left\()/,/^(?:\\right\))/,/^(?:\\frac\{)/,/^(?:\\sqrt\{)/,/^(?:\\cdot\b)/,/^(?:\\l[e])/,/^(?:\\g[e])/,/^(?:\\n[e])/,/^(?:\\[a-zA-Z]+)/,/^(?:[a-zA-Z])/,/^(?:[0-9]+\.[0-9]*)/,/^(?:[0-9]+)/,/^(?:=)/,/^(?:\*)/,/^(?:\.)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:<=)/,/^(?:>=)/,/^(?:<)/,/^(?:>)/,/^(?:!=)/,/^(?:&&)/,/^(?:_[^\(\{])/,/^(?:\^[^\(\{])/,/^(?:_\{)/,/^(?:\^\{)/,/^(?:!)/,/^(?:%)/,/^(?:,)/,/^(?:\?)/,/^(?::)/,/^(?:\()/,/^(?:\))/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
})(require("__browserify_process"))
},{"fs":14,"path":15,"__browserify_process":12}],4:[function(require,module,exports){
(function(){var Expression = require('../Expression');

module.exports.attach = function (global) {


    function Derivative(wrt) {
        return new Expression.Function({
            default: function (x) {
                return x.differentiate(wrt);
            }
        })
    }
    
    var CartSine = new Expression.Function({
        default: function (x) {
            if(x instanceof Expression.NumericalReal
                || x instanceof Expression.List.Real
                || x instanceof Expression.Symbol.Real) {
                return new M.Expression.List.ComplexCartesian([global.sin.default(x), global.Zero]);
            } else {
                throw(new Error('Complex Sine Cartesian form not implemented yet.'));
            }
        }
    });

    global['sin'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.sin(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.sin, x]);
            }
            return Expression.List([global.sin, x]);
            
            /*
                    // sin(a+bi) = sin(a)cosh(b) + i cos(a)sinh(b)
                    var exp_b = Math.exp(x._imag);
                    var cosh_b = (exp_b + 1 / exp_b) / 2;
                    var sinh_b = (exp_b - 1 / exp_b) / 2;
                    return new Expression.ComplexNumerical(Math.sin(x._real) * cosh_b, Math.cos(x._real) * sinh_b);
            */
        },
        realimag: function () {
            return CartSine;
        },
        'text/latex': '\\sin',
        'text/javascript': 'Math.sin',
        'x-shader/x-fragment': 'sin',
        title: 'Sine Function',
        description: 'See http://en.wikipedia.org/wiki/Trigonometric_functions#Sine.2C_cosine.2C_and_tangent',
        examples: ['\\sin (\\pi)'],
        related: ['cos', 'tan']
    });
    global['cos'] = new Expression.Function({
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.cos(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.cos, x]);
            }
            return Expression.List([global.cos, x]);
            
        },
        derivative: global.sin['@-'](),
        'text/latex': '\\cos',
        'text/javascript': 'Math.cos',
        'x-shader/x-fragment': 'cos',
        title: 'Cosine Function',
        description: 'Cosine Function desc',
        examples: ['\\cos (\\pi)'],
        related: ['sin', 'tan']
    });

    global.sin.derivative = global.cos;

    global['tan'] = new Expression.Function({
        symbolic: function (x) {
            //
        }
    });
    global['log'] = new Expression.Function({
        default: function (x, assumptions) {

            if(x instanceof Expression.Integer && x.a === 1) {
                return global.Zero;
            } else if(x instanceof Expression.Integer && x.a === 0) {
                return global.Infinity['@-']();
            } else if(x instanceof Expression.NumericalReal) {
                var v = x.value;
                if(v > 0){
                    return new Expression.NumericalReal(Math.log(v));
                }
            }

            if(assumptions && assumptions.positive) {
                return Expression.List.Real([global.log, x]);
            }
            
            return Expression.List([global.log, x]);
        },
        realimag: function (x) {
            return CartLog;
        },
        'text/latex': '\\log',
        'text/javascript': 'Math.log',
        'x-shader/x-fragment': 'log',
        title: 'Natural Logarithm',
        description: 'Base e. See http://en.wikipedia.org/wiki/Natural_logarithm',
        examples: ['\\log (ye^(2x))'],
        related: ['exp', 'Log']
    });
    var Half = new Expression.Rational(1, 2);
    var CartLog = new Expression.Function({
        default: function (x) {
            return new Expression.List.ComplexCartesian([
                global.log.default(x.abs()),
                x.arg()
            ])['*'](Half);
        }
    });
    CartLog.__proto__ = global.log;
    global['atan2'] = new Expression.Function({
        default: function(x) {
            if(! (x instanceof Expression.Vector)) {
                throw ('atan only takes vector arguments');
            }
            if(x[0] instanceof Expression.NumericalReal) {
                if(x[1] instanceof Expression.NumericalReal) {
                    return new Expression.NumericalReal(Math.atan2(x[0].value, x[1].value));
                }
            }
            
            return new Expression.List.Real([global.atan2, x]);
            
            return Expression.List([global.atan2, x]);
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            return [Expression.List([global.atan2, x]), M.global.Zero];
        },
        'text/latex': '\\tan^{-1}',
        'text/javascript': 'Math.atan2',
        'x-shader/x-fragment': 'atan',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Two argument arctangent function',
        description: 'Arctan(y, x). Will equal arctan(y / x) except when x and y are both negative. See http://en.wikipedia.org/wiki/Atan2'
    });

    global['atan'] = global.atan2;

    global['Gamma'] = {
        default: function(x){
            function gammln(xx) {
                var j;
                var x, tmp, y, ser;
                var cof = [
                    57.1562356658629235,
                    -59.5979603554754912,
                    14.1360979747417471,
                    -0.491913816097620199,
                    0.339946499848118887e-4,
                    0.465236289270485756e-4,
                    -0.983744753048795646e-4,
                    0.158088703224912494e-3,
                    -0.210264441724104883e-3,
                    0.217439618115212643e-3,
                    -0.164318106536763890e-3,
                    0.844182239838527433e-4,
                    -0.261908384015814087e-4,
                    0.368991826595316234e-5
                ];
                if (xx <= 0){
                    throw('bad arg in gammln');
                }
                y = x = xx;
                tmp = x + 5.24218750000000000;
                tmp = (x + 0.5) * Math.log(tmp) - tmp;
                ser = 0.999999999999997092;
                for (j = 0; j < 14; j++){
                    ser += cof[j] / ++y;
                }
                return tmp + Math.log(2.5066282746310005 * ser / x);
            }
            if (x instanceof Expression.Integer) {
                var v = x.a;
                if(v < 0) {
                    return global.ComplexInfinity;
                }
                if(v < 15) {
                    var p = 1;
                    var i = 0;
                    for(i = 1; i < v; i++) {
                        p *= i;
                    }
                    return new Expression.Integer(p);
                }
                return Expression.List.Real([global.Gamma, x]);
            } else if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                if (v === 0) {
                    return global.Infinity;
                } else if(v < 0) {
                    return new Expression.NumericalReal(-Math.PI / (v * Math.sin(Math.PI * v) * Math.exp(gammln(-v))));
                }
                return new Expression.NumericalReal(Math.exp(gammln(v)));
            } else if(x instanceof Expression.NumericalComplex) {
                
            }
            return Expression.List([global.Gamma, x]);
        },
        'text/latex': '\\Gamma',
        'text/javascript': 'M.global.Gamma.f',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Gamma Function',
        description: 'See http://en.wikipedia.org/wiki/Gamma_function',
        examples: ['\\Gamma (x)', 'x!'],
        related: ['Log', 'LogGamma']
    };
    global['Re'] = {
        default: function(x) {
            return x.real();
        },
        apply_realimag: function(op, x) {
            return [x.real(), global.Zero];
        },
        'text/latex': '\\Re'
    };
    global['Im'] = {
        default: function(x) {
            return x.imag();
        },
        distributed_under_differentiation: true,
        apply_realimag: function(op, x) {
            return [x.imag(), global.Zero];
        },
        'text/latex': '\\Im'
    }
    Expression.List.Real.prototype.positive = function () {
        if(this.operator === '+') {
            return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
        }
        if(this.operator === '*') {
            if(this[0] === this[1]) {
                return true;
            }
            return this[0].positive && this[1].positive && this[0].positive() && this[1].positive();
        }
        if(this.operator === '^') {
            if(this[1] instanceof Expression.Rational) {
                var f = this[1].reduce();
                if(f.a % 2 === 0) {
                    return true;
                }
            }
        }
        return false;
    };
    Expression.NumericalReal.prototype.positive = function () {
        return this.value > 0;
    };
    global['sqrt'] = new Expression.Function({
        default: function (x) {
            if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                if(v < 0) {
                    return new Expression.List.ComplexCartesian([
                        global.Zero, new Expression.NumericalReal(Math.sqrt(v))
                    ]);
                }
                return new Expression.NumericalReal(Math.sqrt(v));
            } else if (x instanceof Expression.List.Real) {
                if(x.positive()) {
                    return Expression.List.Real([global.sqrt, x]);
                } else {
                    return Expression.List([global.sqrt, x]);
                }
            } else if (x instanceof Expression.List.ComplexPolar) {
                return new Expression.List.ComplexPolar([
                    x[0],
                    x[1]['/'](new Expression.Integer(2))
                ]);
            } else if (x instanceof Expression.List.ComplexCartesian) {
                return new Expression.List([global.sqrt, x]);
            }
            return Expression.List([global.sqrt, x]);
            throw('SQRT: ???');
            switch (x.constructor) {
                case Expression.Complex:
                    //http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
                    var sgn_b;
                    if (x._imag === 0.0) {
                        return new Expression.Complex(Math.sqrt(x._real), 0);
                    } else if(x._imag>0) {
                        sgn_b = 1.0;
                    } else {
                        sgn_b = -1.0;
                    }
                    var s_a2_b2 = Math.sqrt(x._real * x._real + x._imag * x._imag);
                    var p = one_on_rt2 * Math.sqrt(s_a2_b2 + x._real);
                    var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - x._real);
                case Expression.NumericalReal:
                    return new Expression.RealNumerical(Math.sqrt(x));
                case Expression.List.Real:
                case Expression.List:
                    if (x.operator === '^') {
                        return global.abs.apply(undefined, x[0].apply('^', x[1].apply('/', new Expression.NumericalReal(2,0))));
                    }
                default:
                    return Expression.List([global.sqrt, x]);
            }
        },
        apply_realimag: function(op, x) {
            //TODO: DANGER! Assuming real numbers, but it should have some fast way to do this.
            
            //Uses exp, atan2 and log functions. A really bad idea. (square rooting, then squaring, then atan, also [exp(log)])
            return x['^'](new Expression.Rational(1, 2)).realimag();
            //var ri = x.realimag();
            //return [Expression.List([global.sqrt, x]), M.global.Zero];
        },
        'text/latex': '\\sqrt',
        'text/javascript': 'Math.sqrt',
        'x-shader/x-fragment': 'sqrt',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        title: 'Sqrt Function',
        description: 'See http://en.wikipedia.org/wiki/Square_Root',
        examples: ['\\sqrt (x^4)'],
        related: ['pow', 'abs', 'mod']
    });
    global['abs'] = new Expression.Function({
        default: function (x) {
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list.
            return x.abs();
        },
        'text/latex': '\\abs',
        'text/javascript': 'Math.abs',
        'x-shader/x-fragment': 'abs',
        titie: 'Absolute Value Function',
        description: 'Abs',
        examples: ['\\abs (-3)', '\\abs (i+3)'],
        related: ['arg', 'tan']
    });

    // It is self-referential
    global.abs.derivative = (function () {
            var s = new Expression.Symbol.Real();
            var y = s['/'](s.abs());
            return new Expression.Function.Symbolic(y, [s]);
    }());
    global['arg'] = {
        default: function (x) {
            console.warn('ARG IS FOR USER INPUT ONLY. USE .arg()');
            //Using abs is better (I think) because it finds the method through the prototype chain,
            //which is going to be faster than doing an if list / switch case list. TODO: Check the truthfullnes of this!
            return x.arg();
        },
        'text/latex': '\\arg', //temp
        'text/javascript': 'Math.arg_real',
        toTypedString: function(language) {
            return {
                s: this[language],
                t:javascript.Function
            }
        },
        titie: 'Arg Function',
        description: 'Arg',
        examples: ['\\arg (-3)', '\\arg (3)', '\\arg(3+2i)'],
        related: ['abs']
    }



    global['e'] = new Expression.NumericalReal(Math.E, 0);
    global['e'].title = 'e';
    global['e'].description = 'The transcendental number that is the base of the natural logarithm, approximately equal to 2.71828.';
    global.e.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.E');
        }
        if(lang == 'text/latex') {
            return new Code('e');
        }
        return new Code('2.718281828459045');
    };


    global['pi'] = new Expression.NumericalReal(Math.PI, 0);
    global['pi'].title = 'Pi';
    global['pi'].description = '';
    global.pi.s = function (lang) {
        if(lang === 'text/javascript') {
            return new Code('Math.PI');
        }
        if(lang === 'text/latex') {
            return new Code('\\pi');
        }
        return new Code('3.141592653589793');
    };
    // The real circle constant:
    global.tau = global['pi']['*'](new Expression.Integer(2));

    global['Infinity'] = new Expression.NumericalReal(Infinity, 0);
    global['Infinity'].title = 'Infinity';
    global['Infinity'].description = '';
    global['infty'] = global.Infinity;


    global['Zero'] = new Expression.Integer(0);
    global['Zero'].title = 'Zero';
    global['Zero'].description = 'Additive Identity';
    global['Zero']['*'] = function (x) {
        return global.Zero;
    };
    global['Zero']['+'] = function (x) {
        return x;
    };
    global['Zero']['@-'] = function (x) {
        return this;
    };

    global['Zero']['-'] = function (x) {
        return x['@-']();
    };

    global['One'] = new Expression.Integer(1);
    global['One'].title = 'One';
    global['One'].description = 'Multiplicative Identity';
    global['One']['*'] = function (x) {
        return x;
    };

    global.log.derivative = new Expression.Function.Symbolic(global.One['/'](new Expression.Symbol.Real()));

    global['i'] = new Expression.List.ComplexCartesian([global['Zero'], global['One']]);
    global['i'].title = 'Imaginary Unit';
    global['i'].description = 'A number which satisfies the property <m>i^2 = -1</m>.';
    global['i'].realimag = function(){
        return Expression.List.ComplexCartesian([
            global.Zero,
            global.One
        ]);
    };
    global['i']['*[TODO]'] = function (x) {
        
    };

    global['d'] = new Expression.Function({
        default: function(x) {
            return new Expression.Infinitesimal(x);
        }
    });

    global.d['/'] = function (x) {
        if(x instanceof Expression.Infinitesimal) {
            if(x.x instanceof Expression.Symbol) {
        
                // Derivative operator
                
                return new Derivative(x.x);
            }
            if(x.x instanceof Expression.Vector) {
                return Expression.Vector(Array.prototype.map.call(x.x, function (x) {
                    return new Derivative(x);
                }));
            }
            throw new Error('Confusing infitesimal operator division');
        }

        throw('Dividing d by some large number.');
        
    };
    global['undefined'] = {
        s: function (lang){
            if (lang === 'text/javascript') {
                return new Code('undefined');
            } else if (lang === 'x-shader/x-fragment') {
                return new Code('(1.0/0.0)');
            }
        },
        differentiate: function (){
            return this;
        },
        '*': function (){
            return this;
        },
        '+': function (){
            return this;
        },
        '-': function () {
            return this;
        },
        '/': function () {
            return this;
        },
        '^': function () {
            return this;
        },
        '@-': function () {
            return this;
        }
    };
    global['sum'] = new Expression.Function({
        default: function (x) {
            throw('Sum not properly constructed yet.');
            return 3;
        }
    });
    global['sum']['_'] = function (eq) {
        // start: 
        var t = eq[0];
        var v = eq[1];
        return new Expression.Sum.Real(t, v);
    }
    
};
})()
},{"../Expression":5}],8:[function(require,module,exports){
var util = require('util');

function Language(parser, Construct, language) {
    this.cfg = parser;
    this.Construct = Construct;
    var operators = this.operators = {},
        opPrecedence = 0;
    function op(v, associativity, arity) {

    }
    language.forEach(function (o) {
        function defop(str, o) {
            var associativity = o[1] || 'left';
            var arity = (o[2] === undefined) ? 2 : o[2];

            operators[str] =  {
                associativity: associativity,
                precedence: opPrecedence++,
                arity: arity
            };
        }
        var str = o[0];
        if (typeof str === 'string') {
            defop(str, o);
        } else {
            str.forEach(function (s) {
                defop(s, o);
            });
        }
    });
}

Language.Code = require('./Code');

var _        = Language.prototype;

_.parse      = require('./parse');
_.stringify  = require('./stringify');

_.postfix = function (str) {
    var operator = this.operators[str];
    return  operator.associativity === 0 && 
            operator.arity === 1;
};

_.unary = function (str) {
    var unary_secondarys = ['+', '-', '±'];
    return (unary_secondarys.indexOf(o) !== -1) ? ('@' + o) : false;
};

_.associative = function (str) {
    throw new Error('associative????');
    // return this.operators[str].associativity === true;
};



module.exports = Language;

},{"util":10,"./Code":16,"./parse":17,"./stringify":18}],5:[function(require,module,exports){
(function(){var Global = require('../global');

function Expression() {
    
}

module.exports = Expression;

Expression.List                   = require('./List');
Expression.List.Real              = require('./List/Real');
Expression.List.ComplexCartesian  = require('./List/ComplexCartesian');
Expression.List.ComplexPolar      = require('./List/ComplexPolar');
Expression.Constant               = require('./Constant');
Expression.NumericalComplex       = require('./NumericalComplex');
Expression.NumericalReal          = require('./NumericalReal');
Expression.Rational               = require('./Rational');
Expression.Integer                = require('./Integer');
Expression.Symbol                 = require('./Symbol');
Expression.Symbol.Real            = require('./Symbol/Real');
Expression.Statement              = require('./Statement');
Expression.Vector                 = require('./Vector');
Expression.Matrix                 = require('./Matrix');
Expression.Function               = require('./Function');
Expression.Function.Symbolic      = require('./Function/Symbolic');
Expression.Infinitesimal          = require('./Infinitesimal');

var _ = Expression.prototype;

_.toString = null;
_.valueOf = null;

_.imageURL = function () {
    return 'http://latex.codecogs.com/gif.latex?' +
        encodeURIComponent(this.s('text/latex').s);
};

_.renderLaTeX = function () {
    var image = new Image();
    image.src = this.imageURL();
    return image;
};

// substution default:
_.sub = function () {
    return this;
};

// limit default
_.lim = function (x, y) {
    return this.sub(x, y);
};

_[','] = function (x) {
    if(x instanceof Expression.Statement) {
        return new Expression.Conditional(x, this);
    }
    return Expression.Vector([this, x]);
};


['=', '!=', '>', '>=', '<', '<='].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.Statement(this, x, operator);
    };
});



// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = function (x) {
    return this['*'](x);
};


// The default operator occurs when two expressions are adjacent to eachother: S -> e e.
// Depending on the type, it usually represents associative multiplication.
// See below for the default '*' operator implementation.
_.default = function (x) {
    return this['*'](x);
};

['/', '+', '-', '@-', '^', '%'].forEach(function (operator) {
    _[operator] = function (x) {
        return new Expression.List([this, x], operator);
    };
});




// This may look like we are assuming that x is a number,
// but really the important assumption is simply
// that it is finite.
// Thus infinities and indeterminates should ALWAYS
// override this operator

_['*'] = function (x) {
    if(x === Global.Zero) {
        return x;
    }
    if(x === Global.One) {
        return this;
    }
    return new Expression.List([this, x], '*');
};











})()
},{"./Constant":19,"./NumericalComplex":20,"./NumericalReal":21,"./Rational":22,"./Integer":23,"../global":9,"./List":24,"./List/Real":25,"./List/ComplexPolar":26,"./List/ComplexCartesian":27,"./Symbol":28,"./Symbol/Real":29,"./Function":30,"./Statement":31,"./Vector":32,"./Matrix":33,"./Function/Symbolic":34,"./Infinitesimal":35}],6:[function(require,module,exports){
(function(){var util    = require('util');
var global  = require('../global');

module.exports = Context;

util.inherits(Context, {prototype: global});

function Context() {

}

Context.prototype.reset = function () {
    this.splice(0);
};

})()
},{"util":10,"../global":9}],14:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],15:[function(require,module,exports){
(function(process){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

})(require("__browserify_process"))
},{"__browserify_process":12}],16:[function(require,module,exports){
(function(){// stop jshint from complaing about Function (which it calls eval)
/*jshint -W061 */

module.exports = Code;

function Code(s, pre){
    this.pre = [] || pre;
    this.s = '' || s;
    this.vars = 0;
    this.p = Infinity;
}

var _ = Code.prototype;

/*
    This uses a global state.

    Perhaps there is a nicer way, but this will work.
*/
Code.newContext = function () {
    Code.contextVariableCount = 0;
};

Code.newContext();

// For faster evaluation multiple statments. For example (x+3)^2 will first calculate x+3, and so on.
_.variable = function () {
    return 't' + (Code.contextVariableCount++).toString(36);
};

_.merge = function (o, str, p, pre) {
    this.s = str;
    if (pre) {
        this.pre.push(pre);
    }
    var i;
    this.pre.push.apply(this.pre, o.pre);
    this.vars += o.vars;
    this.p = p;
    return this;
};

_.update = function (str, p, pre) {
    this.p = p;
    if(pre) {
        this.pre.push(pre);
    }
    this.s = str;
    return this;
};

// Javascript compliation
_.compile = function (x) {
    return Function(x, this.pre.join('\n') + 'return ' + this.s);
};

_.glslFunction = function (type, name, parameters) {
    return type + ' ' + name + '(' + parameters + '){\n' + this.pre.join('\n') + 'return ' + this.s + ';\n}\n';
};


})()
},{}],18:[function(require,module,exports){
module.exports = function stringify(expr, lang) {
    return expr.s(lang);
};

},{}],19:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./');
var Global = require('../global');

module.exports = Constant;

util.inherits(Constant, sup);

function Constant() {
    throw new Error('Expression.Constant created directly');
}

var _ = Constant.prototype;

_.simplify = function() {
    return this;
};

_.differentiate = function() {
    return Global.Zero;
};

_.apply = function (x){
    return this['*'](x);
};

})()
},{"util":10,"../global":9,"./":5}],20:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./Constant');
var Global = require('../global');

module.exports = NumericalComplex;

util.inherits(NumericalComplex, sup);

function NumericalComplex(real, imag) {
    this._real = real;
    this._imag = imag;
}

var _ = NumericalComplex.prototype;

_.real = function() {
    return new Expression.NumericalReal(this._real);
};

_.imag = function() {
    return new Expression.NumericalReal(this._imag);
};

_.realimag = function() {
    return Expression.List.ComplexCartesian([
        new Expression.NumericalReal(this._real),
        new Expression.NumericalReal(this._imag)
    ]);
};

_.conjugate = function() {
    return new Expression.NumericalComplex(this._real, -this._imag);
};

_['+'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x;
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
    } else if (x instanceof Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real + x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex +');
    }
};

_['-'] = function (x) {
    if(this._real === 0 && this._imag === 0) {
        return x['@-']();
    }
    if(x instanceof Expression.NumericalComplex){
        return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real - x.value, this._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        throw ('Unknown Type for NumericalComplex -');
    }
};

_['*'] = function (x) {
    if(this._imag === 0) {
        if(this._real === 0) {
            return Global.Zero;
        }
        if(this._real === 1) {
            return x;
        }
    }
    
    if(x.constructor === this.constructor){
        return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['*'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['*'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['*'](this);
    } else {
        throw ('Unknown Type for NumericalComplex *');
    }
};

_['/'] = function (x) {
    if(this._imag === 0 && this._real === 0) {
        // TODO: Provided x != 0
        return Global.Zero;
    }
    
    if(x.constructor === this.constructor){
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real * x._imag) / cc_dd);
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        return this.realimag()['/'](x);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return this.polar()['/'](x);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List([this, x], '/');
    } else if(x.constructor === Expression.List) {
        return Expression.List([this, x], '/');
    } else {
        throw ('Unknown Type for NumericalComplex /');
    }
};

_['!'] = function (){
    return Global.Gamma.apply(this);
};

// (function(){
//     return;
//     var one_on_rt2 = 1/Math.sqrt(2);
//     Expression.NumericalComplex.prototype.apply = function(operator, x) {
//         switch (operator){
//             case '^':
//                 if(this._real === 0 && this._imag === 0) {
//                     return Global.Zero; // Contradicts x^0 = 1
//                 }
//                 break;
//             case '+':
//                 if(this._real === 0 && this._imag === 0) {
//                     return x;
//                 }
//                 break;
//             case '-':
//                 if(this.value === 0) {
//                     return x.apply('@-');
//                 }
//                 break;
//             case undefined:
//             case '*':
//                 if(this._real === 1 && this._imag === 0){
//                     return x;
//                 }
//                 //Note: There is not meant to be a break here.
//             case '/':
//                 if(this._real === 0 && this._imag === 0){
//                     return Global.Zero; //Contradics x/0 = Infinity
//                 }
//         }
//         if (operator === ',') {
//             return Expression.Vector([this, x]);
//         } else if (x === undefined) {
//             switch (operator) {
                
//                 case '@+':
//                     return this;
//                 case '@-':
//                     return new Expression.NumericalComplex(-this._real, -this._imag);
//                 case '\u221A':
//                     throw('OLD SQRT. New one is a function, not operator.')
//                     return new Expression.NumericalComplex(p, q);
//                 case '++':
//                 case '--':
//                     throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//                 case '+=':
//                 case '-=':
//                 case '*=':
//                 case '/=':
//                     throw(new ReferenceError('Left side of assignment is not a reference.'));
//                 case '!':
//                     return Global.Gamma.apply(undefined, new Expression.NumericalComplex(this._real + 1, this._imag));
//             }
//         } else if (x.constructor === Expression.NumericalReal) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     return new Expression.NumericalComplex(this._real * x.value, this._imag * x.value);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x.value, this._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x.value, this._imag);
//                 case '/':
//                     return new Expression.NumericalComplex(this._real / x.value, this._imag / x.value);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x.value;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if (x.constructor === this.constructor) {
//             switch (operator) {
//                 case '*':
//                 case undefined:
//                     // (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
//                     return new Expression.NumericalComplex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
//                 case '+':
//                     return new Expression.NumericalComplex(this._real + x._real, this._imag + x._imag);
//                 case '-':
//                     return new Expression.NumericalComplex(this._real - x._real, this._imag - x._imag);
//                 case '/':
//                     //  (a+bi)/(c+di) 
//                     //= [(a+bi)(c-di)]/[(c+di)(c-di)]
//                     //= [(a+bi)(c-di)]/[cc + dd]
//                     //= [ac -dai +bci + bd]/[cc+dd]
//                     //= [ac + bd + (bc - da)]/[cc+dd]
//                     var cc_dd = x._real * x._real + x._imag * x._imag;
//                     return new Expression.NumericalComplex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real*x._imag)/cc_dd);
//                 case '^':
//                     var a = this._real;
//                     var b = this._imag;
//                     var c = x._real;
//                     var d = x._imag;

//                     var hlm = 0.5 * Math.log(a*a + b*b);
//                     var theta = Math.atan2(b, a);
//                     var hmld_tc = hlm * d + theta * c;
//                     var e_hmlc_td = Math.exp(hlm * c - theta * d);
//                     return new Expression.NumericalComplex(
//                         (e_hmlc_td * Math.cos(hmld_tc)),
//                         (e_hmlc_td * Math.sin(hmld_tc))
//                     );
//                 default:
//             }
//         } else if(x.constructor === Expression.List.ComplexCartesian) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.List.ComplexPolar) {
//             return this.polar().apply(operator, x);
//         } else if(x.constructor === Expression.List.Real) {
//             return this.realimag().apply(operator, x);
//         } else if(x.constructor === Expression.Symbol.Real) {
//             return this.realimag().apply(operator, x);
//         }
//         console.error('cmplx . ' + operator + ' => E.List?');
//         /*
//         if(this._real === 0.0 && this._imag === 0.0){
//             return this;
//         }
//         */
        
        
//         return this.realimag().apply(operator, x);
//         return Expression.List([this, x], operator);
//     }
    
// }());

})()
},{"util":10,"./Constant":19,"../global":9}],21:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalComplex');
var Global = require('../global');
var Expression = require('./');
module.exports = NumericalReal;

util.inherits(NumericalReal, sup);

function NumericalReal(e) {
    this.value = e;
}

var _ = NumericalReal.prototype;

Object.defineProperty(_, "_real", {
    get: function () {
        return this.value;
    }
});
_._imag = 0;

_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.realimag = function() {
    return Expression.List.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.conjugate = function() {
    return this;
};

_['+'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value + x.value);
    }
    return x['+'](this);
};

_['@-'] = function (x) {
    return new NumericalReal(-this.value);
};

_['-'] = function (x) {
    if(this.value === 0) {
        return x;
    }
    if(x instanceof NumericalReal) {
        return new NumericalReal(this.value - x.value);
    }
    return x['@-']()['+'](this);
};


_['%'] = function (x) {
    var nonreal = 'The modular arithmetic operator \'%\' is not defined for non-real numbers.';
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value % x.value);
    } else if(x.constructor === Expression.List.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.Symbol.Real) {
        return Expression.List.Real([this, x], '%');
    } else if(x.constructor === Expression.List) {
        throw('Not sure about this...');
        // Not sure about this
        // return Expression.List.Real([this, x], '%');
    } else if (x.constructor === Expression.NumericalComplex) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        throw(new TypeError(nonreal));
    } else if (x.constructor === Expression.List.ComplexPolar) {    
        throw(new TypeError(nonreal));
    } else {
        throw ('Unknown Type for NumericalReal %');
    }
};
_['*'] = function (x) {
    if(x instanceof NumericalReal){
        return new NumericalReal(this.value * x.value);
    }
    return x['*'](this);
};
_['/'] = function (x) {
    if(this.value === 0) {
        return Global.Zero;
    }
    if(x instanceof NumericalReal){
        if(x.value === 0) {
            throw('Division by zero not allowed!');
        }
        return new NumericalReal(this.value / x.value);
    } else if (x.constructor === Expression.NumericalComplex) {
        var cc_dd = x._real * x._real + x._imag * x._imag;
        return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value * x._imag) / cc_dd);
    } else if(x instanceof Expression.List.ComplexCartesian) {
        // a/(x+yi) = a/(x+yi) (x-yi)/(x-yi) = a(x-yi) / (x^2 + y^2)
        var x_conj = Expression.List.ComplexCartesian([
            x[0],
            x[1]['@-']()
        ]);
        var two = NumericalReal(2);
        return x_conj['*'](this)['/'](
            (x[0]['^'])(two)
            ['+'] (
                (x[1]['^'])(two)
            )
        );
    // } else if(x instanceof Expression.List.ComplexPolar) {
        
    } else if(x instanceof Expression.List.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.Symbol.Real) {
        // TODO: given x != 0
        return Expression.List.Real([this, x], '/');
    } else if(x instanceof Expression.List) {   
        return Expression.List([this, x], '/');
    } else {
        console.log('Unknown type: ', this, x);
        throw ('Unknown Type for NumericalReal /');
    }
};
_['^'] = function (x) {
    if (this.value === 0) {
        return Global.Zero;
    }
    if (this.value === 1) {
        return Global.One;
    }
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if (x instanceof Expression.Integer) {
        return new NumericalReal(Math.pow(this.value, x.a));
    } else if(x instanceof NumericalReal){
        if(this.value > 0) {
            return new NumericalReal(Math.pow(this.value, x.value));
        }
        // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
        //      <- I think no, because why else start with a numerical. Implement a rational/integer type
        var r = Math.pow(-this.value, x.value);
        var theta = Math.PI * x.value;
        return new Expression.List.ComplexPolar([
            new NumericalReal(r),
            new NumericalReal(theta)
        ]);
    } else if (x.constructor === Expression.NumericalComplex) {
        var a = this.value;
        var c = x._real;
        var d = x._imag;
        console.error('Bad implementation ( num ^ complex)');
        var hlm = 0.5 * Math.log(a*a);
        var hmld_tc = hlm * d;
        var e_hmlc_td = Math.exp(hlm * c);
        return new Expression.NumericalComplex(
            (e_hmlc_td * Math.cos(hmld_tc)),
            (e_hmlc_td * Math.sin(hmld_tc))
        );
    } else if (x.constructor === Expression.List.ComplexCartesian) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.ComplexPolar) {
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.Symbol.Real) {
        if(this.value > 0) {
            return Expression.List.Real([this, x], '^');
        }
        return Expression.List([this, x], '^');
    } else if (x.constructor === Expression.List) {
        return Expression.List([this, x], '^');
    } else {
        throw console.error ('Unknown Type for NumericalReal ^', x, x instanceof NumericalReal);
    }
};
_['>'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value > x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>'].call(this, x);
};
_['<'] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value < x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<'].call(this, x);
};
_['<='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value <= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['<='].call(this, x);
};
_['>='] = function (x) {
    if (x instanceof NumericalReal) {
        return this.value >= x.value ? Expression.True : Expression.False;
    }
    return sup.prototype['>='].call(this, x);
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        var num = this.value.toExponential();
        if(num.indexOf('.') === -1){
            num = num.replace('e','.e');
        }
        return new Code(num);
    }
    return new Code(this.value.toString());
};
// _.applyOld = function(operator, x) {
//     switch (operator){
//         case ',':
//             return Expression.Vector([this, x]);
//         case '^':
//             if(this.value === 0) {
//                 return Global.Zero; // Contradicts x^0 = 1
//             }
//             break;
//         case '+':
//             if(this.value === 0) {
//                 return x;
//             }
//             break;
//         case '-':
//             if(this.value === 0) {
//                 return x.apply('@-');
//             }
//             break;
//         case undefined:
//         case '*':
//             if(this.value === 1){
//                 return x;
//             }
//             //Note: There is not meant to be a break here.
//         case '/':
//             if(this.value === 0){
//                 return Global.Zero; //Contradics x/0 = Infinity
//             }
//     }
//     if(x === undefined){
//         //Unary
//         switch (operator) {
//             case '@+':
//                 return this;
//             case '@-':
//                 return new NumericalReal(-this.value);
//             case '++':
//             case '--':
//                 throw(new TypeError('Postfix ' +operator + ' operator applied to value that is not a reference.'));
//             case '+=':
//             case '-=':
//             case '*=':
//             case '/=':
//                 throw(new ReferenceError('Left side of assignment is not a reference.'));
//             case '!':
//                 return Global.Gamma.apply(undefined, new NumericalReal(this.value + 1));
//         }
//     } else if(x.constructor === this.constructor){
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new NumericalReal(this.value * x.value);
//             case '+':
//                 return new NumericalReal(this.value + x.value);
//             case '-':
//                 return new NumericalReal(this.value - x.value);
//             case '/':
//                 return new NumericalReal(this.value / x.value);
//             case '^':
//                 if(this.value > 0) {
//                     return new NumericalReal(Math.pow(this.value, x.value));
//                 } else {
//                     // TODO: This will produce ugly decimals. Maybe we should express it in polar form?!
//                     var r = Math.pow(-this.value, x.value)
//                     var theta = Math.PI * x.value;
//                     return new Expression.Complex(r*Math.cos(theta), r*Math.sin(theta));
//                 }
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (operator) {
//             case '*':
//             case undefined:
//                 return new Expression.Complex(this.value * x._real, this.value * x._imag);
//             case '+':
//                 return new Expression.Complex(this.value + x._real, x._imag);
//             case '-':
//                 return new Expression.Complex(this.value - x._real, -x._imag);
//             case '/':
//                 var cc_dd = x._real * x._real + x._imag * x._imag;
//                 return new Expression.Complex((this.value * x._real)/cc_dd, (-this.value*x._imag)/cc_dd);
//             case '^':
//                 var a = this.value;
//                 var c = x._real;
//                 var d = x._imag;
//                 console.error('Bad implementation ( num ^ complex)');
//                 var hlm = 0.5 * Math.log(a*a);
//                 var hmld_tc = hlm * d;
//                 var e_hmlc_td = Math.exp(hlm * c);
//                 return new Expression.Complex(
//                     (e_hmlc_td * Math.cos(hmld_tc)),
//                     (e_hmlc_td * Math.sin(hmld_tc))
//                 );
//             default:
//         }
//     } else if(x.constructor === Expression.List.ComplexCartesian) {
//         switch (operator) {
//             case '+':
//             case '-':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '/':
//                 return Expression.List.ComplexCartesian([
//                     x[0].apply(operator, this),
//                     x[1].apply(operator, this)
//                 ]);
//             case '^':
//                 console.warn('ineffecient: NR ^ CL');
//                 return this.realimag().apply(operator, x);
            
//         }
//     } else if(x.constructor === Expression.List.ComplexPolar) {
//         switch (operator) {
//             case '+':
//             case '-':
//             case '^':
//                 //(a+bi)+Ae^(ik)
//                 return Expression.List([this, x], operator);
//                 // or ? return this.apply(operator, x.realimag()); //Jump up to above +-
//             case undefined:
//                 operator = '*';
//             case '*':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//             case '/':
//                 return Expression.List.ComplexPolar([
//                     x[0].apply(operator, this),
//                     x[1]
//                 ]);
//         }
//     } else if (x.constructor === Expression.List.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         (new Expression.Numerical(-this.value)).apply('^', x),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
                
//     } else if (x.constructor === Expression.Symbol.Real) {
//         switch(operator) {
//             case undefined:
//                 operator = '*';
//             case '*':
//             case '+':
//             case '-':
//             case '/':
//                 return Expression.List.Real([this, x], operator);
//             case '^':
//                 if(this.value === 0){
//                     throw('N(0) ^ x');
//                 }
//                 if(this.value > 0) {
//                     return Expression.List.Real([this, x], operator);
//                 } else {
//                     return Expression.List.ComplexPolar([
//                         Expression.List.Real([(new NumericalReal(-this.value)), x], '^'),
//                         Global.pi.apply('*', x)
//                     ]);
//                 }
//         }
//     }
//     throw('?? - real');
//     return Expression.List([this, x], operator);
// };

})()
},{"util":10,"./NumericalComplex":20,"../global":9,"./":5}],22:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('./NumericalReal');
var Global = require('../global');
var Expression = require('./');

module.exports = Rational;

util.inherits(Rational, sup);

function Rational(a, b) {
    this.a = a;
    this.b = b;
}

var _ = Rational.prototype;


_.__defineGetter__("value", function () {
    return this.a / this.b;
});

_['+'] = function (x) {
    if(this.a === 0) {
        return x;
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b + this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        console.warn('Swapped operator order for + with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
    
    
};

_['-'] = function (x) {
    if(this.a === 0) {
        return x['@-']();
    }
    if(x instanceof Rational){
        /*
            a   c     ad   cb    ad + bc
            - + -  =  -- + -- =  -------
            b   d     bd   bd      b d
        */
        return new Rational(this.a * x.b - this.b * x.a, this.b * x.b);
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.NumericalComplex(this.value - x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x['@-']())['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x['@-']())['+'](this);
    } else {
        console.warn('Swapped operator order for - with Rational');
        return (x)['+'](this);
        // throw ('Unknown Type for Rational +');
    }
};

_['*'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        return new Rational(this.a * x.a, this.b * x.b);
    }
    return sup.protoype['*'].call(this, x);
};


_['/'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof Rational){
        if (x.a === 0) {
            throw('Division By Zero is not defined for Rational numbers!');
        }
        return new Rational(this.a * x.b, this.b * x.a).reduce();
    }
    return Expression.NumericalReal.prototype['/'].call(this, x);
};

_['^'] = function (x) {
    if(x === Global.Zero) {
        return Global.One;
    }
    if(x === Global.One) {
        return this;
    }
    if(this.a === 0) {
        return Global.Zero;
    }
    if(this.a === this.b) {
        return Global.One;
    }
    if(x instanceof Expression.Integer) {
        return new Rational(
            Math.pow(this.a, x.a),
            Math.pow(this.b, x.a)
        );
    } else if (x instanceof Rational) {
        
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        }

        return Expression.NumericalReal.prototype['^'].call(
            this,
            x
        );
        
    }

    return Expression.List([this, x], '^');
    
};

_.reduce = function () {
    // mutable.
    function gcd(a, b) {
        if(b === 0) {
            return a;
        }
        return gcd(b, a % b);
    }
    var g = gcd(this.b, this.a);
    this.a /= g;
    this.b /= g;
    if(this.b === 1) {
        return new Expression.Integer(this.a);
    }
    if(this.b < 0) {
        this.a = -this.a;
        this.b = -this.b;
    }
    
    return this;
};

})()
},{"util":10,"./NumericalReal":21,"../global":9,"./":5}],23:[function(require,module,exports){
(function(){var util = require('util');
var sup = require('./Rational');
var Global = require('../global');

module.exports = Integer;

util.inherits(Integer, sup);

function Integer(x) {
    this.a = x;
}

var _ = Integer.prototype;

_.b = 1;

_['+'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a + x.a);
    }
    return x['+'](this);
};

_['-'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a - x.a);
    }
    return sup.prototype['-'].call(this, x);
};

_['/'] = function (x) {
    if(x instanceof Integer) {
        if(this.a % x.a === 0) {
            return new Integer(this.a / x.a);
        }
        return new sup(this.a, x.a);
    }
    return sup.prototype['/'].call(this, x);
};

_['@-'] = function () {
    return new Integer(-this.a);
};

_['*'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a * x.a);
    }
    return x['*'](this);
};

_['^'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(Math.pow(this.a, x.a));
    } else if (x.constructor === sup) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        } else {
            return Expression.NumericalReal.prototype['^'].call(
                this,
                x
            );
        }
    } else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
        if(this.a > 0) {
            return Expression.List.Real([
                this,
                x
            ], '^');
        }
    }
    return Expression.NumericalReal.prototype['^'].call(
        this,
        x
    );
    
};

_['%'] = function (x) {
    if(x instanceof Integer) {
        return new Integer(this.a % x.a);
    } else if (x.constructor === sup) {
        return new sup();// @todo: !
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalReal(this % x.value);
    } else {
        return Expression.List.Real([this, x], '%');
    }
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        return new Code(this.a.toString() + '.0');
    }
    return new Code(this.a.toString());
};
})()
},{"util":10,"./Rational":22,"../global":9}],17:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var Global = require('../global');

module.exports = function (s, base) {
    var self = this;
    if (s === '' || s === undefined) {
        return undefined;
    }
    
    var root = Object.create({});
    var context = root;
    
    var free = {};
    var bound = {};
    
    function down(vars) {
        var parent = context;
        context = Object.create(context);
        context.$parent = parent;
        var i;
        for (i in vars) {
            if (vars.hasOwnProperty(i)) {
                context[i] = vars[i];
            }
        }
    }
    
    function up(entity) {
        context = context.$parent;
        return entity;
    }
    /*
        Evaluate AST tree (top-down)
        
        Examples:
            * y=x^2
                ['=', y, ['^', x, 2]]
    
    */
    var loose = false;
    function evaluate(ast) {
        if (typeof ast === 'string') {
            var symbol;
            if ((symbol = context[ast])) {
                return symbol;
            } else if ((symbol = base[ast])) {
                bound[ast] = symbol;
            } else {
                free[ast] = symbol = new Expression.Symbol.Real(ast);
            }
            root[ast] = symbol;
            return symbol;
        } else if (ast.primitive) {
            return self.Construct[ast.type](ast.primitive);
        } else if (typeof ast === 'object') {
            
            var ast1 = evaluate(ast[1]);
            
            if (ast.length === 3) {
                switch (ast[0]) {
                    case 'frac':
                        ast[0] = '/';
                        break;
                    case '_':
                        // Don't bind underneath
                        if (ast[1] === 'sum') {
                            var limit = ast[2];
                            if (limit[0] === '=') {
                                // dummy variable: 
                                var x = new Expression.Symbol.Real(limit[1]);
                                
                                // lower limit
                                var a = evaluate(limit[2]);
                                var summinator = new Expression.Sum.Real(x, a);
                                summinator.vars = {};
                                summinator.vars[x.symbol] = x;
                                return summinator;
                            }
                        }
                        break;
                }
                if (ast[0] === 'default' && ast1.vars) {
                    down(ast1.vars);
                        var result = ast1[ast[0]](evaluate(ast[2]));
                        delete result.vars;
                    return up(result);
                }
                return ast1[ast[0]](evaluate(ast[2]));
            }
            if (ast.length === 2) {
                switch (ast[0]) {
                    case 'sqrt':
                        return Global.sqrt.default(evaluate(ast[1]));
                }
                
                return evaluate(ast[1])[ast[0]]();
            }
            if (ast.length === 4) {
                return evaluate(ast[1])[ast[0]](evaluate(ast[1]), evaluate(ast[2]));
            }
        }
        return ast;
    }
    
    
    // Parse using context free grammar ([graph]/grammar/calculator.jison)
    var ast = this.cfg.parse(s);
    var result = evaluate(ast);
    result._ast = ast;
    if (root !== context) {
        throw('Context still open');
    }
    
    result.unbound = free;
    result.bound = bound;
    return result;
};



})()
},{"../Expression":5,"../global":9}],24:[function(require,module,exports){
var util = require('util'),
    sup  = require('../'),
    Expression = require('../');

module.exports = List;

util.inherits(List, sup);

/*
    Expression.List should be avoided whenever Expression.List.Real can
    be used. However, knowing when to use Real is an impossible (?) task,
    so sometimes this will have to do as a fallback.
*/
function List(e, operator) {
    e.__proto__ = Expression.List.prototype;
    e.operator = operator;
    return e;
}

List.prototype._s = function (Code, lang) {
    if(lang === 'text/latex') {
        return Expression.List.Real.prototype._s.apply(this, arguments);
    }
    throw(new Error('Use real(), imag(), or abs(), or arg() first.'));
};


},{"util":10,"../":5}],28:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../global');

module.exports = Symbol;

util.inherits(Symbol, sup);

function Symbol(str) {
    this.symbol = str;
}

var _ = Symbol.prototype;

_.differentiate = function (x) {
    return this === x ? Global.One : Global.Zero;
};
_.integrate = function (x) {
    if (this === x) {
        return new Expression.NumericalReal(0.5, 0) ['*'] (x ['^'] (new Expression.NumericalReal(2,0)));
    }
    return (this) ['*'] (x);
};
_.sub = function (x, y) {
    // TODO: Ensure it is real (for Expression.Symbol.Real)
    return this === x ? y : this;
};

_._s = function (Code, x) {
    return new Code(this.symbol || 'x_{free}');
};
})()
},{"util":10,"../":5,"../../global":9}],30:[function(require,module,exports){
var util = require('util');
var sup  = require('../');
var Expression = require('../');

module.exports = EFunction;

util.inherits(EFunction, sup);

function EFunction (p) {
    this.default = p.default;
    this['text/latex'] = (p['text/latex']);
    this['x-shader/x-fragment'] = (p['x-shader/x-fragment']);
    this['text/javascript'] = (p['text/javascript']);
    this.derivative = p.derivative;
    this.realimag = p.realimag;
};

var _ = EFunction.prototype;

// @abstract
_.default = function (argument) {
    return;
};

// @abstract
_.differentiate = function () {
    if (this.derivative) {
        return this.derivative;
    }
    throw new Error('EFunction has no derivative defined.');
};

_._s = function (Code, lang) {
    if (this[lang]) {
        return new Code(this[lang]);
    }
    throw new Error('Could not compile function into ' + lang);
};

_['+'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['+'](x), [a]);
};

_['@-'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['@-'](), [a]);
};


},{"util":10,"../":5}],31:[function(require,module,exports){
var util = require('util');
var sup  = require('../');

function TruthValue(v) {

}

module.exports = Statement;

util.inherits(TruthValue, sup);
util.inherits(Statement, sup);

var _ = TruthValue.prototype;

var True = TruthValue.True = new TruthValue();
var False = TruthValue.False = new TruthValue();

//Only difference: NOT operator
False['~'] = function () {
    return True;
};

// negation operator
_['~'] = function () {
    return False;
};

// disjunction
_.V = function (e) {
    return e === True ? e : this;
};

// conjunction
_['^'] = function (e) {
    return e === True ? this : e;
};


function Statement(x, y, operator) {
    this.a = x;
    this.b = y;

    this.operator = operator;
}

var _ = Statement.prototype;
_['='] = function () {
    
};
_['<'] = function () {
    // a < b < c
    // (a < b) = b
    // b < c
    
    // a < (b < c)
    // a < b .. (b < c) = b
    // (a < b) = a.
};
_.solve = function (vars) {
    // a = b
    // If b has an additive inverse?
    
    // a - b = 0
    var a_b = (this.a)['-'](this.b);
    /*
    Examples:
    (1,2,3) - (x,y,z) = 0 (solve for x,y,z)
    (1,2,3) - x = 0 (solve for x)
    */
    return a_b.roots(vars);
};

},{"util":10,"../":5}],32:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression  = require('../');
var Global = require('../../global');

module.exports = Vector;

function Vector(e) {
    e.__proto__ = Vector.prototype;
    return e;
}

util.inherits(Vector, sup);

var _ = Vector.prototype;

_[',.'] = function (x) {
    return Vector(Array.prototype.concat.call(this, [x]));
};

_.differentiate = function (x) {
    return Vector(Array.prototype.map.call(this, function (c) {
        return c.differentiate(x);
    }));
};
_.cross = function (x) {
    if (this.length !== 3 || x.length !== 3) {
        throw('Cross product only defined for 3D vectors.');
    }
    /*
    i   j    k
    x   y    z
    a   b    c
    
    = (yc - zb, za - xc, xb - ya)
    */
    
    return new Vector([
        this[1].default(x[2])['-'](this[2].default(x[1])),
        this[2].default(x[0])['-'](this[0].default(x[2])),
        this[0].default(x[1])['-'](this[1].default(x[0]))
    ]);
};

// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = _.cross;
_.default = function (x) {
    var l = this.length;
    if (x instanceof Vector) {
        // Dot product
        if(l !== x.length) {
            throw('Vector Dimension mismatch.');
        }
        var i;
        var sum = Global.Zero;
        for (i = 0; i < l; i++) {
            sum = sum['+'](
                (this[i]).default(x[i])
            );
        }
        return sum;
    } else {
        return Vector(Array.prototype.map.call(this, function (c) {
            return c.apply(x);
        }));
    }
};
_['*'] = _.default;
_['+'] = function (x, op) {
    var l = this.length;
    if(l !== x.length) {
        throw(new MathError('Vector Dimension mismatch.'));
    }
    var i;
    var n = new Array(l);
    for (i = 0; i < l; i++) {
        n[i] = this[i][op || '+'](x[i]);
    }
    return Vector(n);
};
_['-'] = function (x) {
    return this['+'](x, '-');
};
_['/'] = function (x) {
    if (x instanceof Vector) {
        throw('Vector division not defined');
    }
    return Vector(Array.prototype.map.call(this, function (c) {
        return c['/'](x);
    }));
    
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {
        if(x.a === 0) {
            throw('Raised to zero power');
        }
        if(x.a === 1) {
            return this;
        }
        if (x.a === 2) {
            var S = Global.Zero;
            var i, l = this.length;
            for (i = 0; i < l; i++) {
                S = S['+'](this[i]['^'](x));
            }
            return S;
        } else {
            return this['^'](new Expression.Integer(x.a - 1))['*'](this);
        }
    } else if(x instanceof Expression.Rational){
        return this['^'](x.a)['^'](Global.One['/'](x.b));
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.Complex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for Vector ^');
    }
    return this.default(this['^'](x['-'](Global.One)));
};

_.old_apply_operator = function(operator, e) {
    var l = this.length;
    var i;
    switch (operator) {
        case ',':
            //Array.prototype.push.apply(this, [e]);
            //Faster:
            //MODIFIES!!!!!!!!!
            this[l] = e;
            return this;
        case undefined:
        case '*':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var sum = M.Global.Zero;
            for (i = 0; i < l; i++) {
                sum = sum.apply('+', this[i].apply('*', e[i]));
            }
            return sum;
        case '+':
        case '-':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var n = new Array(l);
            for (i = 0; i < l; i++) {
                n[i] = this[i].apply(operator, e[i]);
            }
            return Vector(n);
        case '/':
        case '^':
            break;
        default:
            throw('Vector operation not allowed.');
    }
};

_.realimag = function(){
    var l = this.length;
    var _x = new Array(l);
    var _y = new Array(l);
    var i;
    for(i = 0; i < l; i++) {
        var ri = this[i].realimag();
        _x[i] = ri[0];
        _y[i] = ri[1];
    }
    return Expression.List.ComplexCartesian([
        Vector(_x),
        Vector(_y)
    ]);
};

_._s = function(Code, lang) {
    var l = this.length;
    var open = '[';
    var close = ']';
    if(lang === 'x-shader/x-fragment') {
        open = 'vec' + this.length + '(';
        close = ')';
    }
    var c = this[0]._s(Code, lang);
    var i;
    var t_s = [];
    for (i = 0; i < l; i++) {
        var c_i = this[i]._s(Code, lang);
        t_s.push(c_i.s);
        c = c.merge(c_i);
    }
    return c.update(open + t_s.join(',') + close, Infinity);
};
})()
},{"util":10,"../":5,"../../global":9}],33:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');

module.exports = Matrix;

function Matrix(e, r, c) {
    e.__proto__ = Matrix.prototype;

    e.rows = r;
    e.cols = c;

    if (r != c) {
        throw new Error('Matrix size mismatch')
    }

    return e;
}

util.inherits(Matrix, sup);

var _ = Matrix.prototype;

_.default = _['*'] = function (x) {
    if(x.constructor === Expression.Matrix) {
        // Broken
        // O(n^3)
        if (x.rows !== this.cols) {
            throw ('Matrix dimensions do not match.');
        }
        var result = [];
        // result[x.rows * x.cols - 1 ] = undefined;
        var i, j, k, r = 0;
        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < x.cols; j++) {
                var sum = Global.Zero;
                for(k = 0; k < x.rows; k++) {
                    sum = sum['+'](x[k * x.cols + j]);
                }
                result[r++] = sum;
            }
        }
        return Expression.Matrix(result);
    } else {
        throw ('Unknown type');
    }
};

_.reduce = function (app) {
    var x, y;
    for(y = 0; y < this.rows; y++) {
        for(x = 0; x < y; x++) {
            // Make this[x,y] = 0
            var ma = this[x * this.cols + x];
            // 0 = this - (this/ma) * ma
            if(ma === Global.Zero) {
                throw ('Row swap!');
            }
            var tma = this[y * this.cols + x]['/'](ma);
            var i;
            for (i = x + 1; i < this.cols; i++) {
                this[y * this.cols + i] = this[y * this.cols + i]['-'](tma['*'](this[x * this.cols + i]));
            }
        }
    }
    return this;
};


},{"util":10,"../":5}],35:[function(require,module,exports){
(function(){var util  = require('util'),
    sup   = require('../'),
    Global = require('../../global'),
    Expression = require('../');

module.exports = Infinitesimal;
util.inherits(Infinitesimal, sup);
function Infinitesimal(x) {
    this.x = x;
}
var _ = Infinitesimal.prototype;

_['+'] = function (x) {
    if(x instanceof Infinitesimal) {
        throw new Error('Infinitesimal addition');
    }
    return x;
};
_['/'] = function (x) {
    if(x instanceof Infinitesimal) {
        if(x.x instanceof Expression.Symbol) {
            return this.x.differentiate(x.x);
        }
        throw new Error('Confusing infitesimal division');
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
        throw new Error('Infinitesimal numbers cannot be exported to programming languages');
    }
    var c = this.x.s(lang);
    var p = language.precedence('default')
    if(p > c.p) {
        c.s = '\\left(' + c.s + '\\right)';
    }
    return c.update('d' + c.s, p);
};

})()
},{"util":10,"../":5,"../../global":9}],25:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression = require('../../');
var global = require('../../../global')


module.exports = ListReal;

util.inherits(ListReal, sup);

function ListReal(x, operator) {
    x.__proto__ = ListReal.prototype;
    if(operator !== undefined) {
        x.operator = operator;
    }
    return x;
}

var _ = ListReal.prototype;

_.realimag = function (){
    return sup.ComplexCartesian([
        this,
        global.Zero
    ]);
};
_.real = function (){
    return this;
};
_.imag = function (){
    return global.Zero;
};
_.polar = function () {
    return sup.ComplexPolar([
        sup.Real([global.abs, this]),
        sup.Real([global.arg, this])
    ]);
};
_.abs = function (){
    return sup.Real([global.abs, this]);
};
_.arg = function (){
    return sup.Real([global.arg, this]);
};
_['+'] = function (x) {
    if(this === x) {
        return x['*'](new Expression.Integer(2));
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '+' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], this[1]['+'](x)], this.operator);
        }
        if(this.operator === '-' && this[1] instanceof Expression.NumericalReal) {
            return sup.Real([this[0], x['-'](this[1])], '+');
        }
        
        return sup.Real([this, x], '+');
    }
    
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '+');
    }
    return x['+'](this);
    
};
_['-'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return this;
        }
    }
    
    if (x === this) {
        return global.Zero;
    }
    if (x instanceof sup.Real) {
        if (x.operator === '@-') {
            return sup.Real([this, x[0]], '+');
        }
        return sup.Real([this, x], '-');
    }
    if (x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return sup.Real([this, x], '-');
    }
    return this.realimag()['-'](x);
};
_['*'] = function (x) {
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return global.Zero;
        }
    }
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['*'](x), this[1]], this.operator);
        }
        return sup.Real([x, this], '*');
    }
    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        if (this[0] instanceof Expression.Function) {
            
        }
        return sup.Real([this, x], '*');
    }
    return x['*'](this);
    
};
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }

    if(x === this) {
        return global.One;
    }

    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/') {
            return sup.Real([this[0]['/'](x), this[1]], this.operator);
        }
        return sup.Real([this, x], '/');
    }

    if(x instanceof sup.Real || x instanceof Expression.Symbol.Real) {
        return sup.Real([this, x], '/');
    }
    return this.realimag()['/'](x);
};
_['%'] = function (x) {
    return sup.Real([this, x], '%');
};
_['@-'] = function () {
    if(this.operator === '@-') {
        return this[0];
    }
    return sup.Real([this], '@-');
};
_['^'] = function (x) {
    if(x instanceof Expression.NumericalReal) {
        if(this.operator === '*' || this.operator === '/' && this[0] instanceof Expression.NumericalReal) {
            return sup.Real([this[0]['^'](x), this[1]['^'](x)], this.operator);
        }
    }
    return Expression.Symbol.Real.prototype['^'].call(this, x);
    
};

_.differentiate = function (x) {

    if (this.operator === '+' ||
        this.operator === '-' ||
        this.operator === '@-') {

        return this[0].differentiate(x)[this.operator](this[1] && this[1].differentiate(x));
    
    } else if (this.operator === '*' || this.operator === undefined) {

        if(this[0] instanceof Expression.Function) {

            var da = this[1].differentiate(x);
            if(da === global.Zero) return da;

            return this[0].differentiate().default(this[1])['*'](da);
        }

        return this[0][this.operator](
            this[1].differentiate(x)
        )['+'](this[1][this.operator](
            this[0].differentiate(x)
        ));

    } else if (this.operator === '/') {

        return this[1]['*'](
            this[0].differentiate(x)
        )['-'](
            this[0]['*'](
                this[1].differentiate(x)
            )
        )[this.operator](
            this[1]['*'](this[1])
        );
    } else if (this.operator === '^') {

        var df = this[0].differentiate(x);
        var dg = this[1].differentiate(x);

        if (df === global.Zero) {
            if (dg === global.Zero) return dg;

            return dg.default(
                global.log.default(this[0])
            ).default(this);
        }

        var fa = this[0]['^'](
            this[1]['-'](global.One)
        );

        return fa.default(
            df.default(this[1])['+'](
                this[0]['*'](
                    global.log.default(this[0])
                )['*'](
                    dg
                )
            )
        );
    }
};

_._s = function (Code, lang) {

    var language = Code.language;
    function paren(x) {
        if(lang === 'text/latex') {
            return '\\left(' + x + '\\right)'; 
        }
        return '(' + x + ')';
    }
    if (this.operator === undefined) {
        if (this[0] instanceof Expression.Function) {
            if(this[0] === global.abs) {

                var c1 = this[1]._s(Code, lang);

                if(lang === 'text/latex') {
                    return c1.update('\\left|' + c1.s + '\\right|', Infinity);
                }
                var c0 = this[0]._s(Code, lang);
                return c1.update(c0.s + '(' + c1.s + ')', Infinity);
            }
            var c0 = this[0]._s(Code, lang);
            if (this[1] instanceof Expression.Vector) {
                var c1s = Array.prototype.map.call(this[1], function (c) {
                    return c._s(Code, lang);
                });
                var i;
                var t_s = c1s.map(function (e){
                    return e.s;
                });
                if(this[0] === global.atan) {
                    t_s = t_s.reverse();
                }
                var c0_s = c0.s;
                for (i = 0; i < c1s.length; i++) {
                    c0.merge(c1s[i]);
                }
                return c0.update(c0_s + paren(t_s), language.operators.default.precedence);
            }
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, c0.s + paren(c1.s), language.operators.default.precedence);
        } else {
            this.operator = '*';
        }
    }
    var p = language.operators[this.operator].precedence;
    function _(x) {
        if(p > x.p){
            return paren(x.s);
        }
        return x.s;
    }

    if(this.operator === '^') {

        if(lang === 'x-shader/x-fragment') {
            if(this[0] === global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('exp(' + c1.s + ')');
            }
            if(this[1] instanceof Expression.Integer && this[1].a < 5 && this[1].a > -1) {
                var c0 = this[0]._s(Code, lang);
                var j = language.operators['*'].precedence;
                
                var pre = undefined;
                var cs;
                if(this[0] instanceof Expression.Symbol) {
                    cs = c0.s;
                } else {
                    
                    cs = c0.variable();
                    
                    pre = 'float ' + cs + ' = ' + c0.s + ';';
                
                }
                var s = cs;
                var i;
                for(i = 1; i < this[1].a; i++) {
                    s+= '*' + cs;
                }
                return c0.update('(' + s + ')', Infinity, pre);
            }
            if(this[1] instanceof Expression.Integer && this[1].a == -1) {
                var c0 = this[0]._s(Code, lang);
                // todo: precedence not necessary
                return c0.update('(1.0/(' + c0.s + '))');
            }
            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                // unsure it is gcd
                this[1] = this[1].reduce();
                var even = this[1].a % 2 ? false : true;
                if(even) {
                    var c1 = this[1]._s(Code, lang);
                    var c0 = this[0]._s(Code, lang);
                    
                    return c0.merge(c1, 'pow(' + c0.s + ',' + c1.s  + ')');
                } else {

                    // x^(a) = (x) * x^(a-1)
                    var c1 = this[1]['-'](global.One)._s(Code, lang);
                    var c0 = this[0].s_(Code, lang);
                    
                    return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
                }
            }
            if (this[0] instanceof Expression.NumericalReal) {

                // Neg or pos.
                var c1 = this[1]['-'](global.One)._s(Code, lang);
                var c0 = this[0]._s(Code, lang);
                
                return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
                
            }
            var c1 = this[1]['-'](global.One)._s(Code, lang);
            var c0 = this[0]._s(Code, lang);
                
            // Needs a new function, dependent on power.
            return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
            
        } else if(lang === 'text/javascript') {
            if(this[0] === global.e) {
                var c1 = this[1]._s(Code, lang);
                return c1.update('Math.exp(' + c1.s + ')');
            }

            var c1 = this[1]._s(Code, lang);
            var c0 = this[0]._s(Code, lang);

            if(this[1] instanceof Expression.Rational) {
                // a^2, 3, 4, 5, 6 
                var even = this[1].a % 2 ? false : true;

                if(even) {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                } else {
                    return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
                }
            } else {
                
                // Needs a new function, dependent on power.
                return c0.merge(c1, 'Math.pow(' + c0.s + ',' + c1.s + ')');
            }
            
        } else if (lang === 'text/latex'){
            var c0 = this[0]._s(Code, lang);
            var c1 = this[1]._s(Code, lang);
            return c0.merge(c1, _(c0) + '^' + '{' + c1.s + '}')
        }
    }

    var c0 = this[0]._s(Code, lang);

    if(this.operator[0] === '@') {
        return c0.update(this.operator[1] + _(c0), p);
    }

    var c1 = this[1]._s(Code, lang);
    
    if(lang === 'text/latex') {
        if(this.operator === '/') {
            return c0.merge(c1, '\\frac{' + c0.s + '}{' + c1.s + '}')
        }
        if(this.operator === '*') {
            return c0.merge(c1, _(c0) + _(c1), p);
        }
    } else if (lang === 'x-shader/x-fragment') {
        if(this.operator === '%') {
            return c0.merge(c1, 'mod(' + _(c0) + ',' + _(c1) + ')', p);
        }
    }

    return c0.merge(c1, _(c0) + this.operator + _(c1), p);
};


})()
},{"util":10,"../":24,"../../../global":9,"../../":5}],26:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util'),
    sup  = require('../'),
    Expression = require('../../');

module.exports = ComplexPolar;

util.inherits(ComplexPolar, sup);

function ComplexPolar (x){
    x.__proto__ = ComplexPolar.prototype;
    return x;
}
var _ = ComplexPolar.prototype;

_.polar = function(){
    return this;
};
_.realimag = function() {
    //TODO: Return Expression.List.ComplexCartesian
    return Expression.List.ComplexCartesian([
        this[0].apply('*', Global.cos.apply(undefined, this[1])),
        this[0].apply('*', Global.sin.apply(undefined, this[1]))
    ]);
};
_.real = function() {
    return this[0].apply('*', Global.cos.apply(undefined, this[1]));
};
_.imag = function() {
    return this[0].apply('*', Global.sin.apply(undefined, this[1]));
};
_.conjugate = function() {
    return ComplexPolar([
        this[0],
        this[1].apply('@-')
    ]);
};
_.differentiate = function(x){
    // d/dx a(x) * e^(ib(x))
    
    //TODO ensure below  f' + if g' part is realimag (f', fg')
    return Global.e
    .apply(
        '^',
        Global.i
        .apply('*',
            this[1]
        )
    )
    .apply('*',
        this[0].differentiate(x)
        .apply('+',
            Global.i
            .apply('*',
                this[0]
            )
            .apply('*',
                this[1].differentiate(x)
            )
        )
    );
};
// _.apply = function(o, x) {
//     if (x.constructor === this.constructor) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x[0]),
//                     this[1].apply('+', x[1])
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x[0]),
//                     this[1].apply('-', x[1])
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.NumericalReal) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', x),
//                     this[1]
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', x),
//                     this[1]
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //Fast:
//                 return Expression.List.ComplexPolar([
//                     this[0],
//                     this[1].apply('*', x)
//                 ]);
//             case '!':
//             default:
            
//         }
//     } else if (x.constructor === Expression.Complex) {
//         switch (o) {
//             case undefined:
//             case '*':
//                 //Fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('*', new Expression.NumericalReal(x._real)),
//                     this[1].apply('+', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '/':
//                 //Also fast
//                 return Expression.List.ComplexPolar([
//                     this[0].apply('/', new Expression.NumericalReal(x._real)),
//                     this[1].apply('-', new Expression.NumericalReal(x._imag))
//                 ]);
//             case '+':
//             case '-':
//                 //Very slow, maybe we should switch to cartesian now?
            
//             case '^':
//                 //(Ae^(ik)) ^ (Be^(ij))
//                 //How slow is this?
//                 //Very fast for real numbers though
//             case '!':
//             default:
            
//         }
//     }
    
// };
_.abs = function (){
    return this[0];
};
_.arg = function (){
    return this[1];
};

},{"util":10,"../":24,"../../":5}],27:[function(require,module,exports){
// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');

/*
    This type is an attempt to avoid having to call .realimag() down the tree all the time.
    
    Maybe this is a bad idea, because it will end up having:
    
    f(x) = >
    [
        Re_f(x),
        Im_f(x)
        
    ]
    which requires two evaluations of f(x).

*/

module.exports = ComplexCartesian;

util.inherits(ComplexCartesian, sup);

function ComplexCartesian(x) {
    x.__proto__ = ComplexCartesian.prototype;
    return x;
}

var _ = ComplexCartesian.prototype;

_.realimag = function () {
    return this;
};
_.real = function () {
    return this[0];
};
_.imag = function () {
    return this[1];
};
_.conjugate = function () {
    return ComplexCartesian([
        this[0],
        this[1].apply('@-')
    ]);
};

_['@-'] = function (x) {
    return new ComplexCartesian([
        this[0]['@-'](),
        this[1]['@-']()
    ]);
};
_['*'] = function (x) {
    if (x instanceof ComplexCartesian) {
        // (a+bi) * (c+di) = ac + adi + bci - bd
        return new ComplexCartesian([
            this[0]['*'](x[0])['-'](this[1]['*'](x[1])),
            this[0]['*'](x[1])['+'](this[1]['*'](x[0]))
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['*'](x),
            this[1]['*'](x)
        ]);
    }
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {

        if(x instanceof Expression.Rational) {
            if(x.a === x.b) {
                return this;
            }
        }

        if(x instanceof Expression.Rational) {
            if(x.a === 0) {
                return Global.One;
            }
        }
        
        // Binomial expansion
        // (a+b)^N
        var n  = x.a;
        var k;
        var a = this[0];
        var b = this[1];
        var negone = new Expression.Integer(-1);
        var imag_part = Global.Zero;
        
        var real_part = a['^'](
            new Expression.Integer(n)
        );
        
        var ci = 1;
        
        for (k = 1;; k++) {
            var expr;
            if(k === n) {
                expr = (
                    b['^'](
                        new Expression.Integer(k)
                    )
                );
                
                if (ci === 0) {
                    real_part = real_part['+'](expr);
                } else if (ci === 1) {
                    imag_part = imag_part['+'](expr);
                } else if (ci === 2) {
                    real_part = real_part['-'](expr);
                } else if (ci === 3) {
                    imag_part = imag_part['-'](expr);
                    ci = -1;
                }
            
                
                break;
            }
            expr = a['^'](
                new Expression.Integer(n - k)
            )['*'](
                b['^'](
                    new Expression.Integer(k)
                )
            );
            if (ci === 0) {
                real_part = real_part['+'](expr);
            } else if (ci === 1) {
                imag_part = imag_part['+'](expr);
            } else if (ci === 2) {
                real_part = real_part['-'](expr);
            } else if (ci === 3) {
                imag_part = imag_part['-'](expr);
                ci = -1;
            }
            
            ci++;
        }
        return new ComplexCartesian([
            real_part,
            imag_part
        ]);
    }
    return new Expression.List([this, x], '^');
};
_['+'] = function (x) {
    if (x instanceof ComplexCartesian) {
        return new ComplexCartesian([
            this[0]
        ]);
    }
    if (x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real || x instanceof Expression.NumericalReal) {
        return new ComplexCartesian([
            this[0]['+'](x),
            this[1]
        ]);
    }
    
};

_.differentiate = function (x) {
    return ComplexCartesian([
        this[0].differentiate(x),
        this[1].differentiate(x)
    ]);
};


// _.applyOld = function(o, x) {
//     //TODO: ensure this has an imaginary part. If it doesn't it is a huge waste of computation
//     if (x.constructor === this.constructor) {
//         switch(o) {
//             case '+':
//             case '-':
//                 return ComplexCartesian([
//                     this[0].apply(o, x[0]),
//                     this[1].apply(o, x[1])
//                 ]);
//             case undefined:
//                 //Function evaluation? NO. This is not a function. I think.
//             case '*':
//                 return ComplexCartesian([
//                     this[0].apply('*', x[0]).apply('-', this[1].apply('*', x[1])),
//                     this[0].apply('*', x[1]).apply('+', this[1].apply('*', x[0]))
//                 ]);
//             case '/':
//                 var cc_dd = x[0].apply('*', x[0]).apply('+', x[1].apply('*', x[1]));
//                 return ComplexCartesian([
//                     (this[0].apply('*',x[0]).apply('+',this[1].apply('*',x[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',x[0]).apply('-',this[0].apply('*',x[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //The most confusing of them all:
//                 var half = new Expression.NumericalReal(0.5, 0);
//                 var hlm = half.apply('*',
//                     Global.log.apply(undefined,
//                         //The magnitude: if this was for a polar one it could be fast.
//                         this[0].apply('*',
//                             this[0]
//                         ).apply('+',
//                             this[1].apply('*',
//                                 this[1]
//                             )
//                         )
//                     )
//                 );
//                 var theta = Global.atan2.apply(undefined, Expression.Vector([this[1], this[0]]));
//                 var hmld_tc = hlm.apply('*', x[1]).apply('+', theta.apply('*', x[0]));
                
//                 var e_hmlc_td = Global.exp.apply(undefined,
//                     hlm.apply('*',
//                         b[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             b[1]
//                         )
//                     )
//                 );
                

//                 var e_hmlc_td = Global.e.apply('^',
//                     hlm.apply('*',
//                         x[0]
//                     ).apply('-',
//                         theta.apply('*',
//                             x[1]
//                         )
//                     )
//                 );

//                 return ComplexCartesian([
//                     (e_hmlc_td.apply('*',Global.cos.apply(undefined, hmld_tc))),
//                     (e_hmlc_td.apply('*',Global.sin.apply(undefined, hmld_tc)))
//                 ]);
//             case '!':
//                 break;
//             default:
//         }
//     } else if (x.constructor === Expression.List.ComplexPolar){
//         switch (o) {
//             case '*':
//             case '/':
//                 //(x+yi)/A*e^(ik)
//                 var cc_dd = x[0].apply('*', x[0]);
//                 var b = x.realimag();
//                 //Clean this up? Sub?
//                 return ComplexCartesian([
//                     (this[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
//                     (this[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
//                 ]);
//             case '^':
//                 //http://www.wolframalpha.com/input/?i=Re%28%28x%2Byi%29%5E%28A*e%5E%28ik%29%29%29
//                 //(x+yi)^(A*e^(ik))
//             case '+':
//             case '-':
//                 return this.apply(o, x.realimag());
//         }
//     } else if (x.constructor === Expression.Complex) {
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.Symbol.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     } else if (x.constructor === Expression.List.Real) {
//         console.error('Duplicated an x! This makes it difficult to solve complex equations, I think');
//         return this.apply(o, x.realimag());
//     }
//     throw('CMPLX.LIST * ' + o);
// };

},{"util":10,"../":24}],29:[function(require,module,exports){
(function(){var util = require('util'),
    sup  = require('../'),
    Global = require('../../../global');

var Expression = require('../../');

module.exports = Symbol_Real;

util.inherits(Symbol_Real, sup);

function Symbol_Real(str) {
    this.symbol = str;
}

var _ = Symbol_Real.prototype;

_.realimag = function() {
    return Expression.List.ComplexCartesian([this, Global.Zero]);
};
_.real = function() {
    return this;
};
_.imag = function() {
    return Global.Zero;
};
_.polar = function() {
    return Expression.List.ComplexPolar([
        Expression.List.Real([Global.abs, this]),
        Expression.List.Real([Global.arg, this])
    ]);
};
_.abs = function() {
    return Expression.List.Real([Global.abs, this]);
};
_.arg = function() {
    return Expression.List.Real([Global.arg, this]);
};

_['+'] = function (x) {
    if (x === Global.Zero) {
        return this;
    }

    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '+');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '+');
    }
    return x['+'](this);
};
_['-'] = function (x) {
    if(this === x) {
        return Global.Zero;
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.List.Real) {
        if (x.operator === '@-') {
            return new Expression.List.Real([this, x[0]], '+');
        }
        return new Expression.List.Real([this, x], '-');
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '-');
    }
    
    return x['@-']()['+'](this);
};

_['@+'] = function (x) {
    return Expression.List.Real([this], '@+');
};

_['@-'] = function (x) {
    return Expression.List.Real([this], '@-');
};

_['*'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.Zero;
        }
    }
    if(x instanceof Expression.Symbol.Real) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.Real) {
        return x['*'](this);
    }
    if(x instanceof Expression.Symbol) {
        return new Expression.List([this, x], '*');
    }
    if(x instanceof Expression.NumericalReal) {
        return new Expression.List.Real([x, this], '*');
    }
    if(x instanceof Expression.NumericalComplex) {
        return new Expression.List.Real([this, x], '*');
    }
    if(x instanceof Expression.List.ComplexCartesian) {
        return x['*'](this);
    }
    return x['*'](this);
};
_.apply = _['*'];
_['/'] = function (x) {

    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            throw('Division by zero');
        }
    }
    
    return Expression.List.Real([this, x], '/');
};
_['^'] = function (x) {
    if(x instanceof Expression.Rational) {
        if(x.a === 0) {
            return Global.One;
        }
    }
    
    if(x instanceof Expression.Rational) {
        if(x.a === x.b) {
            return this;
        }
    }
    if (x instanceof Expression.Integer) {
        return Expression.List.Real([this, x], '^');
    } else if(x instanceof Expression.Rational) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return Expression.List.Real([this, x], '^');
        }
    }
    return Expression.List([this, x], '^');
};
_['%'] = function (x) {
    return Expression.List.Real([this, x], '%');
};
_.applyOld = function(operator, e) {
    throw("Real.apply");
    // if (operator === ',') {
    //     //Maybe this should be a new object type??? Vector?
    //     console.log('APPLY: ', this.constructor, this, e);
    //     return Expression.Vector([this, e]);
    // } else if (operator === '=') {
    //     return Expression.Equation([this, e], operator);
    // }
    // if (e === undefined) {
    //     //Unary:
    //     switch (operator) {
    //         case '!':
    //             //TODO: Can't simplify, so why bother! (return a list, since gamma maps all reals to reals?)
    //             return Global.Gamma.apply(undefined, this.apply('+', Global.One));
    //         case '@-':
    //             return Expression.List.Real([this], operator);
    //         default:
    //     }
    //     throw('Real Symbol('+this.symbol+') could not handle operator '+ operator);
    // } else {
    //     // Simplification:
    //     switch (e.constructor){
    //         case Expression.Symbol.Real:
    //         case Expression.List.Real:
    //             /*if(this.positive && e.positive) {
    //                 return Expression.List.Real([this, e], operator);
    //             }*/
    //             switch(operator) {
    //                 case '^':
    //                     //TODO: Bad idea? This will stay in this form until realimag() is called by user, and user only.
    //                     //return Expression.List([this, e], operator);
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
    //                 case undefined:
    //                     return Expression.List.Real([this, e], '*');
    //                 default:
    //                     return Expression.List.Real([this, e], operator);
    //             }
    //         case Expression.NumericalReal:
    //             switch(operator){
    //                 case '+':
    //                 case '-':
    //                     if(e.value === 0){
    //                         return this;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //                 case undefined:
    //                 case '*':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Zero;
    //                     }
    //                     return Expression.List.Real([this, e], '*');
    //                     break;
    //                 case '%':
    //                     return Expression.List.Real([this, e], '%');
    //                 case '^':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.One;
    //                     }
    //                     if(false && opengl_TODO_hack() && e.value === ~~e.value){
    //                         return Expression.List.Real([this, e], operator);
    //                     }
    //                     return Expression.List.ComplexPolar([
    //                         Expression.List.Real([Expression.List.Real([Global.abs, this]), e],'^'),
    //                         Expression.List.Real([e, Expression.List.Real([Global.arg, this])],'*')
    //                     ]);
                        
    //                     break;
    //                 case '/':
    //                     if(e.value === 1){
    //                         return this;
    //                     } else if(e.value === 0){
    //                         return Global.Infinity;
    //                     }
    //                     return Expression.List.Real([this, e], operator);
    //                     break;
    //             }
    //             break;
    //         case Expression.Complex:
    //             return this.realimag().apply(operator, e); // GO to above (will apply reals)
    //             break;
    //         case Expression.List.ComplexCartesian:
    //             //Maybe there is a way to swap the order? (e.g. a .real = true property for other things to check)
    //             //or instance of Expression.Real ?
    //             switch(operator) {
    //                 case '+':
    //                 case '-':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         e[1]
    //                     ]);
    //                 case undefined:
    //                     operator = '*';
    //                 case '*':
    //                     return Expression.List.ComplexCartesian([
    //                         this.apply(operator, e[0]),
    //                         this.apply(operator, e[1])
    //                     ]);
    //                 case '/':
    //                     var cc_dd = e[0].apply('*',e[0]).apply('+',e[1].apply('*',e[1]));
    //                     return Expression.List.ComplexCartesian([
    //                         (this.apply('*',e[0])).apply('/', cc_dd),
    //                         this.apply('*',e[1]).apply('/', cc_dd).apply('@-')
    //                     ]);
    //             }
    //         case Expression.List.ComplexPolar:
    //             //Maybe there is a way to swap the order?
    //             return this.polar().apply(operator, e);
    //     }
    //     throw('LIST FROM REAL SYMBOL! '+ operator, e.constructor);
    //     return Expression.List([this, e], operator);
    // }
};


})()
},{"util":10,"../":28,"../../../global":9,"../../":5}],34:[function(require,module,exports){
var util = require('util'),
    sup = require('../'),
    Expression = require('../../');

module.exports = SymbolicEFunction;

util.inherits(SymbolicEFunction, sup);

function SymbolicEFunction(expr, vars) {
    this.expr = expr;
    this.symbols = vars;
    
};
var _ = SymbolicEFunction.prototype;
_.default = function (x) {
    if (x.constructor !== Expression.Vector) {
        x = Expression.Vector([x]);
    }
    var expr = this.expr;
    var i, l = this.symbols.length;
    if (l !== x.length) {
        throw ('Invalid domain. Element of F^' + l + ' expected.');
    }
    for(i = 0; i < l; i++) {
        expr = expr.sub(this.symbols[i], x[i])
    }
    return expr;
};
},{"util":10,"../":30,"../../":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FcnJvci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9nbG9iYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvZGVmYXVsdC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2dyYW1tYXIvcGFyc2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL2dsb2JhbC9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0NvbnRleHQvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2ZzLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9wYXRoLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0xhbmd1YWdlL0NvZGUuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2Uvc3RyaW5naWZ5LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vQ29uc3RhbnQuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9OdW1lcmljYWxDb21wbGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTnVtZXJpY2FsUmVhbC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1JhdGlvbmFsLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vSW50ZWdlci5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9wYXJzZS5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0xpc3QvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9TeW1ib2wvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9GdW5jdGlvbi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1N0YXRlbWVudC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1ZlY3Rvci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL01hdHJpeC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0luZmluaXRlc2ltYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L1JlYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L0NvbXBsZXhQb2xhci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0xpc3QvQ29tcGxleENhcnRlc2lhbi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1N5bWJvbC9SZWFsL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vRnVuY3Rpb24vU3ltYm9saWMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIE0gPSByZXF1aXJlKCcuL2xpYicpO1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgX00gPSB3aW5kb3cuTTtcbiAgICB3aW5kb3cuTSA9IE07XG4gICAgTS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cuTSA9IF9NO1xuICAgICAgICByZXR1cm4gTTtcbiAgICB9O1xufVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNO1xufVxuIiwiKGZ1bmN0aW9uKCl7Lypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuXG4vLyBub3Qgc3VyZSBpZiB0aGlzIGlzIHJlcXVpcmVkOlxuLypqc2hpbnQgc3ViOiB0cnVlICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRXhwcmVzc2lvbiAgPSByZXF1aXJlKCcuL0V4cHJlc3Npb24nKSxcbiAgICBDb250ZXh0ICAgICA9IHJlcXVpcmUoJy4vQ29udGV4dCcpLFxuICAgIE1hdGhFcnJvciAgID0gcmVxdWlyZSgnLi9FcnJvcicpLFxuICAgIGxhbmd1YWdlICAgID0gcmVxdWlyZSgnLi9MYW5ndWFnZS9kZWZhdWx0JyksXG4gICAgQ29kZSAgICAgICAgPSByZXF1aXJlKCcuL0xhbmd1YWdlJykuQ29kZSxcbiAgICBHbG9iYWwgICAgICA9IHJlcXVpcmUoJy4vZ2xvYmFsJyk7XG5cbi8vIERlZmluZSBzaW4sIGNvcywgdGFuLCBldGMuXG52YXIgZGVmYXVsdHMgICAgPSByZXF1aXJlKCcuL2dsb2JhbC9kZWZhdWx0cycpO1xuZGVmYXVsdHMuYXR0YWNoKEdsb2JhbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTTtcblxuZnVuY3Rpb24gTShlLCBjKSB7XG4gICAgcmV0dXJuIGxhbmd1YWdlLnBhcnNlKGUsIGMgfHwgR2xvYmFsKTtcbn1cblxuTS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBbXG4gICAgJ2Z1bmN0aW9uIE0oZXhwcmVzc2lvbiwgY29udGV4dCkgeycsXG4gICAgJyAgICAvKiEnLFxuICAgICcgICAgICogIE1hdGggSmF2YVNjcmlwdCBMaWJyYXJ5IHYzLjkuMScsXG4gICAgJyAgICAgKiAgaHR0cHM6Ly9naXRodWIuY29tL2FhbnR0aG9ueS9qYXZhc2NyaXB0LWNhcycsXG4gICAgJyAgICAgKiAgJyxcbiAgICAnICAgICAqICBDb3B5cmlnaHQgMjAxMCBBbnRob255IEZvc3Rlci4gQWxsIHJpZ2h0cyByZXNlcnZlZC4nLFxuICAgICcgICAgICovJyxcbiAgICAnICAgIFthd2Vzb21lIGNvZGVdJyxcbiAgICAnfSddLmpvaW4oJ1xcbicpO1xufTtcblxuTVsnQ29udGV4dCddICAgID0gQ29udGV4dDtcbk1bJ0V4cHJlc3Npb24nXSA9IEV4cHJlc3Npb247XG5NWydHbG9iYWwnXSAgICAgPSBHbG9iYWw7XG5NWydFcnJvciddICAgICAgPSBNYXRoRXJyb3I7XG5cbkV4cHJlc3Npb24ucHJvdG90eXBlLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgIENvZGUubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICBDb2RlLm5ld0NvbnRleHQoKTtcbiAgICByZXR1cm4gdGhpcy5fcyhDb2RlLCBsYW5nKTtcbn07XG5FeHByZXNzaW9uLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpcy5zKCd0ZXh0L2phdmFzY3JpcHQnKS5jb21waWxlKHgpO1xufVxuXG52YXIgZXh0ZW5zaW9ucyA9IHt9O1xuXG5NWydyZWdpc3RlciddID0gZnVuY3Rpb24gKG5hbWUsIGluc3RhbGxlcil7XG4gICAgaWYoRXhwcmVzc2lvbi5wcm90b3R5cGVbbmFtZV0pIHtcbiAgICAgICAgdGhyb3coJ01ldGhvZCAuJyArIG5hbWUgKyAnIGlzIGFscmVhZHkgaW4gdXNlIScpO1xuICAgIH1cbiAgICBleHRlbnNpb25zW25hbWVdID0gaW5zdGFsbGVyO1xufTtcblxuTVsnbG9hZCddID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XG4gICAgZXh0ZW5zaW9uc1tuYW1lXShNLCBFeHByZXNzaW9uLCBjb25maWcpO1xuICAgIGRlbGV0ZSBleHRlbnNpb25zW25hbWVdO1xufTtcblxufSkoKSIsImZ1bmN0aW9uIE1hdGhFcnJvcihzdHIpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBzdHI7XG59XG5NYXRoRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhFcnJvcjtcbiIsIihmdW5jdGlvbigpe3ZhciBnbG9iYWwgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWw7XG5cbn0pKCkiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLmlzRGF0ZSA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSd9O1xuZXhwb3J0cy5pc1JlZ0V4cCA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJ307XG5cblxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5wdXRzID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmRlYnVnID0gZnVuY3Rpb24oKSB7fTtcblxuZXhwb3J0cy5pbnNwZWN0ID0gZnVuY3Rpb24ob2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKSB7XG4gIHZhciBzZWVuID0gW107XG5cbiAgdmFyIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkge1xuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuICAgIHZhciBzdHlsZXMgPVxuICAgICAgICB7ICdib2xkJyA6IFsxLCAyMl0sXG4gICAgICAgICAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAgICAgICAgICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgICAgICAgICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAgICAgICAgICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgICAgICAgICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgICAgICAgICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICAgICAgICAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICAgICAgICAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICAgICAgICAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAgICAgICAgICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAgICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICAgJ3llbGxvdycgOiBbMzMsIDM5XSB9O1xuXG4gICAgdmFyIHN0eWxlID1cbiAgICAgICAgeyAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgICAgICAgICAnbnVtYmVyJzogJ2JsdWUnLFxuICAgICAgICAgICdib29sZWFuJzogJ3llbGxvdycsXG4gICAgICAgICAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgICAgICAgICAnbnVsbCc6ICdib2xkJyxcbiAgICAgICAgICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgICAgICAgICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgICAgICAgICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAgICAgICAgICdyZWdleHAnOiAncmVkJyB9W3N0eWxlVHlwZV07XG5cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgIHJldHVybiAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAgICdcXDAzM1snICsgc3R5bGVzW3N0eWxlXVsxXSArICdtJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG4gIGlmICghIGNvbG9ycykge1xuICAgIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkgeyByZXR1cm4gc3RyOyB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gICAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgICB2YWx1ZSAhPT0gZXhwb3J0cyAmJlxuICAgICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzKTtcbiAgICB9XG5cbiAgICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuXG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcblxuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuXG4gICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgICB9XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgICB2YXIgdmlzaWJsZV9rZXlzID0gT2JqZWN0X2tleXModmFsdWUpO1xuICAgIHZhciBrZXlzID0gc2hvd0hpZGRlbiA/IE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKSA6IHZpc2libGVfa2V5cztcblxuICAgIC8vIEZ1bmN0aW9ucyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGVzIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWRcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUodmFsdWUudG9VVENTdHJpbmcoKSwgJ2RhdGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYmFzZSwgdHlwZSwgYnJhY2VzO1xuICAgIC8vIERldGVybWluZSB0aGUgb2JqZWN0IHR5cGVcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnQXJyYXknO1xuICAgICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICdPYmplY3QnO1xuICAgICAgYnJhY2VzID0gWyd7JywgJ30nXTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgYmFzZSA9IChpc1JlZ0V4cCh2YWx1ZSkpID8gJyAnICsgdmFsdWUgOiAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlID0gJyc7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIGJhc2UgPSAnICcgKyB2YWx1ZS50b1VUQ1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuXG4gICAgdmFyIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIG5hbWUsIHN0cjtcbiAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKSB7XG4gICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlX2tleXMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgICAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICAgICAgfVxuICAgICAgaWYgKCFzdHIpIHtcbiAgICAgICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZVtrZXldKSA8IDApIHtcbiAgICAgICAgICBpZiAocmVjdXJzZVRpbWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlID09PSAnQXJyYXknICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xuICAgIH0pO1xuXG4gICAgc2Vlbi5wb3AoKTtcblxuICAgIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgICBudW1MaW5lc0VzdCsrO1xuICAgICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgICAgcmV0dXJuIHByZXYgKyBjdXIubGVuZ3RoICsgMTtcbiAgICB9LCAwKTtcblxuICAgIGlmIChsZW5ndGggPiA1MCkge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICtcbiAgICAgICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgYnJhY2VzWzFdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiBmb3JtYXQob2JqLCAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJyA/IDIgOiBkZXB0aCkpO1xufTtcblxuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBhciBpbnN0YW5jZW9mIEFycmF5IHx8XG4gICAgICAgICBBcnJheS5pc0FycmF5KGFyKSB8fFxuICAgICAgICAgKGFyICYmIGFyICE9PSBPYmplY3QucHJvdG90eXBlICYmIGlzQXJyYXkoYXIuX19wcm90b19fKSk7XG59XG5cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIHJlIGluc3RhbmNlb2YgUmVnRXhwIHx8XG4gICAgKHR5cGVvZiByZSA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScpO1xufVxuXG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIGlmIChkIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIHRydWU7XG4gIGlmICh0eXBlb2YgZCAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgdmFyIHByb3BlcnRpZXMgPSBEYXRlLnByb3RvdHlwZSAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhEYXRlLnByb3RvdHlwZSk7XG4gIHZhciBwcm90byA9IGQuX19wcm90b19fICYmIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKGQuX19wcm90b19fKTtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHByb3RvKSA9PT0gSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcyk7XG59XG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHt9O1xuXG5leHBvcnRzLnB1bXAgPSBudWxsO1xuXG52YXIgT2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHJlcy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAvLyBmcm9tIGVzNS1zaGltXG4gICAgdmFyIG9iamVjdDtcbiAgICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgICAgIG9iamVjdCA9IHsgJ19fcHJvdG9fXycgOiBudWxsIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgJ3R5cGVvZiBwcm90b3R5cGVbJyArICh0eXBlb2YgcHJvdG90eXBlKSArICddICE9IFxcJ29iamVjdFxcJydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFR5cGUgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgICAgIG9iamVjdC5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0X2NyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAodHlwZW9mIGYgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGV4cG9ydHMuaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6IHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSl7XG4gICAgaWYgKHggPT09IG51bGwgfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGV4cG9ydHMuaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgaWYgKGV2LnNvdXJjZSA9PT0gd2luZG93ICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXt2YXIgTGFuZ3VhZ2UgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKSxcbiAgICBHbG9iYWwgICAgID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7IC8vICZ0aW1lczsgY2hhcmFjdGVyXG5cbi8vIEJ1aWx0IGJ5IEppc29uOlxudmFyIHBhcnNlciA9IHJlcXVpcmUoJy4uLy4uL2dyYW1tYXIvcGFyc2VyLmpzJyk7XG5cbnBhcnNlci5wYXJzZUVycm9yID0gZnVuY3Rpb24gKHN0ciwgaGFzaCkge1xuICAgIC8vIHtcbiAgICAvLyAgICAgdGV4dDogdGhpcy5sZXhlci5tYXRjaCxcbiAgICAvLyAgICAgdG9rZW46IHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCxcbiAgICAvLyAgICAgbGluZTogdGhpcy5sZXhlci55eWxpbmVubyxcbiAgICAvLyAgICAgbG9jOiB5eWxvYyxcbiAgICAvLyAgICAgZXhwZWN0ZWQ6XG4gICAgLy8gICAgIGV4cGVjdGVkXG4gICAgLy8gfVxuICAgIHZhciBlciA9IG5ldyBTeW50YXhFcnJvcihzdHIpO1xuICAgIGVyLmxpbmUgPSBoYXNoLmxpbmU7XG4gICAgdGhyb3cgZXI7XG59O1xuXG5cbnZhciBsZWZ0ID0gJ2xlZnQnLCByaWdodCA9ICdyaWdodCc7XG52YXIgTCA9IGxlZnQ7XG52YXIgUiA9IHJpZ2h0O1xuXG5cblxudmFyIGxhbmd1YWdlID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgTGFuZ3VhZ2UocGFyc2VyLCB7XG4gICAgICAgIE51bWJlcjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgaWYgKHN0ciA9PT0gJzEnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ciA9PT0gJzAnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIoTnVtYmVyKHN0cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9eW1xcZF0qXFwuW1xcZF0rJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY2ltYWxQbGFjZSA9IHN0ci5pbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgLy8gMTIuMzQ1IC0+IDEyMzQ1IC8gMTAwMFxuICAgICAgICAgICAgICAgIC8vIDAwLjUgLT4gNS8xMFxuICAgICAgICAgICAgICAgIHZhciBkZW5vbV9wID0gc3RyLmxlbmd0aCAtIGRlY2ltYWxQbGFjZSAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBNYXRoLnBvdygxMCwgZGVub21fcCk7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSBOdW1iZXIoc3RyLnJlcGxhY2UoJy4nLCAnJykpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5SYXRpb25hbChuLCBkKS5yZWR1Y2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE51bWJlcihzdHIpKTtcbiAgICAgICAgfSxcbiAgICAgICAgU3RyaW5nOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9LFxuICAgICAgICBTaW5nbGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIC8vIFNpbmdsZSBsYXRleCBjaGFycyBmb3IgeF4zLCB4XnkgZXRjIChOT1QgeF57YWJjfSlcbiAgICAgICAgICAgIGlmICghaXNOYU4oc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKE51bWJlcihzdHIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKHN0cik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFtcbiAgICBbJzsnXSwgICAgICAgICAgLypMIC8gUiBtYWtlcyBubyBkaWZmZXJlbmNlPz8/IT8/IT8gKi9cbiAgICBbJywnXSxcbiAgICBbWyc9JywgJys9JywgJy09JywgJyo9JywgJy89JywgJyU9JywgJyY9JywgJ149JywgJ3w9J10sUl0sXG4gICAgW1snPycsJzonXSxSLDJdLFxuICAgIFtbJ+KIqCddXSxcbiAgICBbWycmJiddXSxcbiAgICBbWyd8J11dLFxuICAgIFtbJz8/Pz8/PyddXSwvL1hPUlxuICAgIFtbJyYnXV0sXG4gICAgW1snPT0nLCAn4omgJywgJyE9PScsICc9PT0nXV0sXG4gICAgW1snPCcsICc8PScsICc+JywgJz49J10sTF0sXG4gICAgW1snPj4nLCAnPDwnXV0sXG4gICAgWyfCsScsIFIsIDJdLFxuICAgIFtbJysnXSwgdHJ1ZV0sXG4gICAgW1snLSddLCBMXSxcbiAgICBbWyfiiKsnLCAn4oiRJ10sIFIsIDFdLFxuICAgIFtbJyonLCAnJSddLCBSXSxcbiAgICBbY3Jvc3NQcm9kdWN0LCBSXSxcbiAgICBbWydAKycsICdALScsICdAwrEnXSwgUiwgMV0sIC8vdW5hcnkgcGx1cy9taW51c1xuICAgIFtbJ8KsJ10sIEwsIDFdLFxuICAgIFsnZGVmYXVsdCcsIFIsIDJdLCAvL0kgY2hhbmdlZCB0aGlzIHRvIFIgZm9yIDVzaW4odClcbiAgICBbJ+KImCcsIFIsIDJdLFxuICAgIFtbJy8nXV0sXG4gICAgW1snXiddXSwvL2UqKnhcbiAgICBbJyEnLCBMLCAxXSxcbiAgICBbWyd+J10sIFIsIDFdLCAvL2JpdHdpc2UgbmVnYXRpb25cbiAgICBbWycrKycsICcrKycsICcuJywgJy0+J10sTCwxXSxcbiAgICBbWyc6OiddXSxcbiAgICBbWydfJ10sIEwsIDJdLFxuICAgIFsndmFyJywgUiwgMV0sXG4gICAgWydicmVhaycsIFIsIDBdLFxuICAgIFsndGhyb3cnLCBSLCAxXSxcbiAgICBbJ1xcJycsIEwsIDFdLFxuICAgIFsnXFx1MjIxQScsIFIsIDFdLCAvLyBTcXJ0XG4gICAgWycjJywgUiwgMV0gLyphbm9ueW1vdXMgZnVuY3Rpb24qL1xuXSk7XG5cbi8qXG4gTGFuZ3VhZ2Ugc3BlYyBjb2x1bW5zIGluIG9yZGVyIG9mIF9pbmNyZWFzaW5nIHByZWNlZGVuY2VfOlxuICogb3BlcmF0b3Igc3RyaW5nIHJlcHJlc2VudGF0aW9uKHMpLiBUaGVzZSBhcmUgZGlmZmVyZW50IG9wZXJhdG9ycywgYnV0IHNoYXJlIGFsbCBwcm9wZXJ0aWVzLlxuICogQXNzb2NpYXRpdml0eVxuICogT3BlcmFuZCBjb3VudCAoTXVzdCBiZSBhIGZpeGVkIG51bWJlcikgXG4gKiAoVE9ETz8/KSBjb21tdXRlIGdyb3VwPyAtIG9yIHNob3VsZCB0aGlzIGJlIGRlcml2ZWQ/XG4gKiAoVE9ETz8pIGFzc29jaWF0aXZlPyBjb21tdXRhdGl2ZT8gIC0gU2hvdWxkIGJlIGNhbGN1bGF0ZWQ/XG4gKiAoVE9ETz8pIElkZW50aXR5P1xuKi9cblxuLy8gdmFyIG1hdGhlbWF0aWNhID0gbmV3IExhbmd1YWdlKFtcbi8vICAgICBbJzsnXSxcbi8vICAgICBbJywnXSxcbi8vICAgICBbWyc9JywgJys9J11dXG4vLyBdKTtcblxufSkoKSIsIihmdW5jdGlvbihwcm9jZXNzKXsvKiBwYXJzZXIgZ2VuZXJhdGVkIGJ5IGppc29uIDAuNC4xMCAqL1xuLypcbiAgUmV0dXJucyBhIFBhcnNlciBvYmplY3Qgb2YgdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG5cbiAgUGFyc2VyOiB7XG4gICAgeXk6IHt9XG4gIH1cblxuICBQYXJzZXIucHJvdG90eXBlOiB7XG4gICAgeXk6IHt9LFxuICAgIHRyYWNlOiBmdW5jdGlvbigpLFxuICAgIHN5bWJvbHNfOiB7YXNzb2NpYXRpdmUgbGlzdDogbmFtZSA9PT4gbnVtYmVyfSxcbiAgICB0ZXJtaW5hbHNfOiB7YXNzb2NpYXRpdmUgbGlzdDogbnVtYmVyID09PiBuYW1lfSxcbiAgICBwcm9kdWN0aW9uc186IFsuLi5dLFxuICAgIHBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eXRleHQsIHl5bGVuZywgeXlsaW5lbm8sIHl5LCB5eXN0YXRlLCAkJCwgXyQpLFxuICAgIHRhYmxlOiBbLi4uXSxcbiAgICBkZWZhdWx0QWN0aW9uczogey4uLn0sXG4gICAgcGFyc2VFcnJvcjogZnVuY3Rpb24oc3RyLCBoYXNoKSxcbiAgICBwYXJzZTogZnVuY3Rpb24oaW5wdXQpLFxuXG4gICAgbGV4ZXI6IHtcbiAgICAgICAgRU9GOiAxLFxuICAgICAgICBwYXJzZUVycm9yOiBmdW5jdGlvbihzdHIsIGhhc2gpLFxuICAgICAgICBzZXRJbnB1dDogZnVuY3Rpb24oaW5wdXQpLFxuICAgICAgICBpbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgdW5wdXQ6IGZ1bmN0aW9uKHN0ciksXG4gICAgICAgIG1vcmU6IGZ1bmN0aW9uKCksXG4gICAgICAgIGxlc3M6IGZ1bmN0aW9uKG4pLFxuICAgICAgICBwYXN0SW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHVwY29taW5nSW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHNob3dQb3NpdGlvbjogZnVuY3Rpb24oKSxcbiAgICAgICAgdGVzdF9tYXRjaDogZnVuY3Rpb24ocmVnZXhfbWF0Y2hfYXJyYXksIHJ1bGVfaW5kZXgpLFxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpLFxuICAgICAgICBsZXg6IGZ1bmN0aW9uKCksXG4gICAgICAgIGJlZ2luOiBmdW5jdGlvbihjb25kaXRpb24pLFxuICAgICAgICBwb3BTdGF0ZTogZnVuY3Rpb24oKSxcbiAgICAgICAgX2N1cnJlbnRSdWxlczogZnVuY3Rpb24oKSxcbiAgICAgICAgdG9wU3RhdGU6IGZ1bmN0aW9uKCksXG4gICAgICAgIHB1c2hTdGF0ZTogZnVuY3Rpb24oY29uZGl0aW9uKSxcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICByYW5nZXM6IGJvb2xlYW4gICAgICAgICAgIChvcHRpb25hbDogdHJ1ZSA9PT4gdG9rZW4gbG9jYXRpb24gaW5mbyB3aWxsIGluY2x1ZGUgYSAucmFuZ2VbXSBtZW1iZXIpXG4gICAgICAgICAgICBmbGV4OiBib29sZWFuICAgICAgICAgICAgIChvcHRpb25hbDogdHJ1ZSA9PT4gZmxleC1saWtlIGxleGluZyBiZWhhdmlvdXIgd2hlcmUgdGhlIHJ1bGVzIGFyZSB0ZXN0ZWQgZXhoYXVzdGl2ZWx5IHRvIGZpbmQgdGhlIGxvbmdlc3QgbWF0Y2gpXG4gICAgICAgICAgICBiYWNrdHJhY2tfbGV4ZXI6IGJvb2xlYW4gIChvcHRpb25hbDogdHJ1ZSA9PT4gbGV4ZXIgcmVnZXhlcyBhcmUgdGVzdGVkIGluIG9yZGVyIGFuZCBmb3IgZWFjaCBtYXRjaGluZyByZWdleCB0aGUgYWN0aW9uIGNvZGUgaXMgaW52b2tlZDsgdGhlIGxleGVyIHRlcm1pbmF0ZXMgdGhlIHNjYW4gd2hlbiBhIHRva2VuIGlzIHJldHVybmVkIGJ5IHRoZSBhY3Rpb24gY29kZSlcbiAgICAgICAgfSxcblxuICAgICAgICBwZXJmb3JtQWN0aW9uOiBmdW5jdGlvbih5eSwgeXlfLCAkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zLCBZWV9TVEFSVCksXG4gICAgICAgIHJ1bGVzOiBbLi4uXSxcbiAgICAgICAgY29uZGl0aW9uczoge2Fzc29jaWF0aXZlIGxpc3Q6IG5hbWUgPT0+IHNldH0sXG4gICAgfVxuICB9XG5cblxuICB0b2tlbiBsb2NhdGlvbiBpbmZvIChAJCwgXyQsIGV0Yy4pOiB7XG4gICAgZmlyc3RfbGluZTogbixcbiAgICBsYXN0X2xpbmU6IG4sXG4gICAgZmlyc3RfY29sdW1uOiBuLFxuICAgIGxhc3RfY29sdW1uOiBuLFxuICAgIHJhbmdlOiBbc3RhcnRfbnVtYmVyLCBlbmRfbnVtYmVyXSAgICAgICAod2hlcmUgdGhlIG51bWJlcnMgYXJlIGluZGV4ZXMgaW50byB0aGUgaW5wdXQgc3RyaW5nLCByZWd1bGFyIHplcm8tYmFzZWQpXG4gIH1cblxuXG4gIHRoZSBwYXJzZUVycm9yIGZ1bmN0aW9uIHJlY2VpdmVzIGEgJ2hhc2gnIG9iamVjdCB3aXRoIHRoZXNlIG1lbWJlcnMgZm9yIGxleGVyIGFuZCBwYXJzZXIgZXJyb3JzOiB7XG4gICAgdGV4dDogICAgICAgIChtYXRjaGVkIHRleHQpXG4gICAgdG9rZW46ICAgICAgICh0aGUgcHJvZHVjZWQgdGVybWluYWwgdG9rZW4sIGlmIGFueSlcbiAgICBsaW5lOiAgICAgICAgKHl5bGluZW5vKVxuICB9XG4gIHdoaWxlIHBhcnNlciAoZ3JhbW1hcikgZXJyb3JzIHdpbGwgYWxzbyBwcm92aWRlIHRoZXNlIG1lbWJlcnMsIGkuZS4gcGFyc2VyIGVycm9ycyBkZWxpdmVyIGEgc3VwZXJzZXQgb2YgYXR0cmlidXRlczoge1xuICAgIGxvYzogICAgICAgICAoeXlsbG9jKVxuICAgIGV4cGVjdGVkOiAgICAoc3RyaW5nIGRlc2NyaWJpbmcgdGhlIHNldCBvZiBleHBlY3RlZCB0b2tlbnMpXG4gICAgcmVjb3ZlcmFibGU6IChib29sZWFuOiBUUlVFIHdoZW4gdGhlIHBhcnNlciBoYXMgYSBlcnJvciByZWNvdmVyeSBydWxlIGF2YWlsYWJsZSBmb3IgdGhpcyBwYXJ0aWN1bGFyIGVycm9yKVxuICB9XG4qL1xudmFyIHBhcnNlciA9IChmdW5jdGlvbigpe1xudmFyIHBhcnNlciA9IHt0cmFjZTogZnVuY3Rpb24gdHJhY2UoKSB7IH0sXG55eToge30sXG5zeW1ib2xzXzoge1wiZXJyb3JcIjoyLFwiZXhwcmVzc2lvbnNcIjozLFwiU1wiOjQsXCJFT0ZcIjo1LFwiZVwiOjYsXCJzdG10XCI6NyxcIj1cIjo4LFwiIT1cIjo5LFwiPD1cIjoxMCxcIjxcIjoxMSxcIj5cIjoxMixcIj49XCI6MTMsXCJjc2xcIjoxNCxcIixcIjoxNSxcInZlY3RvclwiOjE2LFwiKFwiOjE3LFwiKVwiOjE4LFwiK1wiOjE5LFwiLVwiOjIwLFwiKlwiOjIxLFwiL1wiOjIyLFwiUE9XRVJ7XCI6MjMsXCJ9XCI6MjQsXCJfe1wiOjI1LFwiX1NJTkdMRVwiOjI2LFwiU1FSVHtcIjoyNyxcIkZSQUN7XCI6MjgsXCJ7XCI6MjksXCJeU0lOR0xFXCI6MzAsXCJpZGVudGlmaWVyXCI6MzEsXCJudW1iZXJcIjozMixcIklERU5USUZJRVJcIjozMyxcIkxPTkdJREVOVElGSUVSXCI6MzQsXCJERUNJTUFMXCI6MzUsXCJJTlRFR0VSXCI6MzYsXCIkYWNjZXB0XCI6MCxcIiRlbmRcIjoxfSxcbnRlcm1pbmFsc186IHsyOlwiZXJyb3JcIiw1OlwiRU9GXCIsODpcIj1cIiw5OlwiIT1cIiwxMDpcIjw9XCIsMTE6XCI8XCIsMTI6XCI+XCIsMTM6XCI+PVwiLDE1OlwiLFwiLDE3OlwiKFwiLDE4OlwiKVwiLDE5OlwiK1wiLDIwOlwiLVwiLDIxOlwiKlwiLDIyOlwiL1wiLDIzOlwiUE9XRVJ7XCIsMjQ6XCJ9XCIsMjU6XCJfe1wiLDI2OlwiX1NJTkdMRVwiLDI3OlwiU1FSVHtcIiwyODpcIkZSQUN7XCIsMjk6XCJ7XCIsMzA6XCJeU0lOR0xFXCIsMzM6XCJJREVOVElGSUVSXCIsMzQ6XCJMT05HSURFTlRJRklFUlwiLDM1OlwiREVDSU1BTFwiLDM2OlwiSU5URUdFUlwifSxcbnByb2R1Y3Rpb25zXzogWzAsWzMsMl0sWzQsMV0sWzQsMV0sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzE0LDNdLFsxNCwzXSxbMTYsM10sWzYsM10sWzYsM10sWzYsM10sWzYsM10sWzYsNF0sWzYsNF0sWzYsMl0sWzYsM10sWzYsNl0sWzYsMl0sWzYsMl0sWzYsMl0sWzYsM10sWzYsMV0sWzYsMV0sWzYsMV0sWzMxLDFdLFszMSwxXSxbMzIsMV0sWzMyLDFdXSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eXRleHQsIHl5bGVuZywgeXlsaW5lbm8sIHl5LCB5eXN0YXRlIC8qIGFjdGlvblsxXSAqLywgJCQgLyogdnN0YWNrICovLCBfJCAvKiBsc3RhY2sgKi8pIHtcbi8qIHRoaXMgPT0geXl2YWwgKi9cblxudmFyICQwID0gJCQubGVuZ3RoIC0gMTtcbnN3aXRjaCAoeXlzdGF0ZSkge1xuY2FzZSAxOiByZXR1cm4gJCRbJDAtMV07IFxuYnJlYWs7XG5jYXNlIDI6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDM6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDQ6dGhpcy4kID0gWyc9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNTp0aGlzLiQgPSBbJyE9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNjp0aGlzLiQgPSBbJzw9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNzp0aGlzLiQgPSBbJzwnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA4OnRoaXMuJCA9IFsnPicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDk6dGhpcy4kID0gWyc+PScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDEwOnRoaXMuJCA9IFsnLC4nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMTp0aGlzLiQgPSBbJywnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMjp0aGlzLiQgPSAkJFskMC0xXTtcbmJyZWFrO1xuY2FzZSAxMzp0aGlzLiQgPSBbJysnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNDp0aGlzLiQgPSBbJy0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNTp0aGlzLiQgPSBbJyonLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNjp0aGlzLiQgPSBbJy8nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNzp0aGlzLiQgPSBbJ14nLCAkJFskMC0zXSwgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDE4OnRoaXMuJCA9IFsnXycsICQkWyQwLTNdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMTk6dGhpcy4kID0gWydfJywgJCRbJDAtMV0sIHt0eXBlOiAnU2luZ2xlJywgcHJpbWl0aXZlOiB5eXRleHQuc3Vic3RyaW5nKDEpfV07XG5icmVhaztcbmNhc2UgMjA6dGhpcy4kID0gWydzcXJ0JywgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDIxOnRoaXMuJCA9IFsnZnJhYycsICQkWyQwLTRdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjI6dGhpcy4kID0gWydeJywgJCRbJDAtMV0sIHt0eXBlOiAnU2luZ2xlJywgcHJpbWl0aXZlOiB5eXRleHQuc3Vic3RyaW5nKDEpfV07XG5icmVhaztcbmNhc2UgMjM6dGhpcy4kID0gWydALScsICQkWyQwXV1cbmJyZWFrO1xuY2FzZSAyNDp0aGlzLiQgPSBbJ2RlZmF1bHQnLCAkJFskMC0xXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAyNTp0aGlzLiQgPSAkJFskMC0xXVxuYnJlYWs7XG5jYXNlIDI2OnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAyNzp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMjg6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDI5OnRoaXMuJCA9IHl5dGV4dDtcbmJyZWFrO1xuY2FzZSAzMDp0aGlzLiQgPSB5eXRleHQuc3Vic3RyaW5nKDEpO1xuYnJlYWs7XG5jYXNlIDMxOnRoaXMuJCA9IHt0eXBlOiAnTnVtYmVyJywgcHJpbWl0aXZlOiB5eXRleHR9O1xuYnJlYWs7XG5jYXNlIDMyOnRoaXMuJCA9IHt0eXBlOiAnTnVtYmVyJywgcHJpbWl0aXZlOiB5eXRleHR9O1xuYnJlYWs7XG59XG59LFxudGFibGU6IFt7MzoxLDQ6Miw2OjMsNzo0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7MTpbM119LHs1OlsxLDE2XX0sezU6WzIsMl0sNjoyNSw4OlsxLDI2XSw5OlsxLDI3XSwxMDpbMSwyOF0sMTE6WzEsMjldLDEyOlsxLDMwXSwxMzpbMSwzMV0sMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDJdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsM10sMjQ6WzIsM119LHs2OjMyLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjozMywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MzQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjM1LDE0OjM2LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwyNl0sODpbMiwyNl0sOTpbMiwyNl0sMTA6WzIsMjZdLDExOlsyLDI2XSwxMjpbMiwyNl0sMTM6WzIsMjZdLDE1OlsyLDI2XSwxNzpbMiwyNl0sMTg6WzIsMjZdLDE5OlsyLDI2XSwyMDpbMiwyNl0sMjE6WzIsMjZdLDIyOlsyLDI2XSwyMzpbMiwyNl0sMjQ6WzIsMjZdLDI1OlsyLDI2XSwyNjpbMiwyNl0sMjc6WzIsMjZdLDI4OlsyLDI2XSwzMDpbMiwyNl0sMzM6WzIsMjZdLDM0OlsyLDI2XSwzNTpbMiwyNl0sMzY6WzIsMjZdfSx7NTpbMiwyN10sODpbMiwyN10sOTpbMiwyN10sMTA6WzIsMjddLDExOlsyLDI3XSwxMjpbMiwyN10sMTM6WzIsMjddLDE1OlsyLDI3XSwxNzpbMiwyN10sMTg6WzIsMjddLDE5OlsyLDI3XSwyMDpbMiwyN10sMjE6WzIsMjddLDIyOlsyLDI3XSwyMzpbMiwyN10sMjQ6WzIsMjddLDI1OlsyLDI3XSwyNjpbMiwyN10sMjc6WzIsMjddLDI4OlsyLDI3XSwzMDpbMiwyN10sMzM6WzIsMjddLDM0OlsyLDI3XSwzNTpbMiwyN10sMzY6WzIsMjddfSx7NTpbMiwyOF0sODpbMiwyOF0sOTpbMiwyOF0sMTA6WzIsMjhdLDExOlsyLDI4XSwxMjpbMiwyOF0sMTM6WzIsMjhdLDE1OlsyLDI4XSwxNzpbMiwyOF0sMTg6WzIsMjhdLDE5OlsyLDI4XSwyMDpbMiwyOF0sMjE6WzIsMjhdLDIyOlsyLDI4XSwyMzpbMiwyOF0sMjQ6WzIsMjhdLDI1OlsyLDI4XSwyNjpbMiwyOF0sMjc6WzIsMjhdLDI4OlsyLDI4XSwzMDpbMiwyOF0sMzM6WzIsMjhdLDM0OlsyLDI4XSwzNTpbMiwyOF0sMzY6WzIsMjhdfSx7NTpbMiwyOV0sODpbMiwyOV0sOTpbMiwyOV0sMTA6WzIsMjldLDExOlsyLDI5XSwxMjpbMiwyOV0sMTM6WzIsMjldLDE1OlsyLDI5XSwxNzpbMiwyOV0sMTg6WzIsMjldLDE5OlsyLDI5XSwyMDpbMiwyOV0sMjE6WzIsMjldLDIyOlsyLDI5XSwyMzpbMiwyOV0sMjQ6WzIsMjldLDI1OlsyLDI5XSwyNjpbMiwyOV0sMjc6WzIsMjldLDI4OlsyLDI5XSwzMDpbMiwyOV0sMzM6WzIsMjldLDM0OlsyLDI5XSwzNTpbMiwyOV0sMzY6WzIsMjldfSx7NTpbMiwzMF0sODpbMiwzMF0sOTpbMiwzMF0sMTA6WzIsMzBdLDExOlsyLDMwXSwxMjpbMiwzMF0sMTM6WzIsMzBdLDE1OlsyLDMwXSwxNzpbMiwzMF0sMTg6WzIsMzBdLDE5OlsyLDMwXSwyMDpbMiwzMF0sMjE6WzIsMzBdLDIyOlsyLDMwXSwyMzpbMiwzMF0sMjQ6WzIsMzBdLDI1OlsyLDMwXSwyNjpbMiwzMF0sMjc6WzIsMzBdLDI4OlsyLDMwXSwzMDpbMiwzMF0sMzM6WzIsMzBdLDM0OlsyLDMwXSwzNTpbMiwzMF0sMzY6WzIsMzBdfSx7NTpbMiwzMV0sODpbMiwzMV0sOTpbMiwzMV0sMTA6WzIsMzFdLDExOlsyLDMxXSwxMjpbMiwzMV0sMTM6WzIsMzFdLDE1OlsyLDMxXSwxNzpbMiwzMV0sMTg6WzIsMzFdLDE5OlsyLDMxXSwyMDpbMiwzMV0sMjE6WzIsMzFdLDIyOlsyLDMxXSwyMzpbMiwzMV0sMjQ6WzIsMzFdLDI1OlsyLDMxXSwyNjpbMiwzMV0sMjc6WzIsMzFdLDI4OlsyLDMxXSwzMDpbMiwzMV0sMzM6WzIsMzFdLDM0OlsyLDMxXSwzNTpbMiwzMV0sMzY6WzIsMzFdfSx7NTpbMiwzMl0sODpbMiwzMl0sOTpbMiwzMl0sMTA6WzIsMzJdLDExOlsyLDMyXSwxMjpbMiwzMl0sMTM6WzIsMzJdLDE1OlsyLDMyXSwxNzpbMiwzMl0sMTg6WzIsMzJdLDE5OlsyLDMyXSwyMDpbMiwzMl0sMjE6WzIsMzJdLDIyOlsyLDMyXSwyMzpbMiwzMl0sMjQ6WzIsMzJdLDI1OlsyLDMyXSwyNjpbMiwzMl0sMjc6WzIsMzJdLDI4OlsyLDMyXSwzMDpbMiwzMl0sMzM6WzIsMzJdLDM0OlsyLDMyXSwzNTpbMiwzMl0sMzY6WzIsMzJdfSx7MTpbMiwxXX0sezY6MzcsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjM4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjozOSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDAsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQxLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NDo0Miw2OjMsNzo0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxOV0sODpbMiwxOV0sOTpbMiwxOV0sMTA6WzIsMTldLDExOlsyLDE5XSwxMjpbMiwxOV0sMTM6WzIsMTldLDE1OlsyLDE5XSwxNzpbMiwxOV0sMTg6WzIsMTldLDE5OlsyLDE5XSwyMDpbMiwxOV0sMjE6WzIsMTldLDIyOlsyLDE5XSwyMzpbMiwxOV0sMjQ6WzIsMTldLDI1OlsyLDE5XSwyNjpbMiwxOV0sMjc6WzIsMTldLDI4OlsyLDE5XSwzMDpbMiwxOV0sMzM6WzIsMTldLDM0OlsyLDE5XSwzNTpbMiwxOV0sMzY6WzIsMTldfSx7NTpbMiwyMl0sODpbMiwyMl0sOTpbMiwyMl0sMTA6WzIsMjJdLDExOlsyLDIyXSwxMjpbMiwyMl0sMTM6WzIsMjJdLDE1OlsyLDIyXSwxNzpbMiwyMl0sMTg6WzIsMjJdLDE5OlsyLDIyXSwyMDpbMiwyMl0sMjE6WzIsMjJdLDIyOlsyLDIyXSwyMzpbMiwyMl0sMjQ6WzIsMjJdLDI1OlsyLDIyXSwyNjpbMiwyMl0sMjc6WzIsMjJdLDI4OlsyLDIyXSwzMDpbMiwyMl0sMzM6WzIsMjJdLDM0OlsyLDIyXSwzNTpbMiwyMl0sMzY6WzIsMjJdfSx7NTpbMiwyNF0sNjoyNSw4OlsyLDI0XSw5OlsyLDI0XSwxMDpbMiwyNF0sMTE6WzIsMjRdLDEyOlsyLDI0XSwxMzpbMiwyNF0sMTU6WzIsMjRdLDE2OjksMTc6WzEsOF0sMTg6WzIsMjRdLDE5OlsyLDI0XSwyMDpbMiwyNF0sMjE6WzIsMjRdLDIyOlsyLDI0XSwyMzpbMSwyMV0sMjQ6WzIsMjRdLDI1OlsyLDI0XSwyNjpbMiwyNF0sMjc6WzIsMjRdLDI4OlsyLDI0XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0MywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQ1LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0NiwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDcsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQ4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNDldLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDUwXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDIzXSw2OjI1LDg6WzIsMjNdLDk6WzIsMjNdLDEwOlsyLDIzXSwxMTpbMiwyM10sMTI6WzIsMjNdLDEzOlsyLDIzXSwxNTpbMiwyM10sMTY6OSwxNzpbMSw4XSwxODpbMiwyM10sMTk6WzIsMjNdLDIwOlsyLDIzXSwyMTpbMiwyM10sMjI6WzIsMjNdLDIzOlsxLDIxXSwyNDpbMiwyM10sMjU6WzIsMjNdLDI2OlsyLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNTpbMSw1Ml0sMTY6OSwxNzpbMSw4XSwxODpbMSw1MV0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHsxNTpbMSw1NF0sMTg6WzEsNTNdfSx7NTpbMiwxM10sNjoyNSw4OlsyLDEzXSw5OlsyLDEzXSwxMDpbMiwxM10sMTE6WzIsMTNdLDEyOlsyLDEzXSwxMzpbMiwxM10sMTU6WzIsMTNdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTNdLDE5OlsyLDEzXSwyMDpbMiwxM10sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsMTNdLDI1OlsyLDEzXSwyNjpbMiwxM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMTRdLDY6MjUsODpbMiwxNF0sOTpbMiwxNF0sMTA6WzIsMTRdLDExOlsyLDE0XSwxMjpbMiwxNF0sMTM6WzIsMTRdLDE1OlsyLDE0XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE0XSwxOTpbMiwxNF0sMjA6WzIsMTRdLDIxOlsyLDIzXSwyMjpbMiwyM10sMjM6WzEsMjFdLDI0OlsyLDE0XSwyNTpbMiwxNF0sMjY6WzIsMTRdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDE1XSw2OjI1LDg6WzIsMTVdLDk6WzIsMTVdLDEwOlsyLDE1XSwxMTpbMiwxNV0sMTI6WzIsMTVdLDEzOlsyLDE1XSwxNTpbMiwxNV0sMTY6OSwxNzpbMSw4XSwxODpbMiwxNV0sMTk6WzIsMTVdLDIwOlsyLDE1XSwyMTpbMiwxNV0sMjI6WzIsMTVdLDIzOlsxLDIxXSwyNDpbMiwxNV0sMjU6WzIsMTVdLDI2OlsyLDE1XSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxNl0sNjoyNSw4OlsyLDE2XSw5OlsyLDE2XSwxMDpbMiwxNl0sMTE6WzIsMTZdLDEyOlsyLDE2XSwxMzpbMiwxNl0sMTU6WzIsMTZdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTZdLDE5OlsyLDE2XSwyMDpbMiwxNl0sMjE6WzIsMTZdLDIyOlsyLDE2XSwyMzpbMSwyMV0sMjQ6WzIsMTZdLDI1OlsyLDE2XSwyNjpbMiwxNl0sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDU1XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHsyNDpbMSw1Nl19LHs1OlsyLDRdLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDRdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsNV0sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw2XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw2XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDddLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDddLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsOF0sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsOF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw5XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw5XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDIwXSw4OlsyLDIwXSw5OlsyLDIwXSwxMDpbMiwyMF0sMTE6WzIsMjBdLDEyOlsyLDIwXSwxMzpbMiwyMF0sMTU6WzIsMjBdLDE3OlsyLDIwXSwxODpbMiwyMF0sMTk6WzIsMjBdLDIwOlsyLDIwXSwyMTpbMiwyMF0sMjI6WzIsMjBdLDIzOlsyLDIwXSwyNDpbMiwyMF0sMjU6WzIsMjBdLDI2OlsyLDIwXSwyNzpbMiwyMF0sMjg6WzIsMjBdLDMwOlsyLDIwXSwzMzpbMiwyMF0sMzQ6WzIsMjBdLDM1OlsyLDIwXSwzNjpbMiwyMF19LHsyOTpbMSw1N119LHs1OlsyLDI1XSw4OlsyLDI1XSw5OlsyLDI1XSwxMDpbMiwyNV0sMTE6WzIsMjVdLDEyOlsyLDI1XSwxMzpbMiwyNV0sMTU6WzIsMjVdLDE3OlsyLDI1XSwxODpbMiwyNV0sMTk6WzIsMjVdLDIwOlsyLDI1XSwyMTpbMiwyNV0sMjI6WzIsMjVdLDIzOlsyLDI1XSwyNDpbMiwyNV0sMjU6WzIsMjVdLDI2OlsyLDI1XSwyNzpbMiwyNV0sMjg6WzIsMjVdLDMwOlsyLDI1XSwzMzpbMiwyNV0sMzQ6WzIsMjVdLDM1OlsyLDI1XSwzNjpbMiwyNV19LHs2OjU4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxMl0sODpbMiwxMl0sOTpbMiwxMl0sMTA6WzIsMTJdLDExOlsyLDEyXSwxMjpbMiwxMl0sMTM6WzIsMTJdLDE1OlsyLDEyXSwxNzpbMiwxMl0sMTg6WzIsMTJdLDE5OlsyLDEyXSwyMDpbMiwxMl0sMjE6WzIsMTJdLDIyOlsyLDEyXSwyMzpbMiwxMl0sMjQ6WzIsMTJdLDI1OlsyLDEyXSwyNjpbMiwxMl0sMjc6WzIsMTJdLDI4OlsyLDEyXSwzMDpbMiwxMl0sMzM6WzIsMTJdLDM0OlsyLDEyXSwzNTpbMiwxMl0sMzY6WzIsMTJdfSx7Njo1OSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMTddLDg6WzIsMTddLDk6WzIsMTddLDEwOlsyLDE3XSwxMTpbMiwxN10sMTI6WzIsMTddLDEzOlsyLDE3XSwxNTpbMiwxN10sMTc6WzIsMTddLDE4OlsyLDE3XSwxOTpbMiwxN10sMjA6WzIsMTddLDIxOlsyLDE3XSwyMjpbMiwxN10sMjM6WzIsMTddLDI0OlsyLDE3XSwyNTpbMiwxN10sMjY6WzIsMTddLDI3OlsyLDE3XSwyODpbMiwxN10sMzA6WzIsMTddLDMzOlsyLDE3XSwzNDpbMiwxN10sMzU6WzIsMTddLDM2OlsyLDE3XX0sezU6WzIsMThdLDg6WzIsMThdLDk6WzIsMThdLDEwOlsyLDE4XSwxMTpbMiwxOF0sMTI6WzIsMThdLDEzOlsyLDE4XSwxNTpbMiwxOF0sMTc6WzIsMThdLDE4OlsyLDE4XSwxOTpbMiwxOF0sMjA6WzIsMThdLDIxOlsyLDE4XSwyMjpbMiwxOF0sMjM6WzIsMThdLDI0OlsyLDE4XSwyNTpbMiwxOF0sMjY6WzIsMThdLDI3OlsyLDE4XSwyODpbMiwxOF0sMzA6WzIsMThdLDMzOlsyLDE4XSwzNDpbMiwxOF0sMzU6WzIsMThdLDM2OlsyLDE4XX0sezY6NjAsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjI1LDE1OlsyLDExXSwxNjo5LDE3OlsxLDhdLDE4OlsyLDExXSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTU6WzIsMTBdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTBdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMjFdLDg6WzIsMjFdLDk6WzIsMjFdLDEwOlsyLDIxXSwxMTpbMiwyMV0sMTI6WzIsMjFdLDEzOlsyLDIxXSwxNTpbMiwyMV0sMTc6WzIsMjFdLDE4OlsyLDIxXSwxOTpbMiwyMV0sMjA6WzIsMjFdLDIxOlsyLDIxXSwyMjpbMiwyMV0sMjM6WzIsMjFdLDI0OlsyLDIxXSwyNTpbMiwyMV0sMjY6WzIsMjFdLDI3OlsyLDIxXSwyODpbMiwyMV0sMzA6WzIsMjFdLDMzOlsyLDIxXSwzNDpbMiwyMV0sMzU6WzIsMjFdLDM2OlsyLDIxXX1dLFxuZGVmYXVsdEFjdGlvbnM6IHsxNjpbMiwxXX0sXG5wYXJzZUVycm9yOiBmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgIGlmIChoYXNoLnJlY292ZXJhYmxlKSB7XG4gICAgICAgIHRoaXMudHJhY2Uoc3RyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3RyKTtcbiAgICB9XG59LFxucGFyc2U6IGZ1bmN0aW9uIHBhcnNlKGlucHV0KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzLCBzdGFjayA9IFswXSwgdnN0YWNrID0gW251bGxdLCBsc3RhY2sgPSBbXSwgdGFibGUgPSB0aGlzLnRhYmxlLCB5eXRleHQgPSAnJywgeXlsaW5lbm8gPSAwLCB5eWxlbmcgPSAwLCByZWNvdmVyaW5nID0gMCwgVEVSUk9SID0gMiwgRU9GID0gMTtcbiAgICB0aGlzLmxleGVyLnNldElucHV0KGlucHV0KTtcbiAgICB0aGlzLmxleGVyLnl5ID0gdGhpcy55eTtcbiAgICB0aGlzLnl5LmxleGVyID0gdGhpcy5sZXhlcjtcbiAgICB0aGlzLnl5LnBhcnNlciA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmxleGVyLnl5bGxvYyA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmxleGVyLnl5bGxvYyA9IHt9O1xuICAgIH1cbiAgICB2YXIgeXlsb2MgPSB0aGlzLmxleGVyLnl5bGxvYztcbiAgICBsc3RhY2sucHVzaCh5eWxvYyk7XG4gICAgdmFyIHJhbmdlcyA9IHRoaXMubGV4ZXIub3B0aW9ucyAmJiB0aGlzLmxleGVyLm9wdGlvbnMucmFuZ2VzO1xuICAgIGlmICh0eXBlb2YgdGhpcy55eS5wYXJzZUVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucGFyc2VFcnJvciA9IHRoaXMueXkucGFyc2VFcnJvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBhcnNlRXJyb3IgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykucGFyc2VFcnJvcjtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9wU3RhY2sobikge1xuICAgICAgICBzdGFjay5sZW5ndGggPSBzdGFjay5sZW5ndGggLSAyICogbjtcbiAgICAgICAgdnN0YWNrLmxlbmd0aCA9IHZzdGFjay5sZW5ndGggLSBuO1xuICAgICAgICBsc3RhY2subGVuZ3RoID0gbHN0YWNrLmxlbmd0aCAtIG47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGxleCgpIHtcbiAgICAgICAgdmFyIHRva2VuO1xuICAgICAgICB0b2tlbiA9IHNlbGYubGV4ZXIubGV4KCkgfHwgRU9GO1xuICAgICAgICBpZiAodHlwZW9mIHRva2VuICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdG9rZW4gPSBzZWxmLnN5bWJvbHNfW3Rva2VuXSB8fCB0b2tlbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuICAgIHZhciBzeW1ib2wsIHByZUVycm9yU3ltYm9sLCBzdGF0ZSwgYWN0aW9uLCBhLCByLCB5eXZhbCA9IHt9LCBwLCBsZW4sIG5ld1N0YXRlLCBleHBlY3RlZDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBzdGF0ZSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAodGhpcy5kZWZhdWx0QWN0aW9uc1tzdGF0ZV0pIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IHRoaXMuZGVmYXVsdEFjdGlvbnNbc3RhdGVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN5bWJvbCA9PT0gbnVsbCB8fCB0eXBlb2Ygc3ltYm9sID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gbGV4KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY3Rpb24gPSB0YWJsZVtzdGF0ZV0gJiYgdGFibGVbc3RhdGVdW3N5bWJvbF07XG4gICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24gPT09ICd1bmRlZmluZWQnIHx8ICFhY3Rpb24ubGVuZ3RoIHx8ICFhY3Rpb25bMF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHAgaW4gdGFibGVbc3RhdGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRlcm1pbmFsc19bcF0gJiYgcCA+IFRFUlJPUikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQucHVzaCgnXFwnJyArIHRoaXMudGVybWluYWxzX1twXSArICdcXCcnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sZXhlci5zaG93UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyU3RyID0gJ1BhcnNlIGVycm9yIG9uIGxpbmUgJyArICh5eWxpbmVubyArIDEpICsgJzpcXG4nICsgdGhpcy5sZXhlci5zaG93UG9zaXRpb24oKSArICdcXG5FeHBlY3RpbmcgJyArIGV4cGVjdGVkLmpvaW4oJywgJykgKyAnLCBnb3QgXFwnJyArICh0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wpICsgJ1xcJyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyU3RyID0gJ1BhcnNlIGVycm9yIG9uIGxpbmUgJyArICh5eWxpbmVubyArIDEpICsgJzogVW5leHBlY3RlZCAnICsgKHN5bWJvbCA9PSBFT0YgPyAnZW5kIG9mIGlucHV0JyA6ICdcXCcnICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucGFyc2VFcnJvcihlcnJTdHIsIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogdGhpcy5sZXhlci5tYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgdG9rZW46IHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCxcbiAgICAgICAgICAgICAgICAgICAgbGluZTogdGhpcy5sZXhlci55eWxpbmVubyxcbiAgICAgICAgICAgICAgICAgICAgbG9jOiB5eWxvYyxcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb25bMF0gaW5zdGFuY2VvZiBBcnJheSAmJiBhY3Rpb24ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzZSBFcnJvcjogbXVsdGlwbGUgYWN0aW9ucyBwb3NzaWJsZSBhdCBzdGF0ZTogJyArIHN0YXRlICsgJywgdG9rZW46ICcgKyBzeW1ib2wpO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uWzBdKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHN0YWNrLnB1c2goc3ltYm9sKTtcbiAgICAgICAgICAgIHZzdGFjay5wdXNoKHRoaXMubGV4ZXIueXl0ZXh0KTtcbiAgICAgICAgICAgIGxzdGFjay5wdXNoKHRoaXMubGV4ZXIueXlsbG9jKTtcbiAgICAgICAgICAgIHN0YWNrLnB1c2goYWN0aW9uWzFdKTtcbiAgICAgICAgICAgIHN5bWJvbCA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIXByZUVycm9yU3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgeXlsZW5nID0gdGhpcy5sZXhlci55eWxlbmc7XG4gICAgICAgICAgICAgICAgeXl0ZXh0ID0gdGhpcy5sZXhlci55eXRleHQ7XG4gICAgICAgICAgICAgICAgeXlsaW5lbm8gPSB0aGlzLmxleGVyLnl5bGluZW5vO1xuICAgICAgICAgICAgICAgIHl5bG9jID0gdGhpcy5sZXhlci55eWxsb2M7XG4gICAgICAgICAgICAgICAgaWYgKHJlY292ZXJpbmcgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY292ZXJpbmctLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN5bWJvbCA9IHByZUVycm9yU3ltYm9sO1xuICAgICAgICAgICAgICAgIHByZUVycm9yU3ltYm9sID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBsZW4gPSB0aGlzLnByb2R1Y3Rpb25zX1thY3Rpb25bMV1dWzFdO1xuICAgICAgICAgICAgeXl2YWwuJCA9IHZzdGFja1t2c3RhY2subGVuZ3RoIC0gbGVuXTtcbiAgICAgICAgICAgIHl5dmFsLl8kID0ge1xuICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6IGxzdGFja1tsc3RhY2subGVuZ3RoIC0gKGxlbiB8fCAxKV0uZmlyc3RfbGluZSxcbiAgICAgICAgICAgICAgICBsYXN0X2xpbmU6IGxzdGFja1tsc3RhY2subGVuZ3RoIC0gMV0ubGFzdF9saW5lLFxuICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46IGxzdGFja1tsc3RhY2subGVuZ3RoIC0gMV0ubGFzdF9jb2x1bW5cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAocmFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgeXl2YWwuXyQucmFuZ2UgPSBbXG4gICAgICAgICAgICAgICAgICAgIGxzdGFja1tsc3RhY2subGVuZ3RoIC0gKGxlbiB8fCAxKV0ucmFuZ2VbMF0sXG4gICAgICAgICAgICAgICAgICAgIGxzdGFja1tsc3RhY2subGVuZ3RoIC0gMV0ucmFuZ2VbMV1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgciA9IHRoaXMucGVyZm9ybUFjdGlvbi5jYWxsKHl5dmFsLCB5eXRleHQsIHl5bGVuZywgeXlsaW5lbm8sIHRoaXMueXksIGFjdGlvblsxXSwgdnN0YWNrLCBsc3RhY2spO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2suc2xpY2UoMCwgLTEgKiBsZW4gKiAyKTtcbiAgICAgICAgICAgICAgICB2c3RhY2sgPSB2c3RhY2suc2xpY2UoMCwgLTEgKiBsZW4pO1xuICAgICAgICAgICAgICAgIGxzdGFjayA9IGxzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFjay5wdXNoKHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMF0pO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2goeXl2YWwuJCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh5eXZhbC5fJCk7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHRhYmxlW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDJdXVtzdGFja1tzdGFjay5sZW5ndGggLSAxXV07XG4gICAgICAgICAgICBzdGFjay5wdXNoKG5ld1N0YXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn19O1xudW5kZWZpbmVkLyogZ2VuZXJhdGVkIGJ5IGppc29uLWxleCAwLjIuMSAqL1xudmFyIGxleGVyID0gKGZ1bmN0aW9uKCl7XG52YXIgbGV4ZXIgPSB7XG5cbkVPRjoxLFxuXG5wYXJzZUVycm9yOmZ1bmN0aW9uIHBhcnNlRXJyb3Ioc3RyLCBoYXNoKSB7XG4gICAgICAgIGlmICh0aGlzLnl5LnBhcnNlcikge1xuICAgICAgICAgICAgdGhpcy55eS5wYXJzZXIucGFyc2VFcnJvcihzdHIsIGhhc2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHN0cik7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXNldHMgdGhlIGxleGVyLCBzZXRzIG5ldyBpbnB1dFxuc2V0SW5wdXQ6ZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG4gICAgICAgIHRoaXMuX21vcmUgPSB0aGlzLl9iYWNrdHJhY2sgPSB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy55eWxpbmVubyA9IHRoaXMueXlsZW5nID0gMDtcbiAgICAgICAgdGhpcy55eXRleHQgPSB0aGlzLm1hdGNoZWQgPSB0aGlzLm1hdGNoID0gJyc7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uU3RhY2sgPSBbJ0lOSVRJQUwnXTtcbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiAwLFxuICAgICAgICAgICAgbGFzdF9saW5lOiAxLFxuICAgICAgICAgICAgbGFzdF9jb2x1bW46IDBcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gWzAsMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyBjb25zdW1lcyBhbmQgcmV0dXJucyBvbmUgY2hhciBmcm9tIHRoZSBpbnB1dFxuaW5wdXQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2ggPSB0aGlzLl9pbnB1dFswXTtcbiAgICAgICAgdGhpcy55eXRleHQgKz0gY2g7XG4gICAgICAgIHRoaXMueXlsZW5nKys7XG4gICAgICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgICAgIHRoaXMubWF0Y2ggKz0gY2g7XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSBjaDtcbiAgICAgICAgdmFyIGxpbmVzID0gY2gubWF0Y2goLyg/Olxcclxcbj98XFxuKS4qL2cpO1xuICAgICAgICBpZiAobGluZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsaW5lbm8rKztcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLmxhc3RfbGluZSsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9jb2x1bW4rKztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2VbMV0rKztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gdGhpcy5faW5wdXQuc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiBjaDtcbiAgICB9LFxuXG4vLyB1bnNoaWZ0cyBvbmUgY2hhciAob3IgYSBzdHJpbmcpIGludG8gdGhlIGlucHV0XG51bnB1dDpmdW5jdGlvbiAoY2gpIHtcbiAgICAgICAgdmFyIGxlbiA9IGNoLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmVzID0gY2guc3BsaXQoLyg/Olxcclxcbj98XFxuKS9nKTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGNoICsgdGhpcy5faW5wdXQ7XG4gICAgICAgIHRoaXMueXl0ZXh0ID0gdGhpcy55eXRleHQuc3Vic3RyKDAsIHRoaXMueXl0ZXh0Lmxlbmd0aCAtIGxlbiAtIDEpO1xuICAgICAgICAvL3RoaXMueXlsZW5nIC09IGxlbjtcbiAgICAgICAgdGhpcy5vZmZzZXQgLT0gbGVuO1xuICAgICAgICB2YXIgb2xkTGluZXMgPSB0aGlzLm1hdGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG4gICAgICAgIHRoaXMubWF0Y2ggPSB0aGlzLm1hdGNoLnN1YnN0cigwLCB0aGlzLm1hdGNoLmxlbmd0aCAtIDEpO1xuICAgICAgICB0aGlzLm1hdGNoZWQgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSAxKTtcblxuICAgICAgICBpZiAobGluZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubyAtPSBsaW5lcy5sZW5ndGggLSAxO1xuICAgICAgICB9XG4gICAgICAgIHZhciByID0gdGhpcy55eWxsb2MucmFuZ2U7XG5cbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5maXJzdF9saW5lLFxuICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLnl5bGluZW5vICsgMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uLFxuICAgICAgICAgICAgbGFzdF9jb2x1bW46IGxpbmVzID9cbiAgICAgICAgICAgICAgICAobGluZXMubGVuZ3RoID09PSBvbGRMaW5lcy5sZW5ndGggPyB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4gOiAwKVxuICAgICAgICAgICAgICAgICArIG9sZExpbmVzW29sZExpbmVzLmxlbmd0aCAtIGxpbmVzLmxlbmd0aF0ubGVuZ3RoIC0gbGluZXNbMF0ubGVuZ3RoIDpcbiAgICAgICAgICAgICAgdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uIC0gbGVuXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gW3JbMF0sIHJbMF0gKyB0aGlzLnl5bGVuZyAtIGxlbl07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy55eWxlbmcgPSB0aGlzLnl5dGV4dC5sZW5ndGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIFdoZW4gY2FsbGVkIGZyb20gYWN0aW9uLCBjYWNoZXMgbWF0Y2hlZCB0ZXh0IGFuZCBhcHBlbmRzIGl0IG9uIG5leHQgYWN0aW9uXG5tb3JlOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbW9yZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIFdoZW4gY2FsbGVkIGZyb20gYWN0aW9uLCBzaWduYWxzIHRoZSBsZXhlciB0aGF0IHRoaXMgcnVsZSBmYWlscyB0byBtYXRjaCB0aGUgaW5wdXQsIHNvIHRoZSBuZXh0IG1hdGNoaW5nIHJ1bGUgKHJlZ2V4KSBzaG91bGQgYmUgdGVzdGVkIGluc3RlYWQuXG5yZWplY3Q6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgdGhpcy5fYmFja3RyYWNrID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXJyb3IoJ0xleGljYWwgZXJyb3Igb24gbGluZSAnICsgKHRoaXMueXlsaW5lbm8gKyAxKSArICcuIFlvdSBjYW4gb25seSBpbnZva2UgcmVqZWN0KCkgaW4gdGhlIGxleGVyIHdoZW4gdGhlIGxleGVyIGlzIG9mIHRoZSBiYWNrdHJhY2tpbmcgcGVyc3Vhc2lvbiAob3B0aW9ucy5iYWNrdHJhY2tfbGV4ZXIgPSB0cnVlKS5cXG4nICsgdGhpcy5zaG93UG9zaXRpb24oKSwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgdG9rZW46IG51bGwsXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy55eWxpbmVub1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4vLyByZXRhaW4gZmlyc3QgbiBjaGFyYWN0ZXJzIG9mIHRoZSBtYXRjaFxubGVzczpmdW5jdGlvbiAobikge1xuICAgICAgICB0aGlzLnVucHV0KHRoaXMubWF0Y2guc2xpY2UobikpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIGFscmVhZHkgbWF0Y2hlZCBpbnB1dCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnBhc3RJbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXN0ID0gdGhpcy5tYXRjaGVkLnN1YnN0cigwLCB0aGlzLm1hdGNoZWQubGVuZ3RoIC0gdGhpcy5tYXRjaC5sZW5ndGgpO1xuICAgICAgICByZXR1cm4gKHBhc3QubGVuZ3RoID4gMjAgPyAnLi4uJzonJykgKyBwYXN0LnN1YnN0cigtMjApLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9LFxuXG4vLyBkaXNwbGF5cyB1cGNvbWluZyBpbnB1dCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnVwY29taW5nSW5wdXQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmV4dCA9IHRoaXMubWF0Y2g7XG4gICAgICAgIGlmIChuZXh0Lmxlbmd0aCA8IDIwKSB7XG4gICAgICAgICAgICBuZXh0ICs9IHRoaXMuX2lucHV0LnN1YnN0cigwLCAyMC1uZXh0Lmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChuZXh0LnN1YnN0cigwLDIwKSArIChuZXh0Lmxlbmd0aCA+IDIwID8gJy4uLicgOiAnJykpLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9LFxuXG4vLyBkaXNwbGF5cyB0aGUgY2hhcmFjdGVyIHBvc2l0aW9uIHdoZXJlIHRoZSBsZXhpbmcgZXJyb3Igb2NjdXJyZWQsIGkuZS4gZm9yIGVycm9yIG1lc3NhZ2VzXG5zaG93UG9zaXRpb246ZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcHJlID0gdGhpcy5wYXN0SW5wdXQoKTtcbiAgICAgICAgdmFyIGMgPSBuZXcgQXJyYXkocHJlLmxlbmd0aCArIDEpLmpvaW4oXCItXCIpO1xuICAgICAgICByZXR1cm4gcHJlICsgdGhpcy51cGNvbWluZ0lucHV0KCkgKyBcIlxcblwiICsgYyArIFwiXlwiO1xuICAgIH0sXG5cbi8vIHRlc3QgdGhlIGxleGVkIHRva2VuOiByZXR1cm4gRkFMU0Ugd2hlbiBub3QgYSBtYXRjaCwgb3RoZXJ3aXNlIHJldHVybiB0b2tlblxudGVzdF9tYXRjaDpmdW5jdGlvbiAobWF0Y2gsIGluZGV4ZWRfcnVsZSkge1xuICAgICAgICB2YXIgdG9rZW4sXG4gICAgICAgICAgICBsaW5lcyxcbiAgICAgICAgICAgIGJhY2t1cDtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgLy8gc2F2ZSBjb250ZXh0XG4gICAgICAgICAgICBiYWNrdXAgPSB7XG4gICAgICAgICAgICAgICAgeXlsaW5lbm86IHRoaXMueXlsaW5lbm8sXG4gICAgICAgICAgICAgICAgeXlsbG9jOiB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGluZTogdGhpcy5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogdGhpcy55eWxsb2MubGFzdF9jb2x1bW5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHl5dGV4dDogdGhpcy55eXRleHQsXG4gICAgICAgICAgICAgICAgbWF0Y2g6IHRoaXMubWF0Y2gsXG4gICAgICAgICAgICAgICAgbWF0Y2hlczogdGhpcy5tYXRjaGVzLFxuICAgICAgICAgICAgICAgIG1hdGNoZWQ6IHRoaXMubWF0Y2hlZCxcbiAgICAgICAgICAgICAgICB5eWxlbmc6IHRoaXMueXlsZW5nLFxuICAgICAgICAgICAgICAgIG9mZnNldDogdGhpcy5vZmZzZXQsXG4gICAgICAgICAgICAgICAgX21vcmU6IHRoaXMuX21vcmUsXG4gICAgICAgICAgICAgICAgX2lucHV0OiB0aGlzLl9pbnB1dCxcbiAgICAgICAgICAgICAgICB5eTogdGhpcy55eSxcbiAgICAgICAgICAgICAgICBjb25kaXRpb25TdGFjazogdGhpcy5jb25kaXRpb25TdGFjay5zbGljZSgwKSxcbiAgICAgICAgICAgICAgICBkb25lOiB0aGlzLmRvbmVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgICAgIGJhY2t1cC55eWxsb2MucmFuZ2UgPSB0aGlzLnl5bGxvYy5yYW5nZS5zbGljZSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxpbmVzID0gbWF0Y2hbMF0ubWF0Y2goLyg/Olxcclxcbj98XFxuKS4qL2cpO1xuICAgICAgICBpZiAobGluZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsaW5lbm8gKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueXlsbG9jID0ge1xuICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MubGFzdF9saW5lLFxuICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLnl5bGluZW5vICsgMSxcbiAgICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MubGFzdF9jb2x1bW4sXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogbGluZXMgP1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLmxlbmd0aCAtIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLm1hdGNoKC9cXHI/XFxuPy8pWzBdLmxlbmd0aCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9jb2x1bW4gKyBtYXRjaFswXS5sZW5ndGhcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy55eXRleHQgKz0gbWF0Y2hbMF07XG4gICAgICAgIHRoaXMubWF0Y2ggKz0gbWF0Y2hbMF07XG4gICAgICAgIHRoaXMubWF0Y2hlcyA9IG1hdGNoO1xuICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gW3RoaXMub2Zmc2V0LCB0aGlzLm9mZnNldCArPSB0aGlzLnl5bGVuZ107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbW9yZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9iYWNrdHJhY2sgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faW5wdXQgPSB0aGlzLl9pbnB1dC5zbGljZShtYXRjaFswXS5sZW5ndGgpO1xuICAgICAgICB0aGlzLm1hdGNoZWQgKz0gbWF0Y2hbMF07XG4gICAgICAgIHRva2VuID0gdGhpcy5wZXJmb3JtQWN0aW9uLmNhbGwodGhpcywgdGhpcy55eSwgdGhpcywgaW5kZXhlZF9ydWxlLCB0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV0pO1xuICAgICAgICBpZiAodGhpcy5kb25lICYmIHRoaXMuX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9iYWNrdHJhY2spIHtcbiAgICAgICAgICAgIC8vIHJlY292ZXIgY29udGV4dFxuICAgICAgICAgICAgZm9yICh2YXIgayBpbiBiYWNrdXApIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tdID0gYmFja3VwW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBydWxlIGFjdGlvbiBjYWxsZWQgcmVqZWN0KCkgaW1wbHlpbmcgdGhlIG5leHQgcnVsZSBzaG91bGQgYmUgdGVzdGVkIGluc3RlYWQuXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbi8vIHJldHVybiBuZXh0IG1hdGNoIGluIGlucHV0XG5uZXh0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZG9uZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuRU9GO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5faW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9rZW4sXG4gICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgIHRlbXBNYXRjaCxcbiAgICAgICAgICAgIGluZGV4O1xuICAgICAgICBpZiAoIXRoaXMuX21vcmUpIHtcbiAgICAgICAgICAgIHRoaXMueXl0ZXh0ID0gJyc7XG4gICAgICAgICAgICB0aGlzLm1hdGNoID0gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJ1bGVzID0gdGhpcy5fY3VycmVudFJ1bGVzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRlbXBNYXRjaCA9IHRoaXMuX2lucHV0Lm1hdGNoKHRoaXMucnVsZXNbcnVsZXNbaV1dKTtcbiAgICAgICAgICAgIGlmICh0ZW1wTWF0Y2ggJiYgKCFtYXRjaCB8fCB0ZW1wTWF0Y2hbMF0ubGVuZ3RoID4gbWF0Y2hbMF0ubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgIG1hdGNoID0gdGVtcE1hdGNoO1xuICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJhY2t0cmFja19sZXhlcikge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRoaXMudGVzdF9tYXRjaCh0ZW1wTWF0Y2gsIHJ1bGVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JhY2t0cmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBydWxlIGFjdGlvbiBjYWxsZWQgcmVqZWN0KCkgaW1wbHlpbmcgYSBydWxlIE1JU21hdGNoLlxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZTogdGhpcyBpcyBhIGxleGVyIHJ1bGUgd2hpY2ggY29uc3VtZXMgaW5wdXQgd2l0aG91dCBwcm9kdWNpbmcgYSB0b2tlbiAoZS5nLiB3aGl0ZXNwYWNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLmZsZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLnRlc3RfbWF0Y2gobWF0Y2gsIHJ1bGVzW2luZGV4XSk7XG4gICAgICAgICAgICBpZiAodG9rZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZWxzZTogdGhpcyBpcyBhIGxleGVyIHJ1bGUgd2hpY2ggY29uc3VtZXMgaW5wdXQgd2l0aG91dCBwcm9kdWNpbmcgYSB0b2tlbiAoZS5nLiB3aGl0ZXNwYWNlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pbnB1dCA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuRU9GO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcgKyAodGhpcy55eWxpbmVubyArIDEpICsgJy4gVW5yZWNvZ25pemVkIHRleHQuXFxuJyArIHRoaXMuc2hvd1Bvc2l0aW9uKCksIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgIHRva2VuOiBudWxsLFxuICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMueXlsaW5lbm9cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmV0dXJuIG5leHQgbWF0Y2ggdGhhdCBoYXMgYSB0b2tlblxubGV4OmZ1bmN0aW9uIGxleCgpIHtcbiAgICAgICAgdmFyIHIgPSB0aGlzLm5leHQoKTtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyBhY3RpdmF0ZXMgYSBuZXcgbGV4ZXIgY29uZGl0aW9uIHN0YXRlIChwdXNoZXMgdGhlIG5ldyBsZXhlciBjb25kaXRpb24gc3RhdGUgb250byB0aGUgY29uZGl0aW9uIHN0YWNrKVxuYmVnaW46ZnVuY3Rpb24gYmVnaW4oY29uZGl0aW9uKSB7XG4gICAgICAgIHRoaXMuY29uZGl0aW9uU3RhY2sucHVzaChjb25kaXRpb24pO1xuICAgIH0sXG5cbi8vIHBvcCB0aGUgcHJldmlvdXNseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlIG9mZiB0aGUgY29uZGl0aW9uIHN0YWNrXG5wb3BTdGF0ZTpmdW5jdGlvbiBwb3BTdGF0ZSgpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDE7XG4gICAgICAgIGlmIChuID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2sucG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFja1swXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHByb2R1Y2UgdGhlIGxleGVyIHJ1bGUgc2V0IHdoaWNoIGlzIGFjdGl2ZSBmb3IgdGhlIGN1cnJlbnRseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlXG5fY3VycmVudFJ1bGVzOmZ1bmN0aW9uIF9jdXJyZW50UnVsZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAmJiB0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvbnNbdGhpcy5jb25kaXRpb25TdGFja1t0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDFdXS5ydWxlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvbnNbXCJJTklUSUFMXCJdLnJ1bGVzO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcmV0dXJuIHRoZSBjdXJyZW50bHkgYWN0aXZlIGxleGVyIGNvbmRpdGlvbiBzdGF0ZTsgd2hlbiBhbiBpbmRleCBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCBwcm9kdWNlcyB0aGUgTi10aCBwcmV2aW91cyBjb25kaXRpb24gc3RhdGUsIGlmIGF2YWlsYWJsZVxudG9wU3RhdGU6ZnVuY3Rpb24gdG9wU3RhdGUobikge1xuICAgICAgICBuID0gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxIC0gTWF0aC5hYnMobiB8fCAwKTtcbiAgICAgICAgaWYgKG4gPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2tbbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJJTklUSUFMXCI7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyBhbGlhcyBmb3IgYmVnaW4oY29uZGl0aW9uKVxucHVzaFN0YXRlOmZ1bmN0aW9uIHB1c2hTdGF0ZShjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5iZWdpbihjb25kaXRpb24pO1xuICAgIH0sXG5cbi8vIHJldHVybiB0aGUgbnVtYmVyIG9mIHN0YXRlcyBjdXJyZW50bHkgb24gdGhlIHN0YWNrXG5zdGF0ZVN0YWNrU2l6ZTpmdW5jdGlvbiBzdGF0ZVN0YWNrU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoO1xuICAgIH0sXG5vcHRpb25zOiB7fSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eSx5eV8sJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucyxZWV9TVEFSVCkge1xuXG52YXIgWVlTVEFURT1ZWV9TVEFSVDtcbnN3aXRjaCgkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zKSB7XG5jYXNlIDA6Lyogc2tpcCB3aGl0ZXNwYWNlICovXG5icmVhaztcbmNhc2UgMTpyZXR1cm4gJ1RFWFQnXG5icmVhaztcbmNhc2UgMjpyZXR1cm4gMTdcbmJyZWFrO1xuY2FzZSAzOnJldHVybiAxOFxuYnJlYWs7XG5jYXNlIDQ6cmV0dXJuIDI4XG5icmVhaztcbmNhc2UgNTpyZXR1cm4gMjdcbmJyZWFrO1xuY2FzZSA2OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDc6cmV0dXJuIDEwXG5icmVhaztcbmNhc2UgODpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSA5OnJldHVybiAnTkUnXG5icmVhaztcbmNhc2UgMTA6cmV0dXJuIDM0XG5icmVhaztcbmNhc2UgMTE6cmV0dXJuIDMzXG5icmVhaztcbmNhc2UgMTI6cmV0dXJuIDM1XG5icmVhaztcbmNhc2UgMTM6cmV0dXJuIDM2XG5icmVhaztcbmNhc2UgMTQ6cmV0dXJuIDhcbmJyZWFrO1xuY2FzZSAxNTpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNjpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNzpyZXR1cm4gMjJcbmJyZWFrO1xuY2FzZSAxODpyZXR1cm4gMjBcbmJyZWFrO1xuY2FzZSAxOTpyZXR1cm4gMTlcbmJyZWFrO1xuY2FzZSAyMDpyZXR1cm4gMTBcbmJyZWFrO1xuY2FzZSAyMTpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSAyMjpyZXR1cm4gMTFcbmJyZWFrO1xuY2FzZSAyMzpyZXR1cm4gMTJcbmJyZWFrO1xuY2FzZSAyNDpyZXR1cm4gOVxuYnJlYWs7XG5jYXNlIDI1OnJldHVybiAnJiYnXG5icmVhaztcbmNhc2UgMjY6cmV0dXJuIDI2XG5icmVhaztcbmNhc2UgMjc6cmV0dXJuIDMwXG5icmVhaztcbmNhc2UgMjg6cmV0dXJuIDI1XG5icmVhaztcbmNhc2UgMjk6cmV0dXJuIDIzXG5icmVhaztcbmNhc2UgMzA6cmV0dXJuICchJ1xuYnJlYWs7XG5jYXNlIDMxOnJldHVybiAnJSdcbmJyZWFrO1xuY2FzZSAzMjpyZXR1cm4gMTVcbmJyZWFrO1xuY2FzZSAzMzpyZXR1cm4gJz8nXG5icmVhaztcbmNhc2UgMzQ6cmV0dXJuICc6J1xuYnJlYWs7XG5jYXNlIDM1OnJldHVybiAxN1xuYnJlYWs7XG5jYXNlIDM2OnJldHVybiAxOFxuYnJlYWs7XG5jYXNlIDM3OnJldHVybiAyOVxuYnJlYWs7XG5jYXNlIDM4OnJldHVybiAyNFxuYnJlYWs7XG5jYXNlIDM5OnJldHVybiAnWydcbmJyZWFrO1xuY2FzZSA0MDpyZXR1cm4gJ10nXG5icmVhaztcbmNhc2UgNDE6cmV0dXJuIDVcbmJyZWFrO1xufVxufSxcbnJ1bGVzOiBbL14oPzpcXHMrKS8sL14oPzpcXCRbXlxcJF0qXFwkKS8sL14oPzpcXFxcbGVmdFxcKCkvLC9eKD86XFxcXHJpZ2h0XFwpKS8sL14oPzpcXFxcZnJhY1xceykvLC9eKD86XFxcXHNxcnRcXHspLywvXig/OlxcXFxjZG90XFxiKS8sL14oPzpcXFxcbFtlXSkvLC9eKD86XFxcXGdbZV0pLywvXig/OlxcXFxuW2VdKS8sL14oPzpcXFxcW2EtekEtWl0rKS8sL14oPzpbYS16QS1aXSkvLC9eKD86WzAtOV0rXFwuWzAtOV0qKS8sL14oPzpbMC05XSspLywvXig/Oj0pLywvXig/OlxcKikvLC9eKD86XFwuKS8sL14oPzpcXC8pLywvXig/Oi0pLywvXig/OlxcKykvLC9eKD86PD0pLywvXig/Oj49KS8sL14oPzo8KS8sL14oPzo+KS8sL14oPzohPSkvLC9eKD86JiYpLywvXig/Ol9bXlxcKFxce10pLywvXig/OlxcXlteXFwoXFx7XSkvLC9eKD86X1xceykvLC9eKD86XFxeXFx7KS8sL14oPzohKS8sL14oPzolKS8sL14oPzosKS8sL14oPzpcXD8pLywvXig/OjopLywvXig/OlxcKCkvLC9eKD86XFwpKS8sL14oPzpcXHspLywvXig/OlxcfSkvLC9eKD86XFxbKS8sL14oPzpcXF0pLywvXig/OiQpL10sXG5jb25kaXRpb25zOiB7XCJJTklUSUFMXCI6e1wicnVsZXNcIjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNSwzNiwzNywzOCwzOSw0MCw0MV0sXCJpbmNsdXNpdmVcIjp0cnVlfX1cbn07XG5yZXR1cm4gbGV4ZXI7XG59KSgpO1xucGFyc2VyLmxleGVyID0gbGV4ZXI7XG5mdW5jdGlvbiBQYXJzZXIgKCkge1xuICB0aGlzLnl5ID0ge307XG59XG5QYXJzZXIucHJvdG90eXBlID0gcGFyc2VyO3BhcnNlci5QYXJzZXIgPSBQYXJzZXI7XG5yZXR1cm4gbmV3IFBhcnNlcjtcbn0pKCk7XG5cblxuaWYgKHR5cGVvZiByZXF1aXJlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbmV4cG9ydHMucGFyc2VyID0gcGFyc2VyO1xuZXhwb3J0cy5QYXJzZXIgPSBwYXJzZXIuUGFyc2VyO1xuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcnNlci5wYXJzZS5hcHBseShwYXJzZXIsIGFyZ3VtZW50cyk7IH07XG5leHBvcnRzLm1haW4gPSBmdW5jdGlvbiBjb21tb25qc01haW4oYXJncykge1xuICAgIGlmICghYXJnc1sxXSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVXNhZ2U6ICcrYXJnc1swXSsnIEZJTEUnKTtcbiAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH1cbiAgICB2YXIgc291cmNlID0gcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMocmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShhcmdzWzFdKSwgXCJ1dGY4XCIpO1xuICAgIHJldHVybiBleHBvcnRzLnBhcnNlci5wYXJzZShzb3VyY2UpO1xufTtcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiByZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICBleHBvcnRzLm1haW4ocHJvY2Vzcy5hcmd2LnNsaWNlKDEpKTtcbn1cbn1cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcblxubW9kdWxlLmV4cG9ydHMuYXR0YWNoID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuXG5cbiAgICBmdW5jdGlvbiBEZXJpdmF0aXZlKHdydCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5kaWZmZXJlbnRpYXRlKHdydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIHZhciBDYXJ0U2luZSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWxcbiAgICAgICAgICAgICAgICB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWxcbiAgICAgICAgICAgICAgICB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTS5FeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbZ2xvYmFsLnNpbi5kZWZhdWx0KHgpLCBnbG9iYWwuWmVyb10pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ0NvbXBsZXggU2luZSBDYXJ0ZXNpYW4gZm9ybSBub3QgaW1wbGVtZW50ZWQgeWV0LicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydzaW4nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguc2luKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnNpbiwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNpbiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAvLyBzaW4oYStiaSkgPSBzaW4oYSljb3NoKGIpICsgaSBjb3MoYSlzaW5oKGIpXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHBfYiA9IE1hdGguZXhwKHguX2ltYWcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29zaF9iID0gKGV4cF9iICsgMSAvIGV4cF9iKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaW5oX2IgPSAoZXhwX2IgLSAxIC8gZXhwX2IpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXhOdW1lcmljYWwoTWF0aC5zaW4oeC5fcmVhbCkgKiBjb3NoX2IsIE1hdGguY29zKHguX3JlYWwpICogc2luaF9iKTtcbiAgICAgICAgICAgICovXG4gICAgICAgIH0sXG4gICAgICAgIHJlYWxpbWFnOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQ2FydFNpbmU7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxzaW4nLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguc2luJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnc2luJyxcbiAgICAgICAgdGl0bGU6ICdTaW5lIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Ucmlnb25vbWV0cmljX2Z1bmN0aW9ucyNTaW5lLjJDX2Nvc2luZS4yQ19hbmRfdGFuZ2VudCcsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxzaW4gKFxcXFxwaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydjb3MnLCAndGFuJ11cbiAgICB9KTtcbiAgICBnbG9iYWxbJ2NvcyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5jb3MoeC52YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuY29zLCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuY29zLCB4XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSxcbiAgICAgICAgZGVyaXZhdGl2ZTogZ2xvYmFsLnNpblsnQC0nXSgpLFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcY29zJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmNvcycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2NvcycsXG4gICAgICAgIHRpdGxlOiAnQ29zaW5lIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb3NpbmUgRnVuY3Rpb24gZGVzYycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxjb3MgKFxcXFxwaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydzaW4nLCAndGFuJ11cbiAgICB9KTtcblxuICAgIGdsb2JhbC5zaW4uZGVyaXZhdGl2ZSA9IGdsb2JhbC5jb3M7XG5cbiAgICBnbG9iYWxbJ3RhbiddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBzeW1ib2xpYzogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBnbG9iYWxbJ2xvZyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCwgYXNzdW1wdGlvbnMpIHtcblxuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB4LmEgPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB4LmEgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkluZmluaXR5WydALSddKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZih2ID4gMCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgubG9nKHYpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGFzc3VtcHRpb25zICYmIGFzc3VtcHRpb25zLnBvc2l0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwubG9nLCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5sb2csIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVhbGltYWc6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gQ2FydExvZztcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGxvZycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5sb2cnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdsb2cnLFxuICAgICAgICB0aXRsZTogJ05hdHVyYWwgTG9nYXJpdGhtJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCYXNlIGUuIFNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL05hdHVyYWxfbG9nYXJpdGhtJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGxvZyAoeWVeKDJ4KSknXSxcbiAgICAgICAgcmVsYXRlZDogWydleHAnLCAnTG9nJ11cbiAgICB9KTtcbiAgICB2YXIgSGFsZiA9IG5ldyBFeHByZXNzaW9uLlJhdGlvbmFsKDEsIDIpO1xuICAgIHZhciBDYXJ0TG9nID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICAgICAgZ2xvYmFsLmxvZy5kZWZhdWx0KHguYWJzKCkpLFxuICAgICAgICAgICAgICAgIHguYXJnKClcbiAgICAgICAgICAgIF0pWycqJ10oSGFsZik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBDYXJ0TG9nLl9fcHJvdG9fXyA9IGdsb2JhbC5sb2c7XG4gICAgZ2xvYmFsWydhdGFuMiddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBpZighICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgKCdhdGFuIG9ubHkgdGFrZXMgdmVjdG9yIGFyZ3VtZW50cycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeFswXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIGlmKHhbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5hdGFuMih4WzBdLnZhbHVlLCB4WzFdLnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuYXRhbjIsIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmF0YW4yLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgLy9UT0RPOiBEQU5HRVIhIEFzc3VtaW5nIHJlYWwgbnVtYmVycywgYnV0IGl0IHNob3VsZCBoYXZlIHNvbWUgZmFzdCB3YXkgdG8gZG8gdGhpcy5cbiAgICAgICAgICAgIHJldHVybiBbRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuYXRhbjIsIHhdKSwgTS5nbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFx0YW5eey0xfScsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hdGFuMicsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2F0YW4nLFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGU6ICdUd28gYXJndW1lbnQgYXJjdGFuZ2VudCBmdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJjdGFuKHksIHgpLiBXaWxsIGVxdWFsIGFyY3Rhbih5IC8geCkgZXhjZXB0IHdoZW4geCBhbmQgeSBhcmUgYm90aCBuZWdhdGl2ZS4gU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQXRhbjInXG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ2F0YW4nXSA9IGdsb2JhbC5hdGFuMjtcblxuICAgIGdsb2JhbFsnR2FtbWEnXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICBmdW5jdGlvbiBnYW1tbG4oeHgpIHtcbiAgICAgICAgICAgICAgICB2YXIgajtcbiAgICAgICAgICAgICAgICB2YXIgeCwgdG1wLCB5LCBzZXI7XG4gICAgICAgICAgICAgICAgdmFyIGNvZiA9IFtcbiAgICAgICAgICAgICAgICAgICAgNTcuMTU2MjM1NjY1ODYyOTIzNSxcbiAgICAgICAgICAgICAgICAgICAgLTU5LjU5Nzk2MDM1NTQ3NTQ5MTIsXG4gICAgICAgICAgICAgICAgICAgIDE0LjEzNjA5Nzk3NDc0MTc0NzEsXG4gICAgICAgICAgICAgICAgICAgIC0wLjQ5MTkxMzgxNjA5NzYyMDE5OSxcbiAgICAgICAgICAgICAgICAgICAgMC4zMzk5NDY0OTk4NDgxMTg4ODdlLTQsXG4gICAgICAgICAgICAgICAgICAgIDAuNDY1MjM2Mjg5MjcwNDg1NzU2ZS00LFxuICAgICAgICAgICAgICAgICAgICAtMC45ODM3NDQ3NTMwNDg3OTU2NDZlLTQsXG4gICAgICAgICAgICAgICAgICAgIDAuMTU4MDg4NzAzMjI0OTEyNDk0ZS0zLFxuICAgICAgICAgICAgICAgICAgICAtMC4yMTAyNjQ0NDE3MjQxMDQ4ODNlLTMsXG4gICAgICAgICAgICAgICAgICAgIDAuMjE3NDM5NjE4MTE1MjEyNjQzZS0zLFxuICAgICAgICAgICAgICAgICAgICAtMC4xNjQzMTgxMDY1MzY3NjM4OTBlLTMsXG4gICAgICAgICAgICAgICAgICAgIDAuODQ0MTgyMjM5ODM4NTI3NDMzZS00LFxuICAgICAgICAgICAgICAgICAgICAtMC4yNjE5MDgzODQwMTU4MTQwODdlLTQsXG4gICAgICAgICAgICAgICAgICAgIDAuMzY4OTkxODI2NTk1MzE2MjM0ZS01XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBpZiAoeHggPD0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93KCdiYWQgYXJnIGluIGdhbW1sbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB5ID0geCA9IHh4O1xuICAgICAgICAgICAgICAgIHRtcCA9IHggKyA1LjI0MjE4NzUwMDAwMDAwMDAwO1xuICAgICAgICAgICAgICAgIHRtcCA9ICh4ICsgMC41KSAqIE1hdGgubG9nKHRtcCkgLSB0bXA7XG4gICAgICAgICAgICAgICAgc2VyID0gMC45OTk5OTk5OTk5OTk5OTcwOTI7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IDE0OyBqKyspe1xuICAgICAgICAgICAgICAgICAgICBzZXIgKz0gY29mW2pdIC8gKyt5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdG1wICsgTWF0aC5sb2coMi41MDY2MjgyNzQ2MzEwMDA1ICogc2VyIC8geCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC5hO1xuICAgICAgICAgICAgICAgIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuQ29tcGxleEluZmluaXR5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZih2IDwgMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSAxO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvcihpID0gMTsgaSA8IHY7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcCAqPSBpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5HYW1tYSwgeF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuSW5maW5pdHk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKC1NYXRoLlBJIC8gKHYgKiBNYXRoLnNpbihNYXRoLlBJICogdikgKiBNYXRoLmV4cChnYW1tbG4oLXYpKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmV4cChnYW1tbG4odikpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuR2FtbWEsIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXEdhbW1hJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNLmdsb2JhbC5HYW1tYS5mJyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnR2FtbWEgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0dhbW1hX2Z1bmN0aW9uJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXEdhbW1hICh4KScsICd4ISddLFxuICAgICAgICByZWxhdGVkOiBbJ0xvZycsICdMb2dHYW1tYSddXG4gICAgfTtcbiAgICBnbG9iYWxbJ1JlJ10gPSB7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4LnJlYWwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICByZXR1cm4gW3gucmVhbCgpLCBnbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxSZSdcbiAgICB9O1xuICAgIGdsb2JhbFsnSW0nXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIHguaW1hZygpO1xuICAgICAgICB9LFxuICAgICAgICBkaXN0cmlidXRlZF91bmRlcl9kaWZmZXJlbnRpYXRpb246IHRydWUsXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgcmV0dXJuIFt4LmltYWcoKSwgZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcSW0nXG4gICAgfVxuICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsLnByb3RvdHlwZS5wb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJysnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1swXS5wb3NpdGl2ZSAmJiB0aGlzWzFdLnBvc2l0aXZlICYmIHRoaXNbMF0ucG9zaXRpdmUoKSAmJiB0aGlzWzFdLnBvc2l0aXZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSB0aGlzWzFdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpc1swXS5wb3NpdGl2ZSAmJiB0aGlzWzFdLnBvc2l0aXZlICYmIHRoaXNbMF0ucG9zaXRpdmUoKSAmJiB0aGlzWzFdLnBvc2l0aXZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ14nKSB7XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgICAgIHZhciBmID0gdGhpc1sxXS5yZWR1Y2UoKTtcbiAgICAgICAgICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlLnBvc2l0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA+IDA7XG4gICAgfTtcbiAgICBnbG9iYWxbJ3NxcnQnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmKHYgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLlplcm8sIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5zcXJ0KHYpKVxuICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5zcXJ0KHYpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgICAgICAgICAgaWYoeC5wb3NpdGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICAgICAgICAgICAgICB4WzBdLFxuICAgICAgICAgICAgICAgICAgICB4WzFdWycvJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSlcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgdGhyb3coJ1NRUlQ6ID8/PycpO1xuICAgICAgICAgICAgc3dpdGNoICh4LmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkNvbXBsZXg6XG4gICAgICAgICAgICAgICAgICAgIC8vaHR0cDovL3d3dy5tYXRocHJvcHJlc3MuY29tL3N0YW4vYmlibGlvZ3JhcGh5L2NvbXBsZXhTcXVhcmVSb290LnBkZlxuICAgICAgICAgICAgICAgICAgICB2YXIgc2duX2I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4Ll9pbWFnID09PSAwLjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KE1hdGguc3FydCh4Ll9yZWFsKSwgMCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZih4Ll9pbWFnPjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNnbl9iID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2duX2IgPSAtMS4wO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBzX2EyX2IyID0gTWF0aC5zcXJ0KHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG9uZV9vbl9ydDIgKiBNYXRoLnNxcnQoc19hMl9iMiArIHguX3JlYWwpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IHNnbl9iICogb25lX29uX3J0MiAqIE1hdGguc3FydChzX2EyX2IyIC0geC5fcmVhbCk7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWw6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5SZWFsTnVtZXJpY2FsKE1hdGguc3FydCh4KSk7XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuUmVhbDpcbiAgICAgICAgICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdeJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5hYnMuYXBwbHkodW5kZWZpbmVkLCB4WzBdLmFwcGx5KCdeJywgeFsxXS5hcHBseSgnLycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMiwwKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgLy9UT0RPOiBEQU5HRVIhIEFzc3VtaW5nIHJlYWwgbnVtYmVycywgYnV0IGl0IHNob3VsZCBoYXZlIHNvbWUgZmFzdCB3YXkgdG8gZG8gdGhpcy5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy9Vc2VzIGV4cCwgYXRhbjIgYW5kIGxvZyBmdW5jdGlvbnMuIEEgcmVhbGx5IGJhZCBpZGVhLiAoc3F1YXJlIHJvb3RpbmcsIHRoZW4gc3F1YXJpbmcsIHRoZW4gYXRhbiwgYWxzbyBbZXhwKGxvZyldKVxuICAgICAgICAgICAgcmV0dXJuIHhbJ14nXShuZXcgRXhwcmVzc2lvbi5SYXRpb25hbCgxLCAyKSkucmVhbGltYWcoKTtcbiAgICAgICAgICAgIC8vdmFyIHJpID0geC5yZWFsaW1hZygpO1xuICAgICAgICAgICAgLy9yZXR1cm4gW0V4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKSwgTS5nbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxzcXJ0JyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLnNxcnQnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdzcXJ0JyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnU3FydCBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU3F1YXJlX1Jvb3QnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcc3FydCAoeF40KSddLFxuICAgICAgICByZWxhdGVkOiBbJ3BvdycsICdhYnMnLCAnbW9kJ11cbiAgICB9KTtcbiAgICBnbG9iYWxbJ2FicyddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgLy9Vc2luZyBhYnMgaXMgYmV0dGVyIChJIHRoaW5rKSBiZWNhdXNlIGl0IGZpbmRzIHRoZSBtZXRob2QgdGhyb3VnaCB0aGUgcHJvdG90eXBlIGNoYWluLFxuICAgICAgICAgICAgLy93aGljaCBpcyBnb2luZyB0byBiZSBmYXN0ZXIgdGhhbiBkb2luZyBhbiBpZiBsaXN0IC8gc3dpdGNoIGNhc2UgbGlzdC5cbiAgICAgICAgICAgIHJldHVybiB4LmFicygpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcYWJzJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmFicycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2FicycsXG4gICAgICAgIHRpdGllOiAnQWJzb2x1dGUgVmFsdWUgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FicycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxhYnMgKC0zKScsICdcXFxcYWJzIChpKzMpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnYXJnJywgJ3RhbiddXG4gICAgfSk7XG5cbiAgICAvLyBJdCBpcyBzZWxmLXJlZmVyZW50aWFsXG4gICAgZ2xvYmFsLmFicy5kZXJpdmF0aXZlID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoKTtcbiAgICAgICAgICAgIHZhciB5ID0gc1snLyddKHMuYWJzKCkpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKHksIFtzXSk7XG4gICAgfSgpKTtcbiAgICBnbG9iYWxbJ2FyZyddID0ge1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUkcgSVMgRk9SIFVTRVIgSU5QVVQgT05MWS4gVVNFIC5hcmcoKScpO1xuICAgICAgICAgICAgLy9Vc2luZyBhYnMgaXMgYmV0dGVyIChJIHRoaW5rKSBiZWNhdXNlIGl0IGZpbmRzIHRoZSBtZXRob2QgdGhyb3VnaCB0aGUgcHJvdG90eXBlIGNoYWluLFxuICAgICAgICAgICAgLy93aGljaCBpcyBnb2luZyB0byBiZSBmYXN0ZXIgdGhhbiBkb2luZyBhbiBpZiBsaXN0IC8gc3dpdGNoIGNhc2UgbGlzdC4gVE9ETzogQ2hlY2sgdGhlIHRydXRoZnVsbG5lcyBvZiB0aGlzIVxuICAgICAgICAgICAgcmV0dXJuIHguYXJnKCk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxhcmcnLCAvL3RlbXBcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmFyZ19yZWFsJyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGllOiAnQXJnIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmcnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcYXJnICgtMyknLCAnXFxcXGFyZyAoMyknLCAnXFxcXGFyZygzKzJpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2FicyddXG4gICAgfVxuXG5cblxuICAgIGdsb2JhbFsnZSddID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLkUsIDApO1xuICAgIGdsb2JhbFsnZSddLnRpdGxlID0gJ2UnO1xuICAgIGdsb2JhbFsnZSddLmRlc2NyaXB0aW9uID0gJ1RoZSB0cmFuc2NlbmRlbnRhbCBudW1iZXIgdGhhdCBpcyB0aGUgYmFzZSBvZiB0aGUgbmF0dXJhbCBsb2dhcml0aG0sIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gMi43MTgyOC4nO1xuICAgIGdsb2JhbC5lLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdNYXRoLkUnKTtcbiAgICAgICAgfVxuICAgICAgICBpZihsYW5nID09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdlJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCcyLjcxODI4MTgyODQ1OTA0NScpO1xuICAgIH07XG5cblxuICAgIGdsb2JhbFsncGknXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5QSSwgMCk7XG4gICAgZ2xvYmFsWydwaSddLnRpdGxlID0gJ1BpJztcbiAgICBnbG9iYWxbJ3BpJ10uZGVzY3JpcHRpb24gPSAnJztcbiAgICBnbG9iYWwucGkucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ01hdGguUEknKTtcbiAgICAgICAgfVxuICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnXFxcXHBpJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCczLjE0MTU5MjY1MzU4OTc5MycpO1xuICAgIH07XG4gICAgLy8gVGhlIHJlYWwgY2lyY2xlIGNvbnN0YW50OlxuICAgIGdsb2JhbC50YXUgPSBnbG9iYWxbJ3BpJ11bJyonXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKTtcblxuICAgIGdsb2JhbFsnSW5maW5pdHknXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoSW5maW5pdHksIDApO1xuICAgIGdsb2JhbFsnSW5maW5pdHknXS50aXRsZSA9ICdJbmZpbml0eSc7XG4gICAgZ2xvYmFsWydJbmZpbml0eSddLmRlc2NyaXB0aW9uID0gJyc7XG4gICAgZ2xvYmFsWydpbmZ0eSddID0gZ2xvYmFsLkluZmluaXR5O1xuXG5cbiAgICBnbG9iYWxbJ1plcm8nXSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoMCk7XG4gICAgZ2xvYmFsWydaZXJvJ10udGl0bGUgPSAnWmVybyc7XG4gICAgZ2xvYmFsWydaZXJvJ10uZGVzY3JpcHRpb24gPSAnQWRkaXRpdmUgSWRlbnRpdHknO1xuICAgIGdsb2JhbFsnWmVybyddWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgfTtcbiAgICBnbG9iYWxbJ1plcm8nXVsnKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcbiAgICBnbG9iYWxbJ1plcm8nXVsnQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBnbG9iYWxbJ1plcm8nXVsnLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHhbJ0AtJ10oKTtcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydPbmUnXSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoMSk7XG4gICAgZ2xvYmFsWydPbmUnXS50aXRsZSA9ICdPbmUnO1xuICAgIGdsb2JhbFsnT25lJ10uZGVzY3JpcHRpb24gPSAnTXVsdGlwbGljYXRpdmUgSWRlbnRpdHknO1xuICAgIGdsb2JhbFsnT25lJ11bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG5cbiAgICBnbG9iYWwubG9nLmRlcml2YXRpdmUgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyhnbG9iYWwuT25lWycvJ10obmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoKSkpO1xuXG4gICAgZ2xvYmFsWydpJ10gPSBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW2dsb2JhbFsnWmVybyddLCBnbG9iYWxbJ09uZSddXSk7XG4gICAgZ2xvYmFsWydpJ10udGl0bGUgPSAnSW1hZ2luYXJ5IFVuaXQnO1xuICAgIGdsb2JhbFsnaSddLmRlc2NyaXB0aW9uID0gJ0EgbnVtYmVyIHdoaWNoIHNhdGlzZmllcyB0aGUgcHJvcGVydHkgPG0+aV4yID0gLTE8L20+Lic7XG4gICAgZ2xvYmFsWydpJ10ucmVhbGltYWcgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgZ2xvYmFsLlplcm8sXG4gICAgICAgICAgICBnbG9iYWwuT25lXG4gICAgICAgIF0pO1xuICAgIH07XG4gICAgZ2xvYmFsWydpJ11bJypbVE9ET10nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIFxuICAgIH07XG5cbiAgICBnbG9iYWxbJ2QnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkluZmluaXRlc2ltYWwoeCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsb2JhbC5kWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgICAgICBpZih4LnggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBEZXJpdmF0aXZlIG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEZXJpdmF0aXZlKHgueCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4LnggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoeC54LCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERlcml2YXRpdmUoeCk7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25mdXNpbmcgaW5maXRlc2ltYWwgb3BlcmF0b3IgZGl2aXNpb24nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93KCdEaXZpZGluZyBkIGJ5IHNvbWUgbGFyZ2UgbnVtYmVyLicpO1xuICAgICAgICBcbiAgICB9O1xuICAgIGdsb2JhbFsndW5kZWZpbmVkJ10gPSB7XG4gICAgICAgIHM6IGZ1bmN0aW9uIChsYW5nKXtcbiAgICAgICAgICAgIGlmIChsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgndW5kZWZpbmVkJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnKDEuMC8wLjApJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGRpZmZlcmVudGlhdGU6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcqJzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJysnOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnLSc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnLyc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnXic6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnQC0nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgZ2xvYmFsWydzdW0nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHRocm93KCdTdW0gbm90IHByb3Blcmx5IGNvbnN0cnVjdGVkIHlldC4nKTtcbiAgICAgICAgICAgIHJldHVybiAzO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZ2xvYmFsWydzdW0nXVsnXyddID0gZnVuY3Rpb24gKGVxKSB7XG4gICAgICAgIC8vIHN0YXJ0OiBcbiAgICAgICAgdmFyIHQgPSBlcVswXTtcbiAgICAgICAgdmFyIHYgPSBlcVsxXTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN1bS5SZWFsKHQsIHYpO1xuICAgIH1cbiAgICBcbn07XG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIExhbmd1YWdlKHBhcnNlciwgQ29uc3RydWN0LCBsYW5ndWFnZSkge1xuICAgIHRoaXMuY2ZnID0gcGFyc2VyO1xuICAgIHRoaXMuQ29uc3RydWN0ID0gQ29uc3RydWN0O1xuICAgIHZhciBvcGVyYXRvcnMgPSB0aGlzLm9wZXJhdG9ycyA9IHt9LFxuICAgICAgICBvcFByZWNlZGVuY2UgPSAwO1xuICAgIGZ1bmN0aW9uIG9wKHYsIGFzc29jaWF0aXZpdHksIGFyaXR5KSB7XG5cbiAgICB9XG4gICAgbGFuZ3VhZ2UuZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICBmdW5jdGlvbiBkZWZvcChzdHIsIG8pIHtcbiAgICAgICAgICAgIHZhciBhc3NvY2lhdGl2aXR5ID0gb1sxXSB8fCAnbGVmdCc7XG4gICAgICAgICAgICB2YXIgYXJpdHkgPSAob1syXSA9PT0gdW5kZWZpbmVkKSA/IDIgOiBvWzJdO1xuXG4gICAgICAgICAgICBvcGVyYXRvcnNbc3RyXSA9ICB7XG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpdml0eTogYXNzb2NpYXRpdml0eSxcbiAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBvcFByZWNlZGVuY2UrKyxcbiAgICAgICAgICAgICAgICBhcml0eTogYXJpdHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0ciA9IG9bMF07XG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGVmb3Aoc3RyLCBvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ci5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICAgICAgZGVmb3Aocywgbyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5MYW5ndWFnZS5Db2RlID0gcmVxdWlyZSgnLi9Db2RlJyk7XG5cbnZhciBfICAgICAgICA9IExhbmd1YWdlLnByb3RvdHlwZTtcblxuXy5wYXJzZSAgICAgID0gcmVxdWlyZSgnLi9wYXJzZScpO1xuXy5zdHJpbmdpZnkgID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcblxuXy5wb3N0Zml4ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBvcGVyYXRvciA9IHRoaXMub3BlcmF0b3JzW3N0cl07XG4gICAgcmV0dXJuICBvcGVyYXRvci5hc3NvY2lhdGl2aXR5ID09PSAwICYmIFxuICAgICAgICAgICAgb3BlcmF0b3IuYXJpdHkgPT09IDE7XG59O1xuXG5fLnVuYXJ5ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciB1bmFyeV9zZWNvbmRhcnlzID0gWycrJywgJy0nLCAnwrEnXTtcbiAgICByZXR1cm4gKHVuYXJ5X3NlY29uZGFyeXMuaW5kZXhPZihvKSAhPT0gLTEpID8gKCdAJyArIG8pIDogZmFsc2U7XG59O1xuXG5fLmFzc29jaWF0aXZlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHRocm93IG5ldyBFcnJvcignYXNzb2NpYXRpdmU/Pz8/Jyk7XG4gICAgLy8gcmV0dXJuIHRoaXMub3BlcmF0b3JzW3N0cl0uYXNzb2NpYXRpdml0eSA9PT0gdHJ1ZTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IExhbmd1YWdlO1xuIiwiKGZ1bmN0aW9uKCl7dmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG5mdW5jdGlvbiBFeHByZXNzaW9uKCkge1xuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEV4cHJlc3Npb247XG5cbkV4cHJlc3Npb24uTGlzdCAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTGlzdCcpO1xuRXhwcmVzc2lvbi5MaXN0LlJlYWwgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9MaXN0L1JlYWwnKTtcbkV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuICA9IHJlcXVpcmUoJy4vTGlzdC9Db21wbGV4Q2FydGVzaWFuJyk7XG5FeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyICAgICAgPSByZXF1aXJlKCcuL0xpc3QvQ29tcGxleFBvbGFyJyk7XG5FeHByZXNzaW9uLkNvbnN0YW50ICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0NvbnN0YW50Jyk7XG5FeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXggICAgICAgPSByZXF1aXJlKCcuL051bWVyaWNhbENvbXBsZXgnKTtcbkV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCAgICAgICAgICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsUmVhbCcpO1xuRXhwcmVzc2lvbi5SYXRpb25hbCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9SYXRpb25hbCcpO1xuRXhwcmVzc2lvbi5JbnRlZ2VyICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9JbnRlZ2VyJyk7XG5FeHByZXNzaW9uLlN5bWJvbCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N5bWJvbCcpO1xuRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCAgICAgICAgICAgID0gcmVxdWlyZSgnLi9TeW1ib2wvUmVhbCcpO1xuRXhwcmVzc2lvbi5TdGF0ZW1lbnQgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9TdGF0ZW1lbnQnKTtcbkV4cHJlc3Npb24uVmVjdG9yICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vVmVjdG9yJyk7XG5FeHByZXNzaW9uLk1hdHJpeCAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL01hdHJpeCcpO1xuRXhwcmVzc2lvbi5GdW5jdGlvbiAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9GdW5jdGlvbicpO1xuRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyAgICAgID0gcmVxdWlyZSgnLi9GdW5jdGlvbi9TeW1ib2xpYycpO1xuRXhwcmVzc2lvbi5JbmZpbml0ZXNpbWFsICAgICAgICAgID0gcmVxdWlyZSgnLi9JbmZpbml0ZXNpbWFsJyk7XG5cbnZhciBfID0gRXhwcmVzc2lvbi5wcm90b3R5cGU7XG5cbl8udG9TdHJpbmcgPSBudWxsO1xuXy52YWx1ZU9mID0gbnVsbDtcblxuXy5pbWFnZVVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ2h0dHA6Ly9sYXRleC5jb2RlY29ncy5jb20vZ2lmLmxhdGV4PycgK1xuICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodGhpcy5zKCd0ZXh0L2xhdGV4Jykucyk7XG59O1xuXG5fLnJlbmRlckxhVGVYID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLnNyYyA9IHRoaXMuaW1hZ2VVUkwoKTtcbiAgICByZXR1cm4gaW1hZ2U7XG59O1xuXG4vLyBzdWJzdHV0aW9uIGRlZmF1bHQ6XG5fLnN1YiA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGxpbWl0IGRlZmF1bHRcbl8ubGltID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gdGhpcy5zdWIoeCwgeSk7XG59O1xuXG5fWycsJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN0YXRlbWVudCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29uZGl0aW9uYWwoeCwgdGhpcyk7XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgeF0pO1xufTtcblxuXG5bJz0nLCAnIT0nLCAnPicsICc+PScsICc8JywgJzw9J10uZm9yRWFjaChmdW5jdGlvbiAob3BlcmF0b3IpIHtcbiAgICBfW29wZXJhdG9yXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TdGF0ZW1lbnQodGhpcywgeCwgb3BlcmF0b3IpO1xuICAgIH07XG59KTtcblxuXG5cbi8vIGNyb3NzUHJvZHVjdCBpcyB0aGUgJyZ0aW1lczsnIGNoYXJhY3RlclxudmFyIGNyb3NzUHJvZHVjdCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjE1KTtcblxuX1tjcm9zc1Byb2R1Y3RdID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpc1snKiddKHgpO1xufTtcblxuXG4vLyBUaGUgZGVmYXVsdCBvcGVyYXRvciBvY2N1cnMgd2hlbiB0d28gZXhwcmVzc2lvbnMgYXJlIGFkamFjZW50IHRvIGVhY2hvdGhlcjogUyAtPiBlIGUuXG4vLyBEZXBlbmRpbmcgb24gdGhlIHR5cGUsIGl0IHVzdWFsbHkgcmVwcmVzZW50cyBhc3NvY2lhdGl2ZSBtdWx0aXBsaWNhdGlvbi5cbi8vIFNlZSBiZWxvdyBmb3IgdGhlIGRlZmF1bHQgJyonIG9wZXJhdG9yIGltcGxlbWVudGF0aW9uLlxuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpc1snKiddKHgpO1xufTtcblxuWycvJywgJysnLCAnLScsICdALScsICdeJywgJyUnXS5mb3JFYWNoKGZ1bmN0aW9uIChvcGVyYXRvcikge1xuICAgIF9bb3BlcmF0b3JdID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4gICAgfTtcbn0pO1xuXG5cblxuXG4vLyBUaGlzIG1heSBsb29rIGxpa2Ugd2UgYXJlIGFzc3VtaW5nIHRoYXQgeCBpcyBhIG51bWJlcixcbi8vIGJ1dCByZWFsbHkgdGhlIGltcG9ydGFudCBhc3N1bXB0aW9uIGlzIHNpbXBseVxuLy8gdGhhdCBpdCBpcyBmaW5pdGUuXG4vLyBUaHVzIGluZmluaXRpZXMgYW5kIGluZGV0ZXJtaW5hdGVzIHNob3VsZCBBTFdBWVNcbi8vIG92ZXJyaWRlIHRoaXMgb3BlcmF0b3JcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLk9uZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnKicpO1xufTtcblxuXG5cblxuXG5cblxuXG5cblxuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgICAgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgZ2xvYmFsICA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRleHQ7XG5cbnV0aWwuaW5oZXJpdHMoQ29udGV4dCwge3Byb3RvdHlwZTogZ2xvYmFsfSk7XG5cbmZ1bmN0aW9uIENvbnRleHQoKSB7XG5cbn1cblxuQ29udGV4dC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zcGxpY2UoMCk7XG59O1xuXG59KSgpIiwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7ZnVuY3Rpb24gZmlsdGVyICh4cywgZm4pIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBSZWdleCB0byBzcGxpdCBhIGZpbGVuYW1lIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cbi8vIHBvc2l4IHZlcnNpb25cbnZhciBzcGxpdFBhdGhSZSA9IC9eKC4rXFwvKD8hJCl8XFwvKT8oKD86Lis/KT8oXFwuW14uXSopPykkLztcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG52YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG5mb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gIHZhciBwYXRoID0gKGkgPj0gMClcbiAgICAgID8gYXJndW1lbnRzW2ldXG4gICAgICA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgfHwgIXBhdGgpIHtcbiAgICBjb250aW51ZTtcbiAgfVxuXG4gIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG4vLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4vLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5yZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG52YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLycsXG4gICAgdHJhaWxpbmdTbGFzaCA9IHBhdGguc2xpY2UoLTEpID09PSAnLyc7XG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuICBcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgcmV0dXJuIHAgJiYgdHlwZW9mIHAgPT09ICdzdHJpbmcnO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBkaXIgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzFdIHx8ICcnO1xuICB2YXIgaXNXaW5kb3dzID0gZmFsc2U7XG4gIGlmICghZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZVxuICAgIHJldHVybiAnLic7XG4gIH0gZWxzZSBpZiAoZGlyLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgKGlzV2luZG93cyAmJiBkaXIubGVuZ3RoIDw9IDMgJiYgZGlyLmNoYXJBdCgxKSA9PT0gJzonKSkge1xuICAgIC8vIEl0IGlzIGp1c3QgYSBzbGFzaCBvciBhIGRyaXZlIGxldHRlciB3aXRoIGEgc2xhc2hcbiAgICByZXR1cm4gZGlyO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGEgZnVsbCBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIHJldHVybiBkaXIuc3Vic3RyaW5nKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsyXSB8fCAnJztcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzNdIHx8ICcnO1xufTtcblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IEZ1bmN0aW9uICh3aGljaCBpdCBjYWxscyBldmFsKVxuLypqc2hpbnQgLVcwNjEgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb2RlO1xuXG5mdW5jdGlvbiBDb2RlKHMsIHByZSl7XG4gICAgdGhpcy5wcmUgPSBbXSB8fCBwcmU7XG4gICAgdGhpcy5zID0gJycgfHwgcztcbiAgICB0aGlzLnZhcnMgPSAwO1xuICAgIHRoaXMucCA9IEluZmluaXR5O1xufVxuXG52YXIgXyA9IENvZGUucHJvdG90eXBlO1xuXG4vKlxuICAgIFRoaXMgdXNlcyBhIGdsb2JhbCBzdGF0ZS5cblxuICAgIFBlcmhhcHMgdGhlcmUgaXMgYSBuaWNlciB3YXksIGJ1dCB0aGlzIHdpbGwgd29yay5cbiovXG5Db2RlLm5ld0NvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ29kZS5jb250ZXh0VmFyaWFibGVDb3VudCA9IDA7XG59O1xuXG5Db2RlLm5ld0NvbnRleHQoKTtcblxuLy8gRm9yIGZhc3RlciBldmFsdWF0aW9uIG11bHRpcGxlIHN0YXRtZW50cy4gRm9yIGV4YW1wbGUgKHgrMyleMiB3aWxsIGZpcnN0IGNhbGN1bGF0ZSB4KzMsIGFuZCBzbyBvbi5cbl8udmFyaWFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd0JyArIChDb2RlLmNvbnRleHRWYXJpYWJsZUNvdW50KyspLnRvU3RyaW5nKDM2KTtcbn07XG5cbl8ubWVyZ2UgPSBmdW5jdGlvbiAobywgc3RyLCBwLCBwcmUpIHtcbiAgICB0aGlzLnMgPSBzdHI7XG4gICAgaWYgKHByZSkge1xuICAgICAgICB0aGlzLnByZS5wdXNoKHByZSk7XG4gICAgfVxuICAgIHZhciBpO1xuICAgIHRoaXMucHJlLnB1c2guYXBwbHkodGhpcy5wcmUsIG8ucHJlKTtcbiAgICB0aGlzLnZhcnMgKz0gby52YXJzO1xuICAgIHRoaXMucCA9IHA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fLnVwZGF0ZSA9IGZ1bmN0aW9uIChzdHIsIHAsIHByZSkge1xuICAgIHRoaXMucCA9IHA7XG4gICAgaWYocHJlKSB7XG4gICAgICAgIHRoaXMucHJlLnB1c2gocHJlKTtcbiAgICB9XG4gICAgdGhpcy5zID0gc3RyO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gSmF2YXNjcmlwdCBjb21wbGlhdGlvblxuXy5jb21waWxlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oeCwgdGhpcy5wcmUuam9pbignXFxuJykgKyAncmV0dXJuICcgKyB0aGlzLnMpO1xufTtcblxuXy5nbHNsRnVuY3Rpb24gPSBmdW5jdGlvbiAodHlwZSwgbmFtZSwgcGFyYW1ldGVycykge1xuICAgIHJldHVybiB0eXBlICsgJyAnICsgbmFtZSArICcoJyArIHBhcmFtZXRlcnMgKyAnKXtcXG4nICsgdGhpcy5wcmUuam9pbignXFxuJykgKyAncmV0dXJuICcgKyB0aGlzLnMgKyAnO1xcbn1cXG4nO1xufTtcblxuXG59KSgpIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdpZnkoZXhwciwgbGFuZykge1xuICAgIHJldHVybiBleHByLnMobGFuZyk7XG59O1xuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29uc3RhbnQ7XG5cbnV0aWwuaW5oZXJpdHMoQ29uc3RhbnQsIHN1cCk7XG5cbmZ1bmN0aW9uIENvbnN0YW50KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRXhwcmVzc2lvbi5Db25zdGFudCBjcmVhdGVkIGRpcmVjdGx5Jyk7XG59XG5cbnZhciBfID0gQ29uc3RhbnQucHJvdG90eXBlO1xuXG5fLnNpbXBsaWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXG5fLmFwcGx5ID0gZnVuY3Rpb24gKHgpe1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vQ29uc3RhbnQnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1lcmljYWxDb21wbGV4O1xuXG51dGlsLmluaGVyaXRzKE51bWVyaWNhbENvbXBsZXgsIHN1cCk7XG5cbmZ1bmN0aW9uIE51bWVyaWNhbENvbXBsZXgocmVhbCwgaW1hZykge1xuICAgIHRoaXMuX3JlYWwgPSByZWFsO1xuICAgIHRoaXMuX2ltYWcgPSBpbWFnO1xufVxuXG52YXIgXyA9IE51bWVyaWNhbENvbXBsZXgucHJvdG90eXBlO1xuXG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9yZWFsKTtcbn07XG5cbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX2ltYWcpO1xufTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5fcmVhbCksXG4gICAgICAgIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5faW1hZylcbiAgICBdKTtcbn07XG5cbl8uY29uanVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCwgLXRoaXMuX2ltYWcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC5fcmVhbCwgdGhpcy5faW1hZyArIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC52YWx1ZSwgdGhpcy5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4ICsnKTtcbiAgICB9XG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHguX3JlYWwsIHRoaXMuX2ltYWcgLSB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC52YWx1ZSwgdGhpcy5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAtJyk7XG4gICAgfVxufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLl9yZWFsID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHguX3JlYWwgLSB0aGlzLl9pbWFnICogeC5faW1hZywgdGhpcy5fcmVhbCAqIHguX2ltYWcgKyB0aGlzLl9pbWFnICogeC5fcmVhbCk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHgudmFsdWUsIHRoaXMuX2ltYWcgKiB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggKicpO1xuICAgIH1cbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5faW1hZyA9PT0gMCAmJiB0aGlzLl9yZWFsID09PSAwKSB7XG4gICAgICAgIC8vIFRPRE86IFByb3ZpZGVkIHggIT0gMFxuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIFxuICAgIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgodGhpcy5fcmVhbCAqIHguX3JlYWwgKyB0aGlzLl9pbWFnICogeC5faW1hZykvY2NfZGQsICh0aGlzLl9pbWFnICogeC5fcmVhbCAtIHRoaXMuX3JlYWwgKiB4Ll9pbWFnKSAvIGNjX2RkKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC8geC52YWx1ZSwgdGhpcy5faW1hZyAvIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWycvJ10oeCk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiB0aGlzLnBvbGFyKClbJy8nXSh4KTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAvJyk7XG4gICAgfVxufTtcblxuX1snISddID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh0aGlzKTtcbn07XG5cbi8vIChmdW5jdGlvbigpe1xuLy8gICAgIHJldHVybjtcbi8vICAgICB2YXIgb25lX29uX3J0MiA9IDEvTWF0aC5zcXJ0KDIpO1xuLy8gICAgIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleC5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbihvcGVyYXRvciwgeCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKXtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vIENvbnRyYWRpY3RzIHheMCA9IDFcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geC5hcHBseSgnQC0nKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDEgJiYgdGhpcy5faW1hZyA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICAvL05vdGU6IFRoZXJlIGlzIG5vdCBtZWFudCB0byBiZSBhIGJyZWFrIGhlcmUuXG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vQ29udHJhZGljcyB4LzAgPSBJbmZpbml0eVxuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgICAgICBpZiAob3BlcmF0b3IgPT09ICcsJykge1xuLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnQCsnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgICAgICAgICBjYXNlICdALSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KC10aGlzLl9yZWFsLCAtdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXFx1MjIxQSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdPTEQgU1FSVC4gTmV3IG9uZSBpcyBhIGZ1bmN0aW9uLCBub3Qgb3BlcmF0b3IuJylcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgocCwgcSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKysnOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0tJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcignUG9zdGZpeCAnICtvcGVyYXRvciArICcgb3BlcmF0b3IgYXBwbGllZCB0byB2YWx1ZSB0aGF0IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKz0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy09Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLz0nOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgUmVmZXJlbmNlRXJyb3IoJ0xlZnQgc2lkZSBvZiBhc3NpZ25tZW50IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyAxLCB0aGlzLl9pbWFnKSk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4LnZhbHVlLCB0aGlzLl9pbWFnICogeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC8geC52YWx1ZSwgdGhpcy5faW1hZyAvIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMuX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB4LnZhbHVlO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEgKyBiKmIpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGIsIGEpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IHRoZXRhICogYztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIChhK2JpKShjK2RpKSA9IChhYy1iZCkgKyAoYWQrYmMpaSBcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHguX3JlYWwgLSB0aGlzLl9pbWFnICogeC5faW1hZywgdGhpcy5fcmVhbCAqIHguX2ltYWcgKyB0aGlzLl9pbWFnICogeC5fcmVhbCk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4Ll9yZWFsLCB0aGlzLl9pbWFnICsgeC5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4Ll9yZWFsLCB0aGlzLl9pbWFnIC0geC5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vICAoYStiaSkvKGMrZGkpIFxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gWyhhK2JpKShjLWRpKV0vWyhjK2RpKShjLWRpKV1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFsoYStiaSkoYy1kaSldL1tjYyArIGRkXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gW2FjIC1kYWkgK2JjaSArIGJkXS9bY2MrZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbYWMgKyBiZCArIChiYyAtIGRhKV0vW2NjK2RkXVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgodGhpcy5fcmVhbCAqIHguX3JlYWwgKyB0aGlzLl9pbWFnICogeC5faW1hZykvY2NfZGQsICh0aGlzLl9pbWFnICogeC5fcmVhbCAtIHRoaXMuX3JlYWwqeC5faW1hZykvY2NfZGQpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMuX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSArIGIqYik7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoYiwgYSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZCArIHRoZXRhICogYztcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMgLSB0aGV0YSAqIGQpO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvbGFyKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgY29uc29sZS5lcnJvcignY21wbHggLiAnICsgb3BlcmF0b3IgKyAnID0+IEUuTGlzdD8nKTtcbi8vICAgICAgICAgLypcbi8vICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMC4wICYmIHRoaXMuX2ltYWcgPT09IDAuMCl7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgfVxuLy8gICAgICAgICAqL1xuICAgICAgICBcbiAgICAgICAgXG4vLyAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgIH1cbiAgICBcbi8vIH0oKSk7XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxDb21wbGV4Jyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4vJyk7XG5tb2R1bGUuZXhwb3J0cyA9IE51bWVyaWNhbFJlYWw7XG5cbnV0aWwuaW5oZXJpdHMoTnVtZXJpY2FsUmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gTnVtZXJpY2FsUmVhbChlKSB7XG4gICAgdGhpcy52YWx1ZSA9IGU7XG59XG5cbnZhciBfID0gTnVtZXJpY2FsUmVhbC5wcm90b3R5cGU7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShfLCBcIl9yZWFsXCIsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxufSk7XG5fLl9pbWFnID0gMDtcblxuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzLFxuICAgICAgICBHbG9iYWwuWmVyb1xuICAgIF0pO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSk7XG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC0geC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WydALSddKClbJysnXSh0aGlzKTtcbn07XG5cblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgbm9ucmVhbCA9ICdUaGUgbW9kdWxhciBhcml0aG1ldGljIG9wZXJhdG9yIFxcJyVcXCcgaXMgbm90IGRlZmluZWQgZm9yIG5vbi1yZWFsIG51bWJlcnMuJztcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICB0aHJvdygnTm90IHN1cmUgYWJvdXQgdGhpcy4uLicpO1xuICAgICAgICAvLyBOb3Qgc3VyZSBhYm91dCB0aGlzXG4gICAgICAgIC8vIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgICAgXG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsICUnKTtcbiAgICB9XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICogeC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICBpZih4LnZhbHVlID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnRGl2aXNpb24gYnkgemVybyBub3QgYWxsb3dlZCEnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAvIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KCh0aGlzLnZhbHVlICogeC5fcmVhbCkvY2NfZGQsICgtdGhpcy52YWx1ZSAqIHguX2ltYWcpIC8gY2NfZGQpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gYS8oeCt5aSkgPSBhLyh4K3lpKSAoeC15aSkvKHgteWkpID0gYSh4LXlpKSAvICh4XjIgKyB5XjIpXG4gICAgICAgIHZhciB4X2NvbmogPSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB4WzBdLFxuICAgICAgICAgICAgeFsxXVsnQC0nXSgpXG4gICAgICAgIF0pO1xuICAgICAgICB2YXIgdHdvID0gTnVtZXJpY2FsUmVhbCgyKTtcbiAgICAgICAgcmV0dXJuIHhfY29ualsnKiddKHRoaXMpWycvJ10oXG4gICAgICAgICAgICAoeFswXVsnXiddKSh0d28pXG4gICAgICAgICAgICBbJysnXSAoXG4gICAgICAgICAgICAgICAgKHhbMV1bJ14nXSkodHdvKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIC8vIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICBcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIC8vIFRPRE86IGdpdmVuIHggIT0gMFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAvLyBUT0RPOiBnaXZlbiB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdCkgeyAgIFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnVW5rbm93biB0eXBlOiAnLCB0aGlzLCB4KTtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgLycpO1xuICAgIH1cbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC5hKSk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LnZhbHVlKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogVGhpcyB3aWxsIHByb2R1Y2UgdWdseSBkZWNpbWFscy4gTWF5YmUgd2Ugc2hvdWxkIGV4cHJlc3MgaXQgaW4gcG9sYXIgZm9ybT8hXG4gICAgICAgIC8vICAgICAgPC0gSSB0aGluayBubywgYmVjYXVzZSB3aHkgZWxzZSBzdGFydCB3aXRoIGEgbnVtZXJpY2FsLiBJbXBsZW1lbnQgYSByYXRpb25hbC9pbnRlZ2VyIHR5cGVcbiAgICAgICAgdmFyIHIgPSBNYXRoLnBvdygtdGhpcy52YWx1ZSwgeC52YWx1ZSk7XG4gICAgICAgIHZhciB0aGV0YSA9IE1hdGguUEkgKiB4LnZhbHVlO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICAgICAgbmV3IE51bWVyaWNhbFJlYWwociksXG4gICAgICAgICAgICBuZXcgTnVtZXJpY2FsUmVhbCh0aGV0YSlcbiAgICAgICAgXSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlO1xuICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4gICAgICAgIHZhciBkID0geC5faW1hZztcbiAgICAgICAgY29uc29sZS5lcnJvcignQmFkIGltcGxlbWVudGF0aW9uICggbnVtIF4gY29tcGxleCknKTtcbiAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSk7XG4gICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZDtcbiAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChcbiAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4gICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgY29uc29sZS5lcnJvciAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCBeJywgeCwgeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpO1xuICAgIH1cbn07XG5fWyc+J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA+IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPiddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPCddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPCB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJzwnXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJzw9J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA8PSB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJzw9J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc+PSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPj0geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc+PSddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24gKENvZGUsIGxhbmcpIHtcbiAgICBpZihsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgdmFyIG51bSA9IHRoaXMudmFsdWUudG9FeHBvbmVudGlhbCgpO1xuICAgICAgICBpZihudW0uaW5kZXhPZignLicpID09PSAtMSl7XG4gICAgICAgICAgICBudW0gPSBudW0ucmVwbGFjZSgnZScsJy5lJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKG51bSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLnZhbHVlLnRvU3RyaW5nKCkpO1xufTtcbi8vIF8uYXBwbHlPbGQgPSBmdW5jdGlvbihvcGVyYXRvciwgeCkge1xuLy8gICAgIHN3aXRjaCAob3BlcmF0b3Ipe1xuLy8gICAgICAgICBjYXNlICcsJzpcbi8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgeF0pO1xuLy8gICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vIENvbnRyYWRpY3RzIHheMCA9IDFcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geC5hcHBseSgnQC0nKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAxKXtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIC8vTm90ZTogVGhlcmUgaXMgbm90IG1lYW50IHRvIGJlIGEgYnJlYWsgaGVyZS5cbi8vICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87IC8vQ29udHJhZGljcyB4LzAgPSBJbmZpbml0eVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBpZih4ID09PSB1bmRlZmluZWQpe1xuLy8gICAgICAgICAvL1VuYXJ5XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJ0ArJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICAgICAgICAgIGNhc2UgJ0AtJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLS0nOlxuLy8gICAgICAgICAgICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3IoJ1Bvc3RmaXggJyArb3BlcmF0b3IgKyAnIG9wZXJhdG9yIGFwcGxpZWQgdG8gdmFsdWUgdGhhdCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKz0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLT0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnKj0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLz0nOlxuLy8gICAgICAgICAgICAgICAgIHRocm93KG5ldyBSZWZlcmVuY2VFcnJvcignTGVmdCBzaWRlIG9mIGFzc2lnbm1lbnQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgMSkpO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICogeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLSB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC8geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC52YWx1ZSkpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFRoaXMgd2lsbCBwcm9kdWNlIHVnbHkgZGVjaW1hbHMuIE1heWJlIHdlIHNob3VsZCBleHByZXNzIGl0IGluIHBvbGFyIGZvcm0/IVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgciA9IE1hdGgucG93KC10aGlzLnZhbHVlLCB4LnZhbHVlKVxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLlBJICogeC52YWx1ZTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgocipNYXRoLmNvcyh0aGV0YSksIHIqTWF0aC5zaW4odGhldGEpKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uQ29tcGxleCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKiB4Ll9yZWFsLCB0aGlzLnZhbHVlICogeC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlICsgeC5fcmVhbCwgeC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlIC0geC5fcmVhbCwgLXguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCgodGhpcy52YWx1ZSAqIHguX3JlYWwpL2NjX2RkLCAoLXRoaXMudmFsdWUqeC5faW1hZykvY2NfZGQpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLnZhbHVlO1xuLy8gICAgICAgICAgICAgICAgIHZhciBjID0geC5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQmFkIGltcGxlbWVudGF0aW9uICggbnVtIF4gY29tcGxleCknKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQ7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IE1hdGguZXhwKGhsbSAqIGMpO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5zaW4oaG1sZF90YykpXG4vLyAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdpbmVmZmVjaWVudDogTlIgXiBDTCcpO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy8oYStiaSkrQWVeKGlrKVxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgLy8gb3IgPyByZXR1cm4gdGhpcy5hcHBseShvcGVyYXRvciwgeC5yZWFsaW1hZygpKTsgLy9KdW1wIHVwIHRvIGFib3ZlICstXG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbi8vICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnTigwKSBeIHgnKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWwoLXRoaXMudmFsdWUpKS5hcHBseSgnXicsIHgpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFsLnBpLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ04oMCkgXiB4Jyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbKG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKSksIHhdLCAnXicpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFsLnBpLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIHRocm93KCc/PyAtIHJlYWwnKTtcbi8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gfTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuL051bWVyaWNhbFJlYWwnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYXRpb25hbDtcblxudXRpbC5pbmhlcml0cyhSYXRpb25hbCwgc3VwKTtcblxuZnVuY3Rpb24gUmF0aW9uYWwoYSwgYikge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbn1cblxudmFyIF8gPSBSYXRpb25hbC5wcm90b3R5cGU7XG5cblxuXy5fX2RlZmluZUdldHRlcl9fKFwidmFsdWVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmEgLyB0aGlzLmI7XG59KTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIC8qXG4gICAgICAgICAgICBhICAgYyAgICAgYWQgICBjYiAgICBhZCArIGJjXG4gICAgICAgICAgICAtICsgLSAgPSAgLS0gKyAtLSA9ICAtLS0tLS0tXG4gICAgICAgICAgICBiICAgZCAgICAgYmQgICBiZCAgICAgIGIgZFxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYiArIHRoaXMuYiAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLnZhbHVlICsgeC5fcmVhbCwgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGNvbW11dGVcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdTd2FwcGVkIG9wZXJhdG9yIG9yZGVyIGZvciArIHdpdGggUmF0aW9uYWwnKTtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgICAgICAvLyB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgUmF0aW9uYWwgKycpO1xuICAgIH1cbiAgICBcbiAgICBcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIC8qXG4gICAgICAgICAgICBhICAgYyAgICAgYWQgICBjYiAgICBhZCArIGJjXG4gICAgICAgICAgICAtICsgLSAgPSAgLS0gKyAtLSA9ICAtLS0tLS0tXG4gICAgICAgICAgICBiICAgZCAgICAgYmQgICBiZCAgICAgIGIgZFxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYiAtIHRoaXMuYiAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLnZhbHVlIC0geC5fcmVhbCwgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGNvbW11dGVcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU3dhcHBlZCBvcGVyYXRvciBvcmRlciBmb3IgLSB3aXRoIFJhdGlvbmFsJyk7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICAgICAgLy8gdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFJhdGlvbmFsICsnKTtcbiAgICB9XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG95cGVbJyonXS5jYWxsKHRoaXMsIHgpO1xufTtcblxuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIFJhdGlvbmFsKXtcbiAgICAgICAgaWYgKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIEJ5IFplcm8gaXMgbm90IGRlZmluZWQgZm9yIFJhdGlvbmFsIG51bWJlcnMhJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIsIHRoaXMuYiAqIHguYSkucmVkdWNlKCk7XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHRoaXMuYSA9PT0gdGhpcy5iKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwoXG4gICAgICAgICAgICBNYXRoLnBvdyh0aGlzLmEsIHguYSksXG4gICAgICAgICAgICBNYXRoLnBvdyh0aGlzLmIsIHguYSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnBvdyhNYXRoLnBvdyh0aGlzLmEsIGYuYSksIDEgLyBmLmIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWydeJ10uY2FsbChcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICB4XG4gICAgICAgICk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIFxufTtcblxuXy5yZWR1Y2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gbXV0YWJsZS5cbiAgICBmdW5jdGlvbiBnY2QoYSwgYikge1xuICAgICAgICBpZihiID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ2NkKGIsIGEgJSBiKTtcbiAgICB9XG4gICAgdmFyIGcgPSBnY2QodGhpcy5iLCB0aGlzLmEpO1xuICAgIHRoaXMuYSAvPSBnO1xuICAgIHRoaXMuYiAvPSBnO1xuICAgIGlmKHRoaXMuYiA9PT0gMSkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcih0aGlzLmEpO1xuICAgIH1cbiAgICBpZih0aGlzLmIgPCAwKSB7XG4gICAgICAgIHRoaXMuYSA9IC10aGlzLmE7XG4gICAgICAgIHRoaXMuYiA9IC10aGlzLmI7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0aGlzO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCA9IHJlcXVpcmUoJy4vUmF0aW9uYWwnKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlZ2VyO1xuXG51dGlsLmluaGVyaXRzKEludGVnZXIsIHN1cCk7XG5cbmZ1bmN0aW9uIEludGVnZXIoeCkge1xuICAgIHRoaXMuYSA9IHg7XG59XG5cbnZhciBfID0gSW50ZWdlci5wcm90b3R5cGU7XG5cbl8uYiA9IDE7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKyB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAtIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyctJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgaWYodGhpcy5hICUgeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hIC8geC5hKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHN1cCh0aGlzLmEsIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlZ2VyKC10aGlzLmEpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAqIHguYSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIoTWF0aC5wb3codGhpcy5hLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgucG93KE1hdGgucG93KHRoaXMuYSwgZi5hKSwgMSAvIGYuYikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLmEgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW1xuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgXSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHhcbiAgICApO1xuICAgIFxufTtcblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICUgeC5hKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICByZXR1cm4gbmV3IHN1cCgpOy8vIEB0b2RvOiAhXG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcyAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLmEudG9TdHJpbmcoKSArICcuMCcpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkpO1xufTtcbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocywgYmFzZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAocyA9PT0gJycgfHwgcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIFxuICAgIHZhciByb290ID0gT2JqZWN0LmNyZWF0ZSh7fSk7XG4gICAgdmFyIGNvbnRleHQgPSByb290O1xuICAgIFxuICAgIHZhciBmcmVlID0ge307XG4gICAgdmFyIGJvdW5kID0ge307XG4gICAgXG4gICAgZnVuY3Rpb24gZG93bih2YXJzKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBjb250ZXh0O1xuICAgICAgICBjb250ZXh0ID0gT2JqZWN0LmNyZWF0ZShjb250ZXh0KTtcbiAgICAgICAgY29udGV4dC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpIGluIHZhcnMpIHtcbiAgICAgICAgICAgIGlmICh2YXJzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dFtpXSA9IHZhcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdXAoZW50aXR5KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0LiRwYXJlbnQ7XG4gICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgfVxuICAgIC8qXG4gICAgICAgIEV2YWx1YXRlIEFTVCB0cmVlICh0b3AtZG93bilcbiAgICAgICAgXG4gICAgICAgIEV4YW1wbGVzOlxuICAgICAgICAgICAgKiB5PXheMlxuICAgICAgICAgICAgICAgIFsnPScsIHksIFsnXicsIHgsIDJdXVxuICAgIFxuICAgICovXG4gICAgdmFyIGxvb3NlID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gZXZhbHVhdGUoYXN0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXN0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHN5bWJvbDtcbiAgICAgICAgICAgIGlmICgoc3ltYm9sID0gY29udGV4dFthc3RdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChzeW1ib2wgPSBiYXNlW2FzdF0pKSB7XG4gICAgICAgICAgICAgICAgYm91bmRbYXN0XSA9IHN5bWJvbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnJlZVthc3RdID0gc3ltYm9sID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoYXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvb3RbYXN0XSA9IHN5bWJvbDtcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgICAgIH0gZWxzZSBpZiAoYXN0LnByaW1pdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuQ29uc3RydWN0W2FzdC50eXBlXShhc3QucHJpbWl0aXZlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXN0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYXN0MSA9IGV2YWx1YXRlKGFzdFsxXSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhc3RbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZnJhYyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3RbMF0gPSAnLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnXyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBiaW5kIHVuZGVybmVhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhc3RbMV0gPT09ICdzdW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gYXN0WzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW1pdFswXSA9PT0gJz0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGR1bW15IHZhcmlhYmxlOiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChsaW1pdFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb3dlciBsaW1pdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGV2YWx1YXRlKGxpbWl0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1pbmF0b3IgPSBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh4LCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWluYXRvci52YXJzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1pbmF0b3IudmFyc1t4LnN5bWJvbF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtbWluYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFzdFswXSA9PT0gJ2RlZmF1bHQnICYmIGFzdDEudmFycykge1xuICAgICAgICAgICAgICAgICAgICBkb3duKGFzdDEudmFycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXN0MVthc3RbMF1dKGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdC52YXJzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXAocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzdDFbYXN0WzBdXShldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhc3RbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3FydCc6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLnNxcnQuZGVmYXVsdChldmFsdWF0ZShhc3RbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZhbHVhdGUoYXN0WzFdKVthc3RbMF1dKGV2YWx1YXRlKGFzdFsxXSksIGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3Q7XG4gICAgfVxuICAgIFxuICAgIFxuICAgIC8vIFBhcnNlIHVzaW5nIGNvbnRleHQgZnJlZSBncmFtbWFyIChbZ3JhcGhdL2dyYW1tYXIvY2FsY3VsYXRvci5qaXNvbilcbiAgICB2YXIgYXN0ID0gdGhpcy5jZmcucGFyc2Uocyk7XG4gICAgdmFyIHJlc3VsdCA9IGV2YWx1YXRlKGFzdCk7XG4gICAgcmVzdWx0Ll9hc3QgPSBhc3Q7XG4gICAgaWYgKHJvb3QgIT09IGNvbnRleHQpIHtcbiAgICAgICAgdGhyb3coJ0NvbnRleHQgc3RpbGwgb3BlbicpO1xuICAgIH1cbiAgICBcbiAgICByZXN1bHQudW5ib3VuZCA9IGZyZWU7XG4gICAgcmVzdWx0LmJvdW5kID0gYm91bmQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuXG51dGlsLmluaGVyaXRzKExpc3QsIHN1cCk7XG5cbi8qXG4gICAgRXhwcmVzc2lvbi5MaXN0IHNob3VsZCBiZSBhdm9pZGVkIHdoZW5ldmVyIEV4cHJlc3Npb24uTGlzdC5SZWFsIGNhblxuICAgIGJlIHVzZWQuIEhvd2V2ZXIsIGtub3dpbmcgd2hlbiB0byB1c2UgUmVhbCBpcyBhbiBpbXBvc3NpYmxlICg/KSB0YXNrLFxuICAgIHNvIHNvbWV0aW1lcyB0aGlzIHdpbGwgaGF2ZSB0byBkbyBhcyBhIGZhbGxiYWNrLlxuKi9cbmZ1bmN0aW9uIExpc3QoZSwgb3BlcmF0b3IpIHtcbiAgICBlLl9fcHJvdG9fXyA9IEV4cHJlc3Npb24uTGlzdC5wcm90b3R5cGU7XG4gICAgZS5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIHJldHVybiBlO1xufVxuXG5MaXN0LnByb3RvdHlwZS5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbC5wcm90b3R5cGUuX3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgdGhyb3cobmV3IEVycm9yKCdVc2UgcmVhbCgpLCBpbWFnKCksIG9yIGFicygpLCBvciBhcmcoKSBmaXJzdC4nKSk7XG59O1xuXG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbCwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9sKHN0cikge1xuICAgIHRoaXMuc3ltYm9sID0gc3RyO1xufVxuXG52YXIgXyA9IFN5bWJvbC5wcm90b3R5cGU7XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXMgPT09IHggPyBHbG9iYWwuT25lIDogR2xvYmFsLlplcm87XG59O1xuXy5pbnRlZ3JhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDAuNSwgMCkgWycqJ10gKHggWydeJ10gKG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMiwwKSkpO1xuICAgIH1cbiAgICByZXR1cm4gKHRoaXMpIFsnKiddICh4KTtcbn07XG5fLnN1YiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgLy8gVE9ETzogRW5zdXJlIGl0IGlzIHJlYWwgKGZvciBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKVxuICAgIHJldHVybiB0aGlzID09PSB4ID8geSA6IHRoaXM7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24gKENvZGUsIHgpIHtcbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5zeW1ib2wgfHwgJ3hfe2ZyZWV9Jyk7XG59O1xufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKEVGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gRUZ1bmN0aW9uIChwKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gcC5kZWZhdWx0O1xuICAgIHRoaXNbJ3RleHQvbGF0ZXgnXSA9IChwWyd0ZXh0L2xhdGV4J10pO1xuICAgIHRoaXNbJ3gtc2hhZGVyL3gtZnJhZ21lbnQnXSA9IChwWyd4LXNoYWRlci94LWZyYWdtZW50J10pO1xuICAgIHRoaXNbJ3RleHQvamF2YXNjcmlwdCddID0gKHBbJ3RleHQvamF2YXNjcmlwdCddKTtcbiAgICB0aGlzLmRlcml2YXRpdmUgPSBwLmRlcml2YXRpdmU7XG4gICAgdGhpcy5yZWFsaW1hZyA9IHAucmVhbGltYWc7XG59O1xuXG52YXIgXyA9IEVGdW5jdGlvbi5wcm90b3R5cGU7XG5cbi8vIEBhYnN0cmFjdFxuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuO1xufTtcblxuLy8gQGFic3RyYWN0XG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuZGVyaXZhdGl2ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXJpdmF0aXZlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VGdW5jdGlvbiBoYXMgbm8gZGVyaXZhdGl2ZSBkZWZpbmVkLicpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYgKHRoaXNbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKHRoaXNbbGFuZ10pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjb21waWxlIGZ1bmN0aW9uIGludG8gJyArIGxhbmcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgYSA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbCgpO1xuICAgIHJldHVybiBuZXcgRUZ1bmN0aW9uLlN5bWJvbGljKHRoaXMuZGVmYXVsdChhKVsnKyddKHgpLCBbYV0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGEgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2woKTtcbiAgICByZXR1cm4gbmV3IEVGdW5jdGlvbi5TeW1ib2xpYyh0aGlzLmRlZmF1bHQoYSlbJ0AtJ10oKSwgW2FdKTtcbn07XG5cbiIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcblxuZnVuY3Rpb24gVHJ1dGhWYWx1ZSh2KSB7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZW1lbnQ7XG5cbnV0aWwuaW5oZXJpdHMoVHJ1dGhWYWx1ZSwgc3VwKTtcbnV0aWwuaW5oZXJpdHMoU3RhdGVtZW50LCBzdXApO1xuXG52YXIgXyA9IFRydXRoVmFsdWUucHJvdG90eXBlO1xuXG52YXIgVHJ1ZSA9IFRydXRoVmFsdWUuVHJ1ZSA9IG5ldyBUcnV0aFZhbHVlKCk7XG52YXIgRmFsc2UgPSBUcnV0aFZhbHVlLkZhbHNlID0gbmV3IFRydXRoVmFsdWUoKTtcblxuLy9Pbmx5IGRpZmZlcmVuY2U6IE5PVCBvcGVyYXRvclxuRmFsc2VbJ34nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gVHJ1ZTtcbn07XG5cbi8vIG5lZ2F0aW9uIG9wZXJhdG9yXG5fWyd+J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEZhbHNlO1xufTtcblxuLy8gZGlzanVuY3Rpb25cbl8uViA9IGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUgPT09IFRydWUgPyBlIDogdGhpcztcbn07XG5cbi8vIGNvbmp1bmN0aW9uXG5fWydeJ10gPSBmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlID09PSBUcnVlID8gdGhpcyA6IGU7XG59O1xuXG5cbmZ1bmN0aW9uIFN0YXRlbWVudCh4LCB5LCBvcGVyYXRvcikge1xuICAgIHRoaXMuYSA9IHg7XG4gICAgdGhpcy5iID0geTtcblxuICAgIHRoaXMub3BlcmF0b3IgPSBvcGVyYXRvcjtcbn1cblxudmFyIF8gPSBTdGF0ZW1lbnQucHJvdG90eXBlO1xuX1snPSddID0gZnVuY3Rpb24gKCkge1xuICAgIFxufTtcbl9bJzwnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBhIDwgYiA8IGNcbiAgICAvLyAoYSA8IGIpID0gYlxuICAgIC8vIGIgPCBjXG4gICAgXG4gICAgLy8gYSA8IChiIDwgYylcbiAgICAvLyBhIDwgYiAuLiAoYiA8IGMpID0gYlxuICAgIC8vIChhIDwgYikgPSBhLlxufTtcbl8uc29sdmUgPSBmdW5jdGlvbiAodmFycykge1xuICAgIC8vIGEgPSBiXG4gICAgLy8gSWYgYiBoYXMgYW4gYWRkaXRpdmUgaW52ZXJzZT9cbiAgICBcbiAgICAvLyBhIC0gYiA9IDBcbiAgICB2YXIgYV9iID0gKHRoaXMuYSlbJy0nXSh0aGlzLmIpO1xuICAgIC8qXG4gICAgRXhhbXBsZXM6XG4gICAgKDEsMiwzKSAtICh4LHkseikgPSAwIChzb2x2ZSBmb3IgeCx5LHopXG4gICAgKDEsMiwzKSAtIHggPSAwIChzb2x2ZSBmb3IgeClcbiAgICAqL1xuICAgIHJldHVybiBhX2Iucm9vdHModmFycyk7XG59O1xuIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG5cbmZ1bmN0aW9uIFZlY3RvcihlKSB7XG4gICAgZS5fX3Byb3RvX18gPSBWZWN0b3IucHJvdG90eXBlO1xuICAgIHJldHVybiBlO1xufVxuXG51dGlsLmluaGVyaXRzKFZlY3Rvciwgc3VwKTtcblxudmFyIF8gPSBWZWN0b3IucHJvdG90eXBlO1xuXG5fWycsLiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5jb25jYXQuY2FsbCh0aGlzLCBbeF0pKTtcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgcmV0dXJuIGMuZGlmZmVyZW50aWF0ZSh4KTtcbiAgICB9KSk7XG59O1xuXy5jcm9zcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMubGVuZ3RoICE9PSAzIHx8IHgubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIHRocm93KCdDcm9zcyBwcm9kdWN0IG9ubHkgZGVmaW5lZCBmb3IgM0QgdmVjdG9ycy4nKTtcbiAgICB9XG4gICAgLypcbiAgICBpICAgaiAgICBrXG4gICAgeCAgIHkgICAgelxuICAgIGEgICBiICAgIGNcbiAgICBcbiAgICA9ICh5YyAtIHpiLCB6YSAtIHhjLCB4YiAtIHlhKVxuICAgICovXG4gICAgXG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoW1xuICAgICAgICB0aGlzWzFdLmRlZmF1bHQoeFsyXSlbJy0nXSh0aGlzWzJdLmRlZmF1bHQoeFsxXSkpLFxuICAgICAgICB0aGlzWzJdLmRlZmF1bHQoeFswXSlbJy0nXSh0aGlzWzBdLmRlZmF1bHQoeFsyXSkpLFxuICAgICAgICB0aGlzWzBdLmRlZmF1bHQoeFsxXSlbJy0nXSh0aGlzWzFdLmRlZmF1bHQoeFswXSkpXG4gICAgXSk7XG59O1xuXG4vLyBjcm9zc1Byb2R1Y3QgaXMgdGhlICcmdGltZXM7JyBjaGFyYWN0ZXJcbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7XG5cbl9bY3Jvc3NQcm9kdWN0XSA9IF8uY3Jvc3M7XG5fLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICAgICAgLy8gRG90IHByb2R1Y3RcbiAgICAgICAgaWYobCAhPT0geC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgc3VtID0gR2xvYmFsLlplcm87XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN1bSA9IHN1bVsnKyddKFxuICAgICAgICAgICAgICAgICh0aGlzW2ldKS5kZWZhdWx0KHhbaV0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmFwcGx5KHgpO1xuICAgICAgICB9KSk7XG4gICAgfVxufTtcbl9bJyonXSA9IF8uZGVmYXVsdDtcbl9bJysnXSA9IGZ1bmN0aW9uICh4LCBvcCkge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgaWYobCAhPT0geC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cobmV3IE1hdGhFcnJvcignVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKSk7XG4gICAgfVxuICAgIHZhciBpO1xuICAgIHZhciBuID0gbmV3IEFycmF5KGwpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbltpXSA9IHRoaXNbaV1bb3AgfHwgJysnXSh4W2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIFZlY3RvcihuKTtcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycrJ10oeCwgJy0nKTtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgICAgIHRocm93KCdWZWN0b3IgZGl2aXNpb24gbm90IGRlZmluZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgcmV0dXJuIGNbJy8nXSh4KTtcbiAgICB9KSk7XG4gICAgXG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ1JhaXNlZCB0byB6ZXJvIHBvd2VyJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoeC5hID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoeC5hID09PSAyKSB7XG4gICAgICAgICAgICB2YXIgUyA9IEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgdmFyIGksIGwgPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBTID0gU1snKyddKHRoaXNbaV1bJ14nXSh4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydeJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcih4LmEgLSAxKSlbJyonXSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCl7XG4gICAgICAgIHJldHVybiB0aGlzWydeJ10oeC5hKVsnXiddKEdsb2JhbC5PbmVbJy8nXSh4LmIpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlICsgeC5fcmVhbCwgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGNvbW11dGVcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFZlY3RvciBeJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRlZmF1bHQodGhpc1snXiddKHhbJy0nXShHbG9iYWwuT25lKSkpO1xufTtcblxuXy5vbGRfYXBwbHlfb3BlcmF0b3IgPSBmdW5jdGlvbihvcGVyYXRvciwgZSkge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIGk7XG4gICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICBjYXNlICcsJzpcbiAgICAgICAgICAgIC8vQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcywgW2VdKTtcbiAgICAgICAgICAgIC8vRmFzdGVyOlxuICAgICAgICAgICAgLy9NT0RJRklFUyEhISEhISEhIVxuICAgICAgICAgICAgdGhpc1tsXSA9IGU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgIGNhc2UgJyonOlxuICAgICAgICAgICAgaWYobCAhPT0gZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdygnVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdW0gPSBNLkdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHN1bSA9IHN1bS5hcHBseSgnKycsIHRoaXNbaV0uYXBwbHkoJyonLCBlW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc3VtO1xuICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgY2FzZSAnLSc6XG4gICAgICAgICAgICBpZihsICE9PSBlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG4gPSBuZXcgQXJyYXkobCk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbltpXSA9IHRoaXNbaV0uYXBwbHkob3BlcmF0b3IsIGVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFZlY3RvcihuKTtcbiAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgIGNhc2UgJ14nOlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdygnVmVjdG9yIG9wZXJhdGlvbiBub3QgYWxsb3dlZC4nKTtcbiAgICB9XG59O1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHZhciBfeCA9IG5ldyBBcnJheShsKTtcbiAgICB2YXIgX3kgPSBuZXcgQXJyYXkobCk7XG4gICAgdmFyIGk7XG4gICAgZm9yKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciByaSA9IHRoaXNbaV0ucmVhbGltYWcoKTtcbiAgICAgICAgX3hbaV0gPSByaVswXTtcbiAgICAgICAgX3lbaV0gPSByaVsxXTtcbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgVmVjdG9yKF94KSxcbiAgICAgICAgVmVjdG9yKF95KVxuICAgIF0pO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uKENvZGUsIGxhbmcpIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHZhciBvcGVuID0gJ1snO1xuICAgIHZhciBjbG9zZSA9ICddJztcbiAgICBpZihsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgb3BlbiA9ICd2ZWMnICsgdGhpcy5sZW5ndGggKyAnKCc7XG4gICAgICAgIGNsb3NlID0gJyknO1xuICAgIH1cbiAgICB2YXIgYyA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgdmFyIGk7XG4gICAgdmFyIHRfcyA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGNfaSA9IHRoaXNbaV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgIHRfcy5wdXNoKGNfaS5zKTtcbiAgICAgICAgYyA9IGMubWVyZ2UoY19pKTtcbiAgICB9XG4gICAgcmV0dXJuIGMudXBkYXRlKG9wZW4gKyB0X3Muam9pbignLCcpICsgY2xvc2UsIEluZmluaXR5KTtcbn07XG59KSgpIiwiLy8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWF0cml4O1xuXG5mdW5jdGlvbiBNYXRyaXgoZSwgciwgYykge1xuICAgIGUuX19wcm90b19fID0gTWF0cml4LnByb3RvdHlwZTtcblxuICAgIGUucm93cyA9IHI7XG4gICAgZS5jb2xzID0gYztcblxuICAgIGlmIChyICE9IGMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXRyaXggc2l6ZSBtaXNtYXRjaCcpXG4gICAgfVxuXG4gICAgcmV0dXJuIGU7XG59XG5cbnV0aWwuaW5oZXJpdHMoTWF0cml4LCBzdXApO1xuXG52YXIgXyA9IE1hdHJpeC5wcm90b3R5cGU7XG5cbl8uZGVmYXVsdCA9IF9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5NYXRyaXgpIHtcbiAgICAgICAgLy8gQnJva2VuXG4gICAgICAgIC8vIE8obl4zKVxuICAgICAgICBpZiAoeC5yb3dzICE9PSB0aGlzLmNvbHMpIHtcbiAgICAgICAgICAgIHRocm93ICgnTWF0cml4IGRpbWVuc2lvbnMgZG8gbm90IG1hdGNoLicpO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgLy8gcmVzdWx0W3gucm93cyAqIHguY29scyAtIDEgXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIGksIGosIGssIHIgPSAwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5yb3dzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB4LmNvbHM7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBzdW0gPSBHbG9iYWwuWmVybztcbiAgICAgICAgICAgICAgICBmb3IoayA9IDA7IGsgPCB4LnJvd3M7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBzdW0gPSBzdW1bJysnXSh4W2sgKiB4LmNvbHMgKyBqXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdFtyKytdID0gc3VtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLk1hdHJpeChyZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biB0eXBlJyk7XG4gICAgfVxufTtcblxuXy5yZWR1Y2UgPSBmdW5jdGlvbiAoYXBwKSB7XG4gICAgdmFyIHgsIHk7XG4gICAgZm9yKHkgPSAwOyB5IDwgdGhpcy5yb3dzOyB5KyspIHtcbiAgICAgICAgZm9yKHggPSAwOyB4IDwgeTsgeCsrKSB7XG4gICAgICAgICAgICAvLyBNYWtlIHRoaXNbeCx5XSA9IDBcbiAgICAgICAgICAgIHZhciBtYSA9IHRoaXNbeCAqIHRoaXMuY29scyArIHhdO1xuICAgICAgICAgICAgLy8gMCA9IHRoaXMgLSAodGhpcy9tYSkgKiBtYVxuICAgICAgICAgICAgaWYobWEgPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgKCdSb3cgc3dhcCEnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0bWEgPSB0aGlzW3kgKiB0aGlzLmNvbHMgKyB4XVsnLyddKG1hKTtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpID0geCArIDE7IGkgPCB0aGlzLmNvbHM7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXNbeSAqIHRoaXMuY29scyArIGldID0gdGhpc1t5ICogdGhpcy5jb2xzICsgaV1bJy0nXSh0bWFbJyonXSh0aGlzW3ggKiB0aGlzLmNvbHMgKyBpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZmluaXRlc2ltYWw7XG51dGlsLmluaGVyaXRzKEluZmluaXRlc2ltYWwsIHN1cCk7XG5mdW5jdGlvbiBJbmZpbml0ZXNpbWFsKHgpIHtcbiAgICB0aGlzLnggPSB4O1xufVxudmFyIF8gPSBJbmZpbml0ZXNpbWFsLnByb3RvdHlwZTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZmluaXRlc2ltYWwgYWRkaXRpb24nKTtcbiAgICB9XG4gICAgcmV0dXJuIHg7XG59O1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICBpZih4LnggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMueC5kaWZmZXJlbnRpYXRlKHgueCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25mdXNpbmcgaW5maXRlc2ltYWwgZGl2aXNpb24nKTtcbiAgICB9XG4gICAgdGhpcy54ID0gdGhpcy54WycvJ10oeCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAvLyBkXjIgPSAwXG4gICAgaWYoeCBpbnN0YW5jZW9mIEluZmluaXRlc2ltYWwpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICB0aGlzLnggPSB0aGlzLnhbJyonXSh4KTtcbn07XG5fLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgIGlmKGxhbmcgIT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZmluaXRlc2ltYWwgbnVtYmVycyBjYW5ub3QgYmUgZXhwb3J0ZWQgdG8gcHJvZ3JhbW1pbmcgbGFuZ3VhZ2VzJyk7XG4gICAgfVxuICAgIHZhciBjID0gdGhpcy54LnMobGFuZyk7XG4gICAgdmFyIHAgPSBsYW5ndWFnZS5wcmVjZWRlbmNlKCdkZWZhdWx0JylcbiAgICBpZihwID4gYy5wKSB7XG4gICAgICAgIGMucyA9ICdcXFxcbGVmdCgnICsgYy5zICsgJ1xcXFxyaWdodCknO1xuICAgIH1cbiAgICByZXR1cm4gYy51cGRhdGUoJ2QnICsgYy5zLCBwKTtcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXsvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG52YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vLi4vZ2xvYmFsJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RSZWFsO1xuXG51dGlsLmluaGVyaXRzKExpc3RSZWFsLCBzdXApO1xuXG5mdW5jdGlvbiBMaXN0UmVhbCh4LCBvcGVyYXRvcikge1xuICAgIHguX19wcm90b19fID0gTGlzdFJlYWwucHJvdG90eXBlO1xuICAgIGlmKG9wZXJhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeC5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn1cblxudmFyIF8gPSBMaXN0UmVhbC5wcm90b3R5cGU7XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gc3VwLkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzLFxuICAgICAgICBnbG9iYWwuWmVyb1xuICAgIF0pO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBnbG9iYWwuWmVybztcbn07XG5fLnBvbGFyID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzdXAuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgc3VwLlJlYWwoW2dsb2JhbC5hYnMsIHRoaXNdKSxcbiAgICAgICAgc3VwLlJlYWwoW2dsb2JhbC5hcmcsIHRoaXNdKVxuICAgIF0pO1xufTtcbl8uYWJzID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFtnbG9iYWwuYWJzLCB0aGlzXSk7XG59O1xuXy5hcmcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gc3VwLlJlYWwoW2dsb2JhbC5hcmcsIHRoaXNdKTtcbn07XG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMgPT09IHgpIHtcbiAgICAgICAgcmV0dXJuIHhbJyonXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcrJyAmJiB0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNbMF0sIHRoaXNbMV1bJysnXSh4KV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICctJyAmJiB0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNbMF0sIHhbJy0nXSh0aGlzWzFdKV0sICcrJyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBzdXAuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xuICAgIFxufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZiAoeCA9PT0gdGhpcykge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2Ygc3VwLlJlYWwpIHtcbiAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdALScpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeFswXV0sICcrJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKVsnLSddKHgpO1xufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09ICcvJyAmJiB0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNbMF1bJyonXSh4KSwgdGhpc1sxXV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbeCwgdGhpc10sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBzdXAuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG4gICAgXG59O1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmKHggPT09IHRoaXMpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5PbmU7XG4gICAgfVxuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gJy8nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNbMF1bJy8nXSh4KSwgdGhpc1sxXV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfVxuXG4gICAgaWYoeCBpbnN0YW5jZW9mIHN1cC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy8nXSh4KTtcbn07XG5fWyclJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICclJyk7XG59O1xuX1snQC0nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgIHJldHVybiB0aGlzWzBdO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNdLCAnQC0nKTtcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09ICcvJyAmJiB0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXNbMF1bJ14nXSh4KSwgdGhpc1sxXVsnXiddKHgpXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwucHJvdG90eXBlWydeJ10uY2FsbCh0aGlzLCB4KTtcbiAgICBcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZiAodGhpcy5vcGVyYXRvciA9PT0gJysnIHx8XG4gICAgICAgIHRoaXMub3BlcmF0b3IgPT09ICctJyB8fFxuICAgICAgICB0aGlzLm9wZXJhdG9yID09PSAnQC0nKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVt0aGlzLm9wZXJhdG9yXSh0aGlzWzFdICYmIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KSk7XG4gICAgXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgaWYodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uRnVuY3Rpb24pIHtcblxuICAgICAgICAgICAgdmFyIGRhID0gdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpO1xuICAgICAgICAgICAgaWYoZGEgPT09IGdsb2JhbC5aZXJvKSByZXR1cm4gZGE7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzWzBdLmRpZmZlcmVudGlhdGUoKS5kZWZhdWx0KHRoaXNbMV0pWycqJ10oZGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXNbMF1bdGhpcy5vcGVyYXRvcl0oXG4gICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgKVsnKyddKHRoaXNbMV1bdGhpcy5vcGVyYXRvcl0oXG4gICAgICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgKSk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuXG4gICAgICAgIHJldHVybiB0aGlzWzFdWycqJ10oXG4gICAgICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgKVsnLSddKFxuICAgICAgICAgICAgdGhpc1swXVsnKiddKFxuICAgICAgICAgICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICAgICAgKVxuICAgICAgICApW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgdGhpc1sxXVsnKiddKHRoaXNbMV0pXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSAnXicpIHtcblxuICAgICAgICB2YXIgZGYgPSB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgICAgIHZhciBkZyA9IHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KTtcblxuICAgICAgICBpZiAoZGYgPT09IGdsb2JhbC5aZXJvKSB7XG4gICAgICAgICAgICBpZiAoZGcgPT09IGdsb2JhbC5aZXJvKSByZXR1cm4gZGc7XG5cbiAgICAgICAgICAgIHJldHVybiBkZy5kZWZhdWx0KFxuICAgICAgICAgICAgICAgIGdsb2JhbC5sb2cuZGVmYXVsdCh0aGlzWzBdKVxuICAgICAgICAgICAgKS5kZWZhdWx0KHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZhID0gdGhpc1swXVsnXiddKFxuICAgICAgICAgICAgdGhpc1sxXVsnLSddKGdsb2JhbC5PbmUpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGZhLmRlZmF1bHQoXG4gICAgICAgICAgICBkZi5kZWZhdWx0KHRoaXNbMV0pWycrJ10oXG4gICAgICAgICAgICAgICAgdGhpc1swXVsnKiddKFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWwubG9nLmRlZmF1bHQodGhpc1swXSlcbiAgICAgICAgICAgICAgICApWycqJ10oXG4gICAgICAgICAgICAgICAgICAgIGRnXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH1cbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuXG4gICAgdmFyIGxhbmd1YWdlID0gQ29kZS5sYW5ndWFnZTtcbiAgICBmdW5jdGlvbiBwYXJlbih4KSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuICdcXFxcbGVmdCgnICsgeCArICdcXFxccmlnaHQpJzsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcoJyArIHggKyAnKSc7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBnbG9iYWwuYWJzKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgICAgICAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ1xcXFxsZWZ0fCcgKyBjMS5zICsgJ1xcXFxyaWdodHwnLCBJbmZpbml0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZShjMC5zICsgJygnICsgYzEucyArICcpJywgSW5maW5pdHkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIGlmICh0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzFzID0gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXNbMV0sIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIHZhciB0X3MgPSBjMXMubWFwKGZ1bmN0aW9uIChlKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGUucztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZih0aGlzWzBdID09PSBnbG9iYWwuYXRhbikge1xuICAgICAgICAgICAgICAgICAgICB0X3MgPSB0X3MucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYzBfcyA9IGMwLnM7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGMxcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjMC5tZXJnZShjMXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKGMwX3MgKyBwYXJlbih0X3MpLCBsYW5ndWFnZS5vcGVyYXRvcnMuZGVmYXVsdC5wcmVjZWRlbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIGMwLnMgKyBwYXJlbihjMS5zKSwgbGFuZ3VhZ2Uub3BlcmF0b3JzLmRlZmF1bHQucHJlY2VkZW5jZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9wZXJhdG9yID0gJyonO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBwID0gbGFuZ3VhZ2Uub3BlcmF0b3JzW3RoaXMub3BlcmF0b3JdLnByZWNlZGVuY2U7XG4gICAgZnVuY3Rpb24gXyh4KSB7XG4gICAgICAgIGlmKHAgPiB4LnApe1xuICAgICAgICAgICAgcmV0dXJuIHBhcmVuKHgucyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHgucztcbiAgICB9XG5cbiAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnXicpIHtcblxuICAgICAgICBpZihsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IGdsb2JhbC5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKCdleHAoJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB0aGlzWzFdLmEgPCA1ICYmIHRoaXNbMV0uYSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICB2YXIgaiA9IGxhbmd1YWdlLm9wZXJhdG9yc1snKiddLnByZWNlZGVuY2U7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHByZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB2YXIgY3M7XG4gICAgICAgICAgICAgICAgaWYodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgICAgICAgICAgICAgIGNzID0gYzAucztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY3MgPSBjMC52YXJpYWJsZSgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcHJlID0gJ2Zsb2F0ICcgKyBjcyArICcgPSAnICsgYzAucyArICc7JztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBjcztcbiAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDE7IGkgPCB0aGlzWzFdLmE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzKz0gJyonICsgY3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoJygnICsgcyArICcpJywgSW5maW5pdHksIHByZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHRoaXNbMV0uYSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgLy8gdG9kbzogcHJlY2VkZW5jZSBub3QgbmVjZXNzYXJ5XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSgnKDEuMC8oJyArIGMwLnMgKyAnKSknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gYV4yLCAzLCA0LCA1LCA2IFxuICAgICAgICAgICAgICAgIC8vIHVuc3VyZSBpdCBpcyBnY2RcbiAgICAgICAgICAgICAgICB0aGlzWzFdID0gdGhpc1sxXS5yZWR1Y2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbiA9IHRoaXNbMV0uYSAlIDIgPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICAgICAgaWYoZXZlbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAncG93KCcgKyBjMC5zICsgJywnICsgYzEucyAgKyAnKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8geF4oYSkgPSAoeCkgKiB4XihhLTEpXG4gICAgICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShnbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5zXyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKSknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gTmVnIG9yIHBvcy5cbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oZ2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcrYzEucysnKSknKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShnbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBOZWVkcyBhIG5ldyBmdW5jdGlvbiwgZGVwZW5kZW50IG9uIHBvd2VyLlxuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnK2MxLnMrJykpJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBnbG9iYWwuZSkge1xuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnTWF0aC5leHAoJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcblxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAvLyBhXjIsIDMsIDQsIDUsIDYgXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW4gPSB0aGlzWzFdLmEgJSAyID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYoZXZlbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBOZWVkcyBhIG5ldyBmdW5jdGlvbiwgZGVwZW5kZW50IG9uIHBvd2VyLlxuICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAndGV4dC9sYXRleCcpe1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgJ14nICsgJ3snICsgYzEucyArICd9JylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICBpZih0aGlzLm9wZXJhdG9yWzBdID09PSAnQCcpIHtcbiAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSh0aGlzLm9wZXJhdG9yWzFdICsgXyhjMCksIHApO1xuICAgIH1cblxuICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgXG4gICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnXFxcXGZyYWN7JyArIGMwLnMgKyAnfXsnICsgYzEucyArICd9JylcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyBfKGMxKSwgcCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnJScpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ21vZCgnICsgXyhjMCkgKyAnLCcgKyBfKGMxKSArICcpJywgcCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgdGhpcy5vcGVyYXRvciArIF8oYzEpLCBwKTtcbn07XG5cblxufSkoKSIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV4UG9sYXI7XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleFBvbGFyLCBzdXApO1xuXG5mdW5jdGlvbiBDb21wbGV4UG9sYXIgKHgpe1xuICAgIHguX19wcm90b19fID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cbnZhciBfID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcblxuXy5wb2xhciA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vVE9ETzogUmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSksXG4gICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpXG4gICAgXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDb21wbGV4UG9sYXIoW1xuICAgICAgICB0aGlzWzBdLFxuICAgICAgICB0aGlzWzFdLmFwcGx5KCdALScpXG4gICAgXSk7XG59O1xuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oeCl7XG4gICAgLy8gZC9keCBhKHgpICogZV4oaWIoeCkpXG4gICAgXG4gICAgLy9UT0RPIGVuc3VyZSBiZWxvdyAgZicgKyBpZiBnJyBwYXJ0IGlzIHJlYWxpbWFnIChmJywgZmcnKVxuICAgIHJldHVybiBHbG9iYWwuZVxuICAgIC5hcHBseShcbiAgICAgICAgJ14nLFxuICAgICAgICBHbG9iYWwuaVxuICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgdGhpc1sxXVxuICAgICAgICApXG4gICAgKVxuICAgIC5hcHBseSgnKicsXG4gICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICAuYXBwbHkoJysnLFxuICAgICAgICAgICAgR2xvYmFsLmlcbiAgICAgICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICk7XG59O1xuLy8gXy5hcHBseSA9IGZ1bmN0aW9uKG8sIHgpIHtcbi8vICAgICBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJysnLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnLScsIHhbMV0pXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBzbG93LCBtYXliZSB3ZSBzaG91bGQgc3dpdGNoIHRvIGNhcnRlc2lhbiBub3c/XG4gICAgICAgICAgICBcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKEFlXihpaykpIF4gKEJlXihpaikpXG4vLyAgICAgICAgICAgICAgICAgLy9Ib3cgc2xvdyBpcyB0aGlzP1xuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBmYXN0IGZvciByZWFsIG51bWJlcnMgdGhvdWdoXG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Q6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5fcmVhbCkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcrJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9pbWFnKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9yZWFsKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJy0nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX2ltYWcpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhBZV4oaWspKSBeIChCZV4oaWopKVxuLy8gICAgICAgICAgICAgICAgIC8vSG93IHNsb3cgaXMgdGhpcz9cbi8vICAgICAgICAgICAgICAgICAvL1ZlcnkgZmFzdCBmb3IgcmVhbCBudW1iZXJzIHRob3VnaFxuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4gICAgXG4vLyB9O1xuXy5hYnMgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpc1swXTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG4vKlxuICAgIFRoaXMgdHlwZSBpcyBhbiBhdHRlbXB0IHRvIGF2b2lkIGhhdmluZyB0byBjYWxsIC5yZWFsaW1hZygpIGRvd24gdGhlIHRyZWUgYWxsIHRoZSB0aW1lLlxuICAgIFxuICAgIE1heWJlIHRoaXMgaXMgYSBiYWQgaWRlYSwgYmVjYXVzZSBpdCB3aWxsIGVuZCB1cCBoYXZpbmc6XG4gICAgXG4gICAgZih4KSA9ID5cbiAgICBbXG4gICAgICAgIFJlX2YoeCksXG4gICAgICAgIEltX2YoeClcbiAgICAgICAgXG4gICAgXVxuICAgIHdoaWNoIHJlcXVpcmVzIHR3byBldmFsdWF0aW9ucyBvZiBmKHgpLlxuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXhDYXJ0ZXNpYW47XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleENhcnRlc2lhbiwgc3VwKTtcblxuZnVuY3Rpb24gQ29tcGxleENhcnRlc2lhbih4KSB7XG4gICAgeC5fX3Byb3RvX18gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cblxudmFyIF8gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXNbMF07XG59O1xuXy5pbWFnID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXSxcbiAgICAgICAgdGhpc1sxXS5hcHBseSgnQC0nKVxuICAgIF0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXVsnQC0nXSgpLFxuICAgICAgICB0aGlzWzFdWydALSddKClcbiAgICBdKTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyAoYStiaSkgKiAoYytkaSkgPSBhYyArIGFkaSArIGJjaSAtIGJkXG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeFswXSlbJy0nXSh0aGlzWzFdWycqJ10oeFsxXSkpLFxuICAgICAgICAgICAgdGhpc1swXVsnKiddKHhbMV0pWycrJ10odGhpc1sxXVsnKiddKHhbMF0pKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdWycqJ10oeClcbiAgICAgICAgXSk7XG4gICAgfVxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuXG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBCaW5vbWlhbCBleHBhbnNpb25cbiAgICAgICAgLy8gKGErYileTlxuICAgICAgICB2YXIgbiAgPSB4LmE7XG4gICAgICAgIHZhciBrO1xuICAgICAgICB2YXIgYSA9IHRoaXNbMF07XG4gICAgICAgIHZhciBiID0gdGhpc1sxXTtcbiAgICAgICAgdmFyIG5lZ29uZSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoLTEpO1xuICAgICAgICB2YXIgaW1hZ19wYXJ0ID0gR2xvYmFsLlplcm87XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVhbF9wYXJ0ID0gYVsnXiddKFxuICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihuKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNpID0gMTtcbiAgICAgICAgXG4gICAgICAgIGZvciAoayA9IDE7OyBrKyspIHtcbiAgICAgICAgICAgIHZhciBleHByO1xuICAgICAgICAgICAgaWYoayA9PT0gbikge1xuICAgICAgICAgICAgICAgIGV4cHIgPSAoXG4gICAgICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIoaylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwciA9IGFbJ14nXShcbiAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKG4gLSBrKVxuICAgICAgICAgICAgKVsnKiddKFxuICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihrKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY2kgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICByZWFsX3BhcnQsXG4gICAgICAgICAgICBpbWFnX3BhcnRcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbn07XG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycrJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeCksXG4gICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgIF0pO1xufTtcblxuXG4vLyBfLmFwcGx5T2xkID0gZnVuY3Rpb24obywgeCkge1xuLy8gICAgIC8vVE9ETzogZW5zdXJlIHRoaXMgaGFzIGFuIGltYWdpbmFyeSBwYXJ0LiBJZiBpdCBkb2Vzbid0IGl0IGlzIGEgaHVnZSB3YXN0ZSBvZiBjb21wdXRhdGlvblxuLy8gICAgIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgIHN3aXRjaChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseShvLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseShvLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgLy9GdW5jdGlvbiBldmFsdWF0aW9uPyBOTy4gVGhpcyBpcyBub3QgYSBmdW5jdGlvbi4gSSB0aGluay5cbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCctJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMV0pKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMF0pKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geFswXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCcrJywgeFsxXS5hcHBseSgnKicsIHhbMV0pKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzBdLmFwcGx5KCcqJyx4WzBdKS5hcHBseSgnKycsdGhpc1sxXS5hcHBseSgnKicseFsxXSkpKS5hcHBseSgnLycsIGNjX2RkKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMV0uYXBwbHkoJyonLHhbMF0pLmFwcGx5KCctJyx0aGlzWzBdLmFwcGx5KCcqJyx4WzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL1RoZSBtb3N0IGNvbmZ1c2luZyBvZiB0aGVtIGFsbDpcbi8vICAgICAgICAgICAgICAgICB2YXIgaGFsZiA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMC41LCAwKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaGxtID0gaGFsZi5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5sb2cuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy9UaGUgbWFnbml0dWRlOiBpZiB0aGlzIHdhcyBmb3IgYSBwb2xhciBvbmUgaXQgY291bGQgYmUgZmFzdC5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJysnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBHbG9iYWwuYXRhbjIuYXBwbHkodW5kZWZpbmVkLCBFeHByZXNzaW9uLlZlY3RvcihbdGhpc1sxXSwgdGhpc1swXV0pKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhldGEuYXBwbHkoJyonLCB4WzBdKSk7XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5leHAuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICBobG0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgYlswXVxuLy8gICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCctJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXRhLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5lLmFwcGx5KCdeJyxcbi8vICAgICAgICAgICAgICAgICAgICAgaGxtLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHhbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnLScsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGV0YS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcblxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZC5hcHBseSgnKicsR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIGhtbGRfdGMpKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQuYXBwbHkoJyonLEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCBobWxkX3RjKSkpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpe1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy8oeCt5aSkvQSplXihpaylcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4WzBdLmFwcGx5KCcqJywgeFswXSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGIgPSB4LnJlYWxpbWFnKCk7XG4vLyAgICAgICAgICAgICAgICAgLy9DbGVhbiB0aGlzIHVwPyBTdWI/XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1swXS5hcHBseSgnKicsYlswXSkuYXBwbHkoJysnLGFbMV0uYXBwbHkoJyonLGJbMV0pKSkuYXBwbHkoJy8nLCBjY19kZCksXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzFdLmFwcGx5KCcqJyxiWzBdKS5hcHBseSgnLScsYVswXS5hcHBseSgnKicsYlsxXSkpKS5hcHBseSgnLycsIGNjX2RkKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9odHRwOi8vd3d3LndvbGZyYW1hbHBoYS5jb20vaW5wdXQvP2k9UmUlMjglMjh4JTJCeWklMjklNUUlMjhBKmUlNUUlMjhpayUyOSUyOSUyOVxuLy8gICAgICAgICAgICAgICAgIC8vKHgreWkpXihBKmVeKGlrKSlcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9XG4vLyAgICAgdGhyb3coJ0NNUExYLkxJU1QgKiAnICsgbyk7XG4vLyB9O1xuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpO1xuXG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbF9SZWFsO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbF9SZWFsLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2xfUmVhbChzdHIpIHtcbiAgICB0aGlzLnN5bWJvbCA9IHN0cjtcbn1cblxudmFyIF8gPSBTeW1ib2xfUmVhbC5wcm90b3R5cGU7XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW3RoaXMsIEdsb2JhbC5aZXJvXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcbl8ucG9sYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksXG4gICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSlcbiAgICBdKTtcbn07XG5fLmFicyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pO1xufTtcbl8uYXJnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSk7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMgPT09IHgpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4WzBdXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy0nKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHhbJ0AtJ10oKVsnKyddKHRoaXMpO1xufTtcblxuX1snQCsnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgJ0ArJyk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCAnQC0nKTtcbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3gsIHRoaXNdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbn07XG5fLmFwcGx5ID0gX1snKiddO1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBieSB6ZXJvJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIHZhciBmID0geC5yZWR1Y2UoKTtcbiAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbn07XG5fWyclJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG59O1xuXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdGhyb3coXCJSZWFsLmFwcGx5XCIpO1xuICAgIC8vIGlmIChvcGVyYXRvciA9PT0gJywnKSB7XG4gICAgLy8gICAgIC8vTWF5YmUgdGhpcyBzaG91bGQgYmUgYSBuZXcgb2JqZWN0IHR5cGU/Pz8gVmVjdG9yP1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnQVBQTFk6ICcsIHRoaXMuY29uc3RydWN0b3IsIHRoaXMsIGUpO1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIGVdKTtcbiAgICAvLyB9IGVsc2UgaWYgKG9wZXJhdG9yID09PSAnPScpIHtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uRXF1YXRpb24oW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gfVxuICAgIC8vIGlmIChlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyAgICAgLy9VbmFyeTpcbiAgICAvLyAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgY2FzZSAnISc6XG4gICAgLy8gICAgICAgICAgICAgLy9UT0RPOiBDYW4ndCBzaW1wbGlmeSwgc28gd2h5IGJvdGhlciEgKHJldHVybiBhIGxpc3QsIHNpbmNlIGdhbW1hIG1hcHMgYWxsIHJlYWxzIHRvIHJlYWxzPylcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgdGhpcy5hcHBseSgnKycsIEdsb2JhbC5PbmUpKTtcbiAgICAvLyAgICAgICAgIGNhc2UgJ0AtJzpcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICBkZWZhdWx0OlxuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHRocm93KCdSZWFsIFN5bWJvbCgnK3RoaXMuc3ltYm9sKycpIGNvdWxkIG5vdCBoYW5kbGUgb3BlcmF0b3IgJysgb3BlcmF0b3IpO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICAgIC8vIFNpbXBsaWZpY2F0aW9uOlxuICAgIC8vICAgICBzd2l0Y2ggKGUuY29uc3RydWN0b3Ipe1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsOlxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuUmVhbDpcbiAgICAvLyAgICAgICAgICAgICAvKmlmKHRoaXMucG9zaXRpdmUgJiYgZS5wb3NpdGl2ZSkge1xuICAgIC8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgfSovXG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBCYWQgaWRlYT8gVGhpcyB3aWxsIHN0YXkgaW4gdGhpcyBmb3JtIHVudGlsIHJlYWxpbWFnKCkgaXMgY2FsbGVkIGJ5IHVzZXIsIGFuZCB1c2VyIG9ubHkuXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAvL3JldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0V4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksIGVdLCdeJyksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2UsIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSldLCcqJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICcqJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWw6XG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyonKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICclJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICclJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJ14nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihmYWxzZSAmJiBvcGVuZ2xfVE9ET19oYWNrKCkgJiYgZS52YWx1ZSA9PT0gfn5lLnZhbHVlKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0V4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksIGVdLCdeJyksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2UsIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSldLCcqJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkluZmluaXR5O1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkNvbXBsZXg6XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgZSk7IC8vIEdPIHRvIGFib3ZlICh3aWxsIGFwcGx5IHJlYWxzKVxuICAgIC8vICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbjpcbiAgICAvLyAgICAgICAgICAgICAvL01heWJlIHRoZXJlIGlzIGEgd2F5IHRvIHN3YXAgdGhlIG9yZGVyPyAoZS5nLiBhIC5yZWFsID0gdHJ1ZSBwcm9wZXJ0eSBmb3Igb3RoZXIgdGhpbmdzIHRvIGNoZWNrKVxuICAgIC8vICAgICAgICAgICAgIC8vb3IgaW5zdGFuY2Ugb2YgRXhwcmVzc2lvbi5SZWFsID9cbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzBdKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBlWzFdXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMF0pLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMV0pXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSBlWzBdLmFwcGx5KCcqJyxlWzBdKS5hcHBseSgnKycsZVsxXS5hcHBseSgnKicsZVsxXSkpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAodGhpcy5hcHBseSgnKicsZVswXSkpLmFwcGx5KCcvJywgY2NfZGQpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkoJyonLGVbMV0pLmFwcGx5KCcvJywgY2NfZGQpLmFwcGx5KCdALScpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXI6XG4gICAgLy8gICAgICAgICAgICAgLy9NYXliZSB0aGVyZSBpcyBhIHdheSB0byBzd2FwIHRoZSBvcmRlcj9cbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpLmFwcGx5KG9wZXJhdG9yLCBlKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICB0aHJvdygnTElTVCBGUk9NIFJFQUwgU1lNQk9MISAnKyBvcGVyYXRvciwgZS5jb25zdHJ1Y3Rvcik7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gfVxufTtcblxuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwID0gcmVxdWlyZSgnLi4vJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbGljRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKFN5bWJvbGljRUZ1bmN0aW9uLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2xpY0VGdW5jdGlvbihleHByLCB2YXJzKSB7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgICB0aGlzLnN5bWJvbHMgPSB2YXJzO1xuICAgIFxufTtcbnZhciBfID0gU3ltYm9saWNFRnVuY3Rpb24ucHJvdG90eXBlO1xuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeC5jb25zdHJ1Y3RvciAhPT0gRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgeCA9IEV4cHJlc3Npb24uVmVjdG9yKFt4XSk7XG4gICAgfVxuICAgIHZhciBleHByID0gdGhpcy5leHByO1xuICAgIHZhciBpLCBsID0gdGhpcy5zeW1ib2xzLmxlbmd0aDtcbiAgICBpZiAobCAhPT0geC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgKCdJbnZhbGlkIGRvbWFpbi4gRWxlbWVudCBvZiBGXicgKyBsICsgJyBleHBlY3RlZC4nKTtcbiAgICB9XG4gICAgZm9yKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGV4cHIgPSBleHByLnN1Yih0aGlzLnN5bWJvbHNbaV0sIHhbaV0pXG4gICAgfVxuICAgIHJldHVybiBleHByO1xufTsiXX0=
;