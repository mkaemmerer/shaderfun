import { V2, S } from '../util/vector'
import { Expr } from './lang'
import { Shader, pure, decl, sequenceM, Do } from './shader'
import { Type } from './lang/types'
import {
  abs,
  absV,
  atan,
  cos,
  div,
  dot,
  length,
  lit,
  log,
  max,
  min,
  minus,
  minusV,
  mod,
  negate,
  plus,
  plusV,
  projX,
  projY,
  saturate,
  sqrt,
  sin,
  times,
  timesV,
  vec,
  gteq,
  lt,
  gt,
  and,
  or,
  not,
} from './built-ins'

const TAU = Math.PI * 2

export type SDF = (e: Expr) => Shader<Expr>
export type SDFTransform = (sdf: SDF) => SDF

// Utils
const cast = (v: V2): Expr => vec({ x: lit(v.x), y: lit(v.y) })
const id = <T>(x: T): T => x
const compose2 = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (x: A) => f(g(x))

const clamp = (expr: Expr, lo: Expr, hi: Expr): Expr => max(min(expr, hi), lo)
const conj = (...conds: Expr[]) => conds.reduce(and)
const disj = (...conds: Expr[]) => conds.reduce(or)

const segments = <T>(arr: T[]): [T, T][] =>
  arr.map((x, i) => [i == 0 ? arr[arr.length - 1] : arr[i - 1], x])

const projectSegment = (a: Expr, b: Expr) => (p: Expr) =>
  Do(function* () {
    const pa = yield decl(Type.Vec)(minus(p, a))
    const ba = yield decl(Type.Vec)(minus(b, a))
    const fac = yield decl(Type.Scalar)(saturate(div(dot(pa, ba), dot(ba, ba))))
    return pure(plus(a, times(fac, ba)))
  })

const overDomain = (f: (p: Expr) => Shader<Expr>): SDFTransform => (
  sdf: SDF
) => (p) => f(p).flatMap(decl(Type.Vec)).flatMap(sdf)

const overRange = (f: (s: Expr) => Shader<Expr>): SDFTransform => (
  sdf: SDF
) => (p) => sdf(p).flatMap(decl(Type.Scalar)).flatMap(f)

// Geometry
export const point: SDF = (p) => pure(length(p))

export const circle = (r: S): SDF => (p) => pure(minus(length(p), lit(r)))

export const box = (corner: V2): SDF => (p) =>
  Do(function* () {
    const d = yield decl(Type.Vec)(minus(absV(p), cast(corner)))
    const c = yield decl(Type.Vec)(
      vec({
        x: max(projX(d), lit(0)),
        y: max(projY(d), lit(0)),
      })
    )
    return pure(plus(length(c), min(max(projX(d), projY(d)), lit(0))))
  })

export const segment = (a: V2, b: V2): SDF => (p) =>
  Do(function* () {
    const c = yield projectSegment(cast(a), cast(b))(p)
    return length(minus(p, c))
  })

export const polygon = (v: V2[]): SDF => (p) =>
  Do(function* () {
    const pv = yield decl(Type.Vec)(minus(p, cast(v[0])))

    let d = yield decl(Type.Scalar)(dot(pv, pv))
    let sign = lit(1)
    for (const [a, b] of segments(v)) {
      const e = yield decl(Type.Vec)(minus(cast(a), cast(b)))
      const w = yield decl(Type.Vec)(minus(p, cast(b)))
      const projected = yield projectSegment(cast(a), cast(b))(p)
      const c = yield decl(Type.Vec)(minus(p, projected))
      d = yield decl(Type.Scalar)(min(d, dot(c, c)))

      // Flip sign if we crossed an edge
      const cond1 = yield decl(Type.Bool)(gteq(projY(p), lit(b.y)))
      const cond2 = yield decl(Type.Bool)(lt(projY(p), lit(a.y)))
      const cond3 = yield decl(Type.Bool)(
        gt(times(projX(e), projY(w)), times(projY(e), projX(w)))
      )
      const condition = yield decl(Type.Bool)(
        disj(
          conj(cond1, cond2, cond3),
          conj(not(cond1), not(cond2), not(cond3))
        )
      )
      const newSign = Expr.If({
        condition,
        thenBranch: lit(1),
        elseBranch: lit(-1),
      })
      sign = yield decl(Type.Scalar)(times(sign, newSign))
    }
    return pure(times(sign, sqrt(d)))
  })

// Operators
// NB: these break the distance field
export const union = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Scalar)),
    s2(p).flatMap(decl(Type.Scalar)),
  ]).map(([d1, d2]) => min(d1, d2))

export const intersection = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Scalar)),
    s2(p).flatMap(decl(Type.Scalar)),
  ]).map(([d1, d2]) => max(d1, d2))

export const difference = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Scalar)),
    s2(p).flatMap(decl(Type.Scalar)),
  ]).map(([d1, d2]) => max(d1, negate(d2)))

// Rigidbody
export const translate = (v: V2): SDFTransform =>
  overDomain((p) => pure(minusV(p, cast(v))))

export const rotate = (angle: S): SDFTransform =>
  overDomain((p) =>
    Do(function* () {
      const cosa = yield decl(Type.Scalar)(cos(lit(angle)))
      const sina = yield decl(Type.Scalar)(sin(lit(angle)))
      const px = projX(p)
      const py = projY(p)
      return pure(
        vec({
          x: minus(times(px, cosa), times(py, sina)),
          y: plus(times(px, sina), times(py, cosa)),
        })
      )
    })
  )

export const scale = (s: S): SDFTransform => (sdf) => (p) =>
  sdf(timesV(lit(1 / s), p)).map((p) => times(p, lit(s)))

// Domain repetition
export const compose = (...fs) => fs.reduce(compose2, id)

export const mirrorX = overDomain((p) =>
  pure(vec({ x: abs(projX(p)), y: projY(p) }))
)

export const mirrorY = overDomain((p) =>
  pure(vec({ x: projX(p), y: abs(projY(p)) }))
)

export const repeatX = (cellSize: S) =>
  overDomain((p) =>
    decl(Type.Scalar)(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: minus(mod(plus(projX(p), halfCell), lit(cellSize)), halfCell),
        y: projY(p),
      })
    )
  )

export const repeatY = (cellSize: S) =>
  overDomain((p) =>
    decl(Type.Scalar)(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: projX(p),
        y: minus(mod(plus(projY(p), halfCell), lit(cellSize)), halfCell),
      })
    )
  )

export const repeatGrid = (sizeX: S, sizeY: S = sizeX) =>
  compose(repeatX(sizeX), repeatY(sizeY))

export const repeatPolar = (count: S): SDFTransform =>
  overDomain((p) =>
    Do(function* () {
      const angle = TAU / count
      const halfAngle = angle * 0.5
      const a = yield decl(Type.Scalar)(
        plus(atan(projY(p), projX(p)), lit(halfAngle))
      )
      const r = yield decl(Type.Scalar)(length(p))
      const theta = yield decl(Type.Scalar)(
        minus(mod(a, lit(angle)), lit(halfAngle))
      )
      return pure(timesV(r, vec({ x: cos(theta), y: sin(theta) })))
    })
  )

// Domain repetition extras
export const repeatLogPolar = (count: S): SDFTransform => (sdf) => (p) =>
  Do(function* () {
    const r = yield decl(Type.Scalar)(length(p))
    // Apply the forward log-polar map
    const pos = yield decl(Type.Vec)(
      vec({
        x: log(max(lit(0.00001), r)),
        y: atan(projY(p), projX(p)),
      })
    )
    // Scale everything so tiles will fit nicely in the [-pi,pi] interval
    const scale = lit(count / TAU)
    const scaled = yield decl(Type.Vec)(timesV(scale, pos))
    const repeated = vec({
      x: minus(mod(plus(projX(scaled), lit(0.5)), lit(1)), lit(0.5)),
      y: minus(mod(plus(projY(scaled), lit(0.5)), lit(1)), lit(0.5)),
    })
    const d = yield sdf(repeated)
    return pure(div(times(d, r), scale))
  })

// Morphology
export const dilate = (fac: S) => (sdf: SDF): SDF => (p: Expr) =>
  sdf(p).map((p) => minus(p, lit(fac)))

export const outline = (fac: S) =>
  overRange((r) => pure(minus(abs(r), lit(fac))))

export const invert = overRange((r) => pure(negate(r)))

export const extrudeX = (fac: S) =>
  overDomain((p) =>
    pure(minus(p, vec({ x: clamp(projX(p), lit(-fac), lit(fac)), y: lit(0) })))
  )

export const extrudeY = (fac: S) =>
  overDomain((p) =>
    pure(minus(p, vec({ x: lit(0), y: clamp(projY(p), lit(-fac), lit(fac)) })))
  )
