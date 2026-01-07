import React, { createContext, useContext, type ReactNode } from "react";
import { useGraphState } from "../hooks/useGraphState";

type GraphContextType = ReturnType<typeof useGraphState>;

const GraphContext = createContext<GraphContextType | undefined>(undefined);

/** Provider that creates the state once and shares it */
export const GraphProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const state = useGraphState(); // created only once
  return (
    <GraphContext.Provider value={state}>{children}</GraphContext.Provider>
  );
};

/** Hook for components to read the shared state */
export const useGraph = (): GraphContextType => {
  const ctx = useContext(GraphContext);
  if (!ctx) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return ctx;
};
