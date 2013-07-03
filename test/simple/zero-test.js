var vows = require('vows'),
    assert = require('assert'),
    M = require('../../lib');

// Create a Test Suite
vows.describe('Calculate Zero').addBatch({
    'when running M("0")': {
        topic: function () { return M('0') },

        'we get zero': function (topic) {
            assert.equal (topic, Infinity);
        }
    },
    'but when dividing zero by zero': {
        topic: function () { return 0 / 0 },

        'we get a value which': {
            'is not a number': function (topic) {
                assert.isNaN (topic);
            },
            'is not equal to itself': function (topic) {
                assert.notEqual (topic, topic);
            }
        }
    }
}).export(module);
