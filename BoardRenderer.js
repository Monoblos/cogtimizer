
class BoardRenderer {
  _rows;
  _columns;
  _visibleRows;
  _type;

  _pageIndex = 0;
  _pageCount = 0;

  board;

  moveFrom = undefined;
  moveTo = undefined;

  constructor(rows, columns, type, visibleRows = rows) {
    this._rows = rows;
    this._columns = columns;
    this._visibleRows = visibleRows;
    this._type = type;

    this._pageCount = rows / visibleRows;

    this.board = new Array(columns * rows);
    for (let i = 0; i < this.board.length; i++) {
      this.board[i] = {
        item: undefined,
        elem: undefined,
        row: Math.floor(i / columns),
        column: i % columns
      };
    };
  }

  createHTMLElement() {
    const tableElem = document.createElement("table");
    tableElem.className = "cogboard";

    for (let row = 0; row < this._visibleRows; row++) {
      const rowElem = document.createElement("tr");
      for (let col = 0; col < this._columns; col++) {
        const index = row * this._columns + col;

        const colElem = document.createElement("td");
        this.board[index].elem = colElem;
        for (let i = 1; i < this._pageCount; i++) {
          this.board[index + (i * this._visibleRows * this._columns)].elem = colElem;
        }
        rowElem.appendChild(colElem);
      }
      tableElem.appendChild(rowElem);
    }

    return tableElem;
  }

  showPage(pageIndex) {
    pageIndex = Math.max(0, Math.min(pageIndex, (this._pageCount - 1)));
    this._pageIndex = pageIndex;

    const pageSize = this._visibleRows * this._columns;
    const index = pageIndex * pageSize;

    for (let i = index; i < index + pageSize; i++) {
      this._render(this.board[i]);
    }
  }

  getPage(coord) {
    if (coord.location === this._type) {
      return Math.floor(coord.y / this._visibleRows);
    }
    return -1;
  }

  _getIndex(row, column) {
    if (row > this._rows) {
      throw new Error("Tried to access row outside the board");
    }
    if (column > this._columns) {
      throw new Error("Tried to access column outside the board");
    }

    return (row * this._columns) + column;
  }

  _render(slot) {
    let cog = slot.item;
    const col = slot.elem;

    const isVisible = (slot.row >= this._pageIndex * this._visibleRows && 
      slot.row < this._pageIndex * this._visibleRows + this._visibleRows);

    // console.log(slot.row, slot.column, isVisible);
    if (!isVisible) {
      return;
    }

    if (!cog) {
      cog = {
        fixed: false,
        blocked: false,
        icon: "Blank"
      };
    }

    let border = "black";
    let cssClass = "";

    if (cog.fixed) {
      // border = "yellow";
    }

    // TODO: Move to css
    col.style.border = `1px solid ${border}`;
    col.style.borderBottom = `2px solid ${border}`;
    col.style.backgroundImage = `url("assets/${(!cog.blocked && "cog_bg.png") || "cog_blank.png"}")`;
    col.style.backgroundPosition = "center";
    col.style.backgroundSize = "cover";
    if (col.classList.contains("toMove")) {
      col.classList.remove("toMove");
    }

    if (!cog.blocked) {
      let div;
      if (col.firstChild) {
        div = col.firstChild;
      } else {
        div = createElem("div");
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.backgroundPosition = "center";
        div.style.color = "white";
        col.appendChild(div);
      }

      if (cog.icon.type === "blank") {
        div.style.backgroundImage = "";
        div.innerHTML = "";
      } else if (cog.isPlayer) {
        div.style.backgroundImage = `url("${cog.icon.path}")`;
        div.style["background-size"] = `contain`;
        div.innerHTML = "";
      }	else {
        div.style.removeProperty("background-size");
        div.style.backgroundImage = `url("${cog.icon.path}")`;
        div.innerHTML = "";
      }
    } else {
      if (cog.isFlag) {
        col.style.backgroundImage = `url("icons/cogs/flag.png")`;
      }
    }
  }

  set(row, column, item) {
    const index = this._getIndex(row, column);
    const slot = this.board[index];
    slot.item = item;

    this._render(slot);
  }

  move(cordFrom, cordTo) {
    if (this.moveTo)
      this._render(this.moveTo);

    if (this.moveFrom)
      this._render(this.moveFrom);

    if (cordFrom.location == this._type) {
      const from = this.get(cordFrom.y, cordFrom.x);
      const fromCol = from.elem;

      this.moveFrom = from;

      fromCol.style.border = `1px solid lightgreen`;
      fromCol.style.borderBottom = `2px solid lightgreen`;
      fromCol.classList.add("toMove");
    } else {
      this.moveFrom = undefined;
    }

    if (cordTo.location === this._type) {
      const to = this.get(cordTo.y, cordTo.x);
      const toCol = to.elem;

      this.moveTo = to;

      toCol.style.border = `1px solid lightgreen`;
      toCol.style.borderBottom = `2px solid lightgreen`;
      toCol.classList.add("toMove");
    } else {
      this.moveTo = undefined;
    }
  }

  get(row, column) {
    const index = this._getIndex(row, column);
    return this.board[index];
  }
}
