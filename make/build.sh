#!/usr/bin/env bash
if [ ! -d build ]; then
	mkdir build
fi
rm build/math.js
cp ./grammar/calculator.js ./src/04.grammar.js

cat \
	$(for i in src/*.js ; do printf "%s\n" "$i" ; done | sort -n) \
	> build/math.js

uglifyjs build/math.js \
	> build/math.min.js
#java -jar ~/Developer/Programs/Closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js ./build/math.js \
#    > build/compressed_tmp.js
#echo ";}(window));" > ./build/selfexec.js
#cat ./src/00.intro.js build/compressed_tmp.js build/selfexec.js > build/jscas-production.js
#rm ./build/selfexec.js
#rm ./build/compressed_tmp.js

if [ "$(whoami)" = "anthony" ];
then
	cp build/math.js ../graph/lib/math.js
fi
