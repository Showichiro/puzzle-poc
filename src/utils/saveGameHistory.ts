export const saveGameHistory = (stage: number) => {
  const lastClearedStage = Math.max(0, stage - 1); // 現在のステージの1つ前が最後にクリアしたステージ (最低0)

  // 過去10回の到達ステージ履歴の更新
  const storedHistory = localStorage.getItem("stageHistory");
  let history: number[] = [];
  try {
    if (storedHistory) {
      history = JSON.parse(storedHistory);
      if (!Array.isArray(history)) {
        history = [];
      }
    }
  } catch (error) {
    console.error("Error parsing stage history:", error);
  }
  // 新しいステージを追加
  history.push(lastClearedStage);

  // 履歴が10件を超えたら古いものから削除
  if (history.length > 10) {
    history = history.slice(history.length - 10);
  }

  // 更新した履歴をlocalStorageに保存
  localStorage.setItem("stageHistory", JSON.stringify(history));
  console.log("Updated stage history:", history);
};
