all: ./grammar/calculator.js
	./make/build.sh
./grammar/calculator.js: ./grammar/calculator.jison
	jison ./grammar/calculator.jison
	mv calculator.js ./grammar/calculator.js
cas: all
	cp ./make/build/math.js ./cas/math.js
auto:
	supervisor -w src -e js -x node ./make/updated.js
