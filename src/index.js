
import Pipeline from './pipeline'

class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;
        this.params = params;


        this.pipeline = new Pipeline();

    }



    async getOutput(){

        return this.pipeline.captureStream();
    }





}