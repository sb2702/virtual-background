
import ResizeStep from './steps/resizeStep'
import TFLiteStep  from './steps/tfliteStep'
import SegmentationStep from "./steps/segmentationStep";
import BilateralStep from  './steps/bilteralStep'

class Pipeline {

    constructor(params) {

        params.segmentationWidth = TFLiteStep.segmentationWidth;
        params.segmentationHeight = TFLiteStep.segmentationHeight;

        this.params = params;

        this.initializeCanvas();

        this.setup();
    }


    setup(){

        this.resizeStep = new ResizeStep(this.context, this.params);

        this.resizeStep.setup();

        this.tfliteStep = new TFLiteStep(this.context, this.params);

        this.tfliteStep.setup();

        this.segmentationStep = new SegmentationStep(this.context, this.params);

        this.segmentationStep.setup();

        this.bilateralStep = new BilateralStep(this.context, this.params);

        this.bilateralStep.setup();


    }


    initializeCanvas(){


        const canvas = document.createElement('canvas');
        this.canvas  = canvas;

        canvas.width =this.params.width;
        canvas.height = this.params.height;
        canvas.style.background = "black";

       // canvas.style.display = "none";

        document.body.appendChild(canvas);

        this.context = canvas.getContext('webgl2');

    }


    async run(input){
        const resized = await this.resizeStep.run(input);

        const tflite = this.tfliteStep.run(resized);

        this.segmentationStep.run(tflite);

        this.bilateralStep.run(this.resizeStep.inputTexture, this.segmentationStep.outTexture);

    }


    captureStream(){
        return this.canvas.captureStream();
    }

}

export default Pipeline;