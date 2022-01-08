import Step from '../step'
import TFLiteStep from "./tfliteStep";

class ResizeStep extends Step{



    constructor(context, params) {
        super(context, params);

        this.outputPixelCount = TFLiteStep.segmentationWidth * TFLiteStep.segmentationHeight;

    }


    setup(){

        this.inputTexture = this.getInputTexture();
        this.program = this.createProgram();
        this.pixelBuffer =   this.gl.createBuffer();
        this.outBuffer = this.setupOutput();

    }

    setupOutput(){

        const gl = this.gl;

        const outputTexture = this.getOutputTexture();

        const frameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        return frameBuffer;
    }


    getOutputTexture(){
        return this.createTexture(this.gl.RGBA8, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);
    }

    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.outBuffer);
    }

    setInput(input){
        const gl = this.gl;

        const inputFrameLocation = gl.getUniformLocation(this.program, 'u_inputFrame');

        gl.uniform1i(inputFrameLocation, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input);
    }


    getInputTexture(){

        const gl = this.gl;
        console.log(gl);
        const inputFrameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        return inputFrameTexture;

    }


    run(input){

        const gl = this.gl;

        gl.useProgram(this.program);

        this.setInput(input);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)



        const outputPixels = new Uint8Array(this.outputPixelCount * 4)




        const pixelBuffer = this.pixelBuffer;

        gl.bindBuffer(gl.PIXEL_PACK_BUFFER,  pixelBuffer);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, outputPixels.byteLength, gl.STREAM_READ);
        gl.readPixels(0, 0, TFLiteStep.segmentationWidth, TFLiteStep.segmentationHeight, gl.RGBA, gl.UNSIGNED_BYTE, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        gl.flush();

        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);


        return new Promise(function (resolve){


            function test() {
                const res = gl.clientWaitSync(sync, 0, 0);
                if (res === gl.TIMEOUT_EXPIRED) return setTimeout(test)
                gl.deleteSync(sync);
                const target = gl.PIXEL_PACK_BUFFER;
                gl.bindBuffer(target, pixelBuffer);
                gl.getBufferSubData(target, 0, outputPixels, 0, outputPixels.length)
                gl.bindBuffer(target, null);
                resolve(outputPixels);
            }
            setTimeout(test);
        });

    }


}

export default ResizeStep;