import { Expr } from './ast'

// Language Primitives
export const var$ = (name: string) => Expr.Var(name)

export const lit = (val: any): Expr => Expr.Lit(val)

export const vec = ({ x, y }): Expr => Expr.Vec({ x, y })

export const length = (expr: Expr): Expr => Expr.Unary({ op: 'length', expr })

export const abs = (expr: Expr): Expr => Expr.Unary({ op: 'abs', expr })

export const plus = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: '+', exprRight })

export const minus = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: '-', exprRight })

export const max = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: 'max', exprRight })

export const min = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: 'min', exprRight })

export const projX = (expr: Expr): Expr => Expr.Unary({ op: 'projX', expr })

export const projY = (expr: Expr): Expr => Expr.Unary({ op: 'projY', expr })
