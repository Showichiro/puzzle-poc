import { lazy, Suspense, useState } from "react"; // useState をインポート
import GameBoard from "./components/GameBoard";
import { AnimationSpeedProvider } from "./contexts/AnimationSpeedContext";
import Header from "./components/Header";
const StageHistoryModal = lazy(() => import('./components/StageHistoryModal'));

function App() {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // モーダルの表示状態

  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  // App.tsx では難易度選択の状態を持たず、常に GameBoard をレンダリングする
  // GameBoard 内部で難易度選択モーダルの表示を制御する
  return (
    <AnimationSpeedProvider>
      <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
        {/* Header にモーダルを開く関数を渡す */}
        <Header onOpenHistoryModal={handleOpenHistoryModal} />
        {/* GameBoard に初期難易度を渡す (例: "medium") */}
        <GameBoard initialDifficulty="medium" />
        {/* StageHistoryChart の直接表示を削除 */}
        <a
          href="https://www.buymeacoffee.com/maro01231"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-blue-600 hover:underline"
        >
          Buy me a coffee!
        </a>
      </main>
      {/* モーダルコンポーネントに state と関数を渡す */}
      <Suspense fallback={<div>Loading...</div>}>
        <StageHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={handleCloseHistoryModal}
        />
      </Suspense>
    </AnimationSpeedProvider>
  );
}

export default App;
