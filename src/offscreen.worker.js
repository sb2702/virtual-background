
import Pipeline from "./pipeline";


class VirtualBackgroundWebWorker {


    constructor(params) {

        params.width = params.width ||  640;
        params.height = params.height ||  360;

        this.pipeline = new Pipeline(params);

    }

    async setup(){
        await this.pipeline.initialized;
    }

    async render(bitmap){

        return await this.pipeline.run(bitmap)

    }



}


self.onmessage =async function (e) {


    console.log("On message");
    switch (e.data.msg){
        case "init":

            console.log("Initialized worker");
            self.vbWorker = new VirtualBackgroundWebWorker(e.data);
            await self.vbWorker.setup();
            postMessage({msg: 'initialized'});
            break;

        case "render":
            console.log("To render");
            const renderedBitmap = await self.vbWorker.render(e.data.bitmap);
            postMessage({msg: 'rendered', bitmap: renderedBitmap}, [renderedBitmap]);
            break;

    }

}

