
import ResizeStep from './steps/resizeStep'
import TFLiteStep  from './steps/tfliteStep'
import SegmentationStep from "./steps/segmentationStep";
import BilateralStep from  './steps/bilteralStep'
import BackgroundImageStep from "./steps/backgroundImageStep";
import BackgroundBlurStep from "./steps/backgroundBlurStep";

class Pipeline {

    constructor(params) {

        params.segmentationWidth = TFLiteStep.segmentationWidth;
        params.segmentationHeight = TFLiteStep.segmentationHeight;

        this.params = params;

        this.initializeCanvas(params.offScreenCanvas);

    }


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


    initializeCanvas(canvas){

        this.canvas  = canvas;

        this.context = canvas.getContext('webgl2');

    }


    async run(input){

        const resized = await this.resizeStep.run(input);

        const tflite = this.tfliteStep.run(resized);

        this.segmentationStep.run(tflite);

        this.bilateralStep.run(this.resizeStep.inputTexture, this.segmentationStep.outTexture);

        this.backgroundImageStep.run(this.resizeStep.inputTexture, this.bilateralStep.outTexture);


        return this.canvas.transferToImageBitmap();

    }


    captureStream(){
        return this.canvas.captureStream();
    }

}

export default Pipeline;