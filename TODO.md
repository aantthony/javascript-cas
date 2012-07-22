### Important
FIX \sqrt{2} x and \sin2 x
1. Fix up operators (identity, inverse, associative, commutative)
- Plus.inverse = x -> -x
- Plus.identity = One
- Plus.associative = true
- Plus.commutative
 -> Since Plus is associative (a+b)+c = a+(b+c),
	-> (a+b)+c = SUM[a,b,c]
	-> and since Plus is commmutative,
			-> (a+b)+c = SUM[SET[a,b,c]]

	