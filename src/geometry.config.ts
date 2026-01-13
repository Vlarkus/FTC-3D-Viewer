import { point, segment, parametric, group } from "./services/GeometryBuilder";
import type { GeometryConfig } from "./services/GeometryBuilder";

/**
 * Declarative Geometry Configuration
 *
 * Define your geometry here using the builder functions:
 * - point(name, position, options)
 * - segment(name, start, end, options)
 * - cubicBezier(name, start, control1, control2, end, options)
 * - parametric(name, equation, domain, options)
 * - group(name, options, children)
 *
 * Example:
 *   group('My Group', { visible: true }, [
 *     point('Origin', [0, 0, 0], { color: 'red', radius: 1 }),
 *     segment('X Axis', [0, 0, 0], [10, 0, 0], { color: 'green' })
 *   ])
 */
export const geometryConfig: GeometryConfig[] = [];
