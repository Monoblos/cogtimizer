class PlayerRenderer {
    _hats;
    _head;
    _canvas;
    _ctx;

    width = 36;
    height = 36;

    scale = 1.5;

    constructor() {
        const hats = document.createElement("img");
        hats.src = "assets/hats2.png";
        hats.style.visibility = "hidden";
        document.body.appendChild(hats);

        this._hats = hats;

        const head = document.createElement("img");
        head.src = "icons/head.png";
        head.style.visibility = "hidden";
        document.body.appendChild(head);
        this._head = head;

        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.visibility = "hidden";
        document.body.appendChild(canvas);
        this._canvas = canvas;
        const ctx = canvas.getContext("2d");
        this._ctx = ctx;
    }

    render(index) {
        const defaultYOffset = 5;

        const ctx = this._ctx;

        let headW = parseInt(this._head.width);
        let headH = parseInt(this._head.height);

        let hw = this.width * .5;
        let hh = this.height * .5;

        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(
            this._head,
            hw - headW * this.scale * .5,
            defaultYOffset + hh - headH * this.scale * .5,
            headW * this.scale,
            headH * this.scale
        );

        const sw = 30,
              sh = 50;
        const cols = 10,
              rows = 9;

        // The hat with index 1 is hat 7 in the image
        // let index = cog.icon.index + 6;
        index += 6;
        const row = Math.floor(index / 10);
        const col = index % 10;

        const swScaled = sw * this.scale;
        const shScaled = sh * this.scale;

        ctx.drawImage(
            this._hats,
            col * sw,
            row * sh,
            sw,
            sh,
            hw - swScaled * .5 - 2 * this.scale,
            defaultYOffset + hh - shScaled * .5 + 1 * this.scale,
            swScaled,
            shScaled
        );

        return this._canvas.toDataURL();
    }
}

function renderHat(index) {

}