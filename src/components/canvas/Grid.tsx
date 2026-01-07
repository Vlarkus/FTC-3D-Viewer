import { Grid } from '@react-three/drei';

export const FieldGrid = () => {
    return (
        <Grid
            position={[0, -0.01, 0]}
            args={[10, 10]}
            cellSize={1} // 1 unit grid
            cellThickness={0.5}
            cellColor="#444"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#666"
            fadeDistance={30}
            infiniteGrid
        />
    );
};
