import match from '../../util/match'
import { layout, str, seq, newline, Doc } from '../../data/doc'
import { Expr, UnaryOp, BinaryOp } from './ast'
import { Type } from './types'

const litToString = (x: any) => {
  if (Number.isInteger(x)) return x.toFixed(1)
  return x
}

const parens = (doc: Doc<string>) => seq(str('('), doc, str(')'))

// Types
const printType = (type: Type) =>
  match(type, {
    'Type.Vec': () => str('vec2'),
    'Type.Number': () => str('float'),
  })

// Expressions
const printExprReturnInner = (expr: Expr): Doc<string> =>
  seq(str('return'), str(' '), printExpr(expr), str(';'))

const printExprReturn = (expr: Expr): Doc<string> =>
  match(expr, {
    'Expr.Var': () => printExprReturnInner(expr),
    'Expr.Lit': () => printExprReturnInner(expr),
    'Expr.Unary': () => printExprReturnInner(expr),
    'Expr.Binary': () => printExprReturnInner(expr),
    'Expr.Paren': () => printExprReturnInner(expr),
    'Expr.If': () => printExprReturnInner(expr),
    'Expr.Vec': () => printExprReturnInner(expr),
    'Expr.Bind': ({ variable, type, value, body }) =>
      seq(
        printType(type),
        str(' '),
        str(variable),
        str(' '),
        str('='),
        str(' '),
        printExpr(value),
        str(';'),
        newline as Doc<string>,
        printExprReturn(body)
      ),
  })

const printExpr = (expr: Expr): Doc<string> =>
  match(expr, {
    'Expr.Var': ({ variable }) => str(variable),
    'Expr.Lit': ({ value }) => str(`${litToString(value)}`),
    'Expr.Unary': ({ op, expr }) => printUnaryExpr(op, printExpr(expr)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      printBinaryExpr(op, printExpr(exprLeft), printExpr(exprRight)),
    'Expr.Paren': ({ expr }) => seq(str('('), printExpr(expr), str(')')),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      seq(
        printExpr(condition),
        seq(str(''), str('?'), str(' '), printExpr(thenBranch)),
        seq(str(''), str(':'), str(' '), printExpr(elseBranch))
      ),
    'Expr.Vec': ({ x, y }) =>
      seq(
        str('vec2'),
        str('('),
        printExpr(x),
        str(','),
        printExpr(y),
        str(')')
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
        str(';'),
        newline as Doc<string>,
        printExpr(body)
      ),
  })

const printUnaryExpr = (op: UnaryOp, exprDoc: Doc<string>): Doc<string> => {
  switch (op) {
    // Prefix
    case '-': // fall-through
    case '!':
      return seq(str(op), exprDoc)
    // Prefix Function calls
    case 'abs': // fall-through
    case 'length':
      return seq(str(op), parens(exprDoc))
    // Postfix
    case 'projX':
      return seq(exprDoc, str('.x'))
    case 'projY':
      return seq(exprDoc, str('.y'))
  }
}

const printBinaryExpr = (
  op: BinaryOp,
  exprLeft: Doc<string>,
  exprRight: Doc<string>
): Doc<string> => {
  switch (op) {
    // Infix
    case '==': // fall-through
    case '!=': // fall-through
    case '&&': // fall-through
    case '||': // fall-through
    case '+': // fall-through
    case '-': // fall-through
    case '*': // fall-through
    case '/': // fall-through
    case '<': // fall-through
    case '<=': // fall-through
    case '>': // fall-through
    case '>=':
      return seq(exprLeft, str(' '), str(op), str(' '), exprRight)
    // Vector Infix
    case '<+>':
      return seq(exprLeft, str(' '), str('+'), str(' '), exprRight)
    case '<->':
      return seq(exprLeft, str(' '), str('-'), str(' '), exprRight)
    // Prefix
    case 'max': // fall-through
    case 'min':
      return seq(str(op), parens(seq(exprLeft, str(','), str(' '), exprRight)))
  }
}

// Program
export const print = (expr: Expr): string => layout(printExprReturn(expr))
