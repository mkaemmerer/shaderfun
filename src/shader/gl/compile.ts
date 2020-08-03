import { glInitShader } from './init'

const indent = (line: string, indentLevel: number) =>
  `${' '.repeat(indentLevel)}${line}`

const indentLines = (lines: string, indentLevel: number) =>
  lines
    .split('\n')
    .map((line) => indent(line, indentLevel))
    .join('\n')

export const compileShader = (source: string, gl: WebGLRenderingContext) => {
  const vertexShaderSource = `
    precision mediump float;
    attribute vec2 position;
    void main () {
      gl_Position = vec4(position, 0, 1);
    }
  `
  const fragmentShaderSource = `
    precision mediump float;
    uniform float width, height;
    
    float saturate(float v) {
      return clamp(v, 0., 1.);
    }

    vec3 getColor(vec2 p) {
      ${indentLines(source, 6).trim()}
    }

    void main () {
      vec2 resolution = vec2(width, height);
      vec2 p = gl_FragCoord.xy - resolution / 2.;
      vec3 res = getColor(p);
      gl_FragColor = vec4(res.rgb, 1.);
    }
  `
  return glInitShader(gl, { vertexShaderSource, fragmentShaderSource })
}
