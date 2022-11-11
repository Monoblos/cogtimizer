const ICON_QUALITY_MAP = {
  ["0"]: "Nooby",
  ["1"]: "Decent",
  ["2"]: "Superb",
  ["3"]: "Ultimate",
  ["Y"]: "Yang",
  ["Z"]: "Yin"
};
const ICON_TYPE_MAP = {
  ["A00"]: "Cog",
  ["A0"]: "CogB",
  ["A1"]: "Average",
  ["A2"]: "Spur",
  ["A3"]: "Stacked",
  ["A4"]: "Deckered",
  ["B0"]: "Double",
  ["B1"]: "Trips",
  ["B2"]: "Trabble",
  ["B3"]: "Quad",
  ["B4"]: "Penta",
  ["ad"]: "Adjacent",
  ["di"]: "Diagonal",
  ["up"]: "Up",
  ["do"]: "Down",
  ["le"]: "Left",
  ["ri"]: "Right",
  ["ro"]: "Row",
  ["co"]: "Column",
  ["cr"]: "Corner",
};
const YIN_MAP = {
  ["A00"]: "Yin_Top_Left_Cog",
  ["A01"]: "Yin_Top_Right_Cog",
  ["A02"]: "Yin_Bottom_Left_Cog",
  ["A03"]: "Yin_Bottom_Right_Cog"
};
const INV_ROWS = 8;
const INV_COLUMNS = 12;
const SPARE_START = 108;

class Cog {
  constructor(initialValues = {}) {
    this._key = initialValues.key;
    this.icon = initialValues.icon;
    this.initialKey = initialValues.initialKey || initialValues.key;
    this.buildRate = initialValues.buildRate;
    this.isPlayer = initialValues.isPlayer;
    this.isFlag = initialValues.isFlag;
    this.expGain = initialValues.expGain;
    this.flaggy = initialValues.flaggy;
    this.expBonus = initialValues.expBonus;
    this.buildRadiusBoost = initialValues.buildRadiusBoost;
    this.expRadiusBoost = initialValues.expRadiusBoost;
    this.flaggyRadiusBoost = initialValues.flaggyRadiusBoost;
    this.boostRadius = initialValues.boostRadius;
    this.flagSpeed = initialValues.flagSpeed;
    this.nothing = initialValues.nothing; // Description: +% Nothing! LOL
    this.fixed = initialValues.fixed;
    this.blocked = initialValues.blocked;
    this._position = null;
  }
  get key() {
    return this._key
  }
  set key(v) {
    this._position = null;
    this._key = Number.parseInt(v)
  }
  position(keyNum) {
    const isDefault = keyNum === undefined;
    if (this._position && isDefault) return this._position;
    keyNum = keyNum || Number.parseInt(this.key);
    // board = 0-95
    // build = 96-107
    // spare = 108-*
    const location = keyNum >= 96 ? keyNum <= 107 ? "build" : "spare" : "board";
    let perRow = 3;
    let offset = SPARE_START;
    if (location === "board") {
      perRow = INV_COLUMNS;
      offset = 0;
    } else if (location === "build") {
      offset = 96;
    }
    const y = Math.floor((keyNum - offset) / perRow);
    const x = Math.floor((keyNum - offset) % perRow);
    const res = { location, x, y };
    if (isDefault) {
      this._position = res;
    }
    return res;
  }
}

class FakeBoard {
  constructor(inventory) {
    this.inventory = inventory;
    
    this.length = INV_ROWS;
    this[Symbol.Iterator] = function*() {
      for (let s = 0; s < INV_ROWS; s++) yield s;
    }

    for (let i = 0; i < INV_ROWS; i++) {
      const columnProxy = {
        length: INV_COLUMNS,
        [Symbol.Iterator]: function* () {
          for (let s = 0; s < INV_COLUMNS; s++) yield s;
        }
      }
      for (let j = 0; j < INV_COLUMNS; j++) {
        const key = i * INV_COLUMNS + j;
        Object.defineProperty(columnProxy, j, {
          get: () => this.inventory.cogs[key] || this.inventory.slots[key]
        });
      }
      Object.defineProperty(this, i, {
        get: () => columnProxy
      });
    }
  }
}

class CogInventory {
  constructor(cogs={}, slots={}) {
    this.cogs = cogs;
    this.slots = slots;
    this.flaggyShopUpgrades = 0;
    this._score = null;
    // Saved for performance
    this._board = new FakeBoard(this);
  }
  
  static _saveGet(arr, ...indexes) {
    while(indexes.length) {
      if (arr === undefined) break;
      arr = arr[indexes.splice(0, 1)[0]];
    }
    return arr;
  }
  
  load(save) {
    console.log("Loading");
    // Fetch Gem-Shop flaggy upgrades
    this.flaggyShopUpgrades = JSON.parse(save["GemItemsPurchased"])[118];
    // Fetch the list of available cogs
    const cogRaw = JSON.parse(save["CogM"]);
    const cogIcons = JSON.parse(save["CogO"]).map(c=>{
      if(c === "Blank") { return c; }
      if(c.startsWith("Player")) { return c; }
      if(c === "CogY") { return "Yang_Cog"; }
      const parsed=c.match(/^Cog([0123YZ])(.{2,3})$/);
      if(parsed[1] === "Z") {
        return YIN_MAP[parsed[2]];
      }
      return ICON_TYPE_MAP[parsed[2]] + "_" + ICON_QUALITY_MAP[parsed[1]];
    });
    const cogArray = Object.entries(cogRaw).map(([key, c]) => {
      const keyNum = Number.parseInt(key);
      return new Cog({
        key: keyNum,
        icon: cogIcons[keyNum] || "Blank",
        buildRate: c.a,
        isPlayer: c.b > 0,
        expGain: c.b,
        flaggy: c.c,
        expBonus: c.d,
        buildRadiusBoost: c.e,
        expRadiusBoost: c.f,
        flaggyRadiusBoost: c.g,
        boostRadius: c.h,
        flagSpeed: c.j,
        nothing: c.k,
        fixed: c.h === "everything" || c.j > 0,
        blocked: false
      });
    });
    // Get the available board
    const flagPose = JSON.parse(save["FlagP"]).slice(0, 4); // Only first 4 are used
    const slots = JSON.parse(save["FlagU"]).map((n, i) => {
      if (n > 0 && flagPose.includes(i)) return new Cog({ key: i, fixed: true, blocked: true, isFlag: true });
      if (n !== -11) return new Cog({ key: i, fixed: true, blocked: true });
      return new Cog({ key: i });
    });
    // Map slots and cogs to a key -> obj map
    this.slots = {};
    for (const slot of slots) {
      this.slots[slot.key] = slot;
    }
    this.cogs = {};
    for (const cog of cogArray) {
      this.cogs[cog.key] = cog;
    }
  }
  
  setWeights(buildRate, expBonus, flaggy) {
    this.weights = {
      buildRate: buildRate,
      expBonus: expBonus,
      flaggy: flaggy
    }
  }
  
  clone() {
    const c = {};
    for (let [k,v] of Object.entries(this.cogs)) {
      c[k] = new Cog(v);
    }
    const s = {};
    for (let [k,v] of Object.entries(this.slots)) {
      s[k] = new Cog(v);
    }
    const res = new CogInventory(c, s);
    res.flaggyShopUpgrades = this.flaggyShopUpgrades;
    res.setWeights(this.weights.buildRate, this.weights.expBonus, this.weights.flaggy);
    return res;
  }
  
  get board() {
    return this._board;
  }
  
  get score() {
    if (this._score !== null) return this._score;

    const result = {
      buildRate: 0,
      expBonus: 0,
      flaggy: 0
    };

    const board = this.board;
    const bonusGrid = Array(INV_ROWS).fill(0).map(() => { return Array(INV_COLUMNS).fill(0).map(() => { return { ...result } })});
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const entry = board[i][j];
        if (!entry) continue;
        const boosted = [];
        switch (entry.boostRadius) {
          case "diagonal":
            boosted.push([i-1, j-1],[i-1, j+1],[i+1, j-1],[i+1, j+1]);
            break;
          case "adjacent":
            boosted.push([i-1, j],[i, j+1],[i+1, j],[i, j-1]);
            break;
          case "up":
            boosted.push([i-2, j-1],[i-2, j],[i-2, j+1],[i-1, j-1],[i-1, j],[i-1, j+1]);
            break;
          case "right":
            boosted.push([i-1, j+2],[i, j+2],[i+1, j+2],[i-1, j+1],[i, j+1],[i+1, j+1]);
            break;
          case "down":
            boosted.push([i+2, j-1],[i+2, j],[i+2, j+1],[i+1, j-1],[i+1, j],[i+1, j+1]);
            break;
          case "left":
            boosted.push([i-1, j-2],[i, j-2],[i+1, j-2],[i-1, j-1],[i, j-1],[i+1, j-1]);
            break;
          case "row":
            for (let k = 0; k < INV_COLUMNS; k++) {
              if(j == k) continue;
              boosted.push([i, k]);
            }
            break;
          case "column":
            for (let k = 0; k < INV_ROWS; k++) {
              if(i == k) continue;
              boosted.push([k, j]);
            }
            break;
          case "corner":
            boosted.push([i-2, j-2],[i-2, j+2],[i+2, j-2],[i+2, j+2]);
            break;
          case "around":
            boosted.push([i-2, j],[i-1, j-1],[i-1, j],[i-1, j+1],[i, j-2],[i, j-1],[i, j+1],[i, j+2],[i+1, j-1],[i+1, j],[i+1, j+1],[i+2, j]);
            break;
          case "excogia":
            for (let k = 0; k < INV_ROWS; k++) {
              for (let l = 0; l < INV_COLUMNS; l++) {
                if(i === k && j === l) continue;
                boosted.push([k, l]);
              }
            }
            break;
          default:
            break;
        }
        for (const boostCord of boosted) {
          const bonus = CogInventory._saveGet(bonusGrid, boostCord);
          if (!bonus) continue;
          bonus.buildRate += entry.buildRadiusBoost  || 0;
          bonus.expBonus  += entry.expRadiusBoost    || 0;
          bonus.flaggy    += entry.flaggyRadiusBoost || 0;
        }
      }
    }
    // Bonus grid done, now we can sum everything up
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const entry = board[i][j];
        if (!entry) continue;
        result.buildRate += entry.buildRate || 0;
        result.expBonus += entry.expBonus || 0;
        result.flaggy += entry.flaggy || 0;
        const bonus = bonusGrid[i][j];
        if (!bonus) continue;
        const b = (bonus.buildRate || 0) / 100;
        result.buildRate += Math.ceil((entry.buildRate || 0) * b);
        // TODO: Apply exp bonus for players
        const e = 1; // (bonus.expBonus || 0) / 100;
        result.expBonus += Math.ceil((entry.expBonus || 0) * e);
        const f = (bonus.flaggy || 0) / 100;
        result.flaggy += Math.ceil((entry.flaggy || 0) * f);
      }
    }
    result.flaggy = Math.floor(result.flaggy * (1 + this.flaggyShopUpgrades * 0.5));
    return this._score = result;
  }
  
  get scoreSum() {
    let res = 0;
    res += this.score.buildRate * this.weights.buildRate;
    res += this.score.expBonus * this.weights.expBonus;
    res += this.score.flaggy * this.weights.flaggy;
    return res;
  }
  
  move(pos1, pos2) {
    this._score = null;
    if (Array.isArray(pos1)) {
      pos1 = pos1[0] * INV_COLUMNS + pos1[1];
      pos2 = pos2[0] * INV_COLUMNS + pos2[1];
    }
    const temp = this.cogs[pos2];
    this.cogs[pos2] = this.cogs[pos1];
    this.cogs[pos1] = temp;
    this.cogs[pos1].key = pos1;
    this.cogs[pos2].key = pos2;
  }
}