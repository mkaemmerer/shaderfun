import { Loc } from './location'
import { Type } from './types'

export type Builtin =
  | 'length'
  | 'abs'
  | 'floor'
  | 'fract'
  | 'sin'
  | 'cos'
  | 'log'
  | 'saturate'
  | 'sqrt'
  | 'atan'
  | 'max'
  | 'min'
  | 'mod'
  | 'absV'
  | 'dot'
  | 'mix'
export type UnaryOp =
  | '-'
  | '!'
  | 'projX'
  | 'projY'
  | 'projR'
  | 'projG'
  | 'projB'
export type BinaryOp =
  | '=='
  | '!='
  | '&&'
  | '||'
  // scalar -> scalar -> scalar
  | '+'
  | '-'
  | '*'
  | '/'
  // scalar -> scalar -> bool
  | '<'
  | '<='
  | '>'
  | '>='
  // vector -> vector -> vector
  | '<+>'
  | '<->'
  // scalar -> vector -> vector
  | '*>'

// Expressions
export type Expr =
  | ExprVar
  | ExprLit
  | ExprVec
  | ExprCol
  | ExprUnary
  | ExprBinary
  | ExprParen
  | ExprIf
  | ExprBind
  | ExprCall

export interface ExprVar {
  kind: 'Expr.Var'
  variable: string
  loc?: Loc
}
export interface ExprLit {
  kind: 'Expr.Lit'
  value: any
  loc?: Loc
}
export interface ExprVec {
  kind: 'Expr.Vec'
  x: Expr
  y: Expr
  loc?: Loc
}
export interface ExprCol {
  kind: 'Expr.Col'
  r: Expr
  g: Expr
  b: Expr
  loc?: Loc
}
export interface ExprUnary {
  kind: 'Expr.Unary'
  op: UnaryOp
  expr: Expr
  loc?: Loc
}
export interface ExprBinary {
  kind: 'Expr.Binary'
  op: BinaryOp
  exprLeft: Expr
  exprRight: Expr
  loc?: Loc
}
export interface ExprParen {
  kind: 'Expr.Paren'
  expr: Expr
  loc?: Loc
}
export interface ExprIf {
  kind: 'Expr.If'
  condition: Expr
  thenBranch: Expr
  elseBranch: Expr
  loc?: Loc
}
export interface ExprBind {
  kind: 'Expr.Bind'
  variable: string
  type?: Type
  value: Expr
  body: Expr
  loc?: Loc
}
export interface ExprCall {
  kind: 'Expr.Call'
  fn: string
  args: Expr[]
  loc?: Loc
}

// ----------------------------------------------------------------------------
// AST Builders
// ----------------------------------------------------------------------------

// Expressions
export const Expr = {
  Var: (variable): Expr => ({ kind: 'Expr.Var', variable }),
  Lit: (value: any): Expr => ({ kind: 'Expr.Lit', value }),
  Unary: ({ op, expr }): Expr => ({ kind: 'Expr.Unary', op, expr }),
  Binary: ({ op, exprLeft, exprRight }): Expr => ({
    kind: 'Expr.Binary',
    op,
    exprLeft,
    exprRight,
  }),
  Paren: (expr: Expr): Expr => ({ kind: 'Expr.Paren', expr }),
  If: ({ condition, thenBranch, elseBranch }): Expr => ({
    kind: 'Expr.If',
    condition,
    thenBranch,
    elseBranch,
  }),
  Vec: ({ x, y }): Expr => ({
    kind: 'Expr.Vec',
    x,
    y,
  }),
  Col: ({ r, g, b }): Expr => ({
    kind: 'Expr.Col',
    r,
    g,
    b,
  }),
  Bind: ({ variable, type = null, value, body }): Expr => ({
    kind: 'Expr.Bind',
    variable,
    value,
    type,
    body,
  }),
  Call: ({ fn, args }): Expr => ({
    kind: 'Expr.Call',
    fn,
    args,
  }),
}
