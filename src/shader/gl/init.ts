type ShaderType =
  | WebGLRenderingContext['VERTEX_SHADER']
  | WebGLRenderingContext['FRAGMENT_SHADER']

//
// Initialize a shader program, so WebGL knows how to draw our data
//
export const glInitShader = (
  gl: WebGLRenderingContext,
  { vertexShaderSource, fragmentShaderSource }
): WebGLProgram => {
  const vertexShader = glLoadShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = glLoadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  )

  // Create the shader program
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    )
  }

  return shaderProgram
}

//
// Create a shader of the given type, upload the source and compile it.
//
export const glLoadShader = (
  gl: WebGLRenderingContext,
  type: ShaderType,
  source: string
) => {
  const shader = gl.createShader(type)

  // Send the source to the shader object
  gl.shaderSource(shader, source)

  // Compile the shader program
  gl.compileShader(shader)

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const err = new Error(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    )
    gl.deleteShader(shader)
    throw err
  }

  return shader
}
