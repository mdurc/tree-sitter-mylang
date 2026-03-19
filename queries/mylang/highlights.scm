; Keywords
[
  "func"
  "returns"
  "return"
  "print"
  "if"
  "else"
  "while"
  "for"
  "struct"
  "switch"
  "case"
  "default"
  "error"
  "exit"
  "read"
  "free"
  "new"
  "take"
  "asm"
] @keyword

"imm" @keyword
"mut" @keyword
"null" @constant.builtin

; Boolean literals
[
  "true"
  "false"
] @boolean

; Types
(type) @type
(basic_type) @type.builtin
(pointer_type "ptr" @type.builtin)
(function_type "func" @type.builtin)

(struct_decl
  (identifier) @type)

(struct_literal
  (identifier) @type)

(struct_decl
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

(new_expr
  (type) @type)
(new_expr
  "new" @keyword.operator)

(type_prefix) @type.qualifier

; Functions
(function_decl
  (identifier) @function)

; Parameters
(param
  (identifier) @parameter)

; Variables
(var_decl
  (identifier) @variable)

; Literals
(integer_literal) @number
(float_literal) @number
(string_literal) @string

; Operators
[
  ":="
  "or"
  "and"
  "=" "!="
  "<" "<=" ">" ">="
  "+" "-"
  "*" "/" "%"
  "!" "&"
] @operator

; Punctuation
;[
;  "(" ")"
;  "{" "}"
;  "[" "]"
;  ";" ","
;  "." ":"
;  "<" ">"
;] @punctuation.delimiter ; makes them light gray

; Comments
(line_comment) @comment
(block_comment) @comment

; Special cases
(return_stmt "return" @keyword.return)
(for_stmt "for" @keyword.repeat)
(while_stmt "while" @keyword.repeat)

(define_directive
  "#define" @preproc
  (identifier) @constant
   @string)

(include_directive
  "#include" @preproc
  (string_literal) @string)

; Function call
(postfix_expr
  "(" @punctuation.bracket
  ")" @punctuation.bracket)

; Array access
(postfix_expr
  "[" @punctuation.bracket
  "]" @punctuation.bracket)
