import VirtualBackgroundWorker from "worker-loader!./offscreen.worker.js";


/** The primary interface for creating virtual Background filters. */
class VirtualBackgroundFilter {

    /**
     * @description BackgroundFilter initialization
     *
     * @param {MediaStream} input Input to the BackgroundFilter; A MediaStream object from getUserMedia
     * @param {object} params
     * @param {string | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData } [params.background]  -
     * For Virtual Background Images, provide  any type of Image source supported by [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
     * <br/>To disable backgrounds without changing the stream, set the background to "none"
     * @param {number} [params.frameRate=20] - Framerate used for running the virtual background filter
     * @param {number} [params.width] - Width used for rendering the virtual background. Defaults to the MediaStreamTrack width
     * @param {number} [params.height] - Height used for rendering the virtual background. Defaults to the MediaStreamTrack height
     */
    constructor(input, params) {




        this.input = input;

        const renderSize = this.getVideoDimensions(input);


        this.ended = false;
        this.renderCanvas = this.createCanvas(renderSize);
        this.renderContext = this.renderCanvas.getContext('bitmaprenderer');
        this.frameRate = params.frameRate || 20;


        this.initialized = this.createWorker(params, renderSize);

    }


    /**
     * @description Worker initializalization
     *
     * @param {object} params
     * @param {string | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData } [params.background]  -
     * For Virtual Background Images, provide  any type of Image source supported by [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
     * <br/>To disable backgrounds without changing the stream, set the background to "none"
     * @param {number} [params.frameRate=20] - Framerate used for running the virtual background filter
     * @param {object} size
     * @param {number} [size.width] - Width used for rendering the virtual background. Defaults to the MediaStreamTrack width
     * @param {number} [size.height] - Height used for rendering the virtual background. Defaults to the MediaStreamTrack height
     * @inner
     *
     */

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



    /**
     * @description Utility function for creating new Canvases (both the rendering canvas and the offscreen canvas)
     *
     * @param {object} size
     * @param {number} [size.width] - Width used for rendering the virtual background. Defaults to the MediaStreamTrack width
     * @param {number} [size.height] - Height used for rendering the virtual background. Defaults to the MediaStreamTrack height
     * @inner
     *
     */

    createCanvas(size){

        const newCanvas = document.createElement('canvas');
        newCanvas.height = size.height;
        newCanvas.width = size.width;
        
        newCanvas.style.display = "none";
        newCanvas.style.background = "black";
        document.body.appendChild(newCanvas);

        return newCanvas
    }


    /**
     * @description Initiate the render loop by sending a "render" message to the worker. When a "Rendered" message is recieved, the returned bitmap is rendered onto the main-thread rendering canvas and the next render step is scheduled
     * @inner
     */
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

    /**
     * @description Internal method for scheduling the next render, throttling the render rate to the specified framerate, as specified in the initial params. If the render cycle is not throttled, it could lead to arbitrarily high framerates (100+), causing high cpu usage and poor performance.
     * @inner
     */
    scheduleNextRender(){

        let debounceTime = Math.round(1000/this.frameRate) - (Date.now() - this.lastRenderTime);
        const filter = this;

        if(debounceTime > 0) setTimeout(function (){
            filter.render();
        }, debounceTime);
        else filter.render();

    }


    /**
     * @description Internal method for the render step. It takes an image bitmap from the current video source, and sends it to the worker via the render command.
     * @inner
     */

    async render(){

        if(this.ended) return;
        const source = this.video;

        const bitmap = await createImageBitmap(source);
        this.worker.postMessage({msg: 'render',bitmap}, [bitmap]);
        bitmap.close();

    }

    /**
     * @description Change the background
     * @param {string | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData } [background]  -
     * For Virtual Background Images, provide  any type of Image source supported by [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
     * <br/>To disable backgrounds without changing the stream, set the background to "none"
     */

    async changeBackground(background){

        if(background === 'none') return this.worker.postMessage({msg: 'change-background', background});

        background = await createImageBitmap(background);

        return this.worker.postMessage({msg: 'change-background', background}, [background]);


    }


    /**
     * @description Get the filtered output video stream, as a MediaStream
     * @return MediaStream
     */
    async getOutput(){

        await this.initialized;

        this.initRenderLoop();

        this.outStream = this.renderCanvas.captureStream();

        return this.outStream;
    }


    /**
     * @description Internal method for calculating the dimensions to be used for processing the video stream. Defaults to the videoTrack settings from the input
     * @param {MediaStream} [input] - the Input MediaStream from getUserMedia
     * @inner
     */

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



    /**
     * @description Shuts down the output MediaStream, stops all processing, terminates the worker and removes all unused resources
     */
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