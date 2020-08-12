import { Program, composeM, gradientRamp, Do, pure, decl } from '../src'
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
  if$,
  length,
  gt,
} from '../src/lang/built-ins'

const iterate = (count: number) => (actionM) => {
  let f = (x) => pure(x)
  for (let i = 0; i < count; i++) {
    const prev = f
    f = (p) => actionM(p).flatMap(prev)
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

const fold = (c: Expr) => ([p, i]: [Expr, Expr]) =>
  Do(function* () {
    const q = yield decl(plusV(timesC(p, p), c))
    const p2 = yield decl(if$(gt(length(q), lit(2)), p, q))
    const i2 = yield decl(if$(gt(length(q), lit(2)), i, plus(lit(1), i)))
    return pure([p2, i2])
  })

const ITERS = 200
const c = vec({ x: lit(-0.4), y: lit(0.6) })
const juliaFold = iterate(ITERS)(fold(c))

const juliaSet: Program = (p) =>
  pure(timesV(lit(1 / 700), p))
    .flatMap((p) => pure([p, lit(0)]))
    .flatMap(juliaFold)
    .flatMap(([x, y]) => pure(y))
    .flatMap((d) => pure(times(d, lit(1 / ITERS))))

export const program: Program = composeM(juliaSet, gradientRamp)
