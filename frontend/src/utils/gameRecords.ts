export interface GameRecords {
  history: number[];
  highestStage: number;
}
export interface RecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function read(storage: RecordStorage, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

const isStage = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export function loadGameRecords(storage: RecordStorage): GameRecords {
  const savedHistory = read(storage, "stageHistory");
  const highest = read(storage, "highestStageCleared");
  return {
    history: Array.isArray(savedHistory)
      ? savedHistory.filter(isStage).slice(-10)
      : [],
    highestStage: isStage(highest) ? highest : 0,
  };
}

function write(storage: RecordStorage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save game record:", error);
  }
}

export function recordHighestStage(
  storage: RecordStorage,
  clearedStage: number,
) {
  const highest = Math.max(loadGameRecords(storage).highestStage, clearedStage);
  write(storage, "highestStageCleared", highest);
  return highest;
}

export function recordGameOver(storage: RecordStorage, currentStage: number) {
  const cleared = Math.max(0, currentStage - 1);
  const records = loadGameRecords(storage);
  write(storage, "stageHistory", [...records.history, cleared].slice(-10));
  recordHighestStage(storage, cleared);
}
