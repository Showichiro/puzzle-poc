import { motion } from "framer-motion";
import {
  generateColorClasses,
  // getNumBlockTypes, // 削除
  generatePatternSymbols,
} from "../utils/gameLogic";

interface CellProps {
  value: number | null;
  onClick: () => void;
  isSelected: boolean;
  selectedColors: number[];
}

const Cell: React.FC<CellProps> = ({
  value,
  onClick,
  isSelected,
  selectedColors,
}) => {
  // セルのスタイルをTailwind CSSで定義
  const baseStyle = `h-16 border-2 ${
    // border を border-2 に変更
    isSelected ? "border-red-500 border-4" : "border-gray-400"
  } flex items-center justify-center text-xl font-extrabold cursor-pointer select-none transition-colors duration-300`; // font-bold を font-extrabold に変更
  // 値に応じて背景色とパターンを取得
  const colorClasses = generateColorClasses(selectedColors);
  const patternSymbols = generatePatternSymbols(selectedColors);
  const colorStyle =
    value !== null && colorClasses[value] ? colorClasses[value] : "bg-gray-200";
  const patternSymbol =
    value !== null && patternSymbols[value] ? patternSymbols[value] : "";

  return (
    <motion.div
      layout // Enable layout animation
      className={`${baseStyle} ${colorStyle}`}
      onClick={onClick}
      initial={{ scale: 0 }} // Initial animation state (optional)
      animate={{ scale: 1 }} // Animate to this state (optional)
      transition={{ type: "spring", stiffness: 300, damping: 20 }} // Animation transition (optional)
    >
      {/* パターン記号を表示 */}
      <span className="text-3xl text-black opacity-70">{patternSymbol}</span>
    </motion.div>
  );
};

export default Cell;
