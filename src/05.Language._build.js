/*
Todo:
 * Don't evaluate/compute until fully lexed (for parsing ambiguous expressions)
*/

Language.build = function () {

	this.parse = function (s, context) {
		if(s === '') {
			return undefined;
		}
		console.log('parsing: ', s);
		var j = calculator.parse(s);
		return j;
		console.log(rpn_stack[0]);
		var result = evaluate(rpn_stack[0]);
		// Free variables: (these could be used to quickly check which variables an equation has).
		// Perhaps every expression should have such a context, but maybe that would take too much ram.
		result.unbound = free_context;
		result.bound = bound_context;
		return result;
	};
};
window.calc = calculator;