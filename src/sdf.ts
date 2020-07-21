import { V2, S, length, minus, times, dot } from './utils/vector'

export type SDF = (p: V2) => S

const max = Math.max
const min = Math.min
const cos = Math.cos
const sin = Math.sin
const abs = Math.abs

const abs2 = (v: V2): V2 => ({ x: Math.abs(v.x), y: Math.abs(v.y) })
const saturate = (s: S): S => max(min(s, 1), 0)

// Geometry
export const point = (p: V2) => length(p)

export const circle = (r: S): SDF => (p: V2) => length(p) - r

export const box = (corner: V2): SDF => (p: V2) => {
  const d = minus(abs2(p), corner)
  const c = { x: max(d.x, 0), y: max(d.y, 0) }
  return length(c) + min(max(d.x, d.y), 0)
}

export const segment = (a: V2, b: V2) => (p: V2) => {
  const pa = minus(p, a)
  const ba = minus(b, a)
  const h = saturate(dot(pa, ba) / dot(ba, ba))
  return length(minus(pa, times(h, ba)))
}

// Operators
export const union = (s1: SDF, s2: SDF): SDF => (p: V2) => min(s1(p), s2(p))

// Transformation
const overDomain = (f: (p: V2) => V2) => (sdf: SDF): SDF => (p: V2) => sdf(f(p))
const overRange = (f: (s: S) => S) => (sdf: SDF): SDF => (p: V2) => f(sdf(p))

export const mirrorX = overDomain((p: V2) => ({ x: abs(p.x), y: p.y }))

export const mirrorY = overDomain((p: V2) => ({ x: p.x, y: abs(p.y) }))

export const translate = (v: V2) => overDomain((p: V2) => minus(p, v))

export const rotate = (angle: S) =>
  overDomain((p: V2) => {
    const cosa = cos(angle)
    const sina = sin(angle)
    return { x: p.x * cosa - p.y * sina, y: p.x * sina + p.y * cosa }
  })

export const scale = (s: S) => (sdf: SDF): SDF => (p: V2) =>
  sdf(times(1 / s, p)) * s

export const dilate = (fac: S) => overRange((r: S) => r - fac)

export const outline = (fac: S) => overRange((r) => abs(r) - fac)

export const invert = overRange((r: S) => -r)
