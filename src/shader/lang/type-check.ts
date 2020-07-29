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
      const checkUnary = (typeIn: Type, typeResult: Type) =>
        checkExpr(typeIn)(expr).map(() => typeResult)
      switch (op) {
        // Scalar -> Scalar
        case '-': // fall-through
        case 'abs': // fall-through
        case 'sin': // fall-through
        case 'cos': // fall-through
        case 'log': // fall-through
        case 'saturate': // fall-through
        case 'sqrt':
          return checkUnary(Type.Scalar, Type.Scalar)
        // Vector -> Vector
        case 'absV':
          return checkUnary(Type.Vec, Type.Vec)
        // Vector -> Scalar
        case 'projX': // fall-through
        case 'projY': // fall-through
        case 'length':
          return checkUnary(Type.Vec, Type.Scalar)
        // Bool -> Bool
        case '!':
          return checkUnary(Type.Bool, Type.Bool)
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
          return checkBinary(Type.Scalar, Type.Scalar, Type.Scalar)
        // Vector -> Vector -> Vector
        case '<+>': // fall-through
        case '<->': // fall-through
          return checkBinary(Type.Vec, Type.Vec, Type.Vec)
        // Scalar -> Vector -> Vector
        case '*>':
          return checkBinary(Type.Scalar, Type.Vec, Type.Vec)
        // Vector -> Vector -> Scalar
        case 'dot':
          return checkBinary(Type.Vec, Type.Vec, Type.Scalar)
        // Scalar -> Scalar -> Bool
        case '<': // fall-through
        case '<=': // fall-through
        case '>': // fall-through
        case '>=':
          return checkBinary(Type.Scalar, Type.Scalar, Type.Bool)
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
      sequenceM([checkExpr(Type.Scalar)(x), checkExpr(Type.Scalar)(y)]).map(
        () => Type.Vec
      ),
    'Expr.Bind': ({ variable, type, value, body }) =>
      scoped(
        (type == null ? synthExpr(value) : checkExpr(type)(value))
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
          (varType == null ? synthExpr(value) : checkExpr(varType)(value))
            .flatMap((variableType) => defineVar(variable, variableType))
            .flatMap(() => checkExprInner(type)(body))
        ),
    })
  )

//-----------------------------------------------------------------------------
// Populate Types
//-----------------------------------------------------------------------------
const populateExpr = (expr: Expr): TypeChecker<Expr> =>
  match(expr, {
    'Expr.Var': () => pure(expr),
    'Expr.Lit': () => pure(expr),
    'Expr.Unary': ({ op, expr }) =>
      populateExpr(expr).map((expr) => Expr.Unary({ op, expr })),
    'Expr.Binary': ({ op, exprLeft, exprRight }) =>
      sequenceM([
        populateExpr(exprLeft),
        populateExpr(exprRight),
      ]).map(([exprLeft, exprRight]) =>
        Expr.Binary({ exprLeft, op, exprRight })
      ),
    'Expr.Vec': ({ x, y }) =>
      sequenceM([populateExpr(x), populateExpr(y)]).map(([x, y]) =>
        Expr.Vec({ x, y })
      ),
    'Expr.Paren': ({ expr }) =>
      populateExpr(expr).map((expr) => Expr.Paren(expr)),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      sequenceM([
        populateExpr(condition),
        populateExpr(thenBranch),
        populateExpr(elseBranch),
      ]).map(([condition, thenBranch, elseBranch]) =>
        Expr.If({ condition, thenBranch, elseBranch })
      ),
    // Populate binding with type
    'Expr.Bind': ({ variable, value, body }) => {
      const valueM = populateExpr(value)
      const typeM = synthExpr(value)
      const bodyM = scoped(
        typeM
          .flatMap((variableType) => defineVar(variable, variableType))
          .flatMap(() => populateExpr(body))
      )
      return sequenceM([valueM, bodyM]).flatMap(([value, body]) =>
        typeM.map((type) => Expr.Bind({ variable, type, value, body }))
      )
    },
  })

export const typeCheck = (expr: Expr): Expr =>
  defineVar('p', Type.Vec) // Set default bindings
    .flatMap(() => synthExpr(expr))
    .flatMap(() => populateExpr(expr))
    .run(empty)
    .map(([ctx, expr]) => expr)
    .coerce()
