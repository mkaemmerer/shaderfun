import { SDF } from './sdf'
import { run } from './shader-context'
import { Expr, print, normalize } from './ast'
import { glInitProgram } from './gl'

const indent = (line: string, indentLevel: number) =>
  `${' '.repeat(indentLevel)}${line}`

const indentLines = (lines: string, indentLevel) =>
  lines
    .split('\n')
    .map((line) => indent(line, indentLevel))
    .join('\n')

const buildSDF = (sdf: SDF) => {
  const result: Expr = run(sdf(Expr.Var('p')))
  const normalized = normalize(result)
  return print(normalized)
}

export const compileSDF = (sdf: SDF, gl: WebGLRenderingContext) => {
  const source = buildSDF(sdf)

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

    float distanceEstimate(vec2 p) {
      ${indentLines(source, 6).trim()}
    }
    
    vec3 getColor(vec2 p) {      
      float t = distanceEstimate(p);
      return t > 0. ? vec3(1.,1., 1.) : vec3(0.,0.,0.);
    }
    
    void main () {
      vec2 resolution = vec2(width, height);
      vec2 p = gl_FragCoord.xy - resolution / 2.;
      vec3 res = getColor(p);
      gl_FragColor = vec4(res.rgb, 1.);
    }
  `
  console.log(fragmentShaderSource)

  return glInitProgram(gl, { vertexShaderSource, fragmentShaderSource })
}
