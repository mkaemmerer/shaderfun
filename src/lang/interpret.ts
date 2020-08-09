import match from '../util/match'
import { V2, S, plus, minus, times, dot, length } from '../util/vector'
import { ColorRGB, mix } from '../util/color'
import { State } from '../monad/state'
import {
  BindingContext,
  empty,
  lookupVar as lookupVarContext,
  defineVar as defineVarContext,
} from './binding-context'
import { UnaryOp, BinaryOp, Expr } from './ast'
import { Program, run } from './program'

type Result = S | V2 | ColorRGB | boolean | ResultFunction
type ResultFunction = (...result: Result[]) => Result

type Context = BindingContext<Result>
type Interpreter<T> = State<Context, T>

const pure = <T>(x: T): Interpreter<T> => State.of(x)

const lookupVar = (variable: string): Interpreter<Result> =>
  State.get<Context>().flatMap((ctx) =>
    lookupVarContext<Result>(variable)(ctx).maybe(
      (result) => pure(result),
      () => {
        throw new Error(`Variable ${variable} not defined`)
      }
    )
  )

const defineVar = (variable: string, result: Result): Interpreter<undefined> =>
  State.modify(defineVarContext(variable, result))

export const sequenceM = <T>(arrM: Interpreter<T>[]): Interpreter<T[]> =>
  arrM.reduce(
    (p, q) => p.flatMap((pInner) => q.map((qInner) => [...pInner, qInner])),
    pure([] as T[])
  )

const interpretUnary = (op: UnaryOp) => (result: Result): Result => {
  switch (op) {
    // Scalar -> Scalar
    case '-':
      return -(result as S)
    // Vector -> Scalar
    case 'projX':
      return (result as V2).x
    case 'projY':
      return (result as V2).y
    // Color -> Scalar
    case 'projR':
      return (result as ColorRGB).r
    case 'projG':
      return (result as ColorRGB).g
    case 'projB':
      return (result as ColorRGB).b
    // Bool -> Bool
    case '!':
      return !(result as boolean)
  }
}
const interpretBinary = (op: BinaryOp) => (
  left: Result,
  right: Result
): Result => {
  switch (op) {
    // Polymorphic equality
    case '==':
      return left == right
    case '!=':
      return left != right
    // Bool -> Bool -> Bool
    case '&&':
      return left && right
    case '||':
      return left || right
    // Scalar -> Scalar -> Scalar
    case '+':
      return (left as S) + (right as S)
    case '-':
      return (left as S) - (right as S)
    case '*':
      return (left as S) * (right as S)
    case '/':
      return (left as S) / (right as S)
    // Vector -> Vector -> Vector
    case '<+>':
      return plus(left as V2, right as V2)
    case '<->':
      return minus(left as V2, right as V2)
    // Scalar -> Vector -> Vector
    case '*>':
      return times(left as S, right as V2)
    // Scalar -> Scalar -> Bool
    case '<':
      return (left as S) < (right as S)
    case '<=':
      return (left as S) <= (right as S)
    case '>':
      return (left as S) > (right as S)
    case '>=':
      return (left as S) >= (right as S)
  }
}

const interpretExpr = (expr: Expr): Interpreter<Result> =>
  match(expr, {
    'Expr.Var': ({ variable }) => lookupVar(variable),
    'Expr.Lit': ({ value }) => pure(value),
    'Expr.Vec': ({ x, y }) =>
      sequenceM([x, y].map(interpretExpr)).map(([x, y]) => ({ x, y })),
    'Expr.Col': ({ r, g, b }) =>
      sequenceM([r, g, b].map(interpretExpr)).map(([r, g, b]) => ({ r, g, b })),
    'Expr.Unary': ({ expr, op }) => interpretExpr(expr).map(interpretUnary(op)),
    'Expr.Binary': ({ exprLeft, op, exprRight }) =>
      sequenceM(
        [exprLeft, exprRight].map(interpretExpr)
      ).map(([rLeft, rRight]) => interpretBinary(op)(rLeft, rRight)),
    'Expr.Call': ({ fn, args }) =>
      lookupVar(fn).flatMap((f) =>
        sequenceM<Result>(args.map(interpretExpr)).map((args) =>
          (f as ResultFunction)(...args)
        )
      ),
    'Expr.Paren': ({ expr }) => interpretExpr(expr),
    'Expr.If': ({ condition, thenBranch, elseBranch }) =>
      interpretExpr(condition).flatMap((condition) =>
        condition ? interpretExpr(thenBranch) : interpretExpr(elseBranch)
      ),
    'Expr.Bind': ({ variable, value, body }) =>
      interpretExpr(value)
        .flatMap((value) => defineVar(variable, value))
        .flatMap(() => interpretExpr(body)),
  })

// Builtins
const abs = Math.abs
const atan = Math.atan2
const cos = Math.cos
const floor = Math.floor
const log = Math.log
const max = Math.max
const min = Math.min
const sin = Math.sin
const sqrt = Math.sqrt
const absV = (v: V2): V2 => ({ x: abs(v.x), y: abs(v.y) })
const clamp = (lo: S, hi: S) => (s: S) => max(min(s, hi), lo)
const fract = (x: S) => x - floor(x)
const mod = (x: S, b: S) => ((x % b) + b) % b
const saturate = clamp(0, 1)
const smoothstep = (edge0: S, edge1: S, x: S): S => {
  const t = saturate((x - edge0) / (edge1 - edge0))
  return t * t * (3.0 - 2.0 * t)
}

const defineBuiltins = sequenceM([
  defineVar('abs', abs),
  defineVar('absV', absV),
  defineVar('atan', atan),
  defineVar('cos', cos),
  defineVar('dot', dot),
  defineVar('floor', floor),
  defineVar('fract', fract),
  defineVar('length', length),
  defineVar('log', log),
  defineVar('max', max),
  defineVar('min', min),
  defineVar('mix', (c1: ColorRGB, c2: ColorRGB, fac: S) => mix(c1, c2)(fac)),
  defineVar('mod', mod),
  defineVar('saturate', saturate),
  defineVar('sin', sin),
  defineVar('smoothstep', smoothstep),
  defineVar('sqrt', sqrt),
])

export const interpret = (program: Program) => {
  const expr: Expr = run(program)
  return (p: V2): ColorRGB =>
    defineBuiltins
      .flatMap(() => defineVar('p', p))
      .flatMap(() => interpretExpr(expr))
      .run(empty)[1] as ColorRGB
}
