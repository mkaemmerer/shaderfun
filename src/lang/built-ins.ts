import { S } from '../util/vector'
import { Expr, UnaryOp, BinaryOp, Builtin } from './ast'
import { Type, TypeBool, TypeVec, TypeScalar, TypeCol } from './types'

type ArgS = Expr<TypeScalar>
type ArgV2 = Expr<TypeVec>
type ArgCol = Expr<TypeCol>
type ScalarRecoord = Record<string, Expr<TypeScalar>>

// Util
const unary = <T extends Type, TResult extends Type>(op: UnaryOp) => (
  expr: Expr<T>
): Expr<TResult> => Expr.Unary({ op, expr })

const binary = <T1 extends Type, T2 extends Type, TResult extends Type>(
  op: BinaryOp
) => (exprLeft: Expr<T1>, exprRight: Expr<T2>): Expr<TResult> =>
  Expr.Binary({ op, exprLeft, exprRight })

const call = <Args extends Expr<Type>[], TResult extends Type>(
  builtin: Builtin
) => (...exprs: Args): Expr<TResult> => Expr.Call({ fn: builtin, args: exprs })

// Language Primitives
type LiteralType<T> = T extends S
  ? TypeScalar
  : T extends boolean
  ? TypeBool
  : Type
type Literal = S | boolean

export const var$ = <T extends Type>(name: string): Expr<T> => Expr.Var(name)

export const if$ = <T extends Type>(
  condition: Expr<TypeBool>,
  thenBranch: Expr<T>,
  elseBranch: Expr<T>
): Expr<T> => Expr.If({ condition, thenBranch, elseBranch })

export const lit = <T extends Literal>(val: T): Expr<LiteralType<T>> =>
  Expr.Lit(val)

export const vec = ({ x, y }: ScalarRecoord): Expr<TypeVec> =>
  Expr.Vec({ x, y })

export const col = ({ r, g, b }: ScalarRecoord): Expr<TypeCol> =>
  Expr.Col({ r, g, b })

// Scalar
export const negate = unary<TypeScalar, TypeScalar>('-')
export const abs = call<[ArgS], TypeScalar>('abs')
export const floor = call<[ArgS], TypeScalar>('floor')
export const fract = call<[ArgS], TypeScalar>('fract')
export const sin = call<[ArgS], TypeScalar>('sin')
export const cos = call<[ArgS], TypeScalar>('cos')
export const log = call<[ArgS], TypeScalar>('log')
export const log2 = call<[ArgS], TypeScalar>('log2')
export const sqrt = call<[ArgS], TypeScalar>('sqrt')
export const saturate = call<[ArgS], TypeScalar>('saturate')
export const smoothstep = call<[ArgS, ArgS, ArgS], TypeScalar>('smoothstep')

export const plus = binary<TypeScalar, TypeScalar, TypeScalar>('+')
export const minus = binary<TypeScalar, TypeScalar, TypeScalar>('-')
export const times = binary<TypeScalar, TypeScalar, TypeScalar>('*')
export const div = binary<TypeScalar, TypeScalar, TypeScalar>('/')
export const atan = call<[ArgS, ArgS], TypeScalar>('atan')
export const max = call<[ArgS, ArgS], TypeScalar>('max')
export const min = call<[ArgS, ArgS], TypeScalar>('min')
export const mod = call<[ArgS, ArgS], TypeScalar>('mod')

// Vector
export const projX = unary<TypeVec, TypeScalar>('projX')
export const projY = unary<TypeVec, TypeScalar>('projY')
export const absV = call<[ArgV2], TypeVec>('absV')
export const length = call<[ArgV2], TypeScalar>('length')

export const plusV = binary<TypeVec, TypeVec, TypeVec>('<+>')
export const minusV = binary<TypeVec, TypeVec, TypeVec>('<->')
export const timesV = binary<TypeScalar, TypeVec, TypeVec>('*>')
export const dot = call<[ArgV2, ArgV2], TypeScalar>('dot')

// Color
export const projR = unary<TypeCol, TypeScalar>('projR')
export const projG = unary<TypeCol, TypeScalar>('projG')
export const projB = unary<TypeCol, TypeScalar>('projB')
export const mix = call<[ArgCol, ArgCol, ArgS], TypeCol>('mix')

// Boolean
export const not = unary<TypeBool, TypeBool>('!')

export const lt = binary<TypeScalar, TypeScalar, TypeBool>('<')
export const lteq = binary<TypeScalar, TypeScalar, TypeBool>('<=')
export const gt = binary<TypeScalar, TypeScalar, TypeBool>('>')
export const gteq = binary<TypeScalar, TypeScalar, TypeBool>('>=')
export const eq = binary<TypeScalar, TypeScalar, TypeBool>('==')
export const neq = binary<TypeScalar, TypeScalar, TypeBool>('!=')
export const and = binary<TypeBool, TypeBool, TypeBool>('&&')
export const or = binary<TypeBool, TypeBool, TypeBool>('||')
