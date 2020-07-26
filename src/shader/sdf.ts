import { V2, S } from '../util/vector'
import { Expr } from './ast'
import { ShaderContext, pure, decl, sequenceM } from './shader-context'
import { Type } from './ast/types'
import {
  lit,
  vec,
  length,
  abs,
  plus,
  minus,
  times,
  mod,
  plusV,
  minusV,
  timesV,
  max,
  min,
  negate,
  projX,
  projY,
  sin,
  cos,
} from './lang'

const cast = (v: V2): Expr => vec({ x: lit(v.x), y: lit(v.y) })

export type SDF = (e: Expr) => ShaderContext<Expr>

export type SDFTransform = (sdf: SDF) => SDF

const overDomain = (f: (p: Expr) => ShaderContext<Expr>): SDFTransform => (
  sdf: SDF
) => (p) => f(p).flatMap(decl(Type.Vec)).flatMap(sdf)
const overRange = (f: (s: Expr) => ShaderContext<Expr>): SDFTransform => (
  sdf
) => (p) => sdf(p).flatMap(f)

// Geometry
export const point: SDF = (p) => pure(length(p))

export const circle = (r: S): SDF => (p) => pure(minus(length(p), lit(r)))

export const box = (corner: V2): SDF => (p) => {
  const exprD = minus(abs(p), cast(corner))
  return decl(Type.Vec)(exprD).flatMap((d) => {
    const exprC = vec({
      x: max(projX(d), lit(0)),
      y: max(projY(d), lit(0)),
    })
    return decl(Type.Vec)(exprC).flatMap((c) =>
      pure(plus(length(c), min(max(projX(d), projY(d)), lit(0))))
    )
  })
}

// Operators
// NB: these break the distance field
export const union = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Number)),
    s2(p).flatMap(decl(Type.Number)),
  ]).map(([d1, d2]) => min(d1, d2))

export const intersection = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Number)),
    s2(p).flatMap(decl(Type.Number)),
  ]).map(([d1, d2]) => max(d1, d2))

export const difference = (s1: SDF, s2: SDF): SDF => (p) =>
  sequenceM([
    s1(p).flatMap(decl(Type.Number)),
    s2(p).flatMap(decl(Type.Number)),
  ]).map(([d1, d2]) => max(d1, negate(d2)))

// Rigidbody
export const translate = (v: V2): SDFTransform =>
  overDomain((p) => pure(minusV(p, cast(v))))

export const rotate = (angle: S): SDFTransform =>
  overDomain((p) =>
    sequenceM([
      decl(Type.Number)(cos(lit(angle))),
      decl(Type.Number)(sin(lit(angle))),
    ]).flatMap(([cosa, sina]) => {
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
export const mirrorX = overDomain((p) =>
  pure(vec({ x: abs(projX(p)), y: projY(p) }))
)

export const mirrorY = overDomain((p) =>
  pure(vec({ x: projX(p), y: abs(projY(p)) }))
)

export const repeatX = (cellSize: S) =>
  overDomain((p) =>
    decl(Type.Number)(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: minus(mod(plus(projX(p), halfCell), lit(cellSize)), halfCell),
        y: projY(p),
      })
    )
  )

export const repeatY = (cellSize: S) =>
  overDomain((p) =>
    decl(Type.Number)(times(lit(cellSize), lit(0.5))).map((halfCell) =>
      vec({
        x: projX(p),
        y: minus(mod(plus(projY(p), halfCell), lit(cellSize)), halfCell),
      })
    )
  )

// Morphology
export const dilate = (fac: S) => (sdf: SDF): SDF => (p: Expr) =>
  sdf(p).map((p) => minus(p, lit(fac)))

export const outline = (fac: S) =>
  overRange((r) => pure(minus(abs(r), lit(fac))))

export const invert = overRange((r) => pure(negate(r)))
