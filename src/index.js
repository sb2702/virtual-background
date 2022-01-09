import VirtualBackgroundWorker from "worker-loader!./offscreen.worker.js";

class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;

        const renderSize = this.getVideoDimensions(input);


        this.ended = false;
        this.renderCanvas = this.createCanvas(renderSize);
        this.renderContext = this.renderCanvas.getContext('bitmaprenderer');
        this.frameRate = params.frameRate || 20;


        this.initialized = this.createWorker(params, renderSize);

    }


    async createWorker(params, size) {

        const worker = new VirtualBackgroundWorker();
        const originalCanvas = this.createCanvas(size);

        const offScreenCanvas = originalCanvas.transferControlToOffscreen();
        this.originalCanvas =originalCanvas;

        const background = await createImageBitmap(params.background);

        worker.postMessage({msg: 'init', offScreenCanvas, background, width: size.width, height: size.height}, [offScreenCanvas]);

        await new Promise(function (resolve) {
            worker.addEventListener('message', function (e){
                if(e.data.msg === "initialized"){
                    resolve();
                }
            });
        });

        this.worker = worker;


        return true;

    }


    
    
    createCanvas(size){

        const newCanvas = document.createElement('canvas');
        newCanvas.height = size.height;
        newCanvas.width = size.width;
        
        newCanvas.style.display = "none";
        newCanvas.style.background = "black";
        document.body.appendChild(newCanvas);

        return newCanvas
    }


    initRenderLoop(){

        const video = document.createElement('video');
        video.srcObject = this.input;
        document.body.appendChild(video);
        video.play();

        video.style.display = "none";

        this.video = video;

        const ctx = this.renderContext;

        const filter = this;

        if(video.readyState < 1) video.oncanplay = ()=> {filter.render()};
        else filter.render();




        this.worker.addEventListener('message', function (e){

            switch (e.data.msg){

                case "rendered":
                    filter.lastRenderTime = Date.now();
                    ctx.transferFromImageBitmap(e.data.bitmap);
                    e.data.bitmap.close();
                    filter.scheduleNextRender();
                    break;


            }

        });



    }

    scheduleNextRender(){

        let debounceTime = Math.round(1000/this.frameRate) - (Date.now() - this.lastRenderTime);
        const filter = this;

        if(debounceTime > 0) setTimeout(function (){
            filter.render();
        }, debounceTime);
        else filter.render();

    }

    async render(){

        if(this.ended) return;
        const source = this.video;

        const bitmap = await createImageBitmap(source);
        this.worker.postMessage({msg: 'render',bitmap}, [bitmap]);
        bitmap.close();

    }

    async changeBackground(background){

        if(background === 'none') return this.worker.postMessage({msg: 'change-background', background});

        background = await createImageBitmap(background);

        return this.worker.postMessage({msg: 'change-background', background}, [background]);


    }


    async getOutput(){

        await this.initialized;

        this.initRenderLoop();

        this.outStream = this.renderCanvas.captureStream();

        return this.outStream;
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


    async destroy(){

        this.ended  = true;

        this.outStream.getTracks().forEach((track)=> track.stop());
        this.renderCanvas.remove();
        this.video.remove();
        this.originalCanvas.remove();

        const worker = this.worker;

        worker.terminate();

        delete this.worker;

        delete this;

    }

    static isSupported(){
        return (typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function")
    }


}


export default VirtualBackgroundFilter