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
    // <Program> ::= ( <StructDecl> | <FunctionDecl> | <Stmt> )*
    program: $ => repeat(choice(
      $.define_directive,
      $.include_directive,
      $.struct_decl,
      $.function_decl,
      $.statement
    )),

    // Preprocessor Directives
    define_directive: $ => seq('#define', $.identifier, /[^\n]+/),
    include_directive: $ => seq('#include', $.string_literal),

    // Comments (from standard behavior)
    line_comment: $ => token(seq('//', /.*/)),
    block_comment: $ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    // --- Declarations ---
    // <StructDecl> ::= 'struct' Identifier '{' <StructFields>? '}'
    struct_decl: $ => seq(
      'struct',
      field('name', $.identifier),
      '{',
          optional($.struct_fields),
          '}'
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
      optional($.function_param_prefix),
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
      seq('case', $.expression, ':', $.block),
      seq('default', ':', $.block)
    ),

    print_stmt: $ => seq('print', $.expression, repeat(seq(',', $.expression))),
    return_stmt: $ => seq('return', optional($.expression)),
    break_stmt: $ => 'break',
    continue_stmt: $ => 'continue',
    free_stmt: $ => seq('free', optional('[]'), $.expression),
    error_stmt: $ => seq('error', $.string_literal),
    exit_stmt: $ => seq('exit', $.integer_literal),

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
      $.equality_expr,
      prec.left(3, seq($.logical_and_expr, 'and', $.equality_expr))
    ),

    // Left-associative equality
    equality_expr: $ => choice(
      $.relational_expr,
      prec.left(4, seq($.equality_expr, choice('==', '!='), $.relational_expr))
    ),

    // Left-associative relational
    relational_expr: $ => choice(
      $.additive_expr,
      prec.left(5, seq($.relational_expr, choice('<', '>', '<=', '>='), $.additive_expr))
    ),

    // Left-associative additive
    additive_expr: $ => choice(
      $.multiplicative_expr,
      prec.left(6, seq($.additive_expr, choice('+', '-'), $.multiplicative_expr))
    ),

    // Left-associative multiplicative
    multiplicative_expr: $ => choice(
      $.unary_expr,
      prec.left(7, seq($.multiplicative_expr, choice('*', '/', '%'), $.unary_expr))
    ),

    // Right-associative unary prefix operators
    unary_expr: $ => choice(
      prec.right(8, seq(
        choice(seq('&', optional($.type_prefix)), '*', '!', '-'),
        $.unary_expr
      )),
      $.postfix_expr
    ),

    // Left-associative postfix suffix chains (e.g., a.b[0]())
    postfix_expr: $ => choice(
      $.primary_expr,
      prec.left(9, seq(
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
      $.new_expr
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

    new_expr: $ => seq(
      'new', '<', optional($.type_prefix), $.type, '>',
      choice(
        seq('[', $.expression, ']'),
        seq('(', optional($.expression), ')')
      )
    ),

    args: $ => seq(
      $.arg,
      repeat(seq(',', $.arg))
    ),

    arg: $ => seq(
      optional('give'),
      $.expression
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
          seq(optional(seq($.function_param_prefix, ':')), $.type),
          repeat(seq(',', optional(seq($.function_param_prefix, ':')), $.type))
        )),
        ')', '->', $.type
    ),

    type_prefix: $ => choice('mut', 'imm'),

    function_param_prefix: $ => choice(
      $.type_prefix,
      seq('take', optional($.type_prefix))
    ),

    // --- Primitives ---
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    integer_literal: $ => /[0-9]+/,
    float_literal: $ => /[0-9]+\.[0-9]+/,
    string_literal: $ => /"([^"\\]|\\.)*"/,
    boolean_literal: $ => choice('true', 'false')
  }
});
