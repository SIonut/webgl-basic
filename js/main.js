
function main() {
    const canvas = document.querySelector('#glCanvas')
    canvas.width = GAME.state.displayWidth
    canvas.height = GAME.state.displayHeight
    const gl = canvas.getContext('webgl')
    if (gl === null) {
        alert('Unable to initialize WebGL. Your browser or machine might not support it.')
        return
    }

    const shaderProgram = initShaderProgram(gl, generateDefaultVertexShaderText(), generateDefaultFragmentShaderText())

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        }
    }

    let then = 0
    const buffers = initBuffers(gl)
    const render = (now) => {
        now *= .001
        const deltaTime = now - then
        then = now

        drawScene(gl, programInfo, buffers, deltaTime)

        requestAnimationFrame(render)
    }
    requestAnimationFrame(render)
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(GAME.state.shape.positions), gl.STATIC_DRAW)
    
    const colors = GAME.state.shape.colors.reduce((acc, it) => acc.concat(it, it, it, it), [])
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(GAME.state.shape.indices), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    }
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(.0, .0, .0, 1.)
    gl.clearDepth(1.)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const fieldOfView = 45 * Math.PI / 180
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = .1
    const zFar = 100.
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
    const modelViewMatrix = mat4.create()
    mat4.rotate(modelViewMatrix, modelViewMatrix, GAME.state.shape.rotation, [0, 0, 1])
    mat4.translate(modelViewMatrix, modelViewMatrix, [-.0, .0, -6.])
    mat4.rotate(modelViewMatrix, modelViewMatrix, GAME.state.shape.rotation * .5, [0, 1, 0])

    {
        const numPositionComponents = 3
        const type = gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numPositionComponents,
            type,
            normalize,
            stride,
            offset,
        )
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

        const numColorComponents = 4

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numColorComponents,
            type,
            normalize,
            stride,
            offset,
        )
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

    }

    gl.useProgram(programInfo.program)

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)

    {
        const offset = 0
        gl.drawElements(gl.TRIANGLES, GAME.state.shape.indices.length, gl.UNSIGNED_SHORT, offset)
    }

    GAME.state.shape.rotation += deltaTime
}
