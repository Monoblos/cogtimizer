class PlayerRenderer {
    _hatsImg;
    _headImg;
    _player = {
        canvas: undefined,
        context: undefined
    };
    _head = {
        canvas: undefined,
        context: undefined
    };

    width = 36;
    height = 36;

    scale = 1.5;

    constructor() {
        const hats = document.createElement("img");
        hats.src = "assets/hats2.png";
        this._hatsImg = hats;

        const head = document.createElement("img");
        head.src = "icons/head.png";
        this._headImg = head;

        const headCanvas = document.createElement("canvas");
        head.addEventListener("load", (ev) => {
            headCanvas.width = head.width;
            headCanvas.height = head.height;
            this.reset(); // initial draw of the head
        });
        this._head.canvas = headCanvas;
        let ctx = headCanvas.getContext("2d");
        this._head.context = ctx;

        const playerCanvas = document.createElement("canvas");
        playerCanvas.width = this.width;
        playerCanvas.height = this.height;
        this._player.canvas = playerCanvas;
        ctx = playerCanvas.getContext("2d");
        this._player.context = ctx;

        // document.body.appendChild(playerCanvas);
    }

    _colorHead(pr, pg, pb) {
        const colorThreshold = .9;
        const ctx = this._head.context;

        ctx.clearRect(0, 0, parseInt(this._head.width), parseInt(this._head.height));
        const headW = parseInt(this._headImg.width);
        const headH = parseInt(this._headImg.height);
        ctx.drawImage(
            this._headImg,
            0,
            0,
            headW,
            headH
        );
        
        if (pr + pg + pb < 3) {
            let imgData = ctx.getImageData(0, 0, headW, headH);
            for (let i = 0; i < imgData.data.length; i += 4) {
                const r = imgData.data[i],
                    g = imgData.data[i+1],
                    b = imgData.data[i+2],
                    a = imgData.data[i+3];
                if (r + g + b + a !== 0 && r + g + b + a < (255 * 4) * colorThreshold) {
                    imgData.data[i]   = r * pr;
                    imgData.data[i+1] = g * pg;
                    imgData.data[i+2] = b * pb;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        }
    }

    reset() {
        this._colorHead(1, 1, 1);
    }

    render(index = NaN) {
        const defaultYOffset = 5;

        let headW = parseInt(this._headImg.width);
        let headH = parseInt(this._headImg.height);

        let hw = this.width * .5;
        let hh = this.height * .5;
        const ctx = this._player.context;

        ctx.clearRect(0, 0, this.width, this.height);
        
        // this._colorHead(Math.random(), Math.random(), Math.random());
        ctx.drawImage(
            this._head.canvas,
            hw - headW * this.scale * .5,
            defaultYOffset + hh - headH * this.scale * .5,
            headW * this.scale,
            headH * this.scale
        );

        const sw = 30,
              sh = 50;
        const cols = 10,
              rows = 9;

        if (!isNaN(index)) {
            let offset = 5;

            if (index >= 21 && index <= 37)   {
                offset = 6;
            } else if (index >= 64) {
                offset = 10;
            }

            const n = index + offset;
            const row = Math.floor(n / 10);
            const col = n % 10;

            const swScaled = sw * this.scale;
            const shScaled = sh * this.scale;

            ctx.drawImage(
                this._hatsImg,
                col * sw,
                row * sh,
                sw,
                sh,
                hw - swScaled * .5 - 2 * this.scale,
                defaultYOffset + hh - shScaled * .5 + 1 * this.scale,
                swScaled,
                shScaled
            );
        }

        return this._player.canvas.toDataURL();
    }
}

function renderHat(index) {

}