import {
  SDF,
  circle,
  box,
  polygon,
  union,
  dilate,
  outline,
  translate,
  rotate,
  scale,
  mirrorX,
  mirrorY,
  repeatPolar,
  repeatLogPolar,
  invert,
} from './shader/sdf'
import { drawShader } from './shader/draw'
import { compileSDF } from './shader/compile'

const TAU = Math.PI * 2

const circles = outline(15)(
  rotate(TAU / 8)(
    mirrorY(mirrorX(scale(2)(translate({ x: 100, y: 100 })(circle(50)))))
  )
)
const cross = rotate(TAU / 8)(
  dilate(5)(union(box({ x: 300, y: 20 }), box({ x: 20, y: 300 })))
)
const poly = invert(
  rotate(TAU / 8)(
    dilate(400)(
      polygon([
        { x: -100, y: -100 },
        { x: 100, y: -100 },
        { x: 100, y: 100 },
        { x: -100, y: 100 },
      ])
    )
  )
)

const pattern = rotate(TAU / 20)(
  scale(0.35)(
    repeatPolar(5)(
      translate({ x: 800, y: 0 })(union(poly, union(cross, circles)))
    )
  )
)

const sdf: SDF = repeatLogPolar(12)(scale(0.001)(pattern))

const canvas = document.querySelector('canvas') as HTMLCanvasElement
const gl = canvas.getContext('webgl')
const shader = compileSDF(sdf, gl)

const draw = () => {
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  drawShader(gl, shader)
}
window.addEventListener('resize', draw)
draw()
