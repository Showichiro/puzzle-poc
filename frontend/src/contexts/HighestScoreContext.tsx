import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { loadGameRecords, recordHighestStage } from "../utils/gameRecords";

interface HighestScoreContextType {
  highestStage: number;
  setHighestStage: (stage: number) => void;
}
const HighestScoreContext = createContext<HighestScoreContextType | undefined>(
  undefined,
);

export const HighestScoreProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [highestStage, setHighestStage] = useState(
    () => loadGameRecords(localStorage).highestStage,
  );
  const setHighest = useCallback((stage: number) => {
    setHighestStage(recordHighestStage(localStorage, stage));
  }, []);
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
  if (context === undefined)
    throw new Error(
      "useHighestScore must be used within a HighestScoreProvider",
    );
  return context;
};
