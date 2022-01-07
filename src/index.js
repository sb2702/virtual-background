
import Pipeline from './pipeline'

class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;
        this.params = params;
        const {width, height} = input.getVideoTracks()[0].getSettings();

        this.pipeline = new Pipeline({width, height});


    }






    initRenderLoop(){

        const video = document.createElement('video');
        video.srcObject = this.input;
        document.body.appendChild(video);
        video.play();

        video.style.display = "none";

        const pipeline =  this.pipeline;

        function renderLoop(){

            video.requestVideoFrameCallback(function () {
                pipeline.run(video);
                renderLoop();
            });
        }

        renderLoop();


    }



    async getOutput(){

        this.initRenderLoop();

        return this.pipeline.captureStream();
    }





}


export default VirtualBackgroundFilter