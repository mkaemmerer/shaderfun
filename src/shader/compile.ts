import { SDF } from './lang'
import { emptyState } from './shader-context'
import { Expr, print } from './ast'
import { glInitProgram } from './gl'

const buildSDF = (sdf: SDF) => {
  const [, runSDF] = sdf.run(emptyState)
  const result = runSDF(Expr.Var('p'))
  return print(result)
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
    
    float distanceEstimate(vec2 p) {
      return ${source};
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
