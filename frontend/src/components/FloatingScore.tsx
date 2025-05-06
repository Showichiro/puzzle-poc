import type { FC } from "react";
import { BOARD_SIZE } from "../utils/gameLogic";

interface FloatingScoresProps {
  score: number;
  chainCount: number;
  row: number;
  col: number;
}

export const FloatingScores: FC<FloatingScoresProps> = ({
  score,
  chainCount,
  row,
  col,
}) => {
  // スコアに基づいてフォントサイズを計算
  // スコアの対数を取り、最小値と最大値の間で線形補間
  const minScore = 100; // 調整可能な最小スコア
  const maxScore = 100000; // 調整可能な最大スコア
  const minFontSize = 1; // 最小フォントサイズ (rem)
  const maxFontSize = 3; // 最大フォントサイズ (rem)

  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const logScore = Math.log(clampedScore);
  const logMinScore = Math.log(minScore);
  const logMaxScore = Math.log(maxScore);

  // 対数スケールでの線形補間
  const fontSize =
    minFontSize +
    ((maxFontSize - minFontSize) * (logScore - logMinScore)) /
      (logMaxScore - logMinScore);

  // スコアに基づいて明度 (Lightness) を計算
  // スコアの対数を取り、最小値と最大値の間で線形補間
  // スコアが低いほど明度が高く（白く）、高いほど明度が低く（濃く）なるようにする
  const minLightness = 40; // 最大スコア時の明度 (濃い色)
  const maxLightness = 90; // 最小スコア時の明度 (白に近い色)
  const lightness =
    minLightness +
    ((maxLightness - minLightness) * (logMaxScore - logScore)) / // スコアが増えるほど (logScoreが増えるほど) 明度が下がるように計算
      (logMaxScore - logMinScore);

  // 連鎖数に基づいて色相 (Hue) と彩度 (Saturation) を計算
  // 連鎖数が多いほど赤に近づける (色相: 50(黄) -> 0(赤), 彩度: 100%)
  const maxChainForColor = 10; // 色の変化の最大連鎖数 (10連鎖で赤)
  const clampedChain = Math.min(chainCount, maxChainForColor);
  // 連鎖1で黄(50)、連鎖10で赤(0) になるように補間
  const hue = 50 - ((50 - 0) * (clampedChain - 1)) / (maxChainForColor - 1);
  const saturation = 100; // 彩度は最大に固定

  // 連鎖数に基づいてアニメーションクラスを生成
  const shakeClass =
    chainCount > 1 ? `chain-shake-${Math.min(chainCount, 10)}` : ""; // 連鎖数に応じてクラス名を変更 (最大6まで)

  return (
    <div
      className={`floating-score ${shakeClass}`} // クラス名を追加
      style={{
        position: "absolute", // 絶対配置にする
        top: `${row * (100 / BOARD_SIZE)}%`, // セルの高さに基づいて位置を計算
        left: `${col * (100 / BOARD_SIZE)}%`, // セルの幅に基づいて位置を計算
        width: `${100 / BOARD_SIZE}%`, // セルの幅に合わせる
        height: `${100 / BOARD_SIZE}%`, // セルの高さに合わせる
        display: "flex", // 中央寄せのために flexbox を使用
        justifyContent: "center", // 水平方向の中央寄せ
        alignItems: "center", // 垂直方向の中央寄せ
        fontSize: `${fontSize}rem`, // 計算したフォントサイズを適用
        fontWeight: "bold", // 太字にする
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`, // HSL形式で色を設定
        textShadow: "2px 2px 4px rgba(0,0,0,0.5)", // 影をつける
        pointerEvents: "none", // クリックイベントを無効化
        zIndex: 10, // 他の要素より前面に表示
        // アニメーションは CSS で定義することを想定
      }}
    >
      +{score}
    </div>
  );
};
