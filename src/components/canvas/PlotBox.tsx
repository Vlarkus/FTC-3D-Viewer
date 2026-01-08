import { useRef } from 'react';
import { Line, Text } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';
import * as THREE from 'three';

export const PlotBox = () => {
    const { axes } = useAppStore();

    // Helper to generate grid lines
    const generateGridLines = (axis: 'x' | 'y' | 'z', settings: any, xSize: number, ySize: number, zSize: number) => {
        const lines = [];
        const { min, max, step } = settings;
        const range = max - min;
        if (range <= 0 || step <= 0) return [];

        const count = Math.floor(range / step);
        const halfX = xSize / 2;
        const halfY = ySize / 2;
        const halfZ = zSize / 2;

        for (let i = 0; i <= count; i++) {
            const val = min + i * step;
            // Normalize val to [-0.5, 0.5] then scale
            const normalized = (val - min) / range - 0.5;

            if (axis === 'x') {
                // Vertical lines along X
                const xPos = normalized * xSize;
                // Draw on bottom plane (XZ plane in Y-up)
                lines.push(
                    <Line
                        key={`x-${i}`}
                        points={[[xPos, -halfY, -halfZ], [xPos, -halfY, halfZ]]}
                        color="#333"
                        lineWidth={1}
                    />
                );
            } else if (axis === 'y') {
                // Nothing typically for Y unless we want a 3D volume grid
            } else if (axis === 'z') {
                // Horizontal lines along Z
                const zPos = normalized * zSize; // Actually Z is Y in visual if we rotate
                // But let's stick to standard Three coordinates: X=Right, Y=Up, Z=Forward
                // But in PlotBox, "Z" usually means depth.
                lines.push(
                    <Line
                        key={`z-${i}`}
                        points={[[-halfX, -halfY, zPos], [halfX, -halfY, zPos]]}
                        color="#333"
                        lineWidth={1}
                    />
                );
            }
        }
        return lines;
    };

    const xSize = axes.x.size;
    const ySize = axes.y.size; // "Height" of the box
    const zSize = axes.z.size; // "Depth" of the box

    return (
        <group>
            {/* The Main Wireframe Box */}
            <mesh>
                <boxGeometry args={[xSize, ySize, zSize]} />
                <meshBasicMaterial color="#444" wireframe />
            </mesh>

            {/* Grid Lines on the floor of the box (y = -ySize/2) */}
            {generateGridLines('x', axes.x, xSize, ySize, zSize)}
            {generateGridLines('z', axes.z, xSize, ySize, zSize)}

            {/* Labels */}
            <Text
                position={[-xSize / 2, -ySize / 2 - 0.5, zSize / 2]}
                fontSize={0.5}
                color="white"
            >
                {axes.x.min}, {axes.z.min}
            </Text>
            <Text
                position={[xSize / 2, -ySize / 2 - 0.5, -zSize / 2]}
                fontSize={0.5}
                color="white"
            >
                {axes.x.max}, {axes.z.max}
            </Text>
        </group>
    );
};
