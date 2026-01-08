import { Text, Edges, Grid } from '@react-three/drei';
import { useAppStore } from '../../store/useAppStore';

export const PlotBox = () => {
    const { axes } = useAppStore();

    const xSize = axes.x.size;
    const ySize = axes.y.size;
    const zSize = axes.z.size;

    const { max: xMax, min: xMin, step: xStep } = axes.x;
    const { step: yStep } = axes.y;
    const { max: zMax, min: zMin, step: zStep } = axes.z;

    // Calculate Grid Props
    // We need to map data 'step' to visual 'cellSize'
    // Visual Size = Data Size * Scale. 
    // Scale = VisualSize / DataRange.
    // CellSize = Step * Scale.

    const getGridConfig = (size: number, min: number, max: number, step: number) => {
        const range = max - min;
        if (range <= 0 || step <= 0) return { cellSize: 1, sectionSize: 10 }; // Fallback

        const scale = size / range;
        const visualCellSize = step * scale;

        // sectionSize controls the thicker lines. Let's make it 5x or 10x steps, or just same if tiny.
        const visualSectionSize = visualCellSize * 5;

        return { cellSize: visualCellSize, sectionSize: visualSectionSize };
    };

    const xConfig = getGridConfig(xSize, xMin, xMax, xStep);
    const zConfig = getGridConfig(zSize, zMin, zMax, zStep);

    // Common Grid Props
    const commonGridProps = {
        infiniteGrid: false,
        fadeDistance: 100, // No fade needed inside box really
        fadeStrength: 0,
        cellColor: "#444",
        sectionColor: "#666",
        sectionThickness: 1,
        cellThickness: 0.5,
    };

    return (
        <group>
            {/* 1. Solid White Box Edges (Clean & Robust) */}
            <mesh>
                <boxGeometry args={[xSize, ySize, zSize]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />{/* Invisible mesh for Edges to attach to */}
                <Edges color="white" threshold={1} />
            </mesh>

            {/* 
               2. Internal Grids on 6 Faces
               We position them slightly offset inwards if needed to avoid Z-fighting with edges? 
               Actually Grid renders on a plane.
               
               Crucial: We want them visible ONLY from INSIDE.
               Standard Grid is DoubleSide? Or FrontSide?
               Drei Grid renders a plane geometry.
               If we carefully rotate them to FACE INWARDS, and Drei Grid respects 'side', we are good.
               However, Drei Grid uses a custom shader. It might be DoubleSide by default.
               To hide them from outside, we need them to be One-Sided facing In.
               We can pass `side={THREE.BackSide}` to the material via `...props`? 
               Wait, Grid props usually go to the component.
               We might wrap them in a group with specific rotation logic or use `side={THREE.BackSide}` if supported.
               
               Let's assume we simply place them on the faces.
               If they are visible from outside, it's "okay" but user preferred not to.
               "only when i am looking at it from inside the cube (aka when it is the back side relative to viewing)"
               This means `side={THREE.BackSide}` relative to the Box center.
               So Normal points OUTWARDS, but we render BackSide.
            */}

            <group>
                {/* 
                    GRID PLANES (Normals pointing INWARDS, using Default FrontSide) 
                    Drei Grid defaults to XZ Plane (Normal +Y).
                    We rotate to align Normal INWARDS.
                    Standard Back-Face Culling (FrontSide) makes Rear-facing planes invisible.
                    So:
                    - Outside viewing Near Wall (Normal In -> Ray aligns -> Back Face) -> Invisible.
                    - Inside viewing Far Wall (Normal In -> Ray opposes -> Front Face) -> Visible.
                */}

                {/* Bottom (y = -H/2). Normal +Y (In). 
                    Grid (+Y). Rot 0.
                */}
                {xStep > 0 && zStep > 0 && (
                    <Grid
                        position={[0, -ySize / 2, 0]}
                        rotation={[0, 0, 0]}
                        args={[xSize, zSize]}
                        {...commonGridProps}
                        cellSize={xConfig.cellSize}
                        sectionSize={xConfig.sectionSize}
                    />
                )}

                {/* Top (y = H/2). Normal -Y (In).
                    Grid (+Y). Rot 180 X -> Normal -Y.
                */}
                {xStep > 0 && zStep > 0 && (
                    <Grid
                        position={[0, ySize / 2, 0]}
                        rotation={[Math.PI, 0, 0]}
                        args={[xSize, zSize]}
                        {...commonGridProps}
                        cellSize={xConfig.cellSize}
                        sectionSize={xConfig.sectionSize}
                    />
                )}

                {/* Front (z = D/2). Normal -Z (In).
                    Grid (+Y). Rot -90 X -> Normal -Z.
                    (Thumb X, Fingers Y->-Z). Correct.
                */}
                {xStep > 0 && yStep > 0 && (
                    <Grid
                        position={[0, 0, zSize / 2]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        args={[xSize, ySize]}
                        {...commonGridProps}
                        cellSize={xConfig.cellSize}
                        sectionSize={xConfig.sectionSize}
                    />
                )}

                {/* Back (z = -D/2). Normal +Z (In).
                    Grid (+Y). Rot +90 X -> Normal +Z.
                */}
                {xStep > 0 && yStep > 0 && (
                    <Grid
                        position={[0, 0, -zSize / 2]}
                        rotation={[Math.PI / 2, 0, 0]}
                        args={[xSize, ySize]}
                        {...commonGridProps}
                        cellSize={xConfig.cellSize}
                        sectionSize={xConfig.sectionSize}
                    />
                )}

                {/* Right (x = W/2). Normal -X (In).
                    Grid (+Y). Rot +90 Z -> Normal -X.
                    (Thumb Z, Fingers Y->-X). Correct.
                */}
                {zStep > 0 && yStep > 0 && (
                    <Grid
                        position={[xSize / 2, 0, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                        args={[ySize, zSize]}
                        {...commonGridProps}
                        cellSize={zConfig.cellSize}
                        sectionSize={zConfig.sectionSize}
                    />
                )}

                {/* Left (x = -W/2). Normal +X (In).
                    Grid (+Y). Rot -90 Z -> Normal +X.
                */}
                {zStep > 0 && yStep > 0 && (
                    <Grid
                        position={[-xSize / 2, 0, 0]}
                        rotation={[0, 0, -Math.PI / 2]}
                        args={[ySize, zSize]}
                        {...commonGridProps}
                        cellSize={zConfig.cellSize}
                        sectionSize={zConfig.sectionSize}
                    />
                )}
            </group>

            {/* Labels */}
            {/* Min Corner */}
            <Text
                position={[-xSize / 2, -ySize / 2, -zSize / 2]}
                anchorX="right"
                anchorY="top"
                fontSize={0.4}
                color="white"
            >
                {`(${axes.x.min}, ${axes.y.min}, ${axes.z.min})`}
            </Text>

            {/* Max Corner */}
            <Text
                position={[xSize / 2, ySize / 2, zSize / 2]}
                anchorX="left"
                anchorY="bottom"
                fontSize={0.4}
                color="white"
            >
                {`(${axes.x.max}, ${axes.y.max}, ${axes.z.max})`}
            </Text>
        </group>
    );
};
