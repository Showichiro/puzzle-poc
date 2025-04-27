import React from "react";
import { useAnimationSpeed } from "../contexts/AnimationSpeedContext";

const Header: React.FC = () => {
  const { speed, setSpeed } = useAnimationSpeed();

  const handleSpeedChange = () => {
    setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : speed === 3 ? 0.5 : 1);
  };

  return (
    <header className="w-full flex justify-between items-center mb-4 p-4 bg-gray-100 rounded">
      <h1 className="text-2xl font-bold">パズルゲーム</h1>
      <button
        onClick={handleSpeedChange}
        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        速度: x{speed === 0.5 ? "0.5" : speed}
      </button>
    </header>
  );
};

export default Header;
