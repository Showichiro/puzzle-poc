import assert from "node:assert/strict";
import { test } from "node:test";
import { GameSession } from "../src/game/GameSession.ts";
import { findMatches } from "../src/utils/gameLogic.ts";
import {
  calculateStageGoals,
  swapCells,
  turnOutcome,
} from "../src/utils/gameRules.ts";
import {
  loadGameRecords,
  recordGameOver,
  recordHighestStage,
} from "../src/utils/gameRecords.ts";

const fixture = [
  [0, 1, 0, 2, 1, 2],
  [1, 0, 2, 1, 2, 0],
  [2, 0, 1, 0, 1, 2],
  [0, 1, 2, 1, 2, 0],
  [1, 2, 0, 2, 0, 1],
  [2, 0, 1, 0, 1, 2],
];
function seeded(seed = 42) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
function setup(t, difficulty = "medium", options = {}) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const session = new GameSession(difficulty, {
    random: seeded(),
    createBoard: () => fixture.map((r) => [...r]),
    ...options,
  });
  t.after(() => session.cancel());
  return session;
}
async function settle(t, task) {
  let done = false;
  const completed = task.finally(() => {
    done = true;
  });
  for (let i = 0; i < 1000 && !done; i++) {
    t.mock.timers.tick(1000);
    await Promise.resolve();
    await Promise.resolve();
  }
  assert.ok(done, "operation must finish");
  await completed;
}
async function validMove(t, session) {
  const { board } = session.getSnapshot();
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      for (const b of [
        { row, col: col + 1 },
        { row: row + 1, col },
      ]) {
        if (b.row >= 6 || b.col >= 6) continue;
        const a = { row, col };
        if (!findMatches(swapCells(board, a, b)).length) continue;
        await session.selectCell(row, col);
        await settle(t, session.selectCell(b.row, b.col, 300));
        return;
      }
    }
  }
  assert.fail("fixture must have a valid move");
}

test("last move: clear takes precedence over game over", () => {
  assert.equal(turnOutcome(150000, 150000, 5, 5), "stageClear");
  assert.equal(turnOutcome(149999, 150000, 5, 5), "gameOver");
  assert.equal(turnOutcome(149999, 150000, 4, 5), "playing");
});

test("stage rules accept deterministic randomness", () => {
  assert.deepEqual(
    calculateStageGoals(1, "easy", () => 0),
    { addedMoves: 1, targetScore: 150000 },
  );
  assert.deepEqual(
    calculateStageGoals(2, "medium", () => 0),
    { addedMoves: 2, targetScore: 250000 },
  );
});

test("invalid swap preserves moves and card turns, and blocks input until rollback", async (t) => {
  const session = setup(t);
  session.drawCard();
  const before = session.getSnapshot();
  await session.selectCell(0, 4);
  const rollback = session.selectCell(0, 5);
  assert.equal(session.getSnapshot().isProcessing, true);
  const pending = session.getSnapshot();
  await session.selectCell(2, 2);
  session.drawCard();
  assert.equal(session.getSnapshot(), pending);
  await settle(t, rollback);
  assert.deepEqual(session.getSnapshot().board, before.board);
  assert.equal(session.getSnapshot().moves, before.moves);
  assert.equal(session.getSnapshot().cardTurnsLeft, before.cardTurnsLeft);
  assert.equal(session.getSnapshot().isProcessing, false);
});

test("reset cancels pending invalid swap without overwriting the new board", async (t) => {
  const session = setup(t);
  await session.selectCell(0, 4);
  const rollback = session.selectCell(0, 5);
  session.resetBoard();
  const fresh = session.getSnapshot();
  await settle(t, rollback);
  assert.equal(session.getSnapshot(), fresh);
});

test("reset cancels chain and floating score timers", async (t) => {
  const session = setup(t);
  await session.selectCell(0, 1);
  const chain = session.selectCell(1, 1);
  assert.ok(session.getSnapshot().floatingScores.length > 0);
  session.resetBoard();
  const fresh = session.getSnapshot();
  await settle(t, chain);
  t.mock.timers.tick(10000);
  await Promise.resolve();
  assert.equal(session.getSnapshot(), fresh);
  assert.equal(fresh.moves, 0);
  assert.equal(fresh.score, 0);
});

test("unmount cancellation prevents later notifications", async (t) => {
  const session = setup(t);
  await session.selectCell(0, 1);
  const chain = session.selectCell(1, 1);
  let updates = 0;
  const unsubscribe = session.subscribe(() => updates++);
  session.cancel();
  await settle(t, chain);
  t.mock.timers.tick(10000);
  await Promise.resolve();
  assert.equal(updates, 0);
  unsubscribe();
});

test("card expires after exactly three valid swaps", async (t) => {
  const session = setup(t, "medium", { random: seeded() });
  session.drawCard();
  for (let turns = 2; turns >= 0; turns--) {
    await validMove(t, session);
    assert.equal(session.getSnapshot().cardTurnsLeft, turns);
  }
  assert.equal(session.getSnapshot().cardMultiplier, 1);
  assert.equal(session.getSnapshot().scoreMultiplier, 1);
  assert.equal(session.getSnapshot().moves, 6);
});

test("drawing the last available card ends game once; later actions are ignored", (t) => {
  let ended = 0;
  const session = setup(t, "medium", { onGameOver: () => ended++ });
  for (let i = 0; i < 10; i++) session.drawCard();
  assert.equal(session.getSnapshot().gameState, "gameOver");
  assert.equal(ended, 1);
  session.drawCard();
  assert.equal(ended, 1);
  assert.equal(session.getSnapshot().moves, 30);
});

test("last-turn clear emits only clear and advances using the advertised goal", async (t) => {
  const random = seeded(3);
  let cardDraw = false;
  const cleared = [];
  const ended = [];
  const session = setup(t, "easy", {
    random: () => (cardDraw ? 0.999 : random()),
    onStageCleared: (stage) => cleared.push(stage),
    onGameOver: (stage) => ended.push(stage),
  });
  await validMove(t, session);
  assert.equal(session.getSnapshot().gameState, "playing");
  cardDraw = true;
  session.drawCard();
  cardDraw = false;
  await validMove(t, session);
  const clear = session.getSnapshot();
  assert.equal(clear.moves, 5);
  assert.equal(clear.gameState, "stageClear", `score=${clear.score}`);
  assert.deepEqual(cleared, [1]);
  assert.deepEqual(ended, []);
  session.handleDifficultySelected("hard");
  assert.equal(
    session.getSnapshot(),
    clear,
    "cannot bypass difficulty selection",
  );
  session.handleProceedToNextStage();
  session.handleDifficultySelected("hard");
  const next = session.getSnapshot();
  assert.equal(next.stage, 2);
  assert.equal(next.currentTargetScore, clear.nextStageGoals.hard.targetScore);
  assert.equal(
    next.currentMaxMoves,
    clear.nextStageGoals.hard.addedMoves + clear.bonusMoves,
  );
  assert.equal(next.selectedCell, null);
  assert.deepEqual(next.floatingScores, []);
  session.resetBoard();
  assert.equal(session.getSnapshot().currentDifficulty, "easy");
  assert.equal(session.getSnapshot().currentMaxMoves, 5);
});

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

test("legacy records preserve keys, keep ten valid stages, and never lower the highest", () => {
  const storage = memoryStorage({
    stageHistory: JSON.stringify([0, 1, "2", null, -1, 2.5, 3]),
    highestStageCleared: "8",
  });
  assert.deepEqual(loadGameRecords(storage), {
    history: [0, 1, 3],
    highestStage: 8,
  });
  for (let i = 1; i <= 12; i++) recordGameOver(storage, i);
  assert.deepEqual(
    loadGameRecords(storage).history,
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  );
  assert.equal(recordHighestStage(storage, 3), 11);
});

test("invalid or inaccessible saved records fall back safely", () => {
  assert.deepEqual(
    loadGameRecords(
      memoryStorage({ stageHistory: "{", highestStageCleared: "null" }),
    ),
    { history: [], highestStage: 0 },
  );
  assert.deepEqual(
    loadGameRecords({
      getItem() {
        throw new Error("denied");
      },
      setItem() {},
    }),
    { history: [], highestStage: 0 },
  );
});

test("invalid rollback does not restore floating scores that expired while waiting", async (t) => {
  const session = setup(t);
  await session.selectCell(0, 1);
  let done = false;
  const chain = session.selectCell(1, 1).then(() => {
    done = true;
  });
  for (let i = 0; i < 100 && !done; i++) {
    t.mock.timers.tick(300);
    await Promise.resolve();
    await Promise.resolve();
  }
  assert.ok(done);
  await chain;
  assert.ok(session.getSnapshot().floatingScores.length > 0);
  const { board } = session.getSnapshot();
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 5; col++) {
      if (
        findMatches(swapCells(board, { row, col }, { row, col: col + 1 }))
          .length
      )
        continue;
      await session.selectCell(row, col);
      await settle(t, session.selectCell(row, col + 1));
      assert.deepEqual(session.getSnapshot().floatingScores, []);
      return;
    }
  }
  assert.fail("fixture must have an invalid swap");
});
