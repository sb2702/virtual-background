import Step from '../step'
import createTFLiteSIMDModule from  '../tflite/tflite-simd.js'
import createTFLiteModule from '../tflite/tflite.js'
const model =  require('binary-loader!../tflite/segm_lite_v681.tflite');



class TFLiteStep extends Step{

    static segmentationWidth = 160;
    static segmentationHeight = 96;

    constructor(context, params) {
        super(context, params);

    }

    async setup(){

        const tflite = await createTFLiteSIMDModule();

        const modelArrayBuffer = new Uint8Array(model.length);
        for (let i = 0; i < model.length; i++) {
            modelArrayBuffer[i] = model.charCodeAt(i);
        }

        const modelBufferOffset = tflite._getModelBufferMemoryOffset();

        tflite.HEAPU8.set(modelArrayBuffer, modelBufferOffset);

        tflite._loadModel(modelArrayBuffer.byteLength);

        this.tflite = tflite;

    }


    setupOutput() {
    }

    setInput() {

    }

    setOutput() {

    }

    run(inputPixels) {

        const tflite = this.tflite;

        const tfliteInputMemoryOffset = tflite._getInputMemoryOffset() / 4;

        for (let i = 0; i < TFLiteStep.segmentationWidth*TFLiteStep.segmentationHeight; i++) {
            const outputIndex = i * 4;
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