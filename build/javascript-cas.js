;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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
                return new Expression.Integer(str);
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
(function(process){/* parser generated by jison 0.4.2 */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"S":4,"EOF":5,"e":6,"stmt":7,"=":8,"!=":9,"<=":10,"<":11,">":12,">=":13,"csl":14,",":15,"vector":16,"(":17,")":18,"+":19,"-":20,"*":21,"/":22,"POWER{":23,"}":24,"_{":25,"_SINGLE":26,"SQRT{":27,"FRAC{":28,"{":29,"^SINGLE":30,"identifier":31,"number":32,"IDENTIFIER":33,"LONGIDENTIFIER":34,"DECIMAL":35,"INTEGER":36,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"=",9:"!=",10:"<=",11:"<",12:">",13:">=",15:",",17:"(",18:")",19:"+",20:"-",21:"*",22:"/",23:"POWER{",24:"}",25:"_{",26:"_SINGLE",27:"SQRT{",28:"FRAC{",29:"{",30:"^SINGLE",33:"IDENTIFIER",34:"LONGIDENTIFIER",35:"DECIMAL",36:"INTEGER"},
productions_: [0,[3,2],[4,1],[4,1],[7,3],[7,3],[7,3],[7,3],[7,3],[7,3],[14,3],[14,3],[16,3],[6,3],[6,3],[6,3],[6,3],[6,4],[6,4],[6,2],[6,3],[6,6],[6,2],[6,2],[6,2],[6,3],[6,1],[6,1],[6,1],[31,1],[31,1],[32,1],[32,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

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
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
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
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
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
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
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
}
};
undefined/* generated by jison-lex 0.1.0 */
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
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
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
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
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
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
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
},{"fs":14,"path":15,"__browserify_process":12}],8:[function(require,module,exports){
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

},{"util":10,"./Code":16,"./parse":17,"./stringify":18}],4:[function(require,module,exports){
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
            throw('Confusing infitesimal division');
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
},{"../Expression":5}],5:[function(require,module,exports){
(function(){var Global = require('../global');

function Expression() {
    
}

module.exports = Expression;

Expression.List                   = require('./List');
Expression.List.Real              = require('./List/Real');
Expression.List.ComplexCartesian  = require('./List/ComplexCartesian');
Expression.List.ComplexPolar      = require('./List/ComplexPolar');
Expression.Constant               = require('./Constant');
Expression.NumericalComplex       = require('./Constant/NumericalComplex');
Expression.NumericalReal          = require('./Constant/NumericalComplex/NumericalReal');
Expression.Rational               = require('./Constant/NumericalComplex/NumericalReal/Rational');
Expression.Integer                = require('./Constant/NumericalComplex/NumericalReal/Rational/Integer');
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
},{"../global":9,"./List":19,"./List/Real":20,"./List/ComplexCartesian":21,"./List/ComplexPolar":22,"./Constant":23,"./Constant/NumericalComplex":24,"./Constant/NumericalComplex/NumericalReal":25,"./Constant/NumericalComplex/NumericalReal/Rational":26,"./Constant/NumericalComplex/NumericalReal/Rational/Integer":27,"./Symbol":28,"./Symbol/Real":29,"./Statement":30,"./Vector":31,"./Matrix":32,"./Function":33,"./Function/Symbolic":34,"./Infinitesimal":35}],6:[function(require,module,exports){
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
},{"util":10,"../global":9}],16:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{"__browserify_process":12}],18:[function(require,module,exports){
module.exports = function stringify(expr, lang) {
    return expr.s(lang);
};

},{}],17:[function(require,module,exports){
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
},{"../Expression":5,"../global":9}],19:[function(require,module,exports){
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
    throw('Use real(), imag(), or abs(), or arg() first.');
};


},{"util":10,"../":5}],23:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('../');
var Global = require('../../global');

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
},{"util":10,"../":5,"../../global":9}],28:[function(require,module,exports){
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

},{"util":10,"../":5}],31:[function(require,module,exports){
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
},{"util":10,"../":5,"../../global":9}],32:[function(require,module,exports){
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


},{"util":10,"../":5}],33:[function(require,module,exports){
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
    throw('EFunction has no derivative defined.');
};

_._s = function (Code, lang) {
    if (this[lang]) {
        return new Code(this[lang]);
    }
    throw('Could not compile function into ' + lang);
};

_['+'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['+'](x), [a]);
};

_['@-'] = function (x) {
    var a = new Expression.Symbol();
    return new EFunction.Symbolic(this.default(a)['@-'](), [a]);
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

})()
},{"util":10,"../":5,"../../global":9}],20:[function(require,module,exports){
(function(){// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression = require('../../');
var Global = require('../../../global')

module.exports = List_Real;

util.inherits(List_Real, sup);

function List_Real(x, operator) {
    x.__proto__ = List_Real.prototype;
    if(operator !== undefined) {
        x.operator = operator;
    }
    return x;
}

var _ = List_Real.prototype;

_.realimag = function (){
    return sup.ComplexCartesian([
        this,
        Global.Zero
    ]);
};
_.real = function (){
    return this;
};
_.imag = function (){
    return Global.Zero;
};
_.polar = function () {
    return sup.ComplexPolar([
        sup.Real([Global.abs, this]),
        sup.Real([Global.arg, this])
    ]);
};
_.abs = function (){
    return sup.Real([Global.abs, this]);
};
_.arg = function (){
    return sup.Real([Global.arg, this]);
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
        return Global.Zero;
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
            return Global.Zero;
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
        return Global.One;
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
        this.operator === '@') {
        return this[0].differentiate(x)[this.operator](this[1] && this[1].differentiate(x));
    } else if (this.operator === '*') {
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
    }
};

_._s = function (Code, lang) {

    var language = Code.language;
    function paren(x) {
        if(lang === 'text/latex') {
            return '\\left(' + x + '\\right)'; 
        }
        return '('+ x + ')';
    }
    if (this.operator === undefined) {
        if (this[0] instanceof Expression.Function) {
            if(this[0] === Global.abs) {

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
                if(this[0] === Global.atan) {
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
            if(this[0] === Global.e) {
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
                    
                    cs = c0.var();
                    
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
                    var c1 = this[1]['-'](Global.One)._s(Code, lang);
                    var c0 = this[0].s_(Code, lang);
                    
                    return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ',' + c1.s + '))');
                }
            }
            if (this[0] instanceof Expression.NumericalReal) {

                // Neg or pos.
                var c1 = this[1]['-'](Global.One)._s(Code, lang);
                var c0 = this[0]._s(Code, lang);
                
                return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
                
            }
            var c1 = this[1]['-'](Global.One)._s(Code, lang);
            var c0 = this[0]._s(Code, lang);
                
            // Needs a new function, dependent on power.
            return c0.merge(c1, '((' + c0.s + ') * pow(' + c0.s + ','+c1.s+'))');
            
        } else if(lang === 'text/javascript') {
            if(this[0] === Global.e) {
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
},{"util":10,"../":19,"../../":5,"../../../global":9}],21:[function(require,module,exports){
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

},{"util":10,"../":19}],22:[function(require,module,exports){
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

},{"util":10,"../":19,"../../":5}],24:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('../');
var Global = require('../../../global');

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
},{"util":10,"../":23,"../../../global":9}],29:[function(require,module,exports){
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
},{"util":10,"../":33,"../../":5}],25:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('../');
var Global = require('../../../../global');
var Expression = require('../../../');
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
},{"util":10,"../../../../global":9,"../":24,"../../../":5}],26:[function(require,module,exports){
(function(){var util = require('util');
var sup  = require('../');
var Global = require('../../../../../global');
var Expression = require('../../../../');

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
    if (x instanceof this.constructor){
        return new Rational(this.a * x.a, this.b * x.b);
    }
    return sup.protoype['*'].call(this, x);
};


_['/'] = function (x) {
    if (this.a === 0) {
        return Global.Zero;
    }
    if (x instanceof this.constructor){
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
},{"util":10,"../../../../../global":9,"../":25,"../../../../":5}],27:[function(require,module,exports){
(function(){var util = require('util');
var sup = require('../');
var Global = require('../../../../../../global');

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
},{"util":10,"../":26,"../../../../../../global":9}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FcnJvci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9nbG9iYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvZGVmYXVsdC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2dyYW1tYXIvcGFyc2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0xhbmd1YWdlL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL2dsb2JhbC9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0NvbnRleHQvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2UvQ29kZS5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5Mi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2J1aWx0aW4vZnMuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL3BhdGguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2Uvc3RyaW5naWZ5LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0xhbmd1YWdlL3BhcnNlLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTGlzdC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0NvbnN0YW50L2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vU3ltYm9sL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vU3RhdGVtZW50L2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vVmVjdG9yL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTWF0cml4L2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vRnVuY3Rpb24vaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9JbmZpbml0ZXNpbWFsL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTGlzdC9SZWFsL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTGlzdC9Db21wbGV4Q2FydGVzaWFuL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTGlzdC9Db21wbGV4UG9sYXIvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9Db25zdGFudC9OdW1lcmljYWxDb21wbGV4L2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vU3ltYm9sL1JlYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9GdW5jdGlvbi9TeW1ib2xpYy9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0NvbnN0YW50L051bWVyaWNhbENvbXBsZXgvTnVtZXJpY2FsUmVhbC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0NvbnN0YW50L051bWVyaWNhbENvbXBsZXgvTnVtZXJpY2FsUmVhbC9SYXRpb25hbC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0NvbnN0YW50L051bWVyaWNhbENvbXBsZXgvTnVtZXJpY2FsUmVhbC9SYXRpb25hbC9JbnRlZ2VyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxudmFyIE0gPSByZXF1aXJlKCcuL2xpYicpO1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgX00gPSB3aW5kb3cuTTtcbiAgICB3aW5kb3cuTSA9IE07XG4gICAgTS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cuTSA9IF9NO1xuICAgICAgICByZXR1cm4gTTtcbiAgICB9O1xufVxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNO1xufVxuIiwiKGZ1bmN0aW9uKCl7Lypqc2xpbnQgbm9kZTogdHJ1ZSAqL1xuXG4vLyBub3Qgc3VyZSBpZiB0aGlzIGlzIHJlcXVpcmVkOlxuLypqc2hpbnQgc3ViOiB0cnVlICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRXhwcmVzc2lvbiAgPSByZXF1aXJlKCcuL0V4cHJlc3Npb24nKSxcbiAgICBDb250ZXh0ICAgICA9IHJlcXVpcmUoJy4vQ29udGV4dCcpLFxuICAgIE1hdGhFcnJvciAgID0gcmVxdWlyZSgnLi9FcnJvcicpLFxuICAgIGxhbmd1YWdlICAgID0gcmVxdWlyZSgnLi9MYW5ndWFnZS9kZWZhdWx0JyksXG4gICAgQ29kZSAgICAgICAgPSByZXF1aXJlKCcuL0xhbmd1YWdlJykuQ29kZSxcbiAgICBHbG9iYWwgICAgICA9IHJlcXVpcmUoJy4vZ2xvYmFsJyk7XG5cbi8vIERlZmluZSBzaW4sIGNvcywgdGFuLCBldGMuXG52YXIgZGVmYXVsdHMgICAgPSByZXF1aXJlKCcuL2dsb2JhbC9kZWZhdWx0cycpO1xuZGVmYXVsdHMuYXR0YWNoKEdsb2JhbCk7XG5cbm1vZHVsZS5leHBvcnRzID0gTTtcblxuZnVuY3Rpb24gTShlLCBjKSB7XG4gICAgcmV0dXJuIGxhbmd1YWdlLnBhcnNlKGUsIGMgfHwgR2xvYmFsKTtcbn1cblxuTS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBbXG4gICAgJ2Z1bmN0aW9uIE0oZXhwcmVzc2lvbiwgY29udGV4dCkgeycsXG4gICAgJyAgICAvKiEnLFxuICAgICcgICAgICogIE1hdGggSmF2YVNjcmlwdCBMaWJyYXJ5IHYzLjkuMScsXG4gICAgJyAgICAgKiAgaHR0cHM6Ly9naXRodWIuY29tL2FhbnR0aG9ueS9qYXZhc2NyaXB0LWNhcycsXG4gICAgJyAgICAgKiAgJyxcbiAgICAnICAgICAqICBDb3B5cmlnaHQgMjAxMCBBbnRob255IEZvc3Rlci4gQWxsIHJpZ2h0cyByZXNlcnZlZC4nLFxuICAgICcgICAgICovJyxcbiAgICAnICAgIFthd2Vzb21lIGNvZGVdJyxcbiAgICAnfSddLmpvaW4oJ1xcbicpO1xufTtcblxuTVsnQ29udGV4dCddICAgID0gQ29udGV4dDtcbk1bJ0V4cHJlc3Npb24nXSA9IEV4cHJlc3Npb247XG5NWydHbG9iYWwnXSAgICAgPSBHbG9iYWw7XG5NWydFcnJvciddICAgICAgPSBNYXRoRXJyb3I7XG5cbkV4cHJlc3Npb24ucHJvdG90eXBlLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgIENvZGUubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICBDb2RlLm5ld0NvbnRleHQoKTtcbiAgICByZXR1cm4gdGhpcy5fcyhDb2RlLCBsYW5nKTtcbn07XG5FeHByZXNzaW9uLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpcy5zKCd0ZXh0L2phdmFzY3JpcHQnKS5jb21waWxlKHgpO1xufVxuXG52YXIgZXh0ZW5zaW9ucyA9IHt9O1xuXG5NWydyZWdpc3RlciddID0gZnVuY3Rpb24gKG5hbWUsIGluc3RhbGxlcil7XG4gICAgaWYoRXhwcmVzc2lvbi5wcm90b3R5cGVbbmFtZV0pIHtcbiAgICAgICAgdGhyb3coJ01ldGhvZCAuJyArIG5hbWUgKyAnIGlzIGFscmVhZHkgaW4gdXNlIScpO1xuICAgIH1cbiAgICBleHRlbnNpb25zW25hbWVdID0gaW5zdGFsbGVyO1xufTtcblxuTVsnbG9hZCddID0gZnVuY3Rpb24obmFtZSwgY29uZmlnKSB7XG4gICAgZXh0ZW5zaW9uc1tuYW1lXShNLCBFeHByZXNzaW9uLCBjb25maWcpO1xuICAgIGRlbGV0ZSBleHRlbnNpb25zW25hbWVdO1xufTtcblxufSkoKSIsImZ1bmN0aW9uIE1hdGhFcnJvcihzdHIpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBzdHI7XG59XG5NYXRoRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhFcnJvcjtcbiIsIihmdW5jdGlvbigpe3ZhciBnbG9iYWwgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWw7XG5cbn0pKCkiLCJ2YXIgZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLmlzRGF0ZSA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSd9O1xuZXhwb3J0cy5pc1JlZ0V4cCA9IGZ1bmN0aW9uKG9iail7cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJ307XG5cblxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5wdXRzID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmRlYnVnID0gZnVuY3Rpb24oKSB7fTtcblxuZXhwb3J0cy5pbnNwZWN0ID0gZnVuY3Rpb24ob2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKSB7XG4gIHZhciBzZWVuID0gW107XG5cbiAgdmFyIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkge1xuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuICAgIHZhciBzdHlsZXMgPVxuICAgICAgICB7ICdib2xkJyA6IFsxLCAyMl0sXG4gICAgICAgICAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAgICAgICAgICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgICAgICAgICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAgICAgICAgICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgICAgICAgICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgICAgICAgICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICAgICAgICAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICAgICAgICAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICAgICAgICAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAgICAgICAgICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAgICAgICAgICdyZWQnIDogWzMxLCAzOV0sXG4gICAgICAgICAgJ3llbGxvdycgOiBbMzMsIDM5XSB9O1xuXG4gICAgdmFyIHN0eWxlID1cbiAgICAgICAgeyAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgICAgICAgICAnbnVtYmVyJzogJ2JsdWUnLFxuICAgICAgICAgICdib29sZWFuJzogJ3llbGxvdycsXG4gICAgICAgICAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgICAgICAgICAnbnVsbCc6ICdib2xkJyxcbiAgICAgICAgICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgICAgICAgICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgICAgICAgICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAgICAgICAgICdyZWdleHAnOiAncmVkJyB9W3N0eWxlVHlwZV07XG5cbiAgICBpZiAoc3R5bGUpIHtcbiAgICAgIHJldHVybiAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAgICdcXDAzM1snICsgc3R5bGVzW3N0eWxlXVsxXSArICdtJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH07XG4gIGlmICghIGNvbG9ycykge1xuICAgIHN0eWxpemUgPSBmdW5jdGlvbihzdHIsIHN0eWxlVHlwZSkgeyByZXR1cm4gc3RyOyB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gICAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgICB2YWx1ZSAhPT0gZXhwb3J0cyAmJlxuICAgICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzKTtcbiAgICB9XG5cbiAgICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICByZXR1cm4gc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuXG4gICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgICAgICByZXR1cm4gc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcblxuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuXG4gICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgICB9XG4gICAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgICB2YXIgdmlzaWJsZV9rZXlzID0gT2JqZWN0X2tleXModmFsdWUpO1xuICAgIHZhciBrZXlzID0gc2hvd0hpZGRlbiA/IE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKSA6IHZpc2libGVfa2V5cztcblxuICAgIC8vIEZ1bmN0aW9ucyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGVzIHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWRcbiAgICBpZiAoaXNEYXRlKHZhbHVlKSAmJiBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHN0eWxpemUodmFsdWUudG9VVENTdHJpbmcoKSwgJ2RhdGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYmFzZSwgdHlwZSwgYnJhY2VzO1xuICAgIC8vIERldGVybWluZSB0aGUgb2JqZWN0IHR5cGVcbiAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHR5cGUgPSAnQXJyYXknO1xuICAgICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHlwZSA9ICdPYmplY3QnO1xuICAgICAgYnJhY2VzID0gWyd7JywgJ30nXTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgYmFzZSA9IChpc1JlZ0V4cCh2YWx1ZSkpID8gJyAnICsgdmFsdWUgOiAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlID0gJyc7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIGJhc2UgPSAnICcgKyB2YWx1ZS50b1VUQ1N0cmluZygpO1xuICAgIH1cblxuICAgIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJycgKyB2YWx1ZSwgJ3JlZ2V4cCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZWVuLnB1c2godmFsdWUpO1xuXG4gICAgdmFyIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIG5hbWUsIHN0cjtcbiAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKSB7XG4gICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cEdldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2YWx1ZS5fX2xvb2t1cFNldHRlcl9fKGtleSkpIHtcbiAgICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlX2tleXMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgICAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICAgICAgfVxuICAgICAgaWYgKCFzdHIpIHtcbiAgICAgICAgaWYgKHNlZW4uaW5kZXhPZih2YWx1ZVtrZXldKSA8IDApIHtcbiAgICAgICAgICBpZiAocmVjdXJzZVRpbWVzID09PSBudWxsKSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh2YWx1ZVtrZXldLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9IHN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlID09PSAnQXJyYXknICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgICAgIG5hbWUgPSBzdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xuICAgIH0pO1xuXG4gICAgc2Vlbi5wb3AoKTtcblxuICAgIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgICBudW1MaW5lc0VzdCsrO1xuICAgICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgICAgcmV0dXJuIHByZXYgKyBjdXIubGVuZ3RoICsgMTtcbiAgICB9LCAwKTtcblxuICAgIGlmIChsZW5ndGggPiA1MCkge1xuICAgICAgb3V0cHV0ID0gYnJhY2VzWzBdICtcbiAgICAgICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgICAgYnJhY2VzWzFdO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiBmb3JtYXQob2JqLCAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJyA/IDIgOiBkZXB0aCkpO1xufTtcblxuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBhciBpbnN0YW5jZW9mIEFycmF5IHx8XG4gICAgICAgICBBcnJheS5pc0FycmF5KGFyKSB8fFxuICAgICAgICAgKGFyICYmIGFyICE9PSBPYmplY3QucHJvdG90eXBlICYmIGlzQXJyYXkoYXIuX19wcm90b19fKSk7XG59XG5cblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIHJlIGluc3RhbmNlb2YgUmVnRXhwIHx8XG4gICAgKHR5cGVvZiByZSA9PT0gJ29iamVjdCcgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXScpO1xufVxuXG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIGlmIChkIGluc3RhbmNlb2YgRGF0ZSkgcmV0dXJuIHRydWU7XG4gIGlmICh0eXBlb2YgZCAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgdmFyIHByb3BlcnRpZXMgPSBEYXRlLnByb3RvdHlwZSAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhEYXRlLnByb3RvdHlwZSk7XG4gIHZhciBwcm90byA9IGQuX19wcm90b19fICYmIE9iamVjdF9nZXRPd25Qcm9wZXJ0eU5hbWVzKGQuX19wcm90b19fKTtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHByb3RvKSA9PT0gSlNPTi5zdHJpbmdpZnkocHJvcGVydGllcyk7XG59XG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uIChtc2cpIHt9O1xuXG5leHBvcnRzLnB1bXAgPSBudWxsO1xuXG52YXIgT2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHJlcy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIE9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgICAvLyBmcm9tIGVzNS1zaGltXG4gICAgdmFyIG9iamVjdDtcbiAgICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgICAgIG9iamVjdCA9IHsgJ19fcHJvdG9fXycgOiBudWxsIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgJ3R5cGVvZiBwcm90b3R5cGVbJyArICh0eXBlb2YgcHJvdG90eXBlKSArICddICE9IFxcJ29iamVjdFxcJydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIFR5cGUgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgICAgIG9iamVjdC5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ3VuZGVmaW5lZCcgJiYgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gT2JqZWN0X2NyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAodHlwZW9mIGYgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGV4cG9ydHMuaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6IHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSl7XG4gICAgaWYgKHggPT09IG51bGwgfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGV4cG9ydHMuaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgaWYgKGV2LnNvdXJjZSA9PT0gd2luZG93ICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIihmdW5jdGlvbihwcm9jZXNzKXtpZiAoIXByb2Nlc3MuRXZlbnRFbWl0dGVyKSBwcm9jZXNzLkV2ZW50RW1pdHRlciA9IGZ1bmN0aW9uICgpIHt9O1xuXG52YXIgRXZlbnRFbWl0dGVyID0gZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBwcm9jZXNzLkV2ZW50RW1pdHRlcjtcbnZhciBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbidcbiAgICA/IEFycmF5LmlzQXJyYXlcbiAgICA6IGZ1bmN0aW9uICh4cykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICAgIH1cbjtcbmZ1bmN0aW9uIGluZGV4T2YgKHhzLCB4KSB7XG4gICAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXG4vLyAxMCBsaXN0ZW5lcnMgYXJlIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2hcbi8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuLy9cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG52YXIgZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA9IG47XG59O1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzQXJyYXkodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpXG4gICAge1xuICAgICAgaWYgKGFyZ3VtZW50c1sxXSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGFyZ3VtZW50c1sxXTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuY2F1Z2h0LCB1bnNwZWNpZmllZCAnZXJyb3InIGV2ZW50LlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIGZhbHNlO1xuICB2YXIgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgaWYgKCFoYW5kbGVyKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2UgaWYgKGlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICB2YXIgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG4vLyBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQoKSBpcyBhbHNvIGRlZmluZWQgdGhlcmUuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09IFwibmV3TGlzdGVuZXJzXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxuICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cbiAgICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgICAgdmFyIG07XG4gICAgICBpZiAodGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG0gPSB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbSA9IGRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIH0gZWxzZSB7XG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLm9uKHR5cGUsIGZ1bmN0aW9uIGcoKSB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIGxpc3RlbmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0FycmF5KGxpc3QpKSB7XG4gICAgdmFyIGkgPSBpbmRleE9mKGxpc3QsIGxpc3RlbmVyKTtcbiAgICBpZiAoaSA8IDApIHJldHVybiB0aGlzO1xuICAgIGxpc3Quc3BsaWNlKGksIDEpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PSAwKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfSBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0gPT09IGxpc3RlbmVyKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBkb2VzIG5vdCB1c2UgbGlzdGVuZXJzKCksIHNvIG5vIHNpZGUgZWZmZWN0IG9mIGNyZWF0aW5nIF9ldmVudHNbdHlwZV1cbiAgaWYgKHR5cGUgJiYgdGhpcy5fZXZlbnRzICYmIHRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHt9O1xuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkgdGhpcy5fZXZlbnRzW3R5cGVdID0gW107XG4gIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXt2YXIgTGFuZ3VhZ2UgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKSxcbiAgICBHbG9iYWwgICAgID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7IC8vICZ0aW1lczsgY2hhcmFjdGVyXG5cbi8vIEJ1aWx0IGJ5IEppc29uOlxudmFyIHBhcnNlciA9IHJlcXVpcmUoJy4uLy4uL2dyYW1tYXIvcGFyc2VyLmpzJyk7XG5cbnBhcnNlci5wYXJzZUVycm9yID0gZnVuY3Rpb24gKHN0ciwgaGFzaCkge1xuICAgIC8vIHtcbiAgICAvLyAgICAgdGV4dDogdGhpcy5sZXhlci5tYXRjaCxcbiAgICAvLyAgICAgdG9rZW46IHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCxcbiAgICAvLyAgICAgbGluZTogdGhpcy5sZXhlci55eWxpbmVubyxcbiAgICAvLyAgICAgbG9jOiB5eWxvYyxcbiAgICAvLyAgICAgZXhwZWN0ZWQ6XG4gICAgLy8gICAgIGV4cGVjdGVkXG4gICAgLy8gfVxuICAgIHZhciBlciA9IG5ldyBTeW50YXhFcnJvcihzdHIpO1xuICAgIGVyLmxpbmUgPSBoYXNoLmxpbmU7XG4gICAgdGhyb3cgZXI7XG59O1xuXG5cbnZhciBsZWZ0ID0gJ2xlZnQnLCByaWdodCA9ICdyaWdodCc7XG52YXIgTCA9IGxlZnQ7XG52YXIgUiA9IHJpZ2h0O1xuXG5cblxudmFyIGxhbmd1YWdlID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgTGFuZ3VhZ2UocGFyc2VyLCB7XG4gICAgICAgIE51bWJlcjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgaWYgKHN0ciA9PT0gJzEnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0ciA9PT0gJzAnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIoTnVtYmVyKHN0cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9eW1xcZF0qXFwuW1xcZF0rJC8udGVzdChzdHIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlY2ltYWxQbGFjZSA9IHN0ci5pbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgLy8gMTIuMzQ1IC0+IDEyMzQ1IC8gMTAwMFxuICAgICAgICAgICAgICAgIC8vIDAwLjUgLT4gNS8xMFxuICAgICAgICAgICAgICAgIHZhciBkZW5vbV9wID0gc3RyLmxlbmd0aCAtIGRlY2ltYWxQbGFjZSAtIDE7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBNYXRoLnBvdygxMCwgZGVub21fcCk7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSBOdW1iZXIoc3RyLnJlcGxhY2UoJy4nLCAnJykpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5SYXRpb25hbChuLCBkKS5yZWR1Y2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE51bWJlcihzdHIpKTtcbiAgICAgICAgfSxcbiAgICAgICAgU3RyaW5nOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9LFxuICAgICAgICBTaW5nbGU6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIC8vIFNpbmdsZSBsYXRleCBjaGFycyBmb3IgeF4zLCB4XnkgZXRjIChOT1QgeF57YWJjfSlcbiAgICAgICAgICAgIGlmICghaXNOYU4oc3RyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHN0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChzdHIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBbXG4gICAgWyc7J10sICAgICAgICAgIC8qTCAvIFIgbWFrZXMgbm8gZGlmZmVyZW5jZT8/PyE/PyE/ICovXG4gICAgWycsJ10sXG4gICAgW1snPScsICcrPScsICctPScsICcqPScsICcvPScsICclPScsICcmPScsICdePScsICd8PSddLFJdLFxuICAgIFtbJz8nLCc6J10sUiwyXSxcbiAgICBbWyfiiKgnXV0sXG4gICAgW1snJiYnXV0sXG4gICAgW1snfCddXSxcbiAgICBbWyc/Pz8/Pz8nXV0sLy9YT1JcbiAgICBbWycmJ11dLFxuICAgIFtbJz09JywgJ+KJoCcsICchPT0nLCAnPT09J11dLFxuICAgIFtbJzwnLCAnPD0nLCAnPicsICc+PSddLExdLFxuICAgIFtbJz4+JywgJzw8J11dLFxuICAgIFsnwrEnLCBSLCAyXSxcbiAgICBbWycrJ10sIHRydWVdLFxuICAgIFtbJy0nXSwgTF0sXG4gICAgW1sn4oirJywgJ+KIkSddLCBSLCAxXSxcbiAgICBbWycqJywgJyUnXSwgUl0sXG4gICAgW2Nyb3NzUHJvZHVjdCwgUl0sXG4gICAgW1snQCsnLCAnQC0nLCAnQMKxJ10sIFIsIDFdLCAvL3VuYXJ5IHBsdXMvbWludXNcbiAgICBbWyfCrCddLCBMLCAxXSxcbiAgICBbJ2RlZmF1bHQnLCBSLCAyXSwgLy9JIGNoYW5nZWQgdGhpcyB0byBSIGZvciA1c2luKHQpXG4gICAgWyfiiJgnLCBSLCAyXSxcbiAgICBbWycvJ11dLFxuICAgIFtbJ14nXV0sLy9lKip4XG4gICAgWychJywgTCwgMV0sXG4gICAgW1snfiddLCBSLCAxXSwgLy9iaXR3aXNlIG5lZ2F0aW9uXG4gICAgW1snKysnLCAnKysnLCAnLicsICctPiddLEwsMV0sXG4gICAgW1snOjonXV0sXG4gICAgW1snXyddLCBMLCAyXSxcbiAgICBbJ3ZhcicsIFIsIDFdLFxuICAgIFsnYnJlYWsnLCBSLCAwXSxcbiAgICBbJ3Rocm93JywgUiwgMV0sXG4gICAgWydcXCcnLCBMLCAxXSxcbiAgICBbJ1xcdTIyMUEnLCBSLCAxXSwgLy8gU3FydFxuICAgIFsnIycsIFIsIDFdIC8qYW5vbnltb3VzIGZ1bmN0aW9uKi9cbl0pO1xuXG4vKlxuIExhbmd1YWdlIHNwZWMgY29sdW1ucyBpbiBvcmRlciBvZiBfaW5jcmVhc2luZyBwcmVjZWRlbmNlXzpcbiAqIG9wZXJhdG9yIHN0cmluZyByZXByZXNlbnRhdGlvbihzKS4gVGhlc2UgYXJlIGRpZmZlcmVudCBvcGVyYXRvcnMsIGJ1dCBzaGFyZSBhbGwgcHJvcGVydGllcy5cbiAqIEFzc29jaWF0aXZpdHlcbiAqIE9wZXJhbmQgY291bnQgKE11c3QgYmUgYSBmaXhlZCBudW1iZXIpIFxuICogKFRPRE8/PykgY29tbXV0ZSBncm91cD8gLSBvciBzaG91bGQgdGhpcyBiZSBkZXJpdmVkP1xuICogKFRPRE8/KSBhc3NvY2lhdGl2ZT8gY29tbXV0YXRpdmU/ICAtIFNob3VsZCBiZSBjYWxjdWxhdGVkP1xuICogKFRPRE8/KSBJZGVudGl0eT9cbiovXG5cbi8vIHZhciBtYXRoZW1hdGljYSA9IG5ldyBMYW5ndWFnZShbXG4vLyAgICAgWyc7J10sXG4vLyAgICAgWycsJ10sXG4vLyAgICAgW1snPScsICcrPSddXVxuLy8gXSk7XG5cbn0pKCkiLCIoZnVuY3Rpb24ocHJvY2Vzcyl7LyogcGFyc2VyIGdlbmVyYXRlZCBieSBqaXNvbiAwLjQuMiAqL1xudmFyIHBhcnNlciA9IChmdW5jdGlvbigpe1xudmFyIHBhcnNlciA9IHt0cmFjZTogZnVuY3Rpb24gdHJhY2UoKSB7IH0sXG55eToge30sXG5zeW1ib2xzXzoge1wiZXJyb3JcIjoyLFwiZXhwcmVzc2lvbnNcIjozLFwiU1wiOjQsXCJFT0ZcIjo1LFwiZVwiOjYsXCJzdG10XCI6NyxcIj1cIjo4LFwiIT1cIjo5LFwiPD1cIjoxMCxcIjxcIjoxMSxcIj5cIjoxMixcIj49XCI6MTMsXCJjc2xcIjoxNCxcIixcIjoxNSxcInZlY3RvclwiOjE2LFwiKFwiOjE3LFwiKVwiOjE4LFwiK1wiOjE5LFwiLVwiOjIwLFwiKlwiOjIxLFwiL1wiOjIyLFwiUE9XRVJ7XCI6MjMsXCJ9XCI6MjQsXCJfe1wiOjI1LFwiX1NJTkdMRVwiOjI2LFwiU1FSVHtcIjoyNyxcIkZSQUN7XCI6MjgsXCJ7XCI6MjksXCJeU0lOR0xFXCI6MzAsXCJpZGVudGlmaWVyXCI6MzEsXCJudW1iZXJcIjozMixcIklERU5USUZJRVJcIjozMyxcIkxPTkdJREVOVElGSUVSXCI6MzQsXCJERUNJTUFMXCI6MzUsXCJJTlRFR0VSXCI6MzYsXCIkYWNjZXB0XCI6MCxcIiRlbmRcIjoxfSxcbnRlcm1pbmFsc186IHsyOlwiZXJyb3JcIiw1OlwiRU9GXCIsODpcIj1cIiw5OlwiIT1cIiwxMDpcIjw9XCIsMTE6XCI8XCIsMTI6XCI+XCIsMTM6XCI+PVwiLDE1OlwiLFwiLDE3OlwiKFwiLDE4OlwiKVwiLDE5OlwiK1wiLDIwOlwiLVwiLDIxOlwiKlwiLDIyOlwiL1wiLDIzOlwiUE9XRVJ7XCIsMjQ6XCJ9XCIsMjU6XCJfe1wiLDI2OlwiX1NJTkdMRVwiLDI3OlwiU1FSVHtcIiwyODpcIkZSQUN7XCIsMjk6XCJ7XCIsMzA6XCJeU0lOR0xFXCIsMzM6XCJJREVOVElGSUVSXCIsMzQ6XCJMT05HSURFTlRJRklFUlwiLDM1OlwiREVDSU1BTFwiLDM2OlwiSU5URUdFUlwifSxcbnByb2R1Y3Rpb25zXzogWzAsWzMsMl0sWzQsMV0sWzQsMV0sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzcsM10sWzE0LDNdLFsxNCwzXSxbMTYsM10sWzYsM10sWzYsM10sWzYsM10sWzYsM10sWzYsNF0sWzYsNF0sWzYsMl0sWzYsM10sWzYsNl0sWzYsMl0sWzYsMl0sWzYsMl0sWzYsM10sWzYsMV0sWzYsMV0sWzYsMV0sWzMxLDFdLFszMSwxXSxbMzIsMV0sWzMyLDFdXSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eXRleHQseXlsZW5nLHl5bGluZW5vLHl5LHl5c3RhdGUsJCQsXyQpIHtcblxudmFyICQwID0gJCQubGVuZ3RoIC0gMTtcbnN3aXRjaCAoeXlzdGF0ZSkge1xuY2FzZSAxOiByZXR1cm4gJCRbJDAtMV07IFxuYnJlYWs7XG5jYXNlIDI6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDM6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDQ6dGhpcy4kID0gWyc9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNTp0aGlzLiQgPSBbJyE9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNjp0aGlzLiQgPSBbJzw9JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgNzp0aGlzLiQgPSBbJzwnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA4OnRoaXMuJCA9IFsnPicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDk6dGhpcy4kID0gWyc+PScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDEwOnRoaXMuJCA9IFsnLC4nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMTp0aGlzLiQgPSBbJywnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxMjp0aGlzLiQgPSAkJFskMC0xXTtcbmJyZWFrO1xuY2FzZSAxMzp0aGlzLiQgPSBbJysnLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNDp0aGlzLiQgPSBbJy0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNTp0aGlzLiQgPSBbJyonLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNjp0aGlzLiQgPSBbJy8nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAxNzp0aGlzLiQgPSBbJ14nLCAkJFskMC0zXSwgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDE4OnRoaXMuJCA9IFsnXycsICQkWyQwLTNdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMTk6dGhpcy4kID0gWydfJywgJCRbJDAtMV0sIHt0eXBlOiAnU2luZ2xlJywgcHJpbWl0aXZlOiB5eXRleHQuc3Vic3RyaW5nKDEpfV07XG5icmVhaztcbmNhc2UgMjA6dGhpcy4kID0gWydzcXJ0JywgJCRbJDAtMV1dO1xuYnJlYWs7XG5jYXNlIDIxOnRoaXMuJCA9IFsnZnJhYycsICQkWyQwLTRdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjI6dGhpcy4kID0gWydeJywgJCRbJDAtMV0sIHt0eXBlOiAnU2luZ2xlJywgcHJpbWl0aXZlOiB5eXRleHQuc3Vic3RyaW5nKDEpfV07XG5icmVhaztcbmNhc2UgMjM6dGhpcy4kID0gWydALScsICQkWyQwXV1cbmJyZWFrO1xuY2FzZSAyNDp0aGlzLiQgPSBbJ2RlZmF1bHQnLCAkJFskMC0xXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSAyNTp0aGlzLiQgPSAkJFskMC0xXVxuYnJlYWs7XG5jYXNlIDI2OnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAyNzp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMjg6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDI5OnRoaXMuJCA9IHl5dGV4dDtcbmJyZWFrO1xuY2FzZSAzMDp0aGlzLiQgPSB5eXRleHQuc3Vic3RyaW5nKDEpO1xuYnJlYWs7XG5jYXNlIDMxOnRoaXMuJCA9IHt0eXBlOiAnTnVtYmVyJywgcHJpbWl0aXZlOiB5eXRleHR9O1xuYnJlYWs7XG5jYXNlIDMyOnRoaXMuJCA9IHt0eXBlOiAnTnVtYmVyJywgcHJpbWl0aXZlOiB5eXRleHR9O1xuYnJlYWs7XG59XG59LFxudGFibGU6IFt7MzoxLDQ6Miw2OjMsNzo0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7MTpbM119LHs1OlsxLDE2XX0sezU6WzIsMl0sNjoyNSw4OlsxLDI2XSw5OlsxLDI3XSwxMDpbMSwyOF0sMTE6WzEsMjldLDEyOlsxLDMwXSwxMzpbMSwzMV0sMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDJdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsM10sMjQ6WzIsM119LHs2OjMyLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjozMywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MzQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjM1LDE0OjM2LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwyNl0sODpbMiwyNl0sOTpbMiwyNl0sMTA6WzIsMjZdLDExOlsyLDI2XSwxMjpbMiwyNl0sMTM6WzIsMjZdLDE1OlsyLDI2XSwxNzpbMiwyNl0sMTg6WzIsMjZdLDE5OlsyLDI2XSwyMDpbMiwyNl0sMjE6WzIsMjZdLDIyOlsyLDI2XSwyMzpbMiwyNl0sMjQ6WzIsMjZdLDI1OlsyLDI2XSwyNjpbMiwyNl0sMjc6WzIsMjZdLDI4OlsyLDI2XSwzMDpbMiwyNl0sMzM6WzIsMjZdLDM0OlsyLDI2XSwzNTpbMiwyNl0sMzY6WzIsMjZdfSx7NTpbMiwyN10sODpbMiwyN10sOTpbMiwyN10sMTA6WzIsMjddLDExOlsyLDI3XSwxMjpbMiwyN10sMTM6WzIsMjddLDE1OlsyLDI3XSwxNzpbMiwyN10sMTg6WzIsMjddLDE5OlsyLDI3XSwyMDpbMiwyN10sMjE6WzIsMjddLDIyOlsyLDI3XSwyMzpbMiwyN10sMjQ6WzIsMjddLDI1OlsyLDI3XSwyNjpbMiwyN10sMjc6WzIsMjddLDI4OlsyLDI3XSwzMDpbMiwyN10sMzM6WzIsMjddLDM0OlsyLDI3XSwzNTpbMiwyN10sMzY6WzIsMjddfSx7NTpbMiwyOF0sODpbMiwyOF0sOTpbMiwyOF0sMTA6WzIsMjhdLDExOlsyLDI4XSwxMjpbMiwyOF0sMTM6WzIsMjhdLDE1OlsyLDI4XSwxNzpbMiwyOF0sMTg6WzIsMjhdLDE5OlsyLDI4XSwyMDpbMiwyOF0sMjE6WzIsMjhdLDIyOlsyLDI4XSwyMzpbMiwyOF0sMjQ6WzIsMjhdLDI1OlsyLDI4XSwyNjpbMiwyOF0sMjc6WzIsMjhdLDI4OlsyLDI4XSwzMDpbMiwyOF0sMzM6WzIsMjhdLDM0OlsyLDI4XSwzNTpbMiwyOF0sMzY6WzIsMjhdfSx7NTpbMiwyOV0sODpbMiwyOV0sOTpbMiwyOV0sMTA6WzIsMjldLDExOlsyLDI5XSwxMjpbMiwyOV0sMTM6WzIsMjldLDE1OlsyLDI5XSwxNzpbMiwyOV0sMTg6WzIsMjldLDE5OlsyLDI5XSwyMDpbMiwyOV0sMjE6WzIsMjldLDIyOlsyLDI5XSwyMzpbMiwyOV0sMjQ6WzIsMjldLDI1OlsyLDI5XSwyNjpbMiwyOV0sMjc6WzIsMjldLDI4OlsyLDI5XSwzMDpbMiwyOV0sMzM6WzIsMjldLDM0OlsyLDI5XSwzNTpbMiwyOV0sMzY6WzIsMjldfSx7NTpbMiwzMF0sODpbMiwzMF0sOTpbMiwzMF0sMTA6WzIsMzBdLDExOlsyLDMwXSwxMjpbMiwzMF0sMTM6WzIsMzBdLDE1OlsyLDMwXSwxNzpbMiwzMF0sMTg6WzIsMzBdLDE5OlsyLDMwXSwyMDpbMiwzMF0sMjE6WzIsMzBdLDIyOlsyLDMwXSwyMzpbMiwzMF0sMjQ6WzIsMzBdLDI1OlsyLDMwXSwyNjpbMiwzMF0sMjc6WzIsMzBdLDI4OlsyLDMwXSwzMDpbMiwzMF0sMzM6WzIsMzBdLDM0OlsyLDMwXSwzNTpbMiwzMF0sMzY6WzIsMzBdfSx7NTpbMiwzMV0sODpbMiwzMV0sOTpbMiwzMV0sMTA6WzIsMzFdLDExOlsyLDMxXSwxMjpbMiwzMV0sMTM6WzIsMzFdLDE1OlsyLDMxXSwxNzpbMiwzMV0sMTg6WzIsMzFdLDE5OlsyLDMxXSwyMDpbMiwzMV0sMjE6WzIsMzFdLDIyOlsyLDMxXSwyMzpbMiwzMV0sMjQ6WzIsMzFdLDI1OlsyLDMxXSwyNjpbMiwzMV0sMjc6WzIsMzFdLDI4OlsyLDMxXSwzMDpbMiwzMV0sMzM6WzIsMzFdLDM0OlsyLDMxXSwzNTpbMiwzMV0sMzY6WzIsMzFdfSx7NTpbMiwzMl0sODpbMiwzMl0sOTpbMiwzMl0sMTA6WzIsMzJdLDExOlsyLDMyXSwxMjpbMiwzMl0sMTM6WzIsMzJdLDE1OlsyLDMyXSwxNzpbMiwzMl0sMTg6WzIsMzJdLDE5OlsyLDMyXSwyMDpbMiwzMl0sMjE6WzIsMzJdLDIyOlsyLDMyXSwyMzpbMiwzMl0sMjQ6WzIsMzJdLDI1OlsyLDMyXSwyNjpbMiwzMl0sMjc6WzIsMzJdLDI4OlsyLDMyXSwzMDpbMiwzMl0sMzM6WzIsMzJdLDM0OlsyLDMyXSwzNTpbMiwzMl0sMzY6WzIsMzJdfSx7MTpbMiwxXX0sezY6MzcsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjM4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjozOSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDAsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQxLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NDo0Miw2OjMsNzo0LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxOV0sODpbMiwxOV0sOTpbMiwxOV0sMTA6WzIsMTldLDExOlsyLDE5XSwxMjpbMiwxOV0sMTM6WzIsMTldLDE1OlsyLDE5XSwxNzpbMiwxOV0sMTg6WzIsMTldLDE5OlsyLDE5XSwyMDpbMiwxOV0sMjE6WzIsMTldLDIyOlsyLDE5XSwyMzpbMiwxOV0sMjQ6WzIsMTldLDI1OlsyLDE5XSwyNjpbMiwxOV0sMjc6WzIsMTldLDI4OlsyLDE5XSwzMDpbMiwxOV0sMzM6WzIsMTldLDM0OlsyLDE5XSwzNTpbMiwxOV0sMzY6WzIsMTldfSx7NTpbMiwyMl0sODpbMiwyMl0sOTpbMiwyMl0sMTA6WzIsMjJdLDExOlsyLDIyXSwxMjpbMiwyMl0sMTM6WzIsMjJdLDE1OlsyLDIyXSwxNzpbMiwyMl0sMTg6WzIsMjJdLDE5OlsyLDIyXSwyMDpbMiwyMl0sMjE6WzIsMjJdLDIyOlsyLDIyXSwyMzpbMiwyMl0sMjQ6WzIsMjJdLDI1OlsyLDIyXSwyNjpbMiwyMl0sMjc6WzIsMjJdLDI4OlsyLDIyXSwzMDpbMiwyMl0sMzM6WzIsMjJdLDM0OlsyLDIyXSwzNTpbMiwyMl0sMzY6WzIsMjJdfSx7NTpbMiwyNF0sNjoyNSw4OlsyLDI0XSw5OlsyLDI0XSwxMDpbMiwyNF0sMTE6WzIsMjRdLDEyOlsyLDI0XSwxMzpbMiwyNF0sMTU6WzIsMjRdLDE2OjksMTc6WzEsOF0sMTg6WzIsMjRdLDE5OlsyLDI0XSwyMDpbMiwyNF0sMjE6WzIsMjRdLDIyOlsyLDI0XSwyMzpbMSwyMV0sMjQ6WzIsMjRdLDI1OlsyLDI0XSwyNjpbMiwyNF0sMjc6WzIsMjRdLDI4OlsyLDI0XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0MywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQ1LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0NiwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDcsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQ4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNDldLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDUwXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDIzXSw2OjI1LDg6WzIsMjNdLDk6WzIsMjNdLDEwOlsyLDIzXSwxMTpbMiwyM10sMTI6WzIsMjNdLDEzOlsyLDIzXSwxNTpbMiwyM10sMTY6OSwxNzpbMSw4XSwxODpbMiwyM10sMTk6WzIsMjNdLDIwOlsyLDIzXSwyMTpbMiwyM10sMjI6WzIsMjNdLDIzOlsxLDIxXSwyNDpbMiwyM10sMjU6WzIsMjNdLDI2OlsyLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNTpbMSw1Ml0sMTY6OSwxNzpbMSw4XSwxODpbMSw1MV0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHsxNTpbMSw1NF0sMTg6WzEsNTNdfSx7NTpbMiwxM10sNjoyNSw4OlsyLDEzXSw5OlsyLDEzXSwxMDpbMiwxM10sMTE6WzIsMTNdLDEyOlsyLDEzXSwxMzpbMiwxM10sMTU6WzIsMTNdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTNdLDE5OlsyLDEzXSwyMDpbMiwxM10sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsMTNdLDI1OlsyLDEzXSwyNjpbMiwxM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMTRdLDY6MjUsODpbMiwxNF0sOTpbMiwxNF0sMTA6WzIsMTRdLDExOlsyLDE0XSwxMjpbMiwxNF0sMTM6WzIsMTRdLDE1OlsyLDE0XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE0XSwxOTpbMiwxNF0sMjA6WzIsMTRdLDIxOlsyLDIzXSwyMjpbMiwyM10sMjM6WzEsMjFdLDI0OlsyLDE0XSwyNTpbMiwxNF0sMjY6WzIsMTRdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDE1XSw2OjI1LDg6WzIsMTVdLDk6WzIsMTVdLDEwOlsyLDE1XSwxMTpbMiwxNV0sMTI6WzIsMTVdLDEzOlsyLDE1XSwxNTpbMiwxNV0sMTY6OSwxNzpbMSw4XSwxODpbMiwxNV0sMTk6WzIsMTVdLDIwOlsyLDE1XSwyMTpbMiwxNV0sMjI6WzIsMTVdLDIzOlsxLDIxXSwyNDpbMiwxNV0sMjU6WzIsMTVdLDI2OlsyLDE1XSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxNl0sNjoyNSw4OlsyLDE2XSw5OlsyLDE2XSwxMDpbMiwxNl0sMTE6WzIsMTZdLDEyOlsyLDE2XSwxMzpbMiwxNl0sMTU6WzIsMTZdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTZdLDE5OlsyLDE2XSwyMDpbMiwxNl0sMjE6WzIsMTZdLDIyOlsyLDE2XSwyMzpbMSwyMV0sMjQ6WzIsMTZdLDI1OlsyLDE2XSwyNjpbMiwxNl0sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsxLDU1XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHsyNDpbMSw1Nl19LHs1OlsyLDRdLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDRdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsNV0sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw2XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw2XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDddLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDddLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsOF0sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsOF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw5XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw5XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDIwXSw4OlsyLDIwXSw5OlsyLDIwXSwxMDpbMiwyMF0sMTE6WzIsMjBdLDEyOlsyLDIwXSwxMzpbMiwyMF0sMTU6WzIsMjBdLDE3OlsyLDIwXSwxODpbMiwyMF0sMTk6WzIsMjBdLDIwOlsyLDIwXSwyMTpbMiwyMF0sMjI6WzIsMjBdLDIzOlsyLDIwXSwyNDpbMiwyMF0sMjU6WzIsMjBdLDI2OlsyLDIwXSwyNzpbMiwyMF0sMjg6WzIsMjBdLDMwOlsyLDIwXSwzMzpbMiwyMF0sMzQ6WzIsMjBdLDM1OlsyLDIwXSwzNjpbMiwyMF19LHsyOTpbMSw1N119LHs1OlsyLDI1XSw4OlsyLDI1XSw5OlsyLDI1XSwxMDpbMiwyNV0sMTE6WzIsMjVdLDEyOlsyLDI1XSwxMzpbMiwyNV0sMTU6WzIsMjVdLDE3OlsyLDI1XSwxODpbMiwyNV0sMTk6WzIsMjVdLDIwOlsyLDI1XSwyMTpbMiwyNV0sMjI6WzIsMjVdLDIzOlsyLDI1XSwyNDpbMiwyNV0sMjU6WzIsMjVdLDI2OlsyLDI1XSwyNzpbMiwyNV0sMjg6WzIsMjVdLDMwOlsyLDI1XSwzMzpbMiwyNV0sMzQ6WzIsMjVdLDM1OlsyLDI1XSwzNjpbMiwyNV19LHs2OjU4LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxMl0sODpbMiwxMl0sOTpbMiwxMl0sMTA6WzIsMTJdLDExOlsyLDEyXSwxMjpbMiwxMl0sMTM6WzIsMTJdLDE1OlsyLDEyXSwxNzpbMiwxMl0sMTg6WzIsMTJdLDE5OlsyLDEyXSwyMDpbMiwxMl0sMjE6WzIsMTJdLDIyOlsyLDEyXSwyMzpbMiwxMl0sMjQ6WzIsMTJdLDI1OlsyLDEyXSwyNjpbMiwxMl0sMjc6WzIsMTJdLDI4OlsyLDEyXSwzMDpbMiwxMl0sMzM6WzIsMTJdLDM0OlsyLDEyXSwzNTpbMiwxMl0sMzY6WzIsMTJdfSx7Njo1OSwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMTddLDg6WzIsMTddLDk6WzIsMTddLDEwOlsyLDE3XSwxMTpbMiwxN10sMTI6WzIsMTddLDEzOlsyLDE3XSwxNTpbMiwxN10sMTc6WzIsMTddLDE4OlsyLDE3XSwxOTpbMiwxN10sMjA6WzIsMTddLDIxOlsyLDE3XSwyMjpbMiwxN10sMjM6WzIsMTddLDI0OlsyLDE3XSwyNTpbMiwxN10sMjY6WzIsMTddLDI3OlsyLDE3XSwyODpbMiwxN10sMzA6WzIsMTddLDMzOlsyLDE3XSwzNDpbMiwxN10sMzU6WzIsMTddLDM2OlsyLDE3XX0sezU6WzIsMThdLDg6WzIsMThdLDk6WzIsMThdLDEwOlsyLDE4XSwxMTpbMiwxOF0sMTI6WzIsMThdLDEzOlsyLDE4XSwxNTpbMiwxOF0sMTc6WzIsMThdLDE4OlsyLDE4XSwxOTpbMiwxOF0sMjA6WzIsMThdLDIxOlsyLDE4XSwyMjpbMiwxOF0sMjM6WzIsMThdLDI0OlsyLDE4XSwyNTpbMiwxOF0sMjY6WzIsMThdLDI3OlsyLDE4XSwyODpbMiwxOF0sMzA6WzIsMThdLDMzOlsyLDE4XSwzNDpbMiwxOF0sMzU6WzIsMThdLDM2OlsyLDE4XX0sezY6NjAsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjI1LDE1OlsyLDExXSwxNjo5LDE3OlsxLDhdLDE4OlsyLDExXSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTU6WzIsMTBdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTBdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMjFdLDg6WzIsMjFdLDk6WzIsMjFdLDEwOlsyLDIxXSwxMTpbMiwyMV0sMTI6WzIsMjFdLDEzOlsyLDIxXSwxNTpbMiwyMV0sMTc6WzIsMjFdLDE4OlsyLDIxXSwxOTpbMiwyMV0sMjA6WzIsMjFdLDIxOlsyLDIxXSwyMjpbMiwyMV0sMjM6WzIsMjFdLDI0OlsyLDIxXSwyNTpbMiwyMV0sMjY6WzIsMjFdLDI3OlsyLDIxXSwyODpbMiwyMV0sMzA6WzIsMjFdLDMzOlsyLDIxXSwzNDpbMiwyMV0sMzU6WzIsMjFdLDM2OlsyLDIxXX1dLFxuZGVmYXVsdEFjdGlvbnM6IHsxNjpbMiwxXX0sXG5wYXJzZUVycm9yOiBmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xufSxcbnBhcnNlOiBmdW5jdGlvbiBwYXJzZShpbnB1dCkge1xuICAgIHZhciBzZWxmID0gdGhpcywgc3RhY2sgPSBbMF0sIHZzdGFjayA9IFtudWxsXSwgbHN0YWNrID0gW10sIHRhYmxlID0gdGhpcy50YWJsZSwgeXl0ZXh0ID0gXCJcIiwgeXlsaW5lbm8gPSAwLCB5eWxlbmcgPSAwLCByZWNvdmVyaW5nID0gMCwgVEVSUk9SID0gMiwgRU9GID0gMTtcbiAgICB0aGlzLmxleGVyLnNldElucHV0KGlucHV0KTtcbiAgICB0aGlzLmxleGVyLnl5ID0gdGhpcy55eTtcbiAgICB0aGlzLnl5LmxleGVyID0gdGhpcy5sZXhlcjtcbiAgICB0aGlzLnl5LnBhcnNlciA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmxleGVyLnl5bGxvYyA9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICB0aGlzLmxleGVyLnl5bGxvYyA9IHt9O1xuICAgIHZhciB5eWxvYyA9IHRoaXMubGV4ZXIueXlsbG9jO1xuICAgIGxzdGFjay5wdXNoKHl5bG9jKTtcbiAgICB2YXIgcmFuZ2VzID0gdGhpcy5sZXhlci5vcHRpb25zICYmIHRoaXMubGV4ZXIub3B0aW9ucy5yYW5nZXM7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnl5LnBhcnNlRXJyb3IgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gdGhpcy55eS5wYXJzZUVycm9yO1xuICAgIGZ1bmN0aW9uIHBvcFN0YWNrKG4pIHtcbiAgICAgICAgc3RhY2subGVuZ3RoID0gc3RhY2subGVuZ3RoIC0gMiAqIG47XG4gICAgICAgIHZzdGFjay5sZW5ndGggPSB2c3RhY2subGVuZ3RoIC0gbjtcbiAgICAgICAgbHN0YWNrLmxlbmd0aCA9IGxzdGFjay5sZW5ndGggLSBuO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsZXgoKSB7XG4gICAgICAgIHZhciB0b2tlbjtcbiAgICAgICAgdG9rZW4gPSBzZWxmLmxleGVyLmxleCgpIHx8IDE7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHRva2VuID0gc2VsZi5zeW1ib2xzX1t0b2tlbl0gfHwgdG9rZW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH1cbiAgICB2YXIgc3ltYm9sLCBwcmVFcnJvclN5bWJvbCwgc3RhdGUsIGFjdGlvbiwgYSwgciwgeXl2YWwgPSB7fSwgcCwgbGVuLCBuZXdTdGF0ZSwgZXhwZWN0ZWQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgc3RhdGUgPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdEFjdGlvbnNbc3RhdGVdKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzeW1ib2wgPT09IG51bGwgfHwgdHlwZW9mIHN5bWJvbCA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gbGV4KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY3Rpb24gPSB0YWJsZVtzdGF0ZV0gJiYgdGFibGVbc3RhdGVdW3N5bWJvbF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24gPT09IFwidW5kZWZpbmVkXCIgfHwgIWFjdGlvbi5sZW5ndGggfHwgIWFjdGlvblswXSkge1xuICAgICAgICAgICAgdmFyIGVyclN0ciA9IFwiXCI7XG4gICAgICAgICAgICBpZiAoIXJlY292ZXJpbmcpIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAocCBpbiB0YWJsZVtzdGF0ZV0pXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRlcm1pbmFsc19bcF0gJiYgcCA+IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkLnB1c2goXCInXCIgKyB0aGlzLnRlcm1pbmFsc19bcF0gKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sZXhlci5zaG93UG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyU3RyID0gXCJQYXJzZSBlcnJvciBvbiBsaW5lIFwiICsgKHl5bGluZW5vICsgMSkgKyBcIjpcXG5cIiArIHRoaXMubGV4ZXIuc2hvd1Bvc2l0aW9uKCkgKyBcIlxcbkV4cGVjdGluZyBcIiArIGV4cGVjdGVkLmpvaW4oXCIsIFwiKSArIFwiLCBnb3QgJ1wiICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyBcIidcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSBcIlBhcnNlIGVycm9yIG9uIGxpbmUgXCIgKyAoeXlsaW5lbm8gKyAxKSArIFwiOiBVbmV4cGVjdGVkIFwiICsgKHN5bWJvbCA9PSAxP1wiZW5kIG9mIGlucHV0XCI6XCInXCIgKyAodGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sKSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUVycm9yKGVyclN0ciwge3RleHQ6IHRoaXMubGV4ZXIubWF0Y2gsIHRva2VuOiB0aGlzLnRlcm1pbmFsc19bc3ltYm9sXSB8fCBzeW1ib2wsIGxpbmU6IHRoaXMubGV4ZXIueXlsaW5lbm8sIGxvYzogeXlsb2MsIGV4cGVjdGVkOiBleHBlY3RlZH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb25bMF0gaW5zdGFuY2VvZiBBcnJheSAmJiBhY3Rpb24ubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyc2UgRXJyb3I6IG11bHRpcGxlIGFjdGlvbnMgcG9zc2libGUgYXQgc3RhdGU6IFwiICsgc3RhdGUgKyBcIiwgdG9rZW46IFwiICsgc3ltYm9sKTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGFjdGlvblswXSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBzdGFjay5wdXNoKHN5bWJvbCk7XG4gICAgICAgICAgICB2c3RhY2sucHVzaCh0aGlzLmxleGVyLnl5dGV4dCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh0aGlzLmxleGVyLnl5bGxvYyk7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGFjdGlvblsxXSk7XG4gICAgICAgICAgICBzeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwcmVFcnJvclN5bWJvbCkge1xuICAgICAgICAgICAgICAgIHl5bGVuZyA9IHRoaXMubGV4ZXIueXlsZW5nO1xuICAgICAgICAgICAgICAgIHl5dGV4dCA9IHRoaXMubGV4ZXIueXl0ZXh0O1xuICAgICAgICAgICAgICAgIHl5bGluZW5vID0gdGhpcy5sZXhlci55eWxpbmVubztcbiAgICAgICAgICAgICAgICB5eWxvYyA9IHRoaXMubGV4ZXIueXlsbG9jO1xuICAgICAgICAgICAgICAgIGlmIChyZWNvdmVyaW5nID4gMClcbiAgICAgICAgICAgICAgICAgICAgcmVjb3ZlcmluZy0tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSBwcmVFcnJvclN5bWJvbDtcbiAgICAgICAgICAgICAgICBwcmVFcnJvclN5bWJvbCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgbGVuID0gdGhpcy5wcm9kdWN0aW9uc19bYWN0aW9uWzFdXVsxXTtcbiAgICAgICAgICAgIHl5dmFsLiQgPSB2c3RhY2tbdnN0YWNrLmxlbmd0aCAtIGxlbl07XG4gICAgICAgICAgICB5eXZhbC5fJCA9IHtmaXJzdF9saW5lOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2xpbmUsIGxhc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2xpbmUsIGZpcnN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9jb2x1bW4sIGxhc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIDFdLmxhc3RfY29sdW1ufTtcbiAgICAgICAgICAgIGlmIChyYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB5eXZhbC5fJC5yYW5nZSA9IFtsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLnJhbmdlWzBdLCBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIDFdLnJhbmdlWzFdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHIgPSB0aGlzLnBlcmZvcm1BY3Rpb24uY2FsbCh5eXZhbCwgeXl0ZXh0LCB5eWxlbmcsIHl5bGluZW5vLCB0aGlzLnl5LCBhY3Rpb25bMV0sIHZzdGFjaywgbHN0YWNrKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbikge1xuICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2suc2xpY2UoMCwgLTEgKiBsZW4gKiAyKTtcbiAgICAgICAgICAgICAgICB2c3RhY2sgPSB2c3RhY2suc2xpY2UoMCwgLTEgKiBsZW4pO1xuICAgICAgICAgICAgICAgIGxzdGFjayA9IGxzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFjay5wdXNoKHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMF0pO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2goeXl2YWwuJCk7XG4gICAgICAgICAgICBsc3RhY2sucHVzaCh5eXZhbC5fJCk7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHRhYmxlW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDJdXVtzdGFja1tzdGFjay5sZW5ndGggLSAxXV07XG4gICAgICAgICAgICBzdGFjay5wdXNoKG5ld1N0YXRlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbn07XG51bmRlZmluZWQvKiBnZW5lcmF0ZWQgYnkgamlzb24tbGV4IDAuMS4wICovXG52YXIgbGV4ZXIgPSAoZnVuY3Rpb24oKXtcbnZhciBsZXhlciA9IHtcbkVPRjoxLFxucGFyc2VFcnJvcjpmdW5jdGlvbiBwYXJzZUVycm9yKHN0ciwgaGFzaCkge1xuICAgICAgICBpZiAodGhpcy55eS5wYXJzZXIpIHtcbiAgICAgICAgICAgIHRoaXMueXkucGFyc2VyLnBhcnNlRXJyb3Ioc3RyLCBoYXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xuICAgICAgICB9XG4gICAgfSxcbnNldElucHV0OmZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9tb3JlID0gdGhpcy5fbGVzcyA9IHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnl5bGluZW5vID0gdGhpcy55eWxlbmcgPSAwO1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjayA9IFsnSU5JVElBTCddO1xuICAgICAgICB0aGlzLnl5bGxvYyA9IHtmaXJzdF9saW5lOjEsZmlyc3RfY29sdW1uOjAsbGFzdF9saW5lOjEsbGFzdF9jb2x1bW46MH07XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB0aGlzLnl5bGxvYy5yYW5nZSA9IFswLDBdO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5pbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaCA9IHRoaXMuX2lucHV0WzBdO1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBjaDtcbiAgICAgICAgdGhpcy55eWxlbmcrKztcbiAgICAgICAgdGhpcy5vZmZzZXQrKztcbiAgICAgICAgdGhpcy5tYXRjaCArPSBjaDtcbiAgICAgICAgdGhpcy5tYXRjaGVkICs9IGNoO1xuICAgICAgICB2YXIgbGluZXMgPSBjaC5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubysrO1xuICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9saW5lKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbisrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB0aGlzLnl5bGxvYy5yYW5nZVsxXSsrO1xuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gdGhpcy5faW5wdXQuc2xpY2UoMSk7XG4gICAgICAgIHJldHVybiBjaDtcbiAgICB9LFxudW5wdXQ6ZnVuY3Rpb24gKGNoKSB7XG4gICAgICAgIHZhciBsZW4gPSBjaC5sZW5ndGg7XG4gICAgICAgIHZhciBsaW5lcyA9IGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSBjaCArIHRoaXMuX2lucHV0O1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMueXl0ZXh0LnN1YnN0cigwLCB0aGlzLnl5dGV4dC5sZW5ndGgtbGVuLTEpO1xuICAgICAgICAvL3RoaXMueXlsZW5nIC09IGxlbjtcbiAgICAgICAgdGhpcy5vZmZzZXQgLT0gbGVuO1xuICAgICAgICB2YXIgb2xkTGluZXMgPSB0aGlzLm1hdGNoLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG4gICAgICAgIHRoaXMubWF0Y2ggPSB0aGlzLm1hdGNoLnN1YnN0cigwLCB0aGlzLm1hdGNoLmxlbmd0aC0xKTtcbiAgICAgICAgdGhpcy5tYXRjaGVkID0gdGhpcy5tYXRjaGVkLnN1YnN0cigwLCB0aGlzLm1hdGNoZWQubGVuZ3RoLTEpO1xuXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGgtMSkgdGhpcy55eWxpbmVubyAtPSBsaW5lcy5sZW5ndGgtMTtcbiAgICAgICAgdmFyIHIgPSB0aGlzLnl5bGxvYy5yYW5nZTtcblxuICAgICAgICB0aGlzLnl5bGxvYyA9IHtmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5maXJzdF9saW5lLFxuICAgICAgICAgIGxhc3RfbGluZTogdGhpcy55eWxpbmVubysxLFxuICAgICAgICAgIGZpcnN0X2NvbHVtbjogdGhpcy55eWxsb2MuZmlyc3RfY29sdW1uLFxuICAgICAgICAgIGxhc3RfY29sdW1uOiBsaW5lcyA/XG4gICAgICAgICAgICAgIChsaW5lcy5sZW5ndGggPT09IG9sZExpbmVzLmxlbmd0aCA/IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiA6IDApICsgb2xkTGluZXNbb2xkTGluZXMubGVuZ3RoIC0gbGluZXMubGVuZ3RoXS5sZW5ndGggLSBsaW5lc1swXS5sZW5ndGg6XG4gICAgICAgICAgICAgIHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiAtIGxlblxuICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yYW5nZXMpIHtcbiAgICAgICAgICAgIHRoaXMueXlsbG9jLnJhbmdlID0gW3JbMF0sIHJbMF0gKyB0aGlzLnl5bGVuZyAtIGxlbl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbm1vcmU6ZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb3JlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbmxlc3M6ZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgdGhpcy51bnB1dCh0aGlzLm1hdGNoLnNsaWNlKG4pKTtcbiAgICB9LFxucGFzdElucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhc3QgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSB0aGlzLm1hdGNoLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiAocGFzdC5sZW5ndGggPiAyMCA/ICcuLi4nOicnKSArIHBhc3Quc3Vic3RyKC0yMCkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG51cGNvbWluZ0lucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5leHQgPSB0aGlzLm1hdGNoO1xuICAgICAgICBpZiAobmV4dC5sZW5ndGggPCAyMCkge1xuICAgICAgICAgICAgbmV4dCArPSB0aGlzLl9pbnB1dC5zdWJzdHIoMCwgMjAtbmV4dC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAobmV4dC5zdWJzdHIoMCwyMCkrKG5leHQubGVuZ3RoID4gMjAgPyAnLi4uJzonJykpLnJlcGxhY2UoL1xcbi9nLCBcIlwiKTtcbiAgICB9LFxuc2hvd1Bvc2l0aW9uOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHByZSA9IHRoaXMucGFzdElucHV0KCk7XG4gICAgICAgIHZhciBjID0gbmV3IEFycmF5KHByZS5sZW5ndGggKyAxKS5qb2luKFwiLVwiKTtcbiAgICAgICAgcmV0dXJuIHByZSArIHRoaXMudXBjb21pbmdJbnB1dCgpICsgXCJcXG5cIiArIGMrXCJeXCI7XG4gICAgfSxcbm5leHQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbnB1dCkgdGhpcy5kb25lID0gdHJ1ZTtcblxuICAgICAgICB2YXIgdG9rZW4sXG4gICAgICAgICAgICBtYXRjaCxcbiAgICAgICAgICAgIHRlbXBNYXRjaCxcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgY29sLFxuICAgICAgICAgICAgbGluZXM7XG4gICAgICAgIGlmICghdGhpcy5fbW9yZSkge1xuICAgICAgICAgICAgdGhpcy55eXRleHQgPSAnJztcbiAgICAgICAgICAgIHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLl9jdXJyZW50UnVsZXMoKTtcbiAgICAgICAgZm9yICh2YXIgaT0wO2kgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGVtcE1hdGNoID0gdGhpcy5faW5wdXQubWF0Y2godGhpcy5ydWxlc1tydWxlc1tpXV0pO1xuICAgICAgICAgICAgaWYgKHRlbXBNYXRjaCAmJiAoIW1hdGNoIHx8IHRlbXBNYXRjaFswXS5sZW5ndGggPiBtYXRjaFswXS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZW1wTWF0Y2g7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmZsZXgpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgbGluZXMgPSBtYXRjaFswXS5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgICAgICBpZiAobGluZXMpIHRoaXMueXlsaW5lbm8gKz0gbGluZXMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy55eWxsb2MgPSB7Zmlyc3RfbGluZTogdGhpcy55eWxsb2MubGFzdF9saW5lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLnl5bGluZW5vKzEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdF9jb2x1bW46IHRoaXMueXlsbG9jLmxhc3RfY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9jb2x1bW46IGxpbmVzID8gbGluZXNbbGluZXMubGVuZ3RoLTFdLmxlbmd0aC1saW5lc1tsaW5lcy5sZW5ndGgtMV0ubWF0Y2goL1xccj9cXG4/LylbMF0ubGVuZ3RoIDogdGhpcy55eWxsb2MubGFzdF9jb2x1bW4gKyBtYXRjaFswXS5sZW5ndGh9O1xuICAgICAgICAgICAgdGhpcy55eXRleHQgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgICB0aGlzLm1hdGNoICs9IG1hdGNoWzBdO1xuICAgICAgICAgICAgdGhpcy5tYXRjaGVzID0gbWF0Y2g7XG4gICAgICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbdGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICs9IHRoaXMueXlsZW5nXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21vcmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0ID0gdGhpcy5faW5wdXQuc2xpY2UobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMubWF0Y2hlZCArPSBtYXRjaFswXTtcbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5wZXJmb3JtQWN0aW9uLmNhbGwodGhpcywgdGhpcy55eSwgdGhpcywgcnVsZXNbaW5kZXhdLHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGgtMV0pO1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9uZSAmJiB0aGlzLl9pbnB1dCkgdGhpcy5kb25lID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodG9rZW4pIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pbnB1dCA9PT0gXCJcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuRU9GO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcrKHRoaXMueXlsaW5lbm8rMSkrJy4gVW5yZWNvZ25pemVkIHRleHQuXFxuJyt0aGlzLnNob3dQb3NpdGlvbigpLFxuICAgICAgICAgICAgICAgICAgICB7dGV4dDogXCJcIiwgdG9rZW46IG51bGwsIGxpbmU6IHRoaXMueXlsaW5lbm99KTtcbiAgICAgICAgfVxuICAgIH0sXG5sZXg6ZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgciA9IHRoaXMubmV4dCgpO1xuICAgICAgICBpZiAodHlwZW9mIHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgICAgICB9XG4gICAgfSxcbmJlZ2luOmZ1bmN0aW9uIGJlZ2luKGNvbmRpdGlvbikge1xuICAgICAgICB0aGlzLmNvbmRpdGlvblN0YWNrLnB1c2goY29uZGl0aW9uKTtcbiAgICB9LFxucG9wU3RhdGU6ZnVuY3Rpb24gcG9wU3RhdGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrLnBvcCgpO1xuICAgIH0sXG5fY3VycmVudFJ1bGVzOmZ1bmN0aW9uIF9jdXJyZW50UnVsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvbnNbdGhpcy5jb25kaXRpb25TdGFja1t0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aC0xXV0ucnVsZXM7XG4gICAgfSxcbnRvcFN0YXRlOmZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGgtMl07XG4gICAgfSxcbnB1c2hTdGF0ZTpmdW5jdGlvbiBiZWdpbihjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5iZWdpbihjb25kaXRpb24pO1xuICAgIH0sXG5vcHRpb25zOiB7fSxcbnBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uIGFub255bW91cyh5eSx5eV8sJGF2b2lkaW5nX25hbWVfY29sbGlzaW9ucyxZWV9TVEFSVCkge1xuXG52YXIgWVlTVEFURT1ZWV9TVEFSVDtcbnN3aXRjaCgkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zKSB7XG5jYXNlIDA6Lyogc2tpcCB3aGl0ZXNwYWNlICovXG5icmVhaztcbmNhc2UgMTpyZXR1cm4gJ1RFWFQnXG5icmVhaztcbmNhc2UgMjpyZXR1cm4gMTdcbmJyZWFrO1xuY2FzZSAzOnJldHVybiAxOFxuYnJlYWs7XG5jYXNlIDQ6cmV0dXJuIDI4XG5icmVhaztcbmNhc2UgNTpyZXR1cm4gMjdcbmJyZWFrO1xuY2FzZSA2OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDc6cmV0dXJuIDEwXG5icmVhaztcbmNhc2UgODpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSA5OnJldHVybiAnTkUnXG5icmVhaztcbmNhc2UgMTA6cmV0dXJuIDM0XG5icmVhaztcbmNhc2UgMTE6cmV0dXJuIDMzXG5icmVhaztcbmNhc2UgMTI6cmV0dXJuIDM1XG5icmVhaztcbmNhc2UgMTM6cmV0dXJuIDM2XG5icmVhaztcbmNhc2UgMTQ6cmV0dXJuIDhcbmJyZWFrO1xuY2FzZSAxNTpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNjpyZXR1cm4gMjFcbmJyZWFrO1xuY2FzZSAxNzpyZXR1cm4gMjJcbmJyZWFrO1xuY2FzZSAxODpyZXR1cm4gMjBcbmJyZWFrO1xuY2FzZSAxOTpyZXR1cm4gMTlcbmJyZWFrO1xuY2FzZSAyMDpyZXR1cm4gMTBcbmJyZWFrO1xuY2FzZSAyMTpyZXR1cm4gMTNcbmJyZWFrO1xuY2FzZSAyMjpyZXR1cm4gMTFcbmJyZWFrO1xuY2FzZSAyMzpyZXR1cm4gMTJcbmJyZWFrO1xuY2FzZSAyNDpyZXR1cm4gOVxuYnJlYWs7XG5jYXNlIDI1OnJldHVybiAnJiYnXG5icmVhaztcbmNhc2UgMjY6cmV0dXJuIDI2XG5icmVhaztcbmNhc2UgMjc6cmV0dXJuIDMwXG5icmVhaztcbmNhc2UgMjg6cmV0dXJuIDI1XG5icmVhaztcbmNhc2UgMjk6cmV0dXJuIDIzXG5icmVhaztcbmNhc2UgMzA6cmV0dXJuICchJ1xuYnJlYWs7XG5jYXNlIDMxOnJldHVybiAnJSdcbmJyZWFrO1xuY2FzZSAzMjpyZXR1cm4gMTVcbmJyZWFrO1xuY2FzZSAzMzpyZXR1cm4gJz8nXG5icmVhaztcbmNhc2UgMzQ6cmV0dXJuICc6J1xuYnJlYWs7XG5jYXNlIDM1OnJldHVybiAxN1xuYnJlYWs7XG5jYXNlIDM2OnJldHVybiAxOFxuYnJlYWs7XG5jYXNlIDM3OnJldHVybiAyOVxuYnJlYWs7XG5jYXNlIDM4OnJldHVybiAyNFxuYnJlYWs7XG5jYXNlIDM5OnJldHVybiAnWydcbmJyZWFrO1xuY2FzZSA0MDpyZXR1cm4gJ10nXG5icmVhaztcbmNhc2UgNDE6cmV0dXJuIDVcbmJyZWFrO1xufVxufSxcbnJ1bGVzOiBbL14oPzpcXHMrKS8sL14oPzpcXCRbXlxcJF0qXFwkKS8sL14oPzpcXFxcbGVmdFxcKCkvLC9eKD86XFxcXHJpZ2h0XFwpKS8sL14oPzpcXFxcZnJhY1xceykvLC9eKD86XFxcXHNxcnRcXHspLywvXig/OlxcXFxjZG90XFxiKS8sL14oPzpcXFxcbFtlXSkvLC9eKD86XFxcXGdbZV0pLywvXig/OlxcXFxuW2VdKS8sL14oPzpcXFxcW2EtekEtWl0rKS8sL14oPzpbYS16QS1aXSkvLC9eKD86WzAtOV0rXFwuWzAtOV0qKS8sL14oPzpbMC05XSspLywvXig/Oj0pLywvXig/OlxcKikvLC9eKD86XFwuKS8sL14oPzpcXC8pLywvXig/Oi0pLywvXig/OlxcKykvLC9eKD86PD0pLywvXig/Oj49KS8sL14oPzo8KS8sL14oPzo+KS8sL14oPzohPSkvLC9eKD86JiYpLywvXig/Ol9bXlxcKFxce10pLywvXig/OlxcXlteXFwoXFx7XSkvLC9eKD86X1xceykvLC9eKD86XFxeXFx7KS8sL14oPzohKS8sL14oPzolKS8sL14oPzosKS8sL14oPzpcXD8pLywvXig/OjopLywvXig/OlxcKCkvLC9eKD86XFwpKS8sL14oPzpcXHspLywvXig/OlxcfSkvLC9eKD86XFxbKS8sL14oPzpcXF0pLywvXig/OiQpL10sXG5jb25kaXRpb25zOiB7XCJJTklUSUFMXCI6e1wicnVsZXNcIjpbMCwxLDIsMyw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwxOSwyMCwyMSwyMiwyMywyNCwyNSwyNiwyNywyOCwyOSwzMCwzMSwzMiwzMywzNCwzNSwzNiwzNywzOCwzOSw0MCw0MV0sXCJpbmNsdXNpdmVcIjp0cnVlfX1cbn07XG5yZXR1cm4gbGV4ZXI7XG59KSgpO1xucGFyc2VyLmxleGVyID0gbGV4ZXI7XG5mdW5jdGlvbiBQYXJzZXIgKCkgeyB0aGlzLnl5ID0ge307IH1QYXJzZXIucHJvdG90eXBlID0gcGFyc2VyO3BhcnNlci5QYXJzZXIgPSBQYXJzZXI7XG5yZXR1cm4gbmV3IFBhcnNlcjtcbn0pKCk7XG5pZiAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuZXhwb3J0cy5wYXJzZXIgPSBwYXJzZXI7XG5leHBvcnRzLlBhcnNlciA9IHBhcnNlci5QYXJzZXI7XG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyc2VyLnBhcnNlLmFwcGx5KHBhcnNlciwgYXJndW1lbnRzKTsgfTtcbmV4cG9ydHMubWFpbiA9IGZ1bmN0aW9uIGNvbW1vbmpzTWFpbihhcmdzKSB7XG4gICAgaWYgKCFhcmdzWzFdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2FnZTogJythcmdzWzBdKycgRklMRScpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICAgIHZhciBzb3VyY2UgPSByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYyhyZXF1aXJlKCdwYXRoJykubm9ybWFsaXplKGFyZ3NbMV0pLCBcInV0ZjhcIik7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyc2VyLnBhcnNlKHNvdXJjZSk7XG59O1xuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGV4cG9ydHMubWFpbihwcm9jZXNzLmFyZ3Yuc2xpY2UoMSkpO1xufVxufVxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5mdW5jdGlvbiBMYW5ndWFnZShwYXJzZXIsIENvbnN0cnVjdCwgbGFuZ3VhZ2UpIHtcbiAgICB0aGlzLmNmZyA9IHBhcnNlcjtcbiAgICB0aGlzLkNvbnN0cnVjdCA9IENvbnN0cnVjdDtcbiAgICB2YXIgb3BlcmF0b3JzID0gdGhpcy5vcGVyYXRvcnMgPSB7fSxcbiAgICAgICAgb3BQcmVjZWRlbmNlID0gMDtcbiAgICBmdW5jdGlvbiBvcCh2LCBhc3NvY2lhdGl2aXR5LCBhcml0eSkge1xuXG4gICAgfVxuICAgIGxhbmd1YWdlLmZvckVhY2goZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgZnVuY3Rpb24gZGVmb3Aoc3RyLCBvKSB7XG4gICAgICAgICAgICB2YXIgYXNzb2NpYXRpdml0eSA9IG9bMV0gfHwgJ2xlZnQnO1xuICAgICAgICAgICAgdmFyIGFyaXR5ID0gKG9bMl0gPT09IHVuZGVmaW5lZCkgPyAyIDogb1syXTtcblxuICAgICAgICAgICAgb3BlcmF0b3JzW3N0cl0gPSAge1xuICAgICAgICAgICAgICAgIGFzc29jaWF0aXZpdHk6IGFzc29jaWF0aXZpdHksXG4gICAgICAgICAgICAgICAgcHJlY2VkZW5jZTogb3BQcmVjZWRlbmNlKyssXG4gICAgICAgICAgICAgICAgYXJpdHk6IGFyaXR5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdHIgPSBvWzBdO1xuICAgICAgICBpZiAodHlwZW9mIHN0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGRlZm9wKHN0ciwgbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIuZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgICAgICAgICAgICAgIGRlZm9wKHMsIG8pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuTGFuZ3VhZ2UuQ29kZSA9IHJlcXVpcmUoJy4vQ29kZScpO1xuXG52YXIgXyAgICAgICAgPSBMYW5ndWFnZS5wcm90b3R5cGU7XG5cbl8ucGFyc2UgICAgICA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbl8uc3RyaW5naWZ5ICA9IHJlcXVpcmUoJy4vc3RyaW5naWZ5Jyk7XG5cbl8ucG9zdGZpeCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgb3BlcmF0b3IgPSB0aGlzLm9wZXJhdG9yc1tzdHJdO1xuICAgIHJldHVybiAgb3BlcmF0b3IuYXNzb2NpYXRpdml0eSA9PT0gMCAmJiBcbiAgICAgICAgICAgIG9wZXJhdG9yLmFyaXR5ID09PSAxO1xufTtcblxuXy51bmFyeSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgdW5hcnlfc2Vjb25kYXJ5cyA9IFsnKycsICctJywgJ8KxJ107XG4gICAgcmV0dXJuICh1bmFyeV9zZWNvbmRhcnlzLmluZGV4T2YobykgIT09IC0xKSA/ICgnQCcgKyBvKSA6IGZhbHNlO1xufTtcblxuXy5hc3NvY2lhdGl2ZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fzc29jaWF0aXZlPz8/PycpO1xuICAgIC8vIHJldHVybiB0aGlzLm9wZXJhdG9yc1tzdHJdLmFzc29jaWF0aXZpdHkgPT09IHRydWU7XG59O1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMYW5ndWFnZTtcbiIsIihmdW5jdGlvbigpe3ZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vRXhwcmVzc2lvbicpO1xuXG5tb2R1bGUuZXhwb3J0cy5hdHRhY2ggPSBmdW5jdGlvbiAoZ2xvYmFsKSB7XG5cblxuICAgIGZ1bmN0aW9uIERlcml2YXRpdmUod3J0KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LmRpZmZlcmVudGlhdGUod3J0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgXG4gICAgdmFyIENhcnRTaW5lID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbFxuICAgICAgICAgICAgICAgIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbFxuICAgICAgICAgICAgICAgIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBNLkV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtnbG9iYWwuc2luLmRlZmF1bHQoeCksIGdsb2JhbC5aZXJvXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93KG5ldyBFcnJvcignQ29tcGxleCBTaW5lIENhcnRlc2lhbiBmb3JtIG5vdCBpbXBsZW1lbnRlZCB5ZXQuJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBnbG9iYWxbJ3NpbiddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5zaW4oeC52YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuc2luLCB4XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc2luLCB4XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbihhK2JpKSA9IHNpbihhKWNvc2goYikgKyBpIGNvcyhhKXNpbmgoYilcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cF9iID0gTWF0aC5leHAoeC5faW1hZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3NoX2IgPSAoZXhwX2IgKyAxIC8gZXhwX2IpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpbmhfYiA9IChleHBfYiAtIDEgLyBleHBfYikgLyAyO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleE51bWVyaWNhbChNYXRoLnNpbih4Ll9yZWFsKSAqIGNvc2hfYiwgTWF0aC5jb3MoeC5fcmVhbCkgKiBzaW5oX2IpO1xuICAgICAgICAgICAgKi9cbiAgICAgICAgfSxcbiAgICAgICAgcmVhbGltYWc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBDYXJ0U2luZTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHNpbicsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5zaW4nLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdzaW4nLFxuICAgICAgICB0aXRsZTogJ1NpbmUgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RyaWdvbm9tZXRyaWNfZnVuY3Rpb25zI1NpbmUuMkNfY29zaW5lLjJDX2FuZF90YW5nZW50JyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXHNpbiAoXFxcXHBpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2NvcycsICd0YW4nXVxuICAgIH0pO1xuICAgIGdsb2JhbFsnY29zJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmNvcyh4LnZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5jb3MsIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5jb3MsIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9LFxuICAgICAgICBkZXJpdmF0aXZlOiBnbG9iYWwuc2luWydALSddKCksXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxjb3MnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguY29zJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnY29zJyxcbiAgICAgICAgdGl0bGU6ICdDb3NpbmUgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Nvc2luZSBGdW5jdGlvbiBkZXNjJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGNvcyAoXFxcXHBpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ3NpbicsICd0YW4nXVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsLnNpbi5kZXJpdmF0aXZlID0gZ2xvYmFsLmNvcztcblxuICAgIGdsb2JhbFsndGFuJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIHN5bWJvbGljOiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGdsb2JhbFsnbG9nJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4LCBhc3N1bXB0aW9ucykge1xuXG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHguYSA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHguYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuSW5maW5pdHlbJ0AtJ10oKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmKHYgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5sb2codikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoYXNzdW1wdGlvbnMgJiYgYXNzdW1wdGlvbnMucG9zaXRpdmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5sb2csIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmxvZywgeF0pO1xuICAgICAgICB9LFxuICAgICAgICByZWFsaW1hZzogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBDYXJ0TG9nO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcbG9nJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmxvZycsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ2xvZycsXG4gICAgICAgIHRpdGxlOiAnTmF0dXJhbCBMb2dhcml0aG0nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Jhc2UgZS4gU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTmF0dXJhbF9sb2dhcml0aG0nLFxuICAgICAgICBleGFtcGxlczogWydcXFxcbG9nICh5ZV4oMngpKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2V4cCcsICdMb2cnXVxuICAgIH0pO1xuICAgIHZhciBIYWxmID0gbmV3IEV4cHJlc3Npb24uUmF0aW9uYWwoMSwgMik7XG4gICAgdmFyIENhcnRMb2cgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgICAgICBnbG9iYWwubG9nLmRlZmF1bHQoeC5hYnMoKSksXG4gICAgICAgICAgICAgICAgeC5hcmcoKVxuICAgICAgICAgICAgXSlbJyonXShIYWxmKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIENhcnRMb2cuX19wcm90b19fID0gZ2xvYmFsLmxvZztcbiAgICBnbG9iYWxbJ2F0YW4yJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKCEgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3RvcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoJ2F0YW4gb25seSB0YWtlcyB2ZWN0b3IgYXJndW1lbnRzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4WzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgaWYoeFsxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmF0YW4yKHhbMF0udmFsdWUsIHhbMV0udmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5hdGFuMiwgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuYXRhbjIsIHhdKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICAvL1RPRE86IERBTkdFUiEgQXNzdW1pbmcgcmVhbCBudW1iZXJzLCBidXQgaXQgc2hvdWxkIGhhdmUgc29tZSBmYXN0IHdheSB0byBkbyB0aGlzLlxuICAgICAgICAgICAgcmV0dXJuIFtFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5hdGFuMiwgeF0pLCBNLmdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHRhbl57LTF9JyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLmF0YW4yJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnYXRhbicsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ1R3byBhcmd1bWVudCBhcmN0YW5nZW50IGZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmN0YW4oeSwgeCkuIFdpbGwgZXF1YWwgYXJjdGFuKHkgLyB4KSBleGNlcHQgd2hlbiB4IGFuZCB5IGFyZSBib3RoIG5lZ2F0aXZlLiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BdGFuMidcbiAgICB9KTtcblxuICAgIGdsb2JhbFsnYXRhbiddID0gZ2xvYmFsLmF0YW4yO1xuXG4gICAgZ2xvYmFsWydHYW1tYSddID0ge1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KXtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdhbW1sbih4eCkge1xuICAgICAgICAgICAgICAgIHZhciBqO1xuICAgICAgICAgICAgICAgIHZhciB4LCB0bXAsIHksIHNlcjtcbiAgICAgICAgICAgICAgICB2YXIgY29mID0gW1xuICAgICAgICAgICAgICAgICAgICA1Ny4xNTYyMzU2NjU4NjI5MjM1LFxuICAgICAgICAgICAgICAgICAgICAtNTkuNTk3OTYwMzU1NDc1NDkxMixcbiAgICAgICAgICAgICAgICAgICAgMTQuMTM2MDk3OTc0NzQxNzQ3MSxcbiAgICAgICAgICAgICAgICAgICAgLTAuNDkxOTEzODE2MDk3NjIwMTk5LFxuICAgICAgICAgICAgICAgICAgICAwLjMzOTk0NjQ5OTg0ODExODg4N2UtNCxcbiAgICAgICAgICAgICAgICAgICAgMC40NjUyMzYyODkyNzA0ODU3NTZlLTQsXG4gICAgICAgICAgICAgICAgICAgIC0wLjk4Mzc0NDc1MzA0ODc5NTY0NmUtNCxcbiAgICAgICAgICAgICAgICAgICAgMC4xNTgwODg3MDMyMjQ5MTI0OTRlLTMsXG4gICAgICAgICAgICAgICAgICAgIC0wLjIxMDI2NDQ0MTcyNDEwNDg4M2UtMyxcbiAgICAgICAgICAgICAgICAgICAgMC4yMTc0Mzk2MTgxMTUyMTI2NDNlLTMsXG4gICAgICAgICAgICAgICAgICAgIC0wLjE2NDMxODEwNjUzNjc2Mzg5MGUtMyxcbiAgICAgICAgICAgICAgICAgICAgMC44NDQxODIyMzk4Mzg1Mjc0MzNlLTQsXG4gICAgICAgICAgICAgICAgICAgIC0wLjI2MTkwODM4NDAxNTgxNDA4N2UtNCxcbiAgICAgICAgICAgICAgICAgICAgMC4zNjg5OTE4MjY1OTUzMTYyMzRlLTVcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGlmICh4eCA8PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3coJ2JhZCBhcmcgaW4gZ2FtbWxuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHkgPSB4ID0geHg7XG4gICAgICAgICAgICAgICAgdG1wID0geCArIDUuMjQyMTg3NTAwMDAwMDAwMDA7XG4gICAgICAgICAgICAgICAgdG1wID0gKHggKyAwLjUpICogTWF0aC5sb2codG1wKSAtIHRtcDtcbiAgICAgICAgICAgICAgICBzZXIgPSAwLjk5OTk5OTk5OTk5OTk5NzA5MjtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgMTQ7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHNlciArPSBjb2Zbal0gLyArK3k7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0bXAgKyBNYXRoLmxvZygyLjUwNjYyODI3NDYzMTAwMDUgKiBzZXIgLyB4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB4LmE7XG4gICAgICAgICAgICAgICAgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5Db21wbGV4SW5maW5pdHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKHYgPCAxNSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGkgPSAxOyBpIDwgdjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwICo9IGk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIocCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLkdhbW1hLCB4XSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHYgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5JbmZpbml0eTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoLU1hdGguUEkgLyAodiAqIE1hdGguc2luKE1hdGguUEkgKiB2KSAqIE1hdGguZXhwKGdhbW1sbigtdikpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguZXhwKGdhbW1sbih2KSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5HYW1tYSwgeF0pO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcR2FtbWEnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ00uZ2xvYmFsLkdhbW1hLmYnLFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGU6ICdHYW1tYSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvR2FtbWFfZnVuY3Rpb24nLFxuICAgICAgICBleGFtcGxlczogWydcXFxcR2FtbWEgKHgpJywgJ3ghJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnTG9nJywgJ0xvZ0dhbW1hJ11cbiAgICB9O1xuICAgIGdsb2JhbFsnUmUnXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgcmV0dXJuIHgucmVhbCgpO1xuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiBbeC5yZWFsKCksIGdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXFJlJ1xuICAgIH07XG4gICAgZ2xvYmFsWydJbSddID0ge1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4geC5pbWFnKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRpc3RyaWJ1dGVkX3VuZGVyX2RpZmZlcmVudGlhdGlvbjogdHJ1ZSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICByZXR1cm4gW3guaW1hZygpLCBnbG9iYWwuWmVyb107XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxJbSdcbiAgICB9XG4gICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwucHJvdG90eXBlLnBvc2l0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWzBdLnBvc2l0aXZlICYmIHRoaXNbMV0ucG9zaXRpdmUgJiYgdGhpc1swXS5wb3NpdGl2ZSgpICYmIHRoaXNbMV0ucG9zaXRpdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicpIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IHRoaXNbMV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzWzBdLnBvc2l0aXZlICYmIHRoaXNbMV0ucG9zaXRpdmUgJiYgdGhpc1swXS5wb3NpdGl2ZSgpICYmIHRoaXNbMV0ucG9zaXRpdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnXicpIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSB0aGlzWzFdLnJlZHVjZSgpO1xuICAgICAgICAgICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGUucG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID4gMDtcbiAgICB9O1xuICAgIGdsb2JhbFsnc3FydCddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYodiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWwuWmVybywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnNxcnQodikpXG4gICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnNxcnQodikpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgICAgICAgICBpZih4LnBvc2l0aXZlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgICAgICAgICAgICAgIHhbMF0sXG4gICAgICAgICAgICAgICAgICAgIHhbMV1bJy8nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDIpKVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICB0aHJvdygnU1FSVDogPz8/Jyk7XG4gICAgICAgICAgICBzd2l0Y2ggKHguY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlIEV4cHJlc3Npb24uQ29tcGxleDpcbiAgICAgICAgICAgICAgICAgICAgLy9odHRwOi8vd3d3Lm1hdGhwcm9wcmVzcy5jb20vc3Rhbi9iaWJsaW9ncmFwaHkvY29tcGxleFNxdWFyZVJvb3QucGRmXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZ25fYjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHguX2ltYWcgPT09IDAuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoTWF0aC5zcXJ0KHguX3JlYWwpLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKHguX2ltYWc+MCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2duX2IgPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZ25fYiA9IC0xLjA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNfYTJfYjIgPSBNYXRoLnNxcnQoeC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gb25lX29uX3J0MiAqIE1hdGguc3FydChzX2EyX2IyICsgeC5fcmVhbCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxID0gc2duX2IgKiBvbmVfb25fcnQyICogTWF0aC5zcXJ0KHNfYTJfYjIgLSB4Ll9yZWFsKTtcbiAgICAgICAgICAgICAgICBjYXNlIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlJlYWxOdW1lcmljYWwoTWF0aC5zcXJ0KHgpKTtcbiAgICAgICAgICAgICAgICBjYXNlIEV4cHJlc3Npb24uTGlzdC5SZWFsOlxuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ14nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLmFicy5hcHBseSh1bmRlZmluZWQsIHhbMF0uYXBwbHkoJ14nLCB4WzFdLmFwcGx5KCcvJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgyLDApKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHlfcmVhbGltYWc6IGZ1bmN0aW9uKG9wLCB4KSB7XG4gICAgICAgICAgICAvL1RPRE86IERBTkdFUiEgQXNzdW1pbmcgcmVhbCBudW1iZXJzLCBidXQgaXQgc2hvdWxkIGhhdmUgc29tZSBmYXN0IHdheSB0byBkbyB0aGlzLlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvL1VzZXMgZXhwLCBhdGFuMiBhbmQgbG9nIGZ1bmN0aW9ucy4gQSByZWFsbHkgYmFkIGlkZWEuIChzcXVhcmUgcm9vdGluZywgdGhlbiBzcXVhcmluZywgdGhlbiBhdGFuLCBhbHNvIFtleHAobG9nKV0pXG4gICAgICAgICAgICByZXR1cm4geFsnXiddKG5ldyBFeHByZXNzaW9uLlJhdGlvbmFsKDEsIDIpKS5yZWFsaW1hZygpO1xuICAgICAgICAgICAgLy92YXIgcmkgPSB4LnJlYWxpbWFnKCk7XG4gICAgICAgICAgICAvL3JldHVybiBbRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pLCBNLmdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXHNxcnQnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguc3FydCcsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ3NxcnQnLFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0bGU6ICdTcXJ0IEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TcXVhcmVfUm9vdCcsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxzcXJ0ICh4XjQpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsncG93JywgJ2FicycsICdtb2QnXVxuICAgIH0pO1xuICAgIGdsb2JhbFsnYWJzJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAvL1VzaW5nIGFicyBpcyBiZXR0ZXIgKEkgdGhpbmspIGJlY2F1c2UgaXQgZmluZHMgdGhlIG1ldGhvZCB0aHJvdWdoIHRoZSBwcm90b3R5cGUgY2hhaW4sXG4gICAgICAgICAgICAvL3doaWNoIGlzIGdvaW5nIHRvIGJlIGZhc3RlciB0aGFuIGRvaW5nIGFuIGlmIGxpc3QgLyBzd2l0Y2ggY2FzZSBsaXN0LlxuICAgICAgICAgICAgcmV0dXJuIHguYWJzKCk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxhYnMnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguYWJzJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnYWJzJyxcbiAgICAgICAgdGl0aWU6ICdBYnNvbHV0ZSBWYWx1ZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWJzJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGFicyAoLTMpJywgJ1xcXFxhYnMgKGkrMyknXSxcbiAgICAgICAgcmVsYXRlZDogWydhcmcnLCAndGFuJ11cbiAgICB9KTtcblxuICAgIC8vIEl0IGlzIHNlbGYtcmVmZXJlbnRpYWxcbiAgICBnbG9iYWwuYWJzLmRlcml2YXRpdmUgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHMgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCgpO1xuICAgICAgICAgICAgdmFyIHkgPSBzWycvJ10ocy5hYnMoKSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMoeSwgW3NdKTtcbiAgICB9KCkpO1xuICAgIGdsb2JhbFsnYXJnJ10gPSB7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FSRyBJUyBGT1IgVVNFUiBJTlBVVCBPTkxZLiBVU0UgLmFyZygpJyk7XG4gICAgICAgICAgICAvL1VzaW5nIGFicyBpcyBiZXR0ZXIgKEkgdGhpbmspIGJlY2F1c2UgaXQgZmluZHMgdGhlIG1ldGhvZCB0aHJvdWdoIHRoZSBwcm90b3R5cGUgY2hhaW4sXG4gICAgICAgICAgICAvL3doaWNoIGlzIGdvaW5nIHRvIGJlIGZhc3RlciB0aGFuIGRvaW5nIGFuIGlmIGxpc3QgLyBzd2l0Y2ggY2FzZSBsaXN0LiBUT0RPOiBDaGVjayB0aGUgdHJ1dGhmdWxsbmVzIG9mIHRoaXMhXG4gICAgICAgICAgICByZXR1cm4geC5hcmcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGFyZycsIC8vdGVtcFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguYXJnX3JlYWwnLFxuICAgICAgICB0b1R5cGVkU3RyaW5nOiBmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzOiB0aGlzW2xhbmd1YWdlXSxcbiAgICAgICAgICAgICAgICB0OmphdmFzY3JpcHQuRnVuY3Rpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGl0aWU6ICdBcmcgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FyZycsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxhcmcgKC0zKScsICdcXFxcYXJnICgzKScsICdcXFxcYXJnKDMrMmkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnYWJzJ11cbiAgICB9XG5cblxuXG4gICAgZ2xvYmFsWydlJ10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguRSwgMCk7XG4gICAgZ2xvYmFsWydlJ10udGl0bGUgPSAnZSc7XG4gICAgZ2xvYmFsWydlJ10uZGVzY3JpcHRpb24gPSAnVGhlIHRyYW5zY2VuZGVudGFsIG51bWJlciB0aGF0IGlzIHRoZSBiYXNlIG9mIHRoZSBuYXR1cmFsIGxvZ2FyaXRobSwgYXBwcm94aW1hdGVseSBlcXVhbCB0byAyLjcxODI4Lic7XG4gICAgZ2xvYmFsLmUucyA9IGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ01hdGguRScpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGxhbmcgPT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ2UnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvZGUoJzIuNzE4MjgxODI4NDU5MDQ1Jyk7XG4gICAgfTtcblxuXG4gICAgZ2xvYmFsWydwaSddID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLlBJLCAwKTtcbiAgICBnbG9iYWxbJ3BpJ10udGl0bGUgPSAnUGknO1xuICAgIGdsb2JhbFsncGknXS5kZXNjcmlwdGlvbiA9ICcnO1xuICAgIGdsb2JhbC5waS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnTWF0aC5QSScpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdcXFxccGknKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvZGUoJzMuMTQxNTkyNjUzNTg5NzkzJyk7XG4gICAgfTtcbiAgICAvLyBUaGUgcmVhbCBjaXJjbGUgY29uc3RhbnQ6XG4gICAgZ2xvYmFsLnRhdSA9IGdsb2JhbFsncGknXVsnKiddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoMikpO1xuXG4gICAgZ2xvYmFsWydJbmZpbml0eSddID0gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChJbmZpbml0eSwgMCk7XG4gICAgZ2xvYmFsWydJbmZpbml0eSddLnRpdGxlID0gJ0luZmluaXR5JztcbiAgICBnbG9iYWxbJ0luZmluaXR5J10uZGVzY3JpcHRpb24gPSAnJztcbiAgICBnbG9iYWxbJ2luZnR5J10gPSBnbG9iYWwuSW5maW5pdHk7XG5cblxuICAgIGdsb2JhbFsnWmVybyddID0gbmV3IEV4cHJlc3Npb24uSW50ZWdlcigwKTtcbiAgICBnbG9iYWxbJ1plcm8nXS50aXRsZSA9ICdaZXJvJztcbiAgICBnbG9iYWxbJ1plcm8nXS5kZXNjcmlwdGlvbiA9ICdBZGRpdGl2ZSBJZGVudGl0eSc7XG4gICAgZ2xvYmFsWydaZXJvJ11bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICB9O1xuICAgIGdsb2JhbFsnWmVybyddWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9O1xuICAgIGdsb2JhbFsnWmVybyddWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIGdsb2JhbFsnWmVybyddWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH07XG5cbiAgICBnbG9iYWxbJ09uZSddID0gbmV3IEV4cHJlc3Npb24uSW50ZWdlcigxKTtcbiAgICBnbG9iYWxbJ09uZSddLnRpdGxlID0gJ09uZSc7XG4gICAgZ2xvYmFsWydPbmUnXS5kZXNjcmlwdGlvbiA9ICdNdWx0aXBsaWNhdGl2ZSBJZGVudGl0eSc7XG4gICAgZ2xvYmFsWydPbmUnXVsnKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfTtcblxuICAgIGdsb2JhbC5sb2cuZGVyaXZhdGl2ZSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljKGdsb2JhbC5PbmVbJy8nXShuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCgpKSk7XG5cbiAgICBnbG9iYWxbJ2knXSA9IG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbZ2xvYmFsWydaZXJvJ10sIGdsb2JhbFsnT25lJ11dKTtcbiAgICBnbG9iYWxbJ2knXS50aXRsZSA9ICdJbWFnaW5hcnkgVW5pdCc7XG4gICAgZ2xvYmFsWydpJ10uZGVzY3JpcHRpb24gPSAnQSBudW1iZXIgd2hpY2ggc2F0aXNmaWVzIHRoZSBwcm9wZXJ0eSA8bT5pXjIgPSAtMTwvbT4uJztcbiAgICBnbG9iYWxbJ2knXS5yZWFsaW1hZyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICBnbG9iYWwuWmVybyxcbiAgICAgICAgICAgIGdsb2JhbC5PbmVcbiAgICAgICAgXSk7XG4gICAgfTtcbiAgICBnbG9iYWxbJ2knXVsnKltUT0RPXSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgXG4gICAgfTtcblxuICAgIGdsb2JhbFsnZCddID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24oe1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCh4KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2xvYmFsLmRbJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkluZmluaXRlc2ltYWwpIHtcbiAgICAgICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIERlcml2YXRpdmUgb3BlcmF0b3JcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERlcml2YXRpdmUoeC54KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh4LngsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGVyaXZhdGl2ZSh4KTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdygnQ29uZnVzaW5nIGluZml0ZXNpbWFsIGRpdmlzaW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdygnRGl2aWRpbmcgZCBieSBzb21lIGxhcmdlIG51bWJlci4nKTtcbiAgICAgICAgXG4gICAgfTtcbiAgICBnbG9iYWxbJ3VuZGVmaW5lZCddID0ge1xuICAgICAgICBzOiBmdW5jdGlvbiAobGFuZyl7XG4gICAgICAgICAgICBpZiAobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ3VuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJygxLjAvMC4wKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkaWZmZXJlbnRpYXRlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnKic6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcrJzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy0nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ14nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ0AtJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGdsb2JhbFsnc3VtJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICB0aHJvdygnU3VtIG5vdCBwcm9wZXJseSBjb25zdHJ1Y3RlZCB5ZXQuJyk7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGdsb2JhbFsnc3VtJ11bJ18nXSA9IGZ1bmN0aW9uIChlcSkge1xuICAgICAgICAvLyBzdGFydDogXG4gICAgICAgIHZhciB0ID0gZXFbMF07XG4gICAgICAgIHZhciB2ID0gZXFbMV07XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh0LCB2KTtcbiAgICB9XG4gICAgXG59O1xufSkoKSIsIihmdW5jdGlvbigpe3ZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxuZnVuY3Rpb24gRXhwcmVzc2lvbigpIHtcbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFeHByZXNzaW9uO1xuXG5FeHByZXNzaW9uLkxpc3QgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xpc3QnKTtcbkV4cHJlc3Npb24uTGlzdC5SZWFsICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTGlzdC9SZWFsJyk7XG5FeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbiAgPSByZXF1aXJlKCcuL0xpc3QvQ29tcGxleENhcnRlc2lhbicpO1xuRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhciAgICAgID0gcmVxdWlyZSgnLi9MaXN0L0NvbXBsZXhQb2xhcicpO1xuRXhwcmVzc2lvbi5Db25zdGFudCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Db25zdGFudCcpO1xuRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4ICAgICAgID0gcmVxdWlyZSgnLi9Db25zdGFudC9OdW1lcmljYWxDb21wbGV4Jyk7XG5FeHByZXNzaW9uLk51bWVyaWNhbFJlYWwgICAgICAgICAgPSByZXF1aXJlKCcuL0NvbnN0YW50L051bWVyaWNhbENvbXBsZXgvTnVtZXJpY2FsUmVhbCcpO1xuRXhwcmVzc2lvbi5SYXRpb25hbCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Db25zdGFudC9OdW1lcmljYWxDb21wbGV4L051bWVyaWNhbFJlYWwvUmF0aW9uYWwnKTtcbkV4cHJlc3Npb24uSW50ZWdlciAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vQ29uc3RhbnQvTnVtZXJpY2FsQ29tcGxleC9OdW1lcmljYWxSZWFsL1JhdGlvbmFsL0ludGVnZXInKTtcbkV4cHJlc3Npb24uU3ltYm9sICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3ltYm9sJyk7XG5FeHByZXNzaW9uLlN5bWJvbC5SZWFsICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N5bWJvbC9SZWFsJyk7XG5FeHByZXNzaW9uLlN0YXRlbWVudCAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1N0YXRlbWVudCcpO1xuRXhwcmVzc2lvbi5WZWN0b3IgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9WZWN0b3InKTtcbkV4cHJlc3Npb24uTWF0cml4ICAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTWF0cml4Jyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uJyk7XG5FeHByZXNzaW9uLkZ1bmN0aW9uLlN5bWJvbGljICAgICAgPSByZXF1aXJlKCcuL0Z1bmN0aW9uL1N5bWJvbGljJyk7XG5FeHByZXNzaW9uLkluZmluaXRlc2ltYWwgICAgICAgICAgPSByZXF1aXJlKCcuL0luZmluaXRlc2ltYWwnKTtcblxudmFyIF8gPSBFeHByZXNzaW9uLnByb3RvdHlwZTtcblxuXy50b1N0cmluZyA9IG51bGw7XG5fLnZhbHVlT2YgPSBudWxsO1xuXG5fLmltYWdlVVJMID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnaHR0cDovL2xhdGV4LmNvZGVjb2dzLmNvbS9naWYubGF0ZXg/JyArXG4gICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnMoJ3RleHQvbGF0ZXgnKS5zKTtcbn07XG5cbl8ucmVuZGVyTGFUZVggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uuc3JjID0gdGhpcy5pbWFnZVVSTCgpO1xuICAgIHJldHVybiBpbWFnZTtcbn07XG5cbi8vIHN1YnN0dXRpb24gZGVmYXVsdDpcbl8uc3ViID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gbGltaXQgZGVmYXVsdFxuXy5saW0gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiB0aGlzLnN1Yih4LCB5KTtcbn07XG5cbl9bJywnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3RhdGVtZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db25kaXRpb25hbCh4LCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG59O1xuXG5cblsnPScsICchPScsICc+JywgJz49JywgJzwnLCAnPD0nXS5mb3JFYWNoKGZ1bmN0aW9uIChvcGVyYXRvcikge1xuICAgIF9bb3BlcmF0b3JdID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlN0YXRlbWVudCh0aGlzLCB4LCBvcGVyYXRvcik7XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5cbi8vIFRoZSBkZWZhdWx0IG9wZXJhdG9yIG9jY3VycyB3aGVuIHR3byBleHByZXNzaW9ucyBhcmUgYWRqYWNlbnQgdG8gZWFjaG90aGVyOiBTIC0+IGUgZS5cbi8vIERlcGVuZGluZyBvbiB0aGUgdHlwZSwgaXQgdXN1YWxseSByZXByZXNlbnRzIGFzc29jaWF0aXZlIG11bHRpcGxpY2F0aW9uLlxuLy8gU2VlIGJlbG93IGZvciB0aGUgZGVmYXVsdCAnKicgb3BlcmF0b3IgaW1wbGVtZW50YXRpb24uXG5fLmRlZmF1bHQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzWycqJ10oeCk7XG59O1xuXG5bJy8nLCAnKycsICctJywgJ0AtJywgJ14nLCAnJSddLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgX1tvcGVyYXRvcl0gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbiAgICB9O1xufSk7XG5cblxuXG5cbi8vIFRoaXMgbWF5IGxvb2sgbGlrZSB3ZSBhcmUgYXNzdW1pbmcgdGhhdCB4IGlzIGEgbnVtYmVyLFxuLy8gYnV0IHJlYWxseSB0aGUgaW1wb3J0YW50IGFzc3VtcHRpb24gaXMgc2ltcGx5XG4vLyB0aGF0IGl0IGlzIGZpbml0ZS5cbi8vIFRodXMgaW5maW5pdGllcyBhbmQgaW5kZXRlcm1pbmF0ZXMgc2hvdWxkIEFMV0FZU1xuLy8gb3ZlcnJpZGUgdGhpcyBvcGVyYXRvclxuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcqJyk7XG59O1xuXG5cblxuXG5cblxuXG5cblxuXG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCAgICA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBnbG9iYWwgID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcblxudXRpbC5pbmhlcml0cyhDb250ZXh0LCB7cHJvdG90eXBlOiBnbG9iYWx9KTtcblxuZnVuY3Rpb24gQ29udGV4dCgpIHtcblxufVxuXG5Db250ZXh0LnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNwbGljZSgwKTtcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXsvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBGdW5jdGlvbiAod2hpY2ggaXQgY2FsbHMgZXZhbClcbi8qanNoaW50IC1XMDYxICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29kZTtcblxuZnVuY3Rpb24gQ29kZShzLCBwcmUpe1xuICAgIHRoaXMucHJlID0gW10gfHwgcHJlO1xuICAgIHRoaXMucyA9ICcnIHx8IHM7XG4gICAgdGhpcy52YXJzID0gMDtcbiAgICB0aGlzLnAgPSBJbmZpbml0eTtcbn1cblxudmFyIF8gPSBDb2RlLnByb3RvdHlwZTtcblxuLypcbiAgICBUaGlzIHVzZXMgYSBnbG9iYWwgc3RhdGUuXG5cbiAgICBQZXJoYXBzIHRoZXJlIGlzIGEgbmljZXIgd2F5LCBidXQgdGhpcyB3aWxsIHdvcmsuXG4qL1xuQ29kZS5uZXdDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIENvZGUuY29udGV4dFZhcmlhYmxlQ291bnQgPSAwO1xufTtcblxuQ29kZS5uZXdDb250ZXh0KCk7XG5cbi8vIEZvciBmYXN0ZXIgZXZhbHVhdGlvbiBtdWx0aXBsZSBzdGF0bWVudHMuIEZvciBleGFtcGxlICh4KzMpXjIgd2lsbCBmaXJzdCBjYWxjdWxhdGUgeCszLCBhbmQgc28gb24uXG5fLnZhcmlhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAndCcgKyAoQ29kZS5jb250ZXh0VmFyaWFibGVDb3VudCsrKS50b1N0cmluZygzNik7XG59O1xuXG5fLm1lcmdlID0gZnVuY3Rpb24gKG8sIHN0ciwgcCwgcHJlKSB7XG4gICAgdGhpcy5zID0gc3RyO1xuICAgIGlmIChwcmUpIHtcbiAgICAgICAgdGhpcy5wcmUucHVzaChwcmUpO1xuICAgIH1cbiAgICB2YXIgaTtcbiAgICB0aGlzLnByZS5wdXNoLmFwcGx5KHRoaXMucHJlLCBvLnByZSk7XG4gICAgdGhpcy52YXJzICs9IG8udmFycztcbiAgICB0aGlzLnAgPSBwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXy51cGRhdGUgPSBmdW5jdGlvbiAoc3RyLCBwLCBwcmUpIHtcbiAgICB0aGlzLnAgPSBwO1xuICAgIGlmKHByZSkge1xuICAgICAgICB0aGlzLnByZS5wdXNoKHByZSk7XG4gICAgfVxuICAgIHRoaXMucyA9IHN0cjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEphdmFzY3JpcHQgY29tcGxpYXRpb25cbl8uY29tcGlsZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKHgsIHRoaXMucHJlLmpvaW4oJ1xcbicpICsgJ3JldHVybiAnICsgdGhpcy5zKTtcbn07XG5cbl8uZ2xzbEZ1bmN0aW9uID0gZnVuY3Rpb24gKHR5cGUsIG5hbWUsIHBhcmFtZXRlcnMpIHtcbiAgICByZXR1cm4gdHlwZSArICcgJyArIG5hbWUgKyAnKCcgKyBwYXJhbWV0ZXJzICsgJyl7XFxuJyArIHRoaXMucHJlLmpvaW4oJ1xcbicpICsgJ3JldHVybiAnICsgdGhpcy5zICsgJztcXG59XFxuJztcbn07XG5cblxufSkoKSIsIi8vIG5vdGhpbmcgdG8gc2VlIGhlcmUuLi4gbm8gZmlsZSBtZXRob2RzIGZvciB0aGUgYnJvd3NlclxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2Z1bmN0aW9uIGZpbHRlciAoeHMsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZuKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gUmVnZXggdG8gc3BsaXQgYSBmaWxlbmFtZSBpbnRvIFsqLCBkaXIsIGJhc2VuYW1lLCBleHRdXG4vLyBwb3NpeCB2ZXJzaW9uXG52YXIgc3BsaXRQYXRoUmUgPSAvXiguK1xcLyg/ISQpfFxcLyk/KCg/Oi4rPyk/KFxcLlteLl0qKT8pJC87XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xudmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICB2YXIgcGF0aCA9IChpID49IDApXG4gICAgICA/IGFyZ3VtZW50c1tpXVxuICAgICAgOiBwcm9jZXNzLmN3ZCgpO1xuXG4gIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8ICFwYXRoKSB7XG4gICAgY29udGludWU7XG4gIH1cblxuICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn1cblxuLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xudmFyIGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nLFxuICAgIHRyYWlsaW5nU2xhc2ggPSBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nO1xuXG4vLyBOb3JtYWxpemUgdGhlIHBhdGhcbnBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cbiAgXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIHJldHVybiBwICYmIHR5cGVvZiBwID09PSAnc3RyaW5nJztcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgZGlyID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsxXSB8fCAnJztcbiAgdmFyIGlzV2luZG93cyA9IGZhbHNlO1xuICBpZiAoIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWVcbiAgICByZXR1cm4gJy4nO1xuICB9IGVsc2UgaWYgKGRpci5sZW5ndGggPT09IDEgfHxcbiAgICAgIChpc1dpbmRvd3MgJiYgZGlyLmxlbmd0aCA8PSAzICYmIGRpci5jaGFyQXQoMSkgPT09ICc6JykpIHtcbiAgICAvLyBJdCBpcyBqdXN0IGEgc2xhc2ggb3IgYSBkcml2ZSBsZXR0ZXIgd2l0aCBhIHNsYXNoXG4gICAgcmV0dXJuIGRpcjtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhIGZ1bGwgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICByZXR1cm4gZGlyLnN1YnN0cmluZygwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbMl0gfHwgJyc7XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVszXSB8fCAnJztcbn07XG5cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ2lmeShleHByLCBsYW5nKSB7XG4gICAgcmV0dXJuIGV4cHIucyhsYW5nKTtcbn07XG4iLCIoZnVuY3Rpb24oKXt2YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uL0V4cHJlc3Npb24nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocywgYmFzZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAocyA9PT0gJycgfHwgcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIFxuICAgIHZhciByb290ID0gT2JqZWN0LmNyZWF0ZSh7fSk7XG4gICAgdmFyIGNvbnRleHQgPSByb290O1xuICAgIFxuICAgIHZhciBmcmVlID0ge307XG4gICAgdmFyIGJvdW5kID0ge307XG4gICAgXG4gICAgZnVuY3Rpb24gZG93bih2YXJzKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBjb250ZXh0O1xuICAgICAgICBjb250ZXh0ID0gT2JqZWN0LmNyZWF0ZShjb250ZXh0KTtcbiAgICAgICAgY29udGV4dC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpIGluIHZhcnMpIHtcbiAgICAgICAgICAgIGlmICh2YXJzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dFtpXSA9IHZhcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gdXAoZW50aXR5KSB7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0LiRwYXJlbnQ7XG4gICAgICAgIHJldHVybiBlbnRpdHk7XG4gICAgfVxuICAgIC8qXG4gICAgICAgIEV2YWx1YXRlIEFTVCB0cmVlICh0b3AtZG93bilcbiAgICAgICAgXG4gICAgICAgIEV4YW1wbGVzOlxuICAgICAgICAgICAgKiB5PXheMlxuICAgICAgICAgICAgICAgIFsnPScsIHksIFsnXicsIHgsIDJdXVxuICAgIFxuICAgICovXG4gICAgdmFyIGxvb3NlID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gZXZhbHVhdGUoYXN0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXN0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHN5bWJvbDtcbiAgICAgICAgICAgIGlmICgoc3ltYm9sID0gY29udGV4dFthc3RdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChzeW1ib2wgPSBiYXNlW2FzdF0pKSB7XG4gICAgICAgICAgICAgICAgYm91bmRbYXN0XSA9IHN5bWJvbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnJlZVthc3RdID0gc3ltYm9sID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoYXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJvb3RbYXN0XSA9IHN5bWJvbDtcbiAgICAgICAgICAgIHJldHVybiBzeW1ib2w7XG4gICAgICAgIH0gZWxzZSBpZiAoYXN0LnByaW1pdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuQ29uc3RydWN0W2FzdC50eXBlXShhc3QucHJpbWl0aXZlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXN0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYXN0MSA9IGV2YWx1YXRlKGFzdFsxXSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhc3RbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZnJhYyc6XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3RbMF0gPSAnLyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnXyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBiaW5kIHVuZGVybmVhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhc3RbMV0gPT09ICdzdW0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gYXN0WzJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaW1pdFswXSA9PT0gJz0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGR1bW15IHZhcmlhYmxlOiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHggPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbChsaW1pdFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsb3dlciBsaW1pdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGV2YWx1YXRlKGxpbWl0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1pbmF0b3IgPSBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh4LCBhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWluYXRvci52YXJzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1pbmF0b3IudmFyc1t4LnN5bWJvbF0gPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3VtbWluYXRvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFzdFswXSA9PT0gJ2RlZmF1bHQnICYmIGFzdDEudmFycykge1xuICAgICAgICAgICAgICAgICAgICBkb3duKGFzdDEudmFycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXN0MVthc3RbMF1dKGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHJlc3VsdC52YXJzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXAocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFzdDFbYXN0WzBdXShldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhc3RbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3FydCc6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLnNxcnQuZGVmYXVsdChldmFsdWF0ZShhc3RbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFzdC5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZhbHVhdGUoYXN0WzFdKVthc3RbMF1dKGV2YWx1YXRlKGFzdFsxXSksIGV2YWx1YXRlKGFzdFsyXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3Q7XG4gICAgfVxuICAgIFxuICAgIFxuICAgIC8vIFBhcnNlIHVzaW5nIGNvbnRleHQgZnJlZSBncmFtbWFyIChbZ3JhcGhdL2dyYW1tYXIvY2FsY3VsYXRvci5qaXNvbilcbiAgICB2YXIgYXN0ID0gdGhpcy5jZmcucGFyc2Uocyk7XG4gICAgdmFyIHJlc3VsdCA9IGV2YWx1YXRlKGFzdCk7XG4gICAgcmVzdWx0Ll9hc3QgPSBhc3Q7XG4gICAgaWYgKHJvb3QgIT09IGNvbnRleHQpIHtcbiAgICAgICAgdGhyb3coJ0NvbnRleHQgc3RpbGwgb3BlbicpO1xuICAgIH1cbiAgICBcbiAgICByZXN1bHQudW5ib3VuZCA9IGZyZWU7XG4gICAgcmVzdWx0LmJvdW5kID0gYm91bmQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0O1xuXG51dGlsLmluaGVyaXRzKExpc3QsIHN1cCk7XG5cbi8qXG4gICAgRXhwcmVzc2lvbi5MaXN0IHNob3VsZCBiZSBhdm9pZGVkIHdoZW5ldmVyIEV4cHJlc3Npb24uTGlzdC5SZWFsIGNhblxuICAgIGJlIHVzZWQuIEhvd2V2ZXIsIGtub3dpbmcgd2hlbiB0byB1c2UgUmVhbCBpcyBhbiBpbXBvc3NpYmxlICg/KSB0YXNrLFxuICAgIHNvIHNvbWV0aW1lcyB0aGlzIHdpbGwgaGF2ZSB0byBkbyBhcyBhIGZhbGxiYWNrLlxuKi9cbmZ1bmN0aW9uIExpc3QoZSwgb3BlcmF0b3IpIHtcbiAgICBlLl9fcHJvdG9fXyA9IEV4cHJlc3Npb24uTGlzdC5wcm90b3R5cGU7XG4gICAgZS5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIHJldHVybiBlO1xufVxuXG5MaXN0LnByb3RvdHlwZS5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbC5wcm90b3R5cGUuX3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgdGhyb3coJ1VzZSByZWFsKCksIGltYWcoKSwgb3IgYWJzKCksIG9yIGFyZygpIGZpcnN0LicpO1xufTtcblxuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnN0YW50O1xuXG51dGlsLmluaGVyaXRzKENvbnN0YW50LCBzdXApO1xuXG5mdW5jdGlvbiBDb25zdGFudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cHJlc3Npb24uQ29uc3RhbnQgY3JlYXRlZCBkaXJlY3RseScpO1xufVxuXG52YXIgXyA9IENvbnN0YW50LnByb3RvdHlwZTtcblxuXy5zaW1wbGlmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcblxuXy5hcHBseSA9IGZ1bmN0aW9uICh4KXtcbiAgICByZXR1cm4gdGhpc1snKiddKHgpO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2w7XG5cbnV0aWwuaW5oZXJpdHMoU3ltYm9sLCBzdXApO1xuXG5mdW5jdGlvbiBTeW1ib2woc3RyKSB7XG4gICAgdGhpcy5zeW1ib2wgPSBzdHI7XG59XG5cbnZhciBfID0gU3ltYm9sLnByb3RvdHlwZTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpcyA9PT0geCA/IEdsb2JhbC5PbmUgOiBHbG9iYWwuWmVybztcbn07XG5fLmludGVncmF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMgPT09IHgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMC41LCAwKSBbJyonXSAoeCBbJ14nXSAobmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgyLDApKSk7XG4gICAgfVxuICAgIHJldHVybiAodGhpcykgWycqJ10gKHgpO1xufTtcbl8uc3ViID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAvLyBUT0RPOiBFbnN1cmUgaXQgaXMgcmVhbCAoZm9yIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpXG4gICAgcmV0dXJuIHRoaXMgPT09IHggPyB5IDogdGhpcztcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgeCkge1xuICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLnN5bWJvbCB8fCAneF97ZnJlZX0nKTtcbn07XG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG5mdW5jdGlvbiBUcnV0aFZhbHVlKHYpIHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlbWVudDtcblxudXRpbC5pbmhlcml0cyhUcnV0aFZhbHVlLCBzdXApO1xudXRpbC5pbmhlcml0cyhTdGF0ZW1lbnQsIHN1cCk7XG5cbnZhciBfID0gVHJ1dGhWYWx1ZS5wcm90b3R5cGU7XG5cbnZhciBUcnVlID0gVHJ1dGhWYWx1ZS5UcnVlID0gbmV3IFRydXRoVmFsdWUoKTtcbnZhciBGYWxzZSA9IFRydXRoVmFsdWUuRmFsc2UgPSBuZXcgVHJ1dGhWYWx1ZSgpO1xuXG4vL09ubHkgZGlmZmVyZW5jZTogTk9UIG9wZXJhdG9yXG5GYWxzZVsnfiddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUcnVlO1xufTtcblxuLy8gbmVnYXRpb24gb3BlcmF0b3Jcbl9bJ34nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gRmFsc2U7XG59O1xuXG4vLyBkaXNqdW5jdGlvblxuXy5WID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSA9PT0gVHJ1ZSA/IGUgOiB0aGlzO1xufTtcblxuLy8gY29uanVuY3Rpb25cbl9bJ14nXSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGUgPT09IFRydWUgPyB0aGlzIDogZTtcbn07XG5cblxuZnVuY3Rpb24gU3RhdGVtZW50KHgsIHksIG9wZXJhdG9yKSB7XG4gICAgdGhpcy5hID0geDtcbiAgICB0aGlzLmIgPSB5O1xuXG4gICAgdGhpcy5vcGVyYXRvciA9IG9wZXJhdG9yO1xufVxuXG52YXIgXyA9IFN0YXRlbWVudC5wcm90b3R5cGU7XG5fWyc9J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgXG59O1xuX1snPCddID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIGEgPCBiIDwgY1xuICAgIC8vIChhIDwgYikgPSBiXG4gICAgLy8gYiA8IGNcbiAgICBcbiAgICAvLyBhIDwgKGIgPCBjKVxuICAgIC8vIGEgPCBiIC4uIChiIDwgYykgPSBiXG4gICAgLy8gKGEgPCBiKSA9IGEuXG59O1xuXy5zb2x2ZSA9IGZ1bmN0aW9uICh2YXJzKSB7XG4gICAgLy8gYSA9IGJcbiAgICAvLyBJZiBiIGhhcyBhbiBhZGRpdGl2ZSBpbnZlcnNlP1xuICAgIFxuICAgIC8vIGEgLSBiID0gMFxuICAgIHZhciBhX2IgPSAodGhpcy5hKVsnLSddKHRoaXMuYik7XG4gICAgLypcbiAgICBFeGFtcGxlczpcbiAgICAoMSwyLDMpIC0gKHgseSx6KSA9IDAgKHNvbHZlIGZvciB4LHkseilcbiAgICAoMSwyLDMpIC0geCA9IDAgKHNvbHZlIGZvciB4KVxuICAgICovXG4gICAgcmV0dXJuIGFfYi5yb290cyh2YXJzKTtcbn07XG4iLCIoZnVuY3Rpb24oKXsvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcblxuZnVuY3Rpb24gVmVjdG9yKGUpIHtcbiAgICBlLl9fcHJvdG9fXyA9IFZlY3Rvci5wcm90b3R5cGU7XG4gICAgcmV0dXJuIGU7XG59XG5cbnV0aWwuaW5oZXJpdHMoVmVjdG9yLCBzdXApO1xuXG52YXIgXyA9IFZlY3Rvci5wcm90b3R5cGU7XG5cbl9bJywuJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLmNvbmNhdC5jYWxsKHRoaXMsIFt4XSkpO1xufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gYy5kaWZmZXJlbnRpYXRlKHgpO1xuICAgIH0pKTtcbn07XG5fLmNyb3NzID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5sZW5ndGggIT09IDMgfHwgeC5sZW5ndGggIT09IDMpIHtcbiAgICAgICAgdGhyb3coJ0Nyb3NzIHByb2R1Y3Qgb25seSBkZWZpbmVkIGZvciAzRCB2ZWN0b3JzLicpO1xuICAgIH1cbiAgICAvKlxuICAgIGkgICBqICAgIGtcbiAgICB4ICAgeSAgICB6XG4gICAgYSAgIGIgICAgY1xuICAgIFxuICAgID0gKHljIC0gemIsIHphIC0geGMsIHhiIC0geWEpXG4gICAgKi9cbiAgICBcbiAgICByZXR1cm4gbmV3IFZlY3RvcihbXG4gICAgICAgIHRoaXNbMV0uZGVmYXVsdCh4WzJdKVsnLSddKHRoaXNbMl0uZGVmYXVsdCh4WzFdKSksXG4gICAgICAgIHRoaXNbMl0uZGVmYXVsdCh4WzBdKVsnLSddKHRoaXNbMF0uZGVmYXVsdCh4WzJdKSksXG4gICAgICAgIHRoaXNbMF0uZGVmYXVsdCh4WzFdKVsnLSddKHRoaXNbMV0uZGVmYXVsdCh4WzBdKSlcbiAgICBdKTtcbn07XG5cbi8vIGNyb3NzUHJvZHVjdCBpcyB0aGUgJyZ0aW1lczsnIGNoYXJhY3RlclxudmFyIGNyb3NzUHJvZHVjdCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjE1KTtcblxuX1tjcm9zc1Byb2R1Y3RdID0gXy5jcm9zcztcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIFZlY3Rvcikge1xuICAgICAgICAvLyBEb3QgcHJvZHVjdFxuICAgICAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBzdW0gPSBHbG9iYWwuWmVybztcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgc3VtID0gc3VtWycrJ10oXG4gICAgICAgICAgICAgICAgKHRoaXNbaV0pLmRlZmF1bHQoeFtpXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1bTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgcmV0dXJuIGMuYXBwbHkoeCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG59O1xuX1snKiddID0gXy5kZWZhdWx0O1xuX1snKyddID0gZnVuY3Rpb24gKHgsIG9wKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICBpZihsICE9PSB4Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyhuZXcgTWF0aEVycm9yKCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIG4gPSBuZXcgQXJyYXkobCk7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuW2ldID0gdGhpc1tpXVtvcCB8fCAnKyddKHhbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKG4pO1xufTtcbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJysnXSh4LCAnLScpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBWZWN0b3IpIHtcbiAgICAgICAgdGhyb3coJ1ZlY3RvciBkaXZpc2lvbiBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgICByZXR1cm4gVmVjdG9yKEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5jdGlvbiAoYykge1xuICAgICAgICByZXR1cm4gY1snLyddKHgpO1xuICAgIH0pKTtcbiAgICBcbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnUmFpc2VkIHRvIHplcm8gcG93ZXInKTtcbiAgICAgICAgfVxuICAgICAgICBpZih4LmEgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4LmEgPT09IDIpIHtcbiAgICAgICAgICAgIHZhciBTID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICB2YXIgaSwgbCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIFMgPSBTWycrJ10odGhpc1tpXVsnXiddKHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBTO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ14nXShuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKHguYSAtIDEpKVsnKiddKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ14nXSh4LmEpWydeJ10oR2xvYmFsLk9uZVsnLyddKHguYikpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gY29tbXV0ZVxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgVmVjdG9yIF4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGVmYXVsdCh0aGlzWydeJ10oeFsnLSddKEdsb2JhbC5PbmUpKSk7XG59O1xuXG5fLm9sZF9hcHBseV9vcGVyYXRvciA9IGZ1bmN0aW9uKG9wZXJhdG9yLCBlKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICAgICAgLy9BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBbZV0pO1xuICAgICAgICAgICAgLy9GYXN0ZXI6XG4gICAgICAgICAgICAvL01PRElGSUVTISEhISEhISEhXG4gICAgICAgICAgICB0aGlzW2xdID0gZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgY2FzZSAnKic6XG4gICAgICAgICAgICBpZihsICE9PSBlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRocm93KCdWZWN0b3IgRGltZW5zaW9uIG1pc21hdGNoLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1bSA9IE0uR2xvYmFsLlplcm87XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtLmFwcGx5KCcrJywgdGhpc1tpXS5hcHBseSgnKicsIGVbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdW07XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgIGlmKGwgIT09IGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IG5ldyBBcnJheShsKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBuW2ldID0gdGhpc1tpXS5hcHBseShvcGVyYXRvciwgZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gVmVjdG9yKG4pO1xuICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgY2FzZSAnXic6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93KCdWZWN0b3Igb3BlcmF0aW9uIG5vdCBhbGxvd2VkLicpO1xuICAgIH1cbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpe1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIF94ID0gbmV3IEFycmF5KGwpO1xuICAgIHZhciBfeSA9IG5ldyBBcnJheShsKTtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHJpID0gdGhpc1tpXS5yZWFsaW1hZygpO1xuICAgICAgICBfeFtpXSA9IHJpWzBdO1xuICAgICAgICBfeVtpXSA9IHJpWzFdO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBWZWN0b3IoX3gpLFxuICAgICAgICBWZWN0b3IoX3kpXG4gICAgXSk7XG59O1xuXG5fLl9zID0gZnVuY3Rpb24oQ29kZSwgbGFuZykge1xuICAgIHZhciBsID0gdGhpcy5sZW5ndGg7XG4gICAgdmFyIG9wZW4gPSAnWyc7XG4gICAgdmFyIGNsb3NlID0gJ10nO1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBvcGVuID0gJ3ZlYycgKyB0aGlzLmxlbmd0aCArICcoJztcbiAgICAgICAgY2xvc2UgPSAnKSc7XG4gICAgfVxuICAgIHZhciBjID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICB2YXIgaTtcbiAgICB2YXIgdF9zID0gW107XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgY19pID0gdGhpc1tpXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgdF9zLnB1c2goY19pLnMpO1xuICAgICAgICBjID0gYy5tZXJnZShjX2kpO1xuICAgIH1cbiAgICByZXR1cm4gYy51cGRhdGUob3BlbiArIHRfcy5qb2luKCcsJykgKyBjbG9zZSwgSW5maW5pdHkpO1xufTtcbn0pKCkiLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7XG5cbmZ1bmN0aW9uIE1hdHJpeChlLCByLCBjKSB7XG4gICAgZS5fX3Byb3RvX18gPSBNYXRyaXgucHJvdG90eXBlO1xuXG4gICAgZS5yb3dzID0gcjtcbiAgICBlLmNvbHMgPSBjO1xuXG4gICAgaWYgKHIgIT0gYykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01hdHJpeCBzaXplIG1pc21hdGNoJylcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhNYXRyaXgsIHN1cCk7XG5cbnZhciBfID0gTWF0cml4LnByb3RvdHlwZTtcblxuXy5kZWZhdWx0ID0gX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk1hdHJpeCkge1xuICAgICAgICAvLyBCcm9rZW5cbiAgICAgICAgLy8gTyhuXjMpXG4gICAgICAgIGlmICh4LnJvd3MgIT09IHRoaXMuY29scykge1xuICAgICAgICAgICAgdGhyb3cgKCdNYXRyaXggZGltZW5zaW9ucyBkbyBub3QgbWF0Y2guJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAvLyByZXN1bHRbeC5yb3dzICogeC5jb2xzIC0gMSBdID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgaSwgaiwgaywgciA9IDA7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJvd3M7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHguY29sczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgICAgIGZvcihrID0gMDsgayA8IHgucm93czsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSA9IHN1bVsnKyddKHhbayAqIHguY29scyArIGpdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0W3IrK10gPSBzdW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTWF0cml4KHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIHR5cGUnKTtcbiAgICB9XG59O1xuXG5fLnJlZHVjZSA9IGZ1bmN0aW9uIChhcHApIHtcbiAgICB2YXIgeCwgeTtcbiAgICBmb3IoeSA9IDA7IHkgPCB0aGlzLnJvd3M7IHkrKykge1xuICAgICAgICBmb3IoeCA9IDA7IHggPCB5OyB4KyspIHtcbiAgICAgICAgICAgIC8vIE1ha2UgdGhpc1t4LHldID0gMFxuICAgICAgICAgICAgdmFyIG1hID0gdGhpc1t4ICogdGhpcy5jb2xzICsgeF07XG4gICAgICAgICAgICAvLyAwID0gdGhpcyAtICh0aGlzL21hKSAqIG1hXG4gICAgICAgICAgICBpZihtYSA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAoJ1JvdyBzd2FwIScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtYSA9IHRoaXNbeSAqIHRoaXMuY29scyArIHhdWycvJ10obWEpO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgPSB4ICsgMTsgaSA8IHRoaXMuY29sczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpc1t5ICogdGhpcy5jb2xzICsgaV0gPSB0aGlzW3kgKiB0aGlzLmNvbHMgKyBpXVsnLSddKHRtYVsnKiddKHRoaXNbeCAqIHRoaXMuY29scyArIGldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVGdW5jdGlvbjtcblxudXRpbC5pbmhlcml0cyhFRnVuY3Rpb24sIHN1cCk7XG5cbmZ1bmN0aW9uIEVGdW5jdGlvbiAocCkge1xuICAgIHRoaXMuZGVmYXVsdCA9IHAuZGVmYXVsdDtcbiAgICB0aGlzWyd0ZXh0L2xhdGV4J10gPSAocFsndGV4dC9sYXRleCddKTtcbiAgICB0aGlzWyd4LXNoYWRlci94LWZyYWdtZW50J10gPSAocFsneC1zaGFkZXIveC1mcmFnbWVudCddKTtcbiAgICB0aGlzWyd0ZXh0L2phdmFzY3JpcHQnXSA9IChwWyd0ZXh0L2phdmFzY3JpcHQnXSk7XG4gICAgdGhpcy5kZXJpdmF0aXZlID0gcC5kZXJpdmF0aXZlO1xuICAgIHRoaXMucmVhbGltYWcgPSBwLnJlYWxpbWFnO1xufTtcblxudmFyIF8gPSBFRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4vLyBAYWJzdHJhY3Rcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uIChhcmd1bWVudCkge1xuICAgIHJldHVybjtcbn07XG5cbi8vIEBhYnN0cmFjdFxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmRlcml2YXRpdmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVyaXZhdGl2ZTtcbiAgICB9XG4gICAgdGhyb3coJ0VGdW5jdGlvbiBoYXMgbm8gZGVyaXZhdGl2ZSBkZWZpbmVkLicpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYgKHRoaXNbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKHRoaXNbbGFuZ10pO1xuICAgIH1cbiAgICB0aHJvdygnQ291bGQgbm90IGNvbXBpbGUgZnVuY3Rpb24gaW50byAnICsgbGFuZyk7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBhID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sKCk7XG4gICAgcmV0dXJuIG5ldyBFRnVuY3Rpb24uU3ltYm9saWModGhpcy5kZWZhdWx0KGEpWycrJ10oeCksIFthXSk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgYSA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbCgpO1xuICAgIHJldHVybiBuZXcgRUZ1bmN0aW9uLlN5bWJvbGljKHRoaXMuZGVmYXVsdChhKVsnQC0nXSgpLCBbYV0pO1xufTtcblxuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEluZmluaXRlc2ltYWw7XG51dGlsLmluaGVyaXRzKEluZmluaXRlc2ltYWwsIHN1cCk7XG5mdW5jdGlvbiBJbmZpbml0ZXNpbWFsKHgpIHtcbiAgICB0aGlzLnggPSB4O1xufVxudmFyIF8gPSBJbmZpbml0ZXNpbWFsLnByb3RvdHlwZTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW5maW5pdGVzaW1hbCkge1xuICAgICAgICB0aHJvdygnSW5maW5pdGVzaW1hbCBhZGRpdGlvbicpO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIGlmKHgueCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy54LmRpZmZlcmVudGlhdGUoeC54KTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdygnQ29uZnVzaW5nIGluZml0ZXNpbWFsIGRpdmlzaW9uJyk7XG4gICAgfVxuICAgIHRoaXMueCA9IHRoaXMueFsnLyddKHgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgLy8gZF4yID0gMFxuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgdGhpcy54ID0gdGhpcy54WycqJ10oeCk7XG59O1xuXy5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICBpZihsYW5nICE9PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgdGhyb3cgKCdJbmZpbml0ZXNpbWFsIG51bWJlcnMgY2Fubm90IGJlIGV4cG9ydGVkIHRvIHByb2dyYW1taW5nIGxhbmd1YWdlcycpO1xuICAgIH1cbiAgICB2YXIgYyA9IHRoaXMueC5zKGxhbmcpO1xuICAgIHZhciBwID0gbGFuZ3VhZ2UucHJlY2VkZW5jZSgnZGVmYXVsdCcpXG4gICAgaWYocCA+IGMucCkge1xuICAgICAgICBjLnMgPSAnXFxcXGxlZnQoJyArIGMucyArICdcXFxccmlnaHQpJztcbiAgICB9XG4gICAgcmV0dXJuIGMudXBkYXRlKCdkJyArIGMucywgcCk7XG59O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpXG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdF9SZWFsO1xuXG51dGlsLmluaGVyaXRzKExpc3RfUmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gTGlzdF9SZWFsKHgsIG9wZXJhdG9yKSB7XG4gICAgeC5fX3Byb3RvX18gPSBMaXN0X1JlYWwucHJvdG90eXBlO1xuICAgIGlmKG9wZXJhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgeC5vcGVyYXRvciA9IG9wZXJhdG9yO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn1cblxudmFyIF8gPSBMaXN0X1JlYWwucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpcyxcbiAgICAgICAgR2xvYmFsLlplcm9cbiAgICBdKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5wb2xhciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3VwLkNvbXBsZXhQb2xhcihbXG4gICAgICAgIHN1cC5SZWFsKFtHbG9iYWwuYWJzLCB0aGlzXSksXG4gICAgICAgIHN1cC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSlcbiAgICBdKTtcbn07XG5fLmFicyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuUmVhbChbR2xvYmFsLmFicywgdGhpc10pO1xufTtcbl8uYXJnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFtHbG9iYWwuYXJnLCB0aGlzXSk7XG59O1xuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiB4WycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKycgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB0aGlzWzFdWycrJ10oeCldLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnLScgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB4WyctJ10odGhpc1sxXSldLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbiAgICBcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKHggPT09IHRoaXMpIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIHN1cC5SZWFsKSB7XG4gICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhbMF1dLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy0nXSh4KTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycqJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3gsIHRoaXNdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIFxufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZih4ID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycvJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBzdXAuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWycvJ10oeCk7XG59O1xuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnJScpO1xufTtcbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICByZXR1cm4gdGhpc1swXTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzXSwgJ0AtJyk7XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWydeJ10oeCksIHRoaXNbMV1bJ14nXSh4KV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsLnByb3RvdHlwZVsnXiddLmNhbGwodGhpcywgeCk7XG4gICAgXG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSAnKycgfHxcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9PT0gJy0nIHx8XG4gICAgICAgIHRoaXMub3BlcmF0b3IgPT09ICdAJykge1xuICAgICAgICByZXR1cm4gdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpW3RoaXMub3BlcmF0b3JdKHRoaXNbMV0gJiYgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcqJykge1xuICAgICAgICByZXR1cm4gdGhpc1swXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApWycrJ10odGhpc1sxXVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICApKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICByZXR1cm4gdGhpc1sxXVsnKiddKFxuICAgICAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICAgICApWyctJ10oXG4gICAgICAgICAgICAgICAgdGhpc1swXVsnKiddKFxuICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgICAgIHRoaXNbMV1bJyonXSh0aGlzWzFdKVxuICAgICAgICApO1xuICAgIH1cbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuXG4gICAgdmFyIGxhbmd1YWdlID0gQ29kZS5sYW5ndWFnZTtcbiAgICBmdW5jdGlvbiBwYXJlbih4KSB7XG4gICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgcmV0dXJuICdcXFxcbGVmdCgnICsgeCArICdcXFxccmlnaHQpJzsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcoJysgeCArICcpJztcbiAgICB9XG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IEdsb2JhbC5hYnMpIHtcblxuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICAgICAgICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnXFxcXGxlZnR8JyArIGMxLnMgKyAnXFxcXHJpZ2h0fCcsIEluZmluaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKGMwLnMgKyAnKCcgKyBjMS5zICsgJyknLCBJbmZpbml0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgaWYgKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlZlY3Rvcikge1xuICAgICAgICAgICAgICAgIHZhciBjMXMgPSBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwodGhpc1sxXSwgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgdmFyIHRfcyA9IGMxcy5tYXAoZnVuY3Rpb24gKGUpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZS5zO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmKHRoaXNbMF0gPT09IEdsb2JhbC5hdGFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHRfcyA9IHRfcy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjMF9zID0gYzAucztcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYzFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGMwLm1lcmdlKGMxc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoYzBfcyArIHBhcmVuKHRfcyksIGxhbmd1YWdlLm9wZXJhdG9ycy5kZWZhdWx0LnByZWNlZGVuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgYzAucyArIHBhcmVuKGMxLnMpLCBsYW5ndWFnZS5vcGVyYXRvcnMuZGVmYXVsdC5wcmVjZWRlbmNlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub3BlcmF0b3IgPSAnKic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHAgPSBsYW5ndWFnZS5vcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0ucHJlY2VkZW5jZTtcbiAgICBmdW5jdGlvbiBfKHgpIHtcbiAgICAgICAgaWYocCA+IHgucCl7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW4oeC5zKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geC5zO1xuICAgIH1cblxuICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuXG4gICAgICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gR2xvYmFsLmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ2V4cCgnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHRoaXNbMV0uYSA8IDUgJiYgdGhpc1sxXS5hID4gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHZhciBqID0gbGFuZ3VhZ2Uub3BlcmF0b3JzWycqJ10ucHJlY2VkZW5jZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcHJlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHZhciBjcztcbiAgICAgICAgICAgICAgICBpZih0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgICAgICAgICAgICAgY3MgPSBjMC5zO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjcyA9IGMwLnZhcigpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcHJlID0gJ2Zsb2F0ICcgKyBjcyArICcgPSAnICsgYzAucyArICc7JztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBjcztcbiAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICBmb3IoaSA9IDE7IGkgPCB0aGlzWzFdLmE7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzKz0gJyonICsgY3M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoJygnICsgcyArICcpJywgSW5maW5pdHksIHByZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyICYmIHRoaXNbMV0uYSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgLy8gdG9kbzogcHJlY2VkZW5jZSBub3QgbmVjZXNzYXJ5XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSgnKDEuMC8oJyArIGMwLnMgKyAnKSknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gYV4yLCAzLCA0LCA1LCA2IFxuICAgICAgICAgICAgICAgIC8vIHVuc3VyZSBpdCBpcyBnY2RcbiAgICAgICAgICAgICAgICB0aGlzWzFdID0gdGhpc1sxXS5yZWR1Y2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbiA9IHRoaXNbMV0uYSAlIDIgPyBmYWxzZSA6IHRydWU7XG4gICAgICAgICAgICAgICAgaWYoZXZlbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAncG93KCcgKyBjMC5zICsgJywnICsgYzEucyAgKyAnKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8geF4oYSkgPSAoeCkgKiB4XihhLTEpXG4gICAgICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShHbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5zXyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKSknKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuXG4gICAgICAgICAgICAgICAgLy8gTmVnIG9yIHBvcy5cbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oR2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcrYzEucysnKSknKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV1bJy0nXShHbG9iYWwuT25lKS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBOZWVkcyBhIG5ldyBmdW5jdGlvbiwgZGVwZW5kZW50IG9uIHBvd2VyLlxuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnK2MxLnMrJykpJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmKGxhbmcgPT09ICd0ZXh0L2phdmFzY3JpcHQnKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBHbG9iYWwuZSkge1xuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnTWF0aC5leHAoJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcblxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICAvLyBhXjIsIDMsIDQsIDUsIDYgXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW4gPSB0aGlzWzFdLmEgJSAyID8gZmFsc2UgOiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYoZXZlbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBOZWVkcyBhIG5ldyBmdW5jdGlvbiwgZGVwZW5kZW50IG9uIHBvd2VyLlxuICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ01hdGgucG93KCcgKyBjMC5zICsgJywnICsgYzEucyArICcpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAndGV4dC9sYXRleCcpe1xuICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgJ14nICsgJ3snICsgYzEucyArICd9JylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICBpZih0aGlzLm9wZXJhdG9yWzBdID09PSAnQCcpIHtcbiAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZSh0aGlzLm9wZXJhdG9yWzFdICsgXyhjMCksIHApO1xuICAgIH1cblxuICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgXG4gICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnXFxcXGZyYWN7JyArIGMwLnMgKyAnfXsnICsgYzEucyArICd9JylcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKicpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgXyhjMCkgKyBfKGMxKSwgcCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnJScpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ21vZCgnICsgXyhjMCkgKyAnLCcgKyBfKGMxKSArICcpJywgcCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgdGhpcy5vcGVyYXRvciArIF8oYzEpLCBwKTtcbn07XG5cblxufSkoKSIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG4vKlxuICAgIFRoaXMgdHlwZSBpcyBhbiBhdHRlbXB0IHRvIGF2b2lkIGhhdmluZyB0byBjYWxsIC5yZWFsaW1hZygpIGRvd24gdGhlIHRyZWUgYWxsIHRoZSB0aW1lLlxuICAgIFxuICAgIE1heWJlIHRoaXMgaXMgYSBiYWQgaWRlYSwgYmVjYXVzZSBpdCB3aWxsIGVuZCB1cCBoYXZpbmc6XG4gICAgXG4gICAgZih4KSA9ID5cbiAgICBbXG4gICAgICAgIFJlX2YoeCksXG4gICAgICAgIEltX2YoeClcbiAgICAgICAgXG4gICAgXVxuICAgIHdoaWNoIHJlcXVpcmVzIHR3byBldmFsdWF0aW9ucyBvZiBmKHgpLlxuXG4qL1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXhDYXJ0ZXNpYW47XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleENhcnRlc2lhbiwgc3VwKTtcblxuZnVuY3Rpb24gQ29tcGxleENhcnRlc2lhbih4KSB7XG4gICAgeC5fX3Byb3RvX18gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cblxudmFyIF8gPSBDb21wbGV4Q2FydGVzaWFuLnByb3RvdHlwZTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXNbMF07XG59O1xuXy5pbWFnID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXSxcbiAgICAgICAgdGhpc1sxXS5hcHBseSgnQC0nKVxuICAgIF0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXVsnQC0nXSgpLFxuICAgICAgICB0aGlzWzFdWydALSddKClcbiAgICBdKTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyAoYStiaSkgKiAoYytkaSkgPSBhYyArIGFkaSArIGJjaSAtIGJkXG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeFswXSlbJy0nXSh0aGlzWzFdWycqJ10oeFsxXSkpLFxuICAgICAgICAgICAgdGhpc1swXVsnKiddKHhbMV0pWycrJ10odGhpc1sxXVsnKiddKHhbMF0pKVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycqJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdWycqJ10oeClcbiAgICAgICAgXSk7XG4gICAgfVxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuXG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBCaW5vbWlhbCBleHBhbnNpb25cbiAgICAgICAgLy8gKGErYileTlxuICAgICAgICB2YXIgbiAgPSB4LmE7XG4gICAgICAgIHZhciBrO1xuICAgICAgICB2YXIgYSA9IHRoaXNbMF07XG4gICAgICAgIHZhciBiID0gdGhpc1sxXTtcbiAgICAgICAgdmFyIG5lZ29uZSA9IG5ldyBFeHByZXNzaW9uLkludGVnZXIoLTEpO1xuICAgICAgICB2YXIgaW1hZ19wYXJ0ID0gR2xvYmFsLlplcm87XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVhbF9wYXJ0ID0gYVsnXiddKFxuICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihuKVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNpID0gMTtcbiAgICAgICAgXG4gICAgICAgIGZvciAoayA9IDE7OyBrKyspIHtcbiAgICAgICAgICAgIHZhciBleHByO1xuICAgICAgICAgICAgaWYoayA9PT0gbikge1xuICAgICAgICAgICAgICAgIGV4cHIgPSAoXG4gICAgICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIoaylcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGNpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlYWxfcGFydCA9IHJlYWxfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnLSddKGV4cHIpO1xuICAgICAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwciA9IGFbJ14nXShcbiAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKG4gLSBrKVxuICAgICAgICAgICAgKVsnKiddKFxuICAgICAgICAgICAgICAgIGJbJ14nXShcbiAgICAgICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihrKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAoY2kgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICBjaSA9IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICByZWFsX3BhcnQsXG4gICAgICAgICAgICBpbWFnX3BhcnRcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbn07XG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgICAgICB0aGlzWzBdWycrJ10oeCksXG4gICAgICAgICAgICB0aGlzWzFdXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBcbn07XG5cbl8uZGlmZmVyZW50aWF0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeCksXG4gICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgIF0pO1xufTtcblxuXG4vLyBfLmFwcGx5T2xkID0gZnVuY3Rpb24obywgeCkge1xuLy8gICAgIC8vVE9ETzogZW5zdXJlIHRoaXMgaGFzIGFuIGltYWdpbmFyeSBwYXJ0LiBJZiBpdCBkb2Vzbid0IGl0IGlzIGEgaHVnZSB3YXN0ZSBvZiBjb21wdXRhdGlvblxuLy8gICAgIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgIHN3aXRjaChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseShvLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseShvLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgLy9GdW5jdGlvbiBldmFsdWF0aW9uPyBOTy4gVGhpcyBpcyBub3QgYSBmdW5jdGlvbi4gSSB0aGluay5cbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCctJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMV0pKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhpc1sxXS5hcHBseSgnKicsIHhbMF0pKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geFswXS5hcHBseSgnKicsIHhbMF0pLmFwcGx5KCcrJywgeFsxXS5hcHBseSgnKicsIHhbMV0pKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzBdLmFwcGx5KCcqJyx4WzBdKS5hcHBseSgnKycsdGhpc1sxXS5hcHBseSgnKicseFsxXSkpKS5hcHBseSgnLycsIGNjX2RkKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMV0uYXBwbHkoJyonLHhbMF0pLmFwcGx5KCctJyx0aGlzWzBdLmFwcGx5KCcqJyx4WzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL1RoZSBtb3N0IGNvbmZ1c2luZyBvZiB0aGVtIGFsbDpcbi8vICAgICAgICAgICAgICAgICB2YXIgaGFsZiA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoMC41LCAwKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaGxtID0gaGFsZi5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5sb2cuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy9UaGUgbWFnbml0dWRlOiBpZiB0aGlzIHdhcyBmb3IgYSBwb2xhciBvbmUgaXQgY291bGQgYmUgZmFzdC5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJysnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBHbG9iYWwuYXRhbjIuYXBwbHkodW5kZWZpbmVkLCBFeHByZXNzaW9uLlZlY3RvcihbdGhpc1sxXSwgdGhpc1swXV0pKTtcbi8vICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbS5hcHBseSgnKicsIHhbMV0pLmFwcGx5KCcrJywgdGhldGEuYXBwbHkoJyonLCB4WzBdKSk7XG4gICAgICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5leHAuYXBwbHkodW5kZWZpbmVkLFxuLy8gICAgICAgICAgICAgICAgICAgICBobG0uYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgYlswXVxuLy8gICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCctJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXRhLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiWzFdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuXG4vLyAgICAgICAgICAgICAgICAgdmFyIGVfaG1sY190ZCA9IEdsb2JhbC5lLmFwcGx5KCdeJyxcbi8vICAgICAgICAgICAgICAgICAgICAgaGxtLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHhbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnLScsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGV0YS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcblxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZC5hcHBseSgnKicsR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIGhtbGRfdGMpKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQuYXBwbHkoJyonLEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCBobWxkX3RjKSkpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpe1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy8oeCt5aSkvQSplXihpaylcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4WzBdLmFwcGx5KCcqJywgeFswXSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGIgPSB4LnJlYWxpbWFnKCk7XG4vLyAgICAgICAgICAgICAgICAgLy9DbGVhbiB0aGlzIHVwPyBTdWI/XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1swXS5hcHBseSgnKicsYlswXSkuYXBwbHkoJysnLGFbMV0uYXBwbHkoJyonLGJbMV0pKSkuYXBwbHkoJy8nLCBjY19kZCksXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzFdLmFwcGx5KCcqJyxiWzBdKS5hcHBseSgnLScsYVswXS5hcHBseSgnKicsYlsxXSkpKS5hcHBseSgnLycsIGNjX2RkKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9odHRwOi8vd3d3LndvbGZyYW1hbHBoYS5jb20vaW5wdXQvP2k9UmUlMjglMjh4JTJCeWklMjklNUUlMjhBKmUlNUUlMjhpayUyOSUyOSUyOVxuLy8gICAgICAgICAgICAgICAgIC8vKHgreWkpXihBKmVeKGlrKSlcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZWQgYW4geCEgVGhpcyBtYWtlcyBpdCBkaWZmaWN1bHQgdG8gc29sdmUgY29tcGxleCBlcXVhdGlvbnMsIEkgdGhpbmsnKTtcbi8vICAgICAgICAgcmV0dXJuIHRoaXMuYXBwbHkobywgeC5yZWFsaW1hZygpKTtcbi8vICAgICB9XG4vLyAgICAgdGhyb3coJ0NNUExYLkxJU1QgKiAnICsgbyk7XG4vLyB9O1xuIiwiLy8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgID0gcmVxdWlyZSgnLi4vJyksXG4gICAgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZXhQb2xhcjtcblxudXRpbC5pbmhlcml0cyhDb21wbGV4UG9sYXIsIHN1cCk7XG5cbmZ1bmN0aW9uIENvbXBsZXhQb2xhciAoeCl7XG4gICAgeC5fX3Byb3RvX18gPSBDb21wbGV4UG9sYXIucHJvdG90eXBlO1xuICAgIHJldHVybiB4O1xufVxudmFyIF8gPSBDb21wbGV4UG9sYXIucHJvdG90eXBlO1xuXG5fLnBvbGFyID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgLy9UT0RPOiBSZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW5cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLmNvcy5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKSxcbiAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5zaW4uYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSlcbiAgICBdKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSk7XG59O1xuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpO1xufTtcbl8uY29uanVnYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIENvbXBsZXhQb2xhcihbXG4gICAgICAgIHRoaXNbMF0sXG4gICAgICAgIHRoaXNbMV0uYXBwbHkoJ0AtJylcbiAgICBdKTtcbn07XG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbih4KXtcbiAgICAvLyBkL2R4IGEoeCkgKiBlXihpYih4KSlcbiAgICBcbiAgICAvL1RPRE8gZW5zdXJlIGJlbG93ICBmJyArIGlmIGcnIHBhcnQgaXMgcmVhbGltYWcgKGYnLCBmZycpXG4gICAgcmV0dXJuIEdsb2JhbC5lXG4gICAgLmFwcGx5KFxuICAgICAgICAnXicsXG4gICAgICAgIEdsb2JhbC5pXG4gICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICB0aGlzWzFdXG4gICAgICAgIClcbiAgICApXG4gICAgLmFwcGx5KCcqJyxcbiAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgIC5hcHBseSgnKycsXG4gICAgICAgICAgICBHbG9iYWwuaVxuICAgICAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgICAgICB0aGlzWzBdXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgICAgIHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgKTtcbn07XG4vLyBfLmFwcGx5ID0gZnVuY3Rpb24obywgeCkge1xuLy8gICAgIGlmICh4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnKycsIHhbMV0pXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAvL0Fsc28gZmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnLycsIHhbMF0pLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCctJywgeFsxXSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IHNsb3csIG1heWJlIHdlIHNob3VsZCBzd2l0Y2ggdG8gY2FydGVzaWFuIG5vdz9cbiAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy8oQWVeKGlrKSkgXiAoQmVeKGlqKSlcbi8vICAgICAgICAgICAgICAgICAvL0hvdyBzbG93IGlzIHRoaXM/XG4vLyAgICAgICAgICAgICAgICAgLy9WZXJ5IGZhc3QgZm9yIHJlYWwgbnVtYmVycyB0aG91Z2hcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIHgpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAvL0Fsc28gZmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnLycsIHgpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBzbG93LCBtYXliZSB3ZSBzaG91bGQgc3dpdGNoIHRvIGNhcnRlc2lhbiBub3c/XG4gICAgICAgICAgICBcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0sXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJyonLCB4KVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uQ29tcGxleCkge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9yZWFsKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJysnLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX2ltYWcpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX3JlYWwpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnLScsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5faW1hZykpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBzbG93LCBtYXliZSB3ZSBzaG91bGQgc3dpdGNoIHRvIGNhcnRlc2lhbiBub3c/XG4gICAgICAgICAgICBcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKEFlXihpaykpIF4gKEJlXihpaikpXG4vLyAgICAgICAgICAgICAgICAgLy9Ib3cgc2xvdyBpcyB0aGlzP1xuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBmYXN0IGZvciByZWFsIG51bWJlcnMgdGhvdWdoXG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH1cbiAgICBcbi8vIH07XG5fLmFicyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiB0aGlzWzBdO1xufTtcbl8uYXJnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHRoaXNbMV07XG59O1xuIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWVyaWNhbENvbXBsZXg7XG5cbnV0aWwuaW5oZXJpdHMoTnVtZXJpY2FsQ29tcGxleCwgc3VwKTtcblxuZnVuY3Rpb24gTnVtZXJpY2FsQ29tcGxleChyZWFsLCBpbWFnKSB7XG4gICAgdGhpcy5fcmVhbCA9IHJlYWw7XG4gICAgdGhpcy5faW1hZyA9IGltYWc7XG59XG5cbnZhciBfID0gTnVtZXJpY2FsQ29tcGxleC5wcm90b3R5cGU7XG5cbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX3JlYWwpO1xufTtcblxuXy5pbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5faW1hZyk7XG59O1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9yZWFsKSxcbiAgICAgICAgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9pbWFnKVxuICAgIF0pO1xufTtcblxuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsLCAtdGhpcy5faW1hZyk7XG59O1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCl7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4Ll9yZWFsLCB0aGlzLl9pbWFnICsgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKyB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggKycpO1xuICAgIH1cbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC5fcmVhbCwgdGhpcy5faW1hZyAtIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IC0nKTtcbiAgICB9XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3Ipe1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC5fcmVhbCAtIHRoaXMuX2ltYWcgKiB4Ll9pbWFnLCB0aGlzLl9yZWFsICogeC5faW1hZyArIHRoaXMuX2ltYWcgKiB4Ll9yZWFsKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC52YWx1ZSwgdGhpcy5faW1hZyAqIHgudmFsdWUpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCAqJyk7XG4gICAgfVxufTtcblxuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9pbWFnID09PSAwICYmIHRoaXMuX3JlYWwgPT09IDApIHtcbiAgICAgICAgLy8gVE9ETzogUHJvdmlkZWQgeCAhPSAwXG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgXG4gICAgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4gICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KCh0aGlzLl9yZWFsICogeC5fcmVhbCArIHRoaXMuX2ltYWcgKiB4Ll9pbWFnKS9jY19kZCwgKHRoaXMuX2ltYWcgKiB4Ll9yZWFsIC0gdGhpcy5fcmVhbCAqIHguX2ltYWcpIC8gY2NfZGQpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLyB4LnZhbHVlLCB0aGlzLl9pbWFnIC8geC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy8nXSh4KTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKVsnLyddKHgpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IC8nKTtcbiAgICB9XG59O1xuXG5fWychJ10gPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHRoaXMpO1xufTtcblxuLy8gKGZ1bmN0aW9uKCl7XG4vLyAgICAgcmV0dXJuO1xuLy8gICAgIHZhciBvbmVfb25fcnQyID0gMS9NYXRoLnNxcnQoMik7XG4vLyAgICAgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4LnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uKG9wZXJhdG9yLCB4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3Ipe1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy8gQ29udHJhZGljdHMgeF4wID0gMVxuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LmFwcGx5KCdALScpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMSAmJiB0aGlzLl9pbWFnID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIC8vTm90ZTogVGhlcmUgaXMgbm90IG1lYW50IHRvIGJlIGEgYnJlYWsgaGVyZS5cbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAgJiYgdGhpcy5faW1hZyA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy9Db250cmFkaWNzIHgvMCA9IEluZmluaXR5XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGlmIChvcGVyYXRvciA9PT0gJywnKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbi8vICAgICAgICAgfSBlbHNlIGlmICh4ID09PSB1bmRlZmluZWQpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBcbi8vICAgICAgICAgICAgICAgICBjYXNlICdAKyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ0AtJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoLXRoaXMuX3JlYWwsIC10aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdcXHUyMjFBJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ09MRCBTUVJULiBOZXcgb25lIGlzIGEgZnVuY3Rpb24sIG5vdCBvcGVyYXRvci4nKVxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleChwLCBxKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrKyc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLS0nOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKCdQb3N0Zml4ICcgK29wZXJhdG9yICsgJyBvcGVyYXRvciBhcHBsaWVkIHRvIHZhbHVlIHRoYXQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLT0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyo9Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvPSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KG5ldyBSZWZlcmVuY2VFcnJvcignTGVmdCBzaWRlIG9mIGFzc2lnbm1lbnQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIDEsIHRoaXMuX2ltYWcpKTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAqIHgudmFsdWUsIHRoaXMuX2ltYWcgKiB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC52YWx1ZSwgdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLyB4LnZhbHVlLCB0aGlzLl9pbWFnIC8geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSB0aGlzLl9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHgudmFsdWU7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSArIGIqYik7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoYiwgYSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gdGhldGEgKiBjO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHRoaXMuY29uc3RydWN0b3IpIHtcbi8vICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gKGErYmkpKGMrZGkpID0gKGFjLWJkKSArIChhZCtiYylpIFxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC5fcmVhbCAtIHRoaXMuX2ltYWcgKiB4Ll9pbWFnLCB0aGlzLl9yZWFsICogeC5faW1hZyArIHRoaXMuX2ltYWcgKiB4Ll9yZWFsKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHguX3JlYWwsIHRoaXMuX2ltYWcgKyB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHguX3JlYWwsIHRoaXMuX2ltYWcgLSB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gIChhK2JpKS8oYytkaSkgXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbKGErYmkpKGMtZGkpXS9bKGMrZGkpKGMtZGkpXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gWyhhK2JpKShjLWRpKV0vW2NjICsgZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbYWMgLWRhaSArYmNpICsgYmRdL1tjYytkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFthYyArIGJkICsgKGJjIC0gZGEpXS9bY2MrZGRdXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KCh0aGlzLl9yZWFsICogeC5fcmVhbCArIHRoaXMuX2ltYWcgKiB4Ll9pbWFnKS9jY19kZCwgKHRoaXMuX2ltYWcgKiB4Ll9yZWFsIC0gdGhpcy5fcmVhbCp4Ll9pbWFnKS9jY19kZCk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSB0aGlzLl9pbWFnO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkID0geC5faW1hZztcblxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphICsgYipiKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMihiLCBhKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkICsgdGhldGEgKiBjO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyAtIHRoZXRhICogZCk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdjbXBseCAuICcgKyBvcGVyYXRvciArICcgPT4gRS5MaXN0PycpO1xuLy8gICAgICAgICAvKlxuLy8gICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwLjAgJiYgdGhpcy5faW1hZyA9PT0gMC4wKXtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgICovXG4gICAgICAgIFxuICAgICAgICBcbi8vICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgfVxuICAgIFxuLy8gfSgpKTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9nbG9iYWwnKTtcblxudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xfUmVhbDtcblxudXRpbC5pbmhlcml0cyhTeW1ib2xfUmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9sX1JlYWwoc3RyKSB7XG4gICAgdGhpcy5zeW1ib2wgPSBzdHI7XG59XG5cbnZhciBfID0gU3ltYm9sX1JlYWwucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFt0aGlzLCBHbG9iYWwuWmVyb10pO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBHbG9iYWwuWmVybztcbn07XG5fLnBvbGFyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLFxuICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXG4gICAgXSk7XG59O1xuXy5hYnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG59O1xuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeFswXV0sICcrJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB4WydALSddKClbJysnXSh0aGlzKTtcbn07XG5cbl9bJ0ArJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sICdAKycpO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgJ0AtJyk7XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt4LCB0aGlzXSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiB4WycqJ10odGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXy5hcHBseSA9IF9bJyonXTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnRGl2aXNpb24gYnkgemVybycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG59O1xuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xufTtcbl8uYXBwbHlPbGQgPSBmdW5jdGlvbihvcGVyYXRvciwgZSkge1xuICAgIHRocm93KFwiUmVhbC5hcHBseVwiKTtcbiAgICAvLyBpZiAob3BlcmF0b3IgPT09ICcsJykge1xuICAgIC8vICAgICAvL01heWJlIHRoaXMgc2hvdWxkIGJlIGEgbmV3IG9iamVjdCB0eXBlPz8/IFZlY3Rvcj9cbiAgICAvLyAgICAgY29uc29sZS5sb2coJ0FQUExZOiAnLCB0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLCBlKTtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCBlXSk7XG4gICAgLy8gfSBlbHNlIGlmIChvcGVyYXRvciA9PT0gJz0nKSB7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkVxdWF0aW9uKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vIH1cbiAgICAvLyBpZiAoZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gICAgIC8vVW5hcnk6XG4gICAgLy8gICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgIGNhc2UgJyEnOlxuICAgIC8vICAgICAgICAgICAgIC8vVE9ETzogQ2FuJ3Qgc2ltcGxpZnksIHNvIHdoeSBib3RoZXIhIChyZXR1cm4gYSBsaXN0LCBzaW5jZSBnYW1tYSBtYXBzIGFsbCByZWFscyB0byByZWFscz8pXG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIHRoaXMuYXBwbHkoJysnLCBHbG9iYWwuT25lKSk7XG4gICAgLy8gICAgICAgICBjYXNlICdALSc6XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgZGVmYXVsdDpcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICB0aHJvdygnUmVhbCBTeW1ib2woJyt0aGlzLnN5bWJvbCsnKSBjb3VsZCBub3QgaGFuZGxlIG9wZXJhdG9yICcrIG9wZXJhdG9yKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICAvLyBTaW1wbGlmaWNhdGlvbjpcbiAgICAvLyAgICAgc3dpdGNoIChlLmNvbnN0cnVjdG9yKXtcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbDpcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LlJlYWw6XG4gICAgLy8gICAgICAgICAgICAgLyppZih0aGlzLnBvc2l0aXZlICYmIGUucG9zaXRpdmUpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgIH0qL1xuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogQmFkIGlkZWE/IFRoaXMgd2lsbCBzdGF5IGluIHRoaXMgZm9ybSB1bnRpbCByZWFsaW1hZygpIGlzIGNhbGxlZCBieSB1c2VyLCBhbmQgdXNlciBvbmx5LlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgLy9yZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLCBlXSwnXicpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtlLCBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXSwnKicpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnKicpO1xuICAgIC8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsOlxuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcil7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICcqJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnJSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnJScpO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZmFsc2UgJiYgb3BlbmdsX1RPRE9faGFjaygpICYmIGUudmFsdWUgPT09IH5+ZS52YWx1ZSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLCBlXSwnXicpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtlLCBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXSwnKicpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5JbmZpbml0eTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5Db21wbGV4OlxuICAgIC8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIGUpOyAvLyBHTyB0byBhYm92ZSAod2lsbCBhcHBseSByZWFscylcbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW46XG4gICAgLy8gICAgICAgICAgICAgLy9NYXliZSB0aGVyZSBpcyBhIHdheSB0byBzd2FwIHRoZSBvcmRlcj8gKGUuZy4gYSAucmVhbCA9IHRydWUgcHJvcGVydHkgZm9yIG90aGVyIHRoaW5ncyB0byBjaGVjaylcbiAgICAvLyAgICAgICAgICAgICAvL29yIGluc3RhbmNlIG9mIEV4cHJlc3Npb24uUmVhbCA/XG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVswXSksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgZVsxXVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzBdKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzFdKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0gZVswXS5hcHBseSgnKicsZVswXSkuYXBwbHkoJysnLGVbMV0uYXBwbHkoJyonLGVbMV0pKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuYXBwbHkoJyonLGVbMF0pKS5hcHBseSgnLycsIGNjX2RkKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KCcqJyxlWzFdKS5hcHBseSgnLycsIGNjX2RkKS5hcHBseSgnQC0nKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyOlxuICAgIC8vICAgICAgICAgICAgIC8vTWF5YmUgdGhlcmUgaXMgYSB3YXkgdG8gc3dhcCB0aGUgb3JkZXI/XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKS5hcHBseShvcGVyYXRvciwgZSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgdGhyb3coJ0xJU1QgRlJPTSBSRUFMIFNZTUJPTCEgJysgb3BlcmF0b3IsIGUuY29uc3RydWN0b3IpO1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vIH1cbn07XG5cblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xpY0VGdW5jdGlvbjtcblxudXRpbC5pbmhlcml0cyhTeW1ib2xpY0VGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9saWNFRnVuY3Rpb24oZXhwciwgdmFycykge1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gICAgdGhpcy5zeW1ib2xzID0gdmFycztcbiAgICBcbn07XG52YXIgXyA9IFN5bWJvbGljRUZ1bmN0aW9uLnByb3RvdHlwZTtcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHguY29uc3RydWN0b3IgIT09IEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgIHggPSBFeHByZXNzaW9uLlZlY3RvcihbeF0pO1xuICAgIH1cbiAgICB2YXIgZXhwciA9IHRoaXMuZXhwcjtcbiAgICB2YXIgaSwgbCA9IHRoaXMuc3ltYm9scy5sZW5ndGg7XG4gICAgaWYgKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgIHRocm93ICgnSW52YWxpZCBkb21haW4uIEVsZW1lbnQgb2YgRl4nICsgbCArICcgZXhwZWN0ZWQuJyk7XG4gICAgfVxuICAgIGZvcihpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBleHByID0gZXhwci5zdWIodGhpcy5zeW1ib2xzW2ldLCB4W2ldKVxuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbn07IiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL2dsb2JhbCcpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8uLi8nKTtcbm1vZHVsZS5leHBvcnRzID0gTnVtZXJpY2FsUmVhbDtcblxudXRpbC5pbmhlcml0cyhOdW1lcmljYWxSZWFsLCBzdXApO1xuXG5mdW5jdGlvbiBOdW1lcmljYWxSZWFsKGUpIHtcbiAgICB0aGlzLnZhbHVlID0gZTtcbn1cblxudmFyIF8gPSBOdW1lcmljYWxSZWFsLnByb3RvdHlwZTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KF8sIFwiX3JlYWxcIiwge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG59KTtcbl8uX2ltYWcgPSAwO1xuXG5fLnJlYWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gR2xvYmFsLlplcm87XG59O1xuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXMsXG4gICAgICAgIEdsb2JhbC5aZXJvXG4gICAgXSk7XG59O1xuXy5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKTtcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLSB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJ0AtJ10oKVsnKyddKHRoaXMpO1xufTtcblxuXG5fWyclJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBub25yZWFsID0gJ1RoZSBtb2R1bGFyIGFyaXRobWV0aWMgb3BlcmF0b3IgXFwnJVxcJyBpcyBub3QgZGVmaW5lZCBmb3Igbm9uLXJlYWwgbnVtYmVycy4nO1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICUgeC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHRocm93KCdOb3Qgc3VyZSBhYm91dCB0aGlzLi4uJyk7XG4gICAgICAgIC8vIE5vdCBzdXJlIGFib3V0IHRoaXNcbiAgICAgICAgLy8gcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyAgICBcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgJScpO1xuICAgIH1cbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKiB4LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbn07XG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIGlmKHgudmFsdWUgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBieSB6ZXJvIG5vdCBhbGxvd2VkIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC8geC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoKHRoaXMudmFsdWUgKiB4Ll9yZWFsKS9jY19kZCwgKC10aGlzLnZhbHVlICogeC5faW1hZykgLyBjY19kZCk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBhLyh4K3lpKSA9IGEvKHgreWkpICh4LXlpKS8oeC15aSkgPSBhKHgteWkpIC8gKHheMiArIHleMilcbiAgICAgICAgdmFyIHhfY29uaiA9IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHhbMF0sXG4gICAgICAgICAgICB4WzFdWydALSddKClcbiAgICAgICAgXSk7XG4gICAgICAgIHZhciB0d28gPSBOdW1lcmljYWxSZWFsKDIpO1xuICAgICAgICByZXR1cm4geF9jb25qWycqJ10odGhpcylbJy8nXShcbiAgICAgICAgICAgICh4WzBdWydeJ10pKHR3bylcbiAgICAgICAgICAgIFsnKyddIChcbiAgICAgICAgICAgICAgICAoeFsxXVsnXiddKSh0d28pXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgLy8gfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgIFxuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgLy8gVE9ETzogZ2l2ZW4geCAhPSAwXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIC8vIFRPRE86IGdpdmVuIHggIT0gMFxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0KSB7ICAgXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVbmtub3duIHR5cGU6ICcsIHRoaXMsIHgpO1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCAvJyk7XG4gICAgfVxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMudmFsdWUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gMSkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5PbmU7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5JbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHgudmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPOiBUaGlzIHdpbGwgcHJvZHVjZSB1Z2x5IGRlY2ltYWxzLiBNYXliZSB3ZSBzaG91bGQgZXhwcmVzcyBpdCBpbiBwb2xhciBmb3JtPyFcbiAgICAgICAgLy8gICAgICA8LSBJIHRoaW5rIG5vLCBiZWNhdXNlIHdoeSBlbHNlIHN0YXJ0IHdpdGggYSBudW1lcmljYWwuIEltcGxlbWVudCBhIHJhdGlvbmFsL2ludGVnZXIgdHlwZVxuICAgICAgICB2YXIgciA9IE1hdGgucG93KC10aGlzLnZhbHVlLCB4LnZhbHVlKTtcbiAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5QSSAqIHgudmFsdWU7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4gICAgICAgICAgICBuZXcgTnVtZXJpY2FsUmVhbChyKSxcbiAgICAgICAgICAgIG5ldyBOdW1lcmljYWxSZWFsKHRoZXRhKVxuICAgICAgICBdKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XG4gICAgICAgIHZhciBjID0geC5fcmVhbDtcbiAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdCYWQgaW1wbGVtZW50YXRpb24gKCBudW0gXiBjb21wbGV4KScpO1xuICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphKTtcbiAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkO1xuICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KFxuICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbiAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbiAgICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJ14nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBjb25zb2xlLmVycm9yICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsIF4nLCB4LCB4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCk7XG4gICAgfVxufTtcbl9bJz4nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID4geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc+J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc8J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA8IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPCddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPD0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDw9IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPD0nXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJz49J10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZSA+PSB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJz49J10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICB2YXIgbnVtID0gdGhpcy52YWx1ZS50b0V4cG9uZW50aWFsKCk7XG4gICAgICAgIGlmKG51bS5pbmRleE9mKCcuJykgPT09IC0xKXtcbiAgICAgICAgICAgIG51bSA9IG51bS5yZXBsYWNlKCdlJywnLmUnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvZGUobnVtKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMudmFsdWUudG9TdHJpbmcoKSk7XG59O1xuLy8gXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG9wZXJhdG9yLCB4KSB7XG4vLyAgICAgc3dpdGNoIChvcGVyYXRvcil7XG4vLyAgICAgICAgIGNhc2UgJywnOlxuLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCB4XSk7XG4vLyAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy8gQ29udHJhZGljdHMgeF4wID0gMVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4LmFwcGx5KCdALScpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDEpe1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgLy9Ob3RlOiBUaGVyZSBpcyBub3QgbWVhbnQgdG8gYmUgYSBicmVhayBoZXJlLlxuLy8gICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybzsgLy9Db250cmFkaWNzIHgvMCA9IEluZmluaXR5XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIGlmKHggPT09IHVuZGVmaW5lZCl7XG4vLyAgICAgICAgIC8vVW5hcnlcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnQCsnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuLy8gICAgICAgICAgICAgY2FzZSAnQC0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctLSc6XG4vLyAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcignUG9zdGZpeCAnICtvcGVyYXRvciArICcgb3BlcmF0b3IgYXBwbGllZCB0byB2YWx1ZSB0aGF0IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrPSc6XG4vLyAgICAgICAgICAgICBjYXNlICctPSc6XG4vLyAgICAgICAgICAgICBjYXNlICcqPSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvPSc6XG4vLyAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFJlZmVyZW5jZUVycm9yKCdMZWZ0IHNpZGUgb2YgYXNzaWdubWVudCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyAxKSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKiB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgeC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAtIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbChNYXRoLnBvdyh0aGlzLnZhbHVlLCB4LnZhbHVlKSk7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGhpcyB3aWxsIHByb2R1Y2UgdWdseSBkZWNpbWFscy4gTWF5YmUgd2Ugc2hvdWxkIGV4cHJlc3MgaXQgaW4gcG9sYXIgZm9ybT8hXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5wb3coLXRoaXMudmFsdWUsIHgudmFsdWUpXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IE1hdGguUEkgKiB4LnZhbHVlO1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChyKk1hdGguY29zKHRoZXRhKSwgcipNYXRoLnNpbih0aGV0YSkpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5Db21wbGV4KSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSAqIHguX3JlYWwsIHRoaXMudmFsdWUgKiB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgKyB4Ll9yZWFsLCB4Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHRoaXMudmFsdWUgLSB4Ll9yZWFsLCAteC5faW1hZyk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KCh0aGlzLnZhbHVlICogeC5fcmVhbCkvY2NfZGQsICgtdGhpcy52YWx1ZSp4Ll9pbWFnKS9jY19kZCk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICB2YXIgYSA9IHRoaXMudmFsdWU7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuLy8gICAgICAgICAgICAgICAgIHZhciBkID0geC5faW1hZztcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdCYWQgaW1wbGVtZW50YXRpb24gKCBudW0gXiBjb21wbGV4KScpO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEpO1xuLy8gICAgICAgICAgICAgICAgIHZhciBobWxkX3RjID0gaGxtICogZDtcbi8vICAgICAgICAgICAgICAgICB2YXIgZV9obWxjX3RkID0gTWF0aC5leHAoaGxtICogYyk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLmNvcyhobWxkX3RjKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQgKiBNYXRoLnNpbihobWxkX3RjKSlcbi8vICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV0uYXBwbHkob3BlcmF0b3IsIHRoaXMpXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2luZWZmZWNpZW50OiBOUiBeIENMJyk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhhK2JpKStBZV4oaWspXG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICAvLyBvciA/IHJldHVybiB0aGlzLmFwcGx5KG9wZXJhdG9yLCB4LnJlYWxpbWFnKCkpOyAvL0p1bXAgdXAgdG8gYWJvdmUgKy1cbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdOKDApIF4geCcpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbCgtdGhpcy52YWx1ZSkpLmFwcGx5KCdeJywgeCksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWwucGkuYXBwbHkoJyonLCB4KVxuLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbi8vICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICBvcGVyYXRvciA9ICcqJztcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnTigwKSBeIHgnKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFsobmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpKSwgeF0sICdeJyksXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWwucGkuYXBwbHkoJyonLCB4KVxuLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgdGhyb3coJz8/IC0gcmVhbCcpO1xuLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyB9O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uLy4uL2dsb2JhbCcpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8uLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBSYXRpb25hbDtcblxudXRpbC5pbmhlcml0cyhSYXRpb25hbCwgc3VwKTtcblxuZnVuY3Rpb24gUmF0aW9uYWwoYSwgYikge1xuICAgIHRoaXMuYSA9IGE7XG4gICAgdGhpcy5iID0gYjtcbn1cblxudmFyIF8gPSBSYXRpb25hbC5wcm90b3R5cGU7XG5cblxuXy5fX2RlZmluZUdldHRlcl9fKFwidmFsdWVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmEgLyB0aGlzLmI7XG59KTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIC8qXG4gICAgICAgICAgICBhICAgYyAgICAgYWQgICBjYiAgICBhZCArIGJjXG4gICAgICAgICAgICAtICsgLSAgPSAgLS0gKyAtLSA9ICAtLS0tLS0tXG4gICAgICAgICAgICBiICAgZCAgICAgYmQgICBiZCAgICAgIGIgZFxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYiArIHRoaXMuYiAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLnZhbHVlICsgeC5fcmVhbCwgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGNvbW11dGVcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdTd2FwcGVkIG9wZXJhdG9yIG9yZGVyIGZvciArIHdpdGggUmF0aW9uYWwnKTtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgICAgICAvLyB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgUmF0aW9uYWwgKycpO1xuICAgIH1cbiAgICBcbiAgICBcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIC8qXG4gICAgICAgICAgICBhICAgYyAgICAgYWQgICBjYiAgICBhZCArIGJjXG4gICAgICAgICAgICAtICsgLSAgPSAgLS0gKyAtLSA9ICAtLS0tLS0tXG4gICAgICAgICAgICBiICAgZCAgICAgYmQgICBiZCAgICAgIGIgZFxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYiAtIHRoaXMuYiAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLnZhbHVlIC0geC5fcmVhbCwgeC5faW1hZyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGNvbW11dGVcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU3dhcHBlZCBvcGVyYXRvciBvcmRlciBmb3IgLSB3aXRoIFJhdGlvbmFsJyk7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICAgICAgLy8gdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFJhdGlvbmFsICsnKTtcbiAgICB9XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIHRoaXMuY29uc3RydWN0b3Ipe1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKHRoaXMuYSAqIHguYSwgdGhpcy5iICogeC5iKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3lwZVsnKiddLmNhbGwodGhpcywgeCk7XG59O1xuXG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgdGhpcy5jb25zdHJ1Y3Rvcil7XG4gICAgICAgIGlmICh4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBCeSBaZXJvIGlzIG5vdCBkZWZpbmVkIGZvciBSYXRpb25hbCBudW1iZXJzIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5iLCB0aGlzLmIgKiB4LmEpLnJlZHVjZSgpO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnLyddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IHRoaXMuYikge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5hLCB4LmEpLFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5iLCB4LmEpXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgUmF0aW9uYWwpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBmID0geC5yZWR1Y2UoKTtcbiAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5wb3coTWF0aC5wb3codGhpcy5hLCBmLmEpLCAxIC8gZi5iKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgeFxuICAgICAgICApO1xuICAgICAgICBcbiAgICB9XG5cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICBcbn07XG5cbl8ucmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIG11dGFibGUuXG4gICAgZnVuY3Rpb24gZ2NkKGEsIGIpIHtcbiAgICAgICAgaWYoYiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdjZChiLCBhICUgYik7XG4gICAgfVxuICAgIHZhciBnID0gZ2NkKHRoaXMuYiwgdGhpcy5hKTtcbiAgICB0aGlzLmEgLz0gZztcbiAgICB0aGlzLmIgLz0gZztcbiAgICBpZih0aGlzLmIgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIodGhpcy5hKTtcbiAgICB9XG4gICAgaWYodGhpcy5iIDwgMCkge1xuICAgICAgICB0aGlzLmEgPSAtdGhpcy5hO1xuICAgICAgICB0aGlzLmIgPSAtdGhpcy5iO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi8uLi8uLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlZ2VyO1xuXG51dGlsLmluaGVyaXRzKEludGVnZXIsIHN1cCk7XG5cbmZ1bmN0aW9uIEludGVnZXIoeCkge1xuICAgIHRoaXMuYSA9IHg7XG59XG5cbnZhciBfID0gSW50ZWdlci5wcm90b3R5cGU7XG5cbl8uYiA9IDE7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKyB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKyddKHRoaXMpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAtIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyctJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgaWYodGhpcy5hICUgeC5hID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hIC8geC5hKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IHN1cCh0aGlzLmEsIHguYSk7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWycvJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlZ2VyKC10aGlzLmEpO1xufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAqIHguYSk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIoTWF0aC5wb3codGhpcy5hLCB4LmEpKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGgucG93KE1hdGgucG93KHRoaXMuYSwgZi5hKSwgMSAvIGYuYikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICBpZih0aGlzLmEgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW1xuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgeFxuICAgICAgICAgICAgXSwgJ14nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHhcbiAgICApO1xuICAgIFxufTtcblxuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICUgeC5hKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IHN1cCkge1xuICAgICAgICByZXR1cm4gbmV3IHN1cCgpOy8vIEB0b2RvOiAhXG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcyAlIHgudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICclJyk7XG4gICAgfVxufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSh0aGlzLmEudG9TdHJpbmcoKSArICcuMCcpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkpO1xufTtcbn0pKCkiXX0=
;