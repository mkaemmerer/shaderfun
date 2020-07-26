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
        // Scalar -> Scalar
        case '-': // fall-through
        case 'abs': // fall-through
        case 'sin': // fall-through
        case 'cos': // fall-through
        case 'log': // fall-through
        case 'saturate': // fall-through
        case 'sqrt':
          return checkExpr(Type.Number)(expr).map(() => Type.Number)
        // Vector -> Scalar
        case 'projX': // fall-through
        case 'projY': // fall-through
        case 'length':
          return checkExpr(Type.Vec)(expr).map(() => Type.Number)
        // Bool -> Bool
        case '!':
          return checkExpr(Type.Bool)(expr).map(() => Type.Bool)
      }
    },
    'Expr.Binary': ({ exprLeft, op, exprRight }) => {
      const checkBinary = (typeLeft: Type, typeRight: Type, typeResult: Type) =>
        sequenceM([
          checkExpr(typeLeft)(exprLeft),
          checkExpr(typeRight)(exprRight),
        ]).map(() => typeResult)
      switch (op) {
        // Polymorphic equality
        case '==': // fall-through
        case '!=':
          return synthUnify([exprLeft, exprRight].map(synthExpr)).map(
            () => Type.Bool
          )
        // Bool -> Bool -> Bool
        case '&&': // fall-through
        case '||':
          return checkBinary(Type.Bool, Type.Bool, Type.Bool)
        // Scalar -> Scalar -> Scalar
        case '+': // fall-through
        case '-': // fall-through
        case '*': // fall-through
        case '/': // fall-through
        case 'max': // fall-through
        case 'min': // fall-through
        case 'mod': // fall-through
        case 'atan':
          return checkBinary(Type.Number, Type.Number, Type.Number)
        // Vector -> Vector -> Vector
        case '<+>': // fall-through
        case '<->': // fall-through
          return checkBinary(Type.Vec, Type.Vec, Type.Vec)
        // Scalar -> Vector -> Vector
        case '*>':
          return checkBinary(Type.Number, Type.Vec, Type.Vec)
        // Vector -> Vector -> Scalar
        case 'dot':
          return checkBinary(Type.Vec, Type.Vec, Type.Number)
        // Scalar -> Scalar -> Bool
        case '<': // fall-through
        case '<=': // fall-through
        case '>': // fall-through
        case '>=':
          return checkBinary(Type.Number, Type.Number, Type.Bool)
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
