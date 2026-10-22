import { lazy, Suspense, useState } from "react";
import GameBoard from "./components/GameBoard";
import Header from "./components/Header";
import { BuyMeACoffeeLink } from "./components/BuyMeACoffeeLink";
import { AnimationSpeedProvider } from "./contexts/AnimationSpeedContext";
import { HighestScoreProvider } from "./contexts/HighestScoreContext";

const StageHistoryModal = lazy(() => import("./components/StageHistoryModal"));

function App() {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  return (
    <AnimationSpeedProvider>
      <HighestScoreProvider>
        <div className="app">
          <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
            <Header onOpenHistoryModal={() => setIsHistoryModalOpen(true)} />
            <GameBoard initialDifficulty="medium" />
            <BuyMeACoffeeLink />
          </main>
          {isHistoryModalOpen && (
            <Suspense fallback={<div>Loading...</div>}>
              <StageHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
              />
            </Suspense>
          )}
        </div>
      </HighestScoreProvider>
    </AnimationSpeedProvider>
  );
}
export default App;
