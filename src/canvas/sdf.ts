import {
  V2,
  S,
  length,
  minus as minusV,
  times as timesV,
  plus as plusV,
  dot,
} from '../util/vector'

export type SDF = (p: V2) => S

const TAU = Math.PI * 2
const max = Math.max
const min = Math.min
const cos = Math.cos
const sin = Math.sin
const atan = Math.atan2
const abs = Math.abs
const sqrt = Math.sqrt
const log = Math.log
const mod = (x: number, b: number) => ((x % b) + b) % b

const absV = (v: V2): V2 => ({ x: abs(v.x), y: abs(v.y) })
const clamp = (lo: S, hi: S) => (s: S) => max(min(s, hi), lo)
const saturate = clamp(0, 1)

const segments = <T>(arr: T[]): [T, T][] =>
  arr.map((x, i) => [i == 0 ? arr[arr.length - 1] : arr[i - 1], x])

const projectSegment = (a: V2, b: V2) => (p: V2) => {
  const pa = minusV(p, a)
  const ba = minusV(b, a)
  const fac = saturate(dot(pa, ba) / dot(ba, ba))
  return plusV(a, timesV(fac, ba))
}

// Geometry
export const point: SDF = (p: V2) => length(p)

export const circle = (r: S): SDF => (p) => length(p) - r

export const box = (corner: V2): SDF => (p) => {
  const d = minusV(absV(p), corner)
  const c = { x: max(d.x, 0), y: max(d.y, 0) }
  return length(c) + min(max(d.x, d.y), 0)
}

export const segment = (a: V2, b: V2): SDF => (p) => {
  const c = projectSegment(a, b)(p)
  return length(minusV(p, c))
}

export const polygon = (v: V2[]): SDF => (p) => {
  const pv = minusV(p, v[0])
  let d = dot(pv, pv)

  let sign = 1
  for (const [a, b] of segments(v)) {
    const e = minusV(a, b)
    const w = minusV(p, b)
    const c = minusV(p, projectSegment(a, b)(p))
    d = min(d, dot(c, c))

    // Flip sign if we crossed an edge
    const conditions = [p.y >= b.y, p.y < a.y, e.x * w.y > e.y * w.x]
    if (conditions.every((x) => x) || conditions.every((x) => !x)) {
      sign *= -1
    }
  }
  return sign * sqrt(d)
}

// Operators
// NB: these break the distance field
export const union = (s1: SDF, s2: SDF): SDF => (p) => min(s1(p), s2(p))
export const intersection = (s1: SDF, s2: SDF): SDF => (p) => max(s1(p), s2(p))
export const difference = (s1: SDF, s2: SDF): SDF => (p) => max(s1(p), -s2(p))

// Utility
const id = (x: any) => x
const compose2 = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (x: A) => f(g(x))
export const compose = (...fs) => fs.reduce(compose2, id)

// Transformation
export type SDFTransform = (sdf: SDF) => SDF

const overDomain = (f: (p: V2) => V2): SDFTransform => (sdf) => (p) => sdf(f(p))
const overRange = (f: (s: S) => S): SDFTransform => (sdf) => (p) => f(sdf(p))

// Rigidbody
export const translate = (v: V2): SDFTransform =>
  overDomain((p) => minusV(p, v))

export const rotate = (angle: S): SDFTransform =>
  overDomain((p) => {
    const cosa = cos(angle)
    const sina = sin(angle)
    return { x: p.x * cosa - p.y * sina, y: p.x * sina + p.y * cosa }
  })

export const scale = (s: S): SDFTransform => (sdf) => (p) =>
  sdf(timesV(1 / s, p)) * s

// Domain repetition
export const mirrorX = overDomain((p) => ({ x: abs(p.x), y: p.y }))

export const mirrorY = overDomain((p) => ({ x: p.x, y: abs(p.y) }))

export const repeatX = (cellSize: S) =>
  overDomain((p) => {
    const halfCell = cellSize * 0.5
    return { x: mod(p.x + halfCell, cellSize) - halfCell, y: p.y }
  })

export const repeatY = (cellSize: S) =>
  overDomain((p) => {
    const halfCell = cellSize * 0.5
    return { x: p.x, y: mod(p.y + halfCell, cellSize) - halfCell }
  })

export const repeatGrid = (sizeX: S, sizeY: S = sizeX) =>
  compose(repeatX(sizeX), repeatY(sizeY))

export const repeatPolar = (count: S): SDFTransform =>
  overDomain((p) => {
    const angle = TAU / count
    const halfAngle = angle * 0.5
    const a = atan(p.y, p.x) + halfAngle
    const r = length(p)
    const theta = mod(a, angle) - halfAngle
    return timesV(r, { x: cos(theta), y: sin(theta) })
  })

// Domain repetition extras
export const repeatLogPolar = (count: S): SDFTransform => (sdf) => (p) => {
  const r = length(p)
  // Apply the forward log-polar map
  const pos = {
    x: log(max(0.00001, r)),
    y: atan(p.y, p.x),
  }
  // Scale everything so tiles will fit nicely in the [-pi,pi] interval
  const scale = count / TAU
  const scaled = timesV(scale, pos)
  const repeated = {
    x: mod(scaled.x + 0.5, 1) - 0.5,
    y: mod(scaled.y + 0.5, 1) - 0.5,
  }
  return (sdf(repeated) * r) / scale
}

// Morphology
export const dilate = (fac: S) => overRange((r: S) => r - fac)

export const outline = (fac: S) => overRange((r) => abs(r) - fac)

export const invert = overRange((r: S) => -r)

export const extrudeX = (fac: S) =>
  overDomain((p) => minusV(p, { x: clamp(-fac, fac)(p.x), y: 0 }))

export const extrudeY = (fac: S) =>
  overDomain((p) => minusV(p, { x: 0, y: clamp(-fac, fac)(p.y) }))
