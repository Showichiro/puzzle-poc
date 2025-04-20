import React from 'react';
import { motion } from 'framer-motion';
import {
  generateColorClasses,
  getNumBlockTypes,
  generatePatternSymbols, // 追加
} from '../utils/gameLogic';

interface CellProps {
  value: number | null;
  onClick: () => void;
  isSelected: boolean;
}

const Cell: React.FC<CellProps> = ({ value, onClick, isSelected }) => {
  // セルのスタイルをTailwind CSSで定義
  const baseStyle = `w-16 h-16 border ${
    isSelected ? "border-red-500 border-4" : "border-gray-400"
  } flex items-center justify-center text-xl font-bold cursor-pointer select-none transition-colors duration-300`;
  // 値に応じて背景色とパターンを取得
  const numBlockTypes = getNumBlockTypes();
  const colorClasses = generateColorClasses(numBlockTypes);
  const patternSymbols = generatePatternSymbols(numBlockTypes); // 追加
  const colorStyle = value !== null && colorClasses[value]
    ? colorClasses[value]
    : 'bg-gray-200';
  const patternSymbol = value !== null && patternSymbols[value]
    ? patternSymbols[value]
    : ''; // 追加

  return (
    <motion.div
      layout // Enable layout animation
      className={`${baseStyle} ${colorStyle}`}
      onClick={onClick}
      initial={{ scale: 0 }} // Initial animation state (optional)
      animate={{ scale: 1 }} // Animate to this state (optional)
      transition={{ type: 'spring', stiffness: 300, damping: 20 }} // Animation transition (optional)
    >
      {/* パターン記号を表示 */}
      <span className="text-3xl text-black opacity-70">{patternSymbol}</span>
    </motion.div>
  );
};

export default Cell;
