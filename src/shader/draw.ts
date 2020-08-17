import { compileShader } from './gl/compile'
import { drawGL } from './gl/draw'
import { ShaderProgram, compile } from '../lang'

export const drawShader = (program: ShaderProgram) => {
  const source = compile(program)
  return (gl: WebGLRenderingContext) => {
    const shader = compileShader(source, gl)
    drawGL(gl, shader)
  }
}
