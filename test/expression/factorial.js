var should = require('should'),
    sinon = require('sinon'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe('Factorial', function () {
    it('should be parsed correctly', function () {
      var s = M('3!');

      s.should.be.an.instanceof(Integer);
      s.a.should.equal(6);

    });
});
