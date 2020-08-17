import match from '../util/match'
import { empty } from './location'
import {
  readLocation,
  withKey,
  withArray,
  pure,
  sequenceM,
  ASTContext,
} from './ast-context'
import { Expr } from './ast'
import { Type } from './types'

const writeLocation = <T>(astM: ASTContext<Expr<T>>): ASTContext<Expr<T>> =>
  readLocation().flatMap((loc) =>
    astM.map((ast) => ({
      ...ast,
      loc,
    }))
  )

const tagExpr = <T extends Type>(expr: Expr<T>): ASTContext<Expr<T>> =>
  writeLocation(
    match(expr, {
      'Expr.Var': ({ variable }) => pure(Expr.Var(variable)),
      'Expr.Lit': ({ value }) => pure(Expr.Lit(value)),
      'Expr.Vec': ({ x, y }) => {
        const xM = withKey('x', tagExpr(x))
        const yM = withKey('y', tagExpr(y))
        return sequenceM([xM, yM]).map(([x, y]) => Expr.Vec({ x, y }))
      },
      'Expr.Col': ({ r, g, b }) => {
        const rM = withKey('r', tagExpr(r))
        const gM = withKey('g', tagExpr(g))
        const bM = withKey('b', tagExpr(b))
        return sequenceM([rM, gM, bM]).map(([r, g, b]) => Expr.Col({ r, g, b }))
      },
      'Expr.Unary': ({ op, expr }) =>
        withKey('expr', tagExpr(expr)).map((expr) => Expr.Unary({ op, expr })),
      'Expr.Binary': ({ exprLeft, op, exprRight }) => {
        const exprLeftM = withKey('exprLeft', tagExpr(exprLeft))
        const exprRightM = withKey('exprRight', tagExpr(exprRight))
        return sequenceM([exprLeftM, exprRightM]).map(([exprLeft, exprRight]) =>
          Expr.Binary({ exprLeft, op, exprRight })
        )
      },
      'Expr.Call': ({ fn, args }) => {
        const argsM = withArray('args', args.map(tagExpr))
        return argsM.map((args) => Expr.Call({ fn, args }))
      },
      'Expr.Paren': ({ expr }) =>
        withKey('expr', tagExpr<T>(expr)).map((expr) => Expr.Paren(expr)),
      'Expr.If': ({ condition, thenBranch, elseBranch }) => {
        const conditionM = withKey('condition', tagExpr(condition))
        const thenBranchM = withKey('thenBranch', tagExpr(thenBranch))
        const elseBranchM = withKey('elseBranch', tagExpr(elseBranch))
        return sequenceM([
          conditionM,
          thenBranchM,
          elseBranchM,
        ]).map(([condition, thenBranch, elseBranch]) =>
          Expr.If({ condition, thenBranch, elseBranch })
        )
      },
      'Expr.Bind': ({ variable, type, value, body }) => {
        const valueM = withKey('value', tagExpr(value))
        const bodyM = withKey('body', tagExpr(body))
        return sequenceM([valueM, bodyM]).map(([value, body]) =>
          Expr.Bind({ variable, type, value, body })
        )
      },
    })
  )

export const tagLocation = <T extends Type>(expr: Expr<T>): Expr<T> =>
  tagExpr(expr).run(empty)[1]
