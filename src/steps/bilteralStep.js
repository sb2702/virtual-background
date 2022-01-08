import Step from '../step'
import TFLiteStep from "./tfliteStep";

class BilteralStep extends Step{

    constructor(context, params) {
        super(context, params);
    }

    getFragmentShader(){

        const fragmentShaderSource = String.raw`#version 300 es

            precision highp float;
        
            uniform sampler2D u_inputFrame;
            uniform sampler2D u_segmentationMask;
            uniform vec2 u_texelSize;
            uniform float u_step;
            uniform float u_radius;
            uniform float u_offset;
            uniform float u_sigmaTexel;
            uniform float u_sigmaColor;
        
            in vec2 v_texCoord;
        
            out vec4 outColor;
        
            float gaussian(float x, float sigma) {
              float coeff = -0.5 / (sigma * sigma * 4.0 + 1.0e-6);
              return exp((x * x) * coeff);
            }
        
            void main() {
              vec2 centerCoord = v_texCoord;
              vec3 centerColor = texture(u_inputFrame, centerCoord).rgb;
              float newVal = 0.0;
        
              float spaceWeight = 0.0;
              float colorWeight = 0.0;
              float totalWeight = 0.0;
        
              // Subsample kernel space.
              for (float i = -u_radius + u_offset; i <= u_radius; i += u_step) {
                for (float j = -u_radius + u_offset; j <= u_radius; j += u_step) {
                  vec2 shift = vec2(j, i) * u_texelSize;
                  vec2 coord = vec2(centerCoord + shift);
                  vec3 frameColor = texture(u_inputFrame, coord).rgb;
                  float outVal = texture(u_segmentationMask, coord).a;
        
                  spaceWeight = gaussian(distance(centerCoord, coord), u_sigmaTexel);
                  colorWeight = gaussian(distance(centerColor, frameColor), u_sigmaColor);
                  totalWeight += spaceWeight * colorWeight;
        
                  newVal += spaceWeight * colorWeight * outVal;
                }
              }
              newVal /= totalWeight;
        
               outColor = vec4(vec3(0.0), newVal);
            }
          `;

        return this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    }


    setup(){

        const frameWidth = this.params.width;
        const frameHeight = this.params.height;


        const texelWidth = 1 / frameWidth;
        const texelHeight = 1 / frameHeight;


        const program = this.createProgram();
        this.outBuffer = this.setupOutput();


        const gl = this.gl;
        gl.useProgram(this.program);

        const inputFrameLocation = gl.getUniformLocation(program, 'u_inputFrame')
        const segmentationMaskLocation = gl.getUniformLocation(program, 'u_segmentationMask');
        const texelSizeLocation = gl.getUniformLocation(program, 'u_texelSize')
        const stepLocation = gl.getUniformLocation(program, 'u_step')
        const radiusLocation = gl.getUniformLocation(program, 'u_radius')
        const offsetLocation = gl.getUniformLocation(program, 'u_offset')
        const sigmaTexelLocation = gl.getUniformLocation(program, 'u_sigmaTexel')
        const sigmaColorLocation = gl.getUniformLocation(program, 'u_sigmaColor')



        gl.useProgram(program)
        gl.uniform1i(inputFrameLocation, 0)
        gl.uniform1i(segmentationMaskLocation, 1)
        gl.uniform2f(texelSizeLocation, texelWidth, texelHeight)

        // Ensures default values are configured to prevent infinite
        // loop in fragment shader
        updateSigmaSpace(1)
        updateSigmaColor(0.1)


        function updateSigmaSpace(sigmaSpace) {
            sigmaSpace *= Math.max(frameWidth / TFLiteStep.segmentationWidth, frameHeight / TFLiteStep.segmentationHeight);

            const kSparsityFactor = 0.66 // Higher is more sparse.
            const sparsity = Math.max(1, Math.sqrt(sigmaSpace) * kSparsityFactor)
            const step = sparsity
            const radius = sigmaSpace
            const offset = step > 1 ? step * 0.5 : 0
            const sigmaTexel = Math.max(texelWidth, texelHeight) * sigmaSpace

            gl.useProgram(program)
            gl.uniform1f(stepLocation, step)
            gl.uniform1f(radiusLocation, radius)
            gl.uniform1f(offsetLocation, offset)
            gl.uniform1f(sigmaTexelLocation, sigmaTexel)
        }

        function updateSigmaColor(sigmaColor) {
            gl.useProgram(program)
            gl.uniform1f(sigmaColorLocation, sigmaColor)
        }


        this.program = program;

    }


    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, this.params.width, this.params.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    setInput(inputFrameTexture, segmentationTexture) {


        const gl = this.gl;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);


        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, segmentationTexture)

    }




    getOutputTexture(){
        return this.createTexture(this.gl.RGBA8, this.params.width, this.params.height);
    }



    run(inputFrameTexture, segmentationTexture){

        const gl = this.gl;

        gl.useProgram(this.program);
        
        this.setInput(inputFrameTexture, segmentationTexture);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    }


}

export default BilteralStep;