// ゲーム盤のサイズ
export const BOARD_SIZE = 6;
// ブロックの種類（色の数）の最大値
let maxBlockTypes = 3; // 初期値を3に設定

// ブロックの種類（色の数）を取得
export const getNumBlockTypes = () => maxBlockTypes;

// 新しいランダムなブロック値を生成
export const getRandomBlock = () => Math.floor(Math.random() * getNumBlockTypes());

// 手数に応じてブロックの種類数を増やす
export const increaseBlockTypes = (moves: number) => {
  if (moves > 5 && maxBlockTypes < 4) {
    maxBlockTypes = 4;
  } else if (moves > 10 && maxBlockTypes < 5) {
    maxBlockTypes = 5;
  } else if (moves > 15 && maxBlockTypes < 6) {
    maxBlockTypes = 6;
  } else if (moves > 20 && maxBlockTypes < 7) {
    maxBlockTypes = 7;
  } else if (moves > 25 && maxBlockTypes < 8) {
    maxBlockTypes = 8;
  }
};

// ブロックの種類数をリセットする関数
export const resetBlockTypes = () => {
  maxBlockTypes = 3;
};

// ブロックの種類数に基づいて色の配列を生成する関数
export const generateColorClasses = (numBlockTypes: number): { [key: number]: string } => {
  const colorClasses: { [key: number]: string } = {};
  const colors = ['bg-blue-300', 'bg-green-300', 'bg-yellow-300', 'bg-red-300', 'bg-purple-300', 'bg-pink-300', 'bg-orange-300', 'bg-cyan-300'];
  for (let i = 0; i < numBlockTypes; i++) {
    colorClasses[i] = colors[i % colors.length];
  }
  return colorClasses;
};

// マッチを見つける関数 (変更なし)
export const findMatches = (currentBoard: Array<Array<number | null>>): Array<{ row: number; col: number }> => {
  const matches = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE - 2; c++) {
      const cell1 = currentBoard[r][c];
      if (cell1 !== null) {
        if (cell1 === currentBoard[r][c + 1] && cell1 === currentBoard[r][c + 2]) {
          matches.add(`${r}-${c}`); matches.add(`${r}-${c + 1}`); matches.add(`${r}-${c + 2}`);
          for (let k = c + 3; k < BOARD_SIZE; k++) { if (cell1 === currentBoard[r][k]) matches.add(`${r}-${k}`); else break; }
        }
      }
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r < BOARD_SIZE - 2; r++) {
      const cell1 = currentBoard[r][c];
      if (cell1 !== null) {
        if (cell1 === currentBoard[r + 1][c] && cell1 === currentBoard[r + 2][c]) {
          matches.add(`${r}-${c}`); matches.add(`${r + 1}-${c}`); matches.add(`${r + 2}-${c}`);
          for (let k = r + 3; k < BOARD_SIZE; k++) { if (cell1 === currentBoard[k][c]) matches.add(`${k}-${c}`); else break; }
        }
      }
    }
  }
  return Array.from(matches).map(key => { const [row, col] = key.split('-').map(Number); return { row, col }; });
};

// ブロックを落下させる関数
export const applyGravity = (currentBoard: Array<Array<number | null>>): Array<Array<number | null>> => {
  const newBoard = currentBoard.map(r => [...r]);
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
export const refillBoard = (currentBoard: Array<Array<number | null>>): Array<Array<number | null>> => {
  const newBoard = currentBoard.map(r => [...r]);
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
export const checkForPossibleMoves = (currentBoard: Array<Array<number | null>>): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      // 右隣と入れ替えてチェック
      if (c < BOARD_SIZE - 1) {
        const swappedBoard = currentBoard.map(row => [...row]);
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
        const swappedBoard = currentBoard.map(row => [...row]);
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
