


class VirtualBackgroundFilter {


    constructor(input, params) {

        this.input = input;
        this.params = params;

    }



    async getOutput(){

        return this.input.clone();
    }





}