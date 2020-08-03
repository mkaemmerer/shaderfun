import match from '../../util/match'
import {
  layout,
  str,
  seq,
  newline,
  concat,
  indent,
  Doc,
  intersperse,
} from '../../data/doc'
import { Expr, UnaryOp, BinaryOp } from './ast'
import { Type } from './types'

const litToString = (x: any) => {
  if (Number.isInteger(x)) return x.toFixed(1)
  return x
}

const parens = (doc: Doc<string>) => seq(str('('), doc, str(')'))
const list = (docs: Doc<string>[]) => intersperse(docs, str(','))
const indentBlock = (doc: Doc<string>): Doc<string> =>
  indent(concat(newline as Doc<string>, doc))

// Types
const printType = (type: Type) =>
  match(type, {
    'Type.Bool': () => str('bool'),
    'Type.Vec': () => str('vec2'),
    'Type.Col': () => str('vec3'),
    'Type.Scalar': () => str('float'),
  })

// Expressions
const printExprReturnInner = (expr: Expr): Doc<string> =>
  seq(str('return'), str(' '), printExpr(expr), str(';'))

const printExprReturn = (expr: Expr): Doc<string> =>
  match(expr, {
    'Expr.Var': () => printExprReturnInner(expr),
    'Expr.Lit': () => printExprReturnInner(expr),
    'Expr.Vec': () => printExprReturnInner(expr),
    'Expr.Col': () => printExprReturnInner(expr),
    'Expr.Unary': () => printExprReturnInner(expr),
    'Expr.Binary': () => printExprReturnInner(expr),
    'Expr.Call': () => printExprReturnInner(expr),
    'Expr.Paren': () => printExprReturnInner(expr),
    'Expr.If': () => printExprReturnInner(expr),
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
    'Expr.Vec': ({ x, y }) =>
      seq(str('vec2'), parens(list([x, y].map(printExpr)))),
    'Expr.Col': ({ r, g, b }) =>
      seq(str('vec3'), parens(list([r, g, b].map(printExpr)))),
    'Expr.Unary': ({ op, expr }) => printUnaryExpr(op, printExpr(expr)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      printBinaryExpr(op, printExpr(exprLeft), printExpr(exprRight)),
    'Expr.Call': ({ fn, args }) =>
      seq(printFn(fn), parens(list(args.map(printExpr)))),
    'Expr.Paren': ({ expr }) => seq(str('('), printExpr(expr), str(')')),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      seq(
        printExpr(condition),
        indentBlock(seq(str('?'), str(' '), parens(printExpr(thenBranch)))),
        indentBlock(seq(str(':'), str(' '), parens(printExpr(elseBranch))))
      ),
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
        printExpr(body)
      ),
  })

const printFn = (fn: string): Doc<string> => {
  switch (fn) {
    // Convert statically-typed builtins to their polymorphic versions
    case 'absV':
      return str('abs')
    default:
      return str(fn)
  }
}

const printUnaryExpr = (op: UnaryOp, exprDoc: Doc<string>): Doc<string> => {
  switch (op) {
    // Prefix
    case '-': // fall-through
    case '!':
      return seq(str(op), exprDoc)
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
    case '*>':
      return seq(exprLeft, str(' '), str('*'), str(' '), exprRight)
    case '<+>':
      return seq(exprLeft, str(' '), str('+'), str(' '), exprRight)
    case '<->':
      return seq(exprLeft, str(' '), str('-'), str(' '), exprRight)
  }
}

// Program
export const print = (expr: Expr): string => layout(printExprReturn(expr))
