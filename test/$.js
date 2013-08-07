exports = module.exports = function (str) {
    var repl = [
        [/\\in/g, '∈'],
        [/\\notin/g, '∉'],
        [/\\to/g, '→'],
        [/\\implies/g, '⇒'],
        [/\\Integer/g, 'ℤ'],
        [/\\Rational/g, 'ℚ'],
        [/\\cdot/g, '·'],
        [/\\if/g, '⇐']
    ];

    repl.forEach(function (e) {
        str = str.replace(e[0], e[1]);
    });
    return str;
};
