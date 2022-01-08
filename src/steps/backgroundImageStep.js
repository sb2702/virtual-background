import Step from '../step'
import TFLiteStep from "./tfliteStep";

class BackgroundImageStep extends Step{

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
              vec3 backgroundColor = texture(u_background, v_texCoord).rgb;
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


        this.backgroundTexture = this.createBackgroundTexture();

        this.program = program;



        this.setBackgroundImage(this.params.background);

    }

    createBackgroundTexture(){

        const gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set up texture so we can render any size image and so we are
        // working with pixels.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return texture;
    }

    setBackgroundImage(backgroundImage){


        const program = this.program;

        const frameWidth = this.params.width;
        const frameHeight = this.params.height;

        const outputRatio = frameWidth / frameHeight;

        const gl = this.gl;

        gl.useProgram(this.program);
        gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backgroundImage);

        let xOffset = 0;
        let yOffset = 0;
        let backgroundWidth = backgroundImage.naturalWidth;
        let backgroundHeight = backgroundImage.naturalHeight;
        const backgroundRatio = backgroundWidth / backgroundHeight;
        if (backgroundRatio < outputRatio) {
            backgroundHeight = backgroundWidth / outputRatio;
            yOffset = (backgroundImage.naturalHeight - backgroundHeight) / 2;
        } else {
            backgroundWidth = backgroundHeight * outputRatio;
            xOffset = (backgroundImage.naturalWidth - backgroundWidth) / 2;
        }

        const xScale = backgroundWidth / backgroundImage.naturalWidth;
        const yScale = backgroundHeight / backgroundImage.naturalHeight;
        xOffset /= backgroundImage.naturalWidth;
        yOffset /= backgroundImage.naturalHeight;

        const backgroundScaleLocation = gl.getUniformLocation(program, 'u_backgroundScale');
        const backgroundOffsetLocation = gl.getUniformLocation(program, 'u_backgroundOffset');

        gl.uniform2f(backgroundScaleLocation, xScale, yScale);
        gl.uniform2f(backgroundOffsetLocation, xOffset, yOffset);
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

        if(this.backgroundTexture){

            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture)
            // TODO Handle correctly the background not loaded yet
            gl.uniform1i(this.backgroundLocation, 2)

        }

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

export default BackgroundImageStep;