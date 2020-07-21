import { SDF } from './sdf'

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

type ColorRGB = { r: number; g: number; b: number }
const black: ColorRGB = { r: 0, g: 0, b: 0 }
const white: ColorRGB = { r: 255, g: 255, b: 255 }
const grayscale = (brightness: number): ColorRGB => ({
  r: brightness,
  g: brightness,
  b: brightness,
})

const colorRamp = (dist: number): ColorRGB => {
  if (Math.abs(dist) <= 2) return black
  if (dist < 0)
    return Math.floor(dist / 10) % 2 == 0 ? grayscale(60) : grayscale(40)
  if (dist > 0) return Math.floor(dist / 10) % 2 == 0 ? white : grayscale(240)
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
