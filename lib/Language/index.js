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
            var associativity = o[1] || 0;
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
    return this.operators[str].associativity === 0;
};



module.exports = Language;
