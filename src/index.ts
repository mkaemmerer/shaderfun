import {
  SDF,
  circle,
  box,
  union,
  dilate,
  outline,
  translate,
  rotate,
  scale,
  mirrorX,
  mirrorY,
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

const sdf = union(circles, cross)

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
