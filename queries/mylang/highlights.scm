; Keywords
[
  "func"
  "extern"
  "returns"
  "return"
  "print"
  "if"
  "else"
  "while"
  "for"
  "struct"
  "enum"
  "switch"
  "case"
  "default"
  "error"
  "exit"
  "read"
  "free"
  "new"
  "cast"
  "sizeof"
  "asm"
] @keyword


"imm" @keyword.modifier
"mut" @keyword.modifier
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

(struct_decl name: (identifier) @type)
(struct_literal (identifier) @type)

(enum_decl name: (identifier) @type)
(enum_variant name: (identifier) @constant)

; Enum literal: EnumName::VariantName
(enum_literal
  (identifier) @type
  .
  (identifier) @constant)

(struct_decl
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

(new_expr
  "new" @keyword.operator)

(type_prefix) @keyword.modifier

; Functions
(function_decl name: (identifier) @function)

; Parameters
(param name: (identifier) @parameter)

; Variables
(var_decl name: (identifier) @variable)

; Properties/Fields
(struct_field name: (identifier) @property)
(postfix_expr property: (identifier) @property)

; Case pattern enum matching (EnumName::Variant)
(case_pattern
  (identifier) @type
  .
  (identifier) @constant)

; Literals
(integer_literal) @number
(float_literal) @number
(string_literal) @string

; Operators
[
  ":="
  "or"
  "and"
  "=" "==" "!="
  "<" "<=" ">" ">="
  "+" "-"
  "*" "/" "%"
  "!" "&" "|" "^" "<<" ">>"
] @operator

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

; Function call / Array access wrappers
(postfix_expr
  "(" @punctuation.bracket
  ")" @punctuation.bracket)

(postfix_expr
  "[" @punctuation.bracket
  "]" @punctuation.bracket)
