/*

 Errors used by javascript-cas:
  - SyntaxError (parsing errors)
  - MathError ()
  ? ReferenceError (reference to variable not defined in context) (not currently thrown)

*/

function MathError(str) {
	this.message = str;
};
_ = extend(MathError, Error);