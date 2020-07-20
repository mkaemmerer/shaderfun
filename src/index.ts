import { drawSDF } from './canvas'

const length = ({ x, y }) => Math.sqrt(x * x + y * y)
const translate = ({ dx, dy }) => (sdf) => ({ x, y }) =>
  sdf({ x: x - dx, y: y - dy })

const circ = (v) => length(v) - 50
const sdf = translate({ dx: 500, dy: 500 })(circ)

const canvas = document.querySelector('canvas') as HTMLCanvasElement

const draw = () => {
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  drawSDF(sdf)(canvas)
}

window.addEventListener('resize', draw)
draw()
