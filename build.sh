#!/usr/bin/env bash
if [ ! -d build]; then
	mkdir build
fi

cat \
	src/intro.js
	
	
	
	src/outro.js
	> build/math.js

uglifyjs build/math.js \
	> build/math.min.js
