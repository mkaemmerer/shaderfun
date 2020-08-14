import {
  SDF,
  Program,
  compose,
  composeM,
  circle,
  stripeRamp,
  scale,
  mirror,
  translate,
  rotate,
} from '../src'

const TAU = Math.PI * 2

const id = (x) => x

const iterate = (count) => (f) =>
  count === 0 ? id : compose(f, iterate(count - 1)(f))

const fold = compose(
  mirror(TAU / 6),
  mirror(TAU / 2),
  translate({ x: -Math.cos(TAU / 3), y: Math.sin(TAU / 3) }),
  scale(1 / 2)
)

const sierpinskiFold = compose(iterate(8)(fold))

const ball = circle(1)

const sdf: SDF = rotate(-TAU / 12)(scale(300)(sierpinskiFold(ball)))

export const program: Program = composeM(sdf, stripeRamp)
