import VirtualBackgroundWorker from "worker-loader!./offscreen.worker.js";

class VirtualBackgroundFilter {


    async constructor(input, params) {

        this.input = input;

        const renderSize = this.getVideoDimensions(input);

        this.worker = this.createWorker(params, renderSize);
        this.renderCanvas = this.createCanvas(renderSize);
        this.renderContext = this.renderCanvas.getContext('bitmaprenderer');

    }


    async createWorker(params, size) {

        const worker = new VirtualBackgroundWorker();
        const offScreenCanvas = this.createCanvas(size).transferControlToOffscreen();

        const background = await createImageBitmap(params.background);

        worker.postMessage({msg: 'init', offScreenCanvas, background, width: size.width, height: size.height}, [offScreenCanvas]);

    }


    
    
    createCanvas(size){

        const newCanvas = document.createElement('canvas');
        newCanvas.height = size.height;
        newCanvas.width = size.width;
        
        newCanvas.style.display = "none";
        
        document.body.appendChild(newCanvas);

        return newCanvas
    }


    initRenderLoop(){

        const video = document.createElement('video');
        video.srcObject = this.input;
        document.body.appendChild(video);
        video.play();

        video.style.display = "none";

        const ctx = this.renderContext;

        const render = this.render;


        this.worker.addEventListener('message', function (e){

            switch (e.data.msg){

                case "rendered":
                    ctx.transferFromImageBitmap(e.data.bitmap);
                    e.data.bitmap.close();
                    render(video);
                    break;


            }

        });

    }

    async render(source){

        const bitmap = await createImageBitmap(source);
        this.worker.postMessage({msg: 'render',bitmap}, [bitmap]);
        bitmap.close();

    }



    async getOutput(){

        this.initRenderLoop();

        return this.renderCanvas.captureStream();
    }



    getVideoDimensions(input){
        let width = 640;
        let height = 360;

        if(input.getVideoTracks().length >0){
            const videoTrackSettings = input.getVideoTracks()[0].getSettings();

            width = videoTrackSettings.width;
            height = videoTrackSettings.height;
        }

        return {width, height}
    }


}


export default VirtualBackgroundFilter