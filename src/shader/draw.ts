import { compileShader } from './gl/compile'
import { drawShader } from './gl/draw'
import { Expr, print, normalize } from './ast'
import { SDF } from './sdf'
import { run } from './shader-context'

const buildSDF = (sdf: SDF) => {
  const result: Expr = run(sdf(Expr.Var('p')))
  const normalized = normalize(result)
  return print(normalized)
}

export const drawSDF = (sdf: SDF) => {
  const source = buildSDF(sdf)

  return (gl: WebGLRenderingContext) => {
    const shader = compileShader(source, gl)
    drawShader(gl, shader)
  }
}
