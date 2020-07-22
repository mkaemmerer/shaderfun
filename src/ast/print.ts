import match from '../util/match'
import { layout, str, seq, newline, Doc } from '../data/doc'
import { Expr } from './ast'

// Expressions
const printExpr = (expr: Expr): Doc<string> =>
  match(expr, {
    'Expr.Var': ({ variable }) => str(variable),
    'Expr.Lit': ({ value }) => str(`${value}`),
    'Expr.Unary': ({ op, expr }) => seq(str(op), printExpr(expr)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      seq(
        printExpr(exprLeft),
        str(' '),
        str(op),
        str(' '),
        printExpr(exprRight)
      ),
    'Expr.Paren': ({ expr }) => seq(str('('), printExpr(expr), str(')')),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      seq(
        printExpr(condition),
        seq(str(''), str('?'), str(' '), printExpr(thenBranch)),
        seq(str(''), str(':'), str(' '), printExpr(elseBranch))
      ),
    'Expr.Bind': ({ variable, value, body }) =>
      seq(
        str('let'),
        str(' '),
        str(variable),
        str(' '),
        str('='),
        str(' '),
        printExpr(value),
        newline as Doc<string>,
        printExpr(body)
      ),
  })

// Program
export const print = (expr: Expr): string => layout(printExpr(expr))
