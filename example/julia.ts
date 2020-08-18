import { ShaderProgram, composeM, flameRamp, Do, pure, decl } from '../src'
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
  dot,
  log2,
  gt,
} from '../src/lang/built-ins'
import { TypeV2, TypeS } from '../src/lang/types'

const iterate = (count: number) => (actionM) => {
  let f = (x) => pure(x)
  for (let i = 0; i < count; i++) {
    const prev = f
    f = (p) => actionM(p).flatMap(prev)
  }
  return f
}

const timesC = (c1: Expr<TypeV2>, c2: Expr<TypeV2>) => {
  const r1 = projX(c1)
  const i1 = projY(c1)
  const r2 = projX(c2)
  const i2 = projY(c2)

  return vec({
    x: minus(times(r1, r2), times(i1, i2)),
    y: plus(times(r1, i2), times(r2, i1)),
  })
}

const fold = (c: Expr<TypeV2>) => ([p, i]: [Expr<TypeV2>, Expr<TypeS>]) =>
  Do(function* () {
    const q = yield decl(plusV(timesC(p, p), c))
    const cond = yield decl(gt(dot(q, q), lit(4)))
    const p2 = yield decl(if$(cond, p, q))
    const i2 = yield decl(if$(cond, i, plus(lit(1), i)))
    return pure([p2, i2])
  })

const ITERS = 200
const c = vec({ x: lit(-0.4), y: lit(0.6) })
const juliaFold = iterate(ITERS)(fold(c))

const juliaSet = (p) =>
  pure(timesV(lit(1 / 700), p))
    .flatMap((p) => pure([p, lit(0)]))
    .flatMap(juliaFold)
    // Smooth iteration count
    .flatMap(([x, y]) => pure(plus(minus(y, log2(log2(dot(x, x)))), lit(4))))
    // Map to 0 -> 1 range
    .flatMap((d) => pure(times(d, lit(1 / ITERS))))

export const program: ShaderProgram = composeM(juliaSet, flameRamp)
