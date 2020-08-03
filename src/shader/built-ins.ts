import { Expr, UnaryOp, BinaryOp, Builtin } from './lang'

// Util
const unary = (op: UnaryOp) => (expr: Expr): Expr => Expr.Unary({ op, expr })

const binary = (op: BinaryOp) => (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ op, exprLeft, exprRight })

const call = (builtin: Builtin) => (...exprs: Expr[]): Expr =>
  Expr.Call({ fn: builtin, args: exprs })

// Language Primitives
export const var$ = (name: string): Expr => Expr.Var(name)

export const if$ = (condition: Expr, thenBranch: Expr, elseBranch: Expr) =>
  Expr.If({ condition, thenBranch, elseBranch })

export const lit = (val: any): Expr => Expr.Lit(val)

export const vec = ({ x, y }): Expr => Expr.Vec({ x, y })

export const col = ({ r, g, b }): Expr => Expr.Col({ r, g, b })

// Scalar
export const negate = unary('-')
export const abs = call('abs')
export const floor = call('floor')
export const fract = call('fract')
export const sin = call('sin')
export const cos = call('cos')
export const log = call('log')
export const sqrt = call('sqrt')
export const saturate = call('saturate')
export const smoothstep = call('smoothstep')

export const plus = binary('+')
export const minus = binary('-')
export const times = binary('*')
export const div = binary('/')
export const atan = call('atan')
export const max = call('max')
export const min = call('min')
export const mod = call('mod')

// Vector
export const projX = unary('projX')
export const projY = unary('projY')
export const absV = call('absV')
export const length = call('length')

export const plusV = binary('<+>')
export const minusV = binary('<->')
export const timesV = binary('*>')
export const dot = call('dot')

// Color
export const projR = unary('projR')
export const projG = unary('projG')
export const projB = unary('projB')
export const mix = call('mix')

// Boolean
export const not = unary('!')

export const lt = binary('<')
export const lteq = binary('<=')
export const gt = binary('>')
export const gteq = binary('>=')
export const eq = binary('==')
export const neq = binary('!=')
export const and = binary('&&')
export const or = binary('||')
