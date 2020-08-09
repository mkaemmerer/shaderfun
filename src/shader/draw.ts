import { compileShader } from './gl/compile'
import { drawGL } from './gl/draw'
import { Program, compile } from '../lang'

export const drawShader = (program: Program) => {
  const source = compile(program)
  return (gl: WebGLRenderingContext) => {
    const shader = compileShader(source, gl)
    drawGL(gl, shader)
  }
}
