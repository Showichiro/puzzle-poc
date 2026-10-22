import { useEffect, useState, useSyncExternalStore } from "react";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext";
import { useHighestScore } from "../contexts/HighestScoreContext";
import { GameSession } from "../game/GameSession";
import { recordGameOver } from "../utils/gameRecords";
import type { Difficulty } from "../utils/gameRules";

const useGameBoard = (initialDifficulty: Difficulty) => {
  const { speed } = useAnimationSpeed();
  const { setHighestStage } = useHighestScore();
  const [session] = useState(
    () =>
      new GameSession(initialDifficulty, {
        onGameOver: (stage) => recordGameOver(localStorage, stage),
        onStageCleared: setHighestStage,
      }),
  );
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useEffect(() => () => session.cancel(), [session]);
  return {
    ...state,
    selectCell: (row: number, col: number) =>
      session.selectCell(row, col, speed),
    resetBoard: session.resetBoard,
    drawCard: session.drawCard,
    handleProceedToNextStage: session.handleProceedToNextStage,
    handleDifficultySelected: session.handleDifficultySelected,
  };
};

export default useGameBoard;
