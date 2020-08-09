import { S } from '../util/vector'
import { Expr, Program } from '../lang'
import { pure, Do, decl } from '../lang/ast-builder'
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
} from '../lang/built-ins'

const EPSILON = lit(2)
const STRIPE_WIDTH = lit(10)

const grayscale = (value: S): Expr =>
  Expr.Col({ r: lit(value), g: lit(value), b: lit(value) })

const black = grayscale(0)
const darkGray = grayscale(0.15)
const midGray = grayscale(0.24)
const lightGray = grayscale(0.95)
const white = grayscale(1)

// Scalar -> Color
export type ColorRamp = Program

export const signRamp: ColorRamp = (d) => pure(if$(gt(d, lit(0)), white, black))

const stripes = (c1: Expr, c2: Expr): ColorRamp => (d) => {
  const cond = eq(mod(floor(div(d, STRIPE_WIDTH)), lit(2)), lit(0))
  return pure(if$(cond, c1, c2))
}

const outline = (fallback: ColorRamp): ColorRamp => (d) =>
  Do(function* () {
    const line = abs(minus(d, EPSILON))
    const fac = smoothstep(EPSILON, lit(0), line)
    const background = yield fallback(d).flatMap(decl)
    return pure(mix(background, black, fac))
  })

export const stripeRamp: ColorRamp = outline((d) =>
  Do(function* () {
    const valPos = yield stripes(white, lightGray)(d)
    const valNeg = yield stripes(darkGray, midGray)(d)
    return pure(if$(gteq(d, EPSILON), valPos, valNeg))
  })
)
