import {
  SDF,
  Program,
  composeM,
  circle,
  gradientRamp,
  Do,
  pure,
  decl,
} from '../src'
import { Expr } from '../src/lang'
import {
  projX,
  projY,
  vec,
  times,
  timesV,
  minus,
  lit,
  plus,
  plusV,
} from '../src/lang/built-ins'

const iterate = (count: number) => (actionM: Program) => {
  let f = (x) => pure(x)
  for (let i = 0; i < count; i++) {
    f = composeM(actionM, f)
  }
  return f
}

const timesC = (c1: Expr, c2: Expr) => {
  const r1 = projX(c1)
  const i1 = projY(c1)
  const r2 = projX(c2)
  const i2 = projY(c2)

  return vec({
    x: minus(times(r1, r2), times(i1, i2)),
    y: plus(times(r1, i2), times(r2, i1)),
  })
}

const fold = (c: Expr) => (p: Expr) =>
  Do(function* () {
    const q = yield decl(timesC(p, p))
    const p1 = yield decl(plusV(q, c))
    return pure(p1)
  })

const c = vec({ x: lit(-0.4), y: lit(0.6) })
const juliaFold = iterate(100)(fold(c))

const juliaSet: SDF = composeM(
  (p) => pure(timesV(lit(1 / 700), p)),
  juliaFold,
  circle(0)
)

export const program: Program = composeM(juliaSet, gradientRamp)
