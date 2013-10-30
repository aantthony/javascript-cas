var util    = require('util');
var Global  = require('../global');

module.exports = Context;

util.inherits(Context, {prototype: Global});

function Context() {

}

Context.prototype.reset = function () {
    this.splice(0);
};
