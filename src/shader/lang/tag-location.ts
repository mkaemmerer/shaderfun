import match from '../../util/match'
import { empty } from './location'
import {
  readLocation,
  withKey,
  withArray,
  pure,
  ASTContext,
} from './ast-context'
import { Expr } from './ast'
import { sequenceM } from './type-checker'

const writeLocation = (astM: ASTContext<Expr>): ASTContext<any> =>
  readLocation().flatMap((loc) =>
    astM.map((ast) => ({
      ...ast,
      loc,
    }))
  )

const tagExpr = (expr: Expr): ASTContext<Expr> =>
  writeLocation(
    match(expr, {
      'Expr.Var': ({ variable }) => pure(Expr.Var(variable)),
      'Expr.Lit': ({ value }) => pure(Expr.Lit(value)),

      'Expr.Unary': ({ op, expr }) =>
        withKey('expr', tagExpr(expr)).map((expr) => Expr.Unary({ op, expr })),
      'Expr.Binary': ({ exprLeft, op, exprRight }) => {
        const exprLeftM = withKey('exprLeft', tagExpr(exprLeft))
        const exprRightM = withKey('exprRight', tagExpr(exprRight))
        return exprLeftM.flatMap((exprLeft) =>
          exprRightM.flatMap((exprRight) =>
            pure(Expr.Binary({ exprLeft, op, exprRight }))
          )
        )
      },
      'Expr.Call': ({ fn, args }) => {
        const argsM = withArray('args', args.map(tagExpr))
        return argsM.flatMap((args) => pure(Expr.Call({ fn, args })))
      },
      'Expr.Paren': ({ expr }) =>
        withKey('expr', tagExpr(expr)).map((expr) => Expr.Paren(expr)),
      'Expr.If': ({ condition, thenBranch, elseBranch }) => {
        const conditionM = withKey('condition', tagExpr(condition))
        const thenBranchM = withKey('thenBranch', tagExpr(thenBranch))
        const elseBranchM = withKey('elseBranch', tagExpr(elseBranch))
        return conditionM.flatMap((condition) =>
          thenBranchM.flatMap((thenBranch) =>
            elseBranchM.flatMap((elseBranch) =>
              pure(Expr.If({ condition, thenBranch, elseBranch }))
            )
          )
        )
      },
      'Expr.Vec': ({ x, y }) => {
        const xM = withKey('x', tagExpr(x))
        const yM = withKey('y', tagExpr(y))
        return xM.flatMap((x) => yM.flatMap((y) => pure(Expr.Vec({ x, y }))))
      },
      'Expr.Bind': ({ variable, type, value, body }) => {
        const valueM = withKey('value', tagExpr(value))
        const bodyM = withKey('body', tagExpr(body))
        return valueM.flatMap((value) =>
          bodyM.flatMap((body) =>
            pure(Expr.Bind({ variable, type, value, body }))
          )
        )
      },
    })
  )

export const tagLocation = (expr: Expr) => tagExpr(expr).run(empty)[1]
