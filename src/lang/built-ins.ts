import { S } from '../util/vector'
import { Expr, UnaryOp, BinaryOp, Builtin } from './ast'
import { Type, TypeBool, TypeV2, TypeS, TypeCol } from './types'

type ArgS = Expr<TypeS>
type ArgV2 = Expr<TypeV2>
type ArgCol = Expr<TypeCol>
type ScalarRecoord = Record<string, Expr<TypeS>>

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
type LiteralType<T> = T extends S ? TypeS : T extends boolean ? TypeBool : Type
type Literal = S | boolean

export const var$ = <T extends Type>(name: string): Expr<T> => Expr.Var(name)

export const if$ = <T extends Type>(
  condition: Expr<TypeBool>,
  thenBranch: Expr<T>,
  elseBranch: Expr<T>
): Expr<T> => Expr.If({ condition, thenBranch, elseBranch })

export const lit = <T extends Literal>(val: T): Expr<LiteralType<T>> =>
  Expr.Lit(val)

export const vec = ({ x, y }: ScalarRecoord): Expr<TypeV2> => Expr.Vec({ x, y })

export const col = ({ r, g, b }: ScalarRecoord): Expr<TypeCol> =>
  Expr.Col({ r, g, b })

// Scalar
export const negate = unary<TypeS, TypeS>('-')
export const abs = call<[ArgS], TypeS>('abs')
export const floor = call<[ArgS], TypeS>('floor')
export const fract = call<[ArgS], TypeS>('fract')
export const sin = call<[ArgS], TypeS>('sin')
export const cos = call<[ArgS], TypeS>('cos')
export const log = call<[ArgS], TypeS>('log')
export const log2 = call<[ArgS], TypeS>('log2')
export const sqrt = call<[ArgS], TypeS>('sqrt')
export const saturate = call<[ArgS], TypeS>('saturate')
export const smoothstep = call<[ArgS, ArgS, ArgS], TypeS>('smoothstep')

export const plus = binary<TypeS, TypeS, TypeS>('+')
export const minus = binary<TypeS, TypeS, TypeS>('-')
export const times = binary<TypeS, TypeS, TypeS>('*')
export const div = binary<TypeS, TypeS, TypeS>('/')
export const atan = call<[ArgS, ArgS], TypeS>('atan')
export const max = call<[ArgS, ArgS], TypeS>('max')
export const min = call<[ArgS, ArgS], TypeS>('min')
export const mod = call<[ArgS, ArgS], TypeS>('mod')

// Vector
export const projX = unary<TypeV2, TypeS>('projX')
export const projY = unary<TypeV2, TypeS>('projY')
export const absV = call<[ArgV2], TypeV2>('absV')
export const length = call<[ArgV2], TypeS>('length')

export const plusV = binary<TypeV2, TypeV2, TypeV2>('<+>')
export const minusV = binary<TypeV2, TypeV2, TypeV2>('<->')
export const timesV = binary<TypeS, TypeV2, TypeV2>('*>')
export const dot = call<[ArgV2, ArgV2], TypeS>('dot')

// Color
export const projR = unary<TypeCol, TypeS>('projR')
export const projG = unary<TypeCol, TypeS>('projG')
export const projB = unary<TypeCol, TypeS>('projB')
export const mix = call<[ArgCol, ArgCol, ArgS], TypeCol>('mix')

// Boolean
export const not = unary<TypeBool, TypeBool>('!')

export const lt = binary<TypeS, TypeS, TypeBool>('<')
export const lteq = binary<TypeS, TypeS, TypeBool>('<=')
export const gt = binary<TypeS, TypeS, TypeBool>('>')
export const gteq = binary<TypeS, TypeS, TypeBool>('>=')
export const eq = binary<TypeS, TypeS, TypeBool>('==')
export const neq = binary<TypeS, TypeS, TypeBool>('!=')
export const and = binary<TypeBool, TypeBool, TypeBool>('&&')
export const or = binary<TypeBool, TypeBool, TypeBool>('||')
