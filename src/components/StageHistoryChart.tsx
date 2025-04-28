import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const StageHistoryChart: React.FC = () => {
  const [historyData, setHistoryData] = useState<
    { name: string; stage: number }[]
  >([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("stageHistory");
    if (storedHistory) {
      try {
        const history: number[] = JSON.parse(storedHistory);
        // rechartsで表示するためにデータを整形
        const formattedData = history.map((stage, index) => ({
          name: `${index + 1}`, // X軸のラベル
          stage: stage,         // Y軸の値 (到達ステージ)
        }));
        setHistoryData(formattedData);
      } catch (error) {
        console.error("Failed to parse stage history:", error);
        // Optionally set an error state here
      }
    }
  }, []); // コンポーネントのマウント時に一度だけ実行

  if (historyData.length === 0) {
    return <div>データがありません。</div>;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <h2>過去 {historyData.length} の到達ステージ数</h2>
      <ResponsiveContainer>
        <LineChart
          data={historyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} /> {/* 整数のみ表示 */}
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="stage"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StageHistoryChart;
