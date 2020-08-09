export type ColorRGB = { r: number; g: number; b: number }

export const black: ColorRGB = { r: 0, g: 0, b: 0 }
export const white: ColorRGB = { r: 255, g: 255, b: 255 }

export const grayscale = (brightness: number): ColorRGB => ({
  r: brightness,
  g: brightness,
  b: brightness,
})

const lerp = (a: number, b: number) => (fac: number): number =>
  a + fac * (b - a)

export const mix = (c1: ColorRGB, c2: ColorRGB) => (fac: number): ColorRGB => ({
  r: lerp(c1.r, c2.r)(fac),
  g: lerp(c1.g, c2.g)(fac),
  b: lerp(c1.b, c2.b)(fac),
})

export const blue = { r: 0, g: 56, b: 200 }
