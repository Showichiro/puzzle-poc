// ゲーム盤のサイズ
export const BOARD_SIZE = 6;
// 利用可能な色の総数
const TOTAL_AVAILABLE_COLORS = 8;
// ステージごとに使用する色の数
const COLORS_PER_STAGE = 3;

// 利用可能な全色のインデックス (0から TOTAL_AVAILABLE_COLORS-1)
const AVAILABLE_COLOR_INDICES = Array.from(
  { length: TOTAL_AVAILABLE_COLORS },
  (_, i) => i,
);

// 現在のステージで使用する色のインデックスを保持する配列
// useGameBoard フックで管理されるべき状態だが、現状はこのファイルで管理
let currentStageColorIndices: number[] = [];

// ステージで使用する色をランダムに選択する関数
export const selectStageColors = () => {
  // 利用可能な色インデックスをシャッフル
  const shuffledIndices = [...AVAILABLE_COLOR_INDICES];
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] = [
      shuffledIndices[j],
      shuffledIndices[i],
    ];
  }
  // シャッフルされた配列からステージで使用する色の数だけ選択
  currentStageColorIndices = shuffledIndices.slice(0, COLORS_PER_STAGE);
  // console.log("Selected stage colors (indices):", currentStageColorIndices); // デバッグ用ログは削除
};

// 選択された色の中からランダムなブロック値（色のインデックス）を生成する関数
export const getRandomBlock = (): number => {
  // まだ色が選択されていない場合（初期化時など）はエラーを防ぐため選択
  if (currentStageColorIndices.length === 0) {
    selectStageColors();
  }
  const randomIndex = Math.floor(
    Math.random() * currentStageColorIndices.length,
  );
  return currentStageColorIndices[randomIndex];
};

// --- 色とパターンの生成関数 ---

// 利用可能な全色の Tailwind CSS クラス名リスト
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

// 現在選択されている色に基づいて色のクラス名のマップを生成する関数
export const generateColorClasses = (): { [key: number]: string } => {
  const colorClasses: { [key: number]: string } = {};
  currentStageColorIndices.forEach((index) => {
    if (index >= 0 && index < allColorClasses.length) {
      colorClasses[index] = allColorClasses[index];
    }
  });
  return colorClasses;
};

// 現在選択されている色に基づいてパターンのシンボルのマップを生成する関数
export const generatePatternSymbols = (): { [key: number]: string } => {
  const patternSymbols: { [key: number]: string } = {};
  currentStageColorIndices.forEach((index) => {
    if (index >= 0 && index < allPatternSymbols.length) {
      patternSymbols[index] = allPatternSymbols[index];
    }
  });
  return patternSymbols;
};

// 水平方向のマッチを見つけるヘルパー関数
const findHorizontalMatches = (
  currentBoard: Array<Array<number | null>>,
): Set<string> => {
  const matches = new Set<string>();
  // 各行を走査
  for (let r = 0; r < BOARD_SIZE; r++) {
    // 各列を走査し、3つ以上の連続する同じブロックを探す
    for (let c = 0; c < BOARD_SIZE - 2; c++) {
      const cell1 = currentBoard[r][c];
      // null でなく、右隣2つと同じブロックであればマッチ
      if (
        cell1 !== null && cell1 === currentBoard[r][c + 1] &&
        cell1 === currentBoard[r][c + 2]
      ) {
        // マッチしたブロックの座標をSetに追加
        matches.add(`${r}-${c}`);
        matches.add(`${r}-${c + 1}`);
        matches.add(`${r}-${c + 2}`);
        // 3つ以上のマッチの場合、それ以降の連続するブロックも追加
        for (let k = c + 3; k < BOARD_SIZE; k++) {
          if (cell1 === currentBoard[r][k]) matches.add(`${r}-${k}`);
          else break;
        }
      }
    }
  }
  return matches;
};

// 垂直方向のマッチを見つけるヘルパー関数
const findVerticalMatches = (
  currentBoard: Array<Array<number | null>>,
): Set<string> => {
  const matches = new Set<string>();
  // 各列を走査
  for (let c = 0; c < BOARD_SIZE; c++) {
    // 各行を走査し、3つ以上の連続する同じブロックを探す
    for (let r = 0; r < BOARD_SIZE - 2; r++) {
      const cell1 = currentBoard[r][c];
      // null でなく、下隣2つと同じブロックであればマッチ
      if (
        cell1 !== null && cell1 === currentBoard[r + 1][c] &&
        cell1 === currentBoard[r + 2][c]
      ) {
        // マッチしたブロックの座標をSetに追加
        matches.add(`${r}-${c}`);
        matches.add(`${r + 1}-${c}`);
        matches.add(`${r + 2}-${c}`);
        // 3つ以上のマッチの場合、それ以降の連続するブロックも追加
        for (let k = r + 3; k < BOARD_SIZE; k++) {
          if (cell1 === currentBoard[k][c]) matches.add(`${k}-${c}`);
          else break;
        }
      }
    }
  }
  return matches;
};

// ゲーム盤上の全てのマッチを見つける関数
export const findMatches = (
  currentBoard: Array<Array<number | null>>,
): Array<{ row: number; col: number }> => {
  // 水平方向と垂直方向のマッチをそれぞれ検出し、結合
  const horizontalMatches = findHorizontalMatches(currentBoard);
  const verticalMatches = findVerticalMatches(currentBoard);
  const allMatches = new Set([...horizontalMatches, ...verticalMatches]);

  // マッチした座標のSetを { row, col } オブジェクトの配列に変換して返す
  return Array.from(allMatches).map((key) => {
    const [row, col] = key.split("-").map(Number);
    return { row, col };
  });
};

// ブロックを落下させる関数
export const applyGravity = (
  currentBoard: Array<Array<number | null>>,
): Array<Array<number | null>> => {
  const newBoard = currentBoard.map((r) => [...r]);
  // 各列に対して重力処理を適用
  for (let c = 0; c < BOARD_SIZE; c++) {
    let emptyRow = BOARD_SIZE - 1; // 列の一番下から空きマスを探すためのポインタ
    // 列を下から上に走査
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      // ブロックが存在する場合
      if (newBoard[r][c] !== null) {
        // 現在の行が空きマスを探している行と異なる場合、ブロックを落下させる
        if (r !== emptyRow) {
          newBoard[emptyRow][c] = newBoard[r][c];
          newBoard[r][c] = null; // 元の位置を空にする
        }
        emptyRow--; // 次の空きマス候補を一つ上に移動
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
  // 全てのセルを走査
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // セルが空の場合、新しいランダムなブロックで補充
      if (newBoard[r][c] === null) {
        newBoard[r][c] = getRandomBlock();
      }
    }
  }
  return newBoard;
};

// 有効な手（ブロックを入れ替えることでマッチが発生する手）が存在するかチェックする関数
export const checkForPossibleMoves = (
  currentBoard: Array<Array<number | null>>,
): boolean => {
  // 全てのセルを走査
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // 右隣と入れ替えてマッチが発生するかチェック
      if (c < BOARD_SIZE - 1) {
        const swappedBoard = currentBoard.map((row) => [...row]);
        // ブロックを入れ替え
        const temp = swappedBoard[r][c];
        swappedBoard[r][c] = swappedBoard[r][c + 1];
        swappedBoard[r][c + 1] = temp;
        // 入れ替え後にマッチが存在するか確認
        if (findMatches(swappedBoard).length > 0) {
          // console.log(`Possible move found: swap (${r},${c}) and (${r},${c+1})`); // デバッグログは削除
          return true; // 有効な手が見つかった
        }
      }
      // 下隣と入れ替えてマッチが発生するかチェック
      if (r < BOARD_SIZE - 1) {
        const swappedBoard = currentBoard.map((row) => [...row]);
        // ブロックを入れ替え
        const temp = swappedBoard[r][c];
        swappedBoard[r][c] = swappedBoard[r + 1][c];
        swappedBoard[r + 1][c] = temp;
        // 入れ替え後にマッチが存在するか確認
        if (findMatches(swappedBoard).length > 0) {
          // console.log(`Possible move found: swap (${r},${c}) and (${r+1},${c})`); // デバッグログは削除
          return true; // 有効な手が見つかった
        }
      }
    }
  }
  // 全ての組み合わせをチェックしても有効な手が見つからなかった
  return false;
};
