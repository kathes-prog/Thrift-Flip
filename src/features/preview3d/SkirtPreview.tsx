import { Canvas, useFrame } from '@react-three/fiber/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { pieceToDesign } from '@/geometry/transform';
import type { Project } from '@/model/types';

// Set to false if the screen goes blank, to test without the pieces
const SHOW_PIECES = true;

const R_TOP = 1.0;
const R_BOTTOM = 1.8;
const HEIGHT = 2.5;
const SURFACE_OFFSET = 0.01;
const MAX_EDGE_CM = 4;
const MAX_DEPTH = 8;

type P = { x: number; y: number };

// Design space: x 0-100 wraps around the skirt, y 0-100 goes top to hem.
// x = 25 is the middle of the front, x = 75 is the middle of the back.
function projectToCone(x: number, y: number, out: number[]) {
  const theta = ((x - 25) / 100) * Math.PI * 2;
  const v = Math.min(1, Math.max(0, y / 100));
  const r = R_TOP + v * (R_BOTTOM - R_TOP) + SURFACE_OFFSET;
  out.push(r * Math.sin(theta), HEIGHT / 2 - v * HEIGHT, r * Math.cos(theta));
}

const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Cut big triangles into small ones so they bend around the cone
function subdivide(a: P, b: P, c: P, tris: P[][], depth: number) {
  const ab = dist(a, b);
  const bc = dist(b, c);
  const ca = dist(c, a);
  const m = Math.max(ab, bc, ca);
  if (!isFinite(m)) return;
  if (m <= MAX_EDGE_CM || depth >= MAX_DEPTH) {
    tris.push([a, b, c]);
    return;
  }
  if (m === ab) {
    const d = mid(a, b);
    subdivide(a, d, c, tris, depth + 1);
    subdivide(d, b, c, tris, depth + 1);
  } else if (m === bc) {
    const d = mid(b, c);
    subdivide(a, b, d, tris, depth + 1);
    subdivide(a, d, c, tris, depth + 1);
  } else {
    const d = mid(c, a);
    subdivide(a, b, d, tris, depth + 1);
    subdivide(d, b, c, tris, depth + 1);
  }
}

function buildPieceGeometry(poly: P[]): THREE.BufferGeometry | null {
  const pts = poly.filter((p) => isFinite(p.x) && isFinite(p.y));
  if (pts.length > 1) {
    const f = pts[0]!;
    const l = pts[pts.length - 1]!;
    if (f.x === l.x && f.y === l.y) pts.pop();
  }
  if (pts.length < 3) return null;

  let triIndexes: number[][] = [];
  try {
    triIndexes = THREE.ShapeUtils.triangulateShape(
      pts.map((p) => new THREE.Vector2(p.x, p.y)),
      []
    );
  } catch (e) {
    triIndexes = [];
  }
  if (triIndexes.length === 0) {
    // fallback: simple fan (fine for rectangles and other convex shapes)
    for (let i = 1; i < pts.length - 1; i++) triIndexes.push([0, i, i + 1]);
  }

  const tris: P[][] = [];
  for (const t of triIndexes) {
    const a = pts[t[0]!];
    const b = pts[t[1]!];
    const c = pts[t[2]!];
    if (a && b && c) subdivide(a, b, c, tris, 0);
  }
  if (tris.length === 0) return null;

  const positions: number[] = [];
  for (const t of tris) {
    for (const p of t) projectToCone(p.x, p.y, positions);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function PlacedPieces({ project }: { project: Project }) {
  const items = useMemo(() => {
    const result: { id: string; color: string; geometry: THREE.BufferGeometry }[] = [];
    if (!SHOW_PIECES) return result;
    for (const piece of project.pieces) {
      if (piece.status !== 'canvas') continue;
      try {
        const poly = pieceToDesign(piece) as P[] | undefined;
        if (!poly) continue;
        const geometry = buildPieceGeometry(poly);
        if (geometry) {
          result.push({ id: piece.id, color: piece.color || '#4d718a', geometry });
        }
      } catch (e) {
        console.log('3D piece failed:', piece.id, e);
      }
    }
    return result;
  }, [project.pieces]);

  useEffect(() => {
    return () => {
      items.forEach((i) => i.geometry.dispose());
    };
  }, [items]);

  return (
    <>
      {items.map((i) => (
        <mesh key={i.id} geometry={i.geometry}>
          <meshBasicMaterial color={i.color} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

type Ref<T> = { current: T };

function SceneContent({
  project,
  isDragging,
  dragOffset,
}: {
  project: Project;
  isDragging: Ref<boolean>;
  dragOffset: Ref<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const baseRotation = useRef(0);
  const wasDragging = useRef(false);

  useFrame((_state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (isDragging.current) {
      wasDragging.current = true;
      g.rotation.y = baseRotation.current + dragOffset.current;
    } else {
      if (wasDragging.current) {
        baseRotation.current += dragOffset.current;
        dragOffset.current = 0;
        wasDragging.current = false;
      }
      baseRotation.current += delta * 0.4;
      g.rotation.y = baseRotation.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* faint skirt outline */}
      <mesh>
        <cylinderGeometry args={[R_TOP, R_BOTTOM, HEIGHT, 32, 1, true]} />
        <meshBasicMaterial color="#9aa7b4" wireframe />
      </mesh>
      <PlacedPieces project={project} />
    </group>
  );
}

export function SkirtPreview({ project }: { project: Project }) {
  const isDragging = useRef(false);
  const dragOffset = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
      },
      onPanResponderMove: (_e, g) => {
        dragOffset.current = g.dx * 0.01;
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
        {ready && (
          <Canvas
            style={{ flex: 1 }}
            camera={{ position: [0, 0.6, 6], fov: 50 }}
            onCreated={(s) => {
              s.gl.setClearColor('#f5f3ed');
              s.camera.lookAt(0, 0, 0);
              console.log('R3F created, size:', s.size);
            }}
          >
            <SceneContent
              project={project}
              isDragging={isDragging}
              dragOffset={dragOffset}
            />
          </Canvas>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvasWrapper: { flex: 1, backgroundColor: '#f5f3ed' },
});