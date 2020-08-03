import { S } from '../util/vector'
import { Expr } from './lang'
import { Shader, pure } from './shader'
import { lit, if$, gt } from './built-ins'

const grayscale = (value: S): Expr =>
  Expr.Col({ r: lit(value), g: lit(value), b: lit(value) })

// Scalar -> Color
export type ColorRamp = (e: Expr) => Shader<Expr>

export const signRamp: ColorRamp = (d) =>
  pure(if$(gt(d, lit(0)), grayscale(1), grayscale(0)))
