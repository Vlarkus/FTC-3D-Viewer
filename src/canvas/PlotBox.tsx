import React, { useMemo } from "react";
import * as THREE from "three";

type Range = { min: number; max: number };

function normalizeRange(r: Range): Range {
  const a = Number(r.min),
    b = Number(r.max);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { min: -5, max: 5 };
  if (a === b) return { min: a - 1, max: a + 1 };
  return a < b ? { min: a, max: b } : { min: b, max: a };
}

function linspace(min: number, max: number, step: number): number[] {
  const s = Math.abs(step);
  if (!Number.isFinite(s) || s <= 0) return [];
  const out: number[] = [];
  const start = Math.ceil(min / s) * s;
  out.push(min);
  for (let v = start; v < max; v += s) {
    if (v > min && v < max) out.push(v);
  }
  out.push(max);
  return Array.from(new Set(out.map((v) => Number(v.toFixed(10))))).sort(
    (a, b) => a - b
  );
}

interface PlotBoxProps {
  xRange: Range;
  yRange: Range;
  zRange: Range;
  xStep: number;
  yStep: number;
  zStep: number;
  showFaceGrid: boolean;
}

export const PlotBox: React.FC<PlotBoxProps> = ({
  xRange,
  yRange,
  zRange,
  xStep,
  yStep,
  zStep,
  showFaceGrid,
}) => {
  const xr = normalizeRange(xRange);
  const yr = normalizeRange(yRange);
  const zr = normalizeRange(zRange);

  const min = useMemo(
    () => new THREE.Vector3(xr.min, yr.min, zr.min),
    [xr, yr, zr]
  );
  const max = useMemo(
    () => new THREE.Vector3(xr.max, yr.max, zr.max),
    [xr, yr, zr]
  );

  // ---- box outline -------------------------------------------------
  const boxLineGeom = useMemo(() => {
    const box = new THREE.Box3(min, max);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const geom = new THREE.BoxGeometry(size.x, size.y, size.z);
    const edges = new THREE.EdgesGeometry(geom);
    edges.translate(center.x, center.y, center.z);
    return edges;
  }, [min, max]);

  // ---- optional face grids -----------------------------------------
  const faceGridGeom = useMemo(() => {
    if (!showFaceGrid) return null;
    const xs = linspace(xr.min, xr.max, xStep);
    const ys = linspace(yr.min, yr.max, yStep);
    const zs = linspace(zr.min, zr.max, zStep);
    const verts: number[] = [];

    const pushSeg = (a: THREE.Vector3, b: THREE.Vector3) => {
      verts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };

    // Z = zmin face (XY grid)
    xs.forEach((x) =>
      pushSeg(
        new THREE.Vector3(x, yr.min, zr.min),
        new THREE.Vector3(x, yr.max, zr.min)
      )
    );
    ys.forEach((y) =>
      pushSeg(
        new THREE.Vector3(xr.min, y, zr.min),
        new THREE.Vector3(xr.max, y, zr.min)
      )
    );

    // Y = ymin face (XZ grid)
    xs.forEach((x) =>
      pushSeg(
        new THREE.Vector3(x, yr.min, zr.min),
        new THREE.Vector3(x, yr.min, zr.max)
      )
    );
    zs.forEach((z) =>
      pushSeg(
        new THREE.Vector3(xr.min, yr.min, z),
        new THREE.Vector3(xr.max, yr.min, z)
      )
    );

    // X = xmin face (YZ grid)
    ys.forEach((y) =>
      pushSeg(
        new THREE.Vector3(xr.min, y, zr.min),
        new THREE.Vector3(xr.min, y, zr.max)
      )
    );
    zs.forEach((z) =>
      pushSeg(
        new THREE.Vector3(xr.min, yr.min, z),
        new THREE.Vector3(xr.min, yr.max, z)
      )
    );

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geom;
  }, [showFaceGrid, xr, yr, zr, xStep, yStep, zStep]);

  return (
    <>
      <lineSegments geometry={boxLineGeom}>
        <lineBasicMaterial />
      </lineSegments>

      {faceGridGeom && (
        <lineSegments geometry={faceGridGeom}>
          <lineBasicMaterial transparent opacity={0.35} />
        </lineSegments>
      )}
    </>
  );
};
