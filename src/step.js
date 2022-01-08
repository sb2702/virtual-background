


class Step {

    constructor(context, params={}) {
        this.gl  = context;
        this.params = params;
        this.width = params.width || 640;
        this.height = params.height || 360;

    }


    setup(){
        this.program = this.createProgram();
        this.outBuffer = this.setupOutput();
    }

    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, this.width, this.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    getOutputTexture(){
        return this.createTexture(this.gl.RGB8, this.params.width, this.params.height);
    }


    run(input){

        const gl = this.gl;

        gl.useProgram(this.program);

        this.setInput(input);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    setupOutput(){

        const gl = this.gl;

        const outputTexture = this.getOutputTexture();

        const frameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        return frameBuffer;
    }

    setInput(){

    }

    getFragmentShader(){

        const fragmentShaderSource = String.raw`#version 300 es

                precision highp float;
            
                uniform sampler2D u_inputFrame;
            
                in vec2 v_texCoord;
            
                out vec4 outColor;

                void main() {
                  outColor = texture(u_inputFrame, v_texCoord);
                }
              `;



        return this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    }


    getVertexShader(){

        const vertexShaderSource = String.raw`#version 300 es

            in vec2 a_position;
            in vec2 a_texCoord;
       
            out vec2 v_texCoord;
        
            void main() {
              gl_Position = vec4(a_position, 0.0, 1.0);
              v_texCoord = a_texCoord;
            }
          `;


        return this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);

    }


    createShader(type, source){

        const gl = this.gl;

        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        return shader;

    }


    createProgram(){


        const fragmentShader = this.getFragmentShader();
        const vertexShader = this.getVertexShader();

        const gl = this.gl;

        const vertexArray = gl.createVertexArray()
        gl.bindVertexArray(vertexArray);


        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER,  new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]), gl.STATIC_DRAW);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),  gl.STATIC_DRAW);


        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

        const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord')
        gl.enableVertexAttribArray(texCoordAttributeLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0)



        return program;

    }


    createTexture(internalFormat, width, height){

        const gl = this.gl;

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, width, height);

        return texture;

    }

    /*
        createTexture(internalFormat, width, height, minFilter=gl.NEAREST, magFilter=gl.NEAREST){

            const gl = this.gl;


            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter)
            gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, width, height);

            return texture;

        }

    */


}


export default Step;