import { useAppStore } from '../../store/useAppStore';
import { Line } from '@react-three/drei';

export const Primitives = () => {
    const { segments, planes } = useAppStore();

    return (
        <group>
            {/* Segments */}
            {segments.map((seg) => (
                <Line
                    key={seg.id}
                    points={[seg.start, seg.end]}
                    color={seg.color}
                    lineWidth={2}
                />
            ))}

            {/* Planes (Placeholder for now) */}
            {planes.map((_) => {
                // Parametric plane drawing is complex.
                // For MVP, we likely won't implement a full math parser in this step.
                // We will just place a placeholder mesh.
                return null;
            })}
        </group>
    );
};
