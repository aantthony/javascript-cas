javascript-cas
==============

Javascript CAS is a simple computer algebra system designed for client-side use in web apps (and node.js).

Including math.js in your web pages will create a single global object `M(str, context)`, which is a function that parses a latex expression string.

```javascript
var y = M('x^2 + 3');

// Differentiate with respect to x
var dy = y.differentiate(y.unbound.x);

// Compile a javascript function
var fn = dy.compile('x');

// now evaluation of the deriviative is fast:
var x = fn(3.1); // Returns a javascript number.
```

[![Build Status](https://travis-ci.org/aantthony/javascript-cas.png?branch=master)](https://travis-ci.org/aantthony/javascript-cas) [![Coverage Status](https://coveralls.io/repos/aantthony/javascript-cas/badge.png?branch=master)](https://coveralls.io/r/aantthony/javascript-cas?branch=master)

### Features
- Parsing latex expressions efficiently
- Differentiation
Export string representations of functions:
 - javascript: `.s('text/javascript');`
 - GLSL shaders: `.s('x-shader/x-fragment');`
 - Latex: `.s('text/latex');`
- Complex Numbers
- Sums
- Vectors (dot products, cross products, gradient/curl etc).
- Finding roots (intersections) (Not yet implemented)
- Finding singularities (Not yet implemented)


This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.
