import Step from '../step'
import createTFLiteSIMDModule from '../tflite/tflite-simd.js'
import createTFLiteModule from '../tflite/tflite.js'
const model =  require('binary-loader!../tflite/selfie_segmentation_landscape.tflite');

/** The TFLite Step handles execution of the TF Lite module */

class TFLiteStep extends Step{

    static segmentationWidth = 256;
    static segmentationHeight = 144;

    constructor(context, params) {
        super(context, params);

    }


    /** The TFLite setup relies on the model and WASM files being loaded directly from memory in Webpack, so nothing is being loaded at runtime over the network */
    async setup(){

        const tflite = await createTFLiteSIMDModule();

        const modelArrayBuffer = new Uint8Array(model.length);
        for (let i = 0; i < model.length; i++) {
            modelArrayBuffer[i] = model.charCodeAt(i);
        }

        const modelBufferOffset = tflite._getModelBufferMemoryOffset();

        console.log(modelBufferOffset)


        console.log("Loading model");
        tflite.HEAPU8.set(modelArrayBuffer, modelBufferOffset);

        tflite._loadModel(modelArrayBuffer.byteLength);


        console.log("Loaded model");
        this.tflite = tflite;

    }


    /** This code comes straight from the [Volcomix repo](https://github.com/Volcomix/virtual-background)  */
    run(inputPixels) {

        const tflite = this.tflite;

        const tfliteInputMemoryOffset = tflite._getInputMemoryOffset() / 4;

        for (let i = 0; i < TFLiteStep.segmentationWidth*TFLiteStep.segmentationHeight; i++) {
            const outputIndex = i * 3;
            const tfliteIndex = tfliteInputMemoryOffset + i * 3;
            tflite.HEAPF32[tfliteIndex] = inputPixels[outputIndex] / 255
            tflite.HEAPF32[tfliteIndex + 1] = inputPixels[outputIndex + 1] / 255
            tflite.HEAPF32[tfliteIndex + 2] = inputPixels[outputIndex + 2] / 255

        }

        tflite._runInference();

        return tflite;


    }


}

export default TFLiteStep;