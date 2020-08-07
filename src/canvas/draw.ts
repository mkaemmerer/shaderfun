import { SDF } from './sdf'
import { colorRamp } from './color'

const bufferCanvas = document.createElement('canvas')
const bufferCtx = bufferCanvas.getContext('2d')

const makeImage = (width: number, height: number, f) => {
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

export const drawSDF = (sdf: SDF) => (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas

  const image = makeImage(width, height, ({ x, y }) => {
    const dist = sdf({ x: x - width / 2, y: y - height / 2 })
    return colorRamp(dist)
  })

  drawImage(ctx, image)
}
