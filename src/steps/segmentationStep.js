import Step from '../step'
import TFLiteStep from "./tfliteStep";

class SegmentationStep extends Step{



    constructor(context, params) {
        super(context, params);

    }

    getFragmentShader(){

        const fragmentShaderSource = String.raw`#version 300 es

                precision highp float;
            
                uniform sampler2D u_inputSegmentation;
            
                in vec2 v_texCoord;
            
                out vec4 outColor;
            
                void main() {
                  float segmentation = texture(u_inputSegmentation, v_texCoord).r;
;
                 
                  outColor = vec4(vec3(0.0), segmentation);
                }
        `;

        return this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    }


    setup(){

        this.program = this.createProgram();
        this.outBuffer = this.setupOutput();

        const gl = this.gl;

        this.tensorFlowTexture = this.createTexture(gl.R32F, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);

    }


    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.outBuffer);
    }


    setInput(tflite) {


        const gl = this.gl;

        const inputLocation = gl.getUniformLocation(this.program, 'u_inputSegmentation')

        gl.uniform1i(inputLocation, 1)
        const tfliteOutputMemoryOffset = tflite._getOutputMemoryOffset() / 4


        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.tensorFlowTexture)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight, gl.RED, gl.FLOAT, tflite.HEAPF32, tfliteOutputMemoryOffset);
    }




    getOutputTexture(){
        return this.createTexture(this.gl.RGBA8, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);
    }




    run(input){

        const gl = this.gl;

        gl.useProgram(this.program);

        this.setInput(input);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    }


}

export default SegmentationStep;