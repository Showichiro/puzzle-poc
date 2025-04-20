import GameBoard from "./components/GameBoard";

function App() {
  return (
    <main className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">パズルゲーム</h1>
      <GameBoard />
    </main>
  );
}

export default App;
