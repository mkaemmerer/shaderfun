import {
  SDF,
  ShaderProgram,
  composeM,
  tPolygon,
  stripeRamp,
  scale,
  dilate,
  translate,
} from '../src'

const sdf: SDF = dilate(50)(
  scale(3)(
    translate({ x: -50, y: -50 })(
      tPolygon([
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 10, y: 100 },
        { x: 10, y: 10 },
        { x: 90, y: 10 },
        { x: 90, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
      ])
    )
  )
)

export const program: ShaderProgram = composeM(sdf, stripeRamp)
