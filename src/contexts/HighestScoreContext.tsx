import { createContext, FC, ReactNode, useContext, useState } from "react";

interface HighestScoreContextType {
  highestStage: number;
  setHighestStage: (stage: number) => void;
}

const HighestScoreContext = createContext<HighestScoreContextType | undefined>(
  undefined,
);

export const HighestScoreProvider: FC<{ children: ReactNode }> = (
  { children },
) => {
  const [highestStage, setHighestStage] = useState(() => {
    const storedHighestStage = localStorage.getItem("highestStageCleared");
    return storedHighestStage ? parseInt(storedHighestStage, 10) : 0;
  });

  const setHighest = (stage: number) => {
    setHighestStage(stage);
    localStorage.setItem(
      "highestStageCleared",
      stage.toString(),
    );
  };

  return (
    <HighestScoreContext.Provider
      value={{ highestStage, setHighestStage: setHighest }}
    >
      {children}
    </HighestScoreContext.Provider>
  );
};

export const useHighestScore = () => {
  const context = useContext(HighestScoreContext);
  if (context === undefined) {
    throw new Error(
      "useHighestSpeed must be used within an HighestScoreProvider",
    );
  }
  return context;
};
