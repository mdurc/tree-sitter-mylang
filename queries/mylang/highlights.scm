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
  "break"
  "continue"
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

(struct_initializer
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

(new_expr
  (type) @type)
(new_expr
  "new" @keyword.operator)

(type_prefix) @type.qualifier

; Functions
(func_decl
  (identifier) @function)

; Parameters
(param
  (identifier) @parameter)

; Variables
(var_decl
  (identifier) @variable)

; Literals
(int_literal) @number
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
  (define_value) @string)

(include_directive
  "#include" @preproc
  (string_literal) @string)

; Function call
(postfix_suffix
  "(" @punctuation.bracket
  ")" @punctuation.bracket)

; Array access
(postfix_suffix
  "[" @punctuation.bracket
  "]" @punctuation.bracket)
