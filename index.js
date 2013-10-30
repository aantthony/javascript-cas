'use strict';

var dir = './lib';
if (process.env.COVERAGE){
  dir = './lib-cov';
}

var M = require(dir);

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
