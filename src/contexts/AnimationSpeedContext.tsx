import React, { createContext, ReactNode, useContext, useState } from "react";

interface AnimationSpeedContextType {
  speed: number;
  setSpeed: (speed: number) => void;
}

const AnimationSpeedContext = createContext<
  AnimationSpeedContextType | undefined
>(undefined);

export const AnimationSpeedProvider: React.FC<{ children: ReactNode }> = (
  { children },
) => {
  // LocalStorageから速度を読み込む、なければデフォルトの1
  const [speed, setSpeedState] = useState<number>(() => {
    const savedSpeed = localStorage.getItem("animationSpeed");
    return savedSpeed ? parseFloat(savedSpeed) : 1;
  });

  // 速度変更時にLocalStorageに保存する関数
  const setSpeed = (newSpeed: number) => {
    setSpeedState(newSpeed);
    localStorage.setItem("animationSpeed", newSpeed.toString());
  };

  return (
    <AnimationSpeedContext.Provider value={{ speed, setSpeed }}>
      {children}
    </AnimationSpeedContext.Provider>
  );
};

export const useAnimationSpeed = () => {
  const context = useContext(AnimationSpeedContext);
  if (context === undefined) {
    throw new Error(
      "useAnimationSpeed must be used within an AnimationSpeedProvider",
    );
  }
  return context;
};
