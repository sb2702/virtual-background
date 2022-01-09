import VirtualBackgroundWorker from "worker-loader!./offscreen.worker.js";

class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;

        const renderSize = this.getVideoDimensions(input);


        this.renderCanvas = this.createCanvas(renderSize);
        this.renderContext = this.renderCanvas.getContext('bitmaprenderer');


        this.initialized = this.createWorker(params, renderSize);

    }


    async createWorker(params, size) {

        const worker = new VirtualBackgroundWorker();
        const offScreenCanvas = this.createCanvas(size).transferControlToOffscreen();

        const background = await createImageBitmap(params.background);

        worker.postMessage({msg: 'init', offScreenCanvas, background, width: size.width, height: size.height}, [offScreenCanvas]);

        this.worker = worker;

        return true;

    }


    
    
    createCanvas(size){

        const newCanvas = document.createElement('canvas');
        newCanvas.height = size.height;
        newCanvas.width = size.width;
        
      //  newCanvas.style.display = "none";
        
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

        const filter = this;

        if(video.readyState < 1) video.oncanplay = ()=> {filter.render(video)};
        else filter.render(video);




        this.worker.addEventListener('message', function (e){

            switch (e.data.msg){

                case "rendered":
                    console.log("In rendered");

                    ctx.transferFromImageBitmap(e.data.bitmap);
                    e.data.bitmap.close();
                    filter.render(video);
                    break;


            }

        });



    }

    async render(source){

        const bitmap = await createImageBitmap(source);

        console.log("Bitmap");
        console.log(bitmap);
        console.log(this.worker);
        this.worker.postMessage({msg: 'render',bitmap}, [bitmap]);
        bitmap.close();

    }



    async getOutput(){

        console.log("Getting output");

        await this.initialized;

        console.log("Startint render loop");

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