import { S } from '../util/vector'
import { Expr } from './lang'
import { Shader, pure, Do } from './shader'
import {
  lit,
  if$,
  negate,
  gt,
  abs,
  floor,
  lt,
  lteq,
  gteq,
  mod,
  div,
  eq,
} from './built-ins'

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
export type ColorRamp = (e: Expr) => Shader<Expr>

export const signRamp: ColorRamp = (d) => pure(if$(gt(d, lit(0)), white, black))

const stripes = (c1: Expr, c2: Expr): ColorRamp => (d) => {
  const cond = eq(mod(floor(div(d, STRIPE_WIDTH)), lit(2)), lit(0))
  return pure(if$(cond, c1, c2))
}

export const stripeRamp: ColorRamp = (d) =>
  Do(function* () {
    const condPos = gteq(d, EPSILON)
    const condNeg = lteq(d, negate(EPSILON))
    const valPos = yield stripes(white, lightGray)(d)
    const valNeg = yield stripes(darkGray, midGray)(d)
    const valZero = black
    return pure(if$(condPos, valPos, if$(condNeg, valNeg, valZero)))
  })

// // Stripey color ramp function

//
// const float eps = 2.;
// const float stripeWidth = 10.;
// vec3 colorRamp(float dist) {
//   if (abs(dist) < eps) {
//     bool blend = abs(dist - eps) < 1.;
//     float fac = fract(dist);
//     vec3 target = dist > 0. ? white : darkGray;
//     return blend ? mix(black, target, fac) : black;
//   }
//   if (dist <= -eps) {
//     return mod(floor(dist / stripeWidth), 2.) == 0. ? midGray : darkGray;
//   }
//   if (dist >= eps) {
//     return mod(floor(dist / stripeWidth), 2.) == 0. ? white : lightGray;
//   }
// }
