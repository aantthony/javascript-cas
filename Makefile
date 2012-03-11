all:
	./make/build.sh
cas: all
	cp ./make/build/math.js ./cas/math.js
auto:
	supervisor -w src -e js -x node ./make/updated.js
