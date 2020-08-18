import {
  SDF,
  ShaderProgram,
  compose,
  composeM,
  segment,
  stripeRamp,
  scale,
  mirror,
  mirrorX,
  translate,
} from '../src'

const TAU = Math.PI * 2

const id = (x) => x

const iterate = (count) => (f) =>
  count === 0 ? id : compose(f, iterate(count - 1)(f))

const fold = compose(
  mirrorX,
  translate({ x: 0.5, y: 0 }),
  mirror(TAU / 6),
  // Setup for the next iteration
  scale(1 / 3),
  translate({ x: 1.5, y: 0 })
)

const kochFold = compose(
  iterate(4)(fold),
  // Undo the last half-transform
  translate({ x: -1.5, y: 0 }),
  scale(3)
)

const line = segment({ x: 0, y: 0 }, { x: 1, y: 0 })

const sdf: SDF = scale(600)(kochFold(line))

export const program: ShaderProgram = composeM(sdf, stripeRamp)
