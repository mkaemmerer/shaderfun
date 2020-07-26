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

    float distanceEstimate(vec2 p) {
      ${indentLines(source, 6).trim()}
    }
    
    // Stripey color ramp function
    const vec3 black = vec3(0.,0.,0.);
    const vec3 darkGray = 0.15 * vec3(1., 1., 1.);
    const vec3 midGray = 0.24 * vec3(1., 1., 1.);
    const vec3 lightGray = 0.95 * vec3(1., 1., 1.);
    const vec3 white = vec3(1.,1.,1.);
    
    const float eps = 2.;
    const float stripeWidth = 10.;
    vec3 colorRamp(float dist) {
      if (abs(dist) < eps) {
        bool blend = abs(dist - eps) < 1.;
        float fac = fract(dist);
        vec3 target = dist > 0. ? white : darkGray;
        return blend ? mix(black, target, fac) : black;
      }
      if (dist <= -eps) {
        return mod(floor(dist / stripeWidth), 2.) == 0. ? midGray : darkGray;
      }
      if (dist >= eps) {
        return mod(floor(dist / stripeWidth), 2.) == 0. ? white : lightGray;
      }
    }

    vec3 getColor(vec2 p) {      
      float t = distanceEstimate(p);
      return colorRamp(t);
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
