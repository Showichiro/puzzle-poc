import type { FC } from "react";
import { useAuth } from "../contexts/AuthContext";

export const UserProfile: FC = () => {
  const { user, signOut, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <h3>{user.name}</h3>
        <div className="user-stats">
          <div>総ゲーム数: {user.stats.total_games}</div>
          <div>最高スコア: {user.stats.highest_score}</div>
          <div>最高ステージ: {user.stats.highest_stage}</div>
          <div>平均スコア: {user.stats.average_score}</div>
          <div>今週のプレイ: {user.stats.recent_game_count}回</div>
        </div>
      </div>
      <button type="button" onClick={signOut} className="btn-secondary">
        サインアウト
      </button>
    </div>
  );
};