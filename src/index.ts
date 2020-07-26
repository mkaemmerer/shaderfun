import {
  SDF,
  circle,
  box,
  dilate,
  outline,
  translate,
  rotate,
  scale,
  invert,
} from './shader/sdf'
import { drawShader } from './shader/draw'
import { compileSDF } from './shader/compile'

const sdf: SDF = scale(2)(
  rotate(Math.PI / 4)(
    invert(
      translate({ x: 400, y: 0 })(
        outline(10)(dilate(20)(box({ x: 100, y: 100 })))
      )
    )
  )
)

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
