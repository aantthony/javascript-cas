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
},{"__browserify_process":12}],13:[function(require,module,exports){
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
},{"fs":14,"path":15,"__browserify_process":12}],3:[function(require,module,exports){
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
},{"../../grammar/parser.js":13,"./":8,"../Expression":5,"../global":9}],8:[function(require,module,exports){
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
},{"./Constant":19,"./NumericalComplex":20,"./NumericalReal":21,"./Rational":22,"./Integer":23,"../global":9,"./List":24,"./List/Real":25,"./List/ComplexCartesian":26,"./List/ComplexPolar":27,"./Symbol/Real":28,"./Symbol":29,"./Statement":30,"./Vector":31,"./Matrix":32,"./Function":33,"./Infinitesimal":34,"./Function/Symbolic":35}],6:[function(require,module,exports){
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
},{"util":10,"./":5,"../global":9}],20:[function(require,module,exports){
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

List.prototype.sub = function (x, y) {
    var a = this[0].sub(x, y);
    var b = this[1] && this[1].sub(x, y);

    return a[this.operator || 'default'](b);
};
},{"util":10,"../":5}],29:[function(require,module,exports){
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
},{"util":10,"../":5,"../../global":9}],33:[function(require,module,exports){
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


},{"util":10,"../":5}],32:[function(require,module,exports){
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


},{"util":10,"../":5}],34:[function(require,module,exports){
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
},{"util":10,"../":24,"../../":5,"../../../global":9}],26:[function(require,module,exports){
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

},{"util":10,"../":24,"../../":5}],28:[function(require,module,exports){
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
},{"util":10,"../":29,"../../../global":9,"../../":5}],35:[function(require,module,exports){
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
},{"util":10,"../":33,"../../":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FcnJvci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9nbG9iYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL3V0aWwuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9ldmVudHMuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ncmFtbWFyL3BhcnNlci5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9kZWZhdWx0LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0xhbmd1YWdlL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL2dsb2JhbC9kZWZhdWx0cy5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0NvbnRleHQvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeTIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2ZzLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkyL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXJlc29sdmUvYnVpbHRpbi9wYXRoLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0xhbmd1YWdlL0NvZGUuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvTGFuZ3VhZ2Uvc3RyaW5naWZ5LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vQ29uc3RhbnQuanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9OdW1lcmljYWxDb21wbGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vTnVtZXJpY2FsUmVhbC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1JhdGlvbmFsLmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vSW50ZWdlci5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9MYW5ndWFnZS9wYXJzZS5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0xpc3QvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9TeW1ib2wvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9TdGF0ZW1lbnQvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9WZWN0b3IvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9GdW5jdGlvbi9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL01hdHJpeC9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL0luZmluaXRlc2ltYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L1JlYWwvaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L0NvbXBsZXhDYXJ0ZXNpYW4vaW5kZXguanMiLCIvVXNlcnMvYW50aG9ueS9Qcm9qZWN0cy9qYXZhc2NyaXB0LWNhcy9saWIvRXhwcmVzc2lvbi9MaXN0L0NvbXBsZXhQb2xhci9pbmRleC5qcyIsIi9Vc2Vycy9hbnRob255L1Byb2plY3RzL2phdmFzY3JpcHQtY2FzL2xpYi9FeHByZXNzaW9uL1N5bWJvbC9SZWFsL2luZGV4LmpzIiwiL1VzZXJzL2FudGhvbnkvUHJvamVjdHMvamF2YXNjcmlwdC1jYXMvbGliL0V4cHJlc3Npb24vRnVuY3Rpb24vU3ltYm9saWMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBNID0gcmVxdWlyZSgnLi9saWInKTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIF9NID0gd2luZG93Lk07XG4gICAgd2luZG93Lk0gPSBNO1xuICAgIE0ubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93Lk0gPSBfTTtcbiAgICAgICAgcmV0dXJuIE07XG4gICAgfTtcbn1cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gTTtcbn1cbiIsIihmdW5jdGlvbigpey8qanNsaW50IG5vZGU6IHRydWUgKi9cblxuLy8gbm90IHN1cmUgaWYgdGhpcyBpcyByZXF1aXJlZDpcbi8qanNoaW50IHN1YjogdHJ1ZSAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEV4cHJlc3Npb24gID0gcmVxdWlyZSgnLi9FeHByZXNzaW9uJyksXG4gICAgQ29udGV4dCAgICAgPSByZXF1aXJlKCcuL0NvbnRleHQnKSxcbiAgICBNYXRoRXJyb3IgICA9IHJlcXVpcmUoJy4vRXJyb3InKSxcbiAgICBsYW5ndWFnZSAgICA9IHJlcXVpcmUoJy4vTGFuZ3VhZ2UvZGVmYXVsdCcpLFxuICAgIENvZGUgICAgICAgID0gcmVxdWlyZSgnLi9MYW5ndWFnZScpLkNvZGUsXG4gICAgR2xvYmFsICAgICAgPSByZXF1aXJlKCcuL2dsb2JhbCcpO1xuXG4vLyBEZWZpbmUgc2luLCBjb3MsIHRhbiwgZXRjLlxudmFyIGRlZmF1bHRzICAgID0gcmVxdWlyZSgnLi9nbG9iYWwvZGVmYXVsdHMnKTtcbmRlZmF1bHRzLmF0dGFjaChHbG9iYWwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE07XG5cbmZ1bmN0aW9uIE0oZSwgYykge1xuICAgIHJldHVybiBsYW5ndWFnZS5wYXJzZShlLCBjIHx8IEdsb2JhbCk7XG59XG5cbk0udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gW1xuICAgICdmdW5jdGlvbiBNKGV4cHJlc3Npb24sIGNvbnRleHQpIHsnLFxuICAgICcgICAgLyohJyxcbiAgICAnICAgICAqICBNYXRoIEphdmFTY3JpcHQgTGlicmFyeSB2My45LjEnLFxuICAgICcgICAgICogIGh0dHBzOi8vZ2l0aHViLmNvbS9hYW50dGhvbnkvamF2YXNjcmlwdC1jYXMnLFxuICAgICcgICAgICogICcsXG4gICAgJyAgICAgKiAgQ29weXJpZ2h0IDIwMTAgQW50aG9ueSBGb3N0ZXIuIEFsbCByaWdodHMgcmVzZXJ2ZWQuJyxcbiAgICAnICAgICAqLycsXG4gICAgJyAgICBbYXdlc29tZSBjb2RlXScsXG4gICAgJ30nXS5qb2luKCdcXG4nKTtcbn07XG5cbk1bJ0NvbnRleHQnXSAgICA9IENvbnRleHQ7XG5NWydFeHByZXNzaW9uJ10gPSBFeHByZXNzaW9uO1xuTVsnR2xvYmFsJ10gICAgID0gR2xvYmFsO1xuTVsnRXJyb3InXSAgICAgID0gTWF0aEVycm9yO1xuXG5FeHByZXNzaW9uLnByb3RvdHlwZS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICBDb2RlLmxhbmd1YWdlID0gbGFuZ3VhZ2U7XG4gICAgQ29kZS5uZXdDb250ZXh0KCk7XG4gICAgcmV0dXJuIHRoaXMuX3MoQ29kZSwgbGFuZyk7XG59O1xuRXhwcmVzc2lvbi5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXMucygndGV4dC9qYXZhc2NyaXB0JykuY29tcGlsZSh4KTtcbn1cblxudmFyIGV4dGVuc2lvbnMgPSB7fTtcblxuTVsncmVnaXN0ZXInXSA9IGZ1bmN0aW9uIChuYW1lLCBpbnN0YWxsZXIpe1xuICAgIGlmKEV4cHJlc3Npb24ucHJvdG90eXBlW25hbWVdKSB7XG4gICAgICAgIHRocm93KCdNZXRob2QgLicgKyBuYW1lICsgJyBpcyBhbHJlYWR5IGluIHVzZSEnKTtcbiAgICB9XG4gICAgZXh0ZW5zaW9uc1tuYW1lXSA9IGluc3RhbGxlcjtcbn07XG5cbk1bJ2xvYWQnXSA9IGZ1bmN0aW9uKG5hbWUsIGNvbmZpZykge1xuICAgIGV4dGVuc2lvbnNbbmFtZV0oTSwgRXhwcmVzc2lvbiwgY29uZmlnKTtcbiAgICBkZWxldGUgZXh0ZW5zaW9uc1tuYW1lXTtcbn07XG5cbn0pKCkiLCJmdW5jdGlvbiBNYXRoRXJyb3Ioc3RyKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gc3RyO1xufVxuTWF0aEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRoRXJyb3I7XG4iLCIoZnVuY3Rpb24oKXt2YXIgZ2xvYmFsID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsO1xuXG59KSgpIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0RhdGUgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nfTtcbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbihvYmope3JldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSd9O1xuXG5cbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiAoKSB7fTtcbmV4cG9ydHMucHV0cyA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5kZWJ1ZyA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGZ1bmN0aW9uKG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycykge1xuICB2YXIgc2VlbiA9IFtdO1xuXG4gIHZhciBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3NcbiAgICB2YXIgc3R5bGVzID1cbiAgICAgICAgeyAnYm9sZCcgOiBbMSwgMjJdLFxuICAgICAgICAgICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgICAgICAgICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICAgICAgICAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgICAgICAgICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICAgICAgICAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICAgICAgICAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAgICAgICAgICdibHVlJyA6IFszNCwgMzldLFxuICAgICAgICAgICdjeWFuJyA6IFszNiwgMzldLFxuICAgICAgICAgICdncmVlbicgOiBbMzIsIDM5XSxcbiAgICAgICAgICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgICAgICAgICAncmVkJyA6IFszMSwgMzldLFxuICAgICAgICAgICd5ZWxsb3cnIDogWzMzLCAzOV0gfTtcblxuICAgIHZhciBzdHlsZSA9XG4gICAgICAgIHsgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICAgICAgICAgJ251bWJlcic6ICdibHVlJyxcbiAgICAgICAgICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAgICAgICAgICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICAgICAgICAgJ251bGwnOiAnYm9sZCcsXG4gICAgICAgICAgJ3N0cmluZyc6ICdncmVlbicsXG4gICAgICAgICAgJ2RhdGUnOiAnbWFnZW50YScsXG4gICAgICAgICAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgICAgICAgICAncmVnZXhwJzogJ3JlZCcgfVtzdHlsZVR5cGVdO1xuXG4gICAgaWYgKHN0eWxlKSB7XG4gICAgICByZXR1cm4gJ1xcMDMzWycgKyBzdHlsZXNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgICAnXFwwMzNbJyArIHN0eWxlc1tzdHlsZV1bMV0gKyAnbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9O1xuICBpZiAoISBjb2xvcnMpIHtcbiAgICBzdHlsaXplID0gZnVuY3Rpb24oc3RyLCBzdHlsZVR5cGUpIHsgcmV0dXJuIHN0cjsgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gICAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAgIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUuaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgICAgdmFsdWUgIT09IGV4cG9ydHMgJiZcbiAgICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuXG4gICAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgICAgcmV0dXJuIHN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG5cbiAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcblxuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gICAgfVxuICAgIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBzdHlsaXplKCdudWxsJywgJ251bGwnKTtcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gICAgdmFyIHZpc2libGVfa2V5cyA9IE9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICB2YXIga2V5cyA9IHNob3dIaWRkZW4gPyBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSkgOiB2aXNpYmxlX2tleXM7XG5cbiAgICAvLyBGdW5jdGlvbnMgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEYXRlcyB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkXG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkgJiYga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzdHlsaXplKHZhbHVlLnRvVVRDU3RyaW5nKCksICdkYXRlJyk7XG4gICAgfVxuXG4gICAgdmFyIGJhc2UsIHR5cGUsIGJyYWNlcztcbiAgICAvLyBEZXRlcm1pbmUgdGhlIG9iamVjdCB0eXBlXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB0eXBlID0gJ0FycmF5JztcbiAgICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSAnT2JqZWN0JztcbiAgICAgIGJyYWNlcyA9IFsneycsICd9J107XG4gICAgfVxuXG4gICAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIGJhc2UgPSAoaXNSZWdFeHAodmFsdWUpKSA/ICcgJyArIHZhbHVlIDogJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZSA9ICcnO1xuICAgIH1cblxuICAgIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICBiYXNlID0gJyAnICsgdmFsdWUudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICAgIH1cblxuICAgIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCcnICsgdmFsdWUsICdyZWdleHAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2Vlbi5wdXNoKHZhbHVlKTtcblxuICAgIHZhciBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBuYW1lLCBzdHI7XG4gICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXykge1xuICAgICAgICBpZiAodmFsdWUuX19sb29rdXBHZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLl9fbG9va3VwU2V0dGVyX18oa2V5KSkge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RyID0gc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmFsdWUuX19sb29rdXBTZXR0ZXJfXyhrZXkpKSB7XG4gICAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZV9rZXlzLmluZGV4T2Yoa2V5KSA8IDApIHtcbiAgICAgICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgICAgIH1cbiAgICAgIGlmICghc3RyKSB7XG4gICAgICAgIGlmIChzZWVuLmluZGV4T2YodmFsdWVba2V5XSkgPCAwKSB7XG4gICAgICAgICAgaWYgKHJlY3Vyc2VUaW1lcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RyID0gZm9ybWF0KHZhbHVlW2tleV0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHIgPSBmb3JtYXQodmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSBzdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZSA9PT0gJ0FycmF5JyAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgICAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgICAgICBuYW1lID0gc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICAgICAgbmFtZSA9IHN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbiAgICB9KTtcblxuICAgIHNlZW4ucG9wKCk7XG5cbiAgICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICAgIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgICAgbnVtTGluZXNFc3QrKztcbiAgICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gICAgfSwgMCk7XG5cbiAgICBpZiAobGVuZ3RoID4gNTApIHtcbiAgICAgIG91dHB1dCA9IGJyYWNlc1swXSArXG4gICAgICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgICAgICcgJyArXG4gICAgICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgICAgIGJyYWNlc1sxXTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICByZXR1cm4gZm9ybWF0KG9iaiwgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyAyIDogZGVwdGgpKTtcbn07XG5cblxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gYXIgaW5zdGFuY2VvZiBBcnJheSB8fFxuICAgICAgICAgQXJyYXkuaXNBcnJheShhcikgfHxcbiAgICAgICAgIChhciAmJiBhciAhPT0gT2JqZWN0LnByb3RvdHlwZSAmJiBpc0FycmF5KGFyLl9fcHJvdG9fXykpO1xufVxuXG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiByZSBpbnN0YW5jZW9mIFJlZ0V4cCB8fFxuICAgICh0eXBlb2YgcmUgPT09ICdvYmplY3QnICYmIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nKTtcbn1cblxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICBpZiAoZCBpbnN0YW5jZW9mIERhdGUpIHJldHVybiB0cnVlO1xuICBpZiAodHlwZW9mIGQgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gIHZhciBwcm9wZXJ0aWVzID0gRGF0ZS5wcm90b3R5cGUgJiYgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMoRGF0ZS5wcm90b3R5cGUpO1xuICB2YXIgcHJvdG8gPSBkLl9fcHJvdG9fXyAmJiBPYmplY3RfZ2V0T3duUHJvcGVydHlOYW1lcyhkLl9fcHJvdG9fXyk7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShwcm90bykgPT09IEpTT04uc3RyaW5naWZ5KHByb3BlcnRpZXMpO1xufVxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbiAobXNnKSB7fTtcblxuZXhwb3J0cy5wdW1wID0gbnVsbDtcblxudmFyIE9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSByZXMucHVzaChrZXkpO1xuICAgIHJldHVybiByZXM7XG59O1xuXG52YXIgT2JqZWN0X2dldE93blByb3BlcnR5TmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBPYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlLCBwcm9wZXJ0aWVzKSB7XG4gICAgLy8gZnJvbSBlczUtc2hpbVxuICAgIHZhciBvYmplY3Q7XG4gICAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgICAgICBvYmplY3QgPSB7ICdfX3Byb3RvX18nIDogbnVsbCB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBUeXBlID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgICAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgICAgICBvYmplY3QuX19wcm90b19fID0gcHJvdG90eXBlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdF9jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICB2YWx1ZTogY3RvcixcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xufTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKHR5cGVvZiBmICE9PSAnc3RyaW5nJykge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChleHBvcnRzLmluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOiByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvcih2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pe1xuICAgIGlmICh4ID09PSBudWxsIHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBleHBvcnRzLmluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGlmIChldi5zb3VyY2UgPT09IHdpbmRvdyAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIoZnVuY3Rpb24ocHJvY2Vzcyl7aWYgKCFwcm9jZXNzLkV2ZW50RW1pdHRlcikgcHJvY2Vzcy5FdmVudEVtaXR0ZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxudmFyIEV2ZW50RW1pdHRlciA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gcHJvY2Vzcy5FdmVudEVtaXR0ZXI7XG52YXIgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nXG4gICAgPyBBcnJheS5pc0FycmF5XG4gICAgOiBmdW5jdGlvbiAoeHMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSdcbiAgICB9XG47XG5mdW5jdGlvbiBpbmRleE9mICh4cywgeCkge1xuICAgIGlmICh4cy5pbmRleE9mKSByZXR1cm4geHMuaW5kZXhPZih4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh4ID09PSB4c1tpXSkgcmV0dXJuIGk7XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn1cblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXG4vLyBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbi8vXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxudmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG4gIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBuO1xufTtcblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc0FycmF5KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKVxuICAgIHtcbiAgICAgIGlmIChhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiBmYWxzZTtcbiAgdmFyIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGlmICghaGFuZGxlcikgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgdmFyIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICgnZnVuY3Rpb24nICE9PSB0eXBlb2YgbGlzdGVuZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2FkZExpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAoIXRoaXMuX2V2ZW50cykgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PSBcIm5ld0xpc3RlbmVyc1wiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lcnNcIi5cbiAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICAgIHZhciBtO1xuICAgICAgaWYgKHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBtID0gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG0gPSBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5vbih0eXBlLCBmdW5jdGlvbiBnKCkge1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiBsaXN0ZW5lcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcblxuICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNBcnJheShsaXN0KSkge1xuICAgIHZhciBpID0gaW5kZXhPZihsaXN0LCBsaXN0ZW5lcik7XG4gICAgaWYgKGkgPCAwKSByZXR1cm4gdGhpcztcbiAgICBsaXN0LnNwbGljZShpLCAxKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT0gMClcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH0gZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdID09PSBsaXN0ZW5lcikge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG4gIGlmICh0eXBlICYmIHRoaXMuX2V2ZW50cyAmJiB0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSB7fTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuICBpZiAoIWlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICB9XG4gIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG59O1xuXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpey8qIHBhcnNlciBnZW5lcmF0ZWQgYnkgamlzb24gMC40LjEwICovXG4vKlxuICBSZXR1cm5zIGEgUGFyc2VyIG9iamVjdCBvZiB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcblxuICBQYXJzZXI6IHtcbiAgICB5eToge31cbiAgfVxuXG4gIFBhcnNlci5wcm90b3R5cGU6IHtcbiAgICB5eToge30sXG4gICAgdHJhY2U6IGZ1bmN0aW9uKCksXG4gICAgc3ltYm9sc186IHthc3NvY2lhdGl2ZSBsaXN0OiBuYW1lID09PiBudW1iZXJ9LFxuICAgIHRlcm1pbmFsc186IHthc3NvY2lhdGl2ZSBsaXN0OiBudW1iZXIgPT0+IG5hbWV9LFxuICAgIHByb2R1Y3Rpb25zXzogWy4uLl0sXG4gICAgcGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgeXksIHl5c3RhdGUsICQkLCBfJCksXG4gICAgdGFibGU6IFsuLi5dLFxuICAgIGRlZmF1bHRBY3Rpb25zOiB7Li4ufSxcbiAgICBwYXJzZUVycm9yOiBmdW5jdGlvbihzdHIsIGhhc2gpLFxuICAgIHBhcnNlOiBmdW5jdGlvbihpbnB1dCksXG5cbiAgICBsZXhlcjoge1xuICAgICAgICBFT0Y6IDEsXG4gICAgICAgIHBhcnNlRXJyb3I6IGZ1bmN0aW9uKHN0ciwgaGFzaCksXG4gICAgICAgIHNldElucHV0OiBmdW5jdGlvbihpbnB1dCksXG4gICAgICAgIGlucHV0OiBmdW5jdGlvbigpLFxuICAgICAgICB1bnB1dDogZnVuY3Rpb24oc3RyKSxcbiAgICAgICAgbW9yZTogZnVuY3Rpb24oKSxcbiAgICAgICAgbGVzczogZnVuY3Rpb24obiksXG4gICAgICAgIHBhc3RJbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgdXBjb21pbmdJbnB1dDogZnVuY3Rpb24oKSxcbiAgICAgICAgc2hvd1Bvc2l0aW9uOiBmdW5jdGlvbigpLFxuICAgICAgICB0ZXN0X21hdGNoOiBmdW5jdGlvbihyZWdleF9tYXRjaF9hcnJheSwgcnVsZV9pbmRleCksXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCksXG4gICAgICAgIGxleDogZnVuY3Rpb24oKSxcbiAgICAgICAgYmVnaW46IGZ1bmN0aW9uKGNvbmRpdGlvbiksXG4gICAgICAgIHBvcFN0YXRlOiBmdW5jdGlvbigpLFxuICAgICAgICBfY3VycmVudFJ1bGVzOiBmdW5jdGlvbigpLFxuICAgICAgICB0b3BTdGF0ZTogZnVuY3Rpb24oKSxcbiAgICAgICAgcHVzaFN0YXRlOiBmdW5jdGlvbihjb25kaXRpb24pLFxuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHJhbmdlczogYm9vbGVhbiAgICAgICAgICAgKG9wdGlvbmFsOiB0cnVlID09PiB0b2tlbiBsb2NhdGlvbiBpbmZvIHdpbGwgaW5jbHVkZSBhIC5yYW5nZVtdIG1lbWJlcilcbiAgICAgICAgICAgIGZsZXg6IGJvb2xlYW4gICAgICAgICAgICAgKG9wdGlvbmFsOiB0cnVlID09PiBmbGV4LWxpa2UgbGV4aW5nIGJlaGF2aW91ciB3aGVyZSB0aGUgcnVsZXMgYXJlIHRlc3RlZCBleGhhdXN0aXZlbHkgdG8gZmluZCB0aGUgbG9uZ2VzdCBtYXRjaClcbiAgICAgICAgICAgIGJhY2t0cmFja19sZXhlcjogYm9vbGVhbiAgKG9wdGlvbmFsOiB0cnVlID09PiBsZXhlciByZWdleGVzIGFyZSB0ZXN0ZWQgaW4gb3JkZXIgYW5kIGZvciBlYWNoIG1hdGNoaW5nIHJlZ2V4IHRoZSBhY3Rpb24gY29kZSBpcyBpbnZva2VkOyB0aGUgbGV4ZXIgdGVybWluYXRlcyB0aGUgc2NhbiB3aGVuIGEgdG9rZW4gaXMgcmV0dXJuZWQgYnkgdGhlIGFjdGlvbiBjb2RlKVxuICAgICAgICB9LFxuXG4gICAgICAgIHBlcmZvcm1BY3Rpb246IGZ1bmN0aW9uKHl5LCB5eV8sICRhdm9pZGluZ19uYW1lX2NvbGxpc2lvbnMsIFlZX1NUQVJUKSxcbiAgICAgICAgcnVsZXM6IFsuLi5dLFxuICAgICAgICBjb25kaXRpb25zOiB7YXNzb2NpYXRpdmUgbGlzdDogbmFtZSA9PT4gc2V0fSxcbiAgICB9XG4gIH1cblxuXG4gIHRva2VuIGxvY2F0aW9uIGluZm8gKEAkLCBfJCwgZXRjLik6IHtcbiAgICBmaXJzdF9saW5lOiBuLFxuICAgIGxhc3RfbGluZTogbixcbiAgICBmaXJzdF9jb2x1bW46IG4sXG4gICAgbGFzdF9jb2x1bW46IG4sXG4gICAgcmFuZ2U6IFtzdGFydF9udW1iZXIsIGVuZF9udW1iZXJdICAgICAgICh3aGVyZSB0aGUgbnVtYmVycyBhcmUgaW5kZXhlcyBpbnRvIHRoZSBpbnB1dCBzdHJpbmcsIHJlZ3VsYXIgemVyby1iYXNlZClcbiAgfVxuXG5cbiAgdGhlIHBhcnNlRXJyb3IgZnVuY3Rpb24gcmVjZWl2ZXMgYSAnaGFzaCcgb2JqZWN0IHdpdGggdGhlc2UgbWVtYmVycyBmb3IgbGV4ZXIgYW5kIHBhcnNlciBlcnJvcnM6IHtcbiAgICB0ZXh0OiAgICAgICAgKG1hdGNoZWQgdGV4dClcbiAgICB0b2tlbjogICAgICAgKHRoZSBwcm9kdWNlZCB0ZXJtaW5hbCB0b2tlbiwgaWYgYW55KVxuICAgIGxpbmU6ICAgICAgICAoeXlsaW5lbm8pXG4gIH1cbiAgd2hpbGUgcGFyc2VyIChncmFtbWFyKSBlcnJvcnMgd2lsbCBhbHNvIHByb3ZpZGUgdGhlc2UgbWVtYmVycywgaS5lLiBwYXJzZXIgZXJyb3JzIGRlbGl2ZXIgYSBzdXBlcnNldCBvZiBhdHRyaWJ1dGVzOiB7XG4gICAgbG9jOiAgICAgICAgICh5eWxsb2MpXG4gICAgZXhwZWN0ZWQ6ICAgIChzdHJpbmcgZGVzY3JpYmluZyB0aGUgc2V0IG9mIGV4cGVjdGVkIHRva2VucylcbiAgICByZWNvdmVyYWJsZTogKGJvb2xlYW46IFRSVUUgd2hlbiB0aGUgcGFyc2VyIGhhcyBhIGVycm9yIHJlY292ZXJ5IHJ1bGUgYXZhaWxhYmxlIGZvciB0aGlzIHBhcnRpY3VsYXIgZXJyb3IpXG4gIH1cbiovXG52YXIgcGFyc2VyID0gKGZ1bmN0aW9uKCl7XG52YXIgcGFyc2VyID0ge3RyYWNlOiBmdW5jdGlvbiB0cmFjZSgpIHsgfSxcbnl5OiB7fSxcbnN5bWJvbHNfOiB7XCJlcnJvclwiOjIsXCJleHByZXNzaW9uc1wiOjMsXCJTXCI6NCxcIkVPRlwiOjUsXCJlXCI6NixcInN0bXRcIjo3LFwiPVwiOjgsXCIhPVwiOjksXCI8PVwiOjEwLFwiPFwiOjExLFwiPlwiOjEyLFwiPj1cIjoxMyxcImNzbFwiOjE0LFwiLFwiOjE1LFwidmVjdG9yXCI6MTYsXCIoXCI6MTcsXCIpXCI6MTgsXCIrXCI6MTksXCItXCI6MjAsXCIqXCI6MjEsXCIvXCI6MjIsXCJQT1dFUntcIjoyMyxcIn1cIjoyNCxcIl97XCI6MjUsXCJfU0lOR0xFXCI6MjYsXCJTUVJUe1wiOjI3LFwiRlJBQ3tcIjoyOCxcIntcIjoyOSxcIl5TSU5HTEVcIjozMCxcImlkZW50aWZpZXJcIjozMSxcIm51bWJlclwiOjMyLFwiSURFTlRJRklFUlwiOjMzLFwiTE9OR0lERU5USUZJRVJcIjozNCxcIkRFQ0lNQUxcIjozNSxcIklOVEVHRVJcIjozNixcIiRhY2NlcHRcIjowLFwiJGVuZFwiOjF9LFxudGVybWluYWxzXzogezI6XCJlcnJvclwiLDU6XCJFT0ZcIiw4OlwiPVwiLDk6XCIhPVwiLDEwOlwiPD1cIiwxMTpcIjxcIiwxMjpcIj5cIiwxMzpcIj49XCIsMTU6XCIsXCIsMTc6XCIoXCIsMTg6XCIpXCIsMTk6XCIrXCIsMjA6XCItXCIsMjE6XCIqXCIsMjI6XCIvXCIsMjM6XCJQT1dFUntcIiwyNDpcIn1cIiwyNTpcIl97XCIsMjY6XCJfU0lOR0xFXCIsMjc6XCJTUVJUe1wiLDI4OlwiRlJBQ3tcIiwyOTpcIntcIiwzMDpcIl5TSU5HTEVcIiwzMzpcIklERU5USUZJRVJcIiwzNDpcIkxPTkdJREVOVElGSUVSXCIsMzU6XCJERUNJTUFMXCIsMzY6XCJJTlRFR0VSXCJ9LFxucHJvZHVjdGlvbnNfOiBbMCxbMywyXSxbNCwxXSxbNCwxXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbNywzXSxbMTQsM10sWzE0LDNdLFsxNiwzXSxbNiwzXSxbNiwzXSxbNiwzXSxbNiwzXSxbNiw0XSxbNiw0XSxbNiwyXSxbNiwzXSxbNiw2XSxbNiwyXSxbNiwyXSxbNiwyXSxbNiwzXSxbNiwxXSxbNiwxXSxbNiwxXSxbMzEsMV0sWzMxLDFdLFszMiwxXSxbMzIsMV1dLFxucGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgeXksIHl5c3RhdGUgLyogYWN0aW9uWzFdICovLCAkJCAvKiB2c3RhY2sgKi8sIF8kIC8qIGxzdGFjayAqLykge1xuLyogdGhpcyA9PSB5eXZhbCAqL1xuXG52YXIgJDAgPSAkJC5sZW5ndGggLSAxO1xuc3dpdGNoICh5eXN0YXRlKSB7XG5jYXNlIDE6IHJldHVybiAkJFskMC0xXTsgXG5icmVhaztcbmNhc2UgMjp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMzp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgNDp0aGlzLiQgPSBbJz0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA1OnRoaXMuJCA9IFsnIT0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA2OnRoaXMuJCA9IFsnPD0nLCAkJFskMC0yXSwgJCRbJDBdXTtcbmJyZWFrO1xuY2FzZSA3OnRoaXMuJCA9IFsnPCcsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDg6dGhpcy4kID0gWyc+JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgOTp0aGlzLiQgPSBbJz49JywgJCRbJDAtMl0sICQkWyQwXV07XG5icmVhaztcbmNhc2UgMTA6dGhpcy4kID0gWycsLicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDExOnRoaXMuJCA9IFsnLCcsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDEyOnRoaXMuJCA9ICQkWyQwLTFdO1xuYnJlYWs7XG5jYXNlIDEzOnRoaXMuJCA9IFsnKycsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE0OnRoaXMuJCA9IFsnLScsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE1OnRoaXMuJCA9IFsnKicsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE2OnRoaXMuJCA9IFsnLycsICQkWyQwLTJdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDE3OnRoaXMuJCA9IFsnXicsICQkWyQwLTNdLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMTg6dGhpcy4kID0gWydfJywgJCRbJDAtM10sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAxOTp0aGlzLiQgPSBbJ18nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyMDp0aGlzLiQgPSBbJ3NxcnQnLCAkJFskMC0xXV07XG5icmVhaztcbmNhc2UgMjE6dGhpcy4kID0gWydmcmFjJywgJCRbJDAtNF0sICQkWyQwLTFdXTtcbmJyZWFrO1xuY2FzZSAyMjp0aGlzLiQgPSBbJ14nLCAkJFskMC0xXSwge3R5cGU6ICdTaW5nbGUnLCBwcmltaXRpdmU6IHl5dGV4dC5zdWJzdHJpbmcoMSl9XTtcbmJyZWFrO1xuY2FzZSAyMzp0aGlzLiQgPSBbJ0AtJywgJCRbJDBdXVxuYnJlYWs7XG5jYXNlIDI0OnRoaXMuJCA9IFsnZGVmYXVsdCcsICQkWyQwLTFdLCAkJFskMF1dO1xuYnJlYWs7XG5jYXNlIDI1OnRoaXMuJCA9ICQkWyQwLTFdXG5icmVhaztcbmNhc2UgMjY6dGhpcy4kID0gJCRbJDBdO1xuYnJlYWs7XG5jYXNlIDI3OnRoaXMuJCA9ICQkWyQwXTtcbmJyZWFrO1xuY2FzZSAyODp0aGlzLiQgPSAkJFskMF07XG5icmVhaztcbmNhc2UgMjk6dGhpcy4kID0geXl0ZXh0O1xuYnJlYWs7XG5jYXNlIDMwOnRoaXMuJCA9IHl5dGV4dC5zdWJzdHJpbmcoMSk7XG5icmVhaztcbmNhc2UgMzE6dGhpcy4kID0ge3R5cGU6ICdOdW1iZXInLCBwcmltaXRpdmU6IHl5dGV4dH07XG5icmVhaztcbmNhc2UgMzI6dGhpcy4kID0ge3R5cGU6ICdOdW1iZXInLCBwcmltaXRpdmU6IHl5dGV4dH07XG5icmVhaztcbn1cbn0sXG50YWJsZTogW3szOjEsNDoyLDY6Myw3OjQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHsxOlszXX0sezU6WzEsMTZdfSx7NTpbMiwyXSw2OjI1LDg6WzEsMjZdLDk6WzEsMjddLDEwOlsxLDI4XSwxMTpbMSwyOV0sMTI6WzEsMzBdLDEzOlsxLDMxXSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsMl0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwzXSwyNDpbMiwzXX0sezY6MzIsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjMzLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjozNCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MzUsMTQ6MzYsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDI2XSw4OlsyLDI2XSw5OlsyLDI2XSwxMDpbMiwyNl0sMTE6WzIsMjZdLDEyOlsyLDI2XSwxMzpbMiwyNl0sMTU6WzIsMjZdLDE3OlsyLDI2XSwxODpbMiwyNl0sMTk6WzIsMjZdLDIwOlsyLDI2XSwyMTpbMiwyNl0sMjI6WzIsMjZdLDIzOlsyLDI2XSwyNDpbMiwyNl0sMjU6WzIsMjZdLDI2OlsyLDI2XSwyNzpbMiwyNl0sMjg6WzIsMjZdLDMwOlsyLDI2XSwzMzpbMiwyNl0sMzQ6WzIsMjZdLDM1OlsyLDI2XSwzNjpbMiwyNl19LHs1OlsyLDI3XSw4OlsyLDI3XSw5OlsyLDI3XSwxMDpbMiwyN10sMTE6WzIsMjddLDEyOlsyLDI3XSwxMzpbMiwyN10sMTU6WzIsMjddLDE3OlsyLDI3XSwxODpbMiwyN10sMTk6WzIsMjddLDIwOlsyLDI3XSwyMTpbMiwyN10sMjI6WzIsMjddLDIzOlsyLDI3XSwyNDpbMiwyN10sMjU6WzIsMjddLDI2OlsyLDI3XSwyNzpbMiwyN10sMjg6WzIsMjddLDMwOlsyLDI3XSwzMzpbMiwyN10sMzQ6WzIsMjddLDM1OlsyLDI3XSwzNjpbMiwyN119LHs1OlsyLDI4XSw4OlsyLDI4XSw5OlsyLDI4XSwxMDpbMiwyOF0sMTE6WzIsMjhdLDEyOlsyLDI4XSwxMzpbMiwyOF0sMTU6WzIsMjhdLDE3OlsyLDI4XSwxODpbMiwyOF0sMTk6WzIsMjhdLDIwOlsyLDI4XSwyMTpbMiwyOF0sMjI6WzIsMjhdLDIzOlsyLDI4XSwyNDpbMiwyOF0sMjU6WzIsMjhdLDI2OlsyLDI4XSwyNzpbMiwyOF0sMjg6WzIsMjhdLDMwOlsyLDI4XSwzMzpbMiwyOF0sMzQ6WzIsMjhdLDM1OlsyLDI4XSwzNjpbMiwyOF19LHs1OlsyLDI5XSw4OlsyLDI5XSw5OlsyLDI5XSwxMDpbMiwyOV0sMTE6WzIsMjldLDEyOlsyLDI5XSwxMzpbMiwyOV0sMTU6WzIsMjldLDE3OlsyLDI5XSwxODpbMiwyOV0sMTk6WzIsMjldLDIwOlsyLDI5XSwyMTpbMiwyOV0sMjI6WzIsMjldLDIzOlsyLDI5XSwyNDpbMiwyOV0sMjU6WzIsMjldLDI2OlsyLDI5XSwyNzpbMiwyOV0sMjg6WzIsMjldLDMwOlsyLDI5XSwzMzpbMiwyOV0sMzQ6WzIsMjldLDM1OlsyLDI5XSwzNjpbMiwyOV19LHs1OlsyLDMwXSw4OlsyLDMwXSw5OlsyLDMwXSwxMDpbMiwzMF0sMTE6WzIsMzBdLDEyOlsyLDMwXSwxMzpbMiwzMF0sMTU6WzIsMzBdLDE3OlsyLDMwXSwxODpbMiwzMF0sMTk6WzIsMzBdLDIwOlsyLDMwXSwyMTpbMiwzMF0sMjI6WzIsMzBdLDIzOlsyLDMwXSwyNDpbMiwzMF0sMjU6WzIsMzBdLDI2OlsyLDMwXSwyNzpbMiwzMF0sMjg6WzIsMzBdLDMwOlsyLDMwXSwzMzpbMiwzMF0sMzQ6WzIsMzBdLDM1OlsyLDMwXSwzNjpbMiwzMF19LHs1OlsyLDMxXSw4OlsyLDMxXSw5OlsyLDMxXSwxMDpbMiwzMV0sMTE6WzIsMzFdLDEyOlsyLDMxXSwxMzpbMiwzMV0sMTU6WzIsMzFdLDE3OlsyLDMxXSwxODpbMiwzMV0sMTk6WzIsMzFdLDIwOlsyLDMxXSwyMTpbMiwzMV0sMjI6WzIsMzFdLDIzOlsyLDMxXSwyNDpbMiwzMV0sMjU6WzIsMzFdLDI2OlsyLDMxXSwyNzpbMiwzMV0sMjg6WzIsMzFdLDMwOlsyLDMxXSwzMzpbMiwzMV0sMzQ6WzIsMzFdLDM1OlsyLDMxXSwzNjpbMiwzMV19LHs1OlsyLDMyXSw4OlsyLDMyXSw5OlsyLDMyXSwxMDpbMiwzMl0sMTE6WzIsMzJdLDEyOlsyLDMyXSwxMzpbMiwzMl0sMTU6WzIsMzJdLDE3OlsyLDMyXSwxODpbMiwzMl0sMTk6WzIsMzJdLDIwOlsyLDMyXSwyMTpbMiwzMl0sMjI6WzIsMzJdLDIzOlsyLDMyXSwyNDpbMiwzMl0sMjU6WzIsMzJdLDI2OlsyLDMyXSwyNzpbMiwzMl0sMjg6WzIsMzJdLDMwOlsyLDMyXSwzMzpbMiwzMl0sMzQ6WzIsMzJdLDM1OlsyLDMyXSwzNjpbMiwzMl19LHsxOlsyLDFdfSx7NjozNywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MzgsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjM5LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0MCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDEsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs0OjQyLDY6Myw3OjQsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDE5XSw4OlsyLDE5XSw5OlsyLDE5XSwxMDpbMiwxOV0sMTE6WzIsMTldLDEyOlsyLDE5XSwxMzpbMiwxOV0sMTU6WzIsMTldLDE3OlsyLDE5XSwxODpbMiwxOV0sMTk6WzIsMTldLDIwOlsyLDE5XSwyMTpbMiwxOV0sMjI6WzIsMTldLDIzOlsyLDE5XSwyNDpbMiwxOV0sMjU6WzIsMTldLDI2OlsyLDE5XSwyNzpbMiwxOV0sMjg6WzIsMTldLDMwOlsyLDE5XSwzMzpbMiwxOV0sMzQ6WzIsMTldLDM1OlsyLDE5XSwzNjpbMiwxOV19LHs1OlsyLDIyXSw4OlsyLDIyXSw5OlsyLDIyXSwxMDpbMiwyMl0sMTE6WzIsMjJdLDEyOlsyLDIyXSwxMzpbMiwyMl0sMTU6WzIsMjJdLDE3OlsyLDIyXSwxODpbMiwyMl0sMTk6WzIsMjJdLDIwOlsyLDIyXSwyMTpbMiwyMl0sMjI6WzIsMjJdLDIzOlsyLDIyXSwyNDpbMiwyMl0sMjU6WzIsMjJdLDI2OlsyLDIyXSwyNzpbMiwyMl0sMjg6WzIsMjJdLDMwOlsyLDIyXSwzMzpbMiwyMl0sMzQ6WzIsMjJdLDM1OlsyLDIyXSwzNjpbMiwyMl19LHs1OlsyLDI0XSw2OjI1LDg6WzIsMjRdLDk6WzIsMjRdLDEwOlsyLDI0XSwxMTpbMiwyNF0sMTI6WzIsMjRdLDEzOlsyLDI0XSwxNTpbMiwyNF0sMTY6OSwxNzpbMSw4XSwxODpbMiwyNF0sMTk6WzIsMjRdLDIwOlsyLDI0XSwyMTpbMiwyNF0sMjI6WzIsMjRdLDIzOlsxLDIxXSwyNDpbMiwyNF0sMjU6WzIsMjRdLDI2OlsyLDI0XSwyNzpbMiwyNF0sMjg6WzIsMjRdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQzLDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0NCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDUsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjQ2LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7Njo0NywxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6NDgsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSw0OV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNTBdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMjNdLDY6MjUsODpbMiwyM10sOTpbMiwyM10sMTA6WzIsMjNdLDExOlsyLDIzXSwxMjpbMiwyM10sMTM6WzIsMjNdLDE1OlsyLDIzXSwxNjo5LDE3OlsxLDhdLDE4OlsyLDIzXSwxOTpbMiwyM10sMjA6WzIsMjNdLDIxOlsyLDIzXSwyMjpbMiwyM10sMjM6WzEsMjFdLDI0OlsyLDIzXSwyNTpbMiwyM10sMjY6WzIsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjI1LDE1OlsxLDUyXSwxNjo5LDE3OlsxLDhdLDE4OlsxLDUxXSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezE1OlsxLDU0XSwxODpbMSw1M119LHs1OlsyLDEzXSw2OjI1LDg6WzIsMTNdLDk6WzIsMTNdLDEwOlsyLDEzXSwxMTpbMiwxM10sMTI6WzIsMTNdLDEzOlsyLDEzXSwxNTpbMiwxM10sMTY6OSwxNzpbMSw4XSwxODpbMiwxM10sMTk6WzIsMTNdLDIwOlsyLDEzXSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiwxM10sMjU6WzIsMTNdLDI2OlsyLDEzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxNF0sNjoyNSw4OlsyLDE0XSw5OlsyLDE0XSwxMDpbMiwxNF0sMTE6WzIsMTRdLDEyOlsyLDE0XSwxMzpbMiwxNF0sMTU6WzIsMTRdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTRdLDE5OlsyLDE0XSwyMDpbMiwxNF0sMjE6WzIsMjNdLDIyOlsyLDIzXSwyMzpbMSwyMV0sMjQ6WzIsMTRdLDI1OlsyLDE0XSwyNjpbMiwxNF0sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMTVdLDY6MjUsODpbMiwxNV0sOTpbMiwxNV0sMTA6WzIsMTVdLDExOlsyLDE1XSwxMjpbMiwxNV0sMTM6WzIsMTVdLDE1OlsyLDE1XSwxNjo5LDE3OlsxLDhdLDE4OlsyLDE1XSwxOTpbMiwxNV0sMjA6WzIsMTVdLDIxOlsyLDE1XSwyMjpbMiwxNV0sMjM6WzEsMjFdLDI0OlsyLDE1XSwyNTpbMiwxNV0sMjY6WzIsMTVdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDE2XSw2OjI1LDg6WzIsMTZdLDk6WzIsMTZdLDEwOlsyLDE2XSwxMTpbMiwxNl0sMTI6WzIsMTZdLDEzOlsyLDE2XSwxNTpbMiwxNl0sMTY6OSwxNzpbMSw4XSwxODpbMiwxNl0sMTk6WzIsMTZdLDIwOlsyLDE2XSwyMTpbMiwxNl0sMjI6WzIsMTZdLDIzOlsxLDIxXSwyNDpbMiwxNl0sMjU6WzIsMTZdLDI2OlsyLDE2XSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzEsNTVdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezI0OlsxLDU2XX0sezU6WzIsNF0sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsNF0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw1XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw1XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDZdLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDZdLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsN10sNjoyNSwxNjo5LDE3OlsxLDhdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjQ6WzIsN10sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiw4XSw2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMiw4XSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDldLDY6MjUsMTY6OSwxNzpbMSw4XSwxOTpbMSwxN10sMjA6WzEsMThdLDIxOlsxLDE5XSwyMjpbMSwyMF0sMjM6WzEsMjFdLDI0OlsyLDldLDI1OlsxLDIyXSwyNjpbMSwyM10sMjc6WzEsNV0sMjg6WzEsNl0sMzA6WzEsMjRdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezU6WzIsMjBdLDg6WzIsMjBdLDk6WzIsMjBdLDEwOlsyLDIwXSwxMTpbMiwyMF0sMTI6WzIsMjBdLDEzOlsyLDIwXSwxNTpbMiwyMF0sMTc6WzIsMjBdLDE4OlsyLDIwXSwxOTpbMiwyMF0sMjA6WzIsMjBdLDIxOlsyLDIwXSwyMjpbMiwyMF0sMjM6WzIsMjBdLDI0OlsyLDIwXSwyNTpbMiwyMF0sMjY6WzIsMjBdLDI3OlsyLDIwXSwyODpbMiwyMF0sMzA6WzIsMjBdLDMzOlsyLDIwXSwzNDpbMiwyMF0sMzU6WzIsMjBdLDM2OlsyLDIwXX0sezI5OlsxLDU3XX0sezU6WzIsMjVdLDg6WzIsMjVdLDk6WzIsMjVdLDEwOlsyLDI1XSwxMTpbMiwyNV0sMTI6WzIsMjVdLDEzOlsyLDI1XSwxNTpbMiwyNV0sMTc6WzIsMjVdLDE4OlsyLDI1XSwxOTpbMiwyNV0sMjA6WzIsMjVdLDIxOlsyLDI1XSwyMjpbMiwyNV0sMjM6WzIsMjVdLDI0OlsyLDI1XSwyNTpbMiwyNV0sMjY6WzIsMjVdLDI3OlsyLDI1XSwyODpbMiwyNV0sMzA6WzIsMjVdLDMzOlsyLDI1XSwzNDpbMiwyNV0sMzU6WzIsMjVdLDM2OlsyLDI1XX0sezY6NTgsMTY6OSwxNzpbMSw4XSwyMDpbMSw3XSwyNzpbMSw1XSwyODpbMSw2XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs1OlsyLDEyXSw4OlsyLDEyXSw5OlsyLDEyXSwxMDpbMiwxMl0sMTE6WzIsMTJdLDEyOlsyLDEyXSwxMzpbMiwxMl0sMTU6WzIsMTJdLDE3OlsyLDEyXSwxODpbMiwxMl0sMTk6WzIsMTJdLDIwOlsyLDEyXSwyMTpbMiwxMl0sMjI6WzIsMTJdLDIzOlsyLDEyXSwyNDpbMiwxMl0sMjU6WzIsMTJdLDI2OlsyLDEyXSwyNzpbMiwxMl0sMjg6WzIsMTJdLDMwOlsyLDEyXSwzMzpbMiwxMl0sMzQ6WzIsMTJdLDM1OlsyLDEyXSwzNjpbMiwxMl19LHs2OjU5LDE2OjksMTc6WzEsOF0sMjA6WzEsN10sMjc6WzEsNV0sMjg6WzEsNl0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwxN10sODpbMiwxN10sOTpbMiwxN10sMTA6WzIsMTddLDExOlsyLDE3XSwxMjpbMiwxN10sMTM6WzIsMTddLDE1OlsyLDE3XSwxNzpbMiwxN10sMTg6WzIsMTddLDE5OlsyLDE3XSwyMDpbMiwxN10sMjE6WzIsMTddLDIyOlsyLDE3XSwyMzpbMiwxN10sMjQ6WzIsMTddLDI1OlsyLDE3XSwyNjpbMiwxN10sMjc6WzIsMTddLDI4OlsyLDE3XSwzMDpbMiwxN10sMzM6WzIsMTddLDM0OlsyLDE3XSwzNTpbMiwxN10sMzY6WzIsMTddfSx7NTpbMiwxOF0sODpbMiwxOF0sOTpbMiwxOF0sMTA6WzIsMThdLDExOlsyLDE4XSwxMjpbMiwxOF0sMTM6WzIsMThdLDE1OlsyLDE4XSwxNzpbMiwxOF0sMTg6WzIsMThdLDE5OlsyLDE4XSwyMDpbMiwxOF0sMjE6WzIsMThdLDIyOlsyLDE4XSwyMzpbMiwxOF0sMjQ6WzIsMThdLDI1OlsyLDE4XSwyNjpbMiwxOF0sMjc6WzIsMThdLDI4OlsyLDE4XSwzMDpbMiwxOF0sMzM6WzIsMThdLDM0OlsyLDE4XSwzNTpbMiwxOF0sMzY6WzIsMThdfSx7Njo2MCwxNjo5LDE3OlsxLDhdLDIwOlsxLDddLDI3OlsxLDVdLDI4OlsxLDZdLDMxOjEwLDMyOjExLDMzOlsxLDEyXSwzNDpbMSwxM10sMzU6WzEsMTRdLDM2OlsxLDE1XX0sezY6MjUsMTU6WzIsMTFdLDE2OjksMTc6WzEsOF0sMTg6WzIsMTFdLDE5OlsxLDE3XSwyMDpbMSwxOF0sMjE6WzEsMTldLDIyOlsxLDIwXSwyMzpbMSwyMV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NjoyNSwxNTpbMiwxMF0sMTY6OSwxNzpbMSw4XSwxODpbMiwxMF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNTpbMSwyMl0sMjY6WzEsMjNdLDI3OlsxLDVdLDI4OlsxLDZdLDMwOlsxLDI0XSwzMToxMCwzMjoxMSwzMzpbMSwxMl0sMzQ6WzEsMTNdLDM1OlsxLDE0XSwzNjpbMSwxNV19LHs2OjI1LDE2OjksMTc6WzEsOF0sMTk6WzEsMTddLDIwOlsxLDE4XSwyMTpbMSwxOV0sMjI6WzEsMjBdLDIzOlsxLDIxXSwyNDpbMSw2MV0sMjU6WzEsMjJdLDI2OlsxLDIzXSwyNzpbMSw1XSwyODpbMSw2XSwzMDpbMSwyNF0sMzE6MTAsMzI6MTEsMzM6WzEsMTJdLDM0OlsxLDEzXSwzNTpbMSwxNF0sMzY6WzEsMTVdfSx7NTpbMiwyMV0sODpbMiwyMV0sOTpbMiwyMV0sMTA6WzIsMjFdLDExOlsyLDIxXSwxMjpbMiwyMV0sMTM6WzIsMjFdLDE1OlsyLDIxXSwxNzpbMiwyMV0sMTg6WzIsMjFdLDE5OlsyLDIxXSwyMDpbMiwyMV0sMjE6WzIsMjFdLDIyOlsyLDIxXSwyMzpbMiwyMV0sMjQ6WzIsMjFdLDI1OlsyLDIxXSwyNjpbMiwyMV0sMjc6WzIsMjFdLDI4OlsyLDIxXSwzMDpbMiwyMV0sMzM6WzIsMjFdLDM0OlsyLDIxXSwzNTpbMiwyMV0sMzY6WzIsMjFdfV0sXG5kZWZhdWx0QWN0aW9uczogezE2OlsyLDFdfSxcbnBhcnNlRXJyb3I6IGZ1bmN0aW9uIHBhcnNlRXJyb3Ioc3RyLCBoYXNoKSB7XG4gICAgaWYgKGhhc2gucmVjb3ZlcmFibGUpIHtcbiAgICAgICAgdGhpcy50cmFjZShzdHIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihzdHIpO1xuICAgIH1cbn0sXG5wYXJzZTogZnVuY3Rpb24gcGFyc2UoaW5wdXQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsIHN0YWNrID0gWzBdLCB2c3RhY2sgPSBbbnVsbF0sIGxzdGFjayA9IFtdLCB0YWJsZSA9IHRoaXMudGFibGUsIHl5dGV4dCA9ICcnLCB5eWxpbmVubyA9IDAsIHl5bGVuZyA9IDAsIHJlY292ZXJpbmcgPSAwLCBURVJST1IgPSAyLCBFT0YgPSAxO1xuICAgIHRoaXMubGV4ZXIuc2V0SW5wdXQoaW5wdXQpO1xuICAgIHRoaXMubGV4ZXIueXkgPSB0aGlzLnl5O1xuICAgIHRoaXMueXkubGV4ZXIgPSB0aGlzLmxleGVyO1xuICAgIHRoaXMueXkucGFyc2VyID0gdGhpcztcbiAgICBpZiAodHlwZW9mIHRoaXMubGV4ZXIueXlsbG9jID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMubGV4ZXIueXlsbG9jID0ge307XG4gICAgfVxuICAgIHZhciB5eWxvYyA9IHRoaXMubGV4ZXIueXlsbG9jO1xuICAgIGxzdGFjay5wdXNoKHl5bG9jKTtcbiAgICB2YXIgcmFuZ2VzID0gdGhpcy5sZXhlci5vcHRpb25zICYmIHRoaXMubGV4ZXIub3B0aW9ucy5yYW5nZXM7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnl5LnBhcnNlRXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5wYXJzZUVycm9yID0gdGhpcy55eS5wYXJzZUVycm9yO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGFyc2VFcnJvciA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5wYXJzZUVycm9yO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb3BTdGFjayhuKSB7XG4gICAgICAgIHN0YWNrLmxlbmd0aCA9IHN0YWNrLmxlbmd0aCAtIDIgKiBuO1xuICAgICAgICB2c3RhY2subGVuZ3RoID0gdnN0YWNrLmxlbmd0aCAtIG47XG4gICAgICAgIGxzdGFjay5sZW5ndGggPSBsc3RhY2subGVuZ3RoIC0gbjtcbiAgICB9XG4gICAgZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgdG9rZW47XG4gICAgICAgIHRva2VuID0gc2VsZi5sZXhlci5sZXgoKSB8fCBFT0Y7XG4gICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHNlbGYuc3ltYm9sc19bdG9rZW5dIHx8IHRva2VuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9XG4gICAgdmFyIHN5bWJvbCwgcHJlRXJyb3JTeW1ib2wsIHN0YXRlLCBhY3Rpb24sIGEsIHIsIHl5dmFsID0ge30sIHAsIGxlbiwgbmV3U3RhdGUsIGV4cGVjdGVkO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHN0YXRlID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGlmICh0aGlzLmRlZmF1bHRBY3Rpb25zW3N0YXRlXSkge1xuICAgICAgICAgICAgYWN0aW9uID0gdGhpcy5kZWZhdWx0QWN0aW9uc1tzdGF0ZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3ltYm9sID09PSBudWxsIHx8IHR5cGVvZiBzeW1ib2wgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzeW1ib2wgPSBsZXgoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjdGlvbiA9IHRhYmxlW3N0YXRlXSAmJiB0YWJsZVtzdGF0ZV1bc3ltYm9sXTtcbiAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gJ3VuZGVmaW5lZCcgfHwgIWFjdGlvbi5sZW5ndGggfHwgIWFjdGlvblswXSkge1xuICAgICAgICAgICAgICAgIHZhciBlcnJTdHIgPSAnJztcbiAgICAgICAgICAgICAgICBleHBlY3RlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAocCBpbiB0YWJsZVtzdGF0ZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGVybWluYWxzX1twXSAmJiBwID4gVEVSUk9SKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZC5wdXNoKCdcXCcnICsgdGhpcy50ZXJtaW5hbHNfW3BdICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxleGVyLnNob3dQb3NpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOlxcbicgKyB0aGlzLmxleGVyLnNob3dQb3NpdGlvbigpICsgJ1xcbkV4cGVjdGluZyAnICsgZXhwZWN0ZWQuam9pbignLCAnKSArICcsIGdvdCBcXCcnICsgKHRoaXMudGVybWluYWxzX1tzeW1ib2xdIHx8IHN5bWJvbCkgKyAnXFwnJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlcnJTdHIgPSAnUGFyc2UgZXJyb3Igb24gbGluZSAnICsgKHl5bGluZW5vICsgMSkgKyAnOiBVbmV4cGVjdGVkICcgKyAoc3ltYm9sID09IEVPRiA/ICdlbmQgb2YgaW5wdXQnIDogJ1xcJycgKyAodGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sKSArICdcXCcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUVycm9yKGVyclN0ciwge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGlzLmxleGVyLm1hdGNoLFxuICAgICAgICAgICAgICAgICAgICB0b2tlbjogdGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sLFxuICAgICAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLmxleGVyLnl5bGluZW5vLFxuICAgICAgICAgICAgICAgICAgICBsb2M6IHl5bG9jLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvblswXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFjdGlvbi5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIEVycm9yOiBtdWx0aXBsZSBhY3Rpb25zIHBvc3NpYmxlIGF0IHN0YXRlOiAnICsgc3RhdGUgKyAnLCB0b2tlbjogJyArIHN5bWJvbCk7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChhY3Rpb25bMF0pIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgc3RhY2sucHVzaChzeW1ib2wpO1xuICAgICAgICAgICAgdnN0YWNrLnB1c2godGhpcy5sZXhlci55eXRleHQpO1xuICAgICAgICAgICAgbHN0YWNrLnB1c2godGhpcy5sZXhlci55eWxsb2MpO1xuICAgICAgICAgICAgc3RhY2sucHVzaChhY3Rpb25bMV0pO1xuICAgICAgICAgICAgc3ltYm9sID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghcHJlRXJyb3JTeW1ib2wpIHtcbiAgICAgICAgICAgICAgICB5eWxlbmcgPSB0aGlzLmxleGVyLnl5bGVuZztcbiAgICAgICAgICAgICAgICB5eXRleHQgPSB0aGlzLmxleGVyLnl5dGV4dDtcbiAgICAgICAgICAgICAgICB5eWxpbmVubyA9IHRoaXMubGV4ZXIueXlsaW5lbm87XG4gICAgICAgICAgICAgICAgeXlsb2MgPSB0aGlzLmxleGVyLnl5bGxvYztcbiAgICAgICAgICAgICAgICBpZiAocmVjb3ZlcmluZyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb3ZlcmluZy0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3ltYm9sID0gcHJlRXJyb3JTeW1ib2w7XG4gICAgICAgICAgICAgICAgcHJlRXJyb3JTeW1ib2wgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGxlbiA9IHRoaXMucHJvZHVjdGlvbnNfW2FjdGlvblsxXV1bMV07XG4gICAgICAgICAgICB5eXZhbC4kID0gdnN0YWNrW3ZzdGFjay5sZW5ndGggLSBsZW5dO1xuICAgICAgICAgICAgeXl2YWwuXyQgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5maXJzdF9saW5lLFxuICAgICAgICAgICAgICAgIGxhc3RfbGluZTogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2xpbmUsXG4gICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiBsc3RhY2tbbHN0YWNrLmxlbmd0aCAtIChsZW4gfHwgMSldLmZpcnN0X2NvbHVtbixcbiAgICAgICAgICAgICAgICBsYXN0X2NvbHVtbjogbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5sYXN0X2NvbHVtblxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyYW5nZXMpIHtcbiAgICAgICAgICAgICAgICB5eXZhbC5fJC5yYW5nZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAobGVuIHx8IDEpXS5yYW5nZVswXSxcbiAgICAgICAgICAgICAgICAgICAgbHN0YWNrW2xzdGFjay5sZW5ndGggLSAxXS5yYW5nZVsxXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByID0gdGhpcy5wZXJmb3JtQWN0aW9uLmNhbGwoeXl2YWwsIHl5dGV4dCwgeXlsZW5nLCB5eWxpbmVubywgdGhpcy55eSwgYWN0aW9uWzFdLCB2c3RhY2ssIGxzdGFjayk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobGVuKSB7XG4gICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5zbGljZSgwLCAtMSAqIGxlbiAqIDIpO1xuICAgICAgICAgICAgICAgIHZzdGFjayA9IHZzdGFjay5zbGljZSgwLCAtMSAqIGxlbik7XG4gICAgICAgICAgICAgICAgbHN0YWNrID0gbHN0YWNrLnNsaWNlKDAsIC0xICogbGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YWNrLnB1c2godGhpcy5wcm9kdWN0aW9uc19bYWN0aW9uWzFdXVswXSk7XG4gICAgICAgICAgICB2c3RhY2sucHVzaCh5eXZhbC4kKTtcbiAgICAgICAgICAgIGxzdGFjay5wdXNoKHl5dmFsLl8kKTtcbiAgICAgICAgICAgIG5ld1N0YXRlID0gdGFibGVbc3RhY2tbc3RhY2subGVuZ3RoIC0gMl1dW3N0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXTtcbiAgICAgICAgICAgIHN0YWNrLnB1c2gobmV3U3RhdGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufX07XG51bmRlZmluZWQvKiBnZW5lcmF0ZWQgYnkgamlzb24tbGV4IDAuMi4xICovXG52YXIgbGV4ZXIgPSAoZnVuY3Rpb24oKXtcbnZhciBsZXhlciA9IHtcblxuRU9GOjEsXG5cbnBhcnNlRXJyb3I6ZnVuY3Rpb24gcGFyc2VFcnJvcihzdHIsIGhhc2gpIHtcbiAgICAgICAgaWYgKHRoaXMueXkucGFyc2VyKSB7XG4gICAgICAgICAgICB0aGlzLnl5LnBhcnNlci5wYXJzZUVycm9yKHN0ciwgaGFzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioc3RyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIHJlc2V0cyB0aGUgbGV4ZXIsIHNldHMgbmV3IGlucHV0XG5zZXRJbnB1dDpmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcbiAgICAgICAgdGhpcy5fbW9yZSA9IHRoaXMuX2JhY2t0cmFjayA9IHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnl5bGluZW5vID0gdGhpcy55eWxlbmcgPSAwO1xuICAgICAgICB0aGlzLnl5dGV4dCA9IHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjayA9IFsnSU5JVElBTCddO1xuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IDEsXG4gICAgICAgICAgICBmaXJzdF9jb2x1bW46IDAsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IDEsXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogMFxuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbMCwwXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIGNvbnN1bWVzIGFuZCByZXR1cm5zIG9uZSBjaGFyIGZyb20gdGhlIGlucHV0XG5pbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaCA9IHRoaXMuX2lucHV0WzBdO1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBjaDtcbiAgICAgICAgdGhpcy55eWxlbmcrKztcbiAgICAgICAgdGhpcy5vZmZzZXQrKztcbiAgICAgICAgdGhpcy5tYXRjaCArPSBjaDtcbiAgICAgICAgdGhpcy5tYXRjaGVkICs9IGNoO1xuICAgICAgICB2YXIgbGluZXMgPSBjaC5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubysrO1xuICAgICAgICAgICAgdGhpcy55eWxsb2MubGFzdF9saW5lKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbisrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGxvYy5yYW5nZVsxXSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5wdXQgPSB0aGlzLl9pbnB1dC5zbGljZSgxKTtcbiAgICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG5cbi8vIHVuc2hpZnRzIG9uZSBjaGFyIChvciBhIHN0cmluZykgaW50byB0aGUgaW5wdXRcbnVucHV0OmZ1bmN0aW9uIChjaCkge1xuICAgICAgICB2YXIgbGVuID0gY2gubGVuZ3RoO1xuICAgICAgICB2YXIgbGluZXMgPSBjaC5zcGxpdCgvKD86XFxyXFxuP3xcXG4pL2cpO1xuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gY2ggKyB0aGlzLl9pbnB1dDtcbiAgICAgICAgdGhpcy55eXRleHQgPSB0aGlzLnl5dGV4dC5zdWJzdHIoMCwgdGhpcy55eXRleHQubGVuZ3RoIC0gbGVuIC0gMSk7XG4gICAgICAgIC8vdGhpcy55eWxlbmcgLT0gbGVuO1xuICAgICAgICB0aGlzLm9mZnNldCAtPSBsZW47XG4gICAgICAgIHZhciBvbGRMaW5lcyA9IHRoaXMubWF0Y2guc3BsaXQoLyg/Olxcclxcbj98XFxuKS9nKTtcbiAgICAgICAgdGhpcy5tYXRjaCA9IHRoaXMubWF0Y2guc3Vic3RyKDAsIHRoaXMubWF0Y2gubGVuZ3RoIC0gMSk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCA9IHRoaXMubWF0Y2hlZC5zdWJzdHIoMCwgdGhpcy5tYXRjaGVkLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICB0aGlzLnl5bGluZW5vIC09IGxpbmVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHIgPSB0aGlzLnl5bGxvYy5yYW5nZTtcblxuICAgICAgICB0aGlzLnl5bGxvYyA9IHtcbiAgICAgICAgICAgIGZpcnN0X2xpbmU6IHRoaXMueXlsbG9jLmZpcnN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICBsYXN0X2NvbHVtbjogbGluZXMgP1xuICAgICAgICAgICAgICAgIChsaW5lcy5sZW5ndGggPT09IG9sZExpbmVzLmxlbmd0aCA/IHRoaXMueXlsbG9jLmZpcnN0X2NvbHVtbiA6IDApXG4gICAgICAgICAgICAgICAgICsgb2xkTGluZXNbb2xkTGluZXMubGVuZ3RoIC0gbGluZXMubGVuZ3RoXS5sZW5ndGggLSBsaW5lc1swXS5sZW5ndGggOlxuICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4gLSBsZW5cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbclswXSwgclswXSArIHRoaXMueXlsZW5nIC0gbGVuXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnl5bGVuZyA9IHRoaXMueXl0ZXh0Lmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIGNhY2hlcyBtYXRjaGVkIHRleHQgYW5kIGFwcGVuZHMgaXQgb24gbmV4dCBhY3Rpb25cbm1vcmU6ZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb3JlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuLy8gV2hlbiBjYWxsZWQgZnJvbSBhY3Rpb24sIHNpZ25hbHMgdGhlIGxleGVyIHRoYXQgdGhpcyBydWxlIGZhaWxzIHRvIG1hdGNoIHRoZSBpbnB1dCwgc28gdGhlIG5leHQgbWF0Y2hpbmcgcnVsZSAocmVnZXgpIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbnJlamVjdDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrdHJhY2sgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFcnJvcignTGV4aWNhbCBlcnJvciBvbiBsaW5lICcgKyAodGhpcy55eWxpbmVubyArIDEpICsgJy4gWW91IGNhbiBvbmx5IGludm9rZSByZWplY3QoKSBpbiB0aGUgbGV4ZXIgd2hlbiB0aGUgbGV4ZXIgaXMgb2YgdGhlIGJhY2t0cmFja2luZyBwZXJzdWFzaW9uIChvcHRpb25zLmJhY2t0cmFja19sZXhlciA9IHRydWUpLlxcbicgKyB0aGlzLnNob3dQb3NpdGlvbigpLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgICB0b2tlbjogbnVsbCxcbiAgICAgICAgICAgICAgICBsaW5lOiB0aGlzLnl5bGluZW5vXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbi8vIHJldGFpbiBmaXJzdCBuIGNoYXJhY3RlcnMgb2YgdGhlIG1hdGNoXG5sZXNzOmZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHRoaXMudW5wdXQodGhpcy5tYXRjaC5zbGljZShuKSk7XG4gICAgfSxcblxuLy8gZGlzcGxheXMgYWxyZWFkeSBtYXRjaGVkIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xucGFzdElucHV0OmZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhc3QgPSB0aGlzLm1hdGNoZWQuc3Vic3RyKDAsIHRoaXMubWF0Y2hlZC5sZW5ndGggLSB0aGlzLm1hdGNoLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiAocGFzdC5sZW5ndGggPiAyMCA/ICcuLi4nOicnKSArIHBhc3Quc3Vic3RyKC0yMCkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHVwY29taW5nIGlucHV0LCBpLmUuIGZvciBlcnJvciBtZXNzYWdlc1xudXBjb21pbmdJbnB1dDpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuZXh0ID0gdGhpcy5tYXRjaDtcbiAgICAgICAgaWYgKG5leHQubGVuZ3RoIDwgMjApIHtcbiAgICAgICAgICAgIG5leHQgKz0gdGhpcy5faW5wdXQuc3Vic3RyKDAsIDIwLW5leHQubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG5leHQuc3Vic3RyKDAsMjApICsgKG5leHQubGVuZ3RoID4gMjAgPyAnLi4uJyA6ICcnKSkucmVwbGFjZSgvXFxuL2csIFwiXCIpO1xuICAgIH0sXG5cbi8vIGRpc3BsYXlzIHRoZSBjaGFyYWN0ZXIgcG9zaXRpb24gd2hlcmUgdGhlIGxleGluZyBlcnJvciBvY2N1cnJlZCwgaS5lLiBmb3IgZXJyb3IgbWVzc2FnZXNcbnNob3dQb3NpdGlvbjpmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcmUgPSB0aGlzLnBhc3RJbnB1dCgpO1xuICAgICAgICB2YXIgYyA9IG5ldyBBcnJheShwcmUubGVuZ3RoICsgMSkuam9pbihcIi1cIik7XG4gICAgICAgIHJldHVybiBwcmUgKyB0aGlzLnVwY29taW5nSW5wdXQoKSArIFwiXFxuXCIgKyBjICsgXCJeXCI7XG4gICAgfSxcblxuLy8gdGVzdCB0aGUgbGV4ZWQgdG9rZW46IHJldHVybiBGQUxTRSB3aGVuIG5vdCBhIG1hdGNoLCBvdGhlcndpc2UgcmV0dXJuIHRva2VuXG50ZXN0X21hdGNoOmZ1bmN0aW9uIChtYXRjaCwgaW5kZXhlZF9ydWxlKSB7XG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIGxpbmVzLFxuICAgICAgICAgICAgYmFja3VwO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAvLyBzYXZlIGNvbnRleHRcbiAgICAgICAgICAgIGJhY2t1cCA9IHtcbiAgICAgICAgICAgICAgICB5eWxpbmVubzogdGhpcy55eWxpbmVubyxcbiAgICAgICAgICAgICAgICB5eWxsb2M6IHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfbGluZTogdGhpcy55eWxsb2MuZmlyc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9saW5lOiB0aGlzLmxhc3RfbGluZSxcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5maXJzdF9jb2x1bW4sXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgeXl0ZXh0OiB0aGlzLnl5dGV4dCxcbiAgICAgICAgICAgICAgICBtYXRjaDogdGhpcy5tYXRjaCxcbiAgICAgICAgICAgICAgICBtYXRjaGVzOiB0aGlzLm1hdGNoZXMsXG4gICAgICAgICAgICAgICAgbWF0Y2hlZDogdGhpcy5tYXRjaGVkLFxuICAgICAgICAgICAgICAgIHl5bGVuZzogdGhpcy55eWxlbmcsXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiB0aGlzLm9mZnNldCxcbiAgICAgICAgICAgICAgICBfbW9yZTogdGhpcy5fbW9yZSxcbiAgICAgICAgICAgICAgICBfaW5wdXQ6IHRoaXMuX2lucHV0LFxuICAgICAgICAgICAgICAgIHl5OiB0aGlzLnl5LFxuICAgICAgICAgICAgICAgIGNvbmRpdGlvblN0YWNrOiB0aGlzLmNvbmRpdGlvblN0YWNrLnNsaWNlKDApLFxuICAgICAgICAgICAgICAgIGRvbmU6IHRoaXMuZG9uZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgYmFja3VwLnl5bGxvYy5yYW5nZSA9IHRoaXMueXlsbG9jLnJhbmdlLnNsaWNlKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGluZXMgPSBtYXRjaFswXS5tYXRjaCgvKD86XFxyXFxuP3xcXG4pLiovZyk7XG4gICAgICAgIGlmIChsaW5lcykge1xuICAgICAgICAgICAgdGhpcy55eWxpbmVubyArPSBsaW5lcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy55eWxsb2MgPSB7XG4gICAgICAgICAgICBmaXJzdF9saW5lOiB0aGlzLnl5bGxvYy5sYXN0X2xpbmUsXG4gICAgICAgICAgICBsYXN0X2xpbmU6IHRoaXMueXlsaW5lbm8gKyAxLFxuICAgICAgICAgICAgZmlyc3RfY29sdW1uOiB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbixcbiAgICAgICAgICAgIGxhc3RfY29sdW1uOiBsaW5lcyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoIC0gbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ubWF0Y2goL1xccj9cXG4/LylbMF0ubGVuZ3RoIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnl5bGxvYy5sYXN0X2NvbHVtbiArIG1hdGNoWzBdLmxlbmd0aFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnl5dGV4dCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaCArPSBtYXRjaFswXTtcbiAgICAgICAgdGhpcy5tYXRjaGVzID0gbWF0Y2g7XG4gICAgICAgIHRoaXMueXlsZW5nID0gdGhpcy55eXRleHQubGVuZ3RoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJhbmdlcykge1xuICAgICAgICAgICAgdGhpcy55eWxsb2MucmFuZ2UgPSBbdGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICs9IHRoaXMueXlsZW5nXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tb3JlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2JhY2t0cmFjayA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IHRoaXMuX2lucHV0LnNsaWNlKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICAgIHRoaXMubWF0Y2hlZCArPSBtYXRjaFswXTtcbiAgICAgICAgdG9rZW4gPSB0aGlzLnBlcmZvcm1BY3Rpb24uY2FsbCh0aGlzLCB0aGlzLnl5LCB0aGlzLCBpbmRleGVkX3J1bGUsIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSk7XG4gICAgICAgIGlmICh0aGlzLmRvbmUgJiYgdGhpcy5faW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JhY2t0cmFjaykge1xuICAgICAgICAgICAgLy8gcmVjb3ZlciBjb250ZXh0XG4gICAgICAgICAgICBmb3IgKHZhciBrIGluIGJhY2t1cCkge1xuICAgICAgICAgICAgICAgIHRoaXNba10gPSBiYWNrdXBba107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyB0aGUgbmV4dCBydWxlIHNob3VsZCBiZSB0ZXN0ZWQgaW5zdGVhZC5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuLy8gcmV0dXJuIG5leHQgbWF0Y2ggaW4gaW5wdXRcbm5leHQ6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b2tlbixcbiAgICAgICAgICAgIG1hdGNoLFxuICAgICAgICAgICAgdGVtcE1hdGNoLFxuICAgICAgICAgICAgaW5kZXg7XG4gICAgICAgIGlmICghdGhpcy5fbW9yZSkge1xuICAgICAgICAgICAgdGhpcy55eXRleHQgPSAnJztcbiAgICAgICAgICAgIHRoaXMubWF0Y2ggPSAnJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgcnVsZXMgPSB0aGlzLl9jdXJyZW50UnVsZXMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGVtcE1hdGNoID0gdGhpcy5faW5wdXQubWF0Y2godGhpcy5ydWxlc1tydWxlc1tpXV0pO1xuICAgICAgICAgICAgaWYgKHRlbXBNYXRjaCAmJiAoIW1hdGNoIHx8IHRlbXBNYXRjaFswXS5sZW5ndGggPiBtYXRjaFswXS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZW1wTWF0Y2g7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYmFja3RyYWNrX2xleGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy50ZXN0X21hdGNoKHRlbXBNYXRjaCwgcnVsZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW4gIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYmFja3RyYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7IC8vIHJ1bGUgYWN0aW9uIGNhbGxlZCByZWplY3QoKSBpbXBseWluZyBhIHJ1bGUgTUlTbWF0Y2guXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMuZmxleCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMudGVzdF9tYXRjaChtYXRjaCwgcnVsZXNbaW5kZXhdKTtcbiAgICAgICAgICAgIGlmICh0b2tlbiAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlbHNlOiB0aGlzIGlzIGEgbGV4ZXIgcnVsZSB3aGljaCBjb25zdW1lcyBpbnB1dCB3aXRob3V0IHByb2R1Y2luZyBhIHRva2VuIChlLmcuIHdoaXRlc3BhY2UpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2lucHV0ID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5FT0Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVycm9yKCdMZXhpY2FsIGVycm9yIG9uIGxpbmUgJyArICh0aGlzLnl5bGluZW5vICsgMSkgKyAnLiBVbnJlY29nbml6ZWQgdGV4dC5cXG4nICsgdGhpcy5zaG93UG9zaXRpb24oKSwge1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgdG9rZW46IG51bGwsXG4gICAgICAgICAgICAgICAgbGluZTogdGhpcy55eWxpbmVub1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gbmV4dCBtYXRjaCB0aGF0IGhhcyBhIHRva2VuXG5sZXg6ZnVuY3Rpb24gbGV4KCkge1xuICAgICAgICB2YXIgciA9IHRoaXMubmV4dCgpO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFjdGl2YXRlcyBhIG5ldyBsZXhlciBjb25kaXRpb24gc3RhdGUgKHB1c2hlcyB0aGUgbmV3IGxleGVyIGNvbmRpdGlvbiBzdGF0ZSBvbnRvIHRoZSBjb25kaXRpb24gc3RhY2spXG5iZWdpbjpmdW5jdGlvbiBiZWdpbihjb25kaXRpb24pIHtcbiAgICAgICAgdGhpcy5jb25kaXRpb25TdGFjay5wdXNoKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcG9wIHRoZSBwcmV2aW91c2x5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGUgb2ZmIHRoZSBjb25kaXRpb24gc3RhY2tcbnBvcFN0YXRlOmZ1bmN0aW9uIHBvcFN0YXRlKCkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMTtcbiAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5wb3AoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmRpdGlvblN0YWNrWzBdO1xuICAgICAgICB9XG4gICAgfSxcblxuLy8gcHJvZHVjZSB0aGUgbGV4ZXIgcnVsZSBzZXQgd2hpY2ggaXMgYWN0aXZlIGZvciB0aGUgY3VycmVudGx5IGFjdGl2ZSBsZXhlciBjb25kaXRpb24gc3RhdGVcbl9jdXJyZW50UnVsZXM6ZnVuY3Rpb24gX2N1cnJlbnRSdWxlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoICYmIHRoaXMuY29uZGl0aW9uU3RhY2tbdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1t0aGlzLmNvbmRpdGlvblN0YWNrW3RoaXMuY29uZGl0aW9uU3RhY2subGVuZ3RoIC0gMV1dLnJ1bGVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZGl0aW9uc1tcIklOSVRJQUxcIl0ucnVsZXM7XG4gICAgICAgIH1cbiAgICB9LFxuXG4vLyByZXR1cm4gdGhlIGN1cnJlbnRseSBhY3RpdmUgbGV4ZXIgY29uZGl0aW9uIHN0YXRlOyB3aGVuIGFuIGluZGV4IGFyZ3VtZW50IGlzIHByb3ZpZGVkIGl0IHByb2R1Y2VzIHRoZSBOLXRoIHByZXZpb3VzIGNvbmRpdGlvbiBzdGF0ZSwgaWYgYXZhaWxhYmxlXG50b3BTdGF0ZTpmdW5jdGlvbiB0b3BTdGF0ZShuKSB7XG4gICAgICAgIG4gPSB0aGlzLmNvbmRpdGlvblN0YWNrLmxlbmd0aCAtIDEgLSBNYXRoLmFicyhuIHx8IDApO1xuICAgICAgICBpZiAobiA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFja1tuXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIklOSVRJQUxcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbi8vIGFsaWFzIGZvciBiZWdpbihjb25kaXRpb24pXG5wdXNoU3RhdGU6ZnVuY3Rpb24gcHVzaFN0YXRlKGNvbmRpdGlvbikge1xuICAgICAgICB0aGlzLmJlZ2luKGNvbmRpdGlvbik7XG4gICAgfSxcblxuLy8gcmV0dXJuIHRoZSBudW1iZXIgb2Ygc3RhdGVzIGN1cnJlbnRseSBvbiB0aGUgc3RhY2tcbnN0YXRlU3RhY2tTaXplOmZ1bmN0aW9uIHN0YXRlU3RhY2tTaXplKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25kaXRpb25TdGFjay5sZW5ndGg7XG4gICAgfSxcbm9wdGlvbnM6IHt9LFxucGVyZm9ybUFjdGlvbjogZnVuY3Rpb24gYW5vbnltb3VzKHl5LHl5XywkYXZvaWRpbmdfbmFtZV9jb2xsaXNpb25zLFlZX1NUQVJUKSB7XG5cbnZhciBZWVNUQVRFPVlZX1NUQVJUO1xuc3dpdGNoKCRhdm9pZGluZ19uYW1lX2NvbGxpc2lvbnMpIHtcbmNhc2UgMDovKiBza2lwIHdoaXRlc3BhY2UgKi9cbmJyZWFrO1xuY2FzZSAxOnJldHVybiAnVEVYVCdcbmJyZWFrO1xuY2FzZSAyOnJldHVybiAxN1xuYnJlYWs7XG5jYXNlIDM6cmV0dXJuIDE4XG5icmVhaztcbmNhc2UgNDpyZXR1cm4gMjhcbmJyZWFrO1xuY2FzZSA1OnJldHVybiAyN1xuYnJlYWs7XG5jYXNlIDY6cmV0dXJuIDIxXG5icmVhaztcbmNhc2UgNzpyZXR1cm4gMTBcbmJyZWFrO1xuY2FzZSA4OnJldHVybiAxM1xuYnJlYWs7XG5jYXNlIDk6cmV0dXJuICdORSdcbmJyZWFrO1xuY2FzZSAxMDpyZXR1cm4gMzRcbmJyZWFrO1xuY2FzZSAxMTpyZXR1cm4gMzNcbmJyZWFrO1xuY2FzZSAxMjpyZXR1cm4gMzVcbmJyZWFrO1xuY2FzZSAxMzpyZXR1cm4gMzZcbmJyZWFrO1xuY2FzZSAxNDpyZXR1cm4gOFxuYnJlYWs7XG5jYXNlIDE1OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDE2OnJldHVybiAyMVxuYnJlYWs7XG5jYXNlIDE3OnJldHVybiAyMlxuYnJlYWs7XG5jYXNlIDE4OnJldHVybiAyMFxuYnJlYWs7XG5jYXNlIDE5OnJldHVybiAxOVxuYnJlYWs7XG5jYXNlIDIwOnJldHVybiAxMFxuYnJlYWs7XG5jYXNlIDIxOnJldHVybiAxM1xuYnJlYWs7XG5jYXNlIDIyOnJldHVybiAxMVxuYnJlYWs7XG5jYXNlIDIzOnJldHVybiAxMlxuYnJlYWs7XG5jYXNlIDI0OnJldHVybiA5XG5icmVhaztcbmNhc2UgMjU6cmV0dXJuICcmJidcbmJyZWFrO1xuY2FzZSAyNjpyZXR1cm4gMjZcbmJyZWFrO1xuY2FzZSAyNzpyZXR1cm4gMzBcbmJyZWFrO1xuY2FzZSAyODpyZXR1cm4gMjVcbmJyZWFrO1xuY2FzZSAyOTpyZXR1cm4gMjNcbmJyZWFrO1xuY2FzZSAzMDpyZXR1cm4gJyEnXG5icmVhaztcbmNhc2UgMzE6cmV0dXJuICclJ1xuYnJlYWs7XG5jYXNlIDMyOnJldHVybiAxNVxuYnJlYWs7XG5jYXNlIDMzOnJldHVybiAnPydcbmJyZWFrO1xuY2FzZSAzNDpyZXR1cm4gJzonXG5icmVhaztcbmNhc2UgMzU6cmV0dXJuIDE3XG5icmVhaztcbmNhc2UgMzY6cmV0dXJuIDE4XG5icmVhaztcbmNhc2UgMzc6cmV0dXJuIDI5XG5icmVhaztcbmNhc2UgMzg6cmV0dXJuIDI0XG5icmVhaztcbmNhc2UgMzk6cmV0dXJuICdbJ1xuYnJlYWs7XG5jYXNlIDQwOnJldHVybiAnXSdcbmJyZWFrO1xuY2FzZSA0MTpyZXR1cm4gNVxuYnJlYWs7XG59XG59LFxucnVsZXM6IFsvXig/OlxccyspLywvXig/OlxcJFteXFwkXSpcXCQpLywvXig/OlxcXFxsZWZ0XFwoKS8sL14oPzpcXFxccmlnaHRcXCkpLywvXig/OlxcXFxmcmFjXFx7KS8sL14oPzpcXFxcc3FydFxceykvLC9eKD86XFxcXGNkb3RcXGIpLywvXig/OlxcXFxsW2VdKS8sL14oPzpcXFxcZ1tlXSkvLC9eKD86XFxcXG5bZV0pLywvXig/OlxcXFxbYS16QS1aXSspLywvXig/OlthLXpBLVpdKS8sL14oPzpbMC05XStcXC5bMC05XSopLywvXig/OlswLTldKykvLC9eKD86PSkvLC9eKD86XFwqKS8sL14oPzpcXC4pLywvXig/OlxcLykvLC9eKD86LSkvLC9eKD86XFwrKS8sL14oPzo8PSkvLC9eKD86Pj0pLywvXig/OjwpLywvXig/Oj4pLywvXig/OiE9KS8sL14oPzomJikvLC9eKD86X1teXFwoXFx7XSkvLC9eKD86XFxeW15cXChcXHtdKS8sL14oPzpfXFx7KS8sL14oPzpcXF5cXHspLywvXig/OiEpLywvXig/OiUpLywvXig/OiwpLywvXig/OlxcPykvLC9eKD86OikvLC9eKD86XFwoKS8sL14oPzpcXCkpLywvXig/OlxceykvLC9eKD86XFx9KS8sL14oPzpcXFspLywvXig/OlxcXSkvLC9eKD86JCkvXSxcbmNvbmRpdGlvbnM6IHtcIklOSVRJQUxcIjp7XCJydWxlc1wiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwLDMxLDMyLDMzLDM0LDM1LDM2LDM3LDM4LDM5LDQwLDQxXSxcImluY2x1c2l2ZVwiOnRydWV9fVxufTtcbnJldHVybiBsZXhlcjtcbn0pKCk7XG5wYXJzZXIubGV4ZXIgPSBsZXhlcjtcbmZ1bmN0aW9uIFBhcnNlciAoKSB7XG4gIHRoaXMueXkgPSB7fTtcbn1cblBhcnNlci5wcm90b3R5cGUgPSBwYXJzZXI7cGFyc2VyLlBhcnNlciA9IFBhcnNlcjtcbnJldHVybiBuZXcgUGFyc2VyO1xufSkoKTtcblxuXG5pZiAodHlwZW9mIHJlcXVpcmUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuZXhwb3J0cy5wYXJzZXIgPSBwYXJzZXI7XG5leHBvcnRzLlBhcnNlciA9IHBhcnNlci5QYXJzZXI7XG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyc2VyLnBhcnNlLmFwcGx5KHBhcnNlciwgYXJndW1lbnRzKTsgfTtcbmV4cG9ydHMubWFpbiA9IGZ1bmN0aW9uIGNvbW1vbmpzTWFpbihhcmdzKSB7XG4gICAgaWYgKCFhcmdzWzFdKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVc2FnZTogJythcmdzWzBdKycgRklMRScpO1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICAgIHZhciBzb3VyY2UgPSByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYyhyZXF1aXJlKCdwYXRoJykubm9ybWFsaXplKGFyZ3NbMV0pLCBcInV0ZjhcIik7XG4gICAgcmV0dXJuIGV4cG9ydHMucGFyc2VyLnBhcnNlKHNvdXJjZSk7XG59O1xuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGV4cG9ydHMubWFpbihwcm9jZXNzLmFyZ3Yuc2xpY2UoMSkpO1xufVxufVxufSkocmVxdWlyZShcIl9fYnJvd3NlcmlmeV9wcm9jZXNzXCIpKSIsIihmdW5jdGlvbigpe3ZhciBMYW5ndWFnZSA9IHJlcXVpcmUoJy4vJyk7XG5cbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vRXhwcmVzc2lvbicpLFxuICAgIEdsb2JhbCAgICAgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxudmFyIGNyb3NzUHJvZHVjdCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMjE1KTsgLy8gJnRpbWVzOyBjaGFyYWN0ZXJcblxuLy8gQnVpbHQgYnkgSmlzb246XG52YXIgcGFyc2VyID0gcmVxdWlyZSgnLi4vLi4vZ3JhbW1hci9wYXJzZXIuanMnKTtcblxucGFyc2VyLnBhcnNlRXJyb3IgPSBmdW5jdGlvbiAoc3RyLCBoYXNoKSB7XG4gICAgLy8ge1xuICAgIC8vICAgICB0ZXh0OiB0aGlzLmxleGVyLm1hdGNoLFxuICAgIC8vICAgICB0b2tlbjogdGhpcy50ZXJtaW5hbHNfW3N5bWJvbF0gfHwgc3ltYm9sLFxuICAgIC8vICAgICBsaW5lOiB0aGlzLmxleGVyLnl5bGluZW5vLFxuICAgIC8vICAgICBsb2M6IHl5bG9jLFxuICAgIC8vICAgICBleHBlY3RlZDpcbiAgICAvLyAgICAgZXhwZWN0ZWRcbiAgICAvLyB9XG4gICAgdmFyIGVyID0gbmV3IFN5bnRheEVycm9yKHN0cik7XG4gICAgZXIubGluZSA9IGhhc2gubGluZTtcbiAgICB0aHJvdyBlcjtcbn07XG5cblxudmFyIGxlZnQgPSAnbGVmdCcsIHJpZ2h0ID0gJ3JpZ2h0JztcbnZhciBMID0gbGVmdDtcbnZhciBSID0gcmlnaHQ7XG5cblxuXG52YXIgbGFuZ3VhZ2UgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBMYW5ndWFnZShwYXJzZXIsIHtcbiAgICAgICAgTnVtYmVyOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICBpZiAoc3RyID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RyID09PSAnMCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHN0cikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcihOdW1iZXIoc3RyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoL15bXFxkXSpcXC5bXFxkXSskLy50ZXN0KHN0cikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVjaW1hbFBsYWNlID0gc3RyLmluZGV4T2YoJy4nKTtcbiAgICAgICAgICAgICAgICAvLyAxMi4zNDUgLT4gMTIzNDUgLyAxMDAwXG4gICAgICAgICAgICAgICAgLy8gMDAuNSAtPiA1LzEwXG4gICAgICAgICAgICAgICAgdmFyIGRlbm9tX3AgPSBzdHIubGVuZ3RoIC0gZGVjaW1hbFBsYWNlIC0gMTtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IE1hdGgucG93KDEwLCBkZW5vbV9wKTtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IE51bWJlcihzdHIucmVwbGFjZSgnLicsICcnKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLlJhdGlvbmFsKG4sIGQpLnJlZHVjZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTnVtYmVyKHN0cikpO1xuICAgICAgICB9LFxuICAgICAgICBTdHJpbmc6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH0sXG4gICAgICAgIFNpbmdsZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgLy8gU2luZ2xlIGxhdGV4IGNoYXJzIGZvciB4XjMsIHheeSBldGMgKE5PVCB4XnthYmN9KVxuICAgICAgICAgICAgaWYgKCFpc05hTihzdHIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIoTnVtYmVyKHN0cikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwoc3RyKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgW1xuICAgIFsnOyddLCAgICAgICAgICAvKkwgLyBSIG1ha2VzIG5vIGRpZmZlcmVuY2U/Pz8hPz8hPyAqL1xuICAgIFsnLCddLFxuICAgIFtbJz0nLCAnKz0nLCAnLT0nLCAnKj0nLCAnLz0nLCAnJT0nLCAnJj0nLCAnXj0nLCAnfD0nXSxSXSxcbiAgICBbWyc/JywnOiddLFIsMl0sXG4gICAgW1sn4oioJ11dLFxuICAgIFtbJyYmJ11dLFxuICAgIFtbJ3wnXV0sXG4gICAgW1snPz8/Pz8/J11dLC8vWE9SXG4gICAgW1snJiddXSxcbiAgICBbWyc9PScsICfiiaAnLCAnIT09JywgJz09PSddXSxcbiAgICBbWyc8JywgJzw9JywgJz4nLCAnPj0nXSxMXSxcbiAgICBbWyc+PicsICc8PCddXSxcbiAgICBbJ8KxJywgUiwgMl0sXG4gICAgW1snKyddLCB0cnVlXSxcbiAgICBbWyctJ10sIExdLFxuICAgIFtbJ+KIqycsICfiiJEnXSwgUiwgMV0sXG4gICAgW1snKicsICclJ10sIFJdLFxuICAgIFtjcm9zc1Byb2R1Y3QsIFJdLFxuICAgIFtbJ0ArJywgJ0AtJywgJ0DCsSddLCBSLCAxXSwgLy91bmFyeSBwbHVzL21pbnVzXG4gICAgW1snwqwnXSwgTCwgMV0sXG4gICAgWydkZWZhdWx0JywgUiwgMl0sIC8vSSBjaGFuZ2VkIHRoaXMgdG8gUiBmb3IgNXNpbih0KVxuICAgIFsn4oiYJywgUiwgMl0sXG4gICAgW1snLyddXSxcbiAgICBbWydeJ11dLC8vZSoqeFxuICAgIFsnIScsIEwsIDFdLFxuICAgIFtbJ34nXSwgUiwgMV0sIC8vYml0d2lzZSBuZWdhdGlvblxuICAgIFtbJysrJywgJysrJywgJy4nLCAnLT4nXSxMLDFdLFxuICAgIFtbJzo6J11dLFxuICAgIFtbJ18nXSwgTCwgMl0sXG4gICAgWyd2YXInLCBSLCAxXSxcbiAgICBbJ2JyZWFrJywgUiwgMF0sXG4gICAgWyd0aHJvdycsIFIsIDFdLFxuICAgIFsnXFwnJywgTCwgMV0sXG4gICAgWydcXHUyMjFBJywgUiwgMV0sIC8vIFNxcnRcbiAgICBbJyMnLCBSLCAxXSAvKmFub255bW91cyBmdW5jdGlvbiovXG5dKTtcblxuLypcbiBMYW5ndWFnZSBzcGVjIGNvbHVtbnMgaW4gb3JkZXIgb2YgX2luY3JlYXNpbmcgcHJlY2VkZW5jZV86XG4gKiBvcGVyYXRvciBzdHJpbmcgcmVwcmVzZW50YXRpb24ocykuIFRoZXNlIGFyZSBkaWZmZXJlbnQgb3BlcmF0b3JzLCBidXQgc2hhcmUgYWxsIHByb3BlcnRpZXMuXG4gKiBBc3NvY2lhdGl2aXR5XG4gKiBPcGVyYW5kIGNvdW50IChNdXN0IGJlIGEgZml4ZWQgbnVtYmVyKSBcbiAqIChUT0RPPz8pIGNvbW11dGUgZ3JvdXA/IC0gb3Igc2hvdWxkIHRoaXMgYmUgZGVyaXZlZD9cbiAqIChUT0RPPykgYXNzb2NpYXRpdmU/IGNvbW11dGF0aXZlPyAgLSBTaG91bGQgYmUgY2FsY3VsYXRlZD9cbiAqIChUT0RPPykgSWRlbnRpdHk/XG4qL1xuXG4vLyB2YXIgbWF0aGVtYXRpY2EgPSBuZXcgTGFuZ3VhZ2UoW1xuLy8gICAgIFsnOyddLFxuLy8gICAgIFsnLCddLFxuLy8gICAgIFtbJz0nLCAnKz0nXV1cbi8vIF0pO1xuXG59KSgpIiwidmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIExhbmd1YWdlKHBhcnNlciwgQ29uc3RydWN0LCBsYW5ndWFnZSkge1xuICAgIHRoaXMuY2ZnID0gcGFyc2VyO1xuICAgIHRoaXMuQ29uc3RydWN0ID0gQ29uc3RydWN0O1xuICAgIHZhciBvcGVyYXRvcnMgPSB0aGlzLm9wZXJhdG9ycyA9IHt9LFxuICAgICAgICBvcFByZWNlZGVuY2UgPSAwO1xuICAgIGZ1bmN0aW9uIG9wKHYsIGFzc29jaWF0aXZpdHksIGFyaXR5KSB7XG5cbiAgICB9XG4gICAgbGFuZ3VhZ2UuZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICBmdW5jdGlvbiBkZWZvcChzdHIsIG8pIHtcbiAgICAgICAgICAgIHZhciBhc3NvY2lhdGl2aXR5ID0gb1sxXSB8fCAnbGVmdCc7XG4gICAgICAgICAgICB2YXIgYXJpdHkgPSAob1syXSA9PT0gdW5kZWZpbmVkKSA/IDIgOiBvWzJdO1xuXG4gICAgICAgICAgICBvcGVyYXRvcnNbc3RyXSA9ICB7XG4gICAgICAgICAgICAgICAgYXNzb2NpYXRpdml0eTogYXNzb2NpYXRpdml0eSxcbiAgICAgICAgICAgICAgICBwcmVjZWRlbmNlOiBvcFByZWNlZGVuY2UrKyxcbiAgICAgICAgICAgICAgICBhcml0eTogYXJpdHlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0ciA9IG9bMF07XG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGVmb3Aoc3RyLCBvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0ci5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICAgICAgZGVmb3Aocywgbyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5MYW5ndWFnZS5Db2RlID0gcmVxdWlyZSgnLi9Db2RlJyk7XG5cbnZhciBfICAgICAgICA9IExhbmd1YWdlLnByb3RvdHlwZTtcblxuXy5wYXJzZSAgICAgID0gcmVxdWlyZSgnLi9wYXJzZScpO1xuXy5zdHJpbmdpZnkgID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcblxuXy5wb3N0Zml4ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBvcGVyYXRvciA9IHRoaXMub3BlcmF0b3JzW3N0cl07XG4gICAgcmV0dXJuICBvcGVyYXRvci5hc3NvY2lhdGl2aXR5ID09PSAwICYmIFxuICAgICAgICAgICAgb3BlcmF0b3IuYXJpdHkgPT09IDE7XG59O1xuXG5fLnVuYXJ5ID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciB1bmFyeV9zZWNvbmRhcnlzID0gWycrJywgJy0nLCAnwrEnXTtcbiAgICByZXR1cm4gKHVuYXJ5X3NlY29uZGFyeXMuaW5kZXhPZihvKSAhPT0gLTEpID8gKCdAJyArIG8pIDogZmFsc2U7XG59O1xuXG5fLmFzc29jaWF0aXZlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHRocm93IG5ldyBFcnJvcignYXNzb2NpYXRpdmU/Pz8/Jyk7XG4gICAgLy8gcmV0dXJuIHRoaXMub3BlcmF0b3JzW3N0cl0uYXNzb2NpYXRpdml0eSA9PT0gdHJ1ZTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IExhbmd1YWdlO1xuIiwiKGZ1bmN0aW9uKCl7dmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzLmF0dGFjaCA9IGZ1bmN0aW9uIChnbG9iYWwpIHtcblxuXG4gICAgZnVuY3Rpb24gRGVyaXZhdGl2ZSh3cnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHguZGlmZmVyZW50aWF0ZSh3cnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBcbiAgICB2YXIgQ2FydFNpbmUgPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5SZWFsXG4gICAgICAgICAgICAgICAgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE0uRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW2dsb2JhbC5zaW4uZGVmYXVsdCh4KSwgZ2xvYmFsLlplcm9dKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cobmV3IEVycm9yKCdDb21wbGV4IFNpbmUgQ2FydGVzaWFuIGZvcm0gbm90IGltcGxlbWVudGVkIHlldC4nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsb2JhbFsnc2luJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnNpbih4LnZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zaW4sIHhdKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luKGErYmkpID0gc2luKGEpY29zaChiKSArIGkgY29zKGEpc2luaChiKVxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwX2IgPSBNYXRoLmV4cCh4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvc2hfYiA9IChleHBfYiArIDEgLyBleHBfYikgLyAyO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2luaF9iID0gKGV4cF9iIC0gMSAvIGV4cF9iKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4TnVtZXJpY2FsKE1hdGguc2luKHguX3JlYWwpICogY29zaF9iLCBNYXRoLmNvcyh4Ll9yZWFsKSAqIHNpbmhfYik7XG4gICAgICAgICAgICAqL1xuICAgICAgICB9LFxuICAgICAgICByZWFsaW1hZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIENhcnRTaW5lO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc2luJyxcbiAgICAgICAgJ3RleHQvamF2YXNjcmlwdCc6ICdNYXRoLnNpbicsXG4gICAgICAgICd4LXNoYWRlci94LWZyYWdtZW50JzogJ3NpbicsXG4gICAgICAgIHRpdGxlOiAnU2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVHJpZ29ub21ldHJpY19mdW5jdGlvbnMjU2luZS4yQ19jb3NpbmUuMkNfYW5kX3RhbmdlbnQnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcc2luIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnY29zJywgJ3RhbiddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydjb3MnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguY29zKHgudmFsdWUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmNvcywgeF0pO1xuICAgICAgICAgICAgXG4gICAgICAgIH0sXG4gICAgICAgIGRlcml2YXRpdmU6IGdsb2JhbC5zaW5bJ0AtJ10oKSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGNvcycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5jb3MnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdjb3MnLFxuICAgICAgICB0aXRsZTogJ0Nvc2luZSBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ29zaW5lIEZ1bmN0aW9uIGRlc2MnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcY29zIChcXFxccGkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnc2luJywgJ3RhbiddXG4gICAgfSk7XG5cbiAgICBnbG9iYWwuc2luLmRlcml2YXRpdmUgPSBnbG9iYWwuY29zO1xuXG4gICAgZ2xvYmFsWyd0YW4nXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgc3ltYm9saWM6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZ2xvYmFsWydsb2cnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgsIGFzc3VtcHRpb25zKSB7XG5cbiAgICAgICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgeC5hID09PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgeC5hID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbC5JbmZpbml0eVsnQC0nXSgpO1xuICAgICAgICAgICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHgudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYodiA+IDApe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLmxvZyh2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihhc3N1bXB0aW9ucyAmJiBhc3N1bXB0aW9ucy5wb3NpdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmxvZywgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwubG9nLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWxpbWFnOiBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgcmV0dXJuIENhcnRMb2c7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxsb2cnLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGgubG9nJyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnbG9nJyxcbiAgICAgICAgdGl0bGU6ICdOYXR1cmFsIExvZ2FyaXRobScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQmFzZSBlLiBTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9OYXR1cmFsX2xvZ2FyaXRobScsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxsb2cgKHllXigyeCkpJ10sXG4gICAgICAgIHJlbGF0ZWQ6IFsnZXhwJywgJ0xvZyddXG4gICAgfSk7XG4gICAgdmFyIEhhbGYgPSBuZXcgRXhwcmVzc2lvbi5SYXRpb25hbCgxLCAyKTtcbiAgICB2YXIgQ2FydExvZyA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgICAgIGdsb2JhbC5sb2cuZGVmYXVsdCh4LmFicygpKSxcbiAgICAgICAgICAgICAgICB4LmFyZygpXG4gICAgICAgICAgICBdKVsnKiddKEhhbGYpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgQ2FydExvZy5fX3Byb3RvX18gPSBnbG9iYWwubG9nO1xuICAgIGdsb2JhbFsnYXRhbjInXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgaWYoISAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uVmVjdG9yKSkge1xuICAgICAgICAgICAgICAgIHRocm93ICgnYXRhbiBvbmx5IHRha2VzIHZlY3RvciBhcmd1bWVudHMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHhbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgICAgICAgICBpZih4WzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguYXRhbjIoeFswXS52YWx1ZSwgeFsxXS52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbZ2xvYmFsLmF0YW4yLCB4XSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5hdGFuMiwgeF0pO1xuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIC8vVE9ETzogREFOR0VSISBBc3N1bWluZyByZWFsIG51bWJlcnMsIGJ1dCBpdCBzaG91bGQgaGF2ZSBzb21lIGZhc3Qgd2F5IHRvIGRvIHRoaXMuXG4gICAgICAgICAgICByZXR1cm4gW0V4cHJlc3Npb24uTGlzdChbZ2xvYmFsLmF0YW4yLCB4XSksIE0uZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcdGFuXnstMX0nLFxuICAgICAgICAndGV4dC9qYXZhc2NyaXB0JzogJ01hdGguYXRhbjInLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdhdGFuJyxcbiAgICAgICAgdG9UeXBlZFN0cmluZzogZnVuY3Rpb24obGFuZ3VhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgczogdGhpc1tsYW5ndWFnZV0sXG4gICAgICAgICAgICAgICAgdDpqYXZhc2NyaXB0LkZ1bmN0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRpdGxlOiAnVHdvIGFyZ3VtZW50IGFyY3RhbmdlbnQgZnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FyY3Rhbih5LCB4KS4gV2lsbCBlcXVhbCBhcmN0YW4oeSAvIHgpIGV4Y2VwdCB3aGVuIHggYW5kIHkgYXJlIGJvdGggbmVnYXRpdmUuIFNlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0F0YW4yJ1xuICAgIH0pO1xuXG4gICAgZ2xvYmFsWydhdGFuJ10gPSBnbG9iYWwuYXRhbjI7XG5cbiAgICBnbG9iYWxbJ0dhbW1hJ10gPSB7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgZnVuY3Rpb24gZ2FtbWxuKHh4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGo7XG4gICAgICAgICAgICAgICAgdmFyIHgsIHRtcCwgeSwgc2VyO1xuICAgICAgICAgICAgICAgIHZhciBjb2YgPSBbXG4gICAgICAgICAgICAgICAgICAgIDU3LjE1NjIzNTY2NTg2MjkyMzUsXG4gICAgICAgICAgICAgICAgICAgIC01OS41OTc5NjAzNTU0NzU0OTEyLFxuICAgICAgICAgICAgICAgICAgICAxNC4xMzYwOTc5NzQ3NDE3NDcxLFxuICAgICAgICAgICAgICAgICAgICAtMC40OTE5MTM4MTYwOTc2MjAxOTksXG4gICAgICAgICAgICAgICAgICAgIDAuMzM5OTQ2NDk5ODQ4MTE4ODg3ZS00LFxuICAgICAgICAgICAgICAgICAgICAwLjQ2NTIzNjI4OTI3MDQ4NTc1NmUtNCxcbiAgICAgICAgICAgICAgICAgICAgLTAuOTgzNzQ0NzUzMDQ4Nzk1NjQ2ZS00LFxuICAgICAgICAgICAgICAgICAgICAwLjE1ODA4ODcwMzIyNDkxMjQ5NGUtMyxcbiAgICAgICAgICAgICAgICAgICAgLTAuMjEwMjY0NDQxNzI0MTA0ODgzZS0zLFxuICAgICAgICAgICAgICAgICAgICAwLjIxNzQzOTYxODExNTIxMjY0M2UtMyxcbiAgICAgICAgICAgICAgICAgICAgLTAuMTY0MzE4MTA2NTM2NzYzODkwZS0zLFxuICAgICAgICAgICAgICAgICAgICAwLjg0NDE4MjIzOTgzODUyNzQzM2UtNCxcbiAgICAgICAgICAgICAgICAgICAgLTAuMjYxOTA4Mzg0MDE1ODE0MDg3ZS00LFxuICAgICAgICAgICAgICAgICAgICAwLjM2ODk5MTgyNjU5NTMxNjIzNGUtNVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgaWYgKHh4IDw9IDApe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdygnYmFkIGFyZyBpbiBnYW1tbG4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeSA9IHggPSB4eDtcbiAgICAgICAgICAgICAgICB0bXAgPSB4ICsgNS4yNDIxODc1MDAwMDAwMDAwMDtcbiAgICAgICAgICAgICAgICB0bXAgPSAoeCArIDAuNSkgKiBNYXRoLmxvZyh0bXApIC0gdG1wO1xuICAgICAgICAgICAgICAgIHNlciA9IDAuOTk5OTk5OTk5OTk5OTk3MDkyO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAxNDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgc2VyICs9IGNvZltqXSAvICsreTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRtcCArIE1hdGgubG9nKDIuNTA2NjI4Mjc0NjMxMDAwNSAqIHNlciAvIHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHguYTtcbiAgICAgICAgICAgICAgICBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkNvbXBsZXhJbmZpbml0eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYodiA8IDE1KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaSA9IDE7IGkgPCB2OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgKj0gaTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uSW50ZWdlcihwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtnbG9iYWwuR2FtbWEsIHhdKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsLkluZmluaXR5O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgtTWF0aC5QSSAvICh2ICogTWF0aC5zaW4oTWF0aC5QSSAqIHYpICogTWF0aC5leHAoZ2FtbWxuKC12KSkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5leHAoZ2FtbWxuKHYpKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLkdhbW1hLCB4XSk7XG4gICAgICAgIH0sXG4gICAgICAgICd0ZXh0L2xhdGV4JzogJ1xcXFxHYW1tYScsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTS5nbG9iYWwuR2FtbWEuZicsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ0dhbW1hIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWUgaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9HYW1tYV9mdW5jdGlvbicsXG4gICAgICAgIGV4YW1wbGVzOiBbJ1xcXFxHYW1tYSAoeCknLCAneCEnXSxcbiAgICAgICAgcmVsYXRlZDogWydMb2cnLCAnTG9nR2FtbWEnXVxuICAgIH07XG4gICAgZ2xvYmFsWydSZSddID0ge1xuICAgICAgICBkZWZhdWx0OiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICByZXR1cm4geC5yZWFsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5X3JlYWxpbWFnOiBmdW5jdGlvbihvcCwgeCkge1xuICAgICAgICAgICAgcmV0dXJuIFt4LnJlYWwoKSwgZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcUmUnXG4gICAgfTtcbiAgICBnbG9iYWxbJ0ltJ10gPSB7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4LmltYWcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZGlzdHJpYnV0ZWRfdW5kZXJfZGlmZmVyZW50aWF0aW9uOiB0cnVlLFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIHJldHVybiBbeC5pbWFnKCksIGdsb2JhbC5aZXJvXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXEltJ1xuICAgIH1cbiAgICBFeHByZXNzaW9uLkxpc3QuUmVhbC5wcm90b3R5cGUucG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcrJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbMF0ucG9zaXRpdmUgJiYgdGhpc1sxXS5wb3NpdGl2ZSAmJiB0aGlzWzBdLnBvc2l0aXZlKCkgJiYgdGhpc1sxXS5wb3NpdGl2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gdGhpc1sxXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbMF0ucG9zaXRpdmUgJiYgdGhpc1sxXS5wb3NpdGl2ZSAmJiB0aGlzWzBdLnBvc2l0aXZlKCkgJiYgdGhpc1sxXS5wb3NpdGl2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICdeJykge1xuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgZiA9IHRoaXNbMV0ucmVkdWNlKCk7XG4gICAgICAgICAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZS5wb3NpdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPiAwO1xuICAgIH07XG4gICAgZ2xvYmFsWydzcXJ0J10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgICAgIHZhciB2ID0geC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZih2IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbC5aZXJvLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguc3FydCh2KSlcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguc3FydCh2KSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICAgICAgICAgIGlmKHgucG9zaXRpdmUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW2dsb2JhbC5zcXJ0LCB4XSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgICAgICAgICAgICAgeFswXSxcbiAgICAgICAgICAgICAgICAgICAgeFsxXVsnLyddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoMikpXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbZ2xvYmFsLnNxcnQsIHhdKTtcbiAgICAgICAgICAgIHRocm93KCdTUVJUOiA/Pz8nKTtcbiAgICAgICAgICAgIHN3aXRjaCAoeC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5Db21wbGV4OlxuICAgICAgICAgICAgICAgICAgICAvL2h0dHA6Ly93d3cubWF0aHByb3ByZXNzLmNvbS9zdGFuL2JpYmxpb2dyYXBoeS9jb21wbGV4U3F1YXJlUm9vdC5wZGZcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNnbl9iO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeC5faW1hZyA9PT0gMC4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChNYXRoLnNxcnQoeC5fcmVhbCksIDApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoeC5faW1hZz4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZ25fYiA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNnbl9iID0gLTEuMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgc19hMl9iMiA9IE1hdGguc3FydCh4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBvbmVfb25fcnQyICogTWF0aC5zcXJ0KHNfYTJfYjIgKyB4Ll9yZWFsKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBzZ25fYiAqIG9uZV9vbl9ydDIgKiBNYXRoLnNxcnQoc19hMl9iMiAtIHguX3JlYWwpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uUmVhbE51bWVyaWNhbChNYXRoLnNxcnQoeCkpO1xuICAgICAgICAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LlJlYWw6XG4gICAgICAgICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3Q6XG4gICAgICAgICAgICAgICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnXicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnbG9iYWwuYWJzLmFwcGx5KHVuZGVmaW5lZCwgeFswXS5hcHBseSgnXicsIHhbMV0uYXBwbHkoJy8nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDIsMCkpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFtnbG9iYWwuc3FydCwgeF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhcHBseV9yZWFsaW1hZzogZnVuY3Rpb24ob3AsIHgpIHtcbiAgICAgICAgICAgIC8vVE9ETzogREFOR0VSISBBc3N1bWluZyByZWFsIG51bWJlcnMsIGJ1dCBpdCBzaG91bGQgaGF2ZSBzb21lIGZhc3Qgd2F5IHRvIGRvIHRoaXMuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vVXNlcyBleHAsIGF0YW4yIGFuZCBsb2cgZnVuY3Rpb25zLiBBIHJlYWxseSBiYWQgaWRlYS4gKHNxdWFyZSByb290aW5nLCB0aGVuIHNxdWFyaW5nLCB0aGVuIGF0YW4sIGFsc28gW2V4cChsb2cpXSlcbiAgICAgICAgICAgIHJldHVybiB4WydeJ10obmV3IEV4cHJlc3Npb24uUmF0aW9uYWwoMSwgMikpLnJlYWxpbWFnKCk7XG4gICAgICAgICAgICAvL3ZhciByaSA9IHgucmVhbGltYWcoKTtcbiAgICAgICAgICAgIC8vcmV0dXJuIFtFeHByZXNzaW9uLkxpc3QoW2dsb2JhbC5zcXJ0LCB4XSksIE0uZ2xvYmFsLlplcm9dO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcc3FydCcsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5zcXJ0JyxcbiAgICAgICAgJ3gtc2hhZGVyL3gtZnJhZ21lbnQnOiAnc3FydCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRsZTogJ1NxcnQgRnVuY3Rpb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlZSBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NxdWFyZV9Sb290JyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXHNxcnQgKHheNCknXSxcbiAgICAgICAgcmVsYXRlZDogWydwb3cnLCAnYWJzJywgJ21vZCddXG4gICAgfSk7XG4gICAgZ2xvYmFsWydhYnMnXSA9IG5ldyBFeHByZXNzaW9uLkZ1bmN0aW9uKHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuXG4gICAgICAgICAgICByZXR1cm4geC5hYnMoKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3RleHQvbGF0ZXgnOiAnXFxcXGFicycsXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hYnMnLFxuICAgICAgICAneC1zaGFkZXIveC1mcmFnbWVudCc6ICdhYnMnLFxuICAgICAgICB0aXRpZTogJ0Fic29sdXRlIFZhbHVlIEZ1bmN0aW9uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBYnMnLFxuICAgICAgICBleGFtcGxlczogWydcXFxcYWJzICgtMyknLCAnXFxcXGFicyAoaSszKSddLFxuICAgICAgICByZWxhdGVkOiBbJ2FyZycsICd0YW4nXVxuICAgIH0pO1xuXG4gICAgLy8gSXQgaXMgc2VsZi1yZWZlcmVudGlhbFxuICAgIGdsb2JhbC5hYnMuZGVyaXZhdGl2ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcyA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCk7XG4gICAgICAgICAgICB2YXIgeSA9IHNbJy8nXShzLmFicygpKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbi5TeW1ib2xpYyh5LCBbc10pO1xuICAgIH0oKSk7XG4gICAgZ2xvYmFsWydhcmcnXSA9IHtcbiAgICAgICAgZGVmYXVsdDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignQVJHIElTIEZPUiBVU0VSIElOUFVUIE9OTFkuIFVTRSAuYXJnKCknKTtcbiAgICAgICAgICAgIC8vVXNpbmcgYWJzIGlzIGJldHRlciAoSSB0aGluaykgYmVjYXVzZSBpdCBmaW5kcyB0aGUgbWV0aG9kIHRocm91Z2ggdGhlIHByb3RvdHlwZSBjaGFpbixcbiAgICAgICAgICAgIC8vd2hpY2ggaXMgZ29pbmcgdG8gYmUgZmFzdGVyIHRoYW4gZG9pbmcgYW4gaWYgbGlzdCAvIHN3aXRjaCBjYXNlIGxpc3QuIFRPRE86IENoZWNrIHRoZSB0cnV0aGZ1bGxuZXMgb2YgdGhpcyFcbiAgICAgICAgICAgIHJldHVybiB4LmFyZygpO1xuICAgICAgICB9LFxuICAgICAgICAndGV4dC9sYXRleCc6ICdcXFxcYXJnJywgLy90ZW1wXG4gICAgICAgICd0ZXh0L2phdmFzY3JpcHQnOiAnTWF0aC5hcmdfcmVhbCcsXG4gICAgICAgIHRvVHlwZWRTdHJpbmc6IGZ1bmN0aW9uKGxhbmd1YWdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHM6IHRoaXNbbGFuZ3VhZ2VdLFxuICAgICAgICAgICAgICAgIHQ6amF2YXNjcmlwdC5GdW5jdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aXRpZTogJ0FyZyBGdW5jdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJnJyxcbiAgICAgICAgZXhhbXBsZXM6IFsnXFxcXGFyZyAoLTMpJywgJ1xcXFxhcmcgKDMpJywgJ1xcXFxhcmcoMysyaSknXSxcbiAgICAgICAgcmVsYXRlZDogWydhYnMnXVxuICAgIH1cblxuXG5cbiAgICBnbG9iYWxbJ2UnXSA9IG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5FLCAwKTtcbiAgICBnbG9iYWxbJ2UnXS50aXRsZSA9ICdlJztcbiAgICBnbG9iYWxbJ2UnXS5kZXNjcmlwdGlvbiA9ICdUaGUgdHJhbnNjZW5kZW50YWwgbnVtYmVyIHRoYXQgaXMgdGhlIGJhc2Ugb2YgdGhlIG5hdHVyYWwgbG9nYXJpdGhtLCBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIDIuNzE4MjguJztcbiAgICBnbG9iYWwuZS5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnTWF0aC5FJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29kZSgnZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMi43MTgyODE4Mjg0NTkwNDUnKTtcbiAgICB9O1xuXG5cbiAgICBnbG9iYWxbJ3BpJ10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKE1hdGguUEksIDApO1xuICAgIGdsb2JhbFsncGknXS50aXRsZSA9ICdQaSc7XG4gICAgZ2xvYmFsWydwaSddLmRlc2NyaXB0aW9uID0gJyc7XG4gICAgZ2xvYmFsLnBpLnMgPSBmdW5jdGlvbiAobGFuZykge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb2RlKCdNYXRoLlBJJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ1xcXFxwaScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZSgnMy4xNDE1OTI2NTM1ODk3OTMnKTtcbiAgICB9O1xuICAgIC8vIFRoZSByZWFsIGNpcmNsZSBjb25zdGFudDpcbiAgICBnbG9iYWwudGF1ID0gZ2xvYmFsWydwaSddWycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG5cbiAgICBnbG9iYWxbJ0luZmluaXR5J10gPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKEluZmluaXR5LCAwKTtcbiAgICBnbG9iYWxbJ0luZmluaXR5J10udGl0bGUgPSAnSW5maW5pdHknO1xuICAgIGdsb2JhbFsnSW5maW5pdHknXS5kZXNjcmlwdGlvbiA9ICcnO1xuICAgIGdsb2JhbFsnaW5mdHknXSA9IGdsb2JhbC5JbmZpbml0eTtcblxuXG4gICAgZ2xvYmFsWydaZXJvJ10gPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDApO1xuICAgIGdsb2JhbFsnWmVybyddLnRpdGxlID0gJ1plcm8nO1xuICAgIGdsb2JhbFsnWmVybyddLmRlc2NyaXB0aW9uID0gJ0FkZGl0aXZlIElkZW50aXR5JztcbiAgICBnbG9iYWxbJ1plcm8nXVsnKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgIH07XG4gICAgZ2xvYmFsWydaZXJvJ11bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG4gICAgZ2xvYmFsWydaZXJvJ11bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydaZXJvJ11bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiB4WydALSddKCk7XG4gICAgfTtcblxuICAgIGdsb2JhbFsnT25lJ10gPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKDEpO1xuICAgIGdsb2JhbFsnT25lJ10udGl0bGUgPSAnT25lJztcbiAgICBnbG9iYWxbJ09uZSddLmRlc2NyaXB0aW9uID0gJ011bHRpcGxpY2F0aXZlIElkZW50aXR5JztcbiAgICBnbG9iYWxbJ09uZSddWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4geDtcbiAgICB9O1xuXG4gICAgZ2xvYmFsLmxvZy5kZXJpdmF0aXZlID0gbmV3IEV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMoZ2xvYmFsLk9uZVsnLyddKG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKCkpKTtcblxuICAgIGdsb2JhbFsnaSddID0gbmV3IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtnbG9iYWxbJ1plcm8nXSwgZ2xvYmFsWydPbmUnXV0pO1xuICAgIGdsb2JhbFsnaSddLnRpdGxlID0gJ0ltYWdpbmFyeSBVbml0JztcbiAgICBnbG9iYWxbJ2knXS5kZXNjcmlwdGlvbiA9ICdBIG51bWJlciB3aGljaCBzYXRpc2ZpZXMgdGhlIHByb3BlcnR5IDxtPmleMiA9IC0xPC9tPi4nO1xuICAgIGdsb2JhbFsnaSddLnJlYWxpbWFnID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIGdsb2JhbC5aZXJvLFxuICAgICAgICAgICAgZ2xvYmFsLk9uZVxuICAgICAgICBdKTtcbiAgICB9O1xuICAgIGdsb2JhbFsnaSddWycqW1RPRE9dJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBcbiAgICB9O1xuXG4gICAgZ2xvYmFsWydkJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5JbmZpbml0ZXNpbWFsKHgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBnbG9iYWwuZFsnLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCkge1xuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gRGVyaXZhdGl2ZSBvcGVyYXRvclxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGVyaXZhdGl2ZSh4LngpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5WZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHgueCwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEZXJpdmF0aXZlKHgpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZnVzaW5nIGluZml0ZXNpbWFsIG9wZXJhdG9yIGRpdmlzaW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdygnRGl2aWRpbmcgZCBieSBzb21lIGxhcmdlIG51bWJlci4nKTtcbiAgICAgICAgXG4gICAgfTtcbiAgICBnbG9iYWxbJ3VuZGVmaW5lZCddID0ge1xuICAgICAgICBzOiBmdW5jdGlvbiAobGFuZyl7XG4gICAgICAgICAgICBpZiAobGFuZyA9PT0gJ3RleHQvamF2YXNjcmlwdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJ3VuZGVmaW5lZCcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvZGUoJygxLjAvMC4wKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBkaWZmZXJlbnRpYXRlOiBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICAnKic6IGZ1bmN0aW9uICgpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgICAgICcrJzogZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy0nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJy8nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ14nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICAgICAgJ0AtJzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGdsb2JhbFsnc3VtJ10gPSBuZXcgRXhwcmVzc2lvbi5GdW5jdGlvbih7XG4gICAgICAgIGRlZmF1bHQ6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICB0aHJvdygnU3VtIG5vdCBwcm9wZXJseSBjb25zdHJ1Y3RlZCB5ZXQuJyk7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGdsb2JhbFsnc3VtJ11bJ18nXSA9IGZ1bmN0aW9uIChlcSkge1xuICAgICAgICAvLyBzdGFydDogXG4gICAgICAgIHZhciB0ID0gZXFbMF07XG4gICAgICAgIHZhciB2ID0gZXFbMV07XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5TdW0uUmVhbCh0LCB2KTtcbiAgICB9XG4gICAgXG59O1xufSkoKSIsIihmdW5jdGlvbigpe3ZhciBHbG9iYWwgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxuZnVuY3Rpb24gRXhwcmVzc2lvbigpIHtcbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFeHByZXNzaW9uO1xuXG5FeHByZXNzaW9uLkxpc3QgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xpc3QnKTtcbkV4cHJlc3Npb24uTGlzdC5SZWFsICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vTGlzdC9SZWFsJyk7XG5FeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbiAgPSByZXF1aXJlKCcuL0xpc3QvQ29tcGxleENhcnRlc2lhbicpO1xuRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhciAgICAgID0gcmVxdWlyZSgnLi9MaXN0L0NvbXBsZXhQb2xhcicpO1xuRXhwcmVzc2lvbi5Db25zdGFudCAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Db25zdGFudCcpO1xuRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4ICAgICAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxDb21wbGV4Jyk7XG5FeHByZXNzaW9uLk51bWVyaWNhbFJlYWwgICAgICAgICAgPSByZXF1aXJlKCcuL051bWVyaWNhbFJlYWwnKTtcbkV4cHJlc3Npb24uUmF0aW9uYWwgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vUmF0aW9uYWwnKTtcbkV4cHJlc3Npb24uSW50ZWdlciAgICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vSW50ZWdlcicpO1xuRXhwcmVzc2lvbi5TeW1ib2wgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9TeW1ib2wnKTtcbkV4cHJlc3Npb24uU3ltYm9sLlJlYWwgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3ltYm9sL1JlYWwnKTtcbkV4cHJlc3Npb24uU3RhdGVtZW50ICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vU3RhdGVtZW50Jyk7XG5FeHByZXNzaW9uLlZlY3RvciAgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL1ZlY3RvcicpO1xuRXhwcmVzc2lvbi5NYXRyaXggICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9NYXRyaXgnKTtcbkV4cHJlc3Npb24uRnVuY3Rpb24gICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vRnVuY3Rpb24nKTtcbkV4cHJlc3Npb24uRnVuY3Rpb24uU3ltYm9saWMgICAgICA9IHJlcXVpcmUoJy4vRnVuY3Rpb24vU3ltYm9saWMnKTtcbkV4cHJlc3Npb24uSW5maW5pdGVzaW1hbCAgICAgICAgICA9IHJlcXVpcmUoJy4vSW5maW5pdGVzaW1hbCcpO1xuXG52YXIgXyA9IEV4cHJlc3Npb24ucHJvdG90eXBlO1xuXG5fLnRvU3RyaW5nID0gbnVsbDtcbl8udmFsdWVPZiA9IG51bGw7XG5cbl8uaW1hZ2VVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICdodHRwOi8vbGF0ZXguY29kZWNvZ3MuY29tL2dpZi5sYXRleD8nICtcbiAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMucygndGV4dC9sYXRleCcpLnMpO1xufTtcblxuXy5yZW5kZXJMYVRlWCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWFnZS5zcmMgPSB0aGlzLmltYWdlVVJMKCk7XG4gICAgcmV0dXJuIGltYWdlO1xufTtcblxuLy8gc3Vic3R1dGlvbiBkZWZhdWx0OlxuXy5zdWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBsaW1pdCBkZWZhdWx0XG5fLmxpbSA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIHRoaXMuc3ViKHgsIHkpO1xufTtcblxuX1snLCddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TdGF0ZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbmRpdGlvbmFsKHgsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbn07XG5cblxuWyc9JywgJyE9JywgJz4nLCAnPj0nLCAnPCcsICc8PSddLmZvckVhY2goZnVuY3Rpb24gKG9wZXJhdG9yKSB7XG4gICAgX1tvcGVyYXRvcl0gPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uU3RhdGVtZW50KHRoaXMsIHgsIG9wZXJhdG9yKTtcbiAgICB9O1xufSk7XG5cblxuXG4vLyBjcm9zc1Byb2R1Y3QgaXMgdGhlICcmdGltZXM7JyBjaGFyYWN0ZXJcbnZhciBjcm9zc1Byb2R1Y3QgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDIxNSk7XG5cbl9bY3Jvc3NQcm9kdWN0XSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJyonXSh4KTtcbn07XG5cblxuLy8gVGhlIGRlZmF1bHQgb3BlcmF0b3Igb2NjdXJzIHdoZW4gdHdvIGV4cHJlc3Npb25zIGFyZSBhZGphY2VudCB0byBlYWNob3RoZXI6IFMgLT4gZSBlLlxuLy8gRGVwZW5kaW5nIG9uIHRoZSB0eXBlLCBpdCB1c3VhbGx5IHJlcHJlc2VudHMgYXNzb2NpYXRpdmUgbXVsdGlwbGljYXRpb24uXG4vLyBTZWUgYmVsb3cgZm9yIHRoZSBkZWZhdWx0ICcqJyBvcGVyYXRvciBpbXBsZW1lbnRhdGlvbi5cbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHRoaXNbJyonXSh4KTtcbn07XG5cblsnLycsICcrJywgJy0nLCAnQC0nLCAnXicsICclJ10uZm9yRWFjaChmdW5jdGlvbiAob3BlcmF0b3IpIHtcbiAgICBfW29wZXJhdG9yXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuICAgIH07XG59KTtcblxuXG5cblxuLy8gVGhpcyBtYXkgbG9vayBsaWtlIHdlIGFyZSBhc3N1bWluZyB0aGF0IHggaXMgYSBudW1iZXIsXG4vLyBidXQgcmVhbGx5IHRoZSBpbXBvcnRhbnQgYXNzdW1wdGlvbiBpcyBzaW1wbHlcbi8vIHRoYXQgaXQgaXMgZmluaXRlLlxuLy8gVGh1cyBpbmZpbml0aWVzIGFuZCBpbmRldGVybWluYXRlcyBzaG91bGQgQUxXQVlTXG4vLyBvdmVycmlkZSB0aGlzIG9wZXJhdG9yXG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIGlmKHggPT09IEdsb2JhbC5PbmUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJyonKTtcbn07XG5cblxuXG5cblxuXG5cblxuXG5cblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsICAgID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIGdsb2JhbCAgPSByZXF1aXJlKCcuLi9nbG9iYWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuXG51dGlsLmluaGVyaXRzKENvbnRleHQsIHtwcm90b3R5cGU6IGdsb2JhbH0pO1xuXG5mdW5jdGlvbiBDb250ZXh0KCkge1xuXG59XG5cbkNvbnRleHQucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3BsaWNlKDApO1xufTtcblxufSkoKSIsIi8vIG5vdGhpbmcgdG8gc2VlIGhlcmUuLi4gbm8gZmlsZSBtZXRob2RzIGZvciB0aGUgYnJvd3NlclxuIiwiKGZ1bmN0aW9uKHByb2Nlc3Mpe2Z1bmN0aW9uIGZpbHRlciAoeHMsIGZuKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGZuKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gUmVnZXggdG8gc3BsaXQgYSBmaWxlbmFtZSBpbnRvIFsqLCBkaXIsIGJhc2VuYW1lLCBleHRdXG4vLyBwb3NpeCB2ZXJzaW9uXG52YXIgc3BsaXRQYXRoUmUgPSAvXiguK1xcLyg/ISQpfFxcLyk/KCg/Oi4rPyk/KFxcLlteLl0qKT8pJC87XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xudmFyIHJlc29sdmVkUGF0aCA9ICcnLFxuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICB2YXIgcGF0aCA9IChpID49IDApXG4gICAgICA/IGFyZ3VtZW50c1tpXVxuICAgICAgOiBwcm9jZXNzLmN3ZCgpO1xuXG4gIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnIHx8ICFwYXRoKSB7XG4gICAgY29udGludWU7XG4gIH1cblxuICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn1cblxuLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbi8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxucmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xudmFyIGlzQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nLFxuICAgIHRyYWlsaW5nU2xhc2ggPSBwYXRoLnNsaWNlKC0xKSA9PT0gJy8nO1xuXG4vLyBOb3JtYWxpemUgdGhlIHBhdGhcbnBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cbiAgXG4gIHJldHVybiAoaXNBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHBhdGg7XG59O1xuXG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIHJldHVybiBwICYmIHR5cGVvZiBwID09PSAnc3RyaW5nJztcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgZGlyID0gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVsxXSB8fCAnJztcbiAgdmFyIGlzV2luZG93cyA9IGZhbHNlO1xuICBpZiAoIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWVcbiAgICByZXR1cm4gJy4nO1xuICB9IGVsc2UgaWYgKGRpci5sZW5ndGggPT09IDEgfHxcbiAgICAgIChpc1dpbmRvd3MgJiYgZGlyLmxlbmd0aCA8PSAzICYmIGRpci5jaGFyQXQoMSkgPT09ICc6JykpIHtcbiAgICAvLyBJdCBpcyBqdXN0IGEgc2xhc2ggb3IgYSBkcml2ZSBsZXR0ZXIgd2l0aCBhIHNsYXNoXG4gICAgcmV0dXJuIGRpcjtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhIGZ1bGwgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICByZXR1cm4gZGlyLnN1YnN0cmluZygwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aFJlLmV4ZWMocGF0aClbMl0gfHwgJyc7XG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cbiAgaWYgKGV4dCAmJiBmLnN1YnN0cigtMSAqIGV4dC5sZW5ndGgpID09PSBleHQpIHtcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcbiAgfVxuICByZXR1cm4gZjtcbn07XG5cblxuZXhwb3J0cy5leHRuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhwYXRoKVszXSB8fCAnJztcbn07XG5cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbn0pKHJlcXVpcmUoXCJfX2Jyb3dzZXJpZnlfcHJvY2Vzc1wiKSkiLCIoZnVuY3Rpb24oKXsvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBGdW5jdGlvbiAod2hpY2ggaXQgY2FsbHMgZXZhbClcbi8qanNoaW50IC1XMDYxICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29kZTtcblxuZnVuY3Rpb24gQ29kZShzLCBwcmUpe1xuICAgIHRoaXMucHJlID0gW10gfHwgcHJlO1xuICAgIHRoaXMucyA9ICcnIHx8IHM7XG4gICAgdGhpcy52YXJzID0gMDtcbiAgICB0aGlzLnAgPSBJbmZpbml0eTtcbn1cblxudmFyIF8gPSBDb2RlLnByb3RvdHlwZTtcblxuLypcbiAgICBUaGlzIHVzZXMgYSBnbG9iYWwgc3RhdGUuXG5cbiAgICBQZXJoYXBzIHRoZXJlIGlzIGEgbmljZXIgd2F5LCBidXQgdGhpcyB3aWxsIHdvcmsuXG4qL1xuQ29kZS5uZXdDb250ZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIENvZGUuY29udGV4dFZhcmlhYmxlQ291bnQgPSAwO1xufTtcblxuQ29kZS5uZXdDb250ZXh0KCk7XG5cbi8vIEZvciBmYXN0ZXIgZXZhbHVhdGlvbiBtdWx0aXBsZSBzdGF0bWVudHMuIEZvciBleGFtcGxlICh4KzMpXjIgd2lsbCBmaXJzdCBjYWxjdWxhdGUgeCszLCBhbmQgc28gb24uXG5fLnZhcmlhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAndCcgKyAoQ29kZS5jb250ZXh0VmFyaWFibGVDb3VudCsrKS50b1N0cmluZygzNik7XG59O1xuXG5fLm1lcmdlID0gZnVuY3Rpb24gKG8sIHN0ciwgcCwgcHJlKSB7XG4gICAgdGhpcy5zID0gc3RyO1xuICAgIGlmIChwcmUpIHtcbiAgICAgICAgdGhpcy5wcmUucHVzaChwcmUpO1xuICAgIH1cbiAgICB2YXIgaTtcbiAgICB0aGlzLnByZS5wdXNoLmFwcGx5KHRoaXMucHJlLCBvLnByZSk7XG4gICAgdGhpcy52YXJzICs9IG8udmFycztcbiAgICB0aGlzLnAgPSBwO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXy51cGRhdGUgPSBmdW5jdGlvbiAoc3RyLCBwLCBwcmUpIHtcbiAgICB0aGlzLnAgPSBwO1xuICAgIGlmKHByZSkge1xuICAgICAgICB0aGlzLnByZS5wdXNoKHByZSk7XG4gICAgfVxuICAgIHRoaXMucyA9IHN0cjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIEphdmFzY3JpcHQgY29tcGxpYXRpb25cbl8uY29tcGlsZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKHgsIHRoaXMucHJlLmpvaW4oJ1xcbicpICsgJ3JldHVybiAnICsgdGhpcy5zKTtcbn07XG5cbl8uZ2xzbEZ1bmN0aW9uID0gZnVuY3Rpb24gKHR5cGUsIG5hbWUsIHBhcmFtZXRlcnMpIHtcbiAgICByZXR1cm4gdHlwZSArICcgJyArIG5hbWUgKyAnKCcgKyBwYXJhbWV0ZXJzICsgJyl7XFxuJyArIHRoaXMucHJlLmpvaW4oJ1xcbicpICsgJ3JldHVybiAnICsgdGhpcy5zICsgJztcXG59XFxuJztcbn07XG5cblxufSkoKSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5naWZ5KGV4cHIsIGxhbmcpIHtcbiAgICByZXR1cm4gZXhwci5zKGxhbmcpO1xufTtcbiIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLycpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnN0YW50O1xuXG51dGlsLmluaGVyaXRzKENvbnN0YW50LCBzdXApO1xuXG5mdW5jdGlvbiBDb25zdGFudCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cHJlc3Npb24uQ29uc3RhbnQgY3JlYXRlZCBkaXJlY3RseScpO1xufVxuXG52YXIgXyA9IENvbnN0YW50LnByb3RvdHlwZTtcblxuXy5zaW1wbGlmeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xufTtcblxuXy5hcHBseSA9IGZ1bmN0aW9uICh4KXtcbiAgICByZXR1cm4gdGhpc1snKiddKHgpO1xufTtcblxufSkoKSIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuL0NvbnN0YW50Jyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTnVtZXJpY2FsQ29tcGxleDtcblxudXRpbC5pbmhlcml0cyhOdW1lcmljYWxDb21wbGV4LCBzdXApO1xuXG5mdW5jdGlvbiBOdW1lcmljYWxDb21wbGV4KHJlYWwsIGltYWcpIHtcbiAgICB0aGlzLl9yZWFsID0gcmVhbDtcbiAgICB0aGlzLl9pbWFnID0gaW1hZztcbn1cblxudmFyIF8gPSBOdW1lcmljYWxDb21wbGV4LnByb3RvdHlwZTtcblxuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwodGhpcy5fcmVhbCk7XG59O1xuXG5fLmltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh0aGlzLl9pbWFnKTtcbn07XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX3JlYWwpLFxuICAgICAgICBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMuX2ltYWcpXG4gICAgXSk7XG59O1xuXG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwsIC10aGlzLl9pbWFnKTtcbn07XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KXtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHguX3JlYWwsIHRoaXMuX2ltYWcgKyB4Ll9pbWFnKTtcbiAgICB9IGVsc2UgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCArIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHsgXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsQ29tcGxleCArJyk7XG4gICAgfVxufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHhbJ0AtJ10oKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCl7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4Ll9yZWFsLCB0aGlzLl9pbWFnIC0geC5faW1hZyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAtIHgudmFsdWUsIHRoaXMuX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggLScpO1xuICAgIH1cbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5faW1hZyA9PT0gMCkge1xuICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcil7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4Ll9yZWFsIC0gdGhpcy5faW1hZyAqIHguX2ltYWcsIHRoaXMuX3JlYWwgKiB4Ll9pbWFnICsgdGhpcy5faW1hZyAqIHguX3JlYWwpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4LnZhbHVlLCB0aGlzLl9pbWFnICogeC52YWx1ZSk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiAoeClbJyonXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycqJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKiddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxDb21wbGV4IConKTtcbiAgICB9XG59O1xuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuX2ltYWcgPT09IDAgJiYgdGhpcy5fcmVhbCA9PT0gMCkge1xuICAgICAgICAvLyBUT0RPOiBQcm92aWRlZCB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBcbiAgICBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbiAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoKHRoaXMuX3JlYWwgKiB4Ll9yZWFsICsgdGhpcy5faW1hZyAqIHguX2ltYWcpL2NjX2RkLCAodGhpcy5faW1hZyAqIHguX3JlYWwgLSB0aGlzLl9yZWFsICogeC5faW1hZykgLyBjY19kZCk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAvIHgudmFsdWUsIHRoaXMuX2ltYWcgLyB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKVsnLyddKHgpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpWycvJ10oeCk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnLycpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbENvbXBsZXggLycpO1xuICAgIH1cbn07XG5cbl9bJyEnXSA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBHbG9iYWwuR2FtbWEuYXBwbHkodGhpcyk7XG59O1xuXG4vLyAoZnVuY3Rpb24oKXtcbi8vICAgICByZXR1cm47XG4vLyAgICAgdmFyIG9uZV9vbl9ydDIgPSAxL01hdGguc3FydCgyKTtcbi8vICAgICBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgucHJvdG90eXBlLmFwcGx5ID0gZnVuY3Rpb24ob3BlcmF0b3IsIHgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcil7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAwICYmIHRoaXMuX2ltYWcgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvLyBDb250cmFkaWN0cyB4XjAgPSAxXG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPT09IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHguYXBwbHkoJ0AtJyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGJyZWFrO1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLl9yZWFsID09PSAxICYmIHRoaXMuX2ltYWcgPT09IDApe1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgLy9Ob3RlOiBUaGVyZSBpcyBub3QgbWVhbnQgdG8gYmUgYSBicmVhayBoZXJlLlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy5fcmVhbCA9PT0gMCAmJiB0aGlzLl9pbWFnID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvL0NvbnRyYWRpY3MgeC8wID0gSW5maW5pdHlcbi8vICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgaWYgKG9wZXJhdG9yID09PSAnLCcpIHtcbi8vICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLlZlY3RvcihbdGhpcywgeF0pO1xuLy8gICAgICAgICB9IGVsc2UgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuICAgICAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ0ArJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnQC0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCgtdGhpcy5fcmVhbCwgLXRoaXMuX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJ1xcdTIyMUEnOlxuLy8gICAgICAgICAgICAgICAgICAgICB0aHJvdygnT0xEIFNRUlQuIE5ldyBvbmUgaXMgYSBmdW5jdGlvbiwgbm90IG9wZXJhdG9yLicpXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHAsIHEpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysrJzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICctLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3IoJ1Bvc3RmaXggJyArb3BlcmF0b3IgKyAnIG9wZXJhdG9yIGFwcGxpZWQgdG8gdmFsdWUgdGhhdCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJys9Jzpcbi8vICAgICAgICAgICAgICAgICBjYXNlICctPSc6XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnKj0nOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy89Jzpcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3cobmV3IFJlZmVyZW5jZUVycm9yKCdMZWZ0IHNpZGUgb2YgYXNzaWdubWVudCBpcyBub3QgYSByZWZlcmVuY2UuJykpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgMSwgdGhpcy5faW1hZykpO1xuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICogeC52YWx1ZSwgdGhpcy5faW1hZyAqIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC52YWx1ZSwgdGhpcy5faW1hZyk7XG4vLyAgICAgICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgLSB4LnZhbHVlLCB0aGlzLl9pbWFnKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy5fcmVhbCAvIHgudmFsdWUsIHRoaXMuX2ltYWcgLyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMuX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjID0geC52YWx1ZTtcblxuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaGxtID0gMC41ICogTWF0aC5sb2coYSphICsgYipiKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMihiLCBhKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSB0aGV0YSAqIGM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgICAgICAvLyAoYStiaSkoYytkaSkgPSAoYWMtYmQpICsgKGFkK2JjKWkgXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KHRoaXMuX3JlYWwgKiB4Ll9yZWFsIC0gdGhpcy5faW1hZyAqIHguX2ltYWcsIHRoaXMuX3JlYWwgKiB4Ll9pbWFnICsgdGhpcy5faW1hZyAqIHguX3JlYWwpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsICsgeC5fcmVhbCwgdGhpcy5faW1hZyArIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCh0aGlzLl9yZWFsIC0geC5fcmVhbCwgdGhpcy5faW1hZyAtIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgICAgICAvLyAgKGErYmkpLyhjK2RpKSBcbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFsoYStiaSkoYy1kaSldL1soYytkaSkoYy1kaSldXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vPSBbKGErYmkpKGMtZGkpXS9bY2MgKyBkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgLy89IFthYyAtZGFpICtiY2kgKyBiZF0vW2NjK2RkXVxuLy8gICAgICAgICAgICAgICAgICAgICAvLz0gW2FjICsgYmQgKyAoYmMgLSBkYSldL1tjYytkZF1cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geC5fcmVhbCAqIHguX3JlYWwgKyB4Ll9pbWFnICogeC5faW1hZztcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoKHRoaXMuX3JlYWwgKiB4Ll9yZWFsICsgdGhpcy5faW1hZyAqIHguX2ltYWcpL2NjX2RkLCAodGhpcy5faW1hZyAqIHguX3JlYWwgLSB0aGlzLl9yZWFsKnguX2ltYWcpL2NjX2RkKTtcbi8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9yZWFsO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgYiA9IHRoaXMuX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBjID0geC5fcmVhbDtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEgKyBiKmIpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGIsIGEpO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQgKyB0aGV0YSAqIGM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjIC0gdGhldGEgKiBkKTtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICAgICApO1xuLy8gICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhbGltYWcoKS5hcHBseShvcGVyYXRvciwgeCk7XG4vLyAgICAgICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5wb2xhcigpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbi8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIHgpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NtcGx4IC4gJyArIG9wZXJhdG9yICsgJyA9PiBFLkxpc3Q/Jyk7XG4vLyAgICAgICAgIC8qXG4vLyAgICAgICAgIGlmKHRoaXMuX3JlYWwgPT09IDAuMCAmJiB0aGlzLl9pbWFnID09PSAwLjApe1xuLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgKi9cbiAgICAgICAgXG4gICAgICAgIFxuLy8gICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbi8vICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICB9XG4gICAgXG4vLyB9KCkpO1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4vTnVtZXJpY2FsQ29tcGxleCcpO1xudmFyIEdsb2JhbCA9IHJlcXVpcmUoJy4uL2dsb2JhbCcpO1xudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLycpO1xubW9kdWxlLmV4cG9ydHMgPSBOdW1lcmljYWxSZWFsO1xuXG51dGlsLmluaGVyaXRzKE51bWVyaWNhbFJlYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIE51bWVyaWNhbFJlYWwoZSkge1xuICAgIHRoaXMudmFsdWUgPSBlO1xufVxuXG52YXIgXyA9IE51bWVyaWNhbFJlYWwucHJvdG90eXBlO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoXywgXCJfcmVhbFwiLCB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbn0pO1xuXy5faW1hZyA9IDA7XG5cbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBHbG9iYWwuWmVybztcbn07XG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpcyxcbiAgICAgICAgR2xvYmFsLlplcm9cbiAgICBdKTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlICsgeC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoLXRoaXMudmFsdWUpO1xufTtcblxuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAtIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnQC0nXSgpWycrJ10odGhpcyk7XG59O1xuXG5cbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIG5vbnJlYWwgPSAnVGhlIG1vZHVsYXIgYXJpdGhtZXRpYyBvcGVyYXRvciBcXCclXFwnIGlzIG5vdCBkZWZpbmVkIGZvciBub24tcmVhbCBudW1iZXJzLic7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgJSB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyUnKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgdGhyb3coJ05vdCBzdXJlIGFib3V0IHRoaXMuLi4nKTtcbiAgICAgICAgLy8gTm90IHN1cmUgYWJvdXQgdGhpc1xuICAgICAgICAvLyByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHRocm93KG5ldyBUeXBlRXJyb3Iobm9ucmVhbCkpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgdGhyb3cobmV3IFR5cGVFcnJvcihub25yZWFsKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7ICAgIFxuICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKG5vbnJlYWwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gVHlwZSBmb3IgTnVtZXJpY2FsUmVhbCAlJyk7XG4gICAgfVxufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpe1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAqIHgudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKXtcbiAgICAgICAgaWYoeC52YWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3coJ0RpdmlzaW9uIGJ5IHplcm8gbm90IGFsbG93ZWQhJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgLyB4LnZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICB2YXIgY2NfZGQgPSB4Ll9yZWFsICogeC5fcmVhbCArIHguX2ltYWcgKiB4Ll9pbWFnO1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCgodGhpcy52YWx1ZSAqIHguX3JlYWwpL2NjX2RkLCAoLXRoaXMudmFsdWUgKiB4Ll9pbWFnKSAvIGNjX2RkKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIC8vIGEvKHgreWkpID0gYS8oeCt5aSkgKHgteWkpLyh4LXlpKSA9IGEoeC15aSkgLyAoeF4yICsgeV4yKVxuICAgICAgICB2YXIgeF9jb25qID0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgeFswXSxcbiAgICAgICAgICAgIHhbMV1bJ0AtJ10oKVxuICAgICAgICBdKTtcbiAgICAgICAgdmFyIHR3byA9IE51bWVyaWNhbFJlYWwoMik7XG4gICAgICAgIHJldHVybiB4X2NvbmpbJyonXSh0aGlzKVsnLyddKFxuICAgICAgICAgICAgKHhbMF1bJ14nXSkodHdvKVxuICAgICAgICAgICAgWycrJ10gKFxuICAgICAgICAgICAgICAgICh4WzFdWydeJ10pKHR3bylcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAvLyB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbiAgICAgICAgXG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICAvLyBUT0RPOiBnaXZlbiB4ICE9IDBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJy8nKTtcbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgLy8gVE9ETzogZ2l2ZW4geCAhPSAwXG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QpIHsgICBcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Vua25vd24gdHlwZTogJywgdGhpcywgeCk7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBOdW1lcmljYWxSZWFsIC8nKTtcbiAgICB9XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gR2xvYmFsLlplcm87XG4gICAgfVxuICAgIGlmICh0aGlzLnZhbHVlID09PSAxKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCA9PT0gR2xvYmFsLk9uZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHguYSkpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgTnVtZXJpY2FsUmVhbCl7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwoTWF0aC5wb3codGhpcy52YWx1ZSwgeC52YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IFRoaXMgd2lsbCBwcm9kdWNlIHVnbHkgZGVjaW1hbHMuIE1heWJlIHdlIHNob3VsZCBleHByZXNzIGl0IGluIHBvbGFyIGZvcm0/IVxuICAgICAgICAvLyAgICAgIDwtIEkgdGhpbmsgbm8sIGJlY2F1c2Ugd2h5IGVsc2Ugc3RhcnQgd2l0aCBhIG51bWVyaWNhbC4gSW1wbGVtZW50IGEgcmF0aW9uYWwvaW50ZWdlciB0eXBlXG4gICAgICAgIHZhciByID0gTWF0aC5wb3coLXRoaXMudmFsdWUsIHgudmFsdWUpO1xuICAgICAgICB2YXIgdGhldGEgPSBNYXRoLlBJICogeC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbiAgICAgICAgICAgIG5ldyBOdW1lcmljYWxSZWFsKHIpLFxuICAgICAgICAgICAgbmV3IE51bWVyaWNhbFJlYWwodGhldGEpXG4gICAgICAgIF0pO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxDb21wbGV4KSB7XG4gICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcbiAgICAgICAgdmFyIGMgPSB4Ll9yZWFsO1xuICAgICAgICB2YXIgZCA9IHguX2ltYWc7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JhZCBpbXBsZW1lbnRhdGlvbiAoIG51bSBeIGNvbXBsZXgpJyk7XG4gICAgICAgIHZhciBobG0gPSAwLjUgKiBNYXRoLmxvZyhhKmEpO1xuICAgICAgICB2YXIgaG1sZF90YyA9IGhsbSAqIGQ7XG4gICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgoXG4gICAgICAgICAgICAoZV9obWxjX3RkICogTWF0aC5jb3MoaG1sZF90YykpLFxuICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0KSB7XG4gICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGNvbnNvbGUuZXJyb3IgKCdVbmtub3duIFR5cGUgZm9yIE51bWVyaWNhbFJlYWwgXicsIHgsIHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKTtcbiAgICB9XG59O1xuX1snPiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPiB4LnZhbHVlID8gRXhwcmVzc2lvbi5UcnVlIDogRXhwcmVzc2lvbi5GYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5wcm90b3R5cGVbJz4nXS5jYWxsKHRoaXMsIHgpO1xufTtcbl9bJzwnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlIDwgeC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc8J10uY2FsbCh0aGlzLCB4KTtcbn07XG5fWyc8PSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIE51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUgPD0geC52YWx1ZSA/IEV4cHJlc3Npb24uVHJ1ZSA6IEV4cHJlc3Npb24uRmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzdXAucHJvdG90eXBlWyc8PSddLmNhbGwodGhpcywgeCk7XG59O1xuX1snPj0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBOdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlID49IHgudmFsdWUgPyBFeHByZXNzaW9uLlRydWUgOiBFeHByZXNzaW9uLkZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnPj0nXS5jYWxsKHRoaXMsIHgpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIHZhciBudW0gPSB0aGlzLnZhbHVlLnRvRXhwb25lbnRpYWwoKTtcbiAgICAgICAgaWYobnVtLmluZGV4T2YoJy4nKSA9PT0gLTEpe1xuICAgICAgICAgICAgbnVtID0gbnVtLnJlcGxhY2UoJ2UnLCcuZScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQ29kZShudW0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvZGUodGhpcy52YWx1ZS50b1N0cmluZygpKTtcbn07XG4vLyBfLmFwcGx5T2xkID0gZnVuY3Rpb24ob3BlcmF0b3IsIHgpIHtcbi8vICAgICBzd2l0Y2ggKG9wZXJhdG9yKXtcbi8vICAgICAgICAgY2FzZSAnLCc6XG4vLyAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXMsIHhdKTtcbi8vICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvLyBDb250cmFkaWN0cyB4XjAgPSAxXG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKSB7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHguYXBwbHkoJ0AtJyk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICBicmVhaztcbi8vICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMSl7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAvL05vdGU6IFRoZXJlIGlzIG5vdCBtZWFudCB0byBiZSBhIGJyZWFrIGhlcmUuXG4vLyAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvOyAvL0NvbnRyYWRpY3MgeC8wID0gSW5maW5pdHlcbi8vICAgICAgICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgaWYoeCA9PT0gdW5kZWZpbmVkKXtcbi8vICAgICAgICAgLy9VbmFyeVxuLy8gICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4vLyAgICAgICAgICAgICBjYXNlICdAKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4vLyAgICAgICAgICAgICBjYXNlICdALSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKC10aGlzLnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJysrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0tJzpcbi8vICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgVHlwZUVycm9yKCdQb3N0Zml4ICcgK29wZXJhdG9yICsgJyBvcGVyYXRvciBhcHBsaWVkIHRvIHZhbHVlIHRoYXQgaXMgbm90IGEgcmVmZXJlbmNlLicpKTtcbi8vICAgICAgICAgICAgIGNhc2UgJys9Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJy09Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJyo9Jzpcbi8vICAgICAgICAgICAgIGNhc2UgJy89Jzpcbi8vICAgICAgICAgICAgICAgICB0aHJvdyhuZXcgUmVmZXJlbmNlRXJyb3IoJ0xlZnQgc2lkZSBvZiBhc3NpZ25tZW50IGlzIG5vdCBhIHJlZmVyZW5jZS4nKSk7XG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLkdhbW1hLmFwcGx5KHVuZGVmaW5lZCwgbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSArIDEpKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSB0aGlzLmNvbnN0cnVjdG9yKXtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAqIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKHRoaXMudmFsdWUgKyB4LnZhbHVlKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY2FsUmVhbCh0aGlzLnZhbHVlIC0geC52YWx1ZSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNhbFJlYWwodGhpcy52YWx1ZSAvIHgudmFsdWUpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA+IDApIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljYWxSZWFsKE1hdGgucG93KHRoaXMudmFsdWUsIHgudmFsdWUpKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUaGlzIHdpbGwgcHJvZHVjZSB1Z2x5IGRlY2ltYWxzLiBNYXliZSB3ZSBzaG91bGQgZXhwcmVzcyBpdCBpbiBwb2xhciBmb3JtPyFcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnBvdygtdGhpcy52YWx1ZSwgeC52YWx1ZSlcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gTWF0aC5QSSAqIHgudmFsdWU7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5Db21wbGV4KHIqTWF0aC5jb3ModGhldGEpLCByKk1hdGguc2luKHRoZXRhKSk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleCh0aGlzLnZhbHVlICogeC5fcmVhbCwgdGhpcy52YWx1ZSAqIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSAtIHguX3JlYWwsIC14Ll9pbWFnKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHguX3JlYWwgKiB4Ll9yZWFsICsgeC5faW1hZyAqIHguX2ltYWc7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgoKHRoaXMudmFsdWUgKiB4Ll9yZWFsKS9jY19kZCwgKC10aGlzLnZhbHVlKnguX2ltYWcpL2NjX2RkKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBhID0gdGhpcy52YWx1ZTtcbi8vICAgICAgICAgICAgICAgICB2YXIgYyA9IHguX3JlYWw7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGQgPSB4Ll9pbWFnO1xuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0JhZCBpbXBsZW1lbnRhdGlvbiAoIG51bSBeIGNvbXBsZXgpJyk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IDAuNSAqIE1hdGgubG9nKGEqYSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0gKiBkO1xuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBNYXRoLmV4cChobG0gKiBjKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uQ29tcGxleChcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguY29zKGhtbGRfdGMpKSxcbi8vICAgICAgICAgICAgICAgICAgICAgKGVfaG1sY190ZCAqIE1hdGguc2luKGhtbGRfdGMpKVxuLy8gICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4vLyAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgeFswXS5hcHBseShvcGVyYXRvciwgdGhpcyksXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICB4WzBdLmFwcGx5KG9wZXJhdG9yLCB0aGlzKSxcbi8vICAgICAgICAgICAgICAgICAgICAgeFsxXS5hcHBseShvcGVyYXRvciwgdGhpcylcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignaW5lZmZlY2llbnQ6IE5SIF4gQ0wnKTtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpLmFwcGx5KG9wZXJhdG9yLCB4KTtcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIpIHtcbi8vICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKGErYmkpK0FlXihpaylcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgICAgIC8vIG9yID8gcmV0dXJuIHRoaXMuYXBwbHkob3BlcmF0b3IsIHgucmVhbGltYWcoKSk7IC8vSnVtcCB1cCB0byBhYm92ZSArLVxuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHhbMF0uYXBwbHkob3BlcmF0b3IsIHRoaXMpLFxuLy8gICAgICAgICAgICAgICAgICAgICB4WzFdXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJysnOlxuLy8gICAgICAgICAgICAgY2FzZSAnLSc6XG4vLyAgICAgICAgICAgICBjYXNlICcvJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID09PSAwKXtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhyb3coJ04oMCkgXiB4Jyk7XG4vLyAgICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgIGlmKHRoaXMudmFsdWUgPiAwKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAobmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsKC10aGlzLnZhbHVlKSkuYXBwbHkoJ14nLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5waS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICBzd2l0Y2gob3BlcmF0b3IpIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gJyonO1xuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgb3BlcmF0b3IpO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgaWYodGhpcy52YWx1ZSA9PT0gMCl7XG4vLyAgICAgICAgICAgICAgICAgICAgIHRocm93KCdOKDApIF4geCcpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBpZih0aGlzLnZhbHVlID4gMCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCBvcGVyYXRvcik7XG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgRXhwcmVzc2lvbi5MaXN0LlJlYWwoWyhuZXcgTnVtZXJpY2FsUmVhbCgtdGhpcy52YWx1ZSkpLCB4XSwgJ14nKSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbC5waS5hcHBseSgnKicsIHgpXG4vLyAgICAgICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vICAgICB0aHJvdygnPz8gLSByZWFsJyk7XG4vLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sIG9wZXJhdG9yKTtcbi8vIH07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi9OdW1lcmljYWxSZWFsJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUmF0aW9uYWw7XG5cbnV0aWwuaW5oZXJpdHMoUmF0aW9uYWwsIHN1cCk7XG5cbmZ1bmN0aW9uIFJhdGlvbmFsKGEsIGIpIHtcbiAgICB0aGlzLmEgPSBhO1xuICAgIHRoaXMuYiA9IGI7XG59XG5cbnZhciBfID0gUmF0aW9uYWwucHJvdG90eXBlO1xuXG5cbl8uX19kZWZpbmVHZXR0ZXJfXyhcInZhbHVlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5hIC8gdGhpcy5iO1xufSk7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgKyB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU3dhcHBlZCBvcGVyYXRvciBvcmRlciBmb3IgKyB3aXRoIFJhdGlvbmFsJyk7XG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICAgICAgLy8gdGhyb3cgKCdVbmtub3duIFR5cGUgZm9yIFJhdGlvbmFsICsnKTtcbiAgICB9XG4gICAgXG4gICAgXG59O1xuXG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHRoaXMuYSA9PT0gMCkge1xuICAgICAgICByZXR1cm4geFsnQC0nXSgpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgUmF0aW9uYWwpe1xuICAgICAgICAvKlxuICAgICAgICAgICAgYSAgIGMgICAgIGFkICAgY2IgICAgYWQgKyBiY1xuICAgICAgICAgICAgLSArIC0gID0gIC0tICsgLS0gPSAgLS0tLS0tLVxuICAgICAgICAgICAgYiAgIGQgICAgIGJkICAgYmQgICAgICBiIGRcbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIG5ldyBSYXRpb25hbCh0aGlzLmEgKiB4LmIgLSB0aGlzLmIgKiB4LmEsIHRoaXMuYiAqIHguYik7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgodGhpcy52YWx1ZSAtIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeFsnQC0nXSgpKVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKSB7IFxuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4WydALSddKCkpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdCkge1xuICAgICAgICByZXR1cm4gKHhbJ0AtJ10oKSlbJysnXSh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1N3YXBwZWQgb3BlcmF0b3Igb3JkZXIgZm9yIC0gd2l0aCBSYXRpb25hbCcpO1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgICAgIC8vIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBSYXRpb25hbCArJyk7XG4gICAgfVxufTtcblxuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5hLCB0aGlzLmIgKiB4LmIpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RveXBlWycqJ10uY2FsbCh0aGlzLCB4KTtcbn07XG5cblxuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcy5hID09PSAwKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBSYXRpb25hbCl7XG4gICAgICAgIGlmICh4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdEaXZpc2lvbiBCeSBaZXJvIGlzIG5vdCBkZWZpbmVkIGZvciBSYXRpb25hbCBudW1iZXJzIScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUmF0aW9uYWwodGhpcy5hICogeC5iLCB0aGlzLmIgKiB4LmEpLnJlZHVjZSgpO1xuICAgIH1cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnLyddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggPT09IEdsb2JhbC5aZXJvKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIH1cbiAgICBpZih4ID09PSBHbG9iYWwuT25lKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZih0aGlzLmEgPT09IHRoaXMuYikge1xuICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IFJhdGlvbmFsKFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5hLCB4LmEpLFxuICAgICAgICAgICAgTWF0aC5wb3codGhpcy5iLCB4LmEpXG4gICAgICAgICk7XG4gICAgfSBlbHNlIGlmICh4IGluc3RhbmNlb2YgUmF0aW9uYWwpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBmID0geC5yZWR1Y2UoKTtcbiAgICAgICAgaWYoZi5hICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoTWF0aC5wb3coTWF0aC5wb3codGhpcy5hLCBmLmEpLCAxIC8gZi5iKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsLnByb3RvdHlwZVsnXiddLmNhbGwoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgeFxuICAgICAgICApO1xuICAgICAgICBcbiAgICB9XG5cbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJ14nKTtcbiAgICBcbn07XG5cbl8ucmVkdWNlID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIG11dGFibGUuXG4gICAgZnVuY3Rpb24gZ2NkKGEsIGIpIHtcbiAgICAgICAgaWYoYiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdjZChiLCBhICUgYik7XG4gICAgfVxuICAgIHZhciBnID0gZ2NkKHRoaXMuYiwgdGhpcy5hKTtcbiAgICB0aGlzLmEgLz0gZztcbiAgICB0aGlzLmIgLz0gZztcbiAgICBpZih0aGlzLmIgPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkludGVnZXIodGhpcy5hKTtcbiAgICB9XG4gICAgaWYodGhpcy5iIDwgMCkge1xuICAgICAgICB0aGlzLmEgPSAtdGhpcy5hO1xuICAgICAgICB0aGlzLmIgPSAtdGhpcy5iO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbn0pKCkiLCIoZnVuY3Rpb24oKXt2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgPSByZXF1aXJlKCcuL1JhdGlvbmFsJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZWdlcjtcblxudXRpbC5pbmhlcml0cyhJbnRlZ2VyLCBzdXApO1xuXG5mdW5jdGlvbiBJbnRlZ2VyKHgpIHtcbiAgICB0aGlzLmEgPSB4O1xufVxuXG52YXIgXyA9IEludGVnZXIucHJvdG90eXBlO1xuXG5fLmIgPSAxO1xuXG5fWycrJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IEludGVnZXIodGhpcy5hICsgeC5hKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbn07XG5cbl9bJy0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgLSB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnLSddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWycvJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIGlmKHRoaXMuYSAlIHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAvIHguYSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBzdXAodGhpcy5hLCB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4gc3VwLnByb3RvdHlwZVsnLyddLmNhbGwodGhpcywgeCk7XG59O1xuXG5fWydALSddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgSW50ZWdlcigtdGhpcy5hKTtcbn07XG5cbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggaW5zdGFuY2VvZiBJbnRlZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW50ZWdlcih0aGlzLmEgKiB4LmEpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xufTtcblxuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKE1hdGgucG93KHRoaXMuYSwgeC5hKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBzdXApIHtcbiAgICAgICAgdmFyIGYgPSB4LnJlZHVjZSgpO1xuICAgICAgICBpZihmLmEgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbChNYXRoLnBvdyhNYXRoLnBvdyh0aGlzLmEsIGYuYSksIDEgLyBmLmIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwucHJvdG90eXBlWydeJ10uY2FsbChcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIHhcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTGlzdC5SZWFsIHx8IHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5hID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIHhcbiAgICAgICAgICAgIF0sICdeJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbC5wcm90b3R5cGVbJ14nXS5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICB4XG4gICAgKTtcbiAgICBcbn07XG5cbl9bJyUnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEludGVnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlZ2VyKHRoaXMuYSAlIHguYSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBzdXApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBzdXAoKTsvLyBAdG9kbzogIVxuICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHRoaXMgJSB4LnZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xuICAgIH1cbn07XG5cbl8uX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd4LXNoYWRlci94LWZyYWdtZW50Jykge1xuICAgICAgICByZXR1cm4gbmV3IENvZGUodGhpcy5hLnRvU3RyaW5nKCkgKyAnLjAnKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMuYS50b1N0cmluZygpKTtcbn07XG59KSgpIiwiKGZ1bmN0aW9uKCl7dmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi9FeHByZXNzaW9uJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHMsIGJhc2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHMgPT09ICcnIHx8IHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBcbiAgICB2YXIgcm9vdCA9IE9iamVjdC5jcmVhdGUoe30pO1xuICAgIHZhciBjb250ZXh0ID0gcm9vdDtcbiAgICBcbiAgICB2YXIgZnJlZSA9IHt9O1xuICAgIHZhciBib3VuZCA9IHt9O1xuICAgIFxuICAgIGZ1bmN0aW9uIGRvd24odmFycykge1xuICAgICAgICB2YXIgcGFyZW50ID0gY29udGV4dDtcbiAgICAgICAgY29udGV4dCA9IE9iamVjdC5jcmVhdGUoY29udGV4dCk7XG4gICAgICAgIGNvbnRleHQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSBpbiB2YXJzKSB7XG4gICAgICAgICAgICBpZiAodmFycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHRbaV0gPSB2YXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHVwKGVudGl0eSkge1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dC4kcGFyZW50O1xuICAgICAgICByZXR1cm4gZW50aXR5O1xuICAgIH1cbiAgICAvKlxuICAgICAgICBFdmFsdWF0ZSBBU1QgdHJlZSAodG9wLWRvd24pXG4gICAgICAgIFxuICAgICAgICBFeGFtcGxlczpcbiAgICAgICAgICAgICogeT14XjJcbiAgICAgICAgICAgICAgICBbJz0nLCB5LCBbJ14nLCB4LCAyXV1cbiAgICBcbiAgICAqL1xuICAgIHZhciBsb29zZSA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIGV2YWx1YXRlKGFzdCkge1xuICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciBzeW1ib2w7XG4gICAgICAgICAgICBpZiAoKHN5bWJvbCA9IGNvbnRleHRbYXN0XSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgoc3ltYm9sID0gYmFzZVthc3RdKSkge1xuICAgICAgICAgICAgICAgIGJvdW5kW2FzdF0gPSBzeW1ib2w7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyZWVbYXN0XSA9IHN5bWJvbCA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKGFzdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb290W2FzdF0gPSBzeW1ib2w7XG4gICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICB9IGVsc2UgaWYgKGFzdC5wcmltaXRpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLkNvbnN0cnVjdFthc3QudHlwZV0oYXN0LnByaW1pdGl2ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFzdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGFzdDEgPSBldmFsdWF0ZShhc3RbMV0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoYXN0Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXN0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZyYWMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgYXN0WzBdID0gJy8nO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ18nOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYmluZCB1bmRlcm5lYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXN0WzFdID09PSAnc3VtJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IGFzdFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGltaXRbMF0gPT09ICc9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkdW1teSB2YXJpYWJsZTogXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4ID0gbmV3IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwobGltaXRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG93ZXIgbGltaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGEgPSBldmFsdWF0ZShsaW1pdFsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdW1taW5hdG9yID0gbmV3IEV4cHJlc3Npb24uU3VtLlJlYWwoeCwgYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1bW1pbmF0b3IudmFycyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdW1taW5hdG9yLnZhcnNbeC5zeW1ib2xdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1bW1pbmF0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhc3RbMF0gPT09ICdkZWZhdWx0JyAmJiBhc3QxLnZhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgZG93bihhc3QxLnZhcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFzdDFbYXN0WzBdXShldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSByZXN1bHQudmFycztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVwKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhc3QxW2FzdFswXV0oZXZhbHVhdGUoYXN0WzJdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXN0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXN0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NxcnQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5zcXJ0LmRlZmF1bHQoZXZhbHVhdGUoYXN0WzFdKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBldmFsdWF0ZShhc3RbMV0pW2FzdFswXV0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhc3QubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV2YWx1YXRlKGFzdFsxXSlbYXN0WzBdXShldmFsdWF0ZShhc3RbMV0pLCBldmFsdWF0ZShhc3RbMl0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN0O1xuICAgIH1cbiAgICBcbiAgICBcbiAgICAvLyBQYXJzZSB1c2luZyBjb250ZXh0IGZyZWUgZ3JhbW1hciAoW2dyYXBoXS9ncmFtbWFyL2NhbGN1bGF0b3Iuamlzb24pXG4gICAgdmFyIGFzdCA9IHRoaXMuY2ZnLnBhcnNlKHMpO1xuICAgIHZhciByZXN1bHQgPSBldmFsdWF0ZShhc3QpO1xuICAgIHJlc3VsdC5fYXN0ID0gYXN0O1xuICAgIGlmIChyb290ICE9PSBjb250ZXh0KSB7XG4gICAgICAgIHRocm93KCdDb250ZXh0IHN0aWxsIG9wZW4nKTtcbiAgICB9XG4gICAgXG4gICAgcmVzdWx0LnVuYm91bmQgPSBmcmVlO1xuICAgIHJlc3VsdC5ib3VuZCA9IGJvdW5kO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5cblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdDtcblxudXRpbC5pbmhlcml0cyhMaXN0LCBzdXApO1xuXG4vKlxuICAgIEV4cHJlc3Npb24uTGlzdCBzaG91bGQgYmUgYXZvaWRlZCB3aGVuZXZlciBFeHByZXNzaW9uLkxpc3QuUmVhbCBjYW5cbiAgICBiZSB1c2VkLiBIb3dldmVyLCBrbm93aW5nIHdoZW4gdG8gdXNlIFJlYWwgaXMgYW4gaW1wb3NzaWJsZSAoPykgdGFzayxcbiAgICBzbyBzb21ldGltZXMgdGhpcyB3aWxsIGhhdmUgdG8gZG8gYXMgYSBmYWxsYmFjay5cbiovXG5mdW5jdGlvbiBMaXN0KGUsIG9wZXJhdG9yKSB7XG4gICAgZS5fX3Byb3RvX18gPSBFeHByZXNzaW9uLkxpc3QucHJvdG90eXBlO1xuICAgIGUub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICByZXR1cm4gZTtcbn1cblxuTGlzdC5wcm90b3R5cGUuX3MgPSBmdW5jdGlvbiAoQ29kZSwgbGFuZykge1xuICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwucHJvdG90eXBlLl9zLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIHRocm93KG5ldyBFcnJvcignVXNlIHJlYWwoKSwgaW1hZygpLCBvciBhYnMoKSwgb3IgYXJnKCkgZmlyc3QuJykpO1xufTtcblxuTGlzdC5wcm90b3R5cGUuc3ViID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgYSA9IHRoaXNbMF0uc3ViKHgsIHkpO1xuICAgIHZhciBiID0gdGhpc1sxXSAmJiB0aGlzWzFdLnN1Yih4LCB5KTtcblxuICAgIHJldHVybiBhW3RoaXMub3BlcmF0b3IgfHwgJ2RlZmF1bHQnXShiKTtcbn07IiwiKGZ1bmN0aW9uKCl7dmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL2dsb2JhbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbDtcblxudXRpbC5pbmhlcml0cyhTeW1ib2wsIHN1cCk7XG5cbmZ1bmN0aW9uIFN5bWJvbChzdHIpIHtcbiAgICB0aGlzLnN5bWJvbCA9IHN0cjtcbn1cblxudmFyIF8gPSBTeW1ib2wucHJvdG90eXBlO1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB0aGlzID09PSB4ID8gR2xvYmFsLk9uZSA6IEdsb2JhbC5aZXJvO1xufTtcbl8uaW50ZWdyYXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodGhpcyA9PT0geCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCgwLjUsIDApIFsnKiddICh4IFsnXiddIChuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDIsMCkpKTtcbiAgICB9XG4gICAgcmV0dXJuICh0aGlzKSBbJyonXSAoeCk7XG59O1xuXy5zdWIgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIC8vIFRPRE86IEVuc3VyZSBpdCBpcyByZWFsIChmb3IgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbClcbiAgICByZXR1cm4gdGhpcyA9PT0geCA/IHkgOiB0aGlzO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCB4KSB7XG4gICAgcmV0dXJuIG5ldyBDb2RlKHRoaXMuc3ltYm9sIHx8ICd4X3tmcmVlfScpO1xufTtcbn0pKCkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG5cbmZ1bmN0aW9uIFRydXRoVmFsdWUodikge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVtZW50O1xuXG51dGlsLmluaGVyaXRzKFRydXRoVmFsdWUsIHN1cCk7XG51dGlsLmluaGVyaXRzKFN0YXRlbWVudCwgc3VwKTtcblxudmFyIF8gPSBUcnV0aFZhbHVlLnByb3RvdHlwZTtcblxudmFyIFRydWUgPSBUcnV0aFZhbHVlLlRydWUgPSBuZXcgVHJ1dGhWYWx1ZSgpO1xudmFyIEZhbHNlID0gVHJ1dGhWYWx1ZS5GYWxzZSA9IG5ldyBUcnV0aFZhbHVlKCk7XG5cbi8vT25seSBkaWZmZXJlbmNlOiBOT1Qgb3BlcmF0b3JcbkZhbHNlWyd+J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFRydWU7XG59O1xuXG4vLyBuZWdhdGlvbiBvcGVyYXRvclxuX1snfiddID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBGYWxzZTtcbn07XG5cbi8vIGRpc2p1bmN0aW9uXG5fLlYgPSBmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlID09PSBUcnVlID8gZSA6IHRoaXM7XG59O1xuXG4vLyBjb25qdW5jdGlvblxuX1snXiddID0gZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gZSA9PT0gVHJ1ZSA/IHRoaXMgOiBlO1xufTtcblxuXG5mdW5jdGlvbiBTdGF0ZW1lbnQoeCwgeSwgb3BlcmF0b3IpIHtcbiAgICB0aGlzLmEgPSB4O1xuICAgIHRoaXMuYiA9IHk7XG5cbiAgICB0aGlzLm9wZXJhdG9yID0gb3BlcmF0b3I7XG59XG5cbnZhciBfID0gU3RhdGVtZW50LnByb3RvdHlwZTtcbl9bJz0nXSA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbn07XG5fWyc8J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gYSA8IGIgPCBjXG4gICAgLy8gKGEgPCBiKSA9IGJcbiAgICAvLyBiIDwgY1xuICAgIFxuICAgIC8vIGEgPCAoYiA8IGMpXG4gICAgLy8gYSA8IGIgLi4gKGIgPCBjKSA9IGJcbiAgICAvLyAoYSA8IGIpID0gYS5cbn07XG5fLnNvbHZlID0gZnVuY3Rpb24gKHZhcnMpIHtcbiAgICAvLyBhID0gYlxuICAgIC8vIElmIGIgaGFzIGFuIGFkZGl0aXZlIGludmVyc2U/XG4gICAgXG4gICAgLy8gYSAtIGIgPSAwXG4gICAgdmFyIGFfYiA9ICh0aGlzLmEpWyctJ10odGhpcy5iKTtcbiAgICAvKlxuICAgIEV4YW1wbGVzOlxuICAgICgxLDIsMykgLSAoeCx5LHopID0gMCAoc29sdmUgZm9yIHgseSx6KVxuICAgICgxLDIsMykgLSB4ID0gMCAoc29sdmUgZm9yIHgpXG4gICAgKi9cbiAgICByZXR1cm4gYV9iLnJvb3RzKHZhcnMpO1xufTtcbiIsIihmdW5jdGlvbigpey8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xudmFyIEV4cHJlc3Npb24gID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgR2xvYmFsID0gcmVxdWlyZSgnLi4vLi4vZ2xvYmFsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yO1xuXG5mdW5jdGlvbiBWZWN0b3IoZSkge1xuICAgIGUuX19wcm90b19fID0gVmVjdG9yLnByb3RvdHlwZTtcbiAgICByZXR1cm4gZTtcbn1cblxudXRpbC5pbmhlcml0cyhWZWN0b3IsIHN1cCk7XG5cbnZhciBfID0gVmVjdG9yLnByb3RvdHlwZTtcblxuX1snLC4nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIFZlY3RvcihBcnJheS5wcm90b3R5cGUuY29uY2F0LmNhbGwodGhpcywgW3hdKSk7XG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjLmRpZmZlcmVudGlhdGUoeCk7XG4gICAgfSkpO1xufTtcbl8uY3Jvc3MgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0aGlzLmxlbmd0aCAhPT0gMyB8fCB4Lmxlbmd0aCAhPT0gMykge1xuICAgICAgICB0aHJvdygnQ3Jvc3MgcHJvZHVjdCBvbmx5IGRlZmluZWQgZm9yIDNEIHZlY3RvcnMuJyk7XG4gICAgfVxuICAgIC8qXG4gICAgaSAgIGogICAga1xuICAgIHggICB5ICAgIHpcbiAgICBhICAgYiAgICBjXG4gICAgXG4gICAgPSAoeWMgLSB6YiwgemEgLSB4YywgeGIgLSB5YSlcbiAgICAqL1xuICAgIFxuICAgIHJldHVybiBuZXcgVmVjdG9yKFtcbiAgICAgICAgdGhpc1sxXS5kZWZhdWx0KHhbMl0pWyctJ10odGhpc1syXS5kZWZhdWx0KHhbMV0pKSxcbiAgICAgICAgdGhpc1syXS5kZWZhdWx0KHhbMF0pWyctJ10odGhpc1swXS5kZWZhdWx0KHhbMl0pKSxcbiAgICAgICAgdGhpc1swXS5kZWZhdWx0KHhbMV0pWyctJ10odGhpc1sxXS5kZWZhdWx0KHhbMF0pKVxuICAgIF0pO1xufTtcblxuLy8gY3Jvc3NQcm9kdWN0IGlzIHRoZSAnJnRpbWVzOycgY2hhcmFjdGVyXG52YXIgY3Jvc3NQcm9kdWN0ID0gU3RyaW5nLmZyb21DaGFyQ29kZSgyMTUpO1xuXG5fW2Nyb3NzUHJvZHVjdF0gPSBfLmNyb3NzO1xuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmICh4IGluc3RhbmNlb2YgVmVjdG9yKSB7XG4gICAgICAgIC8vIERvdCBwcm9kdWN0XG4gICAgICAgIGlmKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdygnVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaTtcbiAgICAgICAgdmFyIHN1bSA9IEdsb2JhbC5aZXJvO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBzdW0gPSBzdW1bJysnXShcbiAgICAgICAgICAgICAgICAodGhpc1tpXSkuZGVmYXVsdCh4W2ldKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5hcHBseSh4KTtcbiAgICAgICAgfSkpO1xuICAgIH1cbn07XG5fWycqJ10gPSBfLmRlZmF1bHQ7XG5fWycrJ10gPSBmdW5jdGlvbiAoeCwgb3ApIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIGlmKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgIHRocm93KG5ldyBNYXRoRXJyb3IoJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJykpO1xuICAgIH1cbiAgICB2YXIgaTtcbiAgICB2YXIgbiA9IG5ldyBBcnJheShsKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5baV0gPSB0aGlzW2ldW29wIHx8ICcrJ10oeFtpXSk7XG4gICAgfVxuICAgIHJldHVybiBWZWN0b3Iobik7XG59O1xuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gdGhpc1snKyddKHgsICctJyk7XG59O1xuX1snLyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIFZlY3Rvcikge1xuICAgICAgICB0aHJvdygnVmVjdG9yIGRpdmlzaW9uIG5vdCBkZWZpbmVkJyk7XG4gICAgfVxuICAgIHJldHVybiBWZWN0b3IoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBjWycvJ10oeCk7XG4gICAgfSkpO1xuICAgIFxufTtcbl9bJ14nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93KCdSYWlzZWQgdG8gemVybyBwb3dlcicpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHguYSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHguYSA9PT0gMikge1xuICAgICAgICAgICAgdmFyIFMgPSBHbG9iYWwuWmVybztcbiAgICAgICAgICAgIHZhciBpLCBsID0gdGhpcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgUyA9IFNbJysnXSh0aGlzW2ldWydeJ10oeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1snXiddKG5ldyBFeHByZXNzaW9uLkludGVnZXIoeC5hIC0gMSkpWycqJ10odGhpcyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpe1xuICAgICAgICByZXR1cm4gdGhpc1snXiddKHguYSlbJ14nXShHbG9iYWwuT25lWycvJ10oeC5iKSk7XG4gICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLk51bWVyaWNhbENvbXBsZXgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkNvbXBsZXgodGhpcy52YWx1ZSArIHguX3JlYWwsIHguX2ltYWcpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbikge1xuICAgICAgICAvLyBjb21tdXRlXG4gICAgICAgIHJldHVybiAoeClbJysnXSh0aGlzKTtcbiAgICB9IGVsc2UgaWYoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcikgeyBcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICByZXR1cm4gKHgpWycrJ10odGhpcyk7XG4gICAgfSBlbHNlIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSBpZih4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QpIHtcbiAgICAgICAgcmV0dXJuICh4KVsnKyddKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICgnVW5rbm93biBUeXBlIGZvciBWZWN0b3IgXicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0KHRoaXNbJ14nXSh4WyctJ10oR2xvYmFsLk9uZSkpKTtcbn07XG5cbl8ub2xkX2FwcGx5X29wZXJhdG9yID0gZnVuY3Rpb24ob3BlcmF0b3IsIGUpIHtcbiAgICB2YXIgbCA9IHRoaXMubGVuZ3RoO1xuICAgIHZhciBpO1xuICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAgICAgY2FzZSAnLCc6XG4gICAgICAgICAgICAvL0FycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMsIFtlXSk7XG4gICAgICAgICAgICAvL0Zhc3RlcjpcbiAgICAgICAgICAgIC8vTU9ESUZJRVMhISEhISEhISFcbiAgICAgICAgICAgIHRoaXNbbF0gPSBlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgICAgICBjYXNlICcqJzpcbiAgICAgICAgICAgIGlmKGwgIT09IGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBEaW1lbnNpb24gbWlzbWF0Y2guJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3VtID0gTS5HbG9iYWwuWmVybztcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzdW0gPSBzdW0uYXBwbHkoJysnLCB0aGlzW2ldLmFwcGx5KCcqJywgZVtpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN1bTtcbiAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgaWYobCAhPT0gZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aHJvdygnVmVjdG9yIERpbWVuc2lvbiBtaXNtYXRjaC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuID0gbmV3IEFycmF5KGwpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIG5baV0gPSB0aGlzW2ldLmFwcGx5KG9wZXJhdG9yLCBlW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBWZWN0b3Iobik7XG4gICAgICAgIGNhc2UgJy8nOlxuICAgICAgICBjYXNlICdeJzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3coJ1ZlY3RvciBvcGVyYXRpb24gbm90IGFsbG93ZWQuJyk7XG4gICAgfVxufTtcblxuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgX3ggPSBuZXcgQXJyYXkobCk7XG4gICAgdmFyIF95ID0gbmV3IEFycmF5KGwpO1xuICAgIHZhciBpO1xuICAgIGZvcihpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgcmkgPSB0aGlzW2ldLnJlYWxpbWFnKCk7XG4gICAgICAgIF94W2ldID0gcmlbMF07XG4gICAgICAgIF95W2ldID0gcmlbMV07XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIFZlY3RvcihfeCksXG4gICAgICAgIFZlY3RvcihfeSlcbiAgICBdKTtcbn07XG5cbl8uX3MgPSBmdW5jdGlvbihDb2RlLCBsYW5nKSB7XG4gICAgdmFyIGwgPSB0aGlzLmxlbmd0aDtcbiAgICB2YXIgb3BlbiA9ICdbJztcbiAgICB2YXIgY2xvc2UgPSAnXSc7XG4gICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgIG9wZW4gPSAndmVjJyArIHRoaXMubGVuZ3RoICsgJygnO1xuICAgICAgICBjbG9zZSA9ICcpJztcbiAgICB9XG4gICAgdmFyIGMgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgIHZhciBpO1xuICAgIHZhciB0X3MgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBjX2kgPSB0aGlzW2ldLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICB0X3MucHVzaChjX2kucyk7XG4gICAgICAgIGMgPSBjLm1lcmdlKGNfaSk7XG4gICAgfVxuICAgIHJldHVybiBjLnVwZGF0ZShvcGVuICsgdF9zLmpvaW4oJywnKSArIGNsb3NlLCBJbmZpbml0eSk7XG59O1xufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcbnZhciBFeHByZXNzaW9uID0gcmVxdWlyZSgnLi4vJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRUZ1bmN0aW9uO1xuXG51dGlsLmluaGVyaXRzKEVGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gRUZ1bmN0aW9uIChwKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gcC5kZWZhdWx0O1xuICAgIHRoaXNbJ3RleHQvbGF0ZXgnXSA9IChwWyd0ZXh0L2xhdGV4J10pO1xuICAgIHRoaXNbJ3gtc2hhZGVyL3gtZnJhZ21lbnQnXSA9IChwWyd4LXNoYWRlci94LWZyYWdtZW50J10pO1xuICAgIHRoaXNbJ3RleHQvamF2YXNjcmlwdCddID0gKHBbJ3RleHQvamF2YXNjcmlwdCddKTtcbiAgICB0aGlzLmRlcml2YXRpdmUgPSBwLmRlcml2YXRpdmU7XG4gICAgdGhpcy5yZWFsaW1hZyA9IHAucmVhbGltYWc7XG59O1xuXG52YXIgXyA9IEVGdW5jdGlvbi5wcm90b3R5cGU7XG5cbi8vIEBhYnN0cmFjdFxuXy5kZWZhdWx0ID0gZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuO1xufTtcblxuLy8gQGFic3RyYWN0XG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuZGVyaXZhdGl2ZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kZXJpdmF0aXZlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0VGdW5jdGlvbiBoYXMgbm8gZGVyaXZhdGl2ZSBkZWZpbmVkLicpO1xufTtcblxuXy5fcyA9IGZ1bmN0aW9uIChDb2RlLCBsYW5nKSB7XG4gICAgaWYgKHRoaXNbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb2RlKHRoaXNbbGFuZ10pO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkIG5vdCBjb21waWxlIGZ1bmN0aW9uIGludG8gJyArIGxhbmcpO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICB2YXIgYSA9IG5ldyBFeHByZXNzaW9uLlN5bWJvbCgpO1xuICAgIHJldHVybiBuZXcgRUZ1bmN0aW9uLlN5bWJvbGljKHRoaXMuZGVmYXVsdChhKVsnKyddKHgpLCBbYV0pO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgdmFyIGEgPSBuZXcgRXhwcmVzc2lvbi5TeW1ib2woKTtcbiAgICByZXR1cm4gbmV3IEVGdW5jdGlvbi5TeW1ib2xpYyh0aGlzLmRlZmF1bHQoYSlbJ0AtJ10oKSwgW2FdKTtcbn07XG5cbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3VwICA9IHJlcXVpcmUoJy4uLycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdHJpeDtcblxuZnVuY3Rpb24gTWF0cml4KGUsIHIsIGMpIHtcbiAgICBlLl9fcHJvdG9fXyA9IE1hdHJpeC5wcm90b3R5cGU7XG5cbiAgICBlLnJvd3MgPSByO1xuICAgIGUuY29scyA9IGM7XG5cbiAgICBpZiAociAhPSBjKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWF0cml4IHNpemUgbWlzbWF0Y2gnKVxuICAgIH1cblxuICAgIHJldHVybiBlO1xufVxuXG51dGlsLmluaGVyaXRzKE1hdHJpeCwgc3VwKTtcblxudmFyIF8gPSBNYXRyaXgucHJvdG90eXBlO1xuXG5fLmRlZmF1bHQgPSBfWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uTWF0cml4KSB7XG4gICAgICAgIC8vIEJyb2tlblxuICAgICAgICAvLyBPKG5eMylcbiAgICAgICAgaWYgKHgucm93cyAhPT0gdGhpcy5jb2xzKSB7XG4gICAgICAgICAgICB0aHJvdyAoJ01hdHJpeCBkaW1lbnNpb25zIGRvIG5vdCBtYXRjaC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIC8vIHJlc3VsdFt4LnJvd3MgKiB4LmNvbHMgLSAxIF0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBpLCBqLCBrLCByID0gMDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMucm93czsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgeC5jb2xzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc3VtID0gR2xvYmFsLlplcm87XG4gICAgICAgICAgICAgICAgZm9yKGsgPSAwOyBrIDwgeC5yb3dzOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtID0gc3VtWycrJ10oeFtrICogeC5jb2xzICsgal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRbcisrXSA9IHN1bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5NYXRyaXgocmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyAoJ1Vua25vd24gdHlwZScpO1xuICAgIH1cbn07XG5cbl8ucmVkdWNlID0gZnVuY3Rpb24gKGFwcCkge1xuICAgIHZhciB4LCB5O1xuICAgIGZvcih5ID0gMDsgeSA8IHRoaXMucm93czsgeSsrKSB7XG4gICAgICAgIGZvcih4ID0gMDsgeCA8IHk7IHgrKykge1xuICAgICAgICAgICAgLy8gTWFrZSB0aGlzW3gseV0gPSAwXG4gICAgICAgICAgICB2YXIgbWEgPSB0aGlzW3ggKiB0aGlzLmNvbHMgKyB4XTtcbiAgICAgICAgICAgIC8vIDAgPSB0aGlzIC0gKHRoaXMvbWEpICogbWFcbiAgICAgICAgICAgIGlmKG1hID09PSBHbG9iYWwuWmVybykge1xuICAgICAgICAgICAgICAgIHRocm93ICgnUm93IHN3YXAhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdG1hID0gdGhpc1t5ICogdGhpcy5jb2xzICsgeF1bJy8nXShtYSk7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSA9IHggKyAxOyBpIDwgdGhpcy5jb2xzOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzW3kgKiB0aGlzLmNvbHMgKyBpXSA9IHRoaXNbeSAqIHRoaXMuY29scyArIGldWyctJ10odG1hWycqJ10odGhpc1t4ICogdGhpcy5jb2xzICsgaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbiIsIihmdW5jdGlvbigpe3ZhciB1dGlsICA9IHJlcXVpcmUoJ3V0aWwnKSxcbiAgICBzdXAgICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uL2dsb2JhbCcpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbmZpbml0ZXNpbWFsO1xudXRpbC5pbmhlcml0cyhJbmZpbml0ZXNpbWFsLCBzdXApO1xuZnVuY3Rpb24gSW5maW5pdGVzaW1hbCh4KSB7XG4gICAgdGhpcy54ID0geDtcbn1cbnZhciBfID0gSW5maW5pdGVzaW1hbC5wcm90b3R5cGU7XG5cbl9bJysnXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEluZmluaXRlc2ltYWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZXNpbWFsIGFkZGl0aW9uJyk7XG4gICAgfVxuICAgIHJldHVybiB4O1xufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYoeCBpbnN0YW5jZW9mIEluZmluaXRlc2ltYWwpIHtcbiAgICAgICAgaWYoeC54IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnguZGlmZmVyZW50aWF0ZSh4LngpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uZnVzaW5nIGluZml0ZXNpbWFsIGRpdmlzaW9uJyk7XG4gICAgfVxuICAgIHRoaXMueCA9IHRoaXMueFsnLyddKHgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcbl9bJyonXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgLy8gZF4yID0gMFxuICAgIGlmKHggaW5zdGFuY2VvZiBJbmZpbml0ZXNpbWFsKSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgdGhpcy54ID0gdGhpcy54WycqJ10oeCk7XG59O1xuXy5zID0gZnVuY3Rpb24gKGxhbmcpIHtcbiAgICBpZihsYW5nICE9PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmZpbml0ZXNpbWFsIG51bWJlcnMgY2Fubm90IGJlIGV4cG9ydGVkIHRvIHByb2dyYW1taW5nIGxhbmd1YWdlcycpO1xuICAgIH1cbiAgICB2YXIgYyA9IHRoaXMueC5zKGxhbmcpO1xuICAgIHZhciBwID0gbGFuZ3VhZ2UucHJlY2VkZW5jZSgnZGVmYXVsdCcpXG4gICAgaWYocCA+IGMucCkge1xuICAgICAgICBjLnMgPSAnXFxcXGxlZnQoJyArIGMucyArICdcXFxccmlnaHQpJztcbiAgICB9XG4gICAgcmV0dXJuIGMudXBkYXRlKCdkJyArIGMucywgcCk7XG59O1xuXG59KSgpIiwiKGZ1bmN0aW9uKCl7Ly8gc3RvcCBqc2hpbnQgZnJvbSBjb21wbGFpbmcgYWJvdXQgX19wcm90b19fXG4vKmpzaGludCAtVzEwMyAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdXAgID0gcmVxdWlyZSgnLi4vJyk7XG52YXIgRXhwcmVzc2lvbiA9IHJlcXVpcmUoJy4uLy4uLycpO1xudmFyIGdsb2JhbCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dsb2JhbCcpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0UmVhbDtcblxudXRpbC5pbmhlcml0cyhMaXN0UmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gTGlzdFJlYWwoeCwgb3BlcmF0b3IpIHtcbiAgICB4Ll9fcHJvdG9fXyA9IExpc3RSZWFsLnByb3RvdHlwZTtcbiAgICBpZihvcGVyYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHgub3BlcmF0b3IgPSBvcGVyYXRvcjtcbiAgICB9XG4gICAgcmV0dXJuIHg7XG59XG5cbnZhciBfID0gTGlzdFJlYWwucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpcyxcbiAgICAgICAgZ2xvYmFsLlplcm9cbiAgICBdKTtcbn07XG5fLnJlYWwgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpcztcbn07XG5fLmltYWcgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gZ2xvYmFsLlplcm87XG59O1xuXy5wb2xhciA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc3VwLkNvbXBsZXhQb2xhcihbXG4gICAgICAgIHN1cC5SZWFsKFtnbG9iYWwuYWJzLCB0aGlzXSksXG4gICAgICAgIHN1cC5SZWFsKFtnbG9iYWwuYXJnLCB0aGlzXSlcbiAgICBdKTtcbn07XG5fLmFicyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiBzdXAuUmVhbChbZ2xvYmFsLmFicywgdGhpc10pO1xufTtcbl8uYXJnID0gZnVuY3Rpb24gKCl7XG4gICAgcmV0dXJuIHN1cC5SZWFsKFtnbG9iYWwuYXJnLCB0aGlzXSk7XG59O1xuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiB4WycqJ10obmV3IEV4cHJlc3Npb24uSW50ZWdlcigyKSk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnKycgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB0aGlzWzFdWycrJ10oeCldLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnLScgJiYgdGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdLCB4WyctJ10odGhpc1sxXSldLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKycpO1xuICAgIH1cbiAgICBcbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgcmV0dXJuIHhbJysnXSh0aGlzKTtcbiAgICBcbn07XG5fWyctJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgaWYgKHggPT09IHRoaXMpIHtcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5aZXJvO1xuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIHN1cC5SZWFsKSB7XG4gICAgICAgIGlmICh4Lm9wZXJhdG9yID09PSAnQC0nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhbMF1dLCAnKycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIHJldHVybiBzdXAuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKClbJy0nXSh4KTtcbn07XG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWwuWmVybztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycqJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3gsIHRoaXNdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2Ygc3VwLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICByZXR1cm4geFsnKiddKHRoaXMpO1xuICAgIFxufTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZih4ID09PSB0aGlzKSB7XG4gICAgICAgIHJldHVybiBnbG9iYWwuT25lO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09ICcvJykge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWycvJ10oeCksIHRoaXNbMV1dLCB0aGlzLm9wZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cblxuICAgIGlmKHggaW5zdGFuY2VvZiBzdXAuUmVhbCB8fCB4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuICAgICAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnLycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5yZWFsaW1hZygpWycvJ10oeCk7XG59O1xuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gc3VwLlJlYWwoW3RoaXMsIHhdLCAnJScpO1xufTtcbl9bJ0AtJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICByZXR1cm4gdGhpc1swXTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzXSwgJ0AtJyk7XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4gICAgICAgIGlmKHRoaXMub3BlcmF0b3IgPT09ICcqJyB8fCB0aGlzLm9wZXJhdG9yID09PSAnLycgJiYgdGhpc1swXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cC5SZWFsKFt0aGlzWzBdWydeJ10oeCksIHRoaXNbMV1bJ14nXSh4KV0sIHRoaXMub3BlcmF0b3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsLnByb3RvdHlwZVsnXiddLmNhbGwodGhpcywgeCk7XG4gICAgXG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYgKHRoaXMub3BlcmF0b3IgPT09ICcrJyB8fFxuICAgICAgICB0aGlzLm9wZXJhdG9yID09PSAnLScgfHxcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9PT0gJ0AtJykge1xuXG4gICAgICAgIHJldHVybiB0aGlzWzBdLmRpZmZlcmVudGlhdGUoeClbdGhpcy5vcGVyYXRvcl0odGhpc1sxXSAmJiB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCkpO1xuICAgIFxuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJyonIHx8IHRoaXMub3BlcmF0b3IgPT09IHVuZGVmaW5lZCkge1xuXG4gICAgICAgIGlmKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkZ1bmN0aW9uKSB7XG5cbiAgICAgICAgICAgIHZhciBkYSA9IHRoaXNbMV0uZGlmZmVyZW50aWF0ZSh4KTtcbiAgICAgICAgICAgIGlmKGRhID09PSBnbG9iYWwuWmVybykgcmV0dXJuIGRhO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpc1swXS5kaWZmZXJlbnRpYXRlKCkuZGVmYXVsdCh0aGlzWzFdKVsnKiddKGRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzWzBdW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgdGhpc1sxXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgIClbJysnXSh0aGlzWzFdW3RoaXMub3BlcmF0b3JdKFxuICAgICAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgICkpO1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcblxuICAgICAgICByZXR1cm4gdGhpc1sxXVsnKiddKFxuICAgICAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpXG4gICAgICAgIClbJy0nXShcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXShcbiAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVt0aGlzLm9wZXJhdG9yXShcbiAgICAgICAgICAgIHRoaXNbMV1bJyonXSh0aGlzWzFdKVxuICAgICAgICApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcGVyYXRvciA9PT0gJ14nKSB7XG5cbiAgICAgICAgdmFyIGRmID0gdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpO1xuICAgICAgICB2YXIgZGcgPSB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeCk7XG5cbiAgICAgICAgaWYgKGRmID09PSBnbG9iYWwuWmVybykge1xuICAgICAgICAgICAgaWYgKGRnID09PSBnbG9iYWwuWmVybykgcmV0dXJuIGRnO1xuXG4gICAgICAgICAgICByZXR1cm4gZGcuZGVmYXVsdChcbiAgICAgICAgICAgICAgICBnbG9iYWwubG9nLmRlZmF1bHQodGhpc1swXSlcbiAgICAgICAgICAgICkuZGVmYXVsdCh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmYSA9IHRoaXNbMF1bJ14nXShcbiAgICAgICAgICAgIHRoaXNbMV1bJy0nXShnbG9iYWwuT25lKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBmYS5kZWZhdWx0KFxuICAgICAgICAgICAgZGYuZGVmYXVsdCh0aGlzWzFdKVsnKyddKFxuICAgICAgICAgICAgICAgIHRoaXNbMF1bJyonXShcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsLmxvZy5kZWZhdWx0KHRoaXNbMF0pXG4gICAgICAgICAgICAgICAgKVsnKiddKFxuICAgICAgICAgICAgICAgICAgICBkZ1xuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICB9XG59O1xuXG5fLl9zID0gZnVuY3Rpb24gKENvZGUsIGxhbmcpIHtcblxuICAgIHZhciBsYW5ndWFnZSA9IENvZGUubGFuZ3VhZ2U7XG4gICAgZnVuY3Rpb24gcGFyZW4oeCkge1xuICAgICAgICBpZihsYW5nID09PSAndGV4dC9sYXRleCcpIHtcbiAgICAgICAgICAgIHJldHVybiAnXFxcXGxlZnQoJyArIHggKyAnXFxcXHJpZ2h0KSc7IFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnKCcgKyB4ICsgJyknO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcGVyYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0aGlzWzBdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5GdW5jdGlvbikge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gZ2xvYmFsLmFicykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcblxuICAgICAgICAgICAgICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzEudXBkYXRlKCdcXFxcbGVmdHwnICsgYzEucyArICdcXFxccmlnaHR8JywgSW5maW5pdHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoYzAucyArICcoJyArIGMxLnMgKyAnKScsIEluZmluaXR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICBpZiAodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMxcyA9IEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzWzFdLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgICAgICB2YXIgdF9zID0gYzFzLm1hcChmdW5jdGlvbiAoZSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlLnM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gZ2xvYmFsLmF0YW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdF9zID0gdF9zLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGMwX3MgPSBjMC5zO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjMXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYzAubWVyZ2UoYzFzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLnVwZGF0ZShjMF9zICsgcGFyZW4odF9zKSwgbGFuZ3VhZ2Uub3BlcmF0b3JzLmRlZmF1bHQucHJlY2VkZW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBjMC5zICsgcGFyZW4oYzEucyksIGxhbmd1YWdlLm9wZXJhdG9ycy5kZWZhdWx0LnByZWNlZGVuY2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vcGVyYXRvciA9ICcqJztcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgcCA9IGxhbmd1YWdlLm9wZXJhdG9yc1t0aGlzLm9wZXJhdG9yXS5wcmVjZWRlbmNlO1xuICAgIGZ1bmN0aW9uIF8oeCkge1xuICAgICAgICBpZihwID4geC5wKXtcbiAgICAgICAgICAgIHJldHVybiBwYXJlbih4LnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4LnM7XG4gICAgfVxuXG4gICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJ14nKSB7XG5cbiAgICAgICAgaWYobGFuZyA9PT0gJ3gtc2hhZGVyL3gtZnJhZ21lbnQnKSB7XG4gICAgICAgICAgICBpZih0aGlzWzBdID09PSBnbG9iYWwuZSkge1xuICAgICAgICAgICAgICAgIHZhciBjMSA9IHRoaXNbMV0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMxLnVwZGF0ZSgnZXhwKCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIgJiYgdGhpc1sxXS5hIDwgNSAmJiB0aGlzWzFdLmEgPiAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgdmFyIGogPSBsYW5ndWFnZS5vcGVyYXRvcnNbJyonXS5wcmVjZWRlbmNlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBwcmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdmFyIGNzO1xuICAgICAgICAgICAgICAgIGlmKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICAgICAgICAgICAgICBjcyA9IGMwLnM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNzID0gYzAudmFyaWFibGUoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHByZSA9ICdmbG9hdCAnICsgY3MgKyAnID0gJyArIGMwLnMgKyAnOyc7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzID0gY3M7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICAgICAgZm9yKGkgPSAxOyBpIDwgdGhpc1sxXS5hOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcys9ICcqJyArIGNzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAudXBkYXRlKCcoJyArIHMgKyAnKScsIEluZmluaXR5LCBwcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhpc1sxXSBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlciAmJiB0aGlzWzFdLmEgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIC8vIHRvZG86IHByZWNlZGVuY2Ugbm90IG5lY2Vzc2FyeVxuICAgICAgICAgICAgICAgIHJldHVybiBjMC51cGRhdGUoJygxLjAvKCcgKyBjMC5zICsgJykpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0aGlzWzFdIGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgICAgIC8vIGFeMiwgMywgNCwgNSwgNiBcbiAgICAgICAgICAgICAgICAvLyB1bnN1cmUgaXQgaXMgZ2NkXG4gICAgICAgICAgICAgICAgdGhpc1sxXSA9IHRoaXNbMV0ucmVkdWNlKCk7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW4gPSB0aGlzWzFdLmEgJSAyID8gZmFsc2UgOiB0cnVlO1xuICAgICAgICAgICAgICAgIGlmKGV2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGMwID0gdGhpc1swXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ3BvdygnICsgYzAucyArICcsJyArIGMxLnMgICsgJyknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHheKGEpID0gKHgpICogeF4oYS0xKVxuICAgICAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oZ2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uc18oQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICcoKCcgKyBjMC5zICsgJykgKiBwb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJykpJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXNbMF0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwpIHtcblxuICAgICAgICAgICAgICAgIC8vIE5lZyBvciBwb3MuXG4gICAgICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXVsnLSddKGdsb2JhbC5PbmUpLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnKCgnICsgYzAucyArICcpICogcG93KCcgKyBjMC5zICsgJywnK2MxLnMrJykpJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdWyctJ10oZ2xvYmFsLk9uZSkuX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gTmVlZHMgYSBuZXcgZnVuY3Rpb24sIGRlcGVuZGVudCBvbiBwb3dlci5cbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJygoJyArIGMwLnMgKyAnKSAqIHBvdygnICsgYzAucyArICcsJytjMS5zKycpKScpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSBpZihsYW5nID09PSAndGV4dC9qYXZhc2NyaXB0Jykge1xuICAgICAgICAgICAgaWYodGhpc1swXSA9PT0gZ2xvYmFsLmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjMS51cGRhdGUoJ01hdGguZXhwKCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGMxID0gdGhpc1sxXS5fcyhDb2RlLCBsYW5nKTtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG5cbiAgICAgICAgICAgIGlmKHRoaXNbMV0gaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgLy8gYV4yLCAzLCA0LCA1LCA2IFxuICAgICAgICAgICAgICAgIHZhciBldmVuID0gdGhpc1sxXS5hICUgMiA/IGZhbHNlIDogdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmKGV2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCAnTWF0aC5wb3coJyArIGMwLnMgKyAnLCcgKyBjMS5zICsgJyknKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gTmVlZHMgYSBuZXcgZnVuY3Rpb24sIGRlcGVuZGVudCBvbiBwb3dlci5cbiAgICAgICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdNYXRoLnBvdygnICsgYzAucyArICcsJyArIGMxLnMgKyAnKScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSBpZiAobGFuZyA9PT0gJ3RleHQvbGF0ZXgnKXtcbiAgICAgICAgICAgIHZhciBjMCA9IHRoaXNbMF0uX3MoQ29kZSwgbGFuZyk7XG4gICAgICAgICAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgICAgICAgICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArICdeJyArICd7JyArIGMxLnMgKyAnfScpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgYzAgPSB0aGlzWzBdLl9zKENvZGUsIGxhbmcpO1xuXG4gICAgaWYodGhpcy5vcGVyYXRvclswXSA9PT0gJ0AnKSB7XG4gICAgICAgIHJldHVybiBjMC51cGRhdGUodGhpcy5vcGVyYXRvclsxXSArIF8oYzApLCBwKTtcbiAgICB9XG5cbiAgICB2YXIgYzEgPSB0aGlzWzFdLl9zKENvZGUsIGxhbmcpO1xuICAgIFxuICAgIGlmKGxhbmcgPT09ICd0ZXh0L2xhdGV4Jykge1xuICAgICAgICBpZih0aGlzLm9wZXJhdG9yID09PSAnLycpIHtcbiAgICAgICAgICAgIHJldHVybiBjMC5tZXJnZShjMSwgJ1xcXFxmcmFjeycgKyBjMC5zICsgJ317JyArIGMxLnMgKyAnfScpXG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyonKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsIF8oYzApICsgXyhjMSksIHApO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChsYW5nID09PSAneC1zaGFkZXIveC1mcmFnbWVudCcpIHtcbiAgICAgICAgaWYodGhpcy5vcGVyYXRvciA9PT0gJyUnKSB7XG4gICAgICAgICAgICByZXR1cm4gYzAubWVyZ2UoYzEsICdtb2QoJyArIF8oYzApICsgJywnICsgXyhjMSkgKyAnKScsIHApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGMwLm1lcmdlKGMxLCBfKGMwKSArIHRoaXMub3BlcmF0b3IgKyBfKGMxKSwgcCk7XG59O1xuXG5cbn0pKCkiLCIvLyBzdG9wIGpzaGludCBmcm9tIGNvbXBsYWluZyBhYm91dCBfX3Byb3RvX19cbi8qanNoaW50IC1XMTAzICovXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xudmFyIHN1cCAgPSByZXF1aXJlKCcuLi8nKTtcblxuLypcbiAgICBUaGlzIHR5cGUgaXMgYW4gYXR0ZW1wdCB0byBhdm9pZCBoYXZpbmcgdG8gY2FsbCAucmVhbGltYWcoKSBkb3duIHRoZSB0cmVlIGFsbCB0aGUgdGltZS5cbiAgICBcbiAgICBNYXliZSB0aGlzIGlzIGEgYmFkIGlkZWEsIGJlY2F1c2UgaXQgd2lsbCBlbmQgdXAgaGF2aW5nOlxuICAgIFxuICAgIGYoeCkgPSA+XG4gICAgW1xuICAgICAgICBSZV9mKHgpLFxuICAgICAgICBJbV9mKHgpXG4gICAgICAgIFxuICAgIF1cbiAgICB3aGljaCByZXF1aXJlcyB0d28gZXZhbHVhdGlvbnMgb2YgZih4KS5cblxuKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV4Q2FydGVzaWFuO1xuXG51dGlsLmluaGVyaXRzKENvbXBsZXhDYXJ0ZXNpYW4sIHN1cCk7XG5cbmZ1bmN0aW9uIENvbXBsZXhDYXJ0ZXNpYW4oeCkge1xuICAgIHguX19wcm90b19fID0gQ29tcGxleENhcnRlc2lhbi5wcm90b3R5cGU7XG4gICAgcmV0dXJuIHg7XG59XG5cbnZhciBfID0gQ29tcGxleENhcnRlc2lhbi5wcm90b3R5cGU7XG5cbl8ucmVhbGltYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzWzBdO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpc1sxXTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF0sXG4gICAgICAgIHRoaXNbMV0uYXBwbHkoJ0AtJylcbiAgICBdKTtcbn07XG5cbl9bJ0AtJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBuZXcgQ29tcGxleENhcnRlc2lhbihbXG4gICAgICAgIHRoaXNbMF1bJ0AtJ10oKSxcbiAgICAgICAgdGhpc1sxXVsnQC0nXSgpXG4gICAgXSk7XG59O1xuX1snKiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIENvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgLy8gKGErYmkpICogKGMrZGkpID0gYWMgKyBhZGkgKyBiY2kgLSBiZFxuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKiddKHhbMF0pWyctJ10odGhpc1sxXVsnKiddKHhbMV0pKSxcbiAgICAgICAgICAgIHRoaXNbMF1bJyonXSh4WzFdKVsnKyddKHRoaXNbMV1bJyonXSh4WzBdKSlcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKiddKHgpLFxuICAgICAgICAgICAgdGhpc1sxXVsnKiddKHgpXG4gICAgICAgIF0pO1xuICAgIH1cbn07XG5fWydeJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkludGVnZXIpIHtcblxuICAgICAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gR2xvYmFsLk9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQmlub21pYWwgZXhwYW5zaW9uXG4gICAgICAgIC8vIChhK2IpXk5cbiAgICAgICAgdmFyIG4gID0geC5hO1xuICAgICAgICB2YXIgaztcbiAgICAgICAgdmFyIGEgPSB0aGlzWzBdO1xuICAgICAgICB2YXIgYiA9IHRoaXNbMV07XG4gICAgICAgIHZhciBuZWdvbmUgPSBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKC0xKTtcbiAgICAgICAgdmFyIGltYWdfcGFydCA9IEdsb2JhbC5aZXJvO1xuICAgICAgICBcbiAgICAgICAgdmFyIHJlYWxfcGFydCA9IGFbJ14nXShcbiAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIobilcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaSA9IDE7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGsgPSAxOzsgaysrKSB7XG4gICAgICAgICAgICB2YXIgZXhwcjtcbiAgICAgICAgICAgIGlmKGsgPT09IG4pIHtcbiAgICAgICAgICAgICAgICBleHByID0gKFxuICAgICAgICAgICAgICAgICAgICBiWydeJ10oXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRXhwcmVzc2lvbi5JbnRlZ2VyKGspXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChjaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZWFsX3BhcnQgPSByZWFsX3BhcnRbJysnXShleHByKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGltYWdfcGFydCA9IGltYWdfcGFydFsnKyddKGV4cHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2kgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICBpbWFnX3BhcnQgPSBpbWFnX3BhcnRbJy0nXShleHByKTtcbiAgICAgICAgICAgICAgICAgICAgY2kgPSAtMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cHIgPSBhWydeJ10oXG4gICAgICAgICAgICAgICAgbmV3IEV4cHJlc3Npb24uSW50ZWdlcihuIC0gaylcbiAgICAgICAgICAgIClbJyonXShcbiAgICAgICAgICAgICAgICBiWydeJ10oXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFeHByZXNzaW9uLkludGVnZXIoaylcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGNpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAxKSB7XG4gICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WycrJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAyKSB7XG4gICAgICAgICAgICAgICAgcmVhbF9wYXJ0ID0gcmVhbF9wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNpID09PSAzKSB7XG4gICAgICAgICAgICAgICAgaW1hZ19wYXJ0ID0gaW1hZ19wYXJ0WyctJ10oZXhwcik7XG4gICAgICAgICAgICAgICAgY2kgPSAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2krKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgcmVhbF9wYXJ0LFxuICAgICAgICAgICAgaW1hZ19wYXJ0XG4gICAgICAgIF0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG59O1xuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCBpbnN0YW5jZW9mIENvbXBsZXhDYXJ0ZXNpYW4pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgICAgIHRoaXNbMF1cbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGlmICh4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwgfHwgeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IENvbXBsZXhDYXJ0ZXNpYW4oW1xuICAgICAgICAgICAgdGhpc1swXVsnKyddKHgpLFxuICAgICAgICAgICAgdGhpc1sxXVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgXG59O1xuXG5fLmRpZmZlcmVudGlhdGUgPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXS5kaWZmZXJlbnRpYXRlKHgpLFxuICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICBdKTtcbn07XG5cblxuLy8gXy5hcHBseU9sZCA9IGZ1bmN0aW9uKG8sIHgpIHtcbi8vICAgICAvL1RPRE86IGVuc3VyZSB0aGlzIGhhcyBhbiBpbWFnaW5hcnkgcGFydC4gSWYgaXQgZG9lc24ndCBpdCBpcyBhIGh1Z2Ugd2FzdGUgb2YgY29tcHV0YXRpb25cbi8vICAgICBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICBzd2l0Y2gobykge1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkobywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkobywgeFsxXSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgICAgIC8vRnVuY3Rpb24gZXZhbHVhdGlvbj8gTk8uIFRoaXMgaXMgbm90IGEgZnVuY3Rpb24uIEkgdGhpbmsuXG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4WzBdKS5hcHBseSgnLScsIHRoaXNbMV0uYXBwbHkoJyonLCB4WzFdKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4WzFdKS5hcHBseSgnKycsIHRoaXNbMV0uYXBwbHkoJyonLCB4WzBdKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIHZhciBjY19kZCA9IHhbMF0uYXBwbHkoJyonLCB4WzBdKS5hcHBseSgnKycsIHhbMV0uYXBwbHkoJyonLCB4WzFdKSk7XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIENvbXBsZXhDYXJ0ZXNpYW4oW1xuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1swXS5hcHBseSgnKicseFswXSkuYXBwbHkoJysnLHRoaXNbMV0uYXBwbHkoJyonLHhbMV0pKSkuYXBwbHkoJy8nLCBjY19kZCksXG4vLyAgICAgICAgICAgICAgICAgICAgICh0aGlzWzFdLmFwcGx5KCcqJyx4WzBdKS5hcHBseSgnLScsdGhpc1swXS5hcHBseSgnKicseFsxXSkpKS5hcHBseSgnLycsIGNjX2RkKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnXic6XG4vLyAgICAgICAgICAgICAgICAgLy9UaGUgbW9zdCBjb25mdXNpbmcgb2YgdGhlbSBhbGw6XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhhbGYgPSBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKDAuNSwgMCk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhsbSA9IGhhbGYuYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICBHbG9iYWwubG9nLmFwcGx5KHVuZGVmaW5lZCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vVGhlIG1hZ25pdHVkZTogaWYgdGhpcyB3YXMgZm9yIGEgcG9sYXIgb25lIGl0IGNvdWxkIGJlIGZhc3QuXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzBdXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICApLmFwcGx5KCcrJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gR2xvYmFsLmF0YW4yLmFwcGx5KHVuZGVmaW5lZCwgRXhwcmVzc2lvbi5WZWN0b3IoW3RoaXNbMV0sIHRoaXNbMF1dKSk7XG4vLyAgICAgICAgICAgICAgICAgdmFyIGhtbGRfdGMgPSBobG0uYXBwbHkoJyonLCB4WzFdKS5hcHBseSgnKycsIHRoZXRhLmFwcGx5KCcqJywgeFswXSkpO1xuICAgICAgICAgICAgICAgIFxuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBHbG9iYWwuZXhwLmFwcGx5KHVuZGVmaW5lZCxcbi8vICAgICAgICAgICAgICAgICAgICAgaGxtLmFwcGx5KCcqJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGJbMF1cbi8vICAgICAgICAgICAgICAgICAgICAgKS5hcHBseSgnLScsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGV0YS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYlsxXVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICAgICApXG4vLyAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBcblxuLy8gICAgICAgICAgICAgICAgIHZhciBlX2htbGNfdGQgPSBHbG9iYWwuZS5hcHBseSgnXicsXG4vLyAgICAgICAgICAgICAgICAgICAgIGhsbS5hcHBseSgnKicsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB4WzBdXG4vLyAgICAgICAgICAgICAgICAgICAgICkuYXBwbHkoJy0nLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhldGEuYXBwbHkoJyonLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhbMV1cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIClcbi8vICAgICAgICAgICAgICAgICAgICAgKVxuLy8gICAgICAgICAgICAgICAgICk7XG5cbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQ29tcGxleENhcnRlc2lhbihbXG4vLyAgICAgICAgICAgICAgICAgICAgIChlX2htbGNfdGQuYXBwbHkoJyonLEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCBobWxkX3RjKSkpLFxuLy8gICAgICAgICAgICAgICAgICAgICAoZV9obWxjX3RkLmFwcGx5KCcqJyxHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgaG1sZF90YykpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICAgICAgYnJlYWs7XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKXtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vKHgreWkpL0EqZV4oaWspXG4vLyAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0geFswXS5hcHBseSgnKicsIHhbMF0pO1xuLy8gICAgICAgICAgICAgICAgIHZhciBiID0geC5yZWFsaW1hZygpO1xuLy8gICAgICAgICAgICAgICAgIC8vQ2xlYW4gdGhpcyB1cD8gU3ViP1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBDb21wbGV4Q2FydGVzaWFuKFtcbi8vICAgICAgICAgICAgICAgICAgICAgKHRoaXNbMF0uYXBwbHkoJyonLGJbMF0pLmFwcGx5KCcrJyxhWzFdLmFwcGx5KCcqJyxiWzFdKSkpLmFwcGx5KCcvJywgY2NfZGQpLFxuLy8gICAgICAgICAgICAgICAgICAgICAodGhpc1sxXS5hcHBseSgnKicsYlswXSkuYXBwbHkoJy0nLGFbMF0uYXBwbHkoJyonLGJbMV0pKSkuYXBwbHkoJy8nLCBjY19kZClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vaHR0cDovL3d3dy53b2xmcmFtYWxwaGEuY29tL2lucHV0Lz9pPVJlJTI4JTI4eCUyQnlpJTI5JTVFJTI4QSplJTVFJTI4aWslMjklMjklMjlcbi8vICAgICAgICAgICAgICAgICAvLyh4K3lpKV4oQSplXihpaykpXG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgICAgIH1cbi8vICAgICB9IGVsc2UgaWYgKHguY29uc3RydWN0b3IgPT09IEV4cHJlc3Npb24uQ29tcGxleCkge1xuLy8gICAgICAgICByZXR1cm4gdGhpcy5hcHBseShvLCB4LnJlYWxpbWFnKCkpO1xuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5TeW1ib2wuUmVhbCkge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdEdXBsaWNhdGVkIGFuIHghIFRoaXMgbWFrZXMgaXQgZGlmZmljdWx0IHRvIHNvbHZlIGNvbXBsZXggZXF1YXRpb25zLCBJIHRoaW5rJyk7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKCdEdXBsaWNhdGVkIGFuIHghIFRoaXMgbWFrZXMgaXQgZGlmZmljdWx0IHRvIHNvbHZlIGNvbXBsZXggZXF1YXRpb25zLCBJIHRoaW5rJyk7XG4vLyAgICAgICAgIHJldHVybiB0aGlzLmFwcGx5KG8sIHgucmVhbGltYWcoKSk7XG4vLyAgICAgfVxuLy8gICAgIHRocm93KCdDTVBMWC5MSVNUICogJyArIG8pO1xuLy8gfTtcbiIsIi8vIHN0b3AganNoaW50IGZyb20gY29tcGxhaW5nIGFib3V0IF9fcHJvdG9fX1xuLypqc2hpbnQgLVcxMDMgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyksXG4gICAgc3VwICA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGV4UG9sYXI7XG5cbnV0aWwuaW5oZXJpdHMoQ29tcGxleFBvbGFyLCBzdXApO1xuXG5mdW5jdGlvbiBDb21wbGV4UG9sYXIgKHgpe1xuICAgIHguX19wcm90b19fID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcbiAgICByZXR1cm4geDtcbn1cbnZhciBfID0gQ29tcGxleFBvbGFyLnByb3RvdHlwZTtcblxuXy5wb2xhciA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXy5yZWFsaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vVE9ETzogUmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuXG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIEdsb2JhbC5jb3MuYXBwbHkodW5kZWZpbmVkLCB0aGlzWzFdKSksXG4gICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuc2luLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpXG4gICAgXSk7XG59O1xuXy5yZWFsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbMF0uYXBwbHkoJyonLCBHbG9iYWwuY29zLmFwcGx5KHVuZGVmaW5lZCwgdGhpc1sxXSkpO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzWzBdLmFwcGx5KCcqJywgR2xvYmFsLnNpbi5hcHBseSh1bmRlZmluZWQsIHRoaXNbMV0pKTtcbn07XG5fLmNvbmp1Z2F0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDb21wbGV4UG9sYXIoW1xuICAgICAgICB0aGlzWzBdLFxuICAgICAgICB0aGlzWzFdLmFwcGx5KCdALScpXG4gICAgXSk7XG59O1xuXy5kaWZmZXJlbnRpYXRlID0gZnVuY3Rpb24oeCl7XG4gICAgLy8gZC9keCBhKHgpICogZV4oaWIoeCkpXG4gICAgXG4gICAgLy9UT0RPIGVuc3VyZSBiZWxvdyAgZicgKyBpZiBnJyBwYXJ0IGlzIHJlYWxpbWFnIChmJywgZmcnKVxuICAgIHJldHVybiBHbG9iYWwuZVxuICAgIC5hcHBseShcbiAgICAgICAgJ14nLFxuICAgICAgICBHbG9iYWwuaVxuICAgICAgICAuYXBwbHkoJyonLFxuICAgICAgICAgICAgdGhpc1sxXVxuICAgICAgICApXG4gICAgKVxuICAgIC5hcHBseSgnKicsXG4gICAgICAgIHRoaXNbMF0uZGlmZmVyZW50aWF0ZSh4KVxuICAgICAgICAuYXBwbHkoJysnLFxuICAgICAgICAgICAgR2xvYmFsLmlcbiAgICAgICAgICAgIC5hcHBseSgnKicsXG4gICAgICAgICAgICAgICAgdGhpc1swXVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmFwcGx5KCcqJyxcbiAgICAgICAgICAgICAgICB0aGlzWzFdLmRpZmZlcmVudGlhdGUoeClcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICk7XG59O1xuLy8gXy5hcHBseSA9IGZ1bmN0aW9uKG8sIHgpIHtcbi8vICAgICBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gdGhpcy5jb25zdHJ1Y3Rvcikge1xuLy8gICAgICAgICBzd2l0Y2ggKG8pIHtcbi8vICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuLy8gICAgICAgICAgICAgY2FzZSAnKic6XG4vLyAgICAgICAgICAgICAgICAgLy9GYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcqJywgeFswXSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJysnLCB4WzFdKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4WzBdKSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXS5hcHBseSgnLScsIHhbMV0pXG4vLyAgICAgICAgICAgICAgICAgXSk7XG4vLyAgICAgICAgICAgICBjYXNlICcrJzpcbi8vICAgICAgICAgICAgIGNhc2UgJy0nOlxuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBzbG93LCBtYXliZSB3ZSBzaG91bGQgc3dpdGNoIHRvIGNhcnRlc2lhbiBub3c/XG4gICAgICAgICAgICBcbi8vICAgICAgICAgICAgIGNhc2UgJ14nOlxuLy8gICAgICAgICAgICAgICAgIC8vKEFlXihpaykpIF4gKEJlXihpaikpXG4vLyAgICAgICAgICAgICAgICAgLy9Ib3cgc2xvdyBpcyB0aGlzP1xuLy8gICAgICAgICAgICAgICAgIC8vVmVyeSBmYXN0IGZvciByZWFsIG51bWJlcnMgdGhvdWdoXG4vLyAgICAgICAgICAgICBjYXNlICchJzpcbi8vICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBcbi8vICAgICAgICAgfVxuLy8gICAgIH0gZWxzZSBpZiAoeC5jb25zdHJ1Y3RvciA9PT0gRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKSB7XG4vLyAgICAgICAgIHN3aXRjaCAobykge1xuLy8gICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4vLyAgICAgICAgICAgICBjYXNlICcqJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJyonLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnLyc6XG4vLyAgICAgICAgICAgICAgICAgLy9BbHNvIGZhc3Rcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhQb2xhcihbXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMF0uYXBwbHkoJy8nLCB4KSxcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1sxXVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvL0Zhc3Q6XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcqJywgeClcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJyEnOlxuLy8gICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIFxuLy8gICAgICAgICB9XG4vLyAgICAgfSBlbHNlIGlmICh4LmNvbnN0cnVjdG9yID09PSBFeHByZXNzaW9uLkNvbXBsZXgpIHtcbi8vICAgICAgICAgc3dpdGNoIChvKSB7XG4vLyAgICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbi8vICAgICAgICAgICAgIGNhc2UgJyonOlxuLy8gICAgICAgICAgICAgICAgIC8vRmFzdFxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyKFtcbi8vICAgICAgICAgICAgICAgICAgICAgdGhpc1swXS5hcHBseSgnKicsIG5ldyBFeHByZXNzaW9uLk51bWVyaWNhbFJlYWwoeC5fcmVhbCkpLFxuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzFdLmFwcGx5KCcrJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9pbWFnKSlcbi8vICAgICAgICAgICAgICAgICBdKTtcbi8vICAgICAgICAgICAgIGNhc2UgJy8nOlxuLy8gICAgICAgICAgICAgICAgIC8vQWxzbyBmYXN0XG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuLy8gICAgICAgICAgICAgICAgICAgICB0aGlzWzBdLmFwcGx5KCcvJywgbmV3IEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCh4Ll9yZWFsKSksXG4vLyAgICAgICAgICAgICAgICAgICAgIHRoaXNbMV0uYXBwbHkoJy0nLCBuZXcgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsKHguX2ltYWcpKVxuLy8gICAgICAgICAgICAgICAgIF0pO1xuLy8gICAgICAgICAgICAgY2FzZSAnKyc6XG4vLyAgICAgICAgICAgICBjYXNlICctJzpcbi8vICAgICAgICAgICAgICAgICAvL1Zlcnkgc2xvdywgbWF5YmUgd2Ugc2hvdWxkIHN3aXRjaCB0byBjYXJ0ZXNpYW4gbm93P1xuICAgICAgICAgICAgXG4vLyAgICAgICAgICAgICBjYXNlICdeJzpcbi8vICAgICAgICAgICAgICAgICAvLyhBZV4oaWspKSBeIChCZV4oaWopKVxuLy8gICAgICAgICAgICAgICAgIC8vSG93IHNsb3cgaXMgdGhpcz9cbi8vICAgICAgICAgICAgICAgICAvL1ZlcnkgZmFzdCBmb3IgcmVhbCBudW1iZXJzIHRob3VnaFxuLy8gICAgICAgICAgICAgY2FzZSAnISc6XG4vLyAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgXG4vLyAgICAgICAgIH1cbi8vICAgICB9XG4gICAgXG4vLyB9O1xuXy5hYnMgPSBmdW5jdGlvbiAoKXtcbiAgICByZXR1cm4gdGhpc1swXTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uICgpe1xuICAgIHJldHVybiB0aGlzWzFdO1xufTtcbiIsIihmdW5jdGlvbigpe3ZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCAgPSByZXF1aXJlKCcuLi8nKSxcbiAgICBHbG9iYWwgPSByZXF1aXJlKCcuLi8uLi8uLi9nbG9iYWwnKTtcblxudmFyIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xfUmVhbDtcblxudXRpbC5pbmhlcml0cyhTeW1ib2xfUmVhbCwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9sX1JlYWwoc3RyKSB7XG4gICAgdGhpcy5zeW1ib2wgPSBzdHI7XG59XG5cbnZhciBfID0gU3ltYm9sX1JlYWwucHJvdG90eXBlO1xuXG5fLnJlYWxpbWFnID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFt0aGlzLCBHbG9iYWwuWmVyb10pO1xufTtcbl8ucmVhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzO1xufTtcbl8uaW1hZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBHbG9iYWwuWmVybztcbn07XG5fLnBvbGFyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLFxuICAgICAgICBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXG4gICAgXSk7XG59O1xuXy5hYnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW0dsb2JhbC5hYnMsIHRoaXNdKTtcbn07XG5fLmFyZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pO1xufTtcblxuX1snKyddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCA9PT0gR2xvYmFsLlplcm8pIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJysnKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICcrJyk7XG4gICAgfVxuICAgIHJldHVybiB4WycrJ10odGhpcyk7XG59O1xuX1snLSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih0aGlzID09PSB4KSB7XG4gICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sLlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLkxpc3QuUmVhbCkge1xuICAgICAgICBpZiAoeC5vcGVyYXRvciA9PT0gJ0AtJykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeFswXV0sICcrJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICctJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB4WydALSddKClbJysnXSh0aGlzKTtcbn07XG5cbl9bJ0ArJ10gPSBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpc10sICdAKycpO1xufTtcblxuX1snQC0nXSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgJ0AtJyk7XG59O1xuXG5fWycqJ10gPSBmdW5jdGlvbiAoeCkge1xuXG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSB4LmIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5aZXJvO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlN5bWJvbC5SZWFsKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnKicpO1xuICAgIH1cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5MaXN0LlJlYWwpIHtcbiAgICAgICAgcmV0dXJuIHhbJyonXSh0aGlzKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsUmVhbCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt4LCB0aGlzXSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTnVtZXJpY2FsQ29tcGxleCkge1xuICAgICAgICByZXR1cm4gbmV3IEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCB4XSwgJyonKTtcbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKSB7XG4gICAgICAgIHJldHVybiB4WycqJ10odGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB4WycqJ10odGhpcyk7XG59O1xuXy5hcHBseSA9IF9bJyonXTtcbl9bJy8nXSA9IGZ1bmN0aW9uICh4KSB7XG5cbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IHguYikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uUmF0aW9uYWwpIHtcbiAgICAgICAgaWYoeC5hID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdygnRGl2aXNpb24gYnkgemVybycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICcvJyk7XG59O1xuX1snXiddID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICBpZih4LmEgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmKHggaW5zdGFuY2VvZiBFeHByZXNzaW9uLlJhdGlvbmFsKSB7XG4gICAgICAgIGlmKHguYSA9PT0geC5iKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoeCBpbnN0YW5jZW9mIEV4cHJlc3Npb24uSW50ZWdlcikge1xuICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnXicpO1xuICAgIH0gZWxzZSBpZih4IGluc3RhbmNlb2YgRXhwcmVzc2lvbi5SYXRpb25hbCkge1xuICAgICAgICB2YXIgZiA9IHgucmVkdWNlKCk7XG4gICAgICAgIGlmKGYuYSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgeF0sICdeJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdChbdGhpcywgeF0sICdeJyk7XG59O1xuX1snJSddID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIHhdLCAnJScpO1xufTtcbl8uYXBwbHlPbGQgPSBmdW5jdGlvbihvcGVyYXRvciwgZSkge1xuICAgIHRocm93KFwiUmVhbC5hcHBseVwiKTtcbiAgICAvLyBpZiAob3BlcmF0b3IgPT09ICcsJykge1xuICAgIC8vICAgICAvL01heWJlIHRoaXMgc2hvdWxkIGJlIGEgbmV3IG9iamVjdCB0eXBlPz8/IFZlY3Rvcj9cbiAgICAvLyAgICAgY29uc29sZS5sb2coJ0FQUExZOiAnLCB0aGlzLmNvbnN0cnVjdG9yLCB0aGlzLCBlKTtcbiAgICAvLyAgICAgcmV0dXJuIEV4cHJlc3Npb24uVmVjdG9yKFt0aGlzLCBlXSk7XG4gICAgLy8gfSBlbHNlIGlmIChvcGVyYXRvciA9PT0gJz0nKSB7XG4gICAgLy8gICAgIHJldHVybiBFeHByZXNzaW9uLkVxdWF0aW9uKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vIH1cbiAgICAvLyBpZiAoZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gICAgIC8vVW5hcnk6XG4gICAgLy8gICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICAvLyAgICAgICAgIGNhc2UgJyEnOlxuICAgIC8vICAgICAgICAgICAgIC8vVE9ETzogQ2FuJ3Qgc2ltcGxpZnksIHNvIHdoeSBib3RoZXIhIChyZXR1cm4gYSBsaXN0LCBzaW5jZSBnYW1tYSBtYXBzIGFsbCByZWFscyB0byByZWFscz8pXG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5HYW1tYS5hcHBseSh1bmRlZmluZWQsIHRoaXMuYXBwbHkoJysnLCBHbG9iYWwuT25lKSk7XG4gICAgLy8gICAgICAgICBjYXNlICdALSc6XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgZGVmYXVsdDpcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICB0aHJvdygnUmVhbCBTeW1ib2woJyt0aGlzLnN5bWJvbCsnKSBjb3VsZCBub3QgaGFuZGxlIG9wZXJhdG9yICcrIG9wZXJhdG9yKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgICAvLyBTaW1wbGlmaWNhdGlvbjpcbiAgICAvLyAgICAgc3dpdGNoIChlLmNvbnN0cnVjdG9yKXtcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5TeW1ib2wuUmVhbDpcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LlJlYWw6XG4gICAgLy8gICAgICAgICAgICAgLyppZih0aGlzLnBvc2l0aXZlICYmIGUucG9zaXRpdmUpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgIH0qL1xuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogQmFkIGlkZWE/IFRoaXMgd2lsbCBzdGF5IGluIHRoaXMgZm9ybSB1bnRpbCByZWFsaW1hZygpIGlzIGNhbGxlZCBieSB1c2VyLCBhbmQgdXNlciBvbmx5LlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgLy9yZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLCBlXSwnXicpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtlLCBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXSwnKicpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnKicpO1xuICAgIC8vICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5OdW1lcmljYWxSZWFsOlxuICAgIC8vICAgICAgICAgICAgIHN3aXRjaChvcGVyYXRvcil7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICcqJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuWmVybztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sICcqJyk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FzZSAnJSc6XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0LlJlYWwoW3RoaXMsIGVdLCAnJScpO1xuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICdeJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGlmKGUudmFsdWUgPT09IDEpe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKGUudmFsdWUgPT09IDApe1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHbG9iYWwuT25lO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZmFsc2UgJiYgb3BlbmdsX1RPRE9faGFjaygpICYmIGUudmFsdWUgPT09IH5+ZS52YWx1ZSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5SZWFsKFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4UG9sYXIoW1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFicywgdGhpc10pLCBlXSwnXicpLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIEV4cHJlc3Npb24uTGlzdC5SZWFsKFtlLCBFeHByZXNzaW9uLkxpc3QuUmVhbChbR2xvYmFsLmFyZywgdGhpc10pXSwnKicpXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaWYoZS52YWx1ZSA9PT0gMSl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoZS52YWx1ZSA9PT0gMCl7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdsb2JhbC5JbmZpbml0eTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuUmVhbChbdGhpcywgZV0sIG9wZXJhdG9yKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgIC8vICAgICAgICAgICAgIH1cbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5Db21wbGV4OlxuICAgIC8vICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWxpbWFnKCkuYXBwbHkob3BlcmF0b3IsIGUpOyAvLyBHTyB0byBhYm92ZSAod2lsbCBhcHBseSByZWFscylcbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIGNhc2UgRXhwcmVzc2lvbi5MaXN0LkNvbXBsZXhDYXJ0ZXNpYW46XG4gICAgLy8gICAgICAgICAgICAgLy9NYXliZSB0aGVyZSBpcyBhIHdheSB0byBzd2FwIHRoZSBvcmRlcj8gKGUuZy4gYSAucmVhbCA9IHRydWUgcHJvcGVydHkgZm9yIG90aGVyIHRoaW5ncyB0byBjaGVjaylcbiAgICAvLyAgICAgICAgICAgICAvL29yIGluc3RhbmNlIG9mIEV4cHJlc3Npb24uUmVhbCA/XG4gICAgLy8gICAgICAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJysnOlxuICAgIC8vICAgICAgICAgICAgICAgICBjYXNlICctJzpcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseShvcGVyYXRvciwgZVswXSksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgZVsxXVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgdW5kZWZpbmVkOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSAnKic7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJyonOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEV4cHJlc3Npb24uTGlzdC5Db21wbGV4Q2FydGVzaWFuKFtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzBdKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KG9wZXJhdG9yLCBlWzFdKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgICAgIGNhc2UgJy8nOlxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgdmFyIGNjX2RkID0gZVswXS5hcHBseSgnKicsZVswXSkuYXBwbHkoJysnLGVbMV0uYXBwbHkoJyonLGVbMV0pKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBFeHByZXNzaW9uLkxpc3QuQ29tcGxleENhcnRlc2lhbihbXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMuYXBwbHkoJyonLGVbMF0pKS5hcHBseSgnLycsIGNjX2RkKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5KCcqJyxlWzFdKS5hcHBseSgnLycsIGNjX2RkKS5hcHBseSgnQC0nKVxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY2FzZSBFeHByZXNzaW9uLkxpc3QuQ29tcGxleFBvbGFyOlxuICAgIC8vICAgICAgICAgICAgIC8vTWF5YmUgdGhlcmUgaXMgYSB3YXkgdG8gc3dhcCB0aGUgb3JkZXI/XG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHRoaXMucG9sYXIoKS5hcHBseShvcGVyYXRvciwgZSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgdGhyb3coJ0xJU1QgRlJPTSBSRUFMIFNZTUJPTCEgJysgb3BlcmF0b3IsIGUuY29uc3RydWN0b3IpO1xuICAgIC8vICAgICByZXR1cm4gRXhwcmVzc2lvbi5MaXN0KFt0aGlzLCBlXSwgb3BlcmF0b3IpO1xuICAgIC8vIH1cbn07XG5cblxufSkoKSIsInZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpLFxuICAgIHN1cCA9IHJlcXVpcmUoJy4uLycpLFxuICAgIEV4cHJlc3Npb24gPSByZXF1aXJlKCcuLi8uLi8nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xpY0VGdW5jdGlvbjtcblxudXRpbC5pbmhlcml0cyhTeW1ib2xpY0VGdW5jdGlvbiwgc3VwKTtcblxuZnVuY3Rpb24gU3ltYm9saWNFRnVuY3Rpb24oZXhwciwgdmFycykge1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gICAgdGhpcy5zeW1ib2xzID0gdmFycztcbiAgICBcbn07XG52YXIgXyA9IFN5bWJvbGljRUZ1bmN0aW9uLnByb3RvdHlwZTtcbl8uZGVmYXVsdCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHguY29uc3RydWN0b3IgIT09IEV4cHJlc3Npb24uVmVjdG9yKSB7XG4gICAgICAgIHggPSBFeHByZXNzaW9uLlZlY3RvcihbeF0pO1xuICAgIH1cbiAgICB2YXIgZXhwciA9IHRoaXMuZXhwcjtcbiAgICB2YXIgaSwgbCA9IHRoaXMuc3ltYm9scy5sZW5ndGg7XG4gICAgaWYgKGwgIT09IHgubGVuZ3RoKSB7XG4gICAgICAgIHRocm93ICgnSW52YWxpZCBkb21haW4uIEVsZW1lbnQgb2YgRl4nICsgbCArICcgZXhwZWN0ZWQuJyk7XG4gICAgfVxuICAgIGZvcihpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBleHByID0gZXhwci5zdWIodGhpcy5zeW1ib2xzW2ldLCB4W2ldKVxuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbn07Il19
;