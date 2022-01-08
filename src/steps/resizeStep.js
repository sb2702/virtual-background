import Step from '../step'

class ResizeStep extends Step{



    constructor(context, params) {
        super(context, params);

        this.segmentationWidth  = 160;
        this.segmentationHeight = 96;
    }


    setup(){

        this.inputTexture = this.getInputTexture();
        this.program = this.createProgram();

    }


    setOutput(){
        const gl = this.gl;
        gl.viewport(0, 0, this.segmentationWidth, this.segmentationHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    setInput(input){
        const gl = this.gl;

        const inputFrameLocation = gl.getUniformLocation(this.program, 'u_inputFrame');

        gl.uniform1i(inputFrameLocation, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, input);
    }

    run(input){

        const gl = this.gl;

        gl.useProgram(this.program);

        this.setInput(input);
        this.setOutput();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
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



}

export default ResizeStep;