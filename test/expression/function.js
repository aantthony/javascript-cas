var should = require('should'),
    sinon = require('sinon'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe('Functions', function () {
    it('should be able to be mapped via symbolic functions', function () {
        var k = {};

        var js = function (s) {
            return s === k ? new Integer(1) : new Integer(0);
        };

        var fn = new M.Expression.Function({default: js});

        var neg = fn['@-']();

    });
});
