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
                  vec2 segmentation = texture(u_inputSegmentation, v_texCoord).rg;
                  float shift = max(segmentation.r, segmentation.g);
                  float backgroundExp = exp(segmentation.r - shift);
                  float personExp = exp(segmentation.g - shift);
                  
                  float segOut = personExp / (backgroundExp + personExp);
                  outColor = vec4(vec3(segOut), 1.0);
                }
        `;

        return this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    }


    setup(){

        this.program = this.createProgram();
        this.outBuffer = this.setupOutput();

        const gl = this.gl;

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG32F, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);


        this.tensorFlowTexture = texture;
      //  this.tensorFlowTexture = this.createTexture(this.gl.RG32F, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);

    }


    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    setInput(tflite) {


        const gl = this.gl;

        const inputLocation = gl.getUniformLocation(this.program, 'u_inputSegmentation')

        gl.uniform1i(inputLocation, 1)
        const tfliteOutputMemoryOffset = tflite._getOutputMemoryOffset() / 4

     //   console.log(tflite.HEAPF32.slice(tfliteOutputMemoryOffset, tfliteOutputMemoryOffset+100));

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.tensorFlowTexture)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight, gl.RG, gl.FLOAT, tflite.HEAPF32, tfliteOutputMemoryOffset);
    }




    getOutputTexture(){


        const gl = this.gl;

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);

        return texture;
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