function yield() {
  return new Promise(r=>setTimeout(r,1));
}

class Solver {
  constructor(weights={}) {
    this.setWeights(weights.buildRate, weights.expBonus, weights.flaggy)
  }
  
  setWeights(buildRate, expBonus, flaggy) {
    this.weights = {
      buildRate: buildRate,
      expBonus: expBonus,
      flaggy: flaggy
    }
  }
  
  getScoreSum(score) {
    let res = 0;
    res += score.buildRate * this.weights.buildRate;
    res += score.expBonus * this.weights.expBonus;
    res += score.flaggy * this.weights.flaggy;
    return res;
  }
  
  static _yield() {
    return new Promise(r=>setTimeout(r,1));
  }
  
  /**
   * solveTime: Number - Time in ms how long the solver should run
   */
  async solve(inventory, solveTime=1000) {
    let lastYield = Date.now();
    let state = inventory.clone();
    const solutions = [state];
    const startTime = Date.now();
    const allSlots = inventory.availableSlotKeys;
    let counter = 0;
    let currentScore = this.getScoreSum(state.score);

    console.log("Trying to optimize");
    while(Date.now() - startTime < solveTime) {
      if(Date.now() - lastYield > 5000) {
        // Prevent UI from freezing with very high solve times
        await this._yield();
        lastYield = Date.now();
      }
      counter++;
      if (counter % 10000 === 0) {
        state = inventory.clone();
        this.shuffle(state);
        currentScore = this.getScoreSum(state.score);
        solutions.push(state);
      }
      const slotKey = allSlots[Math.floor(Math.random() * allSlots.length)];
      // Moving a cog to an empty space changes the list of cog keys, so we need to re-fetch this
      const allKeys = state.cogKeys;
      const cogKey = allKeys[Math.floor(Math.random() * allKeys.length)];
      const slot = state.get(slotKey);
      const cog = state.get(cogKey);

      if (slot.fixed || cog.fixed || cog.position().location === "build") continue;
      state.move(slotKey, cogKey);
      const scoreSumUpdate = this.getScoreSum(state.score);
      if (scoreSumUpdate > currentScore) {
        currentScore = scoreSumUpdate;
      } else {
        state.move(slotKey, cogKey);
      }
    }
    console.log(`Tried ${counter} switches`);
    const scores = solutions.map((s)=>this.getScoreSum(s.score));
    console.log(`Made ${solutions.length} different attempts with final scores: ${scores}`);
    const bestIndex = scores.indexOf(scores.reduce((a,b)=>Math.max(a,b)));
    let best = solutions[bestIndex];
    if (g.best === null || this.getScoreSum(g.best.score) < scores[bestIndex]) {
      console.log("Best solution was number", bestIndex);
      g.best = best;
    } else {
      best = g.best;
    }
    this.removeUselesMoves(best);
    return best;
  }
  
  shuffle(inventory, n = 500) {
    const allSlots = inventory.availableSlotKeys;
    for (let i = 0; i < n; i++) {
      const slotKey = allSlots[Math.floor(Math.random() * allSlots.length)];
      // Moving a cog to an empty space changes the list of cog keys, so we need to re-fetch this
      const allKeys = inventory.cogKeys;
      const cogKey = allKeys[Math.floor(Math.random() * allKeys.length)];
      const slot = inventory.get(slotKey);
      const cog = inventory.get(cogKey);

      if (slot.fixed || cog.fixed || cog.position().location === "build") continue;
      inventory.move(slotKey, cogKey);
    }
  }
  
  removeUselesMoves(inventory) {
    const goal = inventory.score
    const cogsToMove = Object.values(inventory.cogs)
      .filter((c) => c.key !== c.initialKey);
    // Check if move still changes something
    for (let i = 0; i < cogsToMove.length; i++) {
      const cog1 = cogsToMove[i];
      const cog1Key = cog1.key;
      const pos1 = cog1.position();
      const cog2Key = cog1.initialKey;
      const cog2 = inventory.cogs[cog2Key];
      const pos2 = cog2.position();
      inventory.move(cog1Key, cog2Key);
      const changed = inventory.score
      if (changed.buildRate === goal.buildRate
        && changed.flaggy === goal.flaggy
        && changed.expBonus === goal.expBonus) {
        console.log(`Removed useless move ${cog1Key} to ${cog2Key}`);
        continue;
      }
      inventory.move(cog1Key, cog2Key);
    }
  }
}