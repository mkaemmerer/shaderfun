import match from '../../util/match'
import { Expr } from './ast'

type KSingle = (e: Expr) => Expr
type KArray = (e: Expr[]) => Expr

const liftDecls = (...exprs: Expr[]) => (k: KArray): Expr =>
  exprs.reduce<KArray>((ka: KArray, expr: Expr): KArray => {
    const kArray: KArray = (xs: Expr[]) =>
      liftDecl(expr)((x) => {
        const kSingle: KSingle = (x: Expr) => ka([x, ...xs])
        return kSingle(x)
      })
    return kArray
  }, k)([])

const liftDecl = (expr: Expr) => (k: KSingle): Expr =>
  match(expr, {
    'Expr.Var': () => k(expr),
    'Expr.Lit': () => k(expr),
    'Expr.Paren': ({ expr }) => liftDecl(expr)((inner) => k(Expr.Paren(inner))),
    'Expr.Unary': ({ op, expr }) =>
      liftDecl(expr)((inner) => k(Expr.Unary({ op, expr: inner }))),
    'Expr.Vec': ({ x, y }) =>
      liftDecls(x, y)(([x, y]) => k(Expr.Vec({ x, y }))), // prettier-ignore
    'Expr.Binary': ({ op, exprLeft, exprRight }) =>
      liftDecls(
        exprLeft,
        exprRight
      )(([exprLeft, exprRight]) => k(Expr.Binary({ op, exprLeft, exprRight }))),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      liftDecls(
        condition,
        thenBranch,
        elseBranch
      )(([condition, thenBranch, elseBranch]) =>
        k(Expr.If({ condition, thenBranch, elseBranch }))
      ),
    'Expr.Bind': ({ variable, type, value, body }) =>
      Expr.Bind({ variable, type, value, body: liftDecl(body)(k) }),
  })

const id = (x) => x
const normalizeExpr = (expr: Expr): Expr => liftDecl(expr)(id)

export const normalize = (expr: Expr): Expr => normalizeExpr(expr)
