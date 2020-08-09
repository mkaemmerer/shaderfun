import { V2 } from '../util/vector'
import { ColorRGB } from '../util/color'

type Program = (p: V2) => ColorRGB

const bufferCanvas = document.createElement('canvas')
const bufferCtx = bufferCanvas.getContext('2d')

const makeImage = (width: number, height: number, f: Program) => {
  bufferCanvas.width = width
  bufferCanvas.height = height
  const image = bufferCtx.createImageData(width, height)
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      const { r, g, b } = f({ x, y })
      const coord = 4 * (x + y * image.width)
      image.data[coord + 0] = r
      image.data[coord + 1] = g
      image.data[coord + 2] = b
      image.data[coord + 3] = 255
    }
  }
  return image
}
const drawImage = (ctx: CanvasRenderingContext2D, image: ImageData) => {
  bufferCtx.putImageData(image, 0, 0)
  ctx.drawImage(bufferCanvas, 0, 0)
}

export const drawCanvas = (program: Program) => (
  ctx: CanvasRenderingContext2D
) => {
  const canvas = ctx.canvas
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio
  const { width, height } = canvas

  const image = makeImage(width, height, ({ x, y }) => {
    const color = program({ x: x - width / 2, y: y - height / 2 })
    return {
      r: color.r * 255,
      g: color.g * 255,
      b: color.b * 255,
    }
  })

  drawImage(ctx, image)
}
