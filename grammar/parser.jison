
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
\$[^\$]*\$            return 'TEXT'
"\left("              return '('
"\right)"             return ')'
"\frac{"              return 'FRAC{'
"\sqrt{"              return 'SQRT{'
\\cdo[t]              return '*'
\\l[e]                return '<='
\\g[e]                return '>='
\\n[e]                return 'NE'
\\[a-zA-Z]+           return 'LONGIDENTIFIER'
[a-zA-Z]              return 'IDENTIFIER'
[0-9]+\.[0-9]*        return 'DECIMAL'
[0-9]+                return 'INTEGER'
"="                   return '='
"*"                   return '*'
"."                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"<="                  return '<='
">="                  return '>='
"<"                   return '<'
">"                   return '>'
"!="                  return '!='
"&&"                  return '&&'
_[^\(\{]              return '_SINGLE'
\^[0-9]               return '^SINGLEP'
\^[^\(\{0-9]          return '^SINGLEA'
"_{"                  return '_{'
"^{"                  return 'POWER{'
"!"                   return '!'
"%"                   return '%'
"\%"                  return '%'
","                   return ','
"?"                   return '?'
":"                   return ':'
"("                   return '('
")"                   return ')'
"{"                   return '{'
"}"                   return '}'
"["                   return '['
"]"                   return ']'
<<EOF>>               return 'EOF'
// .                     debugger; return 'INVALID'

/lex

/* operator associations and precedence */

%right ','
%right '_SINGLE'
%right '_{'
%left '='
%left '+' '-'
%left '*' '/'
%left '&&'
%left UMINUS
%left 'SQRT{'
%left '?'
%left ':'
%right '!'
%right '%'
%left 'FRAC{'
%left BDEFAULT
%right 'POWER{'
%right '^SINGLE'

%start expressions

%% /* language grammar */

expressions
    : S EOF                 { return $1; }
    ;
S
    : e                     {$$ = $1;}
    | stmt                  {$$ = $1;}
    ;
stmt
    : e '=' e                       {$$ = ['=', $1, $3];}
    | e '!=' e                      {$$ = ['!=', $1, $3];}
    | e '<=' e                      {$$ = ['<=', $1, $3];}
    | e '<' e                       {$$ = ['<', $1, $3];}
    | e '>' e                       {$$ = ['>', $1, $3];}
    | e '>=' e                      {$$ = ['>=', $1, $3];}
    ;
csl
    : csl ',' e                     {$$ = [',.', $1, $3];}
    | e ',' e                       {$$ = [',', $1, $3];}
    ;
vector
    : '(' csl ')'                   {$$ = $2;}
    ;
e
    : e '+' e                       {$$ = ['+', $1, $3];}
    | e '-' e                       {$$ = ['-', $1, $3];}
    | e '*' e                       {$$ = ['*', $1, $3];}
    | e '%' e                       {$$ = ['%', $1, $3];}
    | e '/' e                       {$$ = ['/', $1, $3];}
    | e 'POWER{' e '}'              {$$ = ['^', $1, $3];}
    | e '_{' S '}'                  {$$ = ['_', $1, $3];}
    | e '!'                         {$$ = ['!', $1];}
    | e '_SINGLE'                   {$$ = ['_', $1, {type: 'Single', primitive: yytext.substring(1)}];}
    | 'SQRT{' e '}'                 {$$ = ['sqrt', $2];}
    | 'FRAC{' e '}' '{' e '}'       {$$ = ['frac', $2, $5];}
    | e '^SINGLEA'                  {$$ = ['^', $1, yytext.substring(1)];}
    | e '^SINGLEP'                  {$$ = ['^', $1, {type: 'Single', primitive: yytext.substring(1)}];}
    | '-' e %prec UMINUS            {$$ = ['@-', $2]}
    | e e %prec BDEFAULT            {$$ = ['default', $1, $2];}
    | '(' e ')'                     {$$ = $2}
//    | e '?' e ':' e               {$$ = ['?', $1, $3, $5];}
    | vector                        {$$ = $1;}
    | identifier                    {$$ = $1;}
    | number                        {$$ = $1;}
    ;

identifier
    : IDENTIFIER                    {$$ = yytext;}
    | LONGIDENTIFIER                {$$ = yytext.substring(1);}
    ;

number
    : DECIMAL                       {$$ = {type: 'Number', primitive: yytext};}
    | INTEGER                       {$$ = {type: 'Number', primitive: yytext};}
    ;
