// src/context/GraphContext.tsx
import React, { createContext, useContext, type ReactNode } from "react";
import { useGraphState } from "../hooks/useGraphState";

type GraphContextType = ReturnType<typeof useGraphState>;

const GraphContext = createContext<GraphContextType | undefined>(undefined);

export const GraphProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const state = useGraphState(); // created once here
  return (
    <GraphContext.Provider value={state}>{children}</GraphContext.Provider>
  );
};

export const useGraph = () => {
  const ctx = useContext(GraphContext);
  if (!ctx) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return ctx;
};
