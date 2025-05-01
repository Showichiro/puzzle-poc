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

// 水平方向のマッチグループを見つけるヘルパー関数
// 戻り値は Set<Set<string>> で、各内部Setが一つの連続したマッチを表す
const findHorizontalMatches = (
  currentBoard: Array<Array<number | null>>,
): Set<Set<string>> => {
  const matchGroups = new Set<Set<string>>();
  // 各行を走査
  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = 0;
    while (c < BOARD_SIZE - 2) {
      const cell1 = currentBoard[r][c];
      if (cell1 === null) {
        c++;
        continue;
      }

      // 連続する同じブロックを探す
      let matchLength = 1;
      while (
        c + matchLength < BOARD_SIZE &&
        currentBoard[r][c + matchLength] === cell1
      ) {
        matchLength++;
      }

      // 3つ以上連続していればマッチグループとして追加
      if (matchLength >= 3) {
        const currentMatch = new Set<string>();
        for (let k = 0; k < matchLength; k++) {
          currentMatch.add(`${r}-${c + k}`);
        }
        matchGroups.add(currentMatch);
        c += matchLength; // マッチした分だけインデックスを進める
      } else {
        c++; // マッチしなかったので次のセルへ
      }
    }
  }
  return matchGroups;
};

// 垂直方向のマッチグループを見つけるヘルパー関数
// 戻り値は Set<Set<string>> で、各内部Setが一つの連続したマッチを表す
const findVerticalMatches = (
  currentBoard: Array<Array<number | null>>,
): Set<Set<string>> => {
  const matchGroups = new Set<Set<string>>();
  // 各列を走査
  for (let c = 0; c < BOARD_SIZE; c++) {
    let r = 0;
    while (r < BOARD_SIZE - 2) {
      const cell1 = currentBoard[r][c];
      if (cell1 === null) {
        r++;
        continue;
      }

      // 連続する同じブロックを探す
      let matchLength = 1;
      while (
        r + matchLength < BOARD_SIZE &&
        currentBoard[r + matchLength][c] === cell1
      ) {
        matchLength++;
      }

      // 3つ以上連続していればマッチグループとして追加
      if (matchLength >= 3) {
        const currentMatch = new Set<string>();
        for (let k = 0; k < matchLength; k++) {
          currentMatch.add(`${r + k}-${c}`);
        }
        matchGroups.add(currentMatch);
        r += matchLength; // マッチした分だけインデックスを進める
      } else {
        r++; // マッチしなかったので次のセルへ
      }
    }
  }
  return matchGroups;
};

// ゲーム盤上の全てのマッチを見つける関数（特殊消去ロジックを含む）
export const findMatches = (
  currentBoard: Array<Array<number | null>>,
): Array<{ row: number; col: number }> => {
  // 水平方向と垂直方向のマッチグループをそれぞれ検出
  const horizontalMatchGroups = findHorizontalMatches(currentBoard);
  const verticalMatchGroups = findVerticalMatches(currentBoard);

  // 消去対象となる全てのブロックの座標を保持するSet
  const blocksToClear = new Set<string>();
  // 特殊効果（同色全消し）が発動した色を記録するSet
  const specialClearColors = new Set<number>();

  // 各マッチグループを処理
  const processMatchGroup = (matchGroup: Set<string>) => {
    // まず、通常のマッチとして消去対象に追加
    matchGroup.forEach((key) => blocksToClear.add(key));

    // 5つ以上の連続マッチの場合、特殊効果を準備
    if (matchGroup.size >= 5) {
      // グループ内の最初のブロックから色を取得
      const firstKey = matchGroup.values().next().value;
      if (firstKey) {
        const [r, c] = firstKey.split("-").map(Number);
        const color = currentBoard[r][c];
        if (color !== null) {
          specialClearColors.add(color); // 特殊効果対象の色として記録
        }
      }
    }
  };

  horizontalMatchGroups.forEach(processMatchGroup);
  verticalMatchGroups.forEach(processMatchGroup);

  // 特殊効果が発動した色があれば、盤面全体からその色のブロックを追加
  if (specialClearColors.size > 0) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const color = currentBoard[r][c];
        if (color !== null && specialClearColors.has(color)) {
          blocksToClear.add(`${r}-${c}`);
        }
      }
    }
  }

  // 消去対象の座標Setを { row, col } オブジェクトの配列に変換して返す
  return Array.from(blocksToClear).map((key) => {
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

export const createAndInitializeBoard = (): Array<Array<number | null>> => {
  let board: Array<Array<number | null>> = Array(BOARD_SIZE)
    .fill(null)
    .map(
      () =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => getRandomBlock()), // 選択された色で盤面生成
    );

  // 初期盤面でマッチがないように調整
  let matches = findMatches(board);
  while (matches.length > 0) {
    matches.forEach(({ row, col }) => {
      board[row][col] = getRandomBlock();
    });
    matches = findMatches(board);
  }

  // 重力と補充も適用
  board = applyGravity(board);
  board = refillBoard(board);

  // 詰み状態チェック
  const hasPossibleMoves = checkForPossibleMoves(board);
  if (!hasPossibleMoves) {
    console.log("Generated board has no possible moves, regenerating...");
    // 詰みの場合は再帰的に呼び出す
    return createAndInitializeBoard();
  }

  return board;
};
