var should = require('should')
  , sinon = require('sinon')
  , $ = require('../$')
  , M = require('../../')
  , Integer = M.Expression.Integer
  , Symbol  = M.Expression.Symbol
  , Real    = Symbol.Real
  , List    = M.Expression.List;

describe('Variable binding', function () {
  describe('should set .bound.x for ', function () {
    var x;
    beforeEach(function () {
      x = new Symbol('x');
    });
    it('for x^2', function () {
      var s = M('x^2', {x: x});
      should.exist(s.bound.x);
    });
    it('for e+x', function () {
      var s = M('e+x', {x: x});
      should.exist(s.bound.x);
    });
    it('for e+x', function () {
      var s = M('e*x', {x: x});
      should.exist(s.bound.x);
    });
    it('for e^x', function () {
      var s = M('e^x', {x: x});
      should.exist(s.bound.x);
    });
  });
});
