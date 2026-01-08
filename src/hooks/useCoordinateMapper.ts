import { useAppStore } from '../store/useAppStore';

export const useCoordinateMapper = () => {
    const { axes } = useAppStore();

    const mapPoint = (x: number, y: number, z: number): [number, number, number] => {
        // Map Logic:
        // Input: Data Value (e.g. 100)
        // Range: [0, 200]
        // 0 -> -0.5 (Visual), 200 -> 0.5 (Visual)
        // Scale: Visual Size (e.g. 10)
        // Result: 0 (Visual)

        const mapAxis = (val: number, axis: 'x' | 'y' | 'z') => {
            const { min, max, size } = axes[axis];
            const range = max - min;
            if (range === 0) return 0;
            const normalized = (val - min) / range - 0.5;
            return normalized * size;
        };

        // Standard FTC Field: Z is Height? Or Y is Height?
        // Usually: X/Y are floor, Z is Up?
        // ThreeJS: Y is Up.
        // Let's assume input: X->X, Y->Z (Depth), Z->Y (Height)

        const vx = mapAxis(x, 'x');
        const vy = mapAxis(z, 'y'); // Input Z mapped to Visual Y (Height)
        const vz = mapAxis(y, 'z'); // Input Y mapped to Visual Z (Depth)

        return [vx, vy, vz];
    };

    return { mapPoint };
};
