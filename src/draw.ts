import { SDF } from './sdf'
import { ColorRGB, black, white, grayscale, mix } from './util/color'

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
const drawImage = (ctx, image) => {
  bufferCtx.putImageData(image, 0, 0)
  ctx.drawImage(bufferCanvas, 0, 0)
}

const darkGray = grayscale(40)
const midGray = grayscale(60)
const lightGray = grayscale(240)

const eps = 5
const stripeWidth = 10
const colorRamp = (dist: number): ColorRGB => {
  if (Math.abs(dist) < eps) {
    const blend = Math.abs(dist - eps) < 1
    const fac = Math.abs(dist - Math.trunc(dist))
    const target = dist > 0 ? white : darkGray
    return blend ? mix(black, target)(fac) : black
  }
  if (dist <= -eps) {
    return Math.floor(dist / stripeWidth) % 2 == 0 ? midGray : darkGray
  }
  if (dist >= eps) {
    return Math.floor(dist / stripeWidth) % 2 == 0 ? white : lightGray
  }
}

export const drawSDF = (sdf: SDF) => (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas
  const ctx = canvas.getContext('2d')

  const image = makeImage(width, height, ({ x, y }) => {
    const dist = sdf({ x: x - width / 2, y: y - height / 2 })
    return colorRamp(dist)
  })

  drawImage(ctx, image)
}
