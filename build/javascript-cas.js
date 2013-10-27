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
},{"./Language/default":3,"./global/defaults":4,"./Error":5,"./Context":6,"./Expression":7,"./Language":8,"./global":9}],5:[function(require,module,exports){
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
},{"__browserify_process":12}],8:[function(require,module,exports){
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

},{"util":10,"./Code":13,"./parse":14,"./stringify":15}],3:[function(require,module,exports){
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
},{"../../grammar/parser.js":16,"./":8,"../Expression":7,"../global":9}],16:[function(require,module,exports){
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
symbols_: {"error":2,"expressions":3,"S":4,"EOF":5,"e":6,"stmt":7,"=":8,"!=":9,"<=":10,"<":11,">":12,">=":13,"csl":14,",":15,"vector":16,"(":17,")":18,"+":19,"-":20,"*":21,"/":22,"POWER{":23,"}":24,"_{":25,"!":26,"_SINGLE":27,"SQRT{":28,"FRAC{":29,"{":30,"^SINGLE":31,"identifier":32,"number":33,"IDENTIFIER":34,"LONGIDENTIFIER":35,"DECIMAL":36,"INTEGER":37,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"=",9:"!=",10:"<=",11:"<",12:">",13:">=",15:",",17:"(",18:")",19:"+",20:"-",21:"*",22:"/",23:"POWER{",24:"}",25:"_{",26:"!",27:"_SINGLE",28:"SQRT{",29:"FRAC{",30:"{",31:"^SINGLE",34:"IDENTIFIER",35:"LONGIDENTIFIER",36:"DECIMAL",37:"INTEGER"},
productions_: [0,[3,2],[4,1],[4,1],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[14,3],[14,3],[16,3],[6,3],[6,3],[6,3],[6,3],[6,4],[6,4],[6,2],[6,2],[6,3],[6,6],[6,2],[6,2],[6,2],[6,3],[6,1],[6,1],[6,1],[32,1],[32,1],[33,1],[33,1]],
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
case 19:this.$ = ['!', $$[$0-1]];
break;
case 20:this.$ = ['_', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 21:this.$ = ['sqrt', $$[$0-1]];
break;
case 22:this.$ = ['frac', $$[$0-4], $$[$0-1]];
break;
case 23:this.$ = ['^', $$[$0-1], {type: 'Single', primitive: yytext.substring(1)}];
break;
case 24:this.$ = ['@-', $$[$0]]
break;
case 25:this.$ = ['default', $$[$0-1], $$[$0]];
break;
case 26:this.$ = $$[$0-1]
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = $$[$0];
break;
case 29:this.$ = $$[$0];
break;
case 30:this.$ = yytext;
break;
case 31:this.$ = yytext.substring(1);
break;
case 32:this.$ = {type: 'Number', primitive: yytext};
break;
case 33:this.$ = {type: 'Number', primitive: yytext};
break;
}
},
table: [{3:1,4:2,6:3,7:4,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{1:[3]},{5:[1,16]},{5:[2,2],6:26,8:[1,27],9:[1,28],10:[1,29],11:[1,30],12:[1,31],13:[1,32],16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,2],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,3],24:[2,3]},{6:33,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:34,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:35,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:36,14:37,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,27],8:[2,27],9:[2,27],10:[2,27],11:[2,27],12:[2,27],13:[2,27],15:[2,27],17:[2,27],18:[2,27],19:[2,27],20:[2,27],21:[2,27],22:[2,27],23:[2,27],24:[2,27],25:[2,27],26:[2,27],27:[2,27],28:[2,27],29:[2,27],31:[2,27],34:[2,27],35:[2,27],36:[2,27],37:[2,27]},{5:[2,28],8:[2,28],9:[2,28],10:[2,28],11:[2,28],12:[2,28],13:[2,28],15:[2,28],17:[2,28],18:[2,28],19:[2,28],20:[2,28],21:[2,28],22:[2,28],23:[2,28],24:[2,28],25:[2,28],26:[2,28],27:[2,28],28:[2,28],29:[2,28],31:[2,28],34:[2,28],35:[2,28],36:[2,28],37:[2,28]},{5:[2,29],8:[2,29],9:[2,29],10:[2,29],11:[2,29],12:[2,29],13:[2,29],15:[2,29],17:[2,29],18:[2,29],19:[2,29],20:[2,29],21:[2,29],22:[2,29],23:[2,29],24:[2,29],25:[2,29],26:[2,29],27:[2,29],28:[2,29],29:[2,29],31:[2,29],34:[2,29],35:[2,29],36:[2,29],37:[2,29]},{5:[2,30],8:[2,30],9:[2,30],10:[2,30],11:[2,30],12:[2,30],13:[2,30],15:[2,30],17:[2,30],18:[2,30],19:[2,30],20:[2,30],21:[2,30],22:[2,30],23:[2,30],24:[2,30],25:[2,30],26:[2,30],27:[2,30],28:[2,30],29:[2,30],31:[2,30],34:[2,30],35:[2,30],36:[2,30],37:[2,30]},{5:[2,31],8:[2,31],9:[2,31],10:[2,31],11:[2,31],12:[2,31],13:[2,31],15:[2,31],17:[2,31],18:[2,31],19:[2,31],20:[2,31],21:[2,31],22:[2,31],23:[2,31],24:[2,31],25:[2,31],26:[2,31],27:[2,31],28:[2,31],29:[2,31],31:[2,31],34:[2,31],35:[2,31],36:[2,31],37:[2,31]},{5:[2,32],8:[2,32],9:[2,32],10:[2,32],11:[2,32],12:[2,32],13:[2,32],15:[2,32],17:[2,32],18:[2,32],19:[2,32],20:[2,32],21:[2,32],22:[2,32],23:[2,32],24:[2,32],25:[2,32],26:[2,32],27:[2,32],28:[2,32],29:[2,32],31:[2,32],34:[2,32],35:[2,32],36:[2,32],37:[2,32]},{5:[2,33],8:[2,33],9:[2,33],10:[2,33],11:[2,33],12:[2,33],13:[2,33],15:[2,33],17:[2,33],18:[2,33],19:[2,33],20:[2,33],21:[2,33],22:[2,33],23:[2,33],24:[2,33],25:[2,33],26:[2,33],27:[2,33],28:[2,33],29:[2,33],31:[2,33],34:[2,33],35:[2,33],36:[2,33],37:[2,33]},{1:[2,1]},{6:38,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:39,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:40,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:41,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:42,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{4:43,6:3,7:4,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,19],8:[2,19],9:[2,19],10:[2,19],11:[2,19],12:[2,19],13:[2,19],15:[2,19],17:[2,19],18:[2,19],19:[2,19],20:[2,19],21:[2,19],22:[2,19],23:[2,19],24:[2,19],25:[2,19],26:[2,19],27:[2,19],28:[2,19],29:[2,19],31:[2,19],34:[2,19],35:[2,19],36:[2,19],37:[2,19]},{5:[2,20],8:[2,20],9:[2,20],10:[2,20],11:[2,20],12:[2,20],13:[2,20],15:[2,20],17:[2,20],18:[2,20],19:[2,20],20:[2,20],21:[2,20],22:[2,20],23:[2,20],24:[2,20],25:[2,20],26:[2,20],27:[2,20],28:[2,20],29:[2,20],31:[2,20],34:[2,20],35:[2,20],36:[2,20],37:[2,20]},{5:[2,23],8:[2,23],9:[2,23],10:[2,23],11:[2,23],12:[2,23],13:[2,23],15:[2,23],17:[2,23],18:[2,23],19:[2,23],20:[2,23],21:[2,23],22:[2,23],23:[2,23],24:[2,23],25:[2,23],26:[2,23],27:[2,23],28:[2,23],29:[2,23],31:[2,23],34:[2,23],35:[2,23],36:[2,23],37:[2,23]},{5:[2,25],6:26,8:[2,25],9:[2,25],10:[2,25],11:[2,25],12:[2,25],13:[2,25],15:[2,25],16:9,17:[1,8],18:[2,25],19:[2,25],20:[2,25],21:[2,25],22:[2,25],23:[1,21],24:[2,25],25:[2,25],26:[2,25],27:[2,25],28:[2,25],29:[2,25],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:44,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:45,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:46,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:47,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:48,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:49,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,50],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,51],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,24],6:26,8:[2,24],9:[2,24],10:[2,24],11:[2,24],12:[2,24],13:[2,24],15:[2,24],16:9,17:[1,8],18:[2,24],19:[2,24],20:[2,24],21:[2,24],22:[2,24],23:[1,21],24:[2,24],25:[2,24],26:[1,23],27:[2,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,15:[1,53],16:9,17:[1,8],18:[1,52],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{15:[1,55],18:[1,54]},{5:[2,13],6:26,8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],15:[2,13],16:9,17:[1,8],18:[2,13],19:[2,13],20:[2,13],21:[1,19],22:[1,20],23:[1,21],24:[2,13],25:[2,13],26:[1,23],27:[2,13],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,14],6:26,8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],15:[2,14],16:9,17:[1,8],18:[2,14],19:[2,14],20:[2,14],21:[2,24],22:[2,24],23:[1,21],24:[2,14],25:[2,14],26:[1,23],27:[2,14],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,15],6:26,8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],15:[2,15],16:9,17:[1,8],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[1,21],24:[2,15],25:[2,15],26:[1,23],27:[2,15],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,16],6:26,8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],15:[2,16],16:9,17:[1,8],18:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[1,21],24:[2,16],25:[2,16],26:[1,23],27:[2,16],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,56],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{24:[1,57]},{5:[2,4],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,4],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,5],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,5],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,6],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,6],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,7],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,7],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,8],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,8],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,9],6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[2,9],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,21],8:[2,21],9:[2,21],10:[2,21],11:[2,21],12:[2,21],13:[2,21],15:[2,21],17:[2,21],18:[2,21],19:[2,21],20:[2,21],21:[2,21],22:[2,21],23:[2,21],24:[2,21],25:[2,21],26:[2,21],27:[2,21],28:[2,21],29:[2,21],31:[2,21],34:[2,21],35:[2,21],36:[2,21],37:[2,21]},{30:[1,58]},{5:[2,26],8:[2,26],9:[2,26],10:[2,26],11:[2,26],12:[2,26],13:[2,26],15:[2,26],17:[2,26],18:[2,26],19:[2,26],20:[2,26],21:[2,26],22:[2,26],23:[2,26],24:[2,26],25:[2,26],26:[2,26],27:[2,26],28:[2,26],29:[2,26],31:[2,26],34:[2,26],35:[2,26],36:[2,26],37:[2,26]},{6:59,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],15:[2,12],17:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12],24:[2,12],25:[2,12],26:[2,12],27:[2,12],28:[2,12],29:[2,12],31:[2,12],34:[2,12],35:[2,12],36:[2,12],37:[2,12]},{6:60,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,17],8:[2,17],9:[2,17],10:[2,17],11:[2,17],12:[2,17],13:[2,17],15:[2,17],17:[2,17],18:[2,17],19:[2,17],20:[2,17],21:[2,17],22:[2,17],23:[2,17],24:[2,17],25:[2,17],26:[2,17],27:[2,17],28:[2,17],29:[2,17],31:[2,17],34:[2,17],35:[2,17],36:[2,17],37:[2,17]},{5:[2,18],8:[2,18],9:[2,18],10:[2,18],11:[2,18],12:[2,18],13:[2,18],15:[2,18],17:[2,18],18:[2,18],19:[2,18],20:[2,18],21:[2,18],22:[2,18],23:[2,18],24:[2,18],25:[2,18],26:[2,18],27:[2,18],28:[2,18],29:[2,18],31:[2,18],34:[2,18],35:[2,18],36:[2,18],37:[2,18]},{6:61,16:9,17:[1,8],20:[1,7],28:[1,5],29:[1,6],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,15:[2,11],16:9,17:[1,8],18:[2,11],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,15:[2,10],16:9,17:[1,8],18:[2,10],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{6:26,16:9,17:[1,8],19:[1,17],20:[1,18],21:[1,19],22:[1,20],23:[1,21],24:[1,62],25:[1,22],26:[1,23],27:[1,24],28:[1,5],29:[1,6],31:[1,25],32:10,33:11,34:[1,12],35:[1,13],36:[1,14],37:[1,15]},{5:[2,22],8:[2,22],9:[2,22],10:[2,22],11:[2,22],12:[2,22],13:[2,22],15:[2,22],17:[2,22],18:[2,22],19:[2,22],20:[2,22],21:[2,22],22:[2,22],23:[2,22],24:[2,22],25:[2,22],26:[2,22],27:[2,22],28:[2,22],29:[2,22],31:[2,22],34:[2,22],35:[2,22],36:[2,22],37:[2,22]}],
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
case 4:return 29
break;
case 5:return 28
break;
case 6:return 21
break;
case 7:return 10
break;
case 8:return 13
break;
case 9:return 'NE'
break;
case 10:return 35
break;
case 11:return 34
break;
case 12:return 36
break;
case 13:return 37
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
case 26:return 27
break;
case 27:return 31
break;
case 28:return 25
break;
case 29:return 23
break;
case 30:return 26
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
case 37:return 30
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
},{"fs":17,"path":18,"__browserify_process":12}],4:[function(require,module,exports){
(function(){var Expression = require('../Expression');
var util = require('util');

module.exports.attach = function (global) {


    function Derivative(wrt) {
        return new Expression.Function({
            default: function (x) {
                return x.differentiate(wrt);
            }
        })
    }
        
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
            throw(new Error('bad arg in gammln'));
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
        default: function(x) {
            if(x instanceof Expression.NumericalReal) {
                return new Expression.NumericalReal(Math.tan(x.value));
            }
            if(x instanceof Expression.List.Real || x instanceof Expression.Symbol.Real) {
                return Expression.List.Real([global.tan, x]);
            }
            return Expression.List([global.tan, x]);
            
        },
        derivative: global.sin['@-'](),
        'text/latex': '\\tan',
        'text/javascript': 'Math.tan',
        'x-shader/x-fragment': 'tan',
        title: 'Tangent Function',
        description: 'Tangent Function desc',
        examples: ['\\tan(\\pi/3)', '\\tan (\\pi/2)'],
        related: ['sin', 'cos']
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

    global['factorial'] = new Expression.Function({
        default: function (x) {
            return global.Gamma.default(x['+'](global.One));
        },
        'text/latex': '\\factorial'
    });

    global['atan'] = global.atan2;

    global['Gamma'] = new Expression.Function({
        default: function(x){
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
        'text/javascript': gammln,
        'x-shader/x-fragment': function () {

        },
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
    });

    global['Re'] = new Expression.Function({
        default: function(x) {
            return x.real();
        },
        apply_realimag: function(op, x) {
            return [x.real(), global.Zero];
        },
        'text/latex': '\\Re'
    });

    global['Im'] = new Expression.Function({
        default: function(x) {
            return x.imag();
        },
        distributed_under_differentiation: true,
        apply_realimag: function(op, x) {
            return [x.imag(), global.Zero];
        },
        'text/latex': '\\Im'
    });

    function FiniteSet(elements) {
        this.elements = elements || [];
    }
    FiniteSet.prototype.intersect = function (x) {
        var res = [];
        for(var i = 0; i < this.elements.length; i++) {
            if (x.elements.indexOf(this.elements[i]) !== -1) {
                res.push(this.elements[i]);
            }
        }
        return new FiniteSet(res);
    };
    FiniteSet.prototype.enumerate = function (n, fn) {
        this.elements = [];
        for(var i = 0; i < n; i++) {
            this.elements[i] = null;
        }
        if (fn) {
            this.map(fn);
        }
    };
    FiniteSet.prototype.map = function (fn) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            this.elements[i] = new fn(this.elements[i], i);
        }
        return this;
    };
    FiniteSet.prototype.subset = function (x) {
        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (x.elements.indexOf(this.elements[i]) === -1) {
                return false;
            }
        }
        return false;
    };
    FiniteSet.prototype.psubset = function (x) {
        return (this.elements.length < x.elements.length) && this.subset(x);
    };
    FiniteSet.prototype.supset = function (x) {
        return x.subset(this);
    };

    FiniteSet.prototype.equals = function (x) {
        if (!this.elements.length !== x.elements.length) return false;

        for(var i = 0, l = this.elements.length; i < l; i++) {
            if (this.elements[i] !== x.elements[i]) return false;
        }

        return true;
    }

    util.inherits(ModuloGroup, FiniteSet);
    function ModuloGroup(n, operator) {
        FiniteSet.call(this);

        operator = operator || 'default';

        function Element(_, n) {
            this.n = n;
        }

        Element.prototype[operator]
        = Element.prototype.default
        = function (x) {
            return new Element((this.n + x.n) % n);
        };
        
        this.enumerate(n, Element);

        this.prototype = Element.prototype;

    };

    util.inherits(MultiValue, FiniteSet);

    function MultiValue(elements) {
        FiniteSet.call(this, elements);
    }


    MultiValue.prototype.default = function (x) {
        this.operator('default', x);
    };

    MultiValue.prototype['+'] = function (x) {
        this.operator('+', x);
    };

    MultiValue.prototype['*'] = function (x) {
        this.operator('*', x);
    };

    MultiValue.prototype.operator = function (operator, x) {

        if (x instanceof MultiValue) {
            var res = [];
            for(var i = 0; i < this.elements.length; i++) {
                for(var j = 0; j < x.elements.length; j++) {
                    var n = this.elements[i][operator](j);
                    res.push(n);
                }
            }

            return new MultiValue(res);
        } else {
            return this.map(function (a) {
                return a[operator](x);
            });
        }
    };


    function quadrant(x) {
        if (x instanceof Expression.NumericalReal) {
            return x.value > 0 ? '+' : '-';
        }
        if (x instanceof Expression.Symbol.Real) {
            return '+-';
        }
        if (x instanceof Expression.List.Real) {
            if (x.operator === '^') {
                var q0 = quadrant(x[0]);
                var n = x[1].value;

                if (q0 === '+') return '+';
                if (q0 === '-' || q0 === '+-') return n % 2 === 0 ? '+' : '-';

                return '+-';
            }
            var q = [].map.call(x, quadrant);

            if (q[0] === '+-' || q[1] === '+-') return '+-';

            switch (x.operator) {
                case '-':
                    if (q[1] === '-') q[1] = '+';
                    if (q[1] === '+') q[1] = '-';

                case '+': return q[0] === q[1] ? q[0] : '+-';


                case '/':
                case '*': return q[0] === q[1] ? '+' : '-';


            }
        }
    }

    function isPositive(x) {
        var s = quadrant(x);
        return s === '+';
    }

    global['sqrt'] = new Expression.Function({
        default: function (x) {

            if (x instanceof Expression.NumericalReal) {
                var v = x.value;
                var sqrtMagX = Math.sqrt(v)
                if(v < 0) {
                    return new Expression.List.ComplexCartesian([
                        global.Zero, new Expression.NumericalReal(sqrtMagX)
                    ]);
                }
                return new Expression.NumericalReal(sqrtMagX);

            } else if (x instanceof Expression.List.ComplexPolar) {
                return new Expression.List.ComplexPolar([
                    x[0],
                    x[1]['/'](new Expression.Integer(2))
                ]);
            } else if (x instanceof Expression.List) {
                var elem = PE(x);

                // if it is positive
                if (elem.equals(new MultiValue([E.elements[0]]))) {
                    return Expression.List.Real([global.sqrt, x]);
                    
                } else {
                    return Expression.List([global.sqrt, x]);
                }

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
},{"util":10,"../Expression":7}],6:[function(require,module,exports){
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
},{"util":10,"../global":9}],7:[function(require,module,exports){
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
},{"./Constant":19,"./NumericalComplex":20,"./NumericalReal":21,"./Rational":22,"./Integer":23,"../global":9,"./List":24,"./List/Real":25,"./List/ComplexCartesian":26,"./List/ComplexPolar":27,"./Symbol/Real":28,"./Symbol":29,"./Statement":30,"./Vector":31,"./Matrix":32,"./Function":33,"./Function/Symbolic":34,"./Infinitesimal":35}],13:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
module.exports = function stringify(expr, lang) {
    return expr.s(lang);
};

},{}],17:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],18:[function(require,module,exports){
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
},{"__browserify_process":12}],19:[function(require,module,exports){
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
},{"util":10,"./":7,"../global":9}],20:[function(require,module,exports){
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
},{"util":10,"./NumericalComplex":20,"../global":9,"./":7}],22:[function(require,module,exports){
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
},{"util":10,"./NumericalReal":21,"../global":9,"./":7}],23:[function(require,module,exports){
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
},{"util":10,"./Rational":22,"../global":9}],14:[function(require,module,exports){
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
                    case '!':
                        return Global.factorial.default(evaluate(ast[1]));
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
},{"../Expression":7,"../global":9}],24:[function(require,module,exports){
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

List.prototype.sub = function (x, y) {
    var a = this[0].sub(x, y);
    var b = this[1] && this[1].sub(x, y);

    return a[this.operator || 'default'](b);
};

List.prototype.map = function (f) {
    var elements = Array.prototype.map.call(this, f);
    return elements[0][this.operator || 'default'].apply(this, elements.slice(1));
};
},{"util":10,"../":7}],29:[function(require,module,exports){
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
},{"util":10,"../":7,"../../global":9}],30:[function(require,module,exports){
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

},{"util":10,"../":7}],32:[function(require,module,exports){
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


},{"util":10,"../":7}],31:[function(require,module,exports){
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
},{"util":10,"../":7,"../../global":9}],33:[function(require,module,exports){
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


},{"util":10,"../":7}],35:[function(require,module,exports){
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
},{"util":10,"../":7,"../../global":9}],25:[function(require,module,exports){
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
},{"util":10,"../":24,"../../":7,"../../../global":9}],26:[function(require,module,exports){
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

},{"util":10,"../":24}],27:[function(require,module,exports){
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

},{"util":10,"../":24,"../../":7}],28:[function(require,module,exports){
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
},{"util":10,"../":29,"../../../global":9,"../../":7}],34:[function(require,module,exports){
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
},{"util":10,"../":33,"../../":7}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FcnJvci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9nbG9iYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvZGVmYXVsdC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2dyYW1tYXIvcGFyc2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL2dsb2JhbC9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9Db250ZXh0L2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvQ29kZS5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9zdHJpbmdpZnkuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2ZzLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9wYXRoLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vQ29uc3RhbnQuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9OdW1lcmljYWxDb21wbGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTnVtZXJpY2FsUmVhbC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1JhdGlvbmFsLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vSW50ZWdlci5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9wYXJzZS5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0xpc3QvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9TeW1ib2wvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9TdGF0ZW1lbnQvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9NYXRyaXgvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9WZWN0b3IvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9GdW5jdGlvbi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0luZmluaXRlc2ltYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L1JlYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L0NvbXBsZXhDYXJ0ZXNpYW4vaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L0NvbXBsZXhQb2xhci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1N5bWJvbC9SZWFsL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vRnVuY3Rpb24vU3ltYm9saWMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3R0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBNID0gcmVxdWlyZSgnLi9saWInKTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIF9NID0gd2luZG93Lk07XG4gICAgd2luZG93Lk0gPSBNO1xuICAgIE0ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93Lk0gPSBfTTtcbiAgICAgICAgcmV0dXJuIE07XG4gICAgfTtcbn1cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gTTtcbn1cbiIsIihmdW5jdGlvbigpey8qanNsaW50IG5vZGU6IHRydWUgKi9cblxuLy8gbm90IHN1cmUgaWYgdGhpcyBpcyByZXF1aXJlZDpcbi8qanNoaW50IHN1YjogdHJ1ZSAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEV4cHJlc3Npb24gID0gcmVxdWlyZSgnLi9FeHByZXNzaW9uJyksXG4gICAgQ29udGV4dCAgICAgPSByZXF1aXJlKCcuL0NvbnRleHQnKSxcbiAgICBNYXRoRXJyb3IgICA9IHJlcXVpcmUoJy4vRXJyb3InKSxcbiAgICBsYW5ndWFnZSAgICA9IHJlcXVpcmUoJy4vTGFuZ3VhZ2UvZGVmYXVsdCcpLFxuICAgIENvZGUgICAgICAgID0gcmVxdWlyZSgnLi9MYW5ndWFnZScpLkNvZGUsXG4gICAgR2xvYmFsICAgICAgPSByZXF1aXJlKCcuL2dsb2JhbCcpO1xuXG4vLyBEZWZpbmUgc2luLCBjb3MsIHRhbiwgZXRjLlxudmFyIGRlZmF1bHRzICAgID0gcmVxdWlyZSgnLi9nbG9iYWwvZGVmYXVsdHMnKTtcbmRlZmF1bHRzLmF0dGFjaChHbG9iYWwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE07XG5cbmZ1bmN0aW9uIE0oZSwgYykge1xuICAgIHJldHVybiBsYW5ndWFnZS5wYXJzZShlLCBjIHx8IEdsb2JhbCk7XG59XG5cbk0udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gW1xuICAgICdmdW5jdGlvbiBNKGV4cHJlc3Npb24sIGNvbnRleHQpIHsnLFxuICAgICcgICAgLyohJyxcbiAgICAnICAgICAqICBNYXRoIEphdmFTY3JpcHQgTGlicmFyeSB2My45LjEnLFxuICAgICcgICAgICogIGh0dHBzOi8vZ2l0aHViLmNvbS9hYW50dGhvbnkvamF2YXNjcmlwdC1jYXMnLFxuICAgICcgICAgICogICcsXG4gICAgJyAgICAgKiAgQ29weXJpZ2h0IDIwMTAgQW50aG9ueSBGb3N0ZXIuIEFsbCByaWdodHMgcmVzZXJ2ZWQuJyxcbiAgICAnICAgICAqLycsXG4gICAgJyAgICBbYXdlc29tZSBjb2RlXScsXG4gICAgJ30nXS5qb2luKCdcXG4nKTtcbn07XG5cbk1bJ0NvbnRleHQnXSAgICA9IENvbnRleHQ7XG5NWydFeHByZXNzaW9uJ10gPSBFeHByZXNzaW9uO1xuTVsnR2xvYmFsJ10gICAgID0gR2xvYmFsO1xuTVsnRXJyb3InXSAgICAgID0gTWF0aEVycm9yO1xuXG5FeHByZXNzaW9uLnByb3RvdHlwZS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICBDb2RlLmxhbmd1YWdlID0gbGFuZ3VhZ2U7XG4gICAgQ29kZS5uZXdDb250ZXh0KCk7XG4gICAgcmV0dXJuIHRoaXMuX3MoQ29kZSwgbGFuZyk7XG59O1xuRXhwcmVzc2lvbi5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXMucygndGV4dC9qYXZhc2NyaXB0JykuY29tcGlsZSh4KTtcbn1cblxudmFyIGV4dGVuc2lvbnMgPSB7fTtcblxuTVsncmVnaXN0ZXInXSA9IGZ1bmN0aW9uIChuYW1lLCBpbnN0YWxsZXIpe1xuICAgIGlmKEV4cHJlc3Npb24ucHJvdG90eXBlW25hbWVdKSB7XG4gICAgICAgIHRocm93KCdNZXRob2QgLicgKyBuYW1lICsgJyBpcyBhbHJlYWR5IGluIHVzZSEnKTtcbiAgICB9XG4gICAgZXh0ZW5zaW9uc1tuYW1lXSA9IGluc3RhbGxlcjtcbn07XG5cbk1bJ2xvYWQnXSA9IGZ1bmN0aW9uKG5hbWUsIGNvbmZpZykge1xuICAgIGV4dGVuc2lvbnNbbmFtZV0oTSwgRXhwcmVzc2lvbiwgY29uZmlnKTtcbiAgICBkZWxldGUgZXh0ZW5zaW9uc1tuYW1lXTtcbn07XG5cbn0pKCkiLCJmdW5jdGlvbiBNYXRoRXJyb3Ioc3RyKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gc3RyO1xufVxuTWF0aEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRoRXJyb3I7XG4iLCIoZnVuY3Rpb24oKXt2YXIgZ2xvYmFsID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xuXG59KSgpIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0RhdGUgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nfTtcbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSd9O1xuXG5cbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMucHV0cyA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5kZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGZ1bmN0aW9uKG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycykge1xuICB2YXIgc2VlbiA9IFtdO1xuXG4gIHZhciBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3NcbiAgICB2YXIgc3R5bGVzID1cbiAgICAgICAgeyAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAgICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICAgICAgICAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICAgICAgICAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAgICAgICAgICdibHVlJyA6IFszNCwgMzldLFxuICAgICAgICAgICdjeWFuJyA6IFszNiwgMzldLFxuICAgICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgICAgICAgICAncmVkJyA6IFszMSwgMzldLFxuICAgICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0gfTtcblxuICAgIHZhciBzdHlsZSA9XG4gICAgICAgIHsgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICAgICAgICAgJ251bWJlcic6ICdibHVlJyxcbiAgICAgICAgICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAgICAgICAgICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICAgICAgICAgJ251bGwnOiAnYm9sZCcsXG4gICAgICAgICAgJ3N0cmluZyc6ICdncmVlbicsXG4gICAgICAgICAgJ2RhdGUnOiAnbWFnZW50YScsXG4gICAgICAgICAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgICAgICAgICAncmVnZXhwJzogJ3JlZCcgfVtzdHlsZVR5cGVdO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgICAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9O1xuICBpZiAoISBjb2xvcnMpIHtcbiAgICBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHsgcmV0dXJuIHN0cjsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gICAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAgIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgICAgdmFsdWUgIT09IGV4cG9ydHMgJiZcbiAgICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuXG4gICAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG5cbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcblxuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gICAgfVxuICAgIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBzdHlsaXplKCdudWxsJywgJ251bGwnKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gICAgdmFyIHZpc2libGVfa2V5cyA9IE9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHNob3dIaWRkZW4gPyBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkgOiB2aXNpYmxlX2tleXM7XG5cbiAgICAvLyBGdW5jdGlvbnMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEYXRlcyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzdHlsaXplKHZhbHVlLnRvVVRDU3RyaW5nKCksICdkYXRlJyk7XG4gICAgfVxuXG4gICAgdmFyIGJhc2UsIHR5cGUsIGJyYWNlcztcbiAgICAvLyBEZXRlcm1pbmUgdGhlIG9iamVjdCB0eXBlXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ0FycmF5JztcbiAgICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAnT2JqZWN0JztcbiAgICAgIGJyYWNlcyA9IFsneycsICd9J107XG4gICAgfVxuXG4gICAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIGJhc2UgPSAoaXNSZWdFeHAodmFsdWUpKSA/ICcgJyArIHZhbHVlIDogJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICBiYXNlID0gJyAnICsgdmFsdWUudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcblxuICAgIHZhciBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBuYW1lLCBzdHI7XG4gICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXykge1xuICAgICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZV9rZXlzLmluZGV4T2Yoa2V5KSA8IDApIHtcbiAgICAgICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgICAgIH1cbiAgICAgIGlmICghc3RyKSB7XG4gICAgICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWVba2V5XSkgPCAwKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2VUaW1lcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ0FycmF5JyAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgICAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbiAgICB9KTtcblxuICAgIHNlZW4ucG9wKCk7XG5cbiAgICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICAgIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgICAgbnVtTGluZXNFc3QrKztcbiAgICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gICAgfSwgMCk7XG5cbiAgICBpZiAobGVuZ3RoID4gNTApIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArXG4gICAgICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIGJyYWNlc1sxXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICByZXR1cm4gZm9ybWF0KG9iaiwgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyAyIDogZGVwdGgpKTtcbn07XG5cblxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gYXIgaW5zdGFuY2VvZiBBcnJheSB8fFxuICAgICAgICAgQXJyYXkuaXNBcnJheShhcikgfHxcbiAgICAgICAgIChhciAmJiBhciAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBpc0FycmF5KGFyLl9fcHJvdG9fXykpO1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiByZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fFxuICAgICh0eXBlb2YgcmUgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nKTtcbn1cblxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICBpZiAoZCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiB0cnVlO1xuICBpZiAodHlwZW9mIGQgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gIHZhciBwcm9wZXJ0aWVzID0gRGF0ZS5wcm90b3R5cGUgJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoRGF0ZS5wcm90b3R5cGUpO1xuICB2YXIgcHJvdG8gPSBkLl9fcHJvdG9fXyAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhkLl9fcHJvdG9fXyk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShwcm90bykgPT09IEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpO1xufVxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobXNnKSB7fTtcblxuZXhwb3J0cy5wdW1wID0gbnVsbDtcblxudmFyIE9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgLy8gZnJvbSBlczUtc2hpbVxuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgICAgICBvYmplY3QgPSB7ICdfX3Byb3RvX18nIDogbnVsbCB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBUeXBlID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgICAgICBvYmplY3QuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdF9jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKHR5cGVvZiBmICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChleHBvcnRzLmluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOiByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvcih2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pe1xuICAgIGlmICh4ID09PSBudWxsIHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBleHBvcnRzLmluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIExhbmd1YWdlKHBhcnNlciwgQ29uc3RydWN0LCBsYW5ndWFnZSkge1xuICAgIHRoaXMuY2ZnID0gcGFyc2VyO1xuICAgIHRoaXMuQ29uc3RydWN0ID0gQ29uc3RydWN0O1xuICAgIHZhciBvcGVyYXRvcnMgPSB0aGlzLm9wZXJhdG9ycyA9IHt9LFxuICAgICAgICBvcFByZWNlZGVuY2UgPSAwO1xuICAgIGZ1bmN0aW9uIG9wKHYsIGFzc29jaWF0aXZpdHksIGFyaXR5KSB7XG5cbiAgICB9XG4gICAgbGFuZ3VhZ2UuZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICBmdW5jdGlvbiBkZWZvcChzdHIsIG8pIHtcbiAgICAgICAgICAgIHZhciBhc3NvY2lhdGl2aXR5ID0gb1sxXSB8fCAnbGVmdCc7XG4gICAgICAgICAgICB2YXIgYXJpdHkgPSAob1syXSA9PT0gdW5kZWZpbmVkKSA/IDIgOiBvWzJdO1xuXG4gICAgICAgICAgICBvcGVyYXRvcnNbc3RyXSA9ICB7XG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpdml0eTogYXNzb2NpYXRpdml0eSxcbiAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBvcFByZWNlZGVuY2UrKyxcbiAgICAgICAgICAgICAgICBhcml0eTogYXJpdHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0ciA9IG9bMF07XG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGVmb3Aoc3RyLCBvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ci5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICAgICAgZGVmb3Aocywgbyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5MYW5ndWFnZS5Db2RlID0gcmVxdWlyZSgnLi9Db2RlJyk7XG5cbnZhciBfICAgICAgICA9IExhbmd1YWdlLnByb3RvdHlwZTtcblxuXy5wYXJzZSAgICAgID0gcmVxdWlyZSgnLi9wYXJzZScpO1xuXy5zdHJpbmdpZnkgID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcblxuXy5wb3N0Zml4ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBvcGVyYXRvciA9IHRoaXMub3BlcmF0b3JzW3N0cl07XG4gICAgcmV0dXJuICBvcGVyYXRvci5hc3NvY2lhdGl2aXR5ID09PSAwICYmIFxuICAgICAgICAgICAgb3BlcmF0b3IuYXJpdHkgPT09IDE7XG59O1xuXG5fLnVuYXJ5ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciB1bmFyeV9zZWNvbmRhcnlzID0gWycrJywgJy0nLCAnwrEnXTtcbiAgICByZXR1cm4gKHVuYXJ5X3NlY29uZGFyeXMuaW5kZXhPZihvKSAhPT0gLTEpID8gKCdAJyArIG8pIDogZmFsc2U7XG59O1xuXG5fLmFzc29jaWF0aXZlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHRocm93IG5ldyBFcnJvcignYXNzb2NpYXRpdmU/Pz8/Jyk7XG4gICAgLy8gcmV0dXJuIHRoaXMub3BlcmF0b3JzW3N0cl0uYXNzb2NpYXRpdml0eSA9PT0gdHJ1ZTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IExhbmd1YWdlO1xuIiwiKGZ1bmN0aW9uKCl7dmFyIExhbmd1YWdlID0gcmVxdWlyZSgnLi8nKTtcblxudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyksXG4gICAgR2xvYmFsICAgICA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpOyAvLyAmdGltZXM7IGNoYXJhY3RlclxuXG4vLyBCdWlsdCBieSBKaXNvbjpcbnZhciBwYXJzZXIgPSByZXF1aXJlKCcuLi8uLi9ncmFtbWFyL3BhcnNlci5qcycpO1xuXG5wYXJzZXIucGFyc2VFcnJvciA9IGZ1bmN0aW9uIChzdHIsIGhhc2gpIHtcbiAgICAvLyB7XG4gICAgLy8gICAgIHRleHQ6IHRoaXMubGV4ZXIubWF0Y2gsXG4gICAgLy8gICAgIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsXG4gICAgLy8gICAgIGxpbmU6IHRoaXMubGV4ZXIueXlsaW5lbm8sXG4gICAgLy8gICAgIGxvYzogeXlsb2MsXG4gICAgLy8gICAgIGV4cGVjdGVkOlxuICAgIC8vICAgICBleHBlY3RlZFxuICAgIC8vIH1cbiAgICB2YXIgZXIgPSBuZXcgU3ludGF4RXJyb3Ioc3RyKTtcbiAgICBlci5saW5lID0gaGFzaC5saW5lO1xuICAgIHRocm93IGVyO1xufTtcblxuXG52YXIgbGVmdCA9ICdsZWZ0JywgcmlnaHQgPSAncmlnaHQnO1xudmFyIEwgPSBsZWZ0O1xudmFyIFIgPSByaWdodDtcblxuXG5cbnZhciBsYW5ndWFnZSA9IG1vZHVsZS5leHBvcnRzID0gbmV3IExhbmd1YWdlKHBhcnNlciwge1xuICAgICAgICBOdW1iZXI6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIGlmIChzdHIgPT09ICcxJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzdHIgPT09ICcwJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKE51bWJlcihzdHIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgvXltcXGRdKlxcLltcXGRdKyQvLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWNpbWFsUGxhY2UgPSBzdHIuaW5kZXhPZignLicpO1xuICAgICAgICAgICAgICAgIC8vIDEyLjM0NSAtPiAxMjM0NSAvIDEwMDBcbiAgICAgICAgICAgICAgICAvLyAwMC41IC0+IDUvMTBcbiAgICAgICAgICAgICAgICB2YXIgZGVub21fcCA9IHN0ci5sZW5ndGggLSBkZWNpbWFsUGxhY2UgLSAxO1xuICAgICAgICAgICAgICAgIHZhciBkID0gTWF0aC5wb3coMTAsIGRlbm9tX3ApO1xuICAgICAgICAgICAgICAgIHZhciBuID0gTnVtYmVyKHN0ci5yZXBsYWNlKCcuJywgJycpKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uUmF0aW9uYWwobiwgZCkucmVkdWNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChOdW1iZXIoc3RyKSk7XG4gICAgICAgIH0sXG4gICAgICAgIFN0cmluZzogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfSxcbiAgICAgICAgU2luZ2xlOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICAvLyBTaW5nbGUgbGF0ZXggY2hhcnMgZm9yIHheMywgeF55IGV0YyAoTk9UIHhee2FiY30pXG4gICAgICAgICAgICBpZiAoIWlzTmFOKHN0cikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcihOdW1iZXIoc3RyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChzdHIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBbXG4gICAgWyc7J10sICAgICAgICAgIC8qTCAvIFIgbWFrZXMgbm8gZGlmZmVyZW5jZT8/PyE/PyE/ICovXG4gICAgWycsJ10sXG4gICAgW1snPScsICcrPScsICctPScsICcqPScsICcvPScsICclPScsICcmPScsICdePScsICd8PSddLFJdLFxuICAgIFtbJz8nLCc6J10sUiwyXSxcbiAgICBbWyfiiKgnXV0sXG4gICAgW1snJiYnXV0sXG4gICAgW1snfCddXSxcbiAgICBbWyc/Pz8/Pz8nXV0sLy9YT1JcbiAgICBbWycmJ11dLFxuICAgIFtbJz09JywgJ+KJoCcsICchPT0nLCAnPT09J11dLFxuICAgIFtbJzwnLCAnPD0nLCAnPicsICc+PSddLExdLFxuICAgIFtbJz4+JywgJzw8J11dLFxuICAgIFsnwrEnLCBSLCAyXSxcbiAgICBbWycrJ10sIHRydWVdLFxuICAgIFtbJy0nXSwgTF0sXG4gICAgW1sn4oirJywgJ+KIkSddLCBSLCAxXSxcbiAgICBbWycqJywgJyUnXSwgUl0sXG4gICAgW2Nyb3NzUHJvZHVjdCwgUl0sXG4gICAgW1snQCsnLCAnQC0nLCAnQMKxJ10sIFIsIDFdLCAvL3VuYXJ5IHBsdXMvbWludXNcbiAgICBbWyfCrCddLCBMLCAxXSxcbiAgICBbJ2RlZmF1bHQnLCBSLCAyXSwgLy9JIGNoYW5nZWQgdGhpcyB0byBSIGZvciA1c2luKHQpXG4gICAgWyfiiJgnLCBSLCAyXSxcbiAgICBbWycvJ11dLFxuICAgIFtbJ14nXV0sLy9lKip4XG4gICAgWychJywgTCwgMV0sXG4gICAgW1snfiddLCBSLCAxXSwgLy9iaXR3aXNlIG5lZ2F0aW9uXG4gICAgW1snKysnLCAnKysnLCAnLicsICctPiddLEwsMV0sXG4gICAgW1snOjonXV0sXG4gICAgW1snXyddLCBMLCAyXSxcbiAgICBbJ3ZhcicsIFIsIDFdLFxuICAgIFsnYnJlYWsnLCBSLCAwXSxcbiAgICBbJ3Rocm93JywgUiwgMV0sXG4gICAgWydcXCcnLCBMLCAxXSxcbiAgICBbJ1xcdTIyMUEnLCBSLCAxXSwgLy8gU3FydFxuICAgIFsnIycsIFIsIDFdIC8qYW5vbnltb3VzIGZ1bmN0aW9uKi9cbl0pO1xuXG4vKlxuIExhbmd1YWdlIHNwZWMgY29sdW1ucyBpbiBvcmRlciBvZiBfaW5jcmVhc2luZyBwcmVjZWRlbmNlXzpcbiAqIG9wZXJhdG9yIHN0cmluZyByZXByZXNlbnRhdGlvbihzKS4gVGhlc2UgYXJlIGRpZmZlcmVudCBvcGVyYXRvcnMsIGJ1dCBzaGFyZSBhbGwgcHJvcGVydGllcy5cbiAqIEFzc29jaWF0aXZpdHlcbiAqIE9wZXJhbmQgY291bnQgKE11c3QgYmUgYSBmaXhlZCBudW1iZXIpIFxuICogKFRPRE8/PykgY29tbXV0ZSBncm91cD8gLSBvciBzaG91bGQgdGhpcyBiZSBkZXJpdmVkP1xuICogKFRPRE8/KSBhc3NvY2lhdGl2ZT8gY29tbXV0YXRpdmU/ICAtIFNob3VsZCBiZSBjYWxjdWxhdGVkP1xuICogKFRPRE8/KSBJZGVudGl0eT9cbiovXG5cbi8vIHZhciBtYXRoZW1hdGljYSA9IG5ldyBMYW5ndWFnZShbXG4vLyAgICAgWyc7J10sXG4vLyAgICAgWycsJ10sXG4vLyAgICAgW1snPScsICcrPSddXVxuLy8gXSk7XG5cbn0pKCkiLCIoZnVuY3Rpb24ocHJvY2Vzcyl7LyogcGFyc2VyIGdlbmVyYXRlZCBieSBqaXNvbiAwLjQuMTAgKi9cbi8qXG4gIFJldHVybnMgYSBQYXJzZXIgb2JqZWN0IG9mIHRoZSBmb2xsb3dpbmcgc3RydWN0dXJlOlxuXG4gIFBhcnNlcjoge1xuICAgIHl5OiB7fVxuICB9XG5cbiAgUGFyc2VyLnByb3RvdHlwZToge1xuICAgIHl5OiB7fSxcbiAgICB0cmFjZTogZnVuY3Rpb24oKSxcbiAgICBzeW1ib2xzXzoge2Fzc29jaWF0aXZlIGxpc3Q6IG5hbWUgPT0+IG51bWJlcn0sXG4gICAgdGVybWluYWxzXzoge2Fzc29jaWF0aXZlIGxpc3Q6IG51bWJlciA9PT4gbmFtZX0sXG4gICAgcHJvZHVjdGlvbnNfOiBbLi4uXSxcbiAgICBwZXJmb3JtQWN0aW9uOiBmdW5jdGlvbiBhbm9ueW1vdXMoeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB5eSwgeXlzdGF0ZSwgJCQsIF8kKSxcbiAgICB0YWJsZTogWy4uLl0sXG4gICAgZGVmYXVsdEFjdGlvbnM6IHsuLi59LFxuICAgIHBhcnNlRXJyb3I6IGZ1bmN0aW9uKHN0ciwgaGFzaCksXG4gICAgcGFyc2U6IGZ1bmN0aW9uKGlucHV0KSxcblxuICAgIGxleGVyOiB7XG4gICAgICAgIEVPRjogMSxcbiAgICAgICAgcGFyc2VFcnJvcjogZnVuY3Rpb24oc3RyLCBoYXNoKSxcbiAgICAgICAgc2V0SW5wdXQ6IGZ1bmN0aW9uKGlucHV0KSxcbiAgICAgICAgaW5wdXQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIHVucHV0OiBmdW5jdGlvbihzdHIpLFxuICAgICAgICBtb3JlOiBmdW5jdGlvbigpLFxuICAgICAgICBsZXNzOiBmdW5jdGlvbihuKSxcbiAgICAgICAgcGFzdElucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICB1cGNvbWluZ0lucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICBzaG93UG9zaXRpb246IGZ1bmN0aW9uKCksXG4gICAgICAgIHRlc3RfbWF0Y2g6IGZ1bmN0aW9uKHJlZ2V4X21hdGNoX2FycmF5LCBydWxlX2luZGV4KSxcbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSxcbiAgICAgICAgbGV4OiBmdW5jdGlvbigpLFxuICAgICAgICBiZWdpbjogZnVuY3Rpb24oY29uZGl0aW9uKSxcbiAgICAgICAgcG9wU3RhdGU6IGZ1bmN0aW9uKCksXG4gICAgICAgIF9jdXJyZW50UnVsZXM6IGZ1bmN0aW9uKCksXG4gICAgICAgIHRvcFN0YXRlOiBmdW5jdGlvbigpLFxuICAgICAgICBwdXNoU3RhdGU6IGZ1bmN0aW9uKGNvbmRpdGlvbiksXG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgcmFuZ2VzOiBib29sZWFuICAgICAgICAgICAob3B0aW9uYWw6IHRydWUgPT0+IHRva2VuIGxvY2F0aW9uIGluZm8gd2lsbCBpbmNsdWRlIGEgLnJhbmdlW10gbWVtYmVyKVxuICAgICAgICAgICAgZmxleDogYm9vbGVhbiAgICAgICAgICAgICAob3B0aW9uYWw6IHRydWUgPT0+IGZsZXgtbGlrZSBsZXhpbmcgYmVoYXZpb3VyIHdoZXJlIHRoZSBydWxlcyBhcmUgdGVzdGVkIGV4aGF1c3RpdmVseSB0byBmaW5kIHRoZSBsb25nZXN0IG1hdGNoKVxuICAgICAgICAgICAgYmFja3RyYWNrX2xleGVyOiBib29sZWFuICAob3B0aW9uYWw6IHRydWUgPT0+IGxleGVyIHJlZ2V4ZXMgYXJlIHRlc3RlZCBpbiBvcmRlciBhbmQgZm9yIGVhY2ggbWF0Y2hpbmcgcmVnZXggdGhlIGFjdGlvbiBjb2RlIGlzIGludm9rZWQ7IHRoZSBsZXhlciB0ZXJtaW5hdGVzIHRoZSBzY2FuIHdoZW4gYSB0b2tlbiBpcyByZXR1cm5lZCBieSB0aGUgYWN0aW9uIGNvZGUpXG4gICAgICAgIH0sXG5cbiAgICAgICAgcGVyZm9ybUFjdGlvbjogZnVuY3Rpb24oeXksIHl5XywgJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucywgWVlfU1RBUlQpLFxuICAgICAgICBydWxlczogWy4uLl0sXG4gICAgICAgIGNvbmRpdGlvbnM6IHthc3NvY2lhdGl2ZSBsaXN0OiBuYW1lID09PiBzZXR9LFxuICAgIH1cbiAgfVxuXG5cbiAgdG9rZW4gbG9jYXRpb24gaW5mbyAoQCQsIF8kLCBldGMuKToge1xuICAgIGZpcnN0X2xpbmU6IG4sXG4gICAgbGFzdF9saW5lOiBuLFxuICAgIGZpcnN0X2NvbHVtbjogbixcbiAgICBsYXN0X2NvbHVtbjogbixcbiAgICByYW5nZTogW3N0YXJ0X251bWJlciwgZW5kX251bWJlcl0gICAgICAgKHdoZXJlIHRoZSBudW1iZXJzIGFyZSBpbmRleGVzIGludG8gdGhlIGlucHV0IHN0cmluZywgcmVndWxhciB6ZXJvLWJhc2VkKVxuICB9XG5cblxuICB0aGUgcGFyc2VFcnJvciBmdW5jdGlvbiByZWNlaXZlcyBhICdoYXNoJyBvYmplY3Qgd2l0aCB0aGVzZSBtZW1iZXJzIGZvciBsZXhlciBhbmQgcGFyc2VyIGVycm9yczoge1xuICAgIHRleHQ6ICAgICAgICAobWF0Y2hlZCB0ZXh0KVxuICAgIHRva2VuOiAgICAgICAodGhlIHByb2R1Y2VkIHRlcm1pbmFsIHRva2VuLCBpZiBhbnkpXG4gICAgbGluZTogICAgICAgICh5eWxpbmVubylcbiAgfVxuICB3aGlsZSBwYXJzZXIgKGdyYW1tYXIpIGVycm9ycyB3aWxsIGFsc28gcHJvdmlkZSB0aGVzZSBtZW1iZXJzLCBpLmUuIHBhcnNlciBlcnJvcnMgZGVsaXZlciBhIHN1cGVyc2V0IG9mIGF0dHJpYnV0ZXM6IHtcbiAgICBsb2M6ICAgICAgICAgKHl5bGxvYylcbiAgICBleHBlY3RlZDogICAgKHN0cmluZyBkZXNjcmliaW5nIHRoZSBzZXQgb2YgZXhwZWN0ZWQgdG9rZW5zKVxuICAgIHJlY292ZXJhYmxlOiAoYm9vbGVhbjogVFJVRSB3aGVuIHRoZSBwYXJzZXIgaGFzIGEgZXJyb3IgcmVjb3ZlcnkgcnVsZSBhdmFpbGFibGUgZm9yIHRoaXMgcGFydGljdWxhciBlcnJvcilcbiAgfVxuKi9cbnZhciBwYXJzZXIgPSAoZnVuY3Rpb24oKXtcbnZhciBwYXJzZXIgPSB7dHJhY2U6IGZ1bmN0aW9uIHRyYWNlKCkgeyB9LFxueXk6IHt9LFxuc3ltYm9sc186IHtcImVycm9yXCI6MixcImV4cHJlc3Npb25zXCI6MyxcIlNcIjo0LFwiRU9GXCI6NSxcImVcIjo2LFwic3RtdFwiOjcsXCI9XCI6OCxcIiE9XCI6OSxcIjw9XCI6MTAsXCI8XCI6MTEsXCI+XCI6MTIsXCI+PVwiOjEzLFwiY3NsXCI6MTQsXCIsXCI6MTUsXCJ2ZWN0b3JcIjoxNixcIihcIjoxNyxcIilcIjoxOCxcIitcIjoxOSxcIi1cIjoyMCxcIipcIjoyMSxcIi9cIjoyMixcIlBPV0VSe1wiOjIzLFwifVwiOjI0LFwiX3tcIjoyNSxcIiFcIjoyNixcIl9TSU5HTEVcIjoyNyxcIlNRUlR7XCI6MjgsXCJGUkFDe1wiOjI5LFwie1wiOjMwLFwiXlNJTkdMRVwiOjMxLFwiaWRlbnRpZmllclwiOjMyLFwibnVtYmVyXCI6MzMsXCJJREVOVElGSUVSXCI6MzQsXCJMT05HSURFTlRJRklFUlwiOjM1LFwiREVDSU1BTFwiOjM2LFwiSU5URUdFUlwiOjM3LFwiJGFjY2VwdFwiOjAsXCIkZW5kXCI6MX0sXG50ZXJtaW5hbHNfOiB7MjpcImVycm9yXCIsNTpcIkVPRlwiLDg6XCI9XCIsOTpcIiE9XCIsMTA6XCI8PVwiLDExOlwiPFwiLDEyOlwiPlwiLDEzOlwiPj1cIiwxNTpcIixcIiwxNzpcIihcIiwxODpcIilcIiwxOTpcIitcIiwyMDpcIi1cIiwyMTpcIipcIiwyMjpcIi9cIiwyMzpcIlBPV0VSe1wiLDI0OlwifVwiLDI1OlwiX3tcIiwyNjpcIiFcIiwyNzpcIl9TSU5HTEVcIiwyODpcIlNRUlR7XCIsMjk6XCJGUkFDe1wiLDMwOlwie1wiLDMxOlwiXlNJTkdMRVwiLDM0OlwiSURFTlRJRklFUlwiLDM1OlwiTE9OR0lERU5USUZJRVJcIiwzNjpcIkRFQ0lNQUxcIiwzNzpcIklOVEVHRVJcIn0sXG5wcm9kdWN0aW9uc186IFswLFszLDJdLFs0LDFdLFs0LDFdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFs3LDNdLFsxNCwzXSxbMTQsM10sWzE2LDNdLFs2LDNdLFs2LDNdLFs2LDNdLFs2LDNdLFs2LDRdLFs2LDRdLFs2LDJdLFs2LDJdLFs2LDNdLFs2LDZdLFs2LDJdLFs2LDJdLFs2LDJdLFs2LDNdLFs2LDFdLFs2LDFdLFs2LDFdLFszMiwxXSxbMzIsMV0sWzMzLDFdLFszMywxXV0sXG5wZXJmb3JtQWN0aW9uOiBmdW5jdGlvbiBhbm9ueW1vdXMoeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB5eSwgeXlzdGF0ZSAvKiBhY3Rpb25bMV0gKi8sICQkIC8qIHZzdGFjayAqLywgXyQgLyogbHN0YWNrICovKSB7XG4vKiB0aGlzID09IHl5dmFsICovXG5cbnZhciAkMCA9ICQkLmxlbmd0aCAtIDE7XG5zd2l0Y2ggKHl5c3RhdGUpIHtcbmNhc2UgMTogcmV0dXJuICQkWyQwLTFdOyBcbmJyZWFrO1xuY2FzZSAyOnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAzOnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSA0OnRoaXMuJCA9IFsnPScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDU6dGhpcy4kID0gWychPScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDY6dGhpcy4kID0gWyc8PScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDc6dGhpcy4kID0gWyc8JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgODp0aGlzLiQgPSBbJz4nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA5OnRoaXMuJCA9IFsnPj0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMDp0aGlzLiQgPSBbJywuJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTE6dGhpcy4kID0gWycsJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTI6dGhpcy4kID0gJCRbJDAtMV07XG5icmVhaztcbmNhc2UgMTM6dGhpcy4kID0gWycrJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTQ6dGhpcy4kID0gWyctJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTU6dGhpcy4kID0gWycqJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTY6dGhpcy4kID0gWycvJywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTc6dGhpcy4kID0gWydeJywgJCRbJDAtM10sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAxODp0aGlzLiQgPSBbJ18nLCAkJFskMC0zXSwgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDE5OnRoaXMuJCA9IFsnIScsICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAyMDp0aGlzLiQgPSBbJ18nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyMTp0aGlzLiQgPSBbJ3NxcnQnLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjI6dGhpcy4kID0gWydmcmFjJywgJCRbJDAtNF0sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAyMzp0aGlzLiQgPSBbJ14nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyNDp0aGlzLiQgPSBbJ0AtJywgJCRbJDBdXVxuYnJlYWs7XG5jYXNlIDI1OnRoaXMuJCA9IFsnZGVmYXVsdCcsICQkWyQwLTFdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDI2OnRoaXMuJCA9ICQkWyQwLTFdXG5icmVhaztcbmNhc2UgMjc6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDI4OnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAyOTp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMzA6dGhpcy4kID0geXl0ZXh0O1xuYnJlYWs7XG5jYXNlIDMxOnRoaXMuJCA9IHl5dGV4dC5zdWJzdHJpbmcoMSk7XG5icmVhaztcbmNhc2UgMzI6dGhpcy4kID0ge3R5cGU6ICdOdW1iZXInLCBwcmltaXRpdmU6IHl5dGV4dH07XG5icmVhaztcbmNhc2UgMzM6dGhpcy4kID0ge3R5cGU6ICdOdW1iZXInLCBwcmltaXRpdmU6IHl5dGV4dH07XG5icmVhaztcbn1cbn0sXG50YWJsZTogW3szOjEsNDoyLDY6Myw3OjQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyODpbMSw1XSwyOTpbMSw2XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHsxOlszXX0sezU6WzEsMTZdfSx7NTpbMiwyXSw2OjI2LDg6WzEsMjddLDk6WzEsMjhdLDEwOlsxLDI5XSwxMTpbMSwzMF0sMTI6WzEsMzFdLDEzOlsxLDMyXSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsMl0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsM10sMjQ6WzIsM119LHs2OjMzLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NjozNCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezY6MzUsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyODpbMSw1XSwyOTpbMSw2XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjM2LDE0OjM3LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NTpbMiwyN10sODpbMiwyN10sOTpbMiwyN10sMTA6WzIsMjddLDExOlsyLDI3XSwxMjpbMiwyN10sMTM6WzIsMjddLDE1OlsyLDI3XSwxNzpbMiwyN10sMTg6WzIsMjddLDE5OlsyLDI3XSwyMDpbMiwyN10sMjE6WzIsMjddLDIyOlsyLDI3XSwyMzpbMiwyN10sMjQ6WzIsMjddLDI1OlsyLDI3XSwyNjpbMiwyN10sMjc6WzIsMjddLDI4OlsyLDI3XSwyOTpbMiwyN10sMzE6WzIsMjddLDM0OlsyLDI3XSwzNTpbMiwyN10sMzY6WzIsMjddLDM3OlsyLDI3XX0sezU6WzIsMjhdLDg6WzIsMjhdLDk6WzIsMjhdLDEwOlsyLDI4XSwxMTpbMiwyOF0sMTI6WzIsMjhdLDEzOlsyLDI4XSwxNTpbMiwyOF0sMTc6WzIsMjhdLDE4OlsyLDI4XSwxOTpbMiwyOF0sMjA6WzIsMjhdLDIxOlsyLDI4XSwyMjpbMiwyOF0sMjM6WzIsMjhdLDI0OlsyLDI4XSwyNTpbMiwyOF0sMjY6WzIsMjhdLDI3OlsyLDI4XSwyODpbMiwyOF0sMjk6WzIsMjhdLDMxOlsyLDI4XSwzNDpbMiwyOF0sMzU6WzIsMjhdLDM2OlsyLDI4XSwzNzpbMiwyOF19LHs1OlsyLDI5XSw4OlsyLDI5XSw5OlsyLDI5XSwxMDpbMiwyOV0sMTE6WzIsMjldLDEyOlsyLDI5XSwxMzpbMiwyOV0sMTU6WzIsMjldLDE3OlsyLDI5XSwxODpbMiwyOV0sMTk6WzIsMjldLDIwOlsyLDI5XSwyMTpbMiwyOV0sMjI6WzIsMjldLDIzOlsyLDI5XSwyNDpbMiwyOV0sMjU6WzIsMjldLDI2OlsyLDI5XSwyNzpbMiwyOV0sMjg6WzIsMjldLDI5OlsyLDI5XSwzMTpbMiwyOV0sMzQ6WzIsMjldLDM1OlsyLDI5XSwzNjpbMiwyOV0sMzc6WzIsMjldfSx7NTpbMiwzMF0sODpbMiwzMF0sOTpbMiwzMF0sMTA6WzIsMzBdLDExOlsyLDMwXSwxMjpbMiwzMF0sMTM6WzIsMzBdLDE1OlsyLDMwXSwxNzpbMiwzMF0sMTg6WzIsMzBdLDE5OlsyLDMwXSwyMDpbMiwzMF0sMjE6WzIsMzBdLDIyOlsyLDMwXSwyMzpbMiwzMF0sMjQ6WzIsMzBdLDI1OlsyLDMwXSwyNjpbMiwzMF0sMjc6WzIsMzBdLDI4OlsyLDMwXSwyOTpbMiwzMF0sMzE6WzIsMzBdLDM0OlsyLDMwXSwzNTpbMiwzMF0sMzY6WzIsMzBdLDM3OlsyLDMwXX0sezU6WzIsMzFdLDg6WzIsMzFdLDk6WzIsMzFdLDEwOlsyLDMxXSwxMTpbMiwzMV0sMTI6WzIsMzFdLDEzOlsyLDMxXSwxNTpbMiwzMV0sMTc6WzIsMzFdLDE4OlsyLDMxXSwxOTpbMiwzMV0sMjA6WzIsMzFdLDIxOlsyLDMxXSwyMjpbMiwzMV0sMjM6WzIsMzFdLDI0OlsyLDMxXSwyNTpbMiwzMV0sMjY6WzIsMzFdLDI3OlsyLDMxXSwyODpbMiwzMV0sMjk6WzIsMzFdLDMxOlsyLDMxXSwzNDpbMiwzMV0sMzU6WzIsMzFdLDM2OlsyLDMxXSwzNzpbMiwzMV19LHs1OlsyLDMyXSw4OlsyLDMyXSw5OlsyLDMyXSwxMDpbMiwzMl0sMTE6WzIsMzJdLDEyOlsyLDMyXSwxMzpbMiwzMl0sMTU6WzIsMzJdLDE3OlsyLDMyXSwxODpbMiwzMl0sMTk6WzIsMzJdLDIwOlsyLDMyXSwyMTpbMiwzMl0sMjI6WzIsMzJdLDIzOlsyLDMyXSwyNDpbMiwzMl0sMjU6WzIsMzJdLDI2OlsyLDMyXSwyNzpbMiwzMl0sMjg6WzIsMzJdLDI5OlsyLDMyXSwzMTpbMiwzMl0sMzQ6WzIsMzJdLDM1OlsyLDMyXSwzNjpbMiwzMl0sMzc6WzIsMzJdfSx7NTpbMiwzM10sODpbMiwzM10sOTpbMiwzM10sMTA6WzIsMzNdLDExOlsyLDMzXSwxMjpbMiwzM10sMTM6WzIsMzNdLDE1OlsyLDMzXSwxNzpbMiwzM10sMTg6WzIsMzNdLDE5OlsyLDMzXSwyMDpbMiwzM10sMjE6WzIsMzNdLDIyOlsyLDMzXSwyMzpbMiwzM10sMjQ6WzIsMzNdLDI1OlsyLDMzXSwyNjpbMiwzM10sMjc6WzIsMzNdLDI4OlsyLDMzXSwyOTpbMiwzM10sMzE6WzIsMzNdLDM0OlsyLDMzXSwzNTpbMiwzM10sMzY6WzIsMzNdLDM3OlsyLDMzXX0sezE6WzIsMV19LHs2OjM4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NjozOSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezY6NDAsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyODpbMSw1XSwyOTpbMSw2XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjQxLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7Njo0MiwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezQ6NDMsNjozLDc6NCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsMTldLDg6WzIsMTldLDk6WzIsMTldLDEwOlsyLDE5XSwxMTpbMiwxOV0sMTI6WzIsMTldLDEzOlsyLDE5XSwxNTpbMiwxOV0sMTc6WzIsMTldLDE4OlsyLDE5XSwxOTpbMiwxOV0sMjA6WzIsMTldLDIxOlsyLDE5XSwyMjpbMiwxOV0sMjM6WzIsMTldLDI0OlsyLDE5XSwyNTpbMiwxOV0sMjY6WzIsMTldLDI3OlsyLDE5XSwyODpbMiwxOV0sMjk6WzIsMTldLDMxOlsyLDE5XSwzNDpbMiwxOV0sMzU6WzIsMTldLDM2OlsyLDE5XSwzNzpbMiwxOV19LHs1OlsyLDIwXSw4OlsyLDIwXSw5OlsyLDIwXSwxMDpbMiwyMF0sMTE6WzIsMjBdLDEyOlsyLDIwXSwxMzpbMiwyMF0sMTU6WzIsMjBdLDE3OlsyLDIwXSwxODpbMiwyMF0sMTk6WzIsMjBdLDIwOlsyLDIwXSwyMTpbMiwyMF0sMjI6WzIsMjBdLDIzOlsyLDIwXSwyNDpbMiwyMF0sMjU6WzIsMjBdLDI2OlsyLDIwXSwyNzpbMiwyMF0sMjg6WzIsMjBdLDI5OlsyLDIwXSwzMTpbMiwyMF0sMzQ6WzIsMjBdLDM1OlsyLDIwXSwzNjpbMiwyMF0sMzc6WzIsMjBdfSx7NTpbMiwyM10sODpbMiwyM10sOTpbMiwyM10sMTA6WzIsMjNdLDExOlsyLDIzXSwxMjpbMiwyM10sMTM6WzIsMjNdLDE1OlsyLDIzXSwxNzpbMiwyM10sMTg6WzIsMjNdLDE5OlsyLDIzXSwyMDpbMiwyM10sMjE6WzIsMjNdLDIyOlsyLDIzXSwyMzpbMiwyM10sMjQ6WzIsMjNdLDI1OlsyLDIzXSwyNjpbMiwyM10sMjc6WzIsMjNdLDI4OlsyLDIzXSwyOTpbMiwyM10sMzE6WzIsMjNdLDM0OlsyLDIzXSwzNTpbMiwyM10sMzY6WzIsMjNdLDM3OlsyLDIzXX0sezU6WzIsMjVdLDY6MjYsODpbMiwyNV0sOTpbMiwyNV0sMTA6WzIsMjVdLDExOlsyLDI1XSwxMjpbMiwyNV0sMTM6WzIsMjVdLDE1OlsyLDI1XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDI1XSwxOTpbMiwyNV0sMjA6WzIsMjVdLDIxOlsyLDI1XSwyMjpbMiwyNV0sMjM6WzEsMjFdLDI0OlsyLDI1XSwyNTpbMiwyNV0sMjY6WzIsMjVdLDI3OlsyLDI1XSwyODpbMiwyNV0sMjk6WzIsMjVdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjQ0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7Njo0NSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezY6NDYsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyODpbMSw1XSwyOTpbMSw2XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjQ3LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7Njo0OCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezY6NDksMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyODpbMSw1XSwyOTpbMSw2XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjI2LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSw1MF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezY6MjYsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDUxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSw1XSwyOTpbMSw2XSwzMTpbMSwyNV0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NTpbMiwyNF0sNjoyNiw4OlsyLDI0XSw5OlsyLDI0XSwxMDpbMiwyNF0sMTE6WzIsMjRdLDEyOlsyLDI0XSwxMzpbMiwyNF0sMTU6WzIsMjRdLDE2OjksMTc6WzEsOF0sMTg6WzIsMjRdLDE5OlsyLDI0XSwyMDpbMiwyNF0sMjE6WzIsMjRdLDIyOlsyLDI0XSwyMzpbMSwyMV0sMjQ6WzIsMjRdLDI1OlsyLDI0XSwyNjpbMSwyM10sMjc6WzIsMjRdLDI4OlsxLDVdLDI5OlsxLDZdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjI2LDE1OlsxLDUzXSwxNjo5LDE3OlsxLDhdLDE4OlsxLDUyXSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDVdLDI5OlsxLDZdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHsxNTpbMSw1NV0sMTg6WzEsNTRdfSx7NTpbMiwxM10sNjoyNiw4OlsyLDEzXSw5OlsyLDEzXSwxMDpbMiwxM10sMTE6WzIsMTNdLDEyOlsyLDEzXSwxMzpbMiwxM10sMTU6WzIsMTNdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTNdLDE5OlsyLDEzXSwyMDpbMiwxM10sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsMTNdLDI1OlsyLDEzXSwyNjpbMSwyM10sMjc6WzIsMTNdLDI4OlsxLDVdLDI5OlsxLDZdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs1OlsyLDE0XSw2OjI2LDg6WzIsMTRdLDk6WzIsMTRdLDEwOlsyLDE0XSwxMTpbMiwxNF0sMTI6WzIsMTRdLDEzOlsyLDE0XSwxNTpbMiwxNF0sMTY6OSwxNzpbMSw4XSwxODpbMiwxNF0sMTk6WzIsMTRdLDIwOlsyLDE0XSwyMTpbMiwyNF0sMjI6WzIsMjRdLDIzOlsxLDIxXSwyNDpbMiwxNF0sMjU6WzIsMTRdLDI2OlsxLDIzXSwyNzpbMiwxNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsMTVdLDY6MjYsODpbMiwxNV0sOTpbMiwxNV0sMTA6WzIsMTVdLDExOlsyLDE1XSwxMjpbMiwxNV0sMTM6WzIsMTVdLDE1OlsyLDE1XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE1XSwxOTpbMiwxNV0sMjA6WzIsMTVdLDIxOlsyLDE1XSwyMjpbMiwxNV0sMjM6WzEsMjFdLDI0OlsyLDE1XSwyNTpbMiwxNV0sMjY6WzEsMjNdLDI3OlsyLDE1XSwyODpbMSw1XSwyOTpbMSw2XSwzMTpbMSwyNV0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NTpbMiwxNl0sNjoyNiw4OlsyLDE2XSw5OlsyLDE2XSwxMDpbMiwxNl0sMTE6WzIsMTZdLDEyOlsyLDE2XSwxMzpbMiwxNl0sMTU6WzIsMTZdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTZdLDE5OlsyLDE2XSwyMDpbMiwxNl0sMjE6WzIsMTZdLDIyOlsyLDE2XSwyMzpbMSwyMV0sMjQ6WzIsMTZdLDI1OlsyLDE2XSwyNjpbMSwyM10sMjc6WzIsMTZdLDI4OlsxLDVdLDI5OlsxLDZdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs2OjI2LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSw1Nl0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezI0OlsxLDU3XX0sezU6WzIsNF0sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsNV0sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsNl0sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNl0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsN10sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsN10sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsOF0sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsOF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsOV0sNjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsOV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSwyNF0sMjg6WzEsNV0sMjk6WzEsNl0sMzE6WzEsMjVdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsMjFdLDg6WzIsMjFdLDk6WzIsMjFdLDEwOlsyLDIxXSwxMTpbMiwyMV0sMTI6WzIsMjFdLDEzOlsyLDIxXSwxNTpbMiwyMV0sMTc6WzIsMjFdLDE4OlsyLDIxXSwxOTpbMiwyMV0sMjA6WzIsMjFdLDIxOlsyLDIxXSwyMjpbMiwyMV0sMjM6WzIsMjFdLDI0OlsyLDIxXSwyNTpbMiwyMV0sMjY6WzIsMjFdLDI3OlsyLDIxXSwyODpbMiwyMV0sMjk6WzIsMjFdLDMxOlsyLDIxXSwzNDpbMiwyMV0sMzU6WzIsMjFdLDM2OlsyLDIxXSwzNzpbMiwyMV19LHszMDpbMSw1OF19LHs1OlsyLDI2XSw4OlsyLDI2XSw5OlsyLDI2XSwxMDpbMiwyNl0sMTE6WzIsMjZdLDEyOlsyLDI2XSwxMzpbMiwyNl0sMTU6WzIsMjZdLDE3OlsyLDI2XSwxODpbMiwyNl0sMTk6WzIsMjZdLDIwOlsyLDI2XSwyMTpbMiwyNl0sMjI6WzIsMjZdLDIzOlsyLDI2XSwyNDpbMiwyNl0sMjU6WzIsMjZdLDI2OlsyLDI2XSwyNzpbMiwyNl0sMjg6WzIsMjZdLDI5OlsyLDI2XSwzMTpbMiwyNl0sMzQ6WzIsMjZdLDM1OlsyLDI2XSwzNjpbMiwyNl0sMzc6WzIsMjZdfSx7Njo1OSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI4OlsxLDVdLDI5OlsxLDZdLDMyOjEwLDMzOjExLDM0OlsxLDEyXSwzNTpbMSwxM10sMzY6WzEsMTRdLDM3OlsxLDE1XX0sezU6WzIsMTJdLDg6WzIsMTJdLDk6WzIsMTJdLDEwOlsyLDEyXSwxMTpbMiwxMl0sMTI6WzIsMTJdLDEzOlsyLDEyXSwxNTpbMiwxMl0sMTc6WzIsMTJdLDE4OlsyLDEyXSwxOTpbMiwxMl0sMjA6WzIsMTJdLDIxOlsyLDEyXSwyMjpbMiwxMl0sMjM6WzIsMTJdLDI0OlsyLDEyXSwyNTpbMiwxMl0sMjY6WzIsMTJdLDI3OlsyLDEyXSwyODpbMiwxMl0sMjk6WzIsMTJdLDMxOlsyLDEyXSwzNDpbMiwxMl0sMzU6WzIsMTJdLDM2OlsyLDEyXSwzNzpbMiwxMl19LHs2OjYwLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NTpbMiwxN10sODpbMiwxN10sOTpbMiwxN10sMTA6WzIsMTddLDExOlsyLDE3XSwxMjpbMiwxN10sMTM6WzIsMTddLDE1OlsyLDE3XSwxNzpbMiwxN10sMTg6WzIsMTddLDE5OlsyLDE3XSwyMDpbMiwxN10sMjE6WzIsMTddLDIyOlsyLDE3XSwyMzpbMiwxN10sMjQ6WzIsMTddLDI1OlsyLDE3XSwyNjpbMiwxN10sMjc6WzIsMTddLDI4OlsyLDE3XSwyOTpbMiwxN10sMzE6WzIsMTddLDM0OlsyLDE3XSwzNTpbMiwxN10sMzY6WzIsMTddLDM3OlsyLDE3XX0sezU6WzIsMThdLDg6WzIsMThdLDk6WzIsMThdLDEwOlsyLDE4XSwxMTpbMiwxOF0sMTI6WzIsMThdLDEzOlsyLDE4XSwxNTpbMiwxOF0sMTc6WzIsMThdLDE4OlsyLDE4XSwxOTpbMiwxOF0sMjA6WzIsMThdLDIxOlsyLDE4XSwyMjpbMiwxOF0sMjM6WzIsMThdLDI0OlsyLDE4XSwyNTpbMiwxOF0sMjY6WzIsMThdLDI3OlsyLDE4XSwyODpbMiwxOF0sMjk6WzIsMThdLDMxOlsyLDE4XSwzNDpbMiwxOF0sMzU6WzIsMThdLDM2OlsyLDE4XSwzNzpbMiwxOF19LHs2OjYxLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjg6WzEsNV0sMjk6WzEsNl0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NjoyNiwxNTpbMiwxMV0sMTY6OSwxNzpbMSw4XSwxODpbMiwxMV0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSw1XSwyOTpbMSw2XSwzMTpbMSwyNV0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NjoyNiwxNTpbMiwxMF0sMTY6OSwxNzpbMSw4XSwxODpbMiwxMF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDI0XSwyODpbMSw1XSwyOTpbMSw2XSwzMTpbMSwyNV0sMzI6MTAsMzM6MTEsMzQ6WzEsMTJdLDM1OlsxLDEzXSwzNjpbMSwxNF0sMzc6WzEsMTVdfSx7NjoyNiwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNjJdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsMjRdLDI4OlsxLDVdLDI5OlsxLDZdLDMxOlsxLDI1XSwzMjoxMCwzMzoxMSwzNDpbMSwxMl0sMzU6WzEsMTNdLDM2OlsxLDE0XSwzNzpbMSwxNV19LHs1OlsyLDIyXSw4OlsyLDIyXSw5OlsyLDIyXSwxMDpbMiwyMl0sMTE6WzIsMjJdLDEyOlsyLDIyXSwxMzpbMiwyMl0sMTU6WzIsMjJdLDE3OlsyLDIyXSwxODpbMiwyMl0sMTk6WzIsMjJdLDIwOlsyLDIyXSwyMTpbMiwyMl0sMjI6WzIsMjJdLDIzOlsyLDIyXSwyNDpbMiwyMl0sMjU6WzIsMjJdLDI2OlsyLDIyXSwyNzpbMiwyMl0sMjg6WzIsMjJdLDI5OlsyLDIyXSwzMTpbMiwyMl0sMzQ6WzIsMjJdLDM1OlsyLDIyXSwzNjpbMiwyMl0sMzc6WzIsMjJdfV0sXG5kZWZhdWx0QWN0aW9uczogezE2OlsyLDFdfSxcbnBhcnNlRXJyb3I6IGZ1bmN0aW9uIHBhcnNlRXJyb3Ioc3RyLCBoYXNoKSB7XG4gICAgaWYgKGhhc2gucmVjb3ZlcmFibGUpIHtcbiAgICAgICAgdGhpcy50cmFjZShzdHIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xuICAgIH1cbn0sXG5wYXJzZTogZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsIHN0YWNrID0gWzBdLCB2c3RhY2sgPSBbbnVsbF0sIGxzdGFjayA9IFtdLCB0YWJsZSA9IHRoaXMudGFibGUsIHl5dGV4dCA9ICcnLCB5eWxpbmVubyA9IDAsIHl5bGVuZyA9IDAsIHJlY292ZXJpbmcgPSAwLCBURVJST1IgPSAyLCBFT0YgPSAxO1xuICAgIHRoaXMubGV4ZXIuc2V0SW5wdXQoaW5wdXQpO1xuICAgIHRoaXMubGV4ZXIueXkgPSB0aGlzLnl5O1xuICAgIHRoaXMueXkubGV4ZXIgPSB0aGlzLmxleGVyO1xuICAgIHRoaXMueXkucGFyc2VyID0gdGhpcztcbiAgICBpZiAodHlwZW9mIHRoaXMubGV4ZXIueXlsbG9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMubGV4ZXIueXlsbG9jID0ge307XG4gICAgfVxuICAgIHZhciB5eWxvYyA9IHRoaXMubGV4ZXIueXlsbG9jO1xuICAgIGxzdGFjay5wdXNoKHl5bG9jKTtcbiAgICB2YXIgcmFuZ2VzID0gdGhpcy5sZXhlci5vcHRpb25zICYmIHRoaXMubGV4ZXIub3B0aW9ucy5yYW5nZXM7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnl5LnBhcnNlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gdGhpcy55eS5wYXJzZUVycm9yO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGFyc2VFcnJvciA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5wYXJzZUVycm9yO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb3BTdGFjayhuKSB7XG4gICAgICAgIHN0YWNrLmxlbmd0aCA9IHN0YWNrLmxlbmd0aCAtIDIgKiBuO1xuICAgICAgICB2c3RhY2subGVuZ3RoID0gdnN0YWNrLmxlbmd0aCAtIG47XG4gICAgICAgIGxzdGFjay5sZW5ndGggPSBsc3RhY2subGVuZ3RoIC0gbjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgIHRva2VuID0gc2VsZi5sZXhlci5sZXgoKSB8fCBFT0Y7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHNlbGYuc3ltYm9sc19bdG9rZW5dIHx8IHRva2VuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9XG4gICAgdmFyIHN5bWJvbCwgcHJlRXJyb3JTeW1ib2wsIHN0YXRlLCBhY3Rpb24sIGEsIHIsIHl5dmFsID0ge30sIHAsIGxlbiwgbmV3U3RhdGUsIGV4cGVjdGVkO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHN0YXRlID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXSkge1xuICAgICAgICAgICAgYWN0aW9uID0gdGhpcy5kZWZhdWx0QWN0aW9uc1tzdGF0ZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3ltYm9sID09PSBudWxsIHx8IHR5cGVvZiBzeW1ib2wgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSBsZXgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjdGlvbiA9IHRhYmxlW3N0YXRlXSAmJiB0YWJsZVtzdGF0ZV1bc3ltYm9sXTtcbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gJ3VuZGVmaW5lZCcgfHwgIWFjdGlvbi5sZW5ndGggfHwgIWFjdGlvblswXSkge1xuICAgICAgICAgICAgICAgIHZhciBlcnJTdHIgPSAnJztcbiAgICAgICAgICAgICAgICBleHBlY3RlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAocCBpbiB0YWJsZVtzdGF0ZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGVybWluYWxzX1twXSAmJiBwID4gVEVSUk9SKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZC5wdXNoKCdcXCcnICsgdGhpcy50ZXJtaW5hbHNfW3BdICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxleGVyLnNob3dQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOlxcbicgKyB0aGlzLmxleGVyLnNob3dQb3NpdGlvbigpICsgJ1xcbkV4cGVjdGluZyAnICsgZXhwZWN0ZWQuam9pbignLCAnKSArICcsIGdvdCBcXCcnICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyAnXFwnJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOiBVbmV4cGVjdGVkICcgKyAoc3ltYm9sID09IEVPRiA/ICdlbmQgb2YgaW5wdXQnIDogJ1xcJycgKyAodGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sKSArICdcXCcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUVycm9yKGVyclN0ciwge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGlzLmxleGVyLm1hdGNoLFxuICAgICAgICAgICAgICAgICAgICB0b2tlbjogdGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxleGVyLnl5bGluZW5vLFxuICAgICAgICAgICAgICAgICAgICBsb2M6IHl5bG9jLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvblswXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFjdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIEVycm9yOiBtdWx0aXBsZSBhY3Rpb25zIHBvc3NpYmxlIGF0IHN0YXRlOiAnICsgc3RhdGUgKyAnLCB0b2tlbjogJyArIHN5bWJvbCk7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChhY3Rpb25bMF0pIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgc3RhY2sucHVzaChzeW1ib2wpO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2godGhpcy5sZXhlci55eXRleHQpO1xuICAgICAgICAgICAgbHN0YWNrLnB1c2godGhpcy5sZXhlci55eWxsb2MpO1xuICAgICAgICAgICAgc3RhY2sucHVzaChhY3Rpb25bMV0pO1xuICAgICAgICAgICAgc3ltYm9sID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghcHJlRXJyb3JTeW1ib2wpIHtcbiAgICAgICAgICAgICAgICB5eWxlbmcgPSB0aGlzLmxleGVyLnl5bGVuZztcbiAgICAgICAgICAgICAgICB5eXRleHQgPSB0aGlzLmxleGVyLnl5dGV4dDtcbiAgICAgICAgICAgICAgICB5eWxpbmVubyA9IHRoaXMubGV4ZXIueXlsaW5lbm87XG4gICAgICAgICAgICAgICAgeXlsb2MgPSB0aGlzLmxleGVyLnl5bGxvYztcbiAgICAgICAgICAgICAgICBpZiAocmVjb3ZlcmluZyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb3ZlcmluZy0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gcHJlRXJyb3JTeW1ib2w7XG4gICAgICAgICAgICAgICAgcHJlRXJyb3JTeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGxlbiA9IHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMV07XG4gICAgICAgICAgICB5eXZhbC4kID0gdnN0YWNrW3ZzdGFjay5sZW5ndGggLSBsZW5dO1xuICAgICAgICAgICAgeXl2YWwuXyQgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9saW5lLFxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB5eXZhbC5fJC5yYW5nZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5yYW5nZVswXSxcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5yYW5nZVsxXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByID0gdGhpcy5wZXJmb3JtQWN0aW9uLmNhbGwoeXl2YWwsIHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgdGhpcy55eSwgYWN0aW9uWzFdLCB2c3RhY2ssIGxzdGFjayk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGVuKSB7XG4gICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5zbGljZSgwLCAtMSAqIGxlbiAqIDIpO1xuICAgICAgICAgICAgICAgIHZzdGFjayA9IHZzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICAgICAgbHN0YWNrID0gbHN0YWNrLnNsaWNlKDAsIC0xICogbGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YWNrLnB1c2godGhpcy5wcm9kdWN0aW9uc19bYWN0aW9uWzFdXVswXSk7XG4gICAgICAgICAgICB2c3RhY2sucHVzaCh5eXZhbC4kKTtcbiAgICAgICAgICAgIGxzdGFjay5wdXNoKHl5dmFsLl8kKTtcbiAgICAgICAgICAgIG5ld1N0YXRlID0gdGFibGVbc3RhY2tbc3RhY2subGVuZ3RoIC0gMl1dW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXTtcbiAgICAgICAgICAgIHN0YWNrLnB1c2gobmV3U3RhdGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufX07XG51bmRlZmluZWQvKiBnZW5lcmF0ZWQgYnkgamlzb24tbGV4IDAuMi4xICovXG52YXIgbGV4ZXIgPSAoZnVuY3Rpb24oKXtcbnZhciBsZXhlciA9IHtcblxuRU9GOjEsXG5cbnBhcnNlRXJyb3I6ZnVuY3Rpb24gcGFyc2VFcnJvcihzdHIsIGhhc2gpIHtcbiAgICAgICAgaWYgKHRoaXMueXkucGFyc2VyKSB7XG4gICAgICAgICAgICB0aGlzLnl5LnBhcnNlci5wYXJzZUVycm9yKHN0ciwgaGFzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3RyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHJlc2V0cyB0aGUgbGV4ZXIsIHNldHMgbmV3IGlucHV0XG5zZXRJbnB1dDpmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcbiAgICAgICAgdGhpcy5fbW9yZSA9IHRoaXMuX2JhY2t0cmFjayA9IHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnl5bGluZW5vID0gdGhpcy55eWxlbmcgPSAwO1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjayA9IFsnSU5JVElBTCddO1xuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IDEsXG4gICAgICAgICAgICBmaXJzdF9jb2x1bW46IDAsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IDEsXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogMFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbMCwwXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIGNvbnN1bWVzIGFuZCByZXR1cm5zIG9uZSBjaGFyIGZyb20gdGhlIGlucHV0XG5pbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaCA9IHRoaXMuX2lucHV0WzBdO1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBjaDtcbiAgICAgICAgdGhpcy55eWxlbmcrKztcbiAgICAgICAgdGhpcy5vZmZzZXQrKztcbiAgICAgICAgdGhpcy5tYXRjaCArPSBjaDtcbiAgICAgICAgdGhpcy5tYXRjaGVkICs9IGNoO1xuICAgICAgICB2YXIgbGluZXMgPSBjaC5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubysrO1xuICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9saW5lKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbisrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZVsxXSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSB0aGlzLl9pbnB1dC5zbGljZSgxKTtcbiAgICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG5cbi8vIHVuc2hpZnRzIG9uZSBjaGFyIChvciBhIHN0cmluZykgaW50byB0aGUgaW5wdXRcbnVucHV0OmZ1bmN0aW9uIChjaCkge1xuICAgICAgICB2YXIgbGVuID0gY2gubGVuZ3RoO1xuICAgICAgICB2YXIgbGluZXMgPSBjaC5zcGxpdCgvKD86XFxyXFxuP3xcXG4pL2cpO1xuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gY2ggKyB0aGlzLl9pbnB1dDtcbiAgICAgICAgdGhpcy55eXRleHQgPSB0aGlzLnl5dGV4dC5zdWJzdHIoMCwgdGhpcy55eXRleHQubGVuZ3RoIC0gbGVuIC0gMSk7XG4gICAgICAgIC8vdGhpcy55eWxlbmcgLT0gbGVuO1xuICAgICAgICB0aGlzLm9mZnNldCAtPSBsZW47XG4gICAgICAgIHZhciBvbGRMaW5lcyA9IHRoaXMubWF0Y2guc3BsaXQoLyg/Olxcclxcbj98XFxuKS9nKTtcbiAgICAgICAgdGhpcy5tYXRjaCA9IHRoaXMubWF0Y2guc3Vic3RyKDAsIHRoaXMubWF0Y2gubGVuZ3RoIC0gMSk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2hlZC5zdWJzdHIoMCwgdGhpcy5tYXRjaGVkLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vIC09IGxpbmVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHIgPSB0aGlzLnl5bGxvYy5yYW5nZTtcblxuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogbGluZXMgP1xuICAgICAgICAgICAgICAgIChsaW5lcy5sZW5ndGggPT09IG9sZExpbmVzLmxlbmd0aCA/IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiA6IDApXG4gICAgICAgICAgICAgICAgICsgb2xkTGluZXNbb2xkTGluZXMubGVuZ3RoIC0gbGluZXMubGVuZ3RoXS5sZW5ndGggLSBsaW5lc1swXS5sZW5ndGggOlxuICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4gLSBsZW5cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbclswXSwgclswXSArIHRoaXMueXlsZW5nIC0gbGVuXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIGNhY2hlcyBtYXRjaGVkIHRleHQgYW5kIGFwcGVuZHMgaXQgb24gbmV4dCBhY3Rpb25cbm1vcmU6ZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb3JlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIHNpZ25hbHMgdGhlIGxleGVyIHRoYXQgdGhpcyBydWxlIGZhaWxzIHRvIG1hdGNoIHRoZSBpbnB1dCwgc28gdGhlIG5leHQgbWF0Y2hpbmcgcnVsZSAocmVnZXgpIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbnJlamVjdDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrdHJhY2sgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcgKyAodGhpcy55eWxpbmVubyArIDEpICsgJy4gWW91IGNhbiBvbmx5IGludm9rZSByZWplY3QoKSBpbiB0aGUgbGV4ZXIgd2hlbiB0aGUgbGV4ZXIgaXMgb2YgdGhlIGJhY2t0cmFja2luZyBwZXJzdWFzaW9uIChvcHRpb25zLmJhY2t0cmFja19sZXhlciA9IHRydWUpLlxcbicgKyB0aGlzLnNob3dQb3NpdGlvbigpLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgICB0b2tlbjogbnVsbCxcbiAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLnl5bGluZW5vXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIHJldGFpbiBmaXJzdCBuIGNoYXJhY3RlcnMgb2YgdGhlIG1hdGNoXG5sZXNzOmZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHRoaXMudW5wdXQodGhpcy5tYXRjaC5zbGljZShuKSk7XG4gICAgfSxcblxuLy8gZGlzcGxheXMgYWxyZWFkeSBtYXRjaGVkIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xucGFzdElucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhc3QgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSB0aGlzLm1hdGNoLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiAocGFzdC5sZW5ndGggPiAyMCA/ICcuLi4nOicnKSArIHBhc3Quc3Vic3RyKC0yMCkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHVwY29taW5nIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xudXBjb21pbmdJbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdGhpcy5tYXRjaDtcbiAgICAgICAgaWYgKG5leHQubGVuZ3RoIDwgMjApIHtcbiAgICAgICAgICAgIG5leHQgKz0gdGhpcy5faW5wdXQuc3Vic3RyKDAsIDIwLW5leHQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG5leHQuc3Vic3RyKDAsMjApICsgKG5leHQubGVuZ3RoID4gMjAgPyAnLi4uJyA6ICcnKSkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHRoZSBjaGFyYWN0ZXIgcG9zaXRpb24gd2hlcmUgdGhlIGxleGluZyBlcnJvciBvY2N1cnJlZCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnNob3dQb3NpdGlvbjpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcmUgPSB0aGlzLnBhc3RJbnB1dCgpO1xuICAgICAgICB2YXIgYyA9IG5ldyBBcnJheShwcmUubGVuZ3RoICsgMSkuam9pbihcIi1cIik7XG4gICAgICAgIHJldHVybiBwcmUgKyB0aGlzLnVwY29taW5nSW5wdXQoKSArIFwiXFxuXCIgKyBjICsgXCJeXCI7XG4gICAgfSxcblxuLy8gdGVzdCB0aGUgbGV4ZWQgdG9rZW46IHJldHVybiBGQUxTRSB3aGVuIG5vdCBhIG1hdGNoLCBvdGhlcndpc2UgcmV0dXJuIHRva2VuXG50ZXN0X21hdGNoOmZ1bmN0aW9uIChtYXRjaCwgaW5kZXhlZF9ydWxlKSB7XG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIGxpbmVzLFxuICAgICAgICAgICAgYmFja3VwO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAvLyBzYXZlIGNvbnRleHRcbiAgICAgICAgICAgIGJhY2t1cCA9IHtcbiAgICAgICAgICAgICAgICB5eWxpbmVubzogdGhpcy55eWxpbmVubyxcbiAgICAgICAgICAgICAgICB5eWxsb2M6IHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MuZmlyc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLmxhc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeXl0ZXh0OiB0aGlzLnl5dGV4dCxcbiAgICAgICAgICAgICAgICBtYXRjaDogdGhpcy5tYXRjaCxcbiAgICAgICAgICAgICAgICBtYXRjaGVzOiB0aGlzLm1hdGNoZXMsXG4gICAgICAgICAgICAgICAgbWF0Y2hlZDogdGhpcy5tYXRjaGVkLFxuICAgICAgICAgICAgICAgIHl5bGVuZzogdGhpcy55eWxlbmcsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiB0aGlzLm9mZnNldCxcbiAgICAgICAgICAgICAgICBfbW9yZTogdGhpcy5fbW9yZSxcbiAgICAgICAgICAgICAgICBfaW5wdXQ6IHRoaXMuX2lucHV0LFxuICAgICAgICAgICAgICAgIHl5OiB0aGlzLnl5LFxuICAgICAgICAgICAgICAgIGNvbmRpdGlvblN0YWNrOiB0aGlzLmNvbmRpdGlvblN0YWNrLnNsaWNlKDApLFxuICAgICAgICAgICAgICAgIGRvbmU6IHRoaXMuZG9uZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgYmFja3VwLnl5bGxvYy5yYW5nZSA9IHRoaXMueXlsbG9jLnJhbmdlLnNsaWNlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGluZXMgPSBtYXRjaFswXS5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubyArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5sYXN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbixcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiBsaW5lcyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoIC0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubWF0Y2goL1xccj9cXG4/LylbMF0ubGVuZ3RoIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbiArIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaGVzID0gbWF0Y2g7XG4gICAgICAgIHRoaXMueXlsZW5nID0gdGhpcy55eXRleHQubGVuZ3RoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbdGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICs9IHRoaXMueXlsZW5nXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tb3JlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2JhY2t0cmFjayA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IHRoaXMuX2lucHV0LnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSBtYXRjaFswXTtcbiAgICAgICAgdG9rZW4gPSB0aGlzLnBlcmZvcm1BY3Rpb24uY2FsbCh0aGlzLCB0aGlzLnl5LCB0aGlzLCBpbmRleGVkX3J1bGUsIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSk7XG4gICAgICAgIGlmICh0aGlzLmRvbmUgJiYgdGhpcy5faW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JhY2t0cmFjaykge1xuICAgICAgICAgICAgLy8gcmVjb3ZlciBjb250ZXh0XG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIGJhY2t1cCkge1xuICAgICAgICAgICAgICAgIHRoaXNba10gPSBiYWNrdXBba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyB0aGUgbmV4dCBydWxlIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuLy8gcmV0dXJuIG5leHQgbWF0Y2ggaW4gaW5wdXRcbm5leHQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgdGVtcE1hdGNoLFxuICAgICAgICAgICAgaW5kZXg7XG4gICAgICAgIGlmICghdGhpcy5fbW9yZSkge1xuICAgICAgICAgICAgdGhpcy55eXRleHQgPSAnJztcbiAgICAgICAgICAgIHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLl9jdXJyZW50UnVsZXMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGVtcE1hdGNoID0gdGhpcy5faW5wdXQubWF0Y2godGhpcy5ydWxlc1tydWxlc1tpXV0pO1xuICAgICAgICAgICAgaWYgKHRlbXBNYXRjaCAmJiAoIW1hdGNoIHx8IHRlbXBNYXRjaFswXS5sZW5ndGggPiBtYXRjaFswXS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZW1wTWF0Y2g7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy50ZXN0X21hdGNoKHRlbXBNYXRjaCwgcnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYmFja3RyYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyBhIHJ1bGUgTUlTbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuZmxleCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMudGVzdF9tYXRjaChtYXRjaCwgcnVsZXNbaW5kZXhdKTtcbiAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2lucHV0ID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVycm9yKCdMZXhpY2FsIGVycm9yIG9uIGxpbmUgJyArICh0aGlzLnl5bGluZW5vICsgMSkgKyAnLiBVbnJlY29nbml6ZWQgdGV4dC5cXG4nICsgdGhpcy5zaG93UG9zaXRpb24oKSwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgdG9rZW46IG51bGwsXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy55eWxpbmVub1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gbmV4dCBtYXRjaCB0aGF0IGhhcyBhIHRva2VuXG5sZXg6ZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgciA9IHRoaXMubmV4dCgpO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFjdGl2YXRlcyBhIG5ldyBsZXhlciBjb25kaXRpb24gc3RhdGUgKHB1c2hlcyB0aGUgbmV3IGxleGVyIGNvbmRpdGlvbiBzdGF0ZSBvbnRvIHRoZSBjb25kaXRpb24gc3RhY2spXG5iZWdpbjpmdW5jdGlvbiBiZWdpbihjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjay5wdXNoKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcG9wIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGUgb2ZmIHRoZSBjb25kaXRpb24gc3RhY2tcbnBvcFN0YXRlOmZ1bmN0aW9uIHBvcFN0YXRlKCkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMTtcbiAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5wb3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrWzBdO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcHJvZHVjZSB0aGUgbGV4ZXIgcnVsZSBzZXQgd2hpY2ggaXMgYWN0aXZlIGZvciB0aGUgY3VycmVudGx5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGVcbl9jdXJyZW50UnVsZXM6ZnVuY3Rpb24gX2N1cnJlbnRSdWxlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoICYmIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1t0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV1dLnJ1bGVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1tcIklOSVRJQUxcIl0ucnVsZXM7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gdGhlIGN1cnJlbnRseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlOyB3aGVuIGFuIGluZGV4IGFyZ3VtZW50IGlzIHByb3ZpZGVkIGl0IHByb2R1Y2VzIHRoZSBOLXRoIHByZXZpb3VzIGNvbmRpdGlvbiBzdGF0ZSwgaWYgYXZhaWxhYmxlXG50b3BTdGF0ZTpmdW5jdGlvbiB0b3BTdGF0ZShuKSB7XG4gICAgICAgIG4gPSB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDEgLSBNYXRoLmFicyhuIHx8IDApO1xuICAgICAgICBpZiAobiA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFja1tuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIklOSVRJQUxcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFsaWFzIGZvciBiZWdpbihjb25kaXRpb24pXG5wdXNoU3RhdGU6ZnVuY3Rpb24gcHVzaFN0YXRlKGNvbmRpdGlvbikge1xuICAgICAgICB0aGlzLmJlZ2luKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcmV0dXJuIHRoZSBudW1iZXIgb2Ygc3RhdGVzIGN1cnJlbnRseSBvbiB0aGUgc3RhY2tcbnN0YXRlU3RhY2tTaXplOmZ1bmN0aW9uIHN0YXRlU3RhY2tTaXplKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGg7XG4gICAgfSxcbm9wdGlvbnM6IHt9LFxucGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5LHl5XywkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zLFlZX1NUQVJUKSB7XG5cbnZhciBZWVNUQVRFPVlZX1NUQVJUO1xuc3dpdGNoKCRhdm9pZGluZ19uYW1lX2NvbGxpc2lvbnMpIHtcbmNhc2UgMDovKiBza2lwIHdoaXRlc3BhY2UgKi9cbmJyZWFrO1xuY2FzZSAxOnJldHVybiAnVEVYVCdcbmJyZWFrO1xuY2FzZSAyOnJldHVybiAxN1xuYnJlYWs7XG5jYXNlIDM6cmV0dXJuIDE4XG5icmVhaztcbmNhc2UgNDpyZXR1cm4gMjlcbmJyZWFrO1xuY2FzZSA1OnJldHVybiAyOFxuYnJlYWs7XG5jYXNlIDY6cmV0dXJuIDIxXG5icmVhaztcbmNhc2UgNzpyZXR1cm4gMTBcbmJyZWFrO1xuY2FzZSA4OnJldHVybiAxM1xuYnJlYWs7XG5jYXNlIDk6cmV0dXJuICdORSdcbmJyZWFrO1xuY2FzZSAxMDpyZXR1cm4gMzVcbmJyZWFrO1xuY2FzZSAxMTpyZXR1cm4gMzRcbmJyZWFrO1xuY2FzZSAxMjpyZXR1cm4gMzZcbmJyZWFrO1xuY2FzZSAxMzpyZXR1cm4gMzdcbmJyZWFrO1xuY2FzZSAxNDpyZXR1cm4gOFxuYnJlYWs7XG5jYXNlIDE1OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDE2OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDE3OnJldHVybiAyMlxuYnJlYWs7XG5jYXNlIDE4OnJldHVybiAyMFxuYnJlYWs7XG5jYXNlIDE5OnJldHVybiAxOVxuYnJlYWs7XG5jYXNlIDIwOnJldHVybiAxMFxuYnJlYWs7XG5jYXNlIDIxOnJldHVybiAxM1xuYnJlYWs7XG5jYXNlIDIyOnJldHVybiAxMVxuYnJlYWs7XG5jYXNlIDIzOnJldHVybiAxMlxuYnJlYWs7XG5jYXNlIDI0OnJldHVybiA5XG5icmVhaztcbmNhc2UgMjU6cmV0dXJuICcmJidcbmJyZWFrO1xuY2FzZSAyNjpyZXR1cm4gMjdcbmJyZWFrO1xuY2FzZSAyNzpyZXR1cm4gMzFcbmJyZWFrO1xuY2FzZSAyODpyZXR1cm4gMjVcbmJyZWFrO1xuY2FzZSAyOTpyZXR1cm4gMjNcbmJyZWFrO1xuY2FzZSAzMDpyZXR1cm4gMjZcbmJyZWFrO1xuY2FzZSAzMTpyZXR1cm4gJyUnXG5icmVhaztcbmNhc2UgMzI6cmV0dXJuIDE1XG5icmVhaztcbmNhc2UgMzM6cmV0dXJuICc/J1xuYnJlYWs7XG5jYXNlIDM0OnJldHVybiAnOidcbmJyZWFrO1xuY2FzZSAzNTpyZXR1cm4gMTdcbmJyZWFrO1xuY2FzZSAzNjpyZXR1cm4gMThcbmJyZWFrO1xuY2FzZSAzNzpyZXR1cm4gMzBcbmJyZWFrO1xuY2FzZSAzODpyZXR1cm4gMjRcbmJyZWFrO1xuY2FzZSAzOTpyZXR1cm4gJ1snXG5icmVhaztcbmNhc2UgNDA6cmV0dXJuICddJ1xuYnJlYWs7XG5jYXNlIDQxOnJldHVybiA1XG5icmVhaztcbn1cbn0sXG5ydWxlczogWy9eKD86XFxzKykvLC9eKD86XFwkW15cXCRdKlxcJCkvLC9eKD86XFxcXGxlZnRcXCgpLywvXig/OlxcXFxyaWdodFxcKSkvLC9eKD86XFxcXGZyYWNcXHspLywvXig/OlxcXFxzcXJ0XFx7KS8sL14oPzpcXFxcY2RvdFxcYikvLC9eKD86XFxcXGxbZV0pLywvXig/OlxcXFxnW2VdKS8sL14oPzpcXFxcbltlXSkvLC9eKD86XFxcXFthLXpBLVpdKykvLC9eKD86W2EtekEtWl0pLywvXig/OlswLTldK1xcLlswLTldKikvLC9eKD86WzAtOV0rKS8sL14oPzo9KS8sL14oPzpcXCopLywvXig/OlxcLikvLC9eKD86XFwvKS8sL14oPzotKS8sL14oPzpcXCspLywvXig/Ojw9KS8sL14oPzo+PSkvLC9eKD86PCkvLC9eKD86PikvLC9eKD86IT0pLywvXig/OiYmKS8sL14oPzpfW15cXChcXHtdKS8sL14oPzpcXF5bXlxcKFxce10pLywvXig/Ol9cXHspLywvXig/OlxcXlxceykvLC9eKD86ISkvLC9eKD86JSkvLC9eKD86LCkvLC9eKD86XFw/KS8sL14oPzo6KS8sL14oPzpcXCgpLywvXig/OlxcKSkvLC9eKD86XFx7KS8sL14oPzpcXH0pLywvXig/OlxcWykvLC9eKD86XFxdKS8sL14oPzokKS9dLFxuY29uZGl0aW9uczoge1wiSU5JVElBTFwiOntcInJ1bGVzXCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMTksMjAsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjksMzAsMzEsMzIsMzMsMzQsMzUsMzYsMzcsMzgsMzksNDAsNDFdLFwiaW5jbHVzaXZlXCI6dHJ1ZX19XG59O1xucmV0dXJuIGxleGVyO1xufSkoKTtcbnBhcnNlci5sZXhlciA9IGxleGVyO1xuZnVuY3Rpb24gUGFyc2VyICgpIHtcbiAgdGhpcy55eSA9IHt9O1xufVxuUGFyc2VyLnByb3RvdHlwZSA9IHBhcnNlcjtwYXJzZXIuUGFyc2VyID0gUGFyc2VyO1xucmV0dXJuIG5ldyBQYXJzZXI7XG59KSgpO1xuXG5cbmlmICh0eXBlb2YgcmVxdWlyZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG5leHBvcnRzLnBhcnNlciA9IHBhcnNlcjtcbmV4cG9ydHMuUGFyc2VyID0gcGFyc2VyLlBhcnNlcjtcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBwYXJzZXIucGFyc2UuYXBwbHkocGFyc2VyLCBhcmd1bWVudHMpOyB9O1xuZXhwb3J0cy5tYWluID0gZnVuY3Rpb24gY29tbW9uanNNYWluKGFyZ3MpIHtcbiAgICBpZiAoIWFyZ3NbMV0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1VzYWdlOiAnK2FyZ3NbMF0rJyBGSUxFJyk7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gICAgdmFyIHNvdXJjZSA9IHJlcXVpcmUoJ2ZzJykucmVhZEZpbGVTeW5jKHJlcXVpcmUoJ3BhdGgnKS5ub3JtYWxpemUoYXJnc1sxXSksIFwidXRmOFwiKTtcbiAgICByZXR1cm4gZXhwb3J0cy5wYXJzZXIucGFyc2Uoc291cmNlKTtcbn07XG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcbiAgZXhwb3J0cy5tYWluKHByb2Nlc3MuYXJndi5zbGljZSgxKSk7XG59XG59XG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKCl7dmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMuYXR0YWNoID0gZnVuY3Rpb24gKGdsb2JhbCkge1xuXG5cbiAgICBmdW5jdGlvbiBEZXJpdmF0aXZlKHdydCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geC5kaWZmZXJlbnRpYXRlKHdydCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgICAgICBcbiAgICBmdW5jdGlvbiBnYW1tbG4oeHgpIHtcbiAgICAgICAgdmFyIGo7XG4gICAgICAgIHZhciB4LCB0bXAsIHksIHNlcjtcbiAgICAgICAgdmFyIGNvZiA9IFtcbiAgICAgICAgICAgICA1Ny4xNTYyMzU2NjU4NjI5MjM1LFxuICAgICAgICAgICAgLTU5LjU5Nzk2MDM1NTQ3NTQ5MTIsXG4gICAgICAgICAgICAgMTQuMTM2MDk3OTc0NzQxNzQ3MSxcbiAgICAgICAgICAgIC0wLjQ5MTkxMzgxNjA5NzYyMDE5OSxcbiAgICAgICAgICAgICAwLjMzOTk0NjQ5OTg0ODExODg4N2UtNCxcbiAgICAgICAgICAgICAwLjQ2NTIzNjI4OTI3MDQ4NTc1NmUtNCxcbiAgICAgICAgICAgIC0wLjk4Mzc0NDc1MzA0ODc5NTY0NmUtNCxcbiAgICAgICAgICAgICAwLjE1ODA4ODcwMzIyNDkxMjQ5NGUtMyxcbiAgICAgICAgICAgIC0wLjIxMDI2NDQ0MTcyNDEwNDg4M2UtMyxcbiAgICAgICAgICAgICAwLjIxNzQzOTYxODExNTIxMjY0M2UtMyxcbiAgICAgICAgICAgIC0wLjE2NDMxODEwNjUzNjc2Mzg5MGUtMyxcbiAgICAgICAgICAgICAwLjg0NDE4MjIzOTgzODUyNzQzM2UtNCxcbiAgICAgICAgICAgIC0wLjI2MTkwODM4NDAxNTgxNDA4N2UtNCxcbiAgICAgICAgICAgICAwLjM2ODk5MTgyNjU5NTMxNjIzNGUtNVxuICAgICAgICBdO1xuICAgICAgICBpZiAoeHggPD0gMCl7XG4gICAgICAgICAgICB0aHJvdyhuZXcgRXJyb3IoJ2JhZCBhcmcgaW4gZ2FtbWxuJykpO1xuICAgICAgICB9XG4gICAgICAgIHkgPSB4ID0geHg7XG4gICAgICAgIHRtcCA9IHggKyA1LjI0MjE4NzUwMDAwMDAwMDAwO1xuICAgICAgICB0bXAgPSAoeCArIDAuNSkgKiBNYXRoLmxvZyh0bXApIC0gdG1wO1xuICAgICAgICBzZXIgPSAwLjk5OTk5OTk5OTk5OTk5NzA5MjtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IDE0OyBqKyspe1xuICAgICAgICAgICAgc2VyICs9IGNvZltqXSAvICsreTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG1wICsgTWF0aC5sb2coMi41MDY2MjgyNzQ2MzEwMDA1ICogc2VyIC8geCk7XG4gICAgfVxuXG5cbiAgICB2YXIgQ2FydFNpbmUgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE0uRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW2dsb2JhbC5zaW4uZGVmYXVsdCh4KSwgZ2xvYmFsLlplcm9dKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cobmV3IEVycm9yKCdDb21wbGV4IFNpbmUgQ2FydGVzaWFuIGZvcm0gbm90IGltcGxlbWVudGVkIHlldC4nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsb2JhbFsnc2luJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnNpbih4LnZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luKGErYmkpID0gc2luKGEpY29zaChiKSArIGkgY29zKGEpc2luaChiKVxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwX2IgPSBNYXRoLmV4cCh4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvc2hfYiA9IChleHBfYiArIDEgLyBleHBfYikgLyAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2luaF9iID0gKGV4cF9iIC0gMSAvIGV4cF9iKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4TnVtZXJpY2FsKE1hdGguc2luKHguX3JlYWwpICogY29zaF9iLCBNYXRoLmNvcyh4Ll9yZWFsKSAqIHNpbmhfYik7XG4gICAgICAgICAgICAqL1xuICAgICAgICB9LFxuICAgICAgICByZWFsaW1hZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIENhcnRTaW5lO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc2luJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLnNpbicsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ3NpbicsXG4gICAgICAgIHRpdGxlOiAnU2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVHJpZ29ub21ldHJpY19mdW5jdGlvbnMjU2luZS4yQ19jb3NpbmUuMkNfYW5kX3RhbmdlbnQnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcc2luIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnY29zJywgJ3RhbiddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydjb3MnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguY29zKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGRlcml2YXRpdmU6IGdsb2JhbC5zaW5bJ0AtJ10oKSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGNvcycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5jb3MnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdjb3MnLFxuICAgICAgICB0aXRsZTogJ0Nvc2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29zaW5lIEZ1bmN0aW9uIGRlc2MnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcY29zIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnc2luJywgJ3RhbiddXG4gICAgfSk7XG5cbiAgICBnbG9iYWwuc2luLmRlcml2YXRpdmUgPSBnbG9iYWwuY29zO1xuXG4gICAgZ2xvYmFsWyd0YW4nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgudGFuKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnRhbiwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnRhbiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGRlcml2YXRpdmU6IGdsb2JhbC5zaW5bJ0AtJ10oKSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHRhbicsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC50YW4nLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICd0YW4nLFxuICAgICAgICB0aXRsZTogJ1RhbmdlbnQgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RhbmdlbnQgRnVuY3Rpb24gZGVzYycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFx0YW4oXFxcXHBpLzMpJywgJ1xcXFx0YW4gKFxcXFxwaS8yKSddLFxuICAgICAgICByZWxhdGVkOiBbJ3NpbicsICdjb3MnXVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydsb2cnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgsIGFzc3VtcHRpb25zKSB7XG5cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgeC5hID09PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgeC5hID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5JbmZpbml0eVsnQC0nXSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYodiA+IDApe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmxvZyh2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihhc3N1bXB0aW9ucyAmJiBhc3N1bXB0aW9ucy5wb3NpdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmxvZywgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwubG9nLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWxpbWFnOiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIENhcnRMb2c7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxsb2cnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGgubG9nJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnbG9nJyxcbiAgICAgICAgdGl0bGU6ICdOYXR1cmFsIExvZ2FyaXRobScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQmFzZSBlLiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9OYXR1cmFsX2xvZ2FyaXRobScsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxsb2cgKHllXigyeCkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnZXhwJywgJ0xvZyddXG4gICAgfSk7XG4gICAgdmFyIEhhbGYgPSBuZXcgRXhwcmVzc2lvbi5SYXRpb25hbCgxLCAyKTtcbiAgICB2YXIgQ2FydExvZyA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgICAgIGdsb2JhbC5sb2cuZGVmYXVsdCh4LmFicygpKSxcbiAgICAgICAgICAgICAgICB4LmFyZygpXG4gICAgICAgICAgICBdKVsnKiddKEhhbGYpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgQ2FydExvZy5fX3Byb3RvX18gPSBnbG9iYWwubG9nO1xuICAgIGdsb2JhbFsnYXRhbjInXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoISAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uVmVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHRocm93ICgnYXRhbiBvbmx5IHRha2VzIHZlY3RvciBhcmd1bWVudHMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHhbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICBpZih4WzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguYXRhbjIoeFswXS52YWx1ZSwgeFsxXS52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmF0YW4yLCB4XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5hdGFuMiwgeF0pO1xuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIC8vVE9ETzogREFOR0VSISBBc3N1bWluZyByZWFsIG51bWJlcnMsIGJ1dCBpdCBzaG91bGQgaGF2ZSBzb21lIGZhc3Qgd2F5IHRvIGRvIHRoaXMuXG4gICAgICAgICAgICByZXR1cm4gW0V4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmF0YW4yLCB4XSksIE0uZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcdGFuXnstMX0nLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguYXRhbjInLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdhdGFuJyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnVHdvIGFyZ3VtZW50IGFyY3RhbmdlbnQgZnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FyY3Rhbih5LCB4KS4gV2lsbCBlcXVhbCBhcmN0YW4oeSAvIHgpIGV4Y2VwdCB3aGVuIHggYW5kIHkgYXJlIGJvdGggbmVnYXRpdmUuIFNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0F0YW4yJ1xuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydmYWN0b3JpYWwnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWwuR2FtbWEuZGVmYXVsdCh4WycrJ10oZ2xvYmFsLk9uZSkpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcZmFjdG9yaWFsJ1xuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydhdGFuJ10gPSBnbG9iYWwuYXRhbjI7XG5cbiAgICBnbG9iYWxbJ0dhbW1hJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHguYTtcbiAgICAgICAgICAgICAgICBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkNvbXBsZXhJbmZpbml0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYodiA8IDE1KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaSA9IDE7IGkgPCB2OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKj0gaTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcihwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuR2FtbWEsIHhdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkluZmluaXR5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgtTWF0aC5QSSAvICh2ICogTWF0aC5zaW4oTWF0aC5QSSAqIHYpICogTWF0aC5leHAoZ2FtbWxuKC12KSkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5leHAoZ2FtbWxuKHYpKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLkdhbW1hLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxHYW1tYScsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiBnYW1tbG4sXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIH0sXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ0dhbW1hIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9HYW1tYV9mdW5jdGlvbicsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxHYW1tYSAoeCknLCAneCEnXSxcbiAgICAgICAgcmVsYXRlZDogWydMb2cnLCAnTG9nR2FtbWEnXVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydSZSddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4geC5yZWFsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgcmV0dXJuIFt4LnJlYWwoKSwgZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcUmUnXG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ0ltJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4LmltYWcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzdHJpYnV0ZWRfdW5kZXJfZGlmZmVyZW50aWF0aW9uOiB0cnVlLFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiBbeC5pbWFnKCksIGdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXEltJ1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gRmluaXRlU2V0KGVsZW1lbnRzKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudHMgPSBlbGVtZW50cyB8fCBbXTtcbiAgICB9XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5pbnRlcnNlY3QgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoeC5lbGVtZW50cy5pbmRleE9mKHRoaXMuZWxlbWVudHNbaV0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRoaXMuZWxlbWVudHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRmluaXRlU2V0KHJlcyk7XG4gICAgfTtcbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLmVudW1lcmF0ZSA9IGZ1bmN0aW9uIChuLCBmbikge1xuICAgICAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHNbaV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmbikge1xuICAgICAgICAgICAgdGhpcy5tYXAoZm4pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICBmb3IodmFyIGkgPSAwLCBsID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudHNbaV0gPSBuZXcgZm4odGhpcy5lbGVtZW50c1tpXSwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLnN1YnNldCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGwgPSB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKHguZWxlbWVudHMuaW5kZXhPZih0aGlzLmVsZW1lbnRzW2ldKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgRmluaXRlU2V0LnByb3RvdHlwZS5wc3Vic2V0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmVsZW1lbnRzLmxlbmd0aCA8IHguZWxlbWVudHMubGVuZ3RoKSAmJiB0aGlzLnN1YnNldCh4KTtcbiAgICB9O1xuICAgIEZpbml0ZVNldC5wcm90b3R5cGUuc3Vwc2V0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHguc3Vic2V0KHRoaXMpO1xuICAgIH07XG5cbiAgICBGaW5pdGVTZXQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50cy5sZW5ndGggIT09IHguZWxlbWVudHMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgZm9yKHZhciBpID0gMCwgbCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50c1tpXSAhPT0geC5lbGVtZW50c1tpXSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdXRpbC5pbmhlcml0cyhNb2R1bG9Hcm91cCwgRmluaXRlU2V0KTtcbiAgICBmdW5jdGlvbiBNb2R1bG9Hcm91cChuLCBvcGVyYXRvcikge1xuICAgICAgICBGaW5pdGVTZXQuY2FsbCh0aGlzKTtcblxuICAgICAgICBvcGVyYXRvciA9IG9wZXJhdG9yIHx8ICdkZWZhdWx0JztcblxuICAgICAgICBmdW5jdGlvbiBFbGVtZW50KF8sIG4pIHtcbiAgICAgICAgICAgIHRoaXMubiA9IG47XG4gICAgICAgIH1cblxuICAgICAgICBFbGVtZW50LnByb3RvdHlwZVtvcGVyYXRvcl1cbiAgICAgICAgPSBFbGVtZW50LnByb3RvdHlwZS5kZWZhdWx0XG4gICAgICAgID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRWxlbWVudCgodGhpcy5uICsgeC5uKSAlIG4pO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbnVtZXJhdGUobiwgRWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5wcm90b3R5cGUgPSBFbGVtZW50LnByb3RvdHlwZTtcblxuICAgIH07XG5cbiAgICB1dGlsLmluaGVyaXRzKE11bHRpVmFsdWUsIEZpbml0ZVNldCk7XG5cbiAgICBmdW5jdGlvbiBNdWx0aVZhbHVlKGVsZW1lbnRzKSB7XG4gICAgICAgIEZpbml0ZVNldC5jYWxsKHRoaXMsIGVsZW1lbnRzKTtcbiAgICB9XG5cblxuICAgIE11bHRpVmFsdWUucHJvdG90eXBlLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB0aGlzLm9wZXJhdG9yKCdkZWZhdWx0JywgeCk7XG4gICAgfTtcblxuICAgIE11bHRpVmFsdWUucHJvdG90eXBlWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB0aGlzLm9wZXJhdG9yKCcrJywgeCk7XG4gICAgfTtcblxuICAgIE11bHRpVmFsdWUucHJvdG90eXBlWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICB0aGlzLm9wZXJhdG9yKCcqJywgeCk7XG4gICAgfTtcblxuICAgIE11bHRpVmFsdWUucHJvdG90eXBlLm9wZXJhdG9yID0gZnVuY3Rpb24gKG9wZXJhdG9yLCB4KSB7XG5cbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBNdWx0aVZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaiA9IDA7IGogPCB4LmVsZW1lbnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuID0gdGhpcy5lbGVtZW50c1tpXVtvcGVyYXRvcl0oaik7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKG4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNdWx0aVZhbHVlKHJlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtvcGVyYXRvcl0oeCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIHF1YWRyYW50KHgpIHtcbiAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB4LnZhbHVlID4gMCA/ICcrJyA6ICctJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnKy0nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnXicpIHtcbiAgICAgICAgICAgICAgICB2YXIgcTAgPSBxdWFkcmFudCh4WzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IHhbMV0udmFsdWU7XG5cbiAgICAgICAgICAgICAgICBpZiAocTAgPT09ICcrJykgcmV0dXJuICcrJztcbiAgICAgICAgICAgICAgICBpZiAocTAgPT09ICctJyB8fCBxMCA9PT0gJystJykgcmV0dXJuIG4gJSAyID09PSAwID8gJysnIDogJy0nO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuICcrLSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcSA9IFtdLm1hcC5jYWxsKHgsIHF1YWRyYW50KTtcblxuICAgICAgICAgICAgaWYgKHFbMF0gPT09ICcrLScgfHwgcVsxXSA9PT0gJystJykgcmV0dXJuICcrLSc7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoeC5vcGVyYXRvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgICAgICAgICBpZiAocVsxXSA9PT0gJy0nKSBxWzFdID0gJysnO1xuICAgICAgICAgICAgICAgICAgICBpZiAocVsxXSA9PT0gJysnKSBxWzFdID0gJy0nO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnKyc6IHJldHVybiBxWzBdID09PSBxWzFdID8gcVswXSA6ICcrLSc7XG5cblxuICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgICAgICAgICAgICAgIGNhc2UgJyonOiByZXR1cm4gcVswXSA9PT0gcVsxXSA/ICcrJyA6ICctJztcblxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc1Bvc2l0aXZlKHgpIHtcbiAgICAgICAgdmFyIHMgPSBxdWFkcmFudCh4KTtcbiAgICAgICAgcmV0dXJuIHMgPT09ICcrJztcbiAgICB9XG5cbiAgICBnbG9iYWxbJ3NxcnQnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcblxuICAgICAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIHNxcnRNYWdYID0gTWF0aC5zcXJ0KHYpXG4gICAgICAgICAgICAgICAgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWwuWmVybywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChzcXJ0TWFnWClcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHNxcnRNYWdYKTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgICAgICAgICAgICAgIHhbMF0sXG4gICAgICAgICAgICAgICAgICAgIHhbMV1bJy8nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBQRSh4KTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzIHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgaWYgKGVsZW0uZXF1YWxzKG5ldyBNdWx0aVZhbHVlKFtFLmVsZW1lbnRzWzBdXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG5cbiAgICAgICAgICAgIHRocm93KCdTUVJUOiA/Pz8nKTtcbiAgICAgICAgICAgIHN3aXRjaCAoeC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5Db21wbGV4OlxuICAgICAgICAgICAgICAgICAgICAvL2h0dHA6Ly93d3cubWF0aHByb3ByZXNzLmNvbS9zdGFuL2JpYmxpb2dyYXBoeS9jb21wbGV4U3F1YXJlUm9vdC5wZGZcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNnbl9iO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeC5faW1hZyA9PT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChNYXRoLnNxcnQoeC5fcmVhbCksIDApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoeC5faW1hZz4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZ25fYiA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNnbl9iID0gLTEuMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc19hMl9iMiA9IE1hdGguc3FydCh4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBvbmVfb25fcnQyICogTWF0aC5zcXJ0KHNfYTJfYjIgKyB4Ll9yZWFsKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBzZ25fYiAqIG9uZV9vbl9ydDIgKiBNYXRoLnNxcnQoc19hMl9iMiAtIHguX3JlYWwpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uUmVhbE51bWVyaWNhbChNYXRoLnNxcnQoeCkpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LlJlYWw6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnXicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuYWJzLmFwcGx5KHVuZGVmaW5lZCwgeFswXS5hcHBseSgnXicsIHhbMV0uYXBwbHkoJy8nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDIsMCkpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIC8vVE9ETzogREFOR0VSISBBc3N1bWluZyByZWFsIG51bWJlcnMsIGJ1dCBpdCBzaG91bGQgaGF2ZSBzb21lIGZhc3Qgd2F5IHRvIGRvIHRoaXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vVXNlcyBleHAsIGF0YW4yIGFuZCBsb2cgZnVuY3Rpb25zLiBBIHJlYWxseSBiYWQgaWRlYS4gKHNxdWFyZSByb290aW5nLCB0aGVuIHNxdWFyaW5nLCB0aGVuIGF0YW4sIGFsc28gW2V4cChsb2cpXSlcbiAgICAgICAgICAgIHJldHVybiB4WydeJ10obmV3IEV4cHJlc3Npb24uUmF0aW9uYWwoMSwgMikpLnJlYWxpbWFnKCk7XG4gICAgICAgICAgICAvL3ZhciByaSA9IHgucmVhbGltYWcoKTtcbiAgICAgICAgICAgIC8vcmV0dXJuIFtFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSksIE0uZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc3FydCcsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5zcXJ0JyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnc3FydCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ1NxcnQgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NxdWFyZV9Sb290JyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXHNxcnQgKHheNCknXSxcbiAgICAgICAgcmVsYXRlZDogWydwb3cnLCAnYWJzJywgJ21vZCddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydhYnMnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuXG4gICAgICAgICAgICByZXR1cm4geC5hYnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGFicycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hYnMnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdhYnMnLFxuICAgICAgICB0aXRpZTogJ0Fic29sdXRlIFZhbHVlIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBYnMnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcYWJzICgtMyknLCAnXFxcXGFicyAoaSszKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2FyZycsICd0YW4nXVxuICAgIH0pO1xuXG4gICAgLy8gSXQgaXMgc2VsZi1yZWZlcmVudGlhbFxuICAgIGdsb2JhbC5hYnMuZGVyaXZhdGl2ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcyA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCk7XG4gICAgICAgICAgICB2YXIgeSA9IHNbJy8nXShzLmFicygpKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyh5LCBbc10pO1xuICAgIH0oKSk7XG4gICAgZ2xvYmFsWydhcmcnXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQVJHIElTIEZPUiBVU0VSIElOUFVUIE9OTFkuIFVTRSAuYXJnKCknKTtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuIFRPRE86IENoZWNrIHRoZSB0cnV0aGZ1bGxuZXMgb2YgdGhpcyFcbiAgICAgICAgICAgIHJldHVybiB4LmFyZygpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcYXJnJywgLy90ZW1wXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hcmdfcmVhbCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRpZTogJ0FyZyBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJnJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGFyZyAoLTMpJywgJ1xcXFxhcmcgKDMpJywgJ1xcXFxhcmcoMysyaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydhYnMnXVxuICAgIH1cblxuXG5cbiAgICBnbG9iYWxbJ2UnXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5FLCAwKTtcbiAgICBnbG9iYWxbJ2UnXS50aXRsZSA9ICdlJztcbiAgICBnbG9iYWxbJ2UnXS5kZXNjcmlwdGlvbiA9ICdUaGUgdHJhbnNjZW5kZW50YWwgbnVtYmVyIHRoYXQgaXMgdGhlIGJhc2Ugb2YgdGhlIG5hdHVyYWwgbG9nYXJpdGhtLCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIDIuNzE4MjguJztcbiAgICBnbG9iYWwuZS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnTWF0aC5FJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMi43MTgyODE4Mjg0NTkwNDUnKTtcbiAgICB9O1xuXG5cbiAgICBnbG9iYWxbJ3BpJ10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguUEksIDApO1xuICAgIGdsb2JhbFsncGknXS50aXRsZSA9ICdQaSc7XG4gICAgZ2xvYmFsWydwaSddLmRlc2NyaXB0aW9uID0gJyc7XG4gICAgZ2xvYmFsLnBpLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdNYXRoLlBJJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ1xcXFxwaScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMy4xNDE1OTI2NTM1ODk3OTMnKTtcbiAgICB9O1xuICAgIC8vIFRoZSByZWFsIGNpcmNsZSBjb25zdGFudDpcbiAgICBnbG9iYWwudGF1ID0gZ2xvYmFsWydwaSddWycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG5cbiAgICBnbG9iYWxbJ0luZmluaXR5J10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKEluZmluaXR5LCAwKTtcbiAgICBnbG9iYWxbJ0luZmluaXR5J10udGl0bGUgPSAnSW5maW5pdHknO1xuICAgIGdsb2JhbFsnSW5maW5pdHknXS5kZXNjcmlwdGlvbiA9ICcnO1xuICAgIGdsb2JhbFsnaW5mdHknXSA9IGdsb2JhbC5JbmZpbml0eTtcblxuXG4gICAgZ2xvYmFsWydaZXJvJ10gPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDApO1xuICAgIGdsb2JhbFsnWmVybyddLnRpdGxlID0gJ1plcm8nO1xuICAgIGdsb2JhbFsnWmVybyddLmRlc2NyaXB0aW9uID0gJ0FkZGl0aXZlIElkZW50aXR5JztcbiAgICBnbG9iYWxbJ1plcm8nXVsnKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgIH07XG4gICAgZ2xvYmFsWydaZXJvJ11bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG4gICAgZ2xvYmFsWydaZXJvJ11bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydaZXJvJ11bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfTtcblxuICAgIGdsb2JhbFsnT25lJ10gPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDEpO1xuICAgIGdsb2JhbFsnT25lJ10udGl0bGUgPSAnT25lJztcbiAgICBnbG9iYWxbJ09uZSddLmRlc2NyaXB0aW9uID0gJ011bHRpcGxpY2F0aXZlIElkZW50aXR5JztcbiAgICBnbG9iYWxbJ09uZSddWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmxvZy5kZXJpdmF0aXZlID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMoZ2xvYmFsLk9uZVsnLyddKG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCkpKTtcblxuICAgIGdsb2JhbFsnaSddID0gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtnbG9iYWxbJ1plcm8nXSwgZ2xvYmFsWydPbmUnXV0pO1xuICAgIGdsb2JhbFsnaSddLnRpdGxlID0gJ0ltYWdpbmFyeSBVbml0JztcbiAgICBnbG9iYWxbJ2knXS5kZXNjcmlwdGlvbiA9ICdBIG51bWJlciB3aGljaCBzYXRpc2ZpZXMgdGhlIHByb3BlcnR5IDxtPmleMiA9IC0xPC9tPi4nO1xuICAgIGdsb2JhbFsnaSddLnJlYWxpbWFnID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIGdsb2JhbC5aZXJvLFxuICAgICAgICAgICAgZ2xvYmFsLk9uZVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIGdsb2JhbFsnaSddWycqW1RPRE9dJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydkJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbmZpbml0ZXNpbWFsKHgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBnbG9iYWwuZFsnLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCkge1xuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gRGVyaXZhdGl2ZSBvcGVyYXRvclxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGVyaXZhdGl2ZSh4LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHgueCwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEZXJpdmF0aXZlKHgpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZnVzaW5nIGluZml0ZXNpbWFsIG9wZXJhdG9yIGRpdmlzaW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdygnRGl2aWRpbmcgZCBieSBzb21lIGxhcmdlIG51bWJlci4nKTtcbiAgICAgICAgXG4gICAgfTtcbiAgICBnbG9iYWxbJ3VuZGVmaW5lZCddID0ge1xuICAgICAgICBzOiBmdW5jdGlvbiAobGFuZyl7XG4gICAgICAgICAgICBpZiAobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ3VuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJygxLjAvMC4wKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkaWZmZXJlbnRpYXRlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnKic6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcrJzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy0nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ14nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ0AtJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGdsb2JhbFsnc3VtJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICB0aHJvdygnU3VtIG5vdCBwcm9wZXJseSBjb25zdHJ1Y3RlZCB5ZXQuJyk7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGdsb2JhbFsnc3VtJ11bJ18nXSA9IGZ1bmN0aW9uIChlcSkge1xuICAgICAgICAvLyBzdGFydDogXG4gICAgICAgIHZhciB0ID0gZXFbMF07XG4gICAgICAgIHZhciB2ID0gZXFbMV07XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh0LCB2KTtcbiAgICB9XG4gICAgXG59O1xufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsICAgID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIGdsb2JhbCAgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuXG51dGlsLmluaGVyaXRzKENvbnRleHQsIHtwcm90b3R5cGU6IGdsb2JhbH0pO1xuXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuXG59XG5cbkNvbnRleHQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3BsaWNlKDApO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxuZnVuY3Rpb24gRXhwcmVzc2lvbigpIHtcbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFeHByZXNzaW9uO1xuXG5FeHByZXNzaW9uLkxpc3QgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xpc3QnKTtcbkV4cHJlc3Npb24uTGlzdC5SZWFsICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTGlzdC9SZWFsJyk7XG5FeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbiAgPSByZXF1aXJlKCcuL0xpc3QvQ29tcGxleENhcnRlc2lhbicpO1xuRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhciAgICAgID0gcmVxdWlyZSgnLi9MaXN0L0NvbXBsZXhQb2xhcicpO1xuRXhwcmVzc2lvbi5Db25zdGFudCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Db25zdGFudCcpO1xuRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4ICAgICAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxDb21wbGV4Jyk7XG5FeHByZXNzaW9uLk51bWVyaWNhbFJlYWwgICAgICAgICAgPSByZXF1aXJlKCcuL051bWVyaWNhbFJlYWwnKTtcbkV4cHJlc3Npb24uUmF0aW9uYWwgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vUmF0aW9uYWwnKTtcbkV4cHJlc3Npb24uSW50ZWdlciAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vSW50ZWdlcicpO1xuRXhwcmVzc2lvbi5TeW1ib2wgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9TeW1ib2wnKTtcbkV4cHJlc3Npb24uU3ltYm9sLlJlYWwgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3ltYm9sL1JlYWwnKTtcbkV4cHJlc3Npb24uU3RhdGVtZW50ICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3RhdGVtZW50Jyk7XG5FeHByZXNzaW9uLlZlY3RvciAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1ZlY3RvcicpO1xuRXhwcmVzc2lvbi5NYXRyaXggICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9NYXRyaXgnKTtcbkV4cHJlc3Npb24uRnVuY3Rpb24gICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vRnVuY3Rpb24nKTtcbkV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMgICAgICA9IHJlcXVpcmUoJy4vRnVuY3Rpb24vU3ltYm9saWMnKTtcbkV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCAgICAgICAgICA9IHJlcXVpcmUoJy4vSW5maW5pdGVzaW1hbCcpO1xuXG52YXIgXyA9IEV4cHJlc3Npb24ucHJvdG90eXBlO1xuXG5fLnRvU3RyaW5nID0gbnVsbDtcbl8udmFsdWVPZiA9IG51bGw7XG5cbl8uaW1hZ2VVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICdodHRwOi8vbGF0ZXguY29kZWNvZ3MuY29tL2dpZi5sYXRleD8nICtcbiAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucygndGV4dC9sYXRleCcpLnMpO1xufTtcblxuXy5yZW5kZXJMYVRlWCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5zcmMgPSB0aGlzLmltYWdlVVJMKCk7XG4gICAgcmV0dXJuIGltYWdlO1xufTtcblxuLy8gc3Vic3R1dGlvbiBkZWZhdWx0OlxuXy5zdWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBsaW1pdCBkZWZhdWx0XG5fLmxpbSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIHRoaXMuc3ViKHgsIHkpO1xufTtcblxuX1snLCddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TdGF0ZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbmRpdGlvbmFsKHgsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbn07XG5cblxuWyc9JywgJyE9JywgJz4nLCAnPj0nLCAnPCcsICc8PSddLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgX1tvcGVyYXRvcl0gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uU3RhdGVtZW50KHRoaXMsIHgsIG9wZXJhdG9yKTtcbiAgICB9O1xufSk7XG5cblxuXG4vLyBjcm9zc1Byb2R1Y3QgaXMgdGhlICcmdGltZXM7JyBjaGFyYWN0ZXJcbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7XG5cbl9bY3Jvc3NQcm9kdWN0XSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJyonXSh4KTtcbn07XG5cblxuLy8gVGhlIGRlZmF1bHQgb3BlcmF0b3Igb2NjdXJzIHdoZW4gdHdvIGV4cHJlc3Npb25zIGFyZSBhZGphY2VudCB0byBlYWNob3RoZXI6IFMgLT4gZSBlLlxuLy8gRGVwZW5kaW5nIG9uIHRoZSB0eXBlLCBpdCB1c3VhbGx5IHJlcHJlc2VudHMgYXNzb2NpYXRpdmUgbXVsdGlwbGljYXRpb24uXG4vLyBTZWUgYmVsb3cgZm9yIHRoZSBkZWZhdWx0ICcqJyBvcGVyYXRvciBpbXBsZW1lbnRhdGlvbi5cbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJyonXSh4KTtcbn07XG5cblsnLycsICcrJywgJy0nLCAnQC0nLCAnXicsICclJ10uZm9yRWFjaChmdW5jdGlvbiAob3BlcmF0b3IpIHtcbiAgICBfW29wZXJhdG9yXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuICAgIH07XG59KTtcblxuXG5cblxuLy8gVGhpcyBtYXkgbG9vayBsaWtlIHdlIGFyZSBhc3N1bWluZyB0aGF0IHggaXMgYSBudW1iZXIsXG4vLyBidXQgcmVhbGx5IHRoZSBpbXBvcnRhbnQgYXNzdW1wdGlvbiBpcyBzaW1wbHlcbi8vIHRoYXQgaXQgaXMgZmluaXRlLlxuLy8gVGh1cyBpbmZpbml0aWVzIGFuZCBpbmRldGVybWluYXRlcyBzaG91bGQgQUxXQVlTXG4vLyBvdmVycmlkZSB0aGlzIG9wZXJhdG9yXG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJyonKTtcbn07XG5cblxuXG5cblxuXG5cblxuXG5cblxufSkoKSIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IEZ1bmN0aW9uICh3aGljaCBpdCBjYWxscyBldmFsKVxuLypqc2hpbnQgLVcwNjEgKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb2RlO1xuXG5mdW5jdGlvbiBDb2RlKHMsIHByZSl7XG4gICAgdGhpcy5wcmUgPSBbXSB8fCBwcmU7XG4gICAgdGhpcy5zID0gJycgfHwgcztcbiAgICB0aGlzLnZhcnMgPSAwO1xuICAgIHRoaXMucCA9IEluZmluaXR5O1xufVxuXG52YXIgXyA9IENvZGUucHJvdG90eXBlO1xuXG4vKlxuICAgIFRoaXMgdXNlcyBhIGdsb2JhbCBzdGF0ZS5cblxuICAgIFBlcmhhcHMgdGhlcmUgaXMgYSBuaWNlciB3YXksIGJ1dCB0aGlzIHdpbGwgd29yay5cbiovXG5Db2RlLm5ld0NvbnRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ29kZS5jb250ZXh0VmFyaWFibGVDb3VudCA9IDA7XG59O1xuXG5Db2RlLm5ld0NvbnRleHQoKTtcblxuLy8gRm9yIGZhc3RlciBldmFsdWF0aW9uIG11bHRpcGxlIHN0YXRtZW50cy4gRm9yIGV4YW1wbGUgKHgrMyleMiB3aWxsIGZpcnN0IGNhbGN1bGF0ZSB4KzMsIGFuZCBzbyBvbi5cbl8udmFyaWFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICd0JyArIChDb2RlLmNvbnRleHRWYXJpYWJsZUNvdW50KyspLnRvU3RyaW5nKDM2KTtcbn07XG5cbl8ubWVyZ2UgPSBmdW5jdGlvbiAobywgc3RyLCBwLCBwcmUpIHtcbiAgICB0aGlzLnMgPSBzdHI7XG4gICAgaWYgKHByZSkge1xuICAgICAgICB0aGlzLnByZS5wdXNoKHByZSk7XG4gICAgfVxuICAgIHZhciBpO1xuICAgIHRoaXMucHJlLnB1c2guYXBwbHkodGhpcy5wcmUsIG8ucHJlKTtcbiAgICB0aGlzLnZhcnMgKz0gby52YXJzO1xuICAgIHRoaXMucCA9IHA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5fLnVwZGF0ZSA9IGZ1bmN0aW9uIChzdHIsIHAsIHByZSkge1xuICAgIHRoaXMucCA9IHA7XG4gICAgaWYocHJlKSB7XG4gICAgICAgIHRoaXMucHJlLnB1c2gocHJlKTtcbiAgICB9XG4gICAgdGhpcy5zID0gc3RyO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gSmF2YXNjcmlwdCBjb21wbGlhdGlvblxuXy5jb21waWxlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oeCwgdGhpcy5wcmUuam9pbignXFxuJykgKyAncmV0dXJuICcgKyB0aGlzLnMpO1xufTtcblxuXy5nbHNsRnVuY3Rpb24gPSBmdW5jdGlvbiAodHlwZSwgbmFtZSwgcGFyYW1ldGVycykge1xuICAgIHJldHVybiB0eXBlICsgJyAnICsgbmFtZSArICcoJyArIHBhcmFtZXRlcnMgKyAnKXtcXG4nICsgdGhpcy5wcmUuam9pbignXFxuJykgKyAncmV0dXJuICcgKyB0aGlzLnMgKyAnO1xcbn1cXG4nO1xufTtcblxuXG59KSgpIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdpZnkoZXhwciwgbGFuZykge1xuICAgIHJldHVybiBleHByLnMobGFuZyk7XG59O1xuIiwiLy8gbm90aGluZyB0byBzZWUgaGVyZS4uLiBubyBmaWxlIG1ldGhvZHMgZm9yIHRoZSBicm93c2VyXG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7ZnVuY3Rpb24gZmlsdGVyICh4cywgZm4pIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBSZWdleCB0byBzcGxpdCBhIGZpbGVuYW1lIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cbi8vIHBvc2l4IHZlcnNpb25cbnZhciBzcGxpdFBhdGhSZSA9IC9eKC4rXFwvKD8hJCl8XFwvKT8oKD86Lis/KT8oXFwuW14uXSopPykkLztcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG52YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGZhbHNlO1xuXG5mb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aDsgaSA+PSAtMSAmJiAhcmVzb2x2ZWRBYnNvbHV0ZTsgaS0tKSB7XG4gIHZhciBwYXRoID0gKGkgPj0gMClcbiAgICAgID8gYXJndW1lbnRzW2ldXG4gICAgICA6IHByb2Nlc3MuY3dkKCk7XG5cbiAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycgfHwgIXBhdGgpIHtcbiAgICBjb250aW51ZTtcbiAgfVxuXG4gIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xufVxuXG4vLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4vLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuLy8gTm9ybWFsaXplIHRoZSBwYXRoXG5yZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocmVzb2x2ZWRQYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIXJlc29sdmVkQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XG59O1xuXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5ub3JtYWxpemUgPSBmdW5jdGlvbihwYXRoKSB7XG52YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckF0KDApID09PSAnLycsXG4gICAgdHJhaWxpbmdTbGFzaCA9IHBhdGguc2xpY2UoLTEpID09PSAnLyc7XG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihwYXRoLnNwbGl0KCcvJyksIGZ1bmN0aW9uKHApIHtcbiAgICByZXR1cm4gISFwO1xuICB9KSwgIWlzQWJzb2x1dGUpLmpvaW4oJy8nKTtcblxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBwYXRoID0gJy4nO1xuICB9XG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcbiAgICBwYXRoICs9ICcvJztcbiAgfVxuICBcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5qb2luID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXRocyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gIHJldHVybiBleHBvcnRzLm5vcm1hbGl6ZShmaWx0ZXIocGF0aHMsIGZ1bmN0aW9uKHAsIGluZGV4KSB7XG4gICAgcmV0dXJuIHAgJiYgdHlwZW9mIHAgPT09ICdzdHJpbmcnO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG5leHBvcnRzLmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHZhciBkaXIgPSBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzFdIHx8ICcnO1xuICB2YXIgaXNXaW5kb3dzID0gZmFsc2U7XG4gIGlmICghZGlyKSB7XG4gICAgLy8gTm8gZGlybmFtZVxuICAgIHJldHVybiAnLic7XG4gIH0gZWxzZSBpZiAoZGlyLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgKGlzV2luZG93cyAmJiBkaXIubGVuZ3RoIDw9IDMgJiYgZGlyLmNoYXJBdCgxKSA9PT0gJzonKSkge1xuICAgIC8vIEl0IGlzIGp1c3QgYSBzbGFzaCBvciBhIGRyaXZlIGxldHRlciB3aXRoIGEgc2xhc2hcbiAgICByZXR1cm4gZGlyO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGEgZnVsbCBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIHJldHVybiBkaXIuc3Vic3RyaW5nKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsyXSB8fCAnJztcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKHBhdGgpWzNdIHx8ICcnO1xufTtcblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnN0YW50O1xuXG51dGlsLmluaGVyaXRzKENvbnN0YW50LCBzdXApO1xuXG5mdW5jdGlvbiBDb25zdGFudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cHJlc3Npb24uQ29uc3RhbnQgY3JlYXRlZCBkaXJlY3RseScpO1xufVxuXG52YXIgXyA9IENvbnN0YW50LnByb3RvdHlwZTtcblxuXy5zaW1wbGlmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcblxuXy5hcHBseSA9IGZ1bmN0aW9uICh4KXtcbiAgICByZXR1cm4gdGhpc1snKiddKHgpO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuL0NvbnN0YW50Jyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTnVtZXJpY2FsQ29tcGxleDtcblxudXRpbC5pbmhlcml0cyhOdW1lcmljYWxDb21wbGV4LCBzdXApO1xuXG5mdW5jdGlvbiBOdW1lcmljYWxDb21wbGV4KHJlYWwsIGltYWcpIHtcbiAgICB0aGlzLl9yZWFsID0gcmVhbDtcbiAgICB0aGlzLl9pbWFnID0gaW1hZztcbn1cblxudmFyIF8gPSBOdW1lcmljYWxDb21wbGV4LnByb3RvdHlwZTtcblxuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5fcmVhbCk7XG59O1xuXG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9pbWFnKTtcbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX3JlYWwpLFxuICAgICAgICBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX2ltYWcpXG4gICAgXSk7XG59O1xuXG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwsIC10aGlzLl9pbWFnKTtcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHguX3JlYWwsIHRoaXMuX2ltYWcgKyB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCArJyk7XG4gICAgfVxufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHhbJ0AtJ10oKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCl7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4Ll9yZWFsLCB0aGlzLl9pbWFnIC0geC5faW1hZyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggLScpO1xuICAgIH1cbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4Ll9yZWFsIC0gdGhpcy5faW1hZyAqIHguX2ltYWcsIHRoaXMuX3JlYWwgKiB4Ll9pbWFnICsgdGhpcy5faW1hZyAqIHguX3JlYWwpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4LnZhbHVlLCB0aGlzLl9pbWFnICogeC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IConKTtcbiAgICB9XG59O1xuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX2ltYWcgPT09IDAgJiYgdGhpcy5fcmVhbCA9PT0gMCkge1xuICAgICAgICAvLyBUT0RPOiBQcm92aWRlZCB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbiAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoKHRoaXMuX3JlYWwgKiB4Ll9yZWFsICsgdGhpcy5faW1hZyAqIHguX2ltYWcpL2NjX2RkLCAodGhpcy5faW1hZyAqIHguX3JlYWwgLSB0aGlzLl9yZWFsICogeC5faW1hZykgLyBjY19kZCk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAvIHgudmFsdWUsIHRoaXMuX2ltYWcgLyB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKVsnLyddKHgpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpWycvJ10oeCk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggLycpO1xuICAgIH1cbn07XG5cbl9bJyEnXSA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodGhpcyk7XG59O1xuXG4vLyAoZnVuY3Rpb24oKXtcbi8vICAgICByZXR1cm47XG4vLyAgICAgdmFyIG9uZV9vbl9ydDIgPSAxL01hdGguc3FydCgyKTtcbi8vICAgICBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob3BlcmF0b3IsIHgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcil7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvLyBDb250cmFkaWN0cyB4XjAgPSAxXG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHguYXBwbHkoJ0AtJyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAxICYmIHRoaXMuX2ltYWcgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgLy9Ob3RlOiBUaGVyZSBpcyBub3QgbWVhbnQgdG8gYmUgYSBicmVhayBoZXJlLlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvL0NvbnRyYWRpY3MgeC8wID0gSW5maW5pdHlcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgaWYgKG9wZXJhdG9yID09PSAnLCcpIHtcbi8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgeF0pO1xuLy8gICAgICAgICB9IGVsc2UgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ0ArJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnQC0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgtdGhpcy5fcmVhbCwgLXRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ1xcdTIyMUEnOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnT0xEIFNRUlQuIE5ldyBvbmUgaXMgYSBmdW5jdGlvbiwgbm90IG9wZXJhdG9yLicpXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHAsIHEpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysrJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICctLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3IoJ1Bvc3RmaXggJyArb3BlcmF0b3IgKyAnIG9wZXJhdG9yIGFwcGxpZWQgdG8gdmFsdWUgdGhhdCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJys9Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICctPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKj0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy89Jzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFJlZmVyZW5jZUVycm9yKCdMZWZ0IHNpZGUgb2YgYXNzaWdubWVudCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgMSwgdGhpcy5faW1hZykpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC52YWx1ZSwgdGhpcy5faW1hZyAqIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC52YWx1ZSwgdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAvIHgudmFsdWUsIHRoaXMuX2ltYWcgLyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMuX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjID0geC52YWx1ZTtcblxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphICsgYipiKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMihiLCBhKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSB0aGV0YSAqIGM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgICAgICAvLyAoYStiaSkoYytkaSkgPSAoYWMtYmQpICsgKGFkK2JjKWkgXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4Ll9yZWFsIC0gdGhpcy5faW1hZyAqIHguX2ltYWcsIHRoaXMuX3JlYWwgKiB4Ll9pbWFnICsgdGhpcy5faW1hZyAqIHguX3JlYWwpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC5fcmVhbCwgdGhpcy5faW1hZyArIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC5fcmVhbCwgdGhpcy5faW1hZyAtIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgICAgICAvLyAgKGErYmkpLyhjK2RpKSBcbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFsoYStiaSkoYy1kaSldL1soYytkaSkoYy1kaSldXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbKGErYmkpKGMtZGkpXS9bY2MgKyBkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFthYyAtZGFpICtiY2kgKyBiZF0vW2NjK2RkXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gW2FjICsgYmQgKyAoYmMgLSBkYSldL1tjYytkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoKHRoaXMuX3JlYWwgKiB4Ll9yZWFsICsgdGhpcy5faW1hZyAqIHguX2ltYWcpL2NjX2RkLCAodGhpcy5faW1hZyAqIHguX3JlYWwgLSB0aGlzLl9yZWFsKnguX2ltYWcpL2NjX2RkKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMuX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjID0geC5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEgKyBiKmIpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGIsIGEpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQgKyB0aGV0YSAqIGM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjIC0gdGhldGEgKiBkKTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NtcGx4IC4gJyArIG9wZXJhdG9yICsgJyA9PiBFLkxpc3Q/Jyk7XG4vLyAgICAgICAgIC8qXG4vLyAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAuMCAmJiB0aGlzLl9pbWFnID09PSAwLjApe1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgKi9cbiAgICAgICAgXG4gICAgICAgIFxuLy8gICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICB9XG4gICAgXG4vLyB9KCkpO1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsQ29tcGxleCcpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLycpO1xubW9kdWxlLmV4cG9ydHMgPSBOdW1lcmljYWxSZWFsO1xuXG51dGlsLmluaGVyaXRzKE51bWVyaWNhbFJlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIE51bWVyaWNhbFJlYWwoZSkge1xuICAgIHRoaXMudmFsdWUgPSBlO1xufVxuXG52YXIgXyA9IE51bWVyaWNhbFJlYWwucHJvdG90eXBlO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoXywgXCJfcmVhbFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbn0pO1xuXy5faW1hZyA9IDA7XG5cbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBHbG9iYWwuWmVybztcbn07XG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpcyxcbiAgICAgICAgR2xvYmFsLlplcm9cbiAgICBdKTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgeC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAtIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnQC0nXSgpWycrJ10odGhpcyk7XG59O1xuXG5cbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIG5vbnJlYWwgPSAnVGhlIG1vZHVsYXIgYXJpdGhtZXRpYyBvcGVyYXRvciBcXCclXFwnIGlzIG5vdCBkZWZpbmVkIGZvciBub24tcmVhbCBudW1iZXJzLic7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgJSB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgdGhyb3coJ05vdCBzdXJlIGFib3V0IHRoaXMuLi4nKTtcbiAgICAgICAgLy8gTm90IHN1cmUgYWJvdXQgdGhpc1xuICAgICAgICAvLyByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7ICAgIFxuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCAlJyk7XG4gICAgfVxufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAqIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgaWYoeC52YWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIGJ5IHplcm8gbm90IGFsbG93ZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLyB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCgodGhpcy52YWx1ZSAqIHguX3JlYWwpL2NjX2RkLCAoLXRoaXMudmFsdWUgKiB4Ll9pbWFnKSAvIGNjX2RkKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGEvKHgreWkpID0gYS8oeCt5aSkgKHgteWkpLyh4LXlpKSA9IGEoeC15aSkgLyAoeF4yICsgeV4yKVxuICAgICAgICB2YXIgeF9jb25qID0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgeFswXSxcbiAgICAgICAgICAgIHhbMV1bJ0AtJ10oKVxuICAgICAgICBdKTtcbiAgICAgICAgdmFyIHR3byA9IE51bWVyaWNhbFJlYWwoMik7XG4gICAgICAgIHJldHVybiB4X2NvbmpbJyonXSh0aGlzKVsnLyddKFxuICAgICAgICAgICAgKHhbMF1bJ14nXSkodHdvKVxuICAgICAgICAgICAgWycrJ10gKFxuICAgICAgICAgICAgICAgICh4WzFdWydeJ10pKHR3bylcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAvLyB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgXG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICAvLyBUT0RPOiBnaXZlbiB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgLy8gVE9ETzogZ2l2ZW4geCAhPSAwXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QpIHsgICBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Vua25vd24gdHlwZTogJywgdGhpcywgeCk7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsIC8nKTtcbiAgICB9XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh0aGlzLnZhbHVlID09PSAxKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLk9uZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHguYSkpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC52YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IFRoaXMgd2lsbCBwcm9kdWNlIHVnbHkgZGVjaW1hbHMuIE1heWJlIHdlIHNob3VsZCBleHByZXNzIGl0IGluIHBvbGFyIGZvcm0/IVxuICAgICAgICAvLyAgICAgIDwtIEkgdGhpbmsgbm8sIGJlY2F1c2Ugd2h5IGVsc2Ugc3RhcnQgd2l0aCBhIG51bWVyaWNhbC4gSW1wbGVtZW50IGEgcmF0aW9uYWwvaW50ZWdlciB0eXBlXG4gICAgICAgIHZhciByID0gTWF0aC5wb3coLXRoaXMudmFsdWUsIHgudmFsdWUpO1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLlBJICogeC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgICAgIG5ldyBOdW1lcmljYWxSZWFsKHIpLFxuICAgICAgICAgICAgbmV3IE51bWVyaWNhbFJlYWwodGhldGEpXG4gICAgICAgIF0pO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcbiAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JhZCBpbXBsZW1lbnRhdGlvbiAoIG51bSBeIGNvbXBsZXgpJyk7XG4gICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEpO1xuICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQ7XG4gICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4gICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGNvbnNvbGUuZXJyb3IgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgXicsIHgsIHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKTtcbiAgICB9XG59O1xuX1snPiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPiB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJz4nXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJzwnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDwgeC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc8J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc8PSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPD0geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc8PSddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPj0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID49IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPj0nXS5jYWxsKHRoaXMsIHgpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHZhciBudW0gPSB0aGlzLnZhbHVlLnRvRXhwb25lbnRpYWwoKTtcbiAgICAgICAgaWYobnVtLmluZGV4T2YoJy4nKSA9PT0gLTEpe1xuICAgICAgICAgICAgbnVtID0gbnVtLnJlcGxhY2UoJ2UnLCcuZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZShudW0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy52YWx1ZS50b1N0cmluZygpKTtcbn07XG4vLyBfLmFwcGx5T2xkID0gZnVuY3Rpb24ob3BlcmF0b3IsIHgpIHtcbi8vICAgICBzd2l0Y2ggKG9wZXJhdG9yKXtcbi8vICAgICAgICAgY2FzZSAnLCc6XG4vLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbi8vICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvLyBDb250cmFkaWN0cyB4XjAgPSAxXG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHguYXBwbHkoJ0AtJyk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMSl7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAvL05vdGU6IFRoZXJlIGlzIG5vdCBtZWFudCB0byBiZSBhIGJyZWFrIGhlcmUuXG4vLyAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvL0NvbnRyYWRpY3MgeC8wID0gSW5maW5pdHlcbi8vICAgICAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgaWYoeCA9PT0gdW5kZWZpbmVkKXtcbi8vICAgICAgICAgLy9VbmFyeVxuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICdAKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgICAgICBjYXNlICdALSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0tJzpcbi8vICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKCdQb3N0Zml4ICcgK29wZXJhdG9yICsgJyBvcGVyYXRvciBhcHBsaWVkIHRvIHZhbHVlIHRoYXQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgIGNhc2UgJys9Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJy09Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJyo9Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJy89Jzpcbi8vICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgUmVmZXJlbmNlRXJyb3IoJ0xlZnQgc2lkZSBvZiBhc3NpZ25tZW50IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIDEpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAqIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC0geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAvIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHgudmFsdWUpKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUaGlzIHdpbGwgcHJvZHVjZSB1Z2x5IGRlY2ltYWxzLiBNYXliZSB3ZSBzaG91bGQgZXhwcmVzcyBpdCBpbiBwb2xhciBmb3JtPyFcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnBvdygtdGhpcy52YWx1ZSwgeC52YWx1ZSlcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5QSSAqIHgudmFsdWU7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHIqTWF0aC5jb3ModGhldGEpLCByKk1hdGguc2luKHRoZXRhKSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlICogeC5fcmVhbCwgdGhpcy52YWx1ZSAqIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSAtIHguX3JlYWwsIC14Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoKHRoaXMudmFsdWUgKiB4Ll9yZWFsKS9jY19kZCwgKC10aGlzLnZhbHVlKnguX2ltYWcpL2NjX2RkKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcbi8vICAgICAgICAgICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JhZCBpbXBsZW1lbnRhdGlvbiAoIG51bSBeIGNvbXBsZXgpJyk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkO1xuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXS5hcHBseShvcGVyYXRvciwgdGhpcylcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignaW5lZmZlY2llbnQ6IE5SIF4gQ0wnKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKGErYmkpK0FlXihpaylcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIC8vIG9yID8gcmV0dXJuIHRoaXMuYXBwbHkob3BlcmF0b3IsIHgucmVhbGltYWcoKSk7IC8vSnVtcCB1cCB0byBhYm92ZSArLVxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ04oMCkgXiB4Jyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAobmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsKC10aGlzLnZhbHVlKSkuYXBwbHkoJ14nLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5waS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdOKDApIF4geCcpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoWyhuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSkpLCB4XSwgJ14nKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5waS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vICAgICB0aHJvdygnPz8gLSByZWFsJyk7XG4vLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vIH07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxSZWFsJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmF0aW9uYWw7XG5cbnV0aWwuaW5oZXJpdHMoUmF0aW9uYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIFJhdGlvbmFsKGEsIGIpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMuYiA9IGI7XG59XG5cbnZhciBfID0gUmF0aW9uYWwucHJvdG90eXBlO1xuXG5cbl8uX19kZWZpbmVHZXR0ZXJfXyhcInZhbHVlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hIC8gdGhpcy5iO1xufSk7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgKyB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU3dhcHBlZCBvcGVyYXRvciBvcmRlciBmb3IgKyB3aXRoIFJhdGlvbmFsJyk7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICAgICAgLy8gdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFJhdGlvbmFsICsnKTtcbiAgICB9XG4gICAgXG4gICAgXG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgLSB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSAtIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1N3YXBwZWQgb3BlcmF0b3Igb3JkZXIgZm9yIC0gd2l0aCBSYXRpb25hbCcpO1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgICAgIC8vIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBSYXRpb25hbCArJyk7XG4gICAgfVxufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5hLCB0aGlzLmIgKiB4LmIpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RveXBlWycqJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cblxuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIGlmICh4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBCeSBaZXJvIGlzIG5vdCBkZWZpbmVkIGZvciBSYXRpb25hbCBudW1iZXJzIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5iLCB0aGlzLmIgKiB4LmEpLnJlZHVjZSgpO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnLyddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IHRoaXMuYikge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5hLCB4LmEpLFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5iLCB4LmEpXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgUmF0aW9uYWwpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBmID0geC5yZWR1Y2UoKTtcbiAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5wb3coTWF0aC5wb3codGhpcy5hLCBmLmEpLCAxIC8gZi5iKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgeFxuICAgICAgICApO1xuICAgICAgICBcbiAgICB9XG5cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICBcbn07XG5cbl8ucmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIG11dGFibGUuXG4gICAgZnVuY3Rpb24gZ2NkKGEsIGIpIHtcbiAgICAgICAgaWYoYiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdjZChiLCBhICUgYik7XG4gICAgfVxuICAgIHZhciBnID0gZ2NkKHRoaXMuYiwgdGhpcy5hKTtcbiAgICB0aGlzLmEgLz0gZztcbiAgICB0aGlzLmIgLz0gZztcbiAgICBpZih0aGlzLmIgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIodGhpcy5hKTtcbiAgICB9XG4gICAgaWYodGhpcy5iIDwgMCkge1xuICAgICAgICB0aGlzLmEgPSAtdGhpcy5hO1xuICAgICAgICB0aGlzLmIgPSAtdGhpcy5iO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgPSByZXF1aXJlKCcuL1JhdGlvbmFsJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZWdlcjtcblxudXRpbC5pbmhlcml0cyhJbnRlZ2VyLCBzdXApO1xuXG5mdW5jdGlvbiBJbnRlZ2VyKHgpIHtcbiAgICB0aGlzLmEgPSB4O1xufVxuXG52YXIgXyA9IEludGVnZXIucHJvdG90eXBlO1xuXG5fLmIgPSAxO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICsgeC5hKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgLSB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnLSddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIGlmKHRoaXMuYSAlIHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAvIHguYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBzdXAodGhpcy5hLCB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnLyddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgSW50ZWdlcigtdGhpcy5hKTtcbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKiB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcblxuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKE1hdGgucG93KHRoaXMuYSwgeC5hKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBzdXApIHtcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnBvdyhNYXRoLnBvdyh0aGlzLmEsIGYuYSksIDEgLyBmLmIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWydeJ10uY2FsbChcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIHhcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5hID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIHhcbiAgICAgICAgICAgIF0sICdeJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICB4XG4gICAgKTtcbiAgICBcbn07XG5cbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAlIHguYSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBzdXApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBzdXAoKTsvLyBAdG9kbzogIVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMgJSB4LnZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH1cbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkgKyAnLjAnKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMuYS50b1N0cmluZygpKTtcbn07XG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHMsIGJhc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHMgPT09ICcnIHx8IHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBcbiAgICB2YXIgcm9vdCA9IE9iamVjdC5jcmVhdGUoe30pO1xuICAgIHZhciBjb250ZXh0ID0gcm9vdDtcbiAgICBcbiAgICB2YXIgZnJlZSA9IHt9O1xuICAgIHZhciBib3VuZCA9IHt9O1xuICAgIFxuICAgIGZ1bmN0aW9uIGRvd24odmFycykge1xuICAgICAgICB2YXIgcGFyZW50ID0gY29udGV4dDtcbiAgICAgICAgY29udGV4dCA9IE9iamVjdC5jcmVhdGUoY29udGV4dCk7XG4gICAgICAgIGNvbnRleHQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSBpbiB2YXJzKSB7XG4gICAgICAgICAgICBpZiAodmFycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHRbaV0gPSB2YXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHVwKGVudGl0eSkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dC4kcGFyZW50O1xuICAgICAgICByZXR1cm4gZW50aXR5O1xuICAgIH1cbiAgICAvKlxuICAgICAgICBFdmFsdWF0ZSBBU1QgdHJlZSAodG9wLWRvd24pXG4gICAgICAgIFxuICAgICAgICBFeGFtcGxlczpcbiAgICAgICAgICAgICogeT14XjJcbiAgICAgICAgICAgICAgICBbJz0nLCB5LCBbJ14nLCB4LCAyXV1cbiAgICBcbiAgICAqL1xuICAgIHZhciBsb29zZSA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIGV2YWx1YXRlKGFzdCkge1xuICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciBzeW1ib2w7XG4gICAgICAgICAgICBpZiAoKHN5bWJvbCA9IGNvbnRleHRbYXN0XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgoc3ltYm9sID0gYmFzZVthc3RdKSkge1xuICAgICAgICAgICAgICAgIGJvdW5kW2FzdF0gPSBzeW1ib2w7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyZWVbYXN0XSA9IHN5bWJvbCA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKGFzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb290W2FzdF0gPSBzeW1ib2w7XG4gICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICB9IGVsc2UgaWYgKGFzdC5wcmltaXRpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLkNvbnN0cnVjdFthc3QudHlwZV0oYXN0LnByaW1pdGl2ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFzdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGFzdDEgPSBldmFsdWF0ZShhc3RbMV0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoYXN0Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXN0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZyYWMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXN0WzBdID0gJy8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ18nOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYmluZCB1bmRlcm5lYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXN0WzFdID09PSAnc3VtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IGFzdFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGltaXRbMF0gPT09ICc9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkdW1teSB2YXJpYWJsZTogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwobGltaXRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG93ZXIgbGltaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBldmFsdWF0ZShsaW1pdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdW1taW5hdG9yID0gbmV3IEV4cHJlc3Npb24uU3VtLlJlYWwoeCwgYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1pbmF0b3IudmFycyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1taW5hdG9yLnZhcnNbeC5zeW1ib2xdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1bW1pbmF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhc3RbMF0gPT09ICdkZWZhdWx0JyAmJiBhc3QxLnZhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG93bihhc3QxLnZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFzdDFbYXN0WzBdXShldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXN1bHQudmFycztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVwKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhc3QxW2FzdFswXV0oZXZhbHVhdGUoYXN0WzJdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXN0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXN0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NxcnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5zcXJ0LmRlZmF1bHQoZXZhbHVhdGUoYXN0WzFdKSk7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyEnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5mYWN0b3JpYWwuZGVmYXVsdChldmFsdWF0ZShhc3RbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZhbHVhdGUoYXN0WzFdKVthc3RbMF1dKGV2YWx1YXRlKGFzdFsxXSksIGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3Q7XG4gICAgfVxuICAgIFxuICAgIFxuICAgIC8vIFBhcnNlIHVzaW5nIGNvbnRleHQgZnJlZSBncmFtbWFyIChbZ3JhcGhdL2dyYW1tYXIvY2FsY3VsYXRvci5qaXNvbilcbiAgICB2YXIgYXN0ID0gdGhpcy5jZmcucGFyc2Uocyk7XG4gICAgdmFyIHJlc3VsdCA9IGV2YWx1YXRlKGFzdCk7XG4gICAgcmVzdWx0Ll9hc3QgPSBhc3Q7XG4gICAgaWYgKHJvb3QgIT09IGNvbnRleHQpIHtcbiAgICAgICAgdGhyb3coJ0NvbnRleHQgc3RpbGwgb3BlbicpO1xuICAgIH1cbiAgICBcbiAgICByZXN1bHQudW5ib3VuZCA9IGZyZWU7XG4gICAgcmVzdWx0LmJvdW5kID0gYm91bmQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuXG51dGlsLmluaGVyaXRzKExpc3QsIHN1cCk7XG5cbi8qXG4gICAgRXhwcmVzc2lvbi5MaXN0IHNob3VsZCBiZSBhdm9pZGVkIHdoZW5ldmVyIEV4cHJlc3Npb24uTGlzdC5SZWFsIGNhblxuICAgIGJlIHVzZWQuIEhvd2V2ZXIsIGtub3dpbmcgd2hlbiB0byB1c2UgUmVhbCBpcyBhbiBpbXBvc3NpYmxlICg/KSB0YXNrLFxuICAgIHNvIHNvbWV0aW1lcyB0aGlzIHdpbGwgaGF2ZSB0byBkbyBhcyBhIGZhbGxiYWNrLlxuKi9cbmZ1bmN0aW9uIExpc3QoZSwgb3BlcmF0b3IpIHtcbiAgICBlLl9fcHJvdG9fXyA9IEV4cHJlc3Npb24uTGlzdC5wcm90b3R5cGU7XG4gICAgZS5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIHJldHVybiBlO1xufVxuXG5MaXN0LnByb3RvdHlwZS5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbC5wcm90b3R5cGUuX3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgdGhyb3cobmV3IEVycm9yKCdVc2UgcmVhbCgpLCBpbWFnKCksIG9yIGFicygpLCBvciBhcmcoKSBmaXJzdC4nKSk7XG59O1xuXG5MaXN0LnByb3RvdHlwZS5zdWIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHZhciBhID0gdGhpc1swXS5zdWIoeCwgeSk7XG4gICAgdmFyIGIgPSB0aGlzWzFdICYmIHRoaXNbMV0uc3ViKHgsIHkpO1xuXG4gICAgcmV0dXJuIGFbdGhpcy5vcGVyYXRvciB8fCAnZGVmYXVsdCddKGIpO1xufTtcblxuTGlzdC5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGYpIHtcbiAgICB2YXIgZWxlbWVudHMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpcywgZik7XG4gICAgcmV0dXJuIGVsZW1lbnRzWzBdW3RoaXMub3BlcmF0b3IgfHwgJ2RlZmF1bHQnXS5hcHBseSh0aGlzLCBlbGVtZW50cy5zbGljZSgxKSk7XG59OyIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2w7XG5cbnV0aWwuaW5oZXJpdHMoU3ltYm9sLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2woc3RyKSB7XG4gICAgdGhpcy5zeW1ib2wgPSBzdHI7XG59XG5cbnZhciBfID0gU3ltYm9sLnByb3RvdHlwZTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpcyA9PT0geCA/IEdsb2JhbC5PbmUgOiBHbG9iYWwuWmVybztcbn07XG5fLmludGVncmF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMgPT09IHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMC41LCAwKSBbJyonXSAoeCBbJ14nXSAobmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgyLDApKSk7XG4gICAgfVxuICAgIHJldHVybiAodGhpcykgWycqJ10gKHgpO1xufTtcbl8uc3ViID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAvLyBUT0RPOiBFbnN1cmUgaXQgaXMgcmVhbCAoZm9yIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpXG4gICAgcmV0dXJuIHRoaXMgPT09IHggPyB5IDogdGhpcztcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgeCkge1xuICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLnN5bWJvbCB8fCAneF97ZnJlZX0nKTtcbn07XG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG5mdW5jdGlvbiBUcnV0aFZhbHVlKHYpIHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlbWVudDtcblxudXRpbC5pbmhlcml0cyhUcnV0aFZhbHVlLCBzdXApO1xudXRpbC5pbmhlcml0cyhTdGF0ZW1lbnQsIHN1cCk7XG5cbnZhciBfID0gVHJ1dGhWYWx1ZS5wcm90b3R5cGU7XG5cbnZhciBUcnVlID0gVHJ1dGhWYWx1ZS5UcnVlID0gbmV3IFRydXRoVmFsdWUoKTtcbnZhciBGYWxzZSA9IFRydXRoVmFsdWUuRmFsc2UgPSBuZXcgVHJ1dGhWYWx1ZSgpO1xuXG4vL09ubHkgZGlmZmVyZW5jZTogTk9UIG9wZXJhdG9yXG5GYWxzZVsnfiddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUcnVlO1xufTtcblxuLy8gbmVnYXRpb24gb3BlcmF0b3Jcbl9bJ34nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gRmFsc2U7XG59O1xuXG4vLyBkaXNqdW5jdGlvblxuXy5WID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSA9PT0gVHJ1ZSA/IGUgOiB0aGlzO1xufTtcblxuLy8gY29uanVuY3Rpb25cbl9bJ14nXSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUgPT09IFRydWUgPyB0aGlzIDogZTtcbn07XG5cblxuZnVuY3Rpb24gU3RhdGVtZW50KHgsIHksIG9wZXJhdG9yKSB7XG4gICAgdGhpcy5hID0geDtcbiAgICB0aGlzLmIgPSB5O1xuXG4gICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xufVxuXG52YXIgXyA9IFN0YXRlbWVudC5wcm90b3R5cGU7XG5fWyc9J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgXG59O1xuX1snPCddID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGEgPCBiIDwgY1xuICAgIC8vIChhIDwgYikgPSBiXG4gICAgLy8gYiA8IGNcbiAgICBcbiAgICAvLyBhIDwgKGIgPCBjKVxuICAgIC8vIGEgPCBiIC4uIChiIDwgYykgPSBiXG4gICAgLy8gKGEgPCBiKSA9IGEuXG59O1xuXy5zb2x2ZSA9IGZ1bmN0aW9uICh2YXJzKSB7XG4gICAgLy8gYSA9IGJcbiAgICAvLyBJZiBiIGhhcyBhbiBhZGRpdGl2ZSBpbnZlcnNlP1xuICAgIFxuICAgIC8vIGEgLSBiID0gMFxuICAgIHZhciBhX2IgPSAodGhpcy5hKVsnLSddKHRoaXMuYik7XG4gICAgLypcbiAgICBFeGFtcGxlczpcbiAgICAoMSwyLDMpIC0gKHgseSx6KSA9IDAgKHNvbHZlIGZvciB4LHkseilcbiAgICAoMSwyLDMpIC0geCA9IDAgKHNvbHZlIGZvciB4KVxuICAgICovXG4gICAgcmV0dXJuIGFfYi5yb290cyh2YXJzKTtcbn07XG4iLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7XG5cbmZ1bmN0aW9uIE1hdHJpeChlLCByLCBjKSB7XG4gICAgZS5fX3Byb3RvX18gPSBNYXRyaXgucHJvdG90eXBlO1xuXG4gICAgZS5yb3dzID0gcjtcbiAgICBlLmNvbHMgPSBjO1xuXG4gICAgaWYgKHIgIT0gYykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01hdHJpeCBzaXplIG1pc21hdGNoJylcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhNYXRyaXgsIHN1cCk7XG5cbnZhciBfID0gTWF0cml4LnByb3RvdHlwZTtcblxuXy5kZWZhdWx0ID0gX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk1hdHJpeCkge1xuICAgICAgICAvLyBCcm9rZW5cbiAgICAgICAgLy8gTyhuXjMpXG4gICAgICAgIGlmICh4LnJvd3MgIT09IHRoaXMuY29scykge1xuICAgICAgICAgICAgdGhyb3cgKCdNYXRyaXggZGltZW5zaW9ucyBkbyBub3QgbWF0Y2guJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAvLyByZXN1bHRbeC5yb3dzICogeC5jb2xzIC0gMSBdID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgaSwgaiwgaywgciA9IDA7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJvd3M7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHguY29sczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgICAgIGZvcihrID0gMDsgayA8IHgucm93czsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSA9IHN1bVsnKyddKHhbayAqIHguY29scyArIGpdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0W3IrK10gPSBzdW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTWF0cml4KHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIHR5cGUnKTtcbiAgICB9XG59O1xuXG5fLnJlZHVjZSA9IGZ1bmN0aW9uIChhcHApIHtcbiAgICB2YXIgeCwgeTtcbiAgICBmb3IoeSA9IDA7IHkgPCB0aGlzLnJvd3M7IHkrKykge1xuICAgICAgICBmb3IoeCA9IDA7IHggPCB5OyB4KyspIHtcbiAgICAgICAgICAgIC8vIE1ha2UgdGhpc1t4LHldID0gMFxuICAgICAgICAgICAgdmFyIG1hID0gdGhpc1t4ICogdGhpcy5jb2xzICsgeF07XG4gICAgICAgICAgICAvLyAwID0gdGhpcyAtICh0aGlzL21hKSAqIG1hXG4gICAgICAgICAgICBpZihtYSA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoJ1JvdyBzd2FwIScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtYSA9IHRoaXNbeSAqIHRoaXMuY29scyArIHhdWycvJ10obWEpO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSB4ICsgMTsgaSA8IHRoaXMuY29sczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpc1t5ICogdGhpcy5jb2xzICsgaV0gPSB0aGlzW3kgKiB0aGlzLmNvbHMgKyBpXVsnLSddKHRtYVsnKiddKHRoaXNbeCAqIHRoaXMuY29scyArIGldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4iLCIoZnVuY3Rpb24oKXsvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcblxuZnVuY3Rpb24gVmVjdG9yKGUpIHtcbiAgICBlLl9fcHJvdG9fXyA9IFZlY3Rvci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIGU7XG59XG5cbnV0aWwuaW5oZXJpdHMoVmVjdG9yLCBzdXApO1xuXG52YXIgXyA9IFZlY3Rvci5wcm90b3R5cGU7XG5cbl9bJywuJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLmNvbmNhdC5jYWxsKHRoaXMsIFt4XSkpO1xufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gYy5kaWZmZXJlbnRpYXRlKHgpO1xuICAgIH0pKTtcbn07XG5fLmNyb3NzID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5sZW5ndGggIT09IDMgfHwgeC5sZW5ndGggIT09IDMpIHtcbiAgICAgICAgdGhyb3coJ0Nyb3NzIHByb2R1Y3Qgb25seSBkZWZpbmVkIGZvciAzRCB2ZWN0b3JzLicpO1xuICAgIH1cbiAgICAvKlxuICAgIGkgICBqICAgIGtcbiAgICB4ICAgeSAgICB6XG4gICAgYSAgIGIgICAgY1xuICAgIFxuICAgID0gKHljIC0gemIsIHphIC0geGMsIHhiIC0geWEpXG4gICAgKi9cbiAgICBcbiAgICByZXR1cm4gbmV3IFZlY3RvcihbXG4gICAgICAgIHRoaXNbMV0uZGVmYXVsdCh4WzJdKVsnLSddKHRoaXNbMl0uZGVmYXVsdCh4WzFdKSksXG4gICAgICAgIHRoaXNbMl0uZGVmYXVsdCh4WzBdKVsnLSddKHRoaXNbMF0uZGVmYXVsdCh4WzJdKSksXG4gICAgICAgIHRoaXNbMF0uZGVmYXVsdCh4WzFdKVsnLSddKHRoaXNbMV0uZGVmYXVsdCh4WzBdKSlcbiAgICBdKTtcbn07XG5cbi8vIGNyb3NzUHJvZHVjdCBpcyB0aGUgJyZ0aW1lczsnIGNoYXJhY3RlclxudmFyIGNyb3NzUHJvZHVjdCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjE1KTtcblxuX1tjcm9zc1Byb2R1Y3RdID0gXy5jcm9zcztcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIFZlY3Rvcikge1xuICAgICAgICAvLyBEb3QgcHJvZHVjdFxuICAgICAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBzdW0gPSBHbG9iYWwuWmVybztcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgc3VtID0gc3VtWycrJ10oXG4gICAgICAgICAgICAgICAgKHRoaXNbaV0pLmRlZmF1bHQoeFtpXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1bTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgcmV0dXJuIGMuYXBwbHkoeCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG59O1xuX1snKiddID0gXy5kZWZhdWx0O1xuX1snKyddID0gZnVuY3Rpb24gKHgsIG9wKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyhuZXcgTWF0aEVycm9yKCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIG4gPSBuZXcgQXJyYXkobCk7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuW2ldID0gdGhpc1tpXVtvcCB8fCAnKyddKHhbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKG4pO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJysnXSh4LCAnLScpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICAgICAgdGhyb3coJ1ZlY3RvciBkaXZpc2lvbiBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gY1snLyddKHgpO1xuICAgIH0pKTtcbiAgICBcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnUmFpc2VkIHRvIHplcm8gcG93ZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZih4LmEgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4LmEgPT09IDIpIHtcbiAgICAgICAgICAgIHZhciBTID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICB2YXIgaSwgbCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIFMgPSBTWycrJ10odGhpc1tpXVsnXiddKHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBTO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ14nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHguYSAtIDEpKVsnKiddKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ14nXSh4LmEpWydeJ10oR2xvYmFsLk9uZVsnLyddKHguYikpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgVmVjdG9yIF4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdCh0aGlzWydeJ10oeFsnLSddKEdsb2JhbC5PbmUpKSk7XG59O1xuXG5fLm9sZF9hcHBseV9vcGVyYXRvciA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICAgICAgLy9BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICAgICAgLy9GYXN0ZXI6XG4gICAgICAgICAgICAvL01PRElGSUVTISEhISEhISEhXG4gICAgICAgICAgICB0aGlzW2xdID0gZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSAnKic6XG4gICAgICAgICAgICBpZihsICE9PSBlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1bSA9IE0uR2xvYmFsLlplcm87XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtLmFwcGx5KCcrJywgdGhpc1tpXS5hcHBseSgnKicsIGVbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdW07XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgIGlmKGwgIT09IGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IG5ldyBBcnJheShsKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuW2ldID0gdGhpc1tpXS5hcHBseShvcGVyYXRvciwgZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVmVjdG9yKG4pO1xuICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93KCdWZWN0b3Igb3BlcmF0aW9uIG5vdCBhbGxvd2VkLicpO1xuICAgIH1cbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIF94ID0gbmV3IEFycmF5KGwpO1xuICAgIHZhciBfeSA9IG5ldyBBcnJheShsKTtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHJpID0gdGhpc1tpXS5yZWFsaW1hZygpO1xuICAgICAgICBfeFtpXSA9IHJpWzBdO1xuICAgICAgICBfeVtpXSA9IHJpWzFdO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBWZWN0b3IoX3gpLFxuICAgICAgICBWZWN0b3IoX3kpXG4gICAgXSk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24oQ29kZSwgbGFuZykge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIG9wZW4gPSAnWyc7XG4gICAgdmFyIGNsb3NlID0gJ10nO1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBvcGVuID0gJ3ZlYycgKyB0aGlzLmxlbmd0aCArICcoJztcbiAgICAgICAgY2xvc2UgPSAnKSc7XG4gICAgfVxuICAgIHZhciBjID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICB2YXIgaTtcbiAgICB2YXIgdF9zID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgY19pID0gdGhpc1tpXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgdF9zLnB1c2goY19pLnMpO1xuICAgICAgICBjID0gYy5tZXJnZShjX2kpO1xuICAgIH1cbiAgICByZXR1cm4gYy51cGRhdGUob3BlbiArIHRfcy5qb2luKCcsJykgKyBjbG9zZSwgSW5maW5pdHkpO1xufTtcbn0pKCkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVGdW5jdGlvbjtcblxudXRpbC5pbmhlcml0cyhFRnVuY3Rpb24sIHN1cCk7XG5cbmZ1bmN0aW9uIEVGdW5jdGlvbiAocCkge1xuICAgIHRoaXMuZGVmYXVsdCA9IHAuZGVmYXVsdDtcbiAgICB0aGlzWyd0ZXh0L2xhdGV4J10gPSAocFsndGV4dC9sYXRleCddKTtcbiAgICB0aGlzWyd4LXNoYWRlci94LWZyYWdtZW50J10gPSAocFsneC1zaGFkZXIveC1mcmFnbWVudCddKTtcbiAgICB0aGlzWyd0ZXh0L2phdmFzY3JpcHQnXSA9IChwWyd0ZXh0L2phdmFzY3JpcHQnXSk7XG4gICAgdGhpcy5kZXJpdmF0aXZlID0gcC5kZXJpdmF0aXZlO1xuICAgIHRoaXMucmVhbGltYWcgPSBwLnJlYWxpbWFnO1xufTtcblxudmFyIF8gPSBFRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4vLyBAYWJzdHJhY3Rcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uIChhcmd1bWVudCkge1xuICAgIHJldHVybjtcbn07XG5cbi8vIEBhYnN0cmFjdFxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmRlcml2YXRpdmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVyaXZhdGl2ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFRnVuY3Rpb24gaGFzIG5vIGRlcml2YXRpdmUgZGVmaW5lZC4nKTtcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmICh0aGlzW2xhbmddKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSh0aGlzW2xhbmddKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgY29tcGlsZSBmdW5jdGlvbiBpbnRvICcgKyBsYW5nKTtcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGEgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2woKTtcbiAgICByZXR1cm4gbmV3IEVGdW5jdGlvbi5TeW1ib2xpYyh0aGlzLmRlZmF1bHQoYSlbJysnXSh4KSwgW2FdKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBhID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sKCk7XG4gICAgcmV0dXJuIG5ldyBFRnVuY3Rpb24uU3ltYm9saWModGhpcy5kZWZhdWx0KGEpWydALSddKCksIFthXSk7XG59O1xuXG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCAgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5maW5pdGVzaW1hbDtcbnV0aWwuaW5oZXJpdHMoSW5maW5pdGVzaW1hbCwgc3VwKTtcbmZ1bmN0aW9uIEluZmluaXRlc2ltYWwoeCkge1xuICAgIHRoaXMueCA9IHg7XG59XG52YXIgXyA9IEluZmluaXRlc2ltYWwucHJvdG90eXBlO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBhZGRpdGlvbicpO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54LmRpZmZlcmVudGlhdGUoeC54KTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbmZ1c2luZyBpbmZpdGVzaW1hbCBkaXZpc2lvbicpO1xuICAgIH1cbiAgICB0aGlzLnggPSB0aGlzLnhbJy8nXSh4KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIC8vIGReMiA9IDBcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIHRoaXMueCA9IHRoaXMueFsnKiddKHgpO1xufTtcbl8ucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgaWYobGFuZyAhPT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5maW5pdGVzaW1hbCBudW1iZXJzIGNhbm5vdCBiZSBleHBvcnRlZCB0byBwcm9ncmFtbWluZyBsYW5ndWFnZXMnKTtcbiAgICB9XG4gICAgdmFyIGMgPSB0aGlzLngucyhsYW5nKTtcbiAgICB2YXIgcCA9IGxhbmd1YWdlLnByZWNlZGVuY2UoJ2RlZmF1bHQnKVxuICAgIGlmKHAgPiBjLnApIHtcbiAgICAgICAgYy5zID0gJ1xcXFxsZWZ0KCcgKyBjLnMgKyAnXFxcXHJpZ2h0KSc7XG4gICAgfVxuICAgIHJldHVybiBjLnVwZGF0ZSgnZCcgKyBjLnMsIHApO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcbnZhciBnbG9iYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9nbG9iYWwnKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdFJlYWw7XG5cbnV0aWwuaW5oZXJpdHMoTGlzdFJlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIExpc3RSZWFsKHgsIG9wZXJhdG9yKSB7XG4gICAgeC5fX3Byb3RvX18gPSBMaXN0UmVhbC5wcm90b3R5cGU7XG4gICAgaWYob3BlcmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB4Lm9wZXJhdG9yID0gb3BlcmF0b3I7XG4gICAgfVxuICAgIHJldHVybiB4O1xufVxuXG52YXIgXyA9IExpc3RSZWFsLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGdsb2JhbC5aZXJvXG4gICAgXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xufTtcbl8ucG9sYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHN1cC5Db21wbGV4UG9sYXIoW1xuICAgICAgICBzdXAuUmVhbChbZ2xvYmFsLmFicywgdGhpc10pLFxuICAgICAgICBzdXAuUmVhbChbZ2xvYmFsLmFyZywgdGhpc10pXG4gICAgXSk7XG59O1xuXy5hYnMgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gc3VwLlJlYWwoW2dsb2JhbC5hYnMsIHRoaXNdKTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuUmVhbChbZ2xvYmFsLmFyZywgdGhpc10pO1xufTtcbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4geFsnKiddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoMikpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJysnICYmIHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXSwgdGhpc1sxXVsnKyddKHgpXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJy0nICYmIHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXSwgeFsnLSddKHRoaXNbMV0pXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgXG4gICAgaWYoeCBpbnN0YW5jZW9mIHN1cC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG4gICAgXG59O1xuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmICh4ID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBzdXAuUmVhbCkge1xuICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4WzBdXSwgJysnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWyctJ10oeCk7XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gJy8nICYmIHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnKiddKHgpLCB0aGlzWzFdXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt4LCB0aGlzXSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIHN1cC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIGlmICh0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5GdW5jdGlvbikge1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICBcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYoeCA9PT0gdGhpcykge1xuICAgICAgICByZXR1cm4gZ2xvYmFsLk9uZTtcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnLyddKHgpLCB0aGlzWzFdXSwgdGhpcy5vcGVyYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9XG5cbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKVsnLyddKHgpO1xufTtcbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbn07XG5fWydALSddID0gZnVuY3Rpb24gKCkge1xuICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdALScpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbMF07XG4gICAgfVxuICAgIHJldHVybiBzdXAuUmVhbChbdGhpc10sICdALScpO1xufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicgfHwgdGhpcy5vcGVyYXRvciA9PT0gJy8nICYmIHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpc1swXVsnXiddKHgpLCB0aGlzWzFdWydeJ10oeCldLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKHRoaXMsIHgpO1xuICAgIFxufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSAnKycgfHxcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9PT0gJy0nIHx8XG4gICAgICAgIHRoaXMub3BlcmF0b3IgPT09ICdALScpIHtcblxuICAgICAgICByZXR1cm4gdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpW3RoaXMub3BlcmF0b3JdKHRoaXNbMV0gJiYgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpKTtcbiAgICBcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSB1bmRlZmluZWQpIHtcblxuICAgICAgICBpZih0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5GdW5jdGlvbikge1xuXG4gICAgICAgICAgICB2YXIgZGEgPSB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgICAgICAgICBpZihkYSA9PT0gZ2xvYmFsLlplcm8pIHJldHVybiBkYTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSgpLmRlZmF1bHQodGhpc1sxXSlbJyonXShkYSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpc1swXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApWycrJ10odGhpc1sxXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApKTtcblxuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJy8nKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXNbMV1bJyonXShcbiAgICAgICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApWyctJ10oXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oXG4gICAgICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICAgICApXG4gICAgICAgIClbdGhpcy5vcGVyYXRvcl0oXG4gICAgICAgICAgICB0aGlzWzFdWycqJ10odGhpc1sxXSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuXG4gICAgICAgIHZhciBkZiA9IHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KTtcbiAgICAgICAgdmFyIGRnID0gdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpO1xuXG4gICAgICAgIGlmIChkZiA9PT0gZ2xvYmFsLlplcm8pIHtcbiAgICAgICAgICAgIGlmIChkZyA9PT0gZ2xvYmFsLlplcm8pIHJldHVybiBkZztcblxuICAgICAgICAgICAgcmV0dXJuIGRnLmRlZmF1bHQoXG4gICAgICAgICAgICAgICAgZ2xvYmFsLmxvZy5kZWZhdWx0KHRoaXNbMF0pXG4gICAgICAgICAgICApLmRlZmF1bHQodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmEgPSB0aGlzWzBdWydeJ10oXG4gICAgICAgICAgICB0aGlzWzFdWyctJ10oZ2xvYmFsLk9uZSlcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gZmEuZGVmYXVsdChcbiAgICAgICAgICAgIGRmLmRlZmF1bHQodGhpc1sxXSlbJysnXShcbiAgICAgICAgICAgICAgICB0aGlzWzBdWycqJ10oXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbC5sb2cuZGVmYXVsdCh0aGlzWzBdKVxuICAgICAgICAgICAgICAgIClbJyonXShcbiAgICAgICAgICAgICAgICAgICAgZGdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG5cbiAgICB2YXIgbGFuZ3VhZ2UgPSBDb2RlLmxhbmd1YWdlO1xuICAgIGZ1bmN0aW9uIHBhcmVuKHgpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1xcXFxsZWZ0KCcgKyB4ICsgJ1xcXFxyaWdodCknOyBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJygnICsgeCArICcpJztcbiAgICB9XG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IGdsb2JhbC5hYnMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICAgICAgICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnXFxcXGxlZnR8JyArIGMxLnMgKyAnXFxcXHJpZ2h0fCcsIEluZmluaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKGMwLnMgKyAnKCcgKyBjMS5zICsgJyknLCBJbmZpbml0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgaWYgKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3Rvcikge1xuICAgICAgICAgICAgICAgIHZhciBjMXMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpc1sxXSwgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgdmFyIHRfcyA9IGMxcy5tYXAoZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS5zO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IGdsb2JhbC5hdGFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRfcyA9IHRfcy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjMF9zID0gYzAucztcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYzFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGMwLm1lcmdlKGMxc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoYzBfcyArIHBhcmVuKHRfcyksIGxhbmd1YWdlLm9wZXJhdG9ycy5kZWZhdWx0LnByZWNlZGVuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgYzAucyArIHBhcmVuKGMxLnMpLCBsYW5ndWFnZS5vcGVyYXRvcnMuZGVmYXVsdC5wcmVjZWRlbmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSAnKic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHAgPSBsYW5ndWFnZS5vcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0ucHJlY2VkZW5jZTtcbiAgICBmdW5jdGlvbiBfKHgpIHtcbiAgICAgICAgaWYocCA+IHgucCl7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW4oeC5zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geC5zO1xuICAgIH1cblxuICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuXG4gICAgICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gZ2xvYmFsLmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ2V4cCgnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHRoaXNbMV0uYSA8IDUgJiYgdGhpc1sxXS5hID4gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHZhciBqID0gbGFuZ3VhZ2Uub3BlcmF0b3JzWycqJ10ucHJlY2VkZW5jZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcHJlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBjcztcbiAgICAgICAgICAgICAgICBpZih0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgICAgY3MgPSBjMC5zO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjcyA9IGMwLnZhcmlhYmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBwcmUgPSAnZmxvYXQgJyArIGNzICsgJyA9ICcgKyBjMC5zICsgJzsnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcyA9IGNzO1xuICAgICAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgICAgIGZvcihpID0gMTsgaSA8IHRoaXNbMV0uYTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHMrPSAnKicgKyBjcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSgnKCcgKyBzICsgJyknLCBJbmZpbml0eSwgcHJlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgdGhpc1sxXS5hID09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAvLyB0b2RvOiBwcmVjZWRlbmNlIG5vdCBuZWNlc3NhcnlcbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKCcoMS4wLygnICsgYzAucyArICcpKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAvLyBhXjIsIDMsIDQsIDUsIDYgXG4gICAgICAgICAgICAgICAgLy8gdW5zdXJlIGl0IGlzIGdjZFxuICAgICAgICAgICAgICAgIHRoaXNbMV0gPSB0aGlzWzFdLnJlZHVjZSgpO1xuICAgICAgICAgICAgICAgIHZhciBldmVuID0gdGhpc1sxXS5hICUgMiA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZihldmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdwb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICArICcpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB4XihhKSA9ICh4KSAqIHheKGEtMSlcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKGdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLnNfKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBOZWcgb3IgcG9zLlxuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShnbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJytjMS5zKycpKScpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKGdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIE5lZWRzIGEgbmV3IGZ1bmN0aW9uLCBkZXBlbmRlbnQgb24gcG93ZXIuXG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcrYzEucysnKSknKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2UgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IGdsb2JhbC5lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKCdNYXRoLmV4cCgnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgICAgIC8vIGFeMiwgMywgNCwgNSwgNiBcbiAgICAgICAgICAgICAgICB2YXIgZXZlbiA9IHRoaXNbMV0uYSAlIDIgPyBmYWxzZSA6IHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZihldmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIE5lZWRzIGEgbmV3IGZ1bmN0aW9uLCBkZXBlbmRlbnQgb24gcG93ZXIuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2UgaWYgKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jyl7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyAnXicgKyAneycgKyBjMS5zICsgJ30nKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcblxuICAgIGlmKHRoaXMub3BlcmF0b3JbMF0gPT09ICdAJykge1xuICAgICAgICByZXR1cm4gYzAudXBkYXRlKHRoaXMub3BlcmF0b3JbMV0gKyBfKGMwKSwgcCk7XG4gICAgfVxuXG4gICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICBcbiAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJy8nKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdcXFxcZnJhY3snICsgYzAucyArICd9eycgKyBjMS5zICsgJ30nKVxuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArIF8oYzEpLCBwKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICclJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnbW9kKCcgKyBfKGMwKSArICcsJyArIF8oYzEpICsgJyknLCBwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyB0aGlzLm9wZXJhdG9yICsgXyhjMSksIHApO1xufTtcblxuXG59KSgpIiwiLy8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG5cbi8qXG4gICAgVGhpcyB0eXBlIGlzIGFuIGF0dGVtcHQgdG8gYXZvaWQgaGF2aW5nIHRvIGNhbGwgLnJlYWxpbWFnKCkgZG93biB0aGUgdHJlZSBhbGwgdGhlIHRpbWUuXG4gICAgXG4gICAgTWF5YmUgdGhpcyBpcyBhIGJhZCBpZGVhLCBiZWNhdXNlIGl0IHdpbGwgZW5kIHVwIGhhdmluZzpcbiAgICBcbiAgICBmKHgpID0gPlxuICAgIFtcbiAgICAgICAgUmVfZih4KSxcbiAgICAgICAgSW1fZih4KVxuICAgICAgICBcbiAgICBdXG4gICAgd2hpY2ggcmVxdWlyZXMgdHdvIGV2YWx1YXRpb25zIG9mIGYoeCkuXG5cbiovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxleENhcnRlc2lhbjtcblxudXRpbC5pbmhlcml0cyhDb21wbGV4Q2FydGVzaWFuLCBzdXApO1xuXG5mdW5jdGlvbiBDb21wbGV4Q2FydGVzaWFuKHgpIHtcbiAgICB4Ll9fcHJvdG9fXyA9IENvbXBsZXhDYXJ0ZXNpYW4ucHJvdG90eXBlO1xuICAgIHJldHVybiB4O1xufVxuXG52YXIgXyA9IENvbXBsZXhDYXJ0ZXNpYW4ucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpc1swXTtcbn07XG5fLmltYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXNbMV07XG59O1xuXy5jb25qdWdhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdLFxuICAgICAgICB0aGlzWzFdLmFwcGx5KCdALScpXG4gICAgXSk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdWydALSddKCksXG4gICAgICAgIHRoaXNbMV1bJ0AtJ10oKVxuICAgIF0pO1xufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBDb21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIChhK2JpKSAqIChjK2RpKSA9IGFjICsgYWRpICsgYmNpIC0gYmRcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXSh4WzBdKVsnLSddKHRoaXNbMV1bJyonXSh4WzFdKSksXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeFsxXSlbJysnXSh0aGlzWzFdWycqJ10oeFswXSkpXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXSh4KSxcbiAgICAgICAgICAgIHRoaXNbMV1bJyonXSh4KVxuICAgICAgICBdKTtcbiAgICB9XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG5cbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEJpbm9taWFsIGV4cGFuc2lvblxuICAgICAgICAvLyAoYStiKV5OXG4gICAgICAgIHZhciBuICA9IHguYTtcbiAgICAgICAgdmFyIGs7XG4gICAgICAgIHZhciBhID0gdGhpc1swXTtcbiAgICAgICAgdmFyIGIgPSB0aGlzWzFdO1xuICAgICAgICB2YXIgbmVnb25lID0gbmV3IEV4cHJlc3Npb24uSW50ZWdlcigtMSk7XG4gICAgICAgIHZhciBpbWFnX3BhcnQgPSBHbG9iYWwuWmVybztcbiAgICAgICAgXG4gICAgICAgIHZhciByZWFsX3BhcnQgPSBhWydeJ10oXG4gICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKG4pXG4gICAgICAgICk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2kgPSAxO1xuICAgICAgICBcbiAgICAgICAgZm9yIChrID0gMTs7IGsrKykge1xuICAgICAgICAgICAgdmFyIGV4cHI7XG4gICAgICAgICAgICBpZihrID09PSBuKSB7XG4gICAgICAgICAgICAgICAgZXhwciA9IChcbiAgICAgICAgICAgICAgICAgICAgYlsnXiddKFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihrKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoY2kgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgICAgIGNpID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHByID0gYVsnXiddKFxuICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIobiAtIGspXG4gICAgICAgICAgICApWycqJ10oXG4gICAgICAgICAgICAgICAgYlsnXiddKFxuICAgICAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKGspXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChjaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMikge1xuICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMykge1xuICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgICAgIGNpID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHJlYWxfcGFydCxcbiAgICAgICAgICAgIGltYWdfcGFydFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xufTtcbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBDb21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHRoaXNbMF1bJysnXSh4KSxcbiAgICAgICAgICAgIHRoaXNbMV1cbiAgICAgICAgXSk7XG4gICAgfVxuICAgIFxufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KSxcbiAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgXSk7XG59O1xuXG5cbi8vIF8uYXBwbHlPbGQgPSBmdW5jdGlvbihvLCB4KSB7XG4vLyAgICAgLy9UT0RPOiBlbnN1cmUgdGhpcyBoYXMgYW4gaW1hZ2luYXJ5IHBhcnQuIElmIGl0IGRvZXNuJ3QgaXQgaXMgYSBodWdlIHdhc3RlIG9mIGNvbXB1dGF0aW9uXG4vLyAgICAgaWYgKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3IpIHtcbi8vICAgICAgICAgc3dpdGNoKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KG8sIHhbMF0pLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KG8sIHhbMV0pXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICAvL0Z1bmN0aW9uIGV2YWx1YXRpb24/IE5PLiBUaGlzIGlzIG5vdCBhIGZ1bmN0aW9uLiBJIHRoaW5rLlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeFswXSkuYXBwbHkoJy0nLCB0aGlzWzFdLmFwcGx5KCcqJywgeFsxXSkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeFsxXSkuYXBwbHkoJysnLCB0aGlzWzFdLmFwcGx5KCcqJywgeFswXSkpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4WzBdLmFwcGx5KCcqJywgeFswXSkuYXBwbHkoJysnLCB4WzFdLmFwcGx5KCcqJywgeFsxXSkpO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMF0uYXBwbHkoJyonLHhbMF0pLmFwcGx5KCcrJyx0aGlzWzFdLmFwcGx5KCcqJyx4WzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpLFxuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1sxXS5hcHBseSgnKicseFswXSkuYXBwbHkoJy0nLHRoaXNbMF0uYXBwbHkoJyonLHhbMV0pKSkuYXBwbHkoJy8nLCBjY19kZClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vVGhlIG1vc3QgY29uZnVzaW5nIG9mIHRoZW0gYWxsOlxuLy8gICAgICAgICAgICAgICAgIHZhciBoYWxmID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgwLjUsIDApO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobG0gPSBoYWxmLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgR2xvYmFsLmxvZy5hcHBseSh1bmRlZmluZWQsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAvL1RoZSBtYWduaXR1ZGU6IGlmIHRoaXMgd2FzIGZvciBhIHBvbGFyIG9uZSBpdCBjb3VsZCBiZSBmYXN0LlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1swXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnKycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IEdsb2JhbC5hdGFuMi5hcHBseSh1bmRlZmluZWQsIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzWzFdLCB0aGlzWzBdXSkpO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gaGxtLmFwcGx5KCcqJywgeFsxXSkuYXBwbHkoJysnLCB0aGV0YS5hcHBseSgnKicsIHhbMF0pKTtcbiAgICAgICAgICAgICAgICBcbi8vICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gR2xvYmFsLmV4cC5hcHBseSh1bmRlZmluZWQsXG4vLyAgICAgICAgICAgICAgICAgICAgIGhsbS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBiWzBdXG4vLyAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJy0nLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhldGEuYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJbMV1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG5cbi8vICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gR2xvYmFsLmUuYXBwbHkoJ14nLFxuLy8gICAgICAgICAgICAgICAgICAgICBobG0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgeFswXVxuLy8gICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCctJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXRhLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuXG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkLmFwcGx5KCcqJyxHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgaG1sZF90YykpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZC5hcHBseSgnKicsR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIGhtbGRfdGMpKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcil7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAvLyh4K3lpKS9BKmVeKGlrKVxuLy8gICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHhbMF0uYXBwbHkoJyonLCB4WzBdKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgYiA9IHgucmVhbGltYWcoKTtcbi8vICAgICAgICAgICAgICAgICAvL0NsZWFuIHRoaXMgdXA/IFN1Yj9cbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzBdLmFwcGx5KCcqJyxiWzBdKS5hcHBseSgnKycsYVsxXS5hcHBseSgnKicsYlsxXSkpKS5hcHBseSgnLycsIGNjX2RkKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMV0uYXBwbHkoJyonLGJbMF0pLmFwcGx5KCctJyxhWzBdLmFwcGx5KCcqJyxiWzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL2h0dHA6Ly93d3cud29sZnJhbWFscGhhLmNvbS9pbnB1dC8/aT1SZSUyOCUyOHglMkJ5aSUyOSU1RSUyOEEqZSU1RSUyOGlrJTI5JTI5JTI5XG4vLyAgICAgICAgICAgICAgICAgLy8oeCt5aSleKEEqZV4oaWspKVxuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hcHBseShvLCB4LnJlYWxpbWFnKCkpO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcignRHVwbGljYXRlZCBhbiB4ISBUaGlzIG1ha2VzIGl0IGRpZmZpY3VsdCB0byBzb2x2ZSBjb21wbGV4IGVxdWF0aW9ucywgSSB0aGluaycpO1xuLy8gICAgICAgICByZXR1cm4gdGhpcy5hcHBseShvLCB4LnJlYWxpbWFnKCkpO1xuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbi8vICAgICAgICAgY29uc29sZS5lcnJvcignRHVwbGljYXRlZCBhbiB4ISBUaGlzIG1ha2VzIGl0IGRpZmZpY3VsdCB0byBzb2x2ZSBjb21wbGV4IGVxdWF0aW9ucywgSSB0aGluaycpO1xuLy8gICAgICAgICByZXR1cm4gdGhpcy5hcHBseShvLCB4LnJlYWxpbWFnKCkpO1xuLy8gICAgIH1cbi8vICAgICB0aHJvdygnQ01QTFguTElTVCAqICcgKyBvKTtcbi8vIH07XG4iLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxleFBvbGFyO1xuXG51dGlsLmluaGVyaXRzKENvbXBsZXhQb2xhciwgc3VwKTtcblxuZnVuY3Rpb24gQ29tcGxleFBvbGFyICh4KXtcbiAgICB4Ll9fcHJvdG9fXyA9IENvbXBsZXhQb2xhci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIHg7XG59XG52YXIgXyA9IENvbXBsZXhQb2xhci5wcm90b3R5cGU7XG5cbl8ucG9sYXIgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICAvL1RPRE86IFJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhblxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpLFxuICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKVxuICAgIF0pO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKTtcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSk7XG59O1xuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQ29tcGxleFBvbGFyKFtcbiAgICAgICAgdGhpc1swXSxcbiAgICAgICAgdGhpc1sxXS5hcHBseSgnQC0nKVxuICAgIF0pO1xufTtcbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uKHgpe1xuICAgIC8vIGQvZHggYSh4KSAqIGVeKGliKHgpKVxuICAgIFxuICAgIC8vVE9ETyBlbnN1cmUgYmVsb3cgIGYnICsgaWYgZycgcGFydCBpcyByZWFsaW1hZyAoZicsIGZnJylcbiAgICByZXR1cm4gR2xvYmFsLmVcbiAgICAuYXBwbHkoXG4gICAgICAgICdeJyxcbiAgICAgICAgR2xvYmFsLmlcbiAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgIHRoaXNbMV1cbiAgICAgICAgKVxuICAgIClcbiAgICAuYXBwbHkoJyonLFxuICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgLmFwcGx5KCcrJyxcbiAgICAgICAgICAgIEdsb2JhbC5pXG4gICAgICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgICAgIHRoaXNbMF1cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICAgICApXG4gICAgICAgIClcbiAgICApO1xufTtcbi8vIF8uYXBwbHkgPSBmdW5jdGlvbihvLCB4KSB7XG4vLyAgICAgaWYgKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3IpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMF0pLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcrJywgeFsxXSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJy0nLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhBZV4oaWspKSBeIChCZV4oaWopKVxuLy8gICAgICAgICAgICAgICAgIC8vSG93IHNsb3cgaXMgdGhpcz9cbi8vICAgICAgICAgICAgICAgICAvL1ZlcnkgZmFzdCBmb3IgcmVhbCBudW1iZXJzIHRob3VnaFxuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IHNsb3csIG1heWJlIHdlIHNob3VsZCBzd2l0Y2ggdG8gY2FydGVzaWFuIG5vdz9cbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0OlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX3JlYWwpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5faW1hZykpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAvL0Fsc28gZmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnLycsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5fcmVhbCkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCctJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9pbWFnKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IHNsb3csIG1heWJlIHdlIHNob3VsZCBzd2l0Y2ggdG8gY2FydGVzaWFuIG5vdz9cbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy8oQWVeKGlrKSkgXiAoQmVeKGlqKSlcbi8vICAgICAgICAgICAgICAgICAvL0hvdyBzbG93IGlzIHRoaXM/XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IGZhc3QgZm9yIHJlYWwgbnVtYmVycyB0aG91Z2hcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfVxuICAgIFxuLy8gfTtcbl8uYWJzID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHRoaXNbMF07XG59O1xuXy5hcmcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpc1sxXTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vLi4vZ2xvYmFsJyk7XG5cbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sX1JlYWw7XG5cbnV0aWwuaW5oZXJpdHMoU3ltYm9sX1JlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIFN5bWJvbF9SZWFsKHN0cikge1xuICAgIHRoaXMuc3ltYm9sID0gc3RyO1xufVxuXG52YXIgXyA9IFN5bWJvbF9SZWFsLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbdGhpcywgR2xvYmFsLlplcm9dKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5wb2xhciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSxcbiAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKVxuICAgIF0pO1xufTtcbl8uYWJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSk7XG59O1xuXy5hcmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKTtcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgaWYgKHgub3BlcmF0b3IgPT09ICdALScpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhbMF1dLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLScpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4geFsnQC0nXSgpWycrJ10odGhpcyk7XG59O1xuXG5fWydAKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXNdLCAnQCsnKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sICdALScpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiB4WycqJ10odGhpcyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbeCwgdGhpc10sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcqJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcbl8uYXBwbHkgPSBfWycqJ107XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIGJ5IHplcm8nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xufTtcbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbn07XG5fLmFwcGx5T2xkID0gZnVuY3Rpb24ob3BlcmF0b3IsIGUpIHtcbiAgICB0aHJvdyhcIlJlYWwuYXBwbHlcIik7XG4gICAgLy8gaWYgKG9wZXJhdG9yID09PSAnLCcpIHtcbiAgICAvLyAgICAgLy9NYXliZSB0aGlzIHNob3VsZCBiZSBhIG5ldyBvYmplY3QgdHlwZT8/PyBWZWN0b3I/XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKCdBUFBMWTogJywgdGhpcy5jb25zdHJ1Y3RvciwgdGhpcywgZSk7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgZV0pO1xuICAgIC8vIH0gZWxzZSBpZiAob3BlcmF0b3IgPT09ICc9Jykge1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5FcXVhdGlvbihbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyB9XG4gICAgLy8gaWYgKGUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vICAgICAvL1VuYXJ5OlxuICAgIC8vICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICBjYXNlICchJzpcbiAgICAvLyAgICAgICAgICAgICAvL1RPRE86IENhbid0IHNpbXBsaWZ5LCBzbyB3aHkgYm90aGVyISAocmV0dXJuIGEgbGlzdCwgc2luY2UgZ2FtbWEgbWFwcyBhbGwgcmVhbHMgdG8gcmVhbHM/KVxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodW5kZWZpbmVkLCB0aGlzLmFwcGx5KCcrJywgR2xvYmFsLk9uZSkpO1xuICAgIC8vICAgICAgICAgY2FzZSAnQC0nOlxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgIGRlZmF1bHQ6XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgdGhyb3coJ1JlYWwgU3ltYm9sKCcrdGhpcy5zeW1ib2wrJykgY291bGQgbm90IGhhbmRsZSBvcGVyYXRvciAnKyBvcGVyYXRvcik7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgICAgLy8gU2ltcGxpZmljYXRpb246XG4gICAgLy8gICAgIHN3aXRjaCAoZS5jb25zdHJ1Y3Rvcil7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uU3ltYm9sLlJlYWw6XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5SZWFsOlxuICAgIC8vICAgICAgICAgICAgIC8qaWYodGhpcy5wb3NpdGl2ZSAmJiBlLnBvc2l0aXZlKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICB9Ki9cbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAvL1RPRE86IEJhZCBpZGVhPyBUaGlzIHdpbGwgc3RheSBpbiB0aGlzIGZvcm0gdW50aWwgcmVhbGltYWcoKSBpcyBjYWxsZWQgYnkgdXNlciwgYW5kIHVzZXIgb25seS5cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSwgZV0sJ14nKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbZSwgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKV0sJyonKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyonKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbDpcbiAgICAvLyAgICAgICAgICAgICBzd2l0Y2gob3BlcmF0b3Ipe1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnKic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnKicpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyUnOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgJyUnKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBpZihlLnZhbHVlID09PSAxKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihlLnZhbHVlID09PSAwKXtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGZhbHNlICYmIG9wZW5nbF9UT0RPX2hhY2soKSAmJiBlLnZhbHVlID09PSB+fmUudmFsdWUpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKSwgZV0sJ14nKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbZSwgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hcmcsIHRoaXNdKV0sJyonKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuSW5maW5pdHk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCBvcGVyYXRvcik7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uQ29tcGxleDpcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCBlKTsgLy8gR08gdG8gYWJvdmUgKHdpbGwgYXBwbHkgcmVhbHMpXG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuOlxuICAgIC8vICAgICAgICAgICAgIC8vTWF5YmUgdGhlcmUgaXMgYSB3YXkgdG8gc3dhcCB0aGUgb3JkZXI/IChlLmcuIGEgLnJlYWwgPSB0cnVlIHByb3BlcnR5IGZvciBvdGhlciB0aGluZ3MgdG8gY2hlY2spXG4gICAgLy8gICAgICAgICAgICAgLy9vciBpbnN0YW5jZSBvZiBFeHByZXNzaW9uLlJlYWwgP1xuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwbHkob3BlcmF0b3IsIGVbMF0pLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGVbMV1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVswXSksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVsxXSlcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IGVbMF0uYXBwbHkoJyonLGVbMF0pLmFwcGx5KCcrJyxlWzFdLmFwcGx5KCcqJyxlWzFdKSk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLmFwcGx5KCcqJyxlWzBdKSkuYXBwbHkoJy8nLCBjY19kZCksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseSgnKicsZVsxXSkuYXBwbHkoJy8nLCBjY19kZCkuYXBwbHkoJ0AtJylcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcjpcbiAgICAvLyAgICAgICAgICAgICAvL01heWJlIHRoZXJlIGlzIGEgd2F5IHRvIHN3YXAgdGhlIG9yZGVyP1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnBvbGFyKCkuYXBwbHkob3BlcmF0b3IsIGUpO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIHRocm93KCdMSVNUIEZST00gUkVBTCBTWU1CT0whICcrIG9wZXJhdG9yLCBlLmNvbnN0cnVjdG9yKTtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyB9XG59O1xuXG5cbn0pKCkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9saWNFRnVuY3Rpb247XG5cbnV0aWwuaW5oZXJpdHMoU3ltYm9saWNFRnVuY3Rpb24sIHN1cCk7XG5cbmZ1bmN0aW9uIFN5bWJvbGljRUZ1bmN0aW9uKGV4cHIsIHZhcnMpIHtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICAgIHRoaXMuc3ltYm9scyA9IHZhcnM7XG4gICAgXG59O1xudmFyIF8gPSBTeW1ib2xpY0VGdW5jdGlvbi5wcm90b3R5cGU7XG5fLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4LmNvbnN0cnVjdG9yICE9PSBFeHByZXNzaW9uLlZlY3Rvcikge1xuICAgICAgICB4ID0gRXhwcmVzc2lvbi5WZWN0b3IoW3hdKTtcbiAgICB9XG4gICAgdmFyIGV4cHIgPSB0aGlzLmV4cHI7XG4gICAgdmFyIGksIGwgPSB0aGlzLnN5bWJvbHMubGVuZ3RoO1xuICAgIGlmIChsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyAoJ0ludmFsaWQgZG9tYWluLiBFbGVtZW50IG9mIEZeJyArIGwgKyAnIGV4cGVjdGVkLicpO1xuICAgIH1cbiAgICBmb3IoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgZXhwciA9IGV4cHIuc3ViKHRoaXMuc3ltYm9sc1tpXSwgeFtpXSlcbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG59OyJdfQ==
;