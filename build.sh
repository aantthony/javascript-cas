#!/usr/bin/env bash
if [ ! -d build ]; then
	mkdir build
fi

cat \
	src/start.js \
	src/Array.js \
	src/language.js \
	src/operators.js \
	src/M.js \
	src/M.assume.js \
	src/M.latex.js \
	src/M.differentiate.js \
	src/M.simplify.js \
	src/M.apply.js \
	src/M.toLatex.js \
	src/M.toStrings.js \
	src/end.js \
	> build/math.js

uglifyjs build/math.js \
	> build/math.min.js
