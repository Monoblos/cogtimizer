function yield() {
  return new Promise(r=>setTimeout(r,1));
}

class Solver {
  constructor() {
    
  }
  
  static _yield() {
    return new Promise(r=>setTimeout(r,1));
  }
  
  /**
   * solveTime: Number - Time in ms how long the solver should run
   */
  async solve(solveTime) {
    let lastYield = Date.now();
    let state = f.cloneState(g.cogs, g.board);
    state.score = f.getScore(state.board);
    state.scoreSum = f.getScoreSum(state.score);
    const solutions = [state];
    const allKeys = Object.keys(g.cogs);
    const startTime = Date.now();
    let counter = 0;

    console.log("Trying to optimize");
    while(Date.now() - startTime < solveTime) {
      if(Date.now() - lastYield > 5000) {
        // Prevent UI from freezing with very high solve times
        await this._yield();
        lastYield = Date.now();
      }
      counter++;
      if (counter % 10000 === 0) {
        f.verifyBoardIntegrity(state.board);
        state = f.cloneState(g.cogs, g.board);
        state.score = f.getScore(state.board);
        state.scoreSum = f.getScoreSum(state.score);
        this.shuffle(state);
        solutions.push(state);
      }
      const cog1Key = allKeys[Math.floor(Math.random() * allKeys.length)];
      const cog1 = state.cogs[cog1Key]
      const pos1 = cog1.position();
      const cog2Key = allKeys[Math.floor(Math.random() * allKeys.length)];
      const cog2 = state.cogs[cog2Key];
      const pos2 = cog2.position();
      if (pos1.location !== "board" && pos2.location !== "board") continue;
      if (cog1.fixed || cog2.fixed || pos1.location === "build" || pos2.location === "build") continue;
      if (pos1.location === "board") {
        state.board[pos1.y][pos1.x] = cog2;
      }
      if (pos2.location === "board") {
        state.board[pos2.y][pos2.x] = cog1;
      }
      const scoreUpdate = f.getScore(state.board);
      const scoreSumUpdate = f.getScoreSum(scoreUpdate);
      if (scoreSumUpdate > state.scoreSum) {
        state.score = scoreUpdate;
        state.scoreSum = scoreSumUpdate;
        
        cog1.key = cog2Key;
        state.cogs[cog2Key] = cog1;
        cog2.key = cog1Key;
        state.cogs[cog1Key] = cog2;
      } else {
        if (pos1.location === "board") {
          state.board[pos1.y][pos1.x] = cog1;
        }
        if (pos2.location === "board") {
          state.board[pos2.y][pos2.x] = cog2;
        }
      }
    }
    console.log(`Tried ${counter} switches`);
    console.log(`Made ${solutions.length} different attempts with final scores: ${solutions.map(s=>s.scoreSum)}`);
    let best = solutions.reduce((a, b) => a.scoreSum >= b.scoreSum ? a : b);
    const bestIndex = solutions.indexOf(best);
    if (g.best === null || g.best.scoreSum < best.scoreSum) {
      console.log("Best solution was number", bestIndex);
      g.best = best;
    } else {
      best = g.best;
    }
    if (best.scoreSum !== f.getScoreSum(f.getScore(best.board))) {
      debugger;
      throw new Error("Invalid solution");
    }
    this.removeUselesMoves(best);
    f.verifyBoardIntegrity(best.board);
    if (best.scoreSum !== f.getScoreSum(f.getScore(best.board))) {
      debugger;
      throw new Error("Invalid solution");
    }
    return best;
  }
  
  shuffle(state, n = 500) {
    const allKeys = Object.keys(state.cogs);
    for (let i = 0; i < n; i++) {
      const cog1Key = allKeys[Math.floor(Math.random() * allKeys.length)];
      const cog1 = state.cogs[cog1Key]
      const pos1 = cog1.position();
      const cog2Key = allKeys[Math.floor(Math.random() * allKeys.length)];
      const cog2 = state.cogs[cog2Key];
      const pos2 = cog2.position();
      if (cog1.fixed || cog2.fixed || pos1.location === "build" || pos2.location === "build") continue;
      if (pos1.location === "board") {
        state.board[pos1.y][pos1.x] = cog2;
      }
      if (pos2.location === "board") {
        state.board[pos2.y][pos2.x] = cog1;
      }
      cog1.key = cog2Key;
      state.cogs[cog2Key] = cog1;
      cog2.key = cog1Key;
      state.cogs[cog1Key] = cog2;
    }
  }
  
  removeUselesMoves(state) {
    const goal = f.getScore(state.board);
    const cogsToMove = Object.values(state.cogs)
      .filter((c) => c.key !== c.initialKey);
    // Check if move still changes something
    for (let i = 0; i < cogsToMove.length; i++) {
      const cog1 = cogsToMove[i];
      const cog1Key = cog1.key;
      const pos1 = cog1.position();
      const cog2Key = cog1.initialKey;
      const cog2 = state.cogs[cog2Key];
      const pos2 = cog2.position();
      if (pos1.location === "board") {
        state.board[pos1.y][pos1.x] = cog2;
      }
      if (pos2.location === "board") {
        state.board[pos2.y][pos2.x] = cog1;
      }
      const changed = f.getScore(state.board);
      if (changed.buildRate === goal.buildRate
        && changed.flaggy === goal.flaggy
        && changed.expBonus === goal.expBonus) {
        console.log(`Removing useless move ${cog1Key} to ${cog2Key}`);
        cog1.key = cog2Key;
        state.cogs[cog2Key] = cog1;
        cog2.key = cog1Key;
        state.cogs[cog1Key] = cog2;
        continue;
      }
      if (pos1.location === "board") {
        state.board[pos1.y][pos1.x] = cog1;
      }
      if (pos2.location === "board") {
        state.board[pos2.y][pos2.x] = cog2;
      }
    }
  }
}