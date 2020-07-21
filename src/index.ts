import { drawSDF } from './draw'
import {
  box,
  circle,
  polygon,
  union,
  translate,
  rotate,
  scale,
  mirrorX,
  mirrorY,
  repeatGrid,
  repeatPolar,
  dilate,
  outline,
  invert,
} from './sdf'

const TAU = Math.PI * 2

const cross = outline(15)(
  rotate(TAU / 8)(
    mirrorY(mirrorX(scale(2)(translate({ x: 100, y: 100 })(circle(50)))))
  )
)
const circles = rotate(TAU / 8)(
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

const sdf = repeatGrid(1000)(
  scale(0.3)(
    repeatPolar(5)(
      translate({ x: 800, y: 0 })(union(poly, union(cross, circles)))
    )
  )
)

const canvas = document.querySelector('canvas') as HTMLCanvasElement

const draw = () => {
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  drawSDF(sdf)(canvas)
}

window.addEventListener('resize', draw)
draw()
