import { point, segment, parametric, group } from './services/GeometryBuilder';
import type { GeometryConfig } from './services/GeometryBuilder';

/**
 * Declarative Geometry Configuration
 * 
 * Define your geometry here using the builder functions:
 * - point(name, position, options)
 * - segment(name, start, end, options)
 * - parametric(name, equation, domain, options)
 * - group(name, options, children)
 * 
 * Example:
 *   group('My Group', { visible: true }, [
 *     point('Origin', [0, 0, 0], { color: 'red', radius: 1 }),
 *     segment('X Axis', [0, 0, 0], [10, 0, 0], { color: 'green' })
 *   ])
 */
export const geometryConfig: GeometryConfig[] = [
    group('Demo Geometry', { visible: false }, [
        point('Translucent Box', [0, 5, 0], {
            color: '#00ff00',
            opacity: 0.5,
            radius: 2,
            shape: 'box',
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: true
        }),

        segment('Capped Line', [-50, 5, -50], [50, 5, 50], {
            color: 'orange',
            opacity: 1,
            thickness: 5,
            style: 'dashed',
            coordinateSpace: 'plot',
            visibleIfOutsideGraph: false
        }),

        parametric(
            'Limited Spiral',
            {
                x: "u * Math.cos(v)",
                y: "u * Math.sin(v)",
                z: "v * 2"
            },
            {
                u: [2, 12],
                v: [0, 40]
            },
            {
                color: '#00ccff',
                opacity: 0.8,
                coordinateSpace: 'plot',
                visibleIfOutsideGraph: false
            }
        )
    ]),

    group('Ballistics', { visible: false }, [
        parametric(
            'Range R(speed, angle)',
            {
                x: "v",  // speed (m/s)
                y: "u",  // angle theta (degrees)
                z: "((rad) => ((s) => s < 0 ? 0 : (v * Math.cos(rad) / 9.8) * (v * Math.sin(rad) + Math.sqrt(s)))(v * v * Math.sin(rad) * Math.sin(rad) - 2 * 9.8 * 1.5))(u * Math.PI / 180)"
            },
            {
                v: [1, 1000],
                u: [0.01, 90]  // degrees ~ (0, 90)
            },
            {
                color: '#00ccff',
                opacity: 0.8,
                coordinateSpace: 'plot',
                visibleIfOutsideGraph: true
            }
        )
    ])
];
