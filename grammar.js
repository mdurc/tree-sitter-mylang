/**
 * @file My language
 * @author Matthew Durcan
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "mylang",

  conflicts: ($) => [
    [$.primary_expr, $.new_expr],
  ],

  extras: ($) => [/\s+/, $.line_comment, $.block_comment],

  rules: {
    program: ($) => repeat($.top_level),

    top_level: ($) => choice($.struct_decl, $.func_decl, $.stmt,
      $.define_directive, $.include_directive),

    define_directive: ($) =>
      seq(
        "#define",
        $.identifier,
        $.define_value
      ),
    define_value: ($) => /[^\n]+/,

    include_directive: ($) =>
      seq(
        "#include",
        choice(
          $.string_literal, // for "filepath"
          seq("<", /[^>]+/, ">")
        )
      ),

    struct_decl: ($) =>
      seq("struct", $.identifier, "{", optional($.struct_fields), "}"),

    struct_fields: ($) => commaSep($.struct_field),
    struct_field: ($) => seq($.identifier, ":", $.type),

    func_decl: ($) =>
      seq(
        "func",
        $.identifier,
        "(",
        optional($.params),
        ")",
        optional(seq("returns", "(", $.identifier, ":", $.type, ")")),
        $.block,
      ),

    params: ($) => commaSep($.param),
    param: ($) =>
      seq(optional($.function_param_prefix), $.identifier, ":", $.type),

    function_param_prefix: ($) =>
      choice($.type_prefix, seq("take", $.type_prefix)),

    block: ($) => seq("{", repeat($.stmt), "}"),

    stmt: ($) =>
      choice(
        seq($.var_decl, ";"),
        $.if_stmt,
        $.for_stmt,
        $.while_stmt,
        $.switch_stmt,
        seq("read", $.expr, ";"),
        seq($.print_stmt, ";"),
        $.block,
        seq($.expr, ";"),
        seq($.return_stmt, ";"),
        seq("break", ";"),
        seq("continue", ";"),
        seq($.free_stmt, ";"),
        seq($.error_stmt, ";"),
        seq($.exit_stmt, ";"),
        seq("asm", $.block, ";"),
      ),

    var_decl: ($) =>
      seq(
        optional($.type_prefix),
        $.identifier,
        choice(seq(":", $.type, optional(seq("=", $.expr))), seq(":=", $.expr)),
      ),

    if_stmt: ($) =>
      seq(
        "if",
        "(",
        $.expr,
        ")",
        $.block,
        optional(seq("else", choice($.block, $.if_stmt))),
      ),

    for_stmt: ($) =>
      seq(
        "for",
        "(",
        optional(choice($.var_decl, $.expr)),
        ";",
        optional($.expr),
        ";",
        optional($.expr),
        ")",
        $.block,
      ),

    while_stmt: ($) => seq("while", "(", $.expr, ")", $.block),

    switch_stmt: ($) =>
      seq("switch", "(", $.expr, ")", "{", repeat($.case_), "}"),

    case_: ($) =>
      choice(seq("case", $.expr, ":", $.block), seq("default", ":", $.block)),

    print_stmt: ($) => seq("print", commaSep1($.expr)),

    return_stmt: ($) => seq("return", optional($.expr)),

    free_stmt: ($) => seq("free", optional("[]"), $.expr),

    error_stmt: ($) => seq("error", $.string_literal),

    exit_stmt: ($) => seq("exit", $.int_literal),

    expr: ($) => $.assign_expr,

    // Precedence
    assign_expr: ($) => prec.right(2, choice(
      seq($.logical_or_expr, "=", $.assign_expr),
      $.logical_or_expr
    )),

    logical_or_expr: ($) =>
      prec.left(3, leftAssoc($.logical_and_expr, "or", $.logical_and_expr)),

    logical_and_expr: ($) =>
      prec.left(4, leftAssoc($.equality_expr, "and", $.equality_expr)),

    equality_expr: ($) =>
      prec.left(
        5,
        leftAssoc($.comparison_expr, choice("==", "!="), $.comparison_expr),
      ),

    comparison_expr: ($) =>
      prec.left(
        6,
        leftAssoc(
          $.additive_expr,
          choice("<", "<=", ">", ">="),
          $.additive_expr,
        ),
      ),

    additive_expr: ($) =>
      prec.left(
        7,
        leftAssoc(
          $.multiplicative_expr,
          choice("+", "-"),
          $.multiplicative_expr,
        ),
      ),

    multiplicative_expr: ($) =>
      prec.left(
        8,
        leftAssoc($.unary_expr, choice("*", "/", "%"), $.unary_expr),
      ),

    unary_expr: ($) => choice(
      seq('&', optional($.type_prefix), $.unary_expr),
      seq(choice('*', '!', '-', '+'), $.unary_expr),
      $.postfix_expr
    ),

    postfix_expr: ($) => seq($.primary_expr, repeat($.postfix_suffix)),

    postfix_suffix: ($) =>
      choice(
        seq(".", $.identifier),
        seq("(", optional(commaSep($.arg)), ")"),
        seq("[", $.expr, "]"),
      ),

    arg: ($) => seq(optional("give"), $.expr),

    primary_expr: ($) =>
      choice(
        $.literal,
        $.identifier,
        seq("(", $.expr, ")"),
        $.struct_literal,
        $.new_expr,
      ),

    struct_literal: ($) =>
      seq(
        $.identifier,
        $.struct_initializer
      ),

    struct_initializer: ($) =>
      seq(
        "{",
        optional(commaSep1(seq($.identifier, "=", $.expr))),
        "}"
      ),

    new_expr: ($) =>
      seq(
        "new",
        "<",
        optional($.type_prefix),
        $.type,
        ">",
        choice(
          seq("[", $.expr, "]"),
          seq("(", optional(choice($.struct_literal, $.expr)), ")"),
        ),
      ),

    literal: ($) =>
      choice(
        $.int_literal,
        $.float_literal,
        $.string_literal,
        $.bool_literal,
        "null",
      ),

    type: ($) =>
      choice($.basic_type, $.struct_type, $.pointer_type, $.function_type),

    type_prefix: ($) => choice("mut", "imm"),

    basic_type: ($) =>
      choice(
        "i32",
        "u8",
        "string",
        "bool",
        "u0",
        "u16",
        "u32",
        "u64",
        "i8",
        "i16",
        "i64",
        "f64",
      ),

    struct_type: ($) => $.identifier,

    pointer_type: ($) => seq("ptr", "<", optional($.type_prefix), $.type, ">"),

    function_type: ($) =>
      seq(
        "func",
        "(",
        optional(
          commaSep(
            seq(optional(seq(optional($.function_param_prefix), ":")), $.type),
          ),
        ),
        ")",
        "->",
        $.type,
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    int_literal: ($) => /[0-9]+/,
    float_literal: ($) => /[0-9]+\.[0-9]+/,
    string_literal: ($) => /"([^"\\]|\\.)*"/,
    bool_literal: ($) => choice("true", "false"),

    line_comment: ($) => token(seq("//", /.*\n/)),
    block_comment: ($) => seq("/*", repeat(/.|\n|\r/), "*/"),
  },
});

function commaSep(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function leftAssoc(left, operator, right) {
  return seq(left, repeat(seq(operator, right)));
}
