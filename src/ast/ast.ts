import { Loc } from './location'

// Expressions
export type Expr =
  | ExprImport
  | ExprVar
  | ExprLit
  | ExprUnary
  | ExprBinary
  | ExprParen
  | ExprIf
  | ExprBind

export interface ExprImport {
  kind: 'Expr.Import'
  path: string
  loc?: Loc
}
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
export interface ExprUnary {
  kind: 'Expr.Unary'
  op: string
  expr: Expr
  loc?: Loc
}
export interface ExprBinary {
  kind: 'Expr.Binary'
  op: string
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
  value: Expr
  body: Expr
  loc?: Loc
}

// ----------------------------------------------------------------------------
// AST Builders
// ----------------------------------------------------------------------------

// Expressions
export const Expr = {
  Var: (variable: string): Expr => ({ kind: 'Expr.Var', variable }),
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
  Bind: ({ variable, value, body }): Expr => ({
    kind: 'Expr.Bind',
    variable,
    value,
    body,
  }),
}
