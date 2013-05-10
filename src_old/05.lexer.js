// No longer in use since I found a trick to prevent jison's default parser from adding '\b's everywhere.

calculator.lexer.next__ = function () {
		if (this.done) {
				return this.EOF;
		}
		if (!this._input) this.done = true;

		var token,
				match,
				tempMatch,
				index,
				col,
				lines;
		if (!this._more) {
				this.yytext = '';
				this.match = '';
		}
		var rules = this._currentRules();
		for (var i=0;i < rules.length; i++) {
				tempMatch = this._input.match(this.rules[rules[i]]);
				if (tempMatch) {
						match = tempMatch;
						index = i;
						break;
				}
		}
		
		if (match) {
				lines = match[0].match(/(?:\r\n?|\n).*/g);
				if (lines) this.yylineno += lines.length;
				this.yylloc = {first_line: this.yylloc.last_line,
											 last_line: this.yylineno+1,
											 first_column: this.yylloc.last_column,
											 last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
				this.yytext += match[0];
				this.match += match[0];
				this.matches = match;
				this.yyleng = this.yytext.length;
				if (this.options.ranges) {
						this.yylloc.range = [this.offset, this.offset += this.yyleng];
				}
				this._more = false;
				this._input = this._input.slice(match[0].length);
				this.matched += match[0];
				token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
				if (this.done && this._input) this.done = false;
				if (token) return token;
				else return;
		}
		if (this._input === "") {
				return this.EOF;
		} else {
			console.log('input', this._input);
				return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
								{text: "", token: null, line: this.yylineno});
		}
};

// Need to get rid of the \b
// calculator.lexer.rules[7] = /^(?:\\le)/;
// alert(calculator.lexer.rules[7]);

