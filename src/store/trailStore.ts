export type TrailPoint = {
  x: number;
  y: number;
  z: number;
  t: number;
};

export type TrailMarker = TrailPoint | { break: true };

let currentTrail: TrailMarker[] = [];
const listeners = new Set<() => void>();

export const trailStore = {
  getState: () => currentTrail,
  setState: (next: TrailMarker[]) => {
    currentTrail = next;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  reset: () => {
    currentTrail = [];
    listeners.forEach((listener) => listener());
  },
};
