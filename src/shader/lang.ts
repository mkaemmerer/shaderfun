import { V2, S } from '../util/vector'
import { Expr } from './ast'
import { ShaderContext, pure, newVar, sequenceM } from './shader-context'
import { Type } from './ast/types'

export type SDF = ShaderContext<(point: Expr) => Expr>

// Language Primitives
const var$ = (name: string) => Expr.Var(name)

const lit = (val: any): Expr => Expr.Lit(val)

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

const projX = (expr: Expr): Expr => Expr.Unary({ op: 'projX', expr })

const projY = (expr: Expr): Expr => Expr.Unary({ op: 'projY', expr })

// Geometry
export const point: SDF = pure((p: Expr) => length(p))

export const circle = (r: S): SDF => pure((p) => minus(length(p), lit(r)))

export const box = (corner: V2): SDF =>
  sequenceM([newVar(), newVar()]).flatMap(([d, c]) =>
    pure((p) =>
      Expr.Bind({
        variable: d,
        type: Type.Vec,
        value: minus(abs(p), vec({ x: lit(corner.x), y: lit(corner.y) })),
        body: Expr.Bind({
          variable: c,
          type: Type.Vec,
          value: vec({
            x: max(projX(var$(d)), lit(0)),
            y: max(projY(var$(d)), lit(0)),
          }),
          body: plus(
            length(var$(c)),
            min(max(projX(var$(d)), projY(var$(d))), lit(0))
          ),
        }),
      })
    )
  )

// Morphology
export const dilate = (fac: S) => (sdf: SDF) =>
  sdf.map((f) => (p: Expr) => minus(f(p), lit(fac)))
