import {
  Do,
  pure,
  SDF,
  Program,
  composeM,
  tCircle,
  repeatGrid,
  stripeRamp,
} from '../src'
import {
  lit,
  floor,
  div,
  plus,
  times,
  minus,
  projX,
} from '../src/lang/built-ins'

const tiles: SDF = repeatGrid(200, 200)(tCircle(0))

const steps: SDF = (p) =>
  Do(function* () {
    const x = projX(p)
    const c = div(plus(x, lit(100)), lit(200))
    const fac = plus(lit(12), floor(c))
    return pure(fac)
  })

const sdf: SDF = (p) =>
  Do(function* () {
    const d = yield tiles(p)
    const fac = yield steps(p)
    return pure(minus(d, times(lit(10), fac)))
  })

export const program: Program = composeM(sdf, stripeRamp)
