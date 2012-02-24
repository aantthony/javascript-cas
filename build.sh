#!/usr/bin/env bash
if [ ! -d build ]; then
	mkdir build
fi
rm build/math.js
cat \
	$(for i in src/*.js ; do printf "%s\n" "$i" ; done | sort -n) \
	> build/math.js

uglifyjs build/math.js \
	> build/math.min.js
