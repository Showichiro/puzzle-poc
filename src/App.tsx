import GameBoard from "./components/GameBoard";

function App() {
  // App.tsx では難易度選択の状態を持たず、常に GameBoard をレンダリングする
  // GameBoard 内部で難易度選択モーダルの表示を制御する
  return (
    <main className="container mx-auto max-w-lg p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">パズルゲーム</h1>
      {/* GameBoard に初期難易度を渡す (例: "medium") */}
      <GameBoard initialDifficulty="medium" />
    </main>
  );
}

export default App;
