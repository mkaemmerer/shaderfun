import { V2, S } from '../util/vector'
import {
  Expr,
  overDomain,
  overRange,
  pure,
  decl,
  Do,
  ShaderFunc,
} from '../lang'
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
  if$,
  lt,
  gt,
  and,
  or,
  not,
} from '../lang/built-ins'
import { TypeV2, TypeS, TypeBool } from '../lang/types'

const TAU = Math.PI * 2

export type SDF = ShaderFunc<TypeV2, TypeS>

// Utils
const cast = (v: V2): Expr<TypeV2> => vec({ x: lit(v.x), y: lit(v.y) })
const id = <T>(x: T): T => x
const compose2 = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (x: A) => f(g(x))

const clamp = (
  expr: Expr<TypeS>,
  lo: Expr<TypeS>,
  hi: Expr<TypeS>
): Expr<TypeS> => max(min(expr, hi), lo)
const conj = (...conds: Expr<TypeBool>[]): Expr<TypeBool> => conds.reduce(and)
const disj = (...conds: Expr<TypeBool>[]): Expr<TypeBool> => conds.reduce(or)

const segments = <T>(arr: T[]): [T, T][] =>
  arr.map((x, i) => [i == 0 ? arr[arr.length - 1] : arr[i - 1], x])

const projectSegment = (a: Expr<TypeV2>, b: Expr<TypeV2>) => (
  p: Expr<TypeV2>
) =>
  Do(function* () {
    const pa = yield decl(minusV(p, a))
    const ba = yield decl(minusV(b, a))
    const fac = yield decl(saturate(div(dot(pa, ba), dot(ba, ba))))
    const closest = yield decl(plusV(a, timesV(fac, ba)))
    return pure(closest)
  })

// Euclidean Geometry
export const point: SDF = (p) => pure(length(p))

export const circle = (r: S): SDF => (p) => pure(minus(length(p), lit(r)))

export const box = (corner: V2): SDF => (p) =>
  Do(function* () {
    const d = yield decl(minusV(absV(p), cast(corner)))
    const c = yield decl(
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
    return pure(length(minusV(p, c)))
  })

export const polygon = (v: V2[]): SDF => (p) =>
  Do(function* () {
    const pv = yield decl(minusV(p, cast(v[0])))

    let sign = lit(v.length % 2 == 0 ? 1 : -1)
    let d = yield decl(dot(pv, pv))
    for (const [a, b] of segments(v)) {
      const e = yield decl(minusV(cast(a), cast(b)))
      const w = yield decl(minusV(p, cast(b)))
      const projected = yield projectSegment(cast(a), cast(b))(p)
      const c = yield decl(minusV(p, projected))
      d = yield decl(min(d, dot(c, c)))

      // Flip sign if we crossed an edge
      const cond1 = yield decl(gteq(projY(p), lit(b.y)))
      const cond2 = yield decl(lt(projY(p), lit(a.y)))
      const cond3 = yield decl(
        gt(times(projX(e), projY(w)), times(projY(e), projX(w)))
      )
      const condition = yield decl(
        disj(
          conj(cond1, cond2, cond3),
          conj(not(cond1), not(cond2), not(cond3))
        )
      )
      const newSign = if$(condition, lit(1), lit(-1))
      sign = yield decl(times(sign, newSign))
    }
    return pure(times(sign, sqrt(d)))
  })

// Taxicab Geometry
const length_l1 = (p: Expr<TypeV2>): Expr<TypeS> =>
  plus(abs(projX(p)), abs(projY(p)))

const tSegmentDist = (a: Expr<TypeV2>, b: Expr<TypeV2>) => (p: Expr<TypeV2>) =>
  // Can't simply project to nearest point in L1 norm. "Closest" point not be unique.
  Do(function* () {
    const pa = yield decl(minusV(p, a))
    const ba = yield decl(minusV(b, a))
    const facX = yield decl(saturate(div(projX(pa), projX(ba))))
    const facY = yield decl(saturate(div(projY(pa), projY(ba))))
    const p1 = yield decl(minusV(pa, timesV(facX, ba)))
    const p2 = yield decl(minusV(pa, timesV(facY, ba)))
    return pure(min(length_l1(p1), length_l1(p2)))
  })

export const tCircle = (r: S): SDF => (p) => pure(minus(length_l1(p), lit(r)))

export const tBox = (corner: V2): SDF => (p) =>
  Do(function* () {
    const d = yield decl(minusV(absV(p), cast(corner)))
    const c = yield decl(
      vec({
        x: max(projX(d), lit(0)),
        y: max(projY(d), lit(0)),
      })
    )
    return pure(plus(length_l1(c), min(max(projX(d), projY(d)), lit(0))))
  })

export const tSegment = (a: V2, b: V2): SDF => tSegmentDist(cast(a), cast(b))

export const tPolygon = (v: V2[]): SDF => (p) =>
  Do(function* () {
    const pv = yield decl(minusV(p, cast(v[0])))

    let sign = lit(v.length % 2 == 0 ? 1 : -1)
    let d = yield decl(abs(length_l1(pv)))
    for (const [a, b] of segments(v)) {
      const e = yield decl(minusV(cast(a), cast(b)))
      const w = yield decl(minusV(p, cast(b)))
      const c = yield decl(yield tSegmentDist(cast(a), cast(b))(p))
      d = yield decl(min(d, c))

      // Flip sign if we crossed an edge
      const cond1 = yield decl(gteq(projY(p), lit(b.y)))
      const cond2 = yield decl(lt(projY(p), lit(a.y)))
      const cond3 = yield decl(
        gt(times(projX(e), projY(w)), times(projY(e), projX(w)))
      )
      const condition = yield decl(
        disj(
          conj(cond1, cond2, cond3),
          conj(not(cond1), not(cond2), not(cond3))
        )
      )
      const newSign = if$(condition, lit(1), lit(-1))
      sign = yield decl(times(sign, newSign))
    }
    return pure(times(sign, d))
  })

// Chebyshev Geometry
const length_lInf = (p: Expr<TypeV2>): Expr<TypeS> =>
  max(abs(projX(p)), abs(projY(p)))

const cSegmentDist = (a: Expr<TypeV2>, b: Expr<TypeV2>) => (p: Expr<TypeV2>) =>
  // Can't simply project to nearest point in L inf norm. "Closest" point not be unique.
  Do(function* () {
    const pa = yield decl(minusV(p, a))
    const ba = yield decl(minusV(b, a))
    const fac1 = yield decl(
      saturate(div(minus(projY(pa), projX(pa)), minus(projY(ba), projX(ba))))
    )
    const fac2 = yield decl(
      saturate(div(plus(projY(pa), projX(pa)), plus(projY(ba), projX(ba))))
    )
    const p1 = yield decl(minusV(pa, timesV(fac1, ba)))
    const p2 = yield decl(minusV(pa, timesV(fac2, ba)))
    return pure(min(length_lInf(p1), length_lInf(p2)))
  })

export const cCircle = (r: S): SDF => (p) => pure(minus(length_lInf(p), lit(r)))

export const cBox = (corner: V2): SDF => (p) =>
  Do(function* () {
    const d = yield decl(minusV(absV(p), cast(corner)))
    const c = yield decl(
      vec({
        x: max(projX(d), lit(0)),
        y: max(projY(d), lit(0)),
      })
    )
    return pure(plus(length_lInf(c), min(max(projX(d), projY(d)), lit(0))))
  })

export const cSegment = (a: V2, b: V2): SDF => cSegmentDist(cast(a), cast(b))

export const cPolygon = (v: V2[]): SDF => (p) =>
  Do(function* () {
    const pv = yield decl(minusV(p, cast(v[0])))

    let sign = lit(v.length % 2 == 0 ? 1 : -1)
    let d = yield decl(abs(length_l1(pv)))
    for (const [a, b] of segments(v)) {
      const e = yield decl(minusV(cast(a), cast(b)))
      const w = yield decl(minusV(p, cast(b)))
      const c = yield decl(yield cSegmentDist(cast(a), cast(b))(p))
      d = yield decl(min(d, c))

      // Flip sign if we crossed an edge
      const cond1 = yield decl(gteq(projY(p), lit(b.y)))
      const cond2 = yield decl(lt(projY(p), lit(a.y)))
      const cond3 = yield decl(
        gt(times(projX(e), projY(w)), times(projY(e), projX(w)))
      )
      const condition = yield decl(
        disj(
          conj(cond1, cond2, cond3),
          conj(not(cond1), not(cond2), not(cond3))
        )
      )
      const newSign = if$(condition, lit(1), lit(-1))
      sign = yield decl(times(sign, newSign))
    }
    return pure(times(sign, d))
  })

// Operators
// NB: these break the distance field
const combineSDF = (f: (d1: Expr<TypeS>, d2: Expr<TypeS>) => Expr<TypeS>) => (
  s1: SDF,
  s2: SDF
): SDF => (p) =>
  Do(function* () {
    const d1 = yield decl(yield s1(p))
    const d2 = yield decl(yield s2(p))
    return pure(f(d1, d2))
  })

export const union = combineSDF((d1, d2) => min(d1, d2))

export const intersection = combineSDF((d1, d2) => max(d1, d2))

export const difference = combineSDF((d1, d2) => max(d1, negate(d2)))

export const blend = (fac: S) =>
  combineSDF((d1, d2) => plus(times(d2, lit(fac)), times(d1, lit(1 - fac))))

// Rigidbody
export const translate = (v: V2) =>
  overDomain<TypeV2, TypeV2>((p) => pure(minusV(p, cast(v))))

export const rotate = (angle: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    Do(function* () {
      const cosa = yield decl(cos(lit(angle)))
      const sina = yield decl(sin(lit(angle)))
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

export const scale = (s: S) => (sdf: SDF): SDF => (p) =>
  sdf(timesV(lit(1 / s), p)).map((p) => times(p, lit(s)))

// Domain repetition
export const compose = (...fs) => fs.reduce(compose2, id)

export const mirrorX = overDomain<TypeV2, TypeV2>((p) =>
  pure(vec({ x: abs(projX(p)), y: projY(p) }))
)

export const mirrorY = overDomain<TypeV2, TypeV2>((p) =>
  pure(vec({ x: projX(p), y: abs(projY(p)) }))
)

export const mirror = (angle: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    Do(function* () {
      const normal = yield decl(
        vec({ x: sin(lit(-angle)), y: cos(lit(-angle)) })
      )
      const fac = yield decl(times(lit(2), max(lit(0), dot(normal, p))))
      const refl = yield decl(minusV(p, timesV(fac, normal)))
      return pure(refl)
    })
  )

export const repeatX = (cellSize: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    decl(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: minus(mod(plus(projX(p), halfCell), lit(cellSize)), halfCell),
        y: projY(p),
      })
    )
  )

export const repeatY = (cellSize: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    decl(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: projX(p),
        y: minus(mod(plus(projY(p), halfCell), lit(cellSize)), halfCell),
      })
    )
  )

export const repeatGrid = (sizeX: S, sizeY: S = sizeX) =>
  compose(repeatX(sizeX), repeatY(sizeY))

export const repeatPolar = (count: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    Do(function* () {
      const angle = TAU / count
      const halfAngle = angle * 0.5
      const a = yield decl(plus(atan(projY(p), projX(p)), lit(halfAngle)))
      const r = yield decl(length(p))
      const theta = yield decl(minus(mod(a, lit(angle)), lit(halfAngle)))
      const d = yield decl(timesV(r, vec({ x: cos(theta), y: sin(theta) })))
      return pure(d)
    })
  )

// Domain repetition extras
export const repeatLogPolar = (count: S) => (sdf) => (p) =>
  Do(function* () {
    const r = yield decl(length(p))
    // Apply the forward log-polar map
    const pos = yield decl(
      vec({
        x: log(max(lit(0.00001), r)),
        y: atan(projY(p), projX(p)),
      })
    )
    // Scale everything so tiles will fit nicely in the [-pi,pi] interval
    const scale = lit(count / TAU)
    const scaled = yield decl(timesV(scale, pos))
    const repeated = vec({
      x: minus(mod(plus(projX(scaled), lit(0.5)), lit(1)), lit(0.5)),
      y: minus(mod(plus(projY(scaled), lit(0.5)), lit(1)), lit(0.5)),
    })
    const d = yield sdf(repeated)
    return pure(div(times(d, r), scale))
  })

// Morphology
export const dilate = (fac: S) =>
  overRange<TypeS, TypeS>((d) => pure(minus(d, lit(fac))))

export const outline = (fac: S) =>
  overRange<TypeS, TypeS>((r) => pure(minus(abs(r), lit(fac))))

export const invert = overRange<TypeS, TypeS>((r) => pure(negate(r)))

export const extrudeX = (fac: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    pure(minusV(p, vec({ x: clamp(projX(p), lit(-fac), lit(fac)), y: lit(0) })))
  )

export const extrudeY = (fac: S) =>
  overDomain<TypeV2, TypeV2>((p) =>
    pure(minusV(p, vec({ x: lit(0), y: clamp(projY(p), lit(-fac), lit(fac)) })))
  )
