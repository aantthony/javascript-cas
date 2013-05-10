var util = require('util');

function Language(parser, Construct, language) {
    this.cfg = parser;
    this.Construct = Construct;
    var operators = this.operators = {},
        opPrecedence = 0;
    function op(v, associativity, arity) {

    }
    language.forEach(function (o) {
        var str = o[0];
        var associativity = o[1] || 'left';
        var arity = (o[2] === undefined) ? 2 : o[2];

        operators[str] =  {
            associativity: associativity,
            precedence: opPrecedence++,
            arity: arity
        };
    });
}
var _ = Language.prototype;

_.parse = require('./parse');


_.postfix == function (str) {
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