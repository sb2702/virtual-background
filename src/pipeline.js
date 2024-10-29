
import ResizeStep from './steps/resizeStep'
import TFLiteStep  from './steps/tfliteStep'
import SegmentationStep from "./steps/segmentationStep";
import BilateralStep from  './steps/bilteralStep'
import BackgroundImageStep from "./steps/backgroundImageStep";
import BackgroundBlurStep from "./steps/backgroundBlurStep";

/** The main class for handling all pipeline stages */
class Pipeline {


    /**
     * @description Initialize the pipeline
     *
     * @param {object} params
     * @param {string | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData } [params.background]  -
     * For Virtual Background Images, provide  any type of Image source supported by [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
     * <br/>To disable backgrounds without changing the stream, set the background to "none"
     * @param {HTMLCanvasElement} [params.offscreenCanvas] - The OffscreenCanvas used for processing. This needs to be sent from the main thread on initialization
     * @param {number} [params.width] - Width used for rendering the virtual background. Defaults to the MediaStreamTrack width
     * @param {number} [params.height] - Height used for rendering the virtual background. Defaults to the MediaStreamTrack height

     */
    constructor(params) {

        params.segmentationWidth = TFLiteStep.segmentationWidth;
        params.segmentationHeight = TFLiteStep.segmentationHeight;

        this.params = params;
        this.background = params.background;

        this.initializeCanvas(params.offScreenCanvas);

    }

/**
 * @description Initialize all the steps, and run setup (which may be async for one or more steps, particularly the TFLite Step
 **/
    async setup(){

        this.resizeStep = new ResizeStep(this.context, this.params);
        this.tfliteStep = new TFLiteStep(this.context, this.params);
        this.segmentationStep = new SegmentationStep(this.context, this.params);
        this.bilateralStep = new BilateralStep(this.context, this.params);
        this.backgroundImageStep = new BackgroundImageStep(this.context, this.params);

        this.resizeStep.setup();
        await this.tfliteStep.setup();       // TFLite Setup is asynchronous
        this.segmentationStep.setup();
        this.bilateralStep.setup();
        this.backgroundImageStep.setup();


    }

    /**
     * @description Get the WebGL 2D context. In reality, you should check for WebGL2 support and/or handle for errors if WebGL 2 isn't supported
     **/
    initializeCanvas(canvas){

        this.canvas  = canvas;

        this.context = canvas.getContext('webgl2');

    }

    /**
     * @description Get the WebGL 2D context. In reality, you should check for WebGL2 support and/or handle for errors if WebGL 2 isn't supported
     * @param {ImageBitmap} [input] - The input frame, sent from the user's video stream from the main thread
     * @return {ImageBitmap} The processed frame, with the virtual background inserted
     **/
    async run(input){

        if(this.background ===  'none') return input;

        const resized = await this.resizeStep.run(input);


        const properResized = new Uint8Array(144*256*3);

        for(let i=0; i< 144*256; i++){

            properResized[i*3] = resized[i*4];
            properResized[i*3+1] = resized[i*4+1];
            properResized[i*3+2] = resized[i*4+2];


        }


        const tflite = this.tfliteStep.run(properResized);

        this.segmentationStep.run(tflite);

        this.bilateralStep.run(this.resizeStep.inputTexture, this.segmentationStep.outTexture);

        this.backgroundImageStep.run(this.resizeStep.inputTexture, this.bilateralStep.outTexture);

        return this.canvas.transferToImageBitmap();

    }

    /**
     * @description Change the background
     * @param {string | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData } [background]  -
     * For Virtual Background Images, provide  any type of Image source supported by [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
     * <br/>To disable backgrounds without changing the stream, set the background to "none"
     */

    changeBackground(background){

        this.background = background;

        if(background instanceof ImageBitmap)  this.backgroundImageStep.setBackgroundImage(background);


    }



}

export default Pipeline;