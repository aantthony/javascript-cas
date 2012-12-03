/* Jison generated parser */
var calculator = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"e":4,"EOF":5,"s":6,"+":7,"-":8,"*":9,"/":10,"^":11,"!":12,"%":13,"(":14,")":15,"FRAC":16,"{":17,"}":18,"NUMBER":19,"E":20,"PI":21,"=":22,"&&":23,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",7:"+",8:"-",9:"*",10:"/",11:"^",12:"!",13:"%",14:"(",15:")",16:"FRAC",17:"{",18:"}",19:"NUMBER",20:"E",21:"PI",22:"=",23:"&&"},
productions_: [0,[3,2],[3,2],[4,3],[4,3],[4,3],[4,2],[4,3],[4,3],[4,2],[4,2],[4,2],[4,3],[4,7],[4,1],[4,1],[4,1],[6,3],[6,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 2: return $$[$0-1]; 
break;
case 3:this.$ = $$[$0-2]['+']($$[$0]);
break;
case 4:this.$ = $$[$0-2]['-']($$[$0]);
break;
case 5:this.$ = $$[$0-2]['*']($$[$0]);
break;
case 6:this.$ = $$[$0-1].default($$[$0]);
break;
case 7:this.$ = $$[$0-2]['/']($$[$0]);
break;
case 8:this.$ = $$[$0-2]['^']($$[$0]);
break;
case 9:
          this.$ = $$[$0-1]['factorial']();
        
break;
case 10:this.$ = $$[$0-1]['%']();
break;
case 11:this.$ = $$[$0]['@-']();
break;
case 12:this.$ = $$[$0-1];
break;
case 13:this.$ = $$[$0-4]['/']($$[$0-1]);
break;
case 14:this.$ = Construct.Number(yytext);
break;
case 15:this.$ = Global.e;
break;
case 16:this.$ = Global.pi;
break;
case 17:this.$ = $$[$0-2]['=']($$[$0]);
break;
case 18:this.$ = $$[$0-2]['&&']($$[$0]);
break;
}
},
table: [{3:1,4:2,6:3,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{1:[3]},{4:14,5:[1,10],7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9],22:[1,19]},{5:[1,20],23:[1,21]},{4:22,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:23,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{17:[1,24]},{5:[2,14],7:[2,14],8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[2,14],18:[2,14],19:[2,14],20:[2,14],21:[2,14],22:[2,14],23:[2,14]},{5:[2,15],7:[2,15],8:[2,15],9:[2,15],10:[2,15],11:[2,15],12:[2,15],13:[2,15],14:[2,15],15:[2,15],16:[2,15],18:[2,15],19:[2,15],20:[2,15],21:[2,15],22:[2,15],23:[2,15]},{5:[2,16],7:[2,16],8:[2,16],9:[2,16],10:[2,16],11:[2,16],12:[2,16],13:[2,16],14:[2,16],15:[2,16],16:[2,16],18:[2,16],19:[2,16],20:[2,16],21:[2,16],22:[2,16],23:[2,16]},{1:[2,1]},{4:25,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:26,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:27,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:14,5:[2,6],7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],15:[2,6],16:[1,6],18:[2,6],19:[1,7],20:[1,8],21:[1,9],22:[2,6],23:[2,6]},{4:28,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:29,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{5:[2,9],7:[2,9],8:[2,9],9:[2,9],10:[2,9],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[2,9],18:[2,9],19:[2,9],20:[2,9],21:[2,9],22:[2,9],23:[2,9]},{5:[2,10],7:[2,10],8:[2,10],9:[2,10],10:[2,10],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[2,10],18:[2,10],19:[2,10],20:[2,10],21:[2,10],22:[2,10],23:[2,10]},{4:30,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{1:[2,2]},{4:32,6:31,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:14,5:[2,11],7:[2,11],8:[2,11],9:[2,11],10:[2,11],11:[2,11],12:[2,11],13:[2,11],14:[1,5],15:[2,11],16:[1,6],18:[2,11],19:[1,7],20:[1,8],21:[1,9],22:[2,11],23:[2,11]},{4:14,7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],15:[1,33],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:34,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:14,5:[2,3],7:[2,3],8:[2,3],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],15:[2,3],16:[1,6],18:[2,3],19:[1,7],20:[1,8],21:[1,9],22:[2,3],23:[2,3]},{4:14,5:[2,4],7:[2,4],8:[2,4],9:[2,11],10:[2,11],11:[2,11],12:[2,11],13:[2,11],14:[1,5],15:[2,4],16:[1,6],18:[2,4],19:[1,7],20:[1,8],21:[1,9],22:[2,4],23:[2,4]},{4:14,5:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[2,5],11:[1,16],12:[1,17],13:[1,18],14:[1,5],15:[2,5],16:[1,6],18:[2,5],19:[1,7],20:[1,8],21:[1,9],22:[2,5],23:[2,5]},{4:14,5:[2,7],7:[2,7],8:[2,7],9:[2,7],10:[2,7],11:[1,16],12:[1,17],13:[1,18],14:[1,5],15:[2,7],16:[1,6],18:[2,7],19:[1,7],20:[1,8],21:[1,9],22:[2,7],23:[2,7]},{4:14,5:[2,8],7:[2,8],8:[2,8],9:[2,8],10:[2,8],11:[2,8],12:[1,17],13:[1,18],14:[1,5],15:[2,8],16:[1,6],18:[2,8],19:[1,7],20:[1,8],21:[1,9],22:[2,8],23:[2,8]},{4:14,5:[2,17],7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9],23:[2,17]},{5:[2,18],23:[2,18]},{4:14,7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9],22:[1,19]},{5:[2,12],7:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],18:[2,12],19:[2,12],20:[2,12],21:[2,12],22:[2,12],23:[2,12]},{4:14,7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],16:[1,6],18:[1,35],19:[1,7],20:[1,8],21:[1,9]},{17:[1,36]},{4:37,8:[1,4],14:[1,5],16:[1,6],19:[1,7],20:[1,8],21:[1,9]},{4:14,7:[1,11],8:[1,12],9:[1,13],10:[1,15],11:[1,16],12:[1,17],13:[1,18],14:[1,5],16:[1,6],18:[1,38],19:[1,7],20:[1,8],21:[1,9]},{5:[2,13],7:[2,13],8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],18:[2,13],19:[2,13],20:[2,13],21:[2,13],22:[2,13],23:[2,13]}],
defaultActions: {10:[2,1],20:[2,2]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
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
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
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
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 19
break;
case 2:return 22
break;
case 3:return 9
break;
case 4:return 10
break;
case 5:return 8
break;
case 6:return 7
break;
case 7:return 23
break;
case 8:return 11
break;
case 9:return 12
break;
case 10:return 13
break;
case 11:return 14
break;
case 12:return 15
break;
case 13:return 17
break;
case 14:return 18
break;
case 15:return 21
break;
case 16:return 20
break;
case 17:return 16
break;
case 18:return 5
break;
case 19:return 'INVALID'
break;
}
};
lexer.rules = [/^(?:\s+)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:=)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:&&)/,/^(?:\^)/,/^(?:!)/,/^(?:%)/,/^(?:\()/,/^(?:\))/,/^(?:\{)/,/^(?:\})/,/^(?:PI\b)/,/^(?:E\b)/,/^(?:\\frac\b)/,/^(?:$)/,/^(?:.)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = calculator;
exports.Parser = calculator.Parser;
exports.parse = function () { return calculator.parse.apply(calculator, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}