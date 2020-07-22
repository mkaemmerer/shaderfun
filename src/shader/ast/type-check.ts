import match from '../../util/match'
import { Expr } from './ast'
import { Type, literalType, unifyAll } from './types'
import {
  TypeChecker,
  scoped,
  sequenceM,
  lookupVar,
  defineVar,
  pure,
  fail,
  withLocation,
  expectType,
  unifyVar,
} from './type-checker'
import { empty } from './type-context'

//-----------------------------------------------------------------------------
// Type Synthesis
//-----------------------------------------------------------------------------
const synthUnify = (typesM: TypeChecker<Type>[]): TypeChecker<Type> =>
  sequenceM(typesM).flatMap((types) =>
    unifyAll(types).maybe(
      (t) => pure(t),
      () => fail(`Couldn't unify types: ${types.join(', ')}`)
    )
  )

const synthExpr = (expr: Expr): TypeChecker<Type> =>
  match(expr, {
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(literalType(value)),
    'Expr.Unary': ({ expr, op }) => {
      switch (op) {
        case '-':
          return checkExpr(Type.Number)(expr).map(() => Type.Number)
        case '!':
          return checkExpr(Type.Bool)(expr).map(() => Type.Bool)
        case 'length':
          return checkExpr(Type.Vec)(expr).map(() => Type.Number)
      }
    },
    'Expr.Binary': ({ exprLeft, op, exprRight }) => {
      const exprs = [exprLeft, exprRight]
      switch (op) {
        // Polymorphic equality
        case '==': // fall-through
        case '!=':
          return synthUnify(exprs.map(synthExpr)).map(() => Type.Bool)
        // Boolean
        case '&&': // fall-through
        case '||':
          return sequenceM(exprs.map(checkExpr(Type.Bool))).map(() => Type.Bool)
        // Numeric
        case '+': // fall-through
        case '-': // fall-through
        case '*': // fall-through
        case '/':
          return sequenceM(exprs.map(checkExpr(Type.Number))).map(
            () => Type.Number
          )
        // Comparison
        case '<': // fall-through
        case '<=': // fall-through
        case '>': // fall-through
        case '>=':
          return sequenceM(exprs.map(checkExpr(Type.Number))).map(
            () => Type.Bool
          )
      }
    },
    'Expr.Paren': ({ expr }) => synthExpr(expr),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      pure(undefined)
        .flatMap(() => checkExpr(Type.Bool)(condition))
        .flatMap(() =>
          synthUnify([synthExpr(thenBranch), synthExpr(elseBranch)])
        ),
    'Expr.Vec': ({ x, y }) =>
      sequenceM([checkExpr(Type.Number)(x), checkExpr(Type.Number)(y)]).map(
        () => Type.Vec
      ),
    'Expr.Bind': ({ variable, type, value, body }) =>
      scoped(
        checkExpr(type)(value)
          .flatMap((variableType) => defineVar(variable, variableType))
          .flatMap(() => synthExpr(body))
      ),
  })

//-----------------------------------------------------------------------------
// Type Checking
//-----------------------------------------------------------------------------

const checkExprInner = (type: Type) => (expr: Expr): TypeChecker<Type> =>
  synthExpr(expr).flatMap(expectType(type))

const checkExpr = (type: Type) => (expr: Expr): TypeChecker<Type> =>
  withLocation(
    expr.loc,
    match(expr, {
      'Expr.Var': ({ variable }) => unifyVar(variable, type),
      'Expr.Lit':    () => checkExprInner(type)(expr), // prettier-ignore
      'Expr.Unary':  () => checkExprInner(type)(expr), // prettier-ignore
      'Expr.Binary': () => checkExprInner(type)(expr), // prettier-ignore
      'Expr.Vec':    () => checkExprInner(type)(expr), // prettier-ignore
      // Pass expectation forward to inner expression
      'Expr.Paren': ({ expr: exprBody }) => checkExpr(type)(exprBody),
      // Pass expectation forward through branches
      'Expr.If': ({ condition, thenBranch, elseBranch }) =>
        pure(undefined)
          .flatMap(() => checkExpr(Type.Bool)(condition))
          .flatMap(() =>
            synthUnify([
              checkExpr(type)(thenBranch),
              checkExpr(type)(elseBranch),
            ])
          ),
      // Set variable in context...
      'Expr.Bind': ({ variable, type: varType, value, body }) =>
        scoped(
          checkExpr(varType)(value)
            .flatMap((variableType) => defineVar(variable, variableType))
            .flatMap(() => checkExprInner(type)(body))
        ),
    })
  )

const checkProg = (expr: Expr): TypeChecker<Expr> =>
  checkExpr(Type.Number)(expr).map(() => expr)

export const typeCheck = (expr: Expr): Expr =>
  checkProg(expr)
    .run(empty)
    .map(([ctx, prog]) => prog)
    .coerce()
