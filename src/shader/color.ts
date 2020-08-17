import { S } from '../util/vector'
import { Expr, ShaderFunc, pure, Do, decl } from '../lang'
import {
  lit,
  if$,
  gt,
  abs,
  minus,
  floor,
  gteq,
  mod,
  div,
  eq,
  smoothstep,
  mix,
  col,
  sin,
  cos,
  plus,
  times,
} from '../lang/built-ins'
import { TypeScalar, TypeCol } from '../lang/types'

// Scalar -> Color
export type ColorRamp = ShaderFunc<TypeScalar, TypeCol>

const TAU = 2 * Math.PI
const EPSILON = lit(2)
const STRIPE_WIDTH = lit(10)

const grayscale = (value: S): Expr<TypeCol> =>
  col({ r: lit(value), g: lit(value), b: lit(value) })

const black = grayscale(0)
const darkGray = grayscale(0.15)
const midGray = grayscale(0.24)
const lightGray = grayscale(0.95)
const white = grayscale(1)

const outline = (fallback: ColorRamp): ColorRamp => (d) =>
  Do(function* () {
    const line = abs(minus(d, EPSILON))
    const fac = smoothstep(EPSILON, lit(0), line)
    const background = yield fallback(d).flatMap(decl)
    return pure(mix(background, black, fac))
  })

export const signRamp: ColorRamp = (d) => pure(if$(gt(d, lit(0)), white, black))

const stripes = (c1: Expr<TypeCol>, c2: Expr<TypeCol>): ColorRamp => (d) => {
  const cond = eq(mod(floor(div(d, STRIPE_WIDTH)), lit(2)), lit(0))
  return pure(if$(cond, c1, c2))
}

export const stripeRamp: ColorRamp = outline((d) =>
  Do(function* () {
    const valPos = yield stripes(white, lightGray)(d)
    const valNeg = yield stripes(darkGray, midGray)(d)
    return pure(if$(gteq(d, EPSILON), valPos, valNeg))
  })
)

const periodic = (offset: number, amp: number, freq: number, phase: number) => (
  d: Expr<TypeScalar>
) => {
  const wave = cos(times(lit(TAU), plus(times(d, lit(freq)), lit(phase))))
  return plus(lit(offset), times(lit(amp), wave))
}

export const rainbowRamp: ColorRamp = (d) =>
  Do(function* () {
    const r = yield decl(periodic(0.5, 0.5, 1.0, 0.0)(d))
    const g = yield decl(periodic(0.5, 0.5, 1.0, 0.33)(d))
    const b = yield decl(periodic(0.5, 0.5, 1.0, 0.67)(d))
    return pure(col({ r, g, b }))
  })

export const flameRamp: ColorRamp = (d) =>
  Do(function* () {
    const r = yield decl(sin(times(lit(TAU / 4), d)))
    const g = yield decl(times(d, d))
    const b = yield decl(
      plus(times(lit(0.4), sin(times(lit(TAU), d))), times(lit(0.6), d))
    )
    return pure(col({ r, g, b }))
  })
