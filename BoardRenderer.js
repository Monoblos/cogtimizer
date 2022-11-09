
class BoardRenderer {
  _rows;
  _columns;
  _type;

  moveFrom = undefined;
  moveTo = undefined;

  constructor(rows, columns, type) {
    this._rows = rows;
    this._columns = columns;
    this._type = type;

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

    for (let row = 0; row < this._rows; row++) {
      const rowElem = document.createElement("tr");
      for (let col = 0; col < this._columns; col++) {
        const index = row * this._columns + col;

        const colElem = document.createElement("td");
        this.board[index].elem = colElem;
        rowElem.appendChild(colElem);

      }
      tableElem.appendChild(rowElem);
    }

    return tableElem;
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
    const cog = slot.item;
    const col = slot.elem;

    let border = "black";
    let cssClass = "";

    if (cog.fixed) {
      // border = "yellow";
    }

    // TODO: Move to css
    col.style.border = `1px solid ${border}`;
    col.style.borderBottom = `2px solid ${border}`;
    col.style.backgroundImage = `url("${(!cog.blocked && cogBg) || cogBlank}")`;
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
        div.style.height = "100%";
        div.style.backgroundPosition = "center";
        div.style.color = "white";
        col.appendChild(div);
      }

      if (cog.icon === "Blank") {
        div.style.backgroundImage = `url("${cogBlank}")`;
      } else if (cog.icon.startsWith("Player_")) {
        div.innerHTML = `<div style="word-break: break-all;font-size: 8px;line-height: 1.4;padding: 2px;">${cog.icon.substr(7)}` + "</div>";
      } else {
        div.style.backgroundImage = `url("icons/${cog.icon}.png")`;
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
