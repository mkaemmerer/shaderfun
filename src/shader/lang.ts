import { Expr, UnaryOp, BinaryOp } from './ast'

// Util
const unary = (op: UnaryOp) => (expr: Expr): Expr => Expr.Unary({ op, expr })

const binary = (op: BinaryOp) => (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ op, exprLeft, exprRight })

// Language Primitives
export const var$ = (name: string) => Expr.Var(name)

export const lit = (val: any): Expr => Expr.Lit(val)

export const vec = ({ x, y }): Expr => Expr.Vec({ x, y })

// Scalar
export const abs = unary('abs')
export const sin = unary('sin')
export const cos = unary('cos')
export const log = unary('log')
export const negate = unary('-')
export const sqrt = unary('sqrt')
export const saturate = unary('saturate')

export const atan = binary('atan')
export const plus = binary('+')
export const minus = binary('-')
export const times = binary('*')
export const div = binary('/')
export const max = binary('max')
export const min = binary('min')
export const mod = binary('mod')

// Vector
export const absV = unary('absV')
export const length = unary('length')
export const projX = unary('projX')
export const projY = unary('projY')

export const plusV = binary('<+>')
export const minusV = binary('<->')
export const timesV = binary('*>')
export const dot = binary('dot')

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
