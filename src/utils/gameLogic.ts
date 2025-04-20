// ゲーム盤のサイズ
export const BOARD_SIZE = 6;
const TOTAL_AVAILABLE_COLORS = 8; // 利用可能な色の総数
const COLORS_PER_STAGE = 3; // ステージごとに使用する色の数

// 利用可能な全色のインデックス (0から7)
const AVAILABLE_COLOR_INDICES = Array.from(
  { length: TOTAL_AVAILABLE_COLORS },
  (_, i) => i,
);

// 現在のステージで使用する色のインデックスを保持する配列
let currentStageColorIndices: number[] = [];

// ステージで使用する色をランダムに選択する関数
export const selectStageColors = () => {
  // Fisher-Yates (Knuth) シャッフルアルゴリズムで配列をシャッフル
  const shuffledIndices = [...AVAILABLE_COLOR_INDICES];
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [
      shuffledIndices[j],
      shuffledIndices[i],
    ];
  }
  // シャッフルされた配列から最初の3つを選択
  currentStageColorIndices = shuffledIndices.slice(0, COLORS_PER_STAGE);
  console.log("Selected stage colors (indices):", currentStageColorIndices); // デバッグ用
};

// 選択された色の中からランダムなブロック値（色のインデックス）を生成
export const getRandomBlock = (): number => {
  if (currentStageColorIndices.length === 0) {
    // まだ色が選択されていない場合（初期化時など）はエラーを防ぐため仮選択
    selectStageColors();
  }
  const randomIndex = Math.floor(
    Math.random() * currentStageColorIndices.length,
  );
  return currentStageColorIndices[randomIndex];
};

// getNumBlockTypes は不要になったのでコメントアウト
// export const getNumBlockTypes = () => NUM_BLOCK_TYPES;

// resetBlockTypes も不要だが、呼ばれている可能性があるので空のまま残す
export const resetBlockTypes = () => {
  // 何もしない
};

// --- 色とパターンの生成関数を修正 ---

// 利用可能な全色のクラス名リスト
const allColorClasses = [
  "bg-blue-300",
  "bg-green-300",
  "bg-yellow-300",
  "bg-red-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-orange-300",
  "bg-cyan-300",
];

// 利用可能な全パターンのシンボルリスト
const allPatternSymbols = [
  "●",
  "■",
  "▲",
  "◆",
  "★",
  "+",
  "✿",
  "♥",
];

// 現在選択されている色に基づいて色のクラスを生成する関数
// 引数 numBlockTypes は不要になった
export const generateColorClasses = (): { [key: number]: string } => {
  const colorClasses: { [key: number]: string } = {};
  currentStageColorIndices.forEach((index) => {
    if (index >= 0 && index < allColorClasses.length) {
      colorClasses[index] = allColorClasses[index];
    }
  });
  return colorClasses;
};

// 現在選択されている色に基づいてパターンのシンボルを生成する関数
// 引数 numBlockTypes は不要になった
export const generatePatternSymbols = (): { [key: number]: string } => {
  const patternSymbols: { [key: number]: string } = {};
  currentStageColorIndices.forEach((index) => {
    if (index >= 0 && index < allPatternSymbols.length) {
      patternSymbols[index] = allPatternSymbols[index];
    }
  });
  return patternSymbols;
};

// マッチを見つける関数 (変更なし)
export const findMatches = (
  currentBoard: Array<Array<number | null>>,
): Array<{ row: number; col: number }> => {
  const matches = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE - 2; c++) {
      const cell1 = currentBoard[r][c];
      if (cell1 !== null) {
        if (
          cell1 === currentBoard[r][c + 1] && cell1 === currentBoard[r][c + 2]
        ) {
          matches.add(`${r}-${c}`);
          matches.add(`${r}-${c + 1}`);
          matches.add(`${r}-${c + 2}`);
          for (let k = c + 3; k < BOARD_SIZE; k++) {
            if (cell1 === currentBoard[r][k]) matches.add(`${r}-${k}`);
            else break;
          }
        }
      }
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE - 2; r++) {
      const cell1 = currentBoard[r][c];
      if (cell1 !== null) {
        if (
          cell1 === currentBoard[r + 1][c] && cell1 === currentBoard[r + 2][c]
        ) {
          matches.add(`${r}-${c}`);
          matches.add(`${r + 1}-${c}`);
          matches.add(`${r + 2}-${c}`);
          for (let k = r + 3; k < BOARD_SIZE; k++) {
            if (cell1 === currentBoard[k][c]) matches.add(`${k}-${c}`);
            else break;
          }
        }
      }
    }
  }
  return Array.from(matches).map((key) => {
    const [row, col] = key.split("-").map(Number);
    return { row, col };
  });
};

// ブロックを落下させる関数
export const applyGravity = (
  currentBoard: Array<Array<number | null>>,
): Array<Array<number | null>> => {
  const newBoard = currentBoard.map((r) => [...r]);
  for (let c = 0; c < BOARD_SIZE; c++) {
    let emptyRow = BOARD_SIZE - 1; // 列の一番下から空きを探す
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      if (newBoard[r][c] !== null) {
        if (r !== emptyRow) { // 空きマスが見つかっていれば、そこにブロックを移動
          newBoard[emptyRow][c] = newBoard[r][c];
          newBoard[r][c] = null;
        }
        emptyRow--; // 次の空きマス候補を一つ上に
      }
    }
  }
  return newBoard;
};

// 空いたセルを新しいブロックで補充する関数
export const refillBoard = (
  currentBoard: Array<Array<number | null>>,
): Array<Array<number | null>> => {
  const newBoard = currentBoard.map((r) => [...r]);
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[r][c] === null) {
        newBoard[r][c] = getRandomBlock();
      }
    }
  }
  return newBoard;
};

// 有効な手が存在するかチェックする関数
export const checkForPossibleMoves = (
  currentBoard: Array<Array<number | null>>,
): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // 右隣と入れ替えてチェック
      if (c < BOARD_SIZE - 1) {
        const swappedBoard = currentBoard.map((row) => [...row]);
        const temp = swappedBoard[r][c];
        swappedBoard[r][c] = swappedBoard[r][c + 1];
        swappedBoard[r][c + 1] = temp;
        if (findMatches(swappedBoard).length > 0) {
          // console.log(`Possible move found: swap (${r},${c}) and (${r},${c+1})`);
          return true; // 有効な手が見つかった
        }
      }
      // 下隣と入れ替えてチェック
      if (r < BOARD_SIZE - 1) {
        const swappedBoard = currentBoard.map((row) => [...row]);
        const temp = swappedBoard[r][c];
        swappedBoard[r][c] = swappedBoard[r + 1][c];
        swappedBoard[r + 1][c] = temp;
        if (findMatches(swappedBoard).length > 0) {
          // console.log(`Possible move found: swap (${r},${c}) and (${r+1},${c})`);
          return true; // 有効な手が見つかった
        }
      }
    }
  }
  return false; // 有効な手が見つからなかった
};
