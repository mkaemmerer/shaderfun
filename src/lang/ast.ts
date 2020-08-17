import { Loc } from './location'
import { Type, TypeBool, TypeCol, TypeVec } from './types'

export type Builtin =
  | 'length'
  | 'abs'
  | 'floor'
  | 'fract'
  | 'smoothstep'
  | 'sin'
  | 'cos'
  | 'log'
  | 'log2'
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
export type Expr<T> =
  | ExprVar<T>
  | ExprLit<T>
  | ExprVec<T>
  | ExprCol<T>
  | ExprUnary<T>
  | ExprBinary<T>
  | ExprParen<T>
  | ExprIf<T>
  | ExprBind<T>
  | ExprCall<T>

export interface ExprVar<T> {
  kind: 'Expr.Var'
  variable: string
  loc?: Loc
  _type?: T
}
export interface ExprLit<T> {
  kind: 'Expr.Lit'
  value: any
  loc?: Loc
  _type?: T
}
export interface ExprVec<T> {
  kind: 'Expr.Vec'
  x: Expr<Type>
  y: Expr<Type>
  loc?: Loc
  _type?: T
}
export interface ExprCol<T> {
  kind: 'Expr.Col'
  r: Expr<Type>
  g: Expr<Type>
  b: Expr<Type>
  loc?: Loc
  _type?: T
}
export interface ExprUnary<T> {
  kind: 'Expr.Unary'
  op: UnaryOp
  expr: Expr<Type>
  loc?: Loc
  _type?: T
}
export interface ExprBinary<T> {
  kind: 'Expr.Binary'
  op: BinaryOp
  exprLeft: Expr<Type>
  exprRight: Expr<Type>
  loc?: Loc
  _type?: T
}
export interface ExprParen<T> {
  kind: 'Expr.Paren'
  expr: Expr<T>
  loc?: Loc
}
export interface ExprIf<T> {
  kind: 'Expr.If'
  condition: Expr<TypeBool>
  thenBranch: Expr<T>
  elseBranch: Expr<T>
  loc?: Loc
}
export interface ExprBind<T> {
  kind: 'Expr.Bind'
  variable: string
  type?: Type
  value: Expr<Type>
  body: Expr<T>
  loc?: Loc
}
export interface ExprCall<T> {
  kind: 'Expr.Call'
  fn: string
  args: Expr<Type>[]
  loc?: Loc
  _type?: T
}

// ----------------------------------------------------------------------------
// AST Builders
// ----------------------------------------------------------------------------

// Expressions
export const Expr = {
  Var: <T extends Type>(variable): Expr<T> => ({ kind: 'Expr.Var', variable }),
  Lit: <T extends Type>(value: any): Expr<T> => ({ kind: 'Expr.Lit', value }),
  Unary: <T extends Type>({ op, expr }): Expr<T> => ({
    kind: 'Expr.Unary',
    op,
    expr,
  }),
  Binary: <T extends Type>({ op, exprLeft, exprRight }): Expr<T> => ({
    kind: 'Expr.Binary',
    op,
    exprLeft,
    exprRight,
  }),
  Paren: <T extends Type>(expr: Expr<T>): Expr<T> => ({
    kind: 'Expr.Paren',
    expr,
  }),
  If: <T extends Type>({ condition, thenBranch, elseBranch }): Expr<T> => ({
    kind: 'Expr.If',
    condition,
    thenBranch,
    elseBranch,
  }),
  Vec: ({ x, y }): Expr<TypeVec> => ({
    kind: 'Expr.Vec',
    x,
    y,
  }),
  Col: ({ r, g, b }): Expr<TypeCol> => ({
    kind: 'Expr.Col',
    r,
    g,
    b,
  }),
  Bind: <T extends Type>({ variable, type = null, value, body }): Expr<T> => ({
    kind: 'Expr.Bind',
    variable,
    value,
    type,
    body,
  }),
  Call: <T extends Type>({ fn, args }): Expr<T> => ({
    kind: 'Expr.Call',
    fn,
    args,
  }),
}
