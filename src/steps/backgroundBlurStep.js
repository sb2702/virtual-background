import Step from '../step'
import TFLiteStep from "./tfliteStep";

class BackgroundBlurStep extends Step{

    constructor(context, params) {
        super(context, params);
    }

    getVertexShader(){

           const vertexShaderSource = String.raw`#version 300 es
    
                uniform vec2 u_backgroundScale;
                uniform vec2 u_backgroundOffset;
            
                in vec2 a_position;
                in vec2 a_texCoord;
            
                out vec2 v_texCoord;
                out vec2 v_backgroundCoord;
            
                void main() {
                  // Flipping Y is required when rendering to canvas
                  gl_Position = vec4(a_position * vec2(1.0, -1.0), 0.0, 1.0);
                  v_texCoord = a_texCoord;
                  v_backgroundCoord = a_texCoord * u_backgroundScale + u_backgroundOffset;
                }
          `;


        return this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);

    }


    getFragmentShader(){

        const fragmentShaderSource = String.raw`#version 300 es

            precision highp float;
        
            uniform sampler2D u_inputFrame;
            uniform sampler2D u_personMask;
            uniform sampler2D u_background;
            uniform vec2 u_coverage;
            
            in vec2 v_texCoord;
            in vec2 v_backgroundCoord;
        
            out vec4 outColor;
        
            void main() {
              vec3 frameColor = texture(u_inputFrame, v_texCoord).rgb;
              vec3 backgroundColor = vec3(0.0);
              float personMask = texture(u_personMask, v_texCoord).a;
         
              personMask = smoothstep(u_coverage.x, u_coverage.y, personMask);
             outColor = vec4(frameColor * personMask + backgroundColor * (1.0 - personMask), 1.0);
            }
        `;


        return this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    }


    async setup(){


        const program = this.createProgram();


        const gl = this.gl;
        gl.useProgram(this.program);


        const backgroundScaleLocation = gl.getUniformLocation(program, 'u_backgroundScale');
        const backgroundOffsetLocation = gl.getUniformLocation(program, 'u_backgroundOffset');

        const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame')
        const personMaskLocation = gl.getUniformLocation(program, 'u_personMask')
        this.backgroundLocation = gl.getUniformLocation(program, 'u_background')
        const coverageLocation = gl.getUniformLocation(program, 'u_coverage')


        gl.useProgram(program);
        gl.uniform2f(backgroundScaleLocation, 1, 1);
        gl.uniform2f(backgroundOffsetLocation, 0, 0);
        gl.uniform1i(inputFrameLocation, 0);
        gl.uniform1i(personMaskLocation, 1);
        gl.uniform2f(coverageLocation, 0, 1);



        this.program = program;


    }





    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, this.params.width, this.params.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    setInput(inputFrameTexture, personMaskTexture) {


        const gl = this.gl;


        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, personMaskTexture);

    }




    getOutputTexture(){
        return this.createTexture(this.gl.RGBA8, this.params.width, this.params.height);
    }



    run(inputFrameTexture, personMaskTexture){

        const gl = this.gl;

        gl.useProgram(this.program);

        this.setInput(inputFrameTexture, personMaskTexture);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    }


}

export default BackgroundBlurStep;