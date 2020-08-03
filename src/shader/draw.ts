import { compileShader } from './gl/compile'
import { drawGL } from './gl/draw'
import { Expr, print, normalize } from './lang'
import { Program, run } from './program'

const buildShader = (program: Program) => {
  const result: Expr = run(program)
  const normalized = normalize(result)
  return print(normalized)
}

export const drawShader = (program: Program) => {
  const source = buildShader(program)
  return (gl: WebGLRenderingContext) => {
    const shader = compileShader(source, gl)
    drawGL(gl, shader)
  }
}
