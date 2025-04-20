import React from "react";
import { motion } from "framer-motion";
import { generateColorClasses, getNumBlockTypes } from "../utils/gameLogic";

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
  // 値に応じて背景色を変える
  const colorClasses = generateColorClasses(getNumBlockTypes());
  const colorStyle = value !== null && colorClasses[value]
    ? colorClasses[value]
    : "bg-gray-200";

  return (
    <motion.div
      layout // Enable layout animation
      className={`${baseStyle} ${colorStyle}`}
      onClick={onClick}
      initial={{ scale: 0 }} // Initial animation state (optional)
      animate={{ scale: 1 }} // Animate to this state (optional)
      transition={{ type: "spring", stiffness: 300, damping: 20 }} // Animation transition (optional)
    >
      {/* Display value for debugging, can be removed later */}
      {/* {value !== null ? value : ''} */}
    </motion.div>
  );
};

export default Cell;
