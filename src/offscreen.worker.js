
import Pipeline from "./pipeline";


class VirtualBackgroundWebWorker {


    constructor(params) {

        params.width = params.width ||  640;
        params.height = params.height ||  360;

        this.pipeline = new Pipeline(params);

    }

    async setup(){
        await this.pipeline.setup();
    }

    async render(bitmap){

        return await this.pipeline.run(bitmap)

    }

    destroy(){
        this.pipeline.destroy();
    }

    changeBackground(background){
        this.pipeline.changeBackground(background);
    }



}


self.onmessage =async function (e) {

    switch (e.data.msg){
        case "init":
            self.vbWorker = new VirtualBackgroundWebWorker(e.data);
            await self.vbWorker.setup();
            postMessage({msg: 'initialized'});
            break;

        case "render":
            const renderedBitmap = await self.vbWorker.render(e.data.bitmap);
            postMessage({msg: 'rendered', bitmap: renderedBitmap}, [renderedBitmap]);
            break;

        case "change-background":
            self.vbWorker.changeBackground(e.data.background);
            break;

        case "destroy":
            self.vbWorker.destroy();
            postMessage({msg: 'destroyed'});
            break;
    }

}

