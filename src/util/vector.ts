export type V2 = { x: number; y: number }
export type S = number

export const zero: V2 = { x: 0, y: 0 }
export const unitX: V2 = { x: 1, y: 0 }
export const unitY: V2 = { x: 0, y: 1 }

export const plus = (u: V2, v: V2): V2 => ({
  x: u.x + v.x,
  y: u.y + v.y,
})
export const minus = (u: V2, v: V2): V2 => ({
  x: u.x - v.x,
  y: u.y - v.y,
})
export const times = (s: S, v: V2): V2 => ({ x: s * v.x, y: s * v.y })
export const dot = (u: V2, v: V2): S => u.x * v.x + u.y * v.y
export const negate = (v: V2): V2 => times(-1, v)

export const sqrMagnitude = (v: V2): S => dot(v, v)
export const magnitude = (v: V2): S => Math.sqrt(dot(v, v))
export const length = magnitude

export const normalize = (v: V2): V2 => times(1 / magnitude(v), v)
export const project = (u: V2, v: V2) => {
  const len = dot(u, v) / dot(v, v)
  return times(len, v)
}
