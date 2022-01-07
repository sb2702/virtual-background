


class Pipeline {

    constructor(params) {
        this.params = params;

        this.width =  params.width || 640;
        this.height = params.height || 360;

        this.initializeCanvas();
    }


    initializeCanvas(){


        const canvas = document.createElement('canvas');
        this.canvas  = canvas;

        canvas.width =this.width;
        canvas.height = this.height;

        canvas.style.display = "none";

        document.body.appendChild(canvas);

        this.context = canvas.getContext('2d');

    }


    run(input){
        this.context.drawImage(input, 0, 0, this.width, this.height);
    }


    captureStream(){
        return this.canvas.captureStream();
    }

}

export default Pipeline;