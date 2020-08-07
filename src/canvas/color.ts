import { ColorRGB, black, white, grayscale, mix } from '../util/color'

const darkGray = grayscale(40)
const midGray = grayscale(60)
const lightGray = grayscale(240)

const eps = 2
const stripeWidth = 10
export const colorRamp = (dist: number): ColorRGB => {
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
