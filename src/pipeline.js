


class Pipeline {

    constructor() {
        this.initializeCanvas();
    }


    initializeCanvas(){

        const canvas = document.createElement('canvas');
        this.canvas  = canvas;
        document.body.appendChild(canvas);
        canvas.style.display = "none";

        const context = canvas.getContext('2d');
        this.context = context;

    }


    run(input){

        this.context.drawImage(input);

    }


    captureStream(){
        return this.canvas.captureStream();
    }

}