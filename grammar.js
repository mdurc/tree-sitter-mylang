/**
 * @file My language
 * @author Matthew Durcan
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'mylang',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  rules: {
    // <Program> ::= ( <StructDecl> | <FunctionDecl> | <Stmt> | <EnumDecl> )*
    // Note: EnumDecl was added here so it can be parsed at the top level
    program: $ => repeat(choice(
      $.define_directive,
      $.include_directive,
      $.struct_decl,
      $.function_decl,
      $.enum_decl,
      $.statement
    )),

    // Preprocessor Directives
    define_directive: $ => seq('#define', $.identifier, /[^\n]+/),
    include_directive: $ => seq('#include', $.string_literal),

    // Comments
    line_comment: $ => token(seq('//', /.*/)),
    block_comment: $ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    // --- Declarations ---
    // <StructDecl> ::= 'struct' Identifier ('{' <StructFields>? '}' | ';')
    struct_decl: $ => seq(
      'struct',
      field('name', $.identifier),
      choice(
        seq('{', optional($.struct_fields), '}'),
        ';'
      )
    ),

    struct_fields: $ => seq(
      $.struct_field,
      repeat(seq(',', $.struct_field))
    ),

    struct_field: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    // <EnumDecl> ::= 'enum' <Identifier> '{' <EnumVariant> (',' <EnumVariant>)* '}'
    enum_decl: $ => seq(
      'enum',
      field('name', $.identifier),
      '{',
      $.enum_variant,
      repeat(seq(',', $.enum_variant)),
      '}'
    ),

    // <EnumVariant> ::= <Identifier> ('{' <StructField>* '}')?
    enum_variant: $ => seq(
      field('name', $.identifier),
      optional(seq('{', repeat($.struct_field), '}'))
    ),

    // <FunctionDecl> ::= ('extern')? 'func' Identifier '(' <Params>? ')' <ReturnType>? ( <Block> | ';' )
    function_decl: $ => seq(
      optional('extern'),
      'func',
      field('name', $.identifier),
      '(',
        optional($.params),
        ')',
      optional($.return_type),
      choice($.block, ';')
    ),

    params: $ => seq(
      $.param,
      repeat(seq(',', $.param))
    ),

    param: $ => seq(
      optional($.type_prefix),
      field('name', $.identifier),
      ':',
      field('type', $.type)
    ),

    return_type: $ => seq(
      'returns',
      '(',
        field('name', $.identifier),
        ':',
        field('type', $.type),
        ')'
    ),

    block: $ => seq('{', repeat($.statement), '}'),

    // --- Statements ---
    statement: $ => choice(
      seq($.var_decl, ';'),
      $.if_stmt,
      $.for_stmt,
      $.while_stmt,
      $.switch_stmt,
      seq('read', $.expression, ';'),
      seq($.print_stmt, ';'),
      $.block,
      seq($.expression, ';'),
      seq($.return_stmt, ';'),
      seq($.break_stmt, ';'),
      seq($.continue_stmt, ';'),
      seq($.free_stmt, ';'),
      seq($.error_stmt, ';'),
      seq($.exit_stmt, ';'),
      seq('asm', $.block, ';')
    ),

    var_decl: $ => seq(
      optional($.type_prefix),
      field('name', $.identifier),
      choice(
        seq(':', field('type', $.type), optional(seq('=', $.expression))),
        seq(':=', $.expression)
      )
    ),

    if_stmt: $ => seq(
      'if', '(', $.expression, ')', $.block,
      optional(seq('else', choice($.block, $.if_stmt)))
    ),

    for_stmt: $ => seq(
      'for', '(',
        optional(choice($.var_decl, $.expression)), ';',
        optional($.expression), ';',
        optional($.expression),
        ')', $.block
    ),

    while_stmt: $ => seq('while', '(', $.expression, ')', $.block),

    switch_stmt: $ => seq('switch', '(', $.expression, ')', '{', repeat($.case), '}'),

    case: $ => choice(
      seq('case', $.case_pattern, ':', $.block),
      seq('default', ':', $.block)
    ),

    case_pattern: $ => choice(
      prec(1, seq($.identifier, '::', $.identifier, optional(seq('(', $.identifier, ')')))),
      $.expression
    ),

    print_stmt: $ => seq('print', $.expression, repeat(seq(',', $.expression))),
    error_stmt: $ => seq('error', $.expression, repeat(seq(',', $.expression))),

    return_stmt: $ => seq('return', optional($.expression)),
    exit_stmt: $ => seq('exit', optional($.expression)),
    free_stmt: $ => seq('free', $.expression),
    break_stmt: $ => 'break',
    continue_stmt: $ => 'continue',

    // --- Expressions ---
    expression: $ => $.assignment_expr,

    // Right-associative assignment
    assignment_expr: $ => choice(
      $.logical_or_expr,
      prec.right(1, seq($.logical_or_expr, '=', $.assignment_expr))
    ),

    // Left-associative logical OR
    logical_or_expr: $ => choice(
      $.logical_and_expr,
      prec.left(2, seq($.logical_or_expr, 'or', $.logical_and_expr))
    ),

    // Left-associative logical AND
    logical_and_expr: $ => choice(
      $.bitwise_or_expr,
      prec.left(3, seq($.logical_and_expr, 'and', $.bitwise_or_expr))
    ),

    // Left-associative bitwise OR
    bitwise_or_expr: $ => choice(
      $.bitwise_xor_expr,
      prec.left(4, seq($.bitwise_or_expr, '|', $.bitwise_xor_expr))
    ),

    // Left-associative bitwise XOR
    bitwise_xor_expr: $ => choice(
      $.bitwise_and_expr,
      prec.left(5, seq($.bitwise_xor_expr, '^', $.bitwise_and_expr))
    ),

    // Left-associative bitwise AND
    bitwise_and_expr: $ => choice(
      $.equality_expr,
      prec.left(6, seq($.bitwise_and_expr, '&', $.equality_expr))
    ),

    // Left-associative equality
    equality_expr: $ => choice(
      $.relational_expr,
      prec.left(7, seq($.equality_expr, choice('==', '!='), $.relational_expr))
    ),

    // Left-associative relational
    relational_expr: $ => choice(
      $.shift_expr,
      prec.left(8, seq($.relational_expr, choice('<', '>', '<=', '>='), $.shift_expr))
    ),

    // Left-associative shift
    shift_expr: $ => choice(
      $.additive_expr,
      prec.left(9, seq($.shift_expr, choice('<<', '>>'), $.additive_expr))
    ),

    // Left-associative additive
    additive_expr: $ => choice(
      $.multiplicative_expr,
      prec.left(10, seq($.additive_expr, choice('+', '-'), $.multiplicative_expr))
    ),

    // Left-associative multiplicative
    multiplicative_expr: $ => choice(
      $.unary_expr,
      prec.left(11, seq($.multiplicative_expr, choice('*', '/', '%'), $.unary_expr))
    ),

    // Right-associative unary prefix operators
    unary_expr: $ => choice(
      prec.right(12, seq(
        choice(seq('&', optional($.type_prefix)), '*', '!', '-'),
        $.unary_expr
      )),
      $.postfix_expr
    ),

    // Left-associative postfix suffix chains (e.g., a.b[0]())
    postfix_expr: $ => choice(
      $.primary_expr,
      prec.left(13, seq(
        $.postfix_expr,
        choice(
          seq('.', field('property', $.identifier)),
          seq('(', optional($.args), ')'),
          seq('[', $.expression, ']')
        )
      ))
    ),

    primary_expr: $ => choice(
      $.primitive_literal,
      $.identifier,
      seq('(', $.expression, ')'),
      $.struct_literal,
      $.enum_literal,
      $.new_expr,
      $.cast_expr,
      $.sizeof_expr
    ),

    primitive_literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.boolean_literal,
      'null'
    ),

    struct_literal: $ => seq(
      $.identifier,
      '{',
          optional(seq(
            $.identifier, '=', $.expression,
            repeat(seq(',', $.identifier, '=', $.expression))
          )),
          '}'
    ),

    enum_literal: $ => seq(
      $.identifier, '::', $.identifier,
      optional(seq(
        '{',
        optional(seq(
            $.identifier, '=', $.expression,
            repeat(seq(',', $.identifier, '=', $.expression))
        )),
        '}'
      ))
    ),

    new_expr: $ => seq(
      'new', '<', optional($.type_prefix), $.type, '>',
      choice(
        seq('[', $.expression, ']'),
        seq('(', optional($.expression), ')')
      )
    ),

    cast_expr: $ => seq(
      'cast', '<', $.type, '>', '(', $.expression, ')'
    ),

    sizeof_expr: $ => seq(
      'sizeof', '<', $.type, '>'
    ),

    args: $ => seq(
      $.expression,
      repeat(seq(',', $.expression))
    ),

    // --- Types ---
    type: $ => choice(
      $.basic_type,
      $.struct_type,
      $.pointer_type,
      $.function_type
    ),

    basic_type: $ => choice(
      'i32', 'u8', 'string', 'bool', 'u0', 'u16', 'u32', 'u64', 'i8', 'i16', 'i64', 'f64'
    ),

    struct_type: $ => $.identifier,

    pointer_type: $ => seq(
      'ptr', '<', optional($.type_prefix), $.type, '>'
    ),

    function_type: $ => seq(
      'func', '(',
        optional(seq(
          seq(optional(seq($.type_prefix, ':')), $.type),
          repeat(seq(',', optional(seq($.type_prefix, ':')), $.type))
        )),
        ')', '->', $.type
    ),

    type_prefix: $ => choice('mut', 'imm'),

    // --- Primitives ---
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    integer_literal: $ => choice(
      /0[xX][0-9a-fA-F]+/,
      /[0-9]+/
    ),

    float_literal: $ => /[0-9]+\.[0-9]+/,
    string_literal: $ => /"([^"\\]|\\.)*"/,
    boolean_literal: $ => choice('true', 'false')
  }
});
