import { drawSDF } from './draw'
import {
  box,
  circle,
  union,
  dilate,
  outline,
  translate,
  rotate,
  scale,
  mirrorX,
  mirrorY,
} from './sdf'

const TAU = Math.PI * 2

const sdf1 = outline(15)(
  rotate(TAU / 8)(
    mirrorY(mirrorX(scale(2)(translate({ x: 100, y: 100 })(circle(50)))))
  )
)
const sdf2 = rotate(TAU / 8)(
  dilate(5)(union(box({ x: 300, y: 20 }), box({ x: 20, y: 300 })))
)
const sdf = union(sdf1, sdf2)

const canvas = document.querySelector('canvas') as HTMLCanvasElement

const draw = () => {
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  drawSDF(sdf)(canvas)
}

window.addEventListener('resize', draw)
draw()
