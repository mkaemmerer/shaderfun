export const drawShader = (
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram
) => {
  // Prepare viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Setup shader
  gl.useProgram(shaderProgram)

  // Setup Uniforms
  const widthLocation = gl.getUniformLocation(shaderProgram, 'width')
  const heightLocation = gl.getUniformLocation(shaderProgram, 'height')

  // Setup Quad
  const quadLocation = 'position'

  const positionBuffer = gl.createBuffer()
  const positionAttributeLocation = gl.getAttribLocation(
    shaderProgram,
    quadLocation
  )

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Set Uniforms
  gl.uniform1f(widthLocation, gl.canvas.width)
  gl.uniform1f(heightLocation, gl.canvas.height)

  // Draw Quad
  gl.enableVertexAttribArray(positionAttributeLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  const size = 2 // 2 components per iteration
  const type = gl.FLOAT // the data is 32bit floats
  const normalize = false // don't normalize the data
  const stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
  const positionOffset = 0 // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    positionOffset
  )

  const primitiveType = gl.TRIANGLE_STRIP
  const vertexOffset = 0
  const vertexCount = 4
  gl.drawArrays(primitiveType, vertexOffset, vertexCount)
}
