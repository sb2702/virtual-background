
import Pipeline from './pipeline'

class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;

        const videoTrackSettings = input.getVideoTracks()[0].getSettings();
        params.width = params.width || videoTrackSettings.width || 640;
        params.height = params.height || videoTrackSettings.height || 360;


        this.pipeline = new Pipeline(params);

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