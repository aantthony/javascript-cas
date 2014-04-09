exports = module.exports = function (str) {
    var repl = [
        [/\\in/g, '∈'],
        [/\\notin/g, '∉'],
        [/\\to/g, '→'],
        [/\\implies/g, '⇒'],
        [/\\Integer/g, 'ℤ'],
        [/\\Rational/g, 'ℚ'],
        [/\\nabla/g, '∇'],
        [/\\cdot/g, '·'],
        [/\\List.Real/g, 'ℝ{*}'],
        [/\\Symbol.Real/g, 'ℝ{A}'],
        [/\\Real/g, 'ℝ'],
        [/\\if/g, '⇐']
    ];

    repl.forEach(function (e) {
        str = str.replace(e[0], e[1]);
    });
    return str;
};
