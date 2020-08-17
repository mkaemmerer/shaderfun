import match from '../util/match'
import { Expr } from './ast'
import { tagLocation } from './tag-location'
import { typeCheck } from './type-check'

type KSingle = <T>(e: Expr<T>) => Expr<T>
type KArray = <T>(e: Expr<T>[]) => Expr<T>

const liftDecls = <T>(...exprs: Expr<T>[]) => (k: KArray): Expr<T> =>
  exprs.reduce<KArray>((ka: KArray, expr: Expr<T>): KArray => {
    const kArray: KArray = (xs: Expr<T>[]) =>
      liftDecl(expr, (x) => {
        const kSingle: KSingle = (x: Expr<T>) => ka([x, ...xs])
        return kSingle(x)
      })
    return kArray
  }, k)([])

const liftDecl = <T>(expr: Expr<T>, k: KSingle): Expr<T> =>
  match(expr, {
    'Expr.Var': () => k(expr),
    'Expr.Lit': () => k(expr),
    'Expr.Vec': ({ x, y }) =>
      liftDecls(x, y)(([x, y]) => k(Expr.Vec({ x, y }))),
    'Expr.Col': ({ r, g, b }) =>
      liftDecls(r, g, b)(([r, g, b]) => k(Expr.Col({ r, g, b }))),
    'Expr.Paren': ({ expr }) => liftDecl(expr, (inner) => k(Expr.Paren(inner))),
    'Expr.Unary': ({ op, expr }) =>
      liftDecl(expr, (inner) => k(Expr.Unary({ op, expr: inner }))),
    'Expr.Binary': ({ op, exprLeft, exprRight }) =>
      liftDecls(
        exprLeft,
        exprRight
      )(([exprLeft, exprRight]) => k(Expr.Binary({ op, exprLeft, exprRight }))),
    'Expr.Call': ({ fn, args }) =>
      liftDecls(...args)((args) => k(Expr.Call({ fn, args }))),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      liftDecls(
        condition,
        thenBranch,
        elseBranch
      )(([condition, thenBranch, elseBranch]) =>
        k(Expr.If({ condition, thenBranch, elseBranch }))
      ),
    'Expr.Bind': ({ variable, type, value, body }) =>
      Expr.Bind({ variable, type, value, body: liftDecl(body, k) }),
  })

const precedenceTable = [
  [],
  ['unaryNegate'],
  ['projX', 'projY', 'projR', 'projG', 'projB'],
  ['*', '/'],
  ['*>'],
  ['+', '-'],
  ['<+>', '<->'],
  ['<', '<=', '>', '>='],
  ['==', '!='],
  ['&&'],
  ['||'],
  ['?:'],
]
const top = Infinity
const opPrecedence = (op) =>
  precedenceTable.findIndex((ops) => ops.includes(op))

const fixPrecedence = <T>(expr: Expr<T>, prec: number): Expr<T> =>
  match(expr, {
    'Expr.Var': () => expr,
    'Expr.Lit': () => expr,
    'Expr.Vec': ({ x, y }) =>
      Expr.Vec({
        x: fixPrecedence(x, top),
        y: fixPrecedence(y, top),
      }),
    'Expr.Col': ({ r, g, b }) =>
      Expr.Col({
        r: fixPrecedence(r, top),
        g: fixPrecedence(g, top),
        b: fixPrecedence(b, top),
      }),
    'Expr.Paren': ({ expr }) => Expr.Paren(fixPrecedence(expr, top)),
    'Expr.Unary': ({ op, expr }) => {
      const opPrec = opPrecedence(op === '-' ? 'unaryNegate' : op)
      const inner = Expr.Unary({ op, expr: fixPrecedence(expr, opPrec) })
      return opPrec >= prec ? Expr.Paren(inner) : inner
    },
    'Expr.Binary': ({ op, exprLeft, exprRight }) => {
      const opPrec = opPrecedence(op)
      const inner = Expr.Binary({
        op,
        exprLeft: fixPrecedence(exprLeft, opPrecedence(op)),
        exprRight: fixPrecedence(exprRight, opPrecedence(op)),
      })
      return opPrec >= prec ? Expr.Paren(inner) : inner
    },
    'Expr.Call': ({ fn, args }) =>
      Expr.Call({
        fn,
        args: args.map((arg: Expr<T>) => fixPrecedence(arg, top)),
      }),
    'Expr.If': ({ condition, thenBranch, elseBranch }) => {
      const opPrec = opPrecedence('?:')
      const inner = Expr.If({
        condition: fixPrecedence(condition, prec),
        thenBranch: fixPrecedence(thenBranch, prec),
        elseBranch: fixPrecedence(elseBranch, prec),
      })
      return opPrec >= prec ? Expr.Paren(inner) : inner
    },
    'Expr.Bind': ({ variable, type, value, body }) =>
      Expr.Bind({
        variable,
        type,
        value: fixPrecedence(value, top),
        body: fixPrecedence(body, top),
      }),
  })

const id = (x) => x
const normalizeExpr = <T>(expr: Expr<T>): Expr<T> => {
  const tagged = tagLocation(expr)
  const typedExpr = typeCheck(tagged)
  const withBindings = liftDecl(typedExpr, id)
  const withPrecedence = fixPrecedence(withBindings, top)
  return withPrecedence
}

export const normalize = normalizeExpr
