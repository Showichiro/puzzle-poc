import React from 'react';
import { motion } from 'framer-motion';

interface GameOverModalProps {
  highScore: number;
  resetBoard: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ highScore, resetBoard }) => {
  return (
    <motion.div
      className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white p-8 rounded shadow-lg text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="text-2xl font-bold mb-4">ゲームオーバー</h2>
        <p>有効な手がなくなりました。</p>
        <p className="mb-4">ハイスコア: {highScore}</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={resetBoard}>
          盤面をリセット
        </button>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
