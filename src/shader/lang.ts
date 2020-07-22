import { V2, S } from '../util/vector'
import { Expr } from './ast'
import { ShaderContext, pure } from './shader-context'

export type SDF = ShaderContext<(point: Expr) => Expr>

// Language Primitives
const lit = (val: any): Expr => Expr.Lit(val)

// TODO
const vec = ({ x, y }): Expr => Expr.Vec({ x, y })

const length = (expr: Expr): Expr => Expr.Unary({ op: 'length', expr })

const abs = (expr: Expr): Expr => Expr.Unary({ op: 'abs', expr })

const plus = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: '+', exprRight })

const minus = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: '-', exprRight })

const max = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: 'max', exprRight })

const min = (exprLeft: Expr, exprRight: Expr): Expr =>
  Expr.Binary({ exprLeft, op: 'min', exprRight })

// TODO
const projX = (expr: Expr): Expr => Expr.Unary({ op: 'projX', expr })

const projY = (expr: Expr): Expr => Expr.Unary({ op: 'projY', expr })

// Geometry
export const point: SDF = pure((p: Expr) => length(p))

export const circle = (r: S): SDF => pure((p) => minus(length(p), lit(r)))

export const box = (corner: V2): SDF =>
  pure((p) => {
    const d = minus(abs(p), vec({ x: lit(corner.x), y: lit(corner.y) }))
    const c = vec({
      x: max(projX(d), lit(0)),
      y: max(projY(d), lit(0)),
    })
    return plus(length(c), min(max(projX(d), projY(d)), lit(0)))
  })
