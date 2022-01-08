
import ResizeStep from './steps/resizeStep'

class Pipeline {

    constructor(params) {
        this.params = params;

        this.width =  params.width || 640;
        this.height = params.height || 360;

        this.initializeCanvas();

        this.setup();
    }


    setup(){



        this.resizeLayer = new ResizeStep(this.context);

        this.resizeLayer.setup();

    }


    initializeCanvas(){


        const canvas = document.createElement('canvas');
        this.canvas  = canvas;

        canvas.width =this.width;
        canvas.height = this.height;

       // canvas.style.display = "none";

        document.body.appendChild(canvas);

        this.context = canvas.getContext('webgl2');

    }


    run(input){
        this.resizeLayer.run(input);
    //    this.context.drawImage(input, 0, 0, this.width, this.height);
    }


    captureStream(){
        return this.canvas.captureStream();
    }

}

export default Pipeline;