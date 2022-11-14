class PageEvent extends Event {
    page;
    dir;

    constructor(type, page, dir) {
        super(type);
        this.page = page;
        this.dir = dir;
    }
}

class Paginator extends EventTarget {
    pageCount = 1;
    pageIndex = 0;

    _root;
    _prevElem;
    _pageElem;
    _next;

    _name;

    constructor(id, pageCount, startPage = 1, name = "Page") {
        super();

        this.pageCount = pageCount;
        this.pageIndex = startPage - 1;

        this._name = name;

        this._root = document.getElementById(id);
        if (!this._root.classList.contains("paginator")) {
            this._root.classList.add("paginator");
        }

        this._prevElem = document.createElement("div");
        this._prevElem.addEventListener("click", this.prev.bind(this));
        this._root.appendChild(this._prevElem);
        
        this._pageElem = document.createElement("div");
        this._root.appendChild(this._pageElem);
        
        this._nextElem = document.createElement("div");
        this._nextElem.addEventListener("click", this.next.bind(this));
        this._root.appendChild(this._nextElem);

        this._updatePage();
    }

    _updatePage() {
        this._pageElem.innerText = `${this._name} ${this.pageIndex+1}/${this.pageCount}`;

        this._prevElem.className = this.pageIndex > 0 ? "hasMore" : "";
        this._nextElem.className = (this.pageIndex < this.pageCount - 1) ? "hasMore" : "";
    }

    reset(pageCount, startPage = undefined) {
        this.pageCount = pageCount;
        if (!startPage) {
            startPage = Math.max(0, startPage - 1);
        }

        this.startPage = startPage;
        this.goto(startPage);
    }

    goto(page) {
        page = Math.max(0, Math.min(page, this.pageCount));
        const event = new PageEvent("change", page, "goto");
        if (this.dispatchEvent(event)) {
            this.pageIndex = page;
            this._updatePage();
        }
    }

    prev(ev) {
        if (this.pageIndex > 0) {
            const event = new PageEvent("change", this.pageIndex - 1, "prev");
            if (this.dispatchEvent(event)) {
                this.pageIndex--;
                this._updatePage();
            }
        }
        ev.preventDefault();
        return false;
    }

    next(ev) {
        if (this.pageIndex < this.pageCount - 1) {
            const event = new PageEvent("change", this.pageIndex + 1, "next");
            if (this.dispatchEvent(event)) {
                this.pageIndex++;
                this._updatePage();
            }
        }
        ev.preventDefault();
        return false;
    }
}