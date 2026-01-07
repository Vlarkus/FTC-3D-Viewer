import React, { useMemo } from "react";

export type Point3 = { x: number; y: number; z: number };

interface Props {
  points: Point3[];
}

export const Points: React.FC<Props> = ({ points }) => {
  const positions = useMemo(
    () => new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])),
    [points]
  );

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} />
    </points>
  );
};
