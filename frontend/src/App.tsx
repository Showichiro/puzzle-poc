import { lazy, Suspense, useState, useEffect } from "react"; // useEffect をインポート
import GameBoard from "./components/GameBoard";
import { AnimationSpeedProvider } from "./contexts/AnimationSpeedContext";
import { HighestScoreProvider } from "./contexts/HighestScoreContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { UserProfile } from "./components/UserProfile";
import { WelcomeModal } from "./components/WelcomeModal";
import Header from "./components/Header";
import { BuyMeACoffeeLink } from "./components/BuyMeACoffeeLink";
const StageHistoryModal = lazy(() => import("./components/StageHistoryModal"));
const RankingModal = lazy(() => import("./components/RankingModal"));

const AppContent = () => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // モーダルの表示状態
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // プロフィールモーダルの表示状態
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false); // ウェルカムモーダルの表示状態
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false); // ランキングモーダルの表示状態

  const { isAuthenticated, isLoading, setShowLoginScreen } = useAuth();

  // 初回訪問時の判定とウェルカムモーダル表示制御
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const hasVisited = localStorage.getItem("has-visited");
      if (!hasVisited) {
        setIsWelcomeModalOpen(true);
        localStorage.setItem("has-visited", "true");
      }
    }
  }, [isAuthenticated, isLoading]);

  const handleOpenHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
  };

  const handleLoginFromWelcome = () => {
    setIsWelcomeModalOpen(false);
    setShowLoginScreen(true);
  };

  const handleOpenRankingModal = () => {
    setIsRankingModalOpen(true);
  };

  const handleCloseRankingModal = () => {
    setIsRankingModalOpen(false);
  };

  return (
    <div className="app">
      <AuthGuard allowGuest={true}>
        <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
          {/* Header にモーダルを開く関数を渡す */}
          <Header
            onOpenHistoryModal={handleOpenHistoryModal}
            onOpenProfile={handleOpenProfileModal}
            onOpenRanking={handleOpenRankingModal}
          />
          {/* GameBoard に初期難易度を渡す (例: "medium") */}
          <GameBoard initialDifficulty="medium" />
          {/* StageHistoryChart の直接表示を削除 */}
          <BuyMeACoffeeLink />
        </main>
        {/* モーダルコンポーネントに state と関数を渡す */}
        <Suspense fallback={<div>Loading...</div>}>
          <StageHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={handleCloseHistoryModal}
          />
        </Suspense>

        {/* プロフィールモーダル */}
        <UserProfile
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
        />

        {/* ウェルカムモーダル */}
        <WelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={handleCloseWelcomeModal}
          onLogin={handleLoginFromWelcome}
        />

        {/* ランキングモーダル */}
        <Suspense fallback={<div>Loading...</div>}>
          <RankingModal
            isOpen={isRankingModalOpen}
            onClose={handleCloseRankingModal}
          />
        </Suspense>
      </AuthGuard>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AnimationSpeedProvider>
        <HighestScoreProvider>
          <AppContent />
        </HighestScoreProvider>
      </AnimationSpeedProvider>
    </AuthProvider>
  );
}

export default App;
