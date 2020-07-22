import { V2, S } from '../util/vector'
import { Expr } from './ast'
import { ShaderContext, pure, decl } from './shader-context'
import { Type } from './ast/types'
import {
  lit,
  vec,
  length,
  abs,
  plus,
  minus,
  max,
  min,
  projX,
  projY,
} from './lang'

const cast = (v: V2): Expr => vec({ x: lit(v.x), y: lit(v.y) })

// Geometry
export type SDF = (e: Expr) => ShaderContext<Expr>

export const point: SDF = (p) => pure(length(p))

export const circle = (r: S): SDF => (p) => pure(minus(length(p), lit(r)))

export const box = (corner: V2): SDF => (p) => {
  const exprD = minus(abs(p), cast(corner))
  return decl(Type.Vec, exprD).flatMap((d) => {
    const exprC = vec({
      x: max(projX(d), lit(0)),
      y: max(projY(d), lit(0)),
    })
    return decl(Type.Vec, exprC).flatMap((c) =>
      pure(plus(length(c), min(max(projX(d), projY(d)), lit(0))))
    )
  })
}

// Morphology
export const dilate = (fac: S) => (sdf: SDF): SDF => (p: Expr) =>
  sdf(p).map((p) => minus(p, lit(fac)))
