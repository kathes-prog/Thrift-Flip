/**
 * Shared contract: the project data model.
 *
 * Changing this file needs review from all three owners (see CODEOWNERS).
 * Put contract changes in their own small pull request.
 */
import type { Cm, Cm2, Point, Polygon } from './units';

export const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------- sources

export type SourceType = 'original-garment' | 'additional-garment' | 'scrap';

export interface MaterialSource {
  id: string;
  displayName: string;
  type: SourceType;
  /**
   * Path RELATIVE to the app's document directory, e.g. "images/<uuid>.jpg".
   * Null for fixture sources that have no photo yet.
   * Intake (P1) copies picked photos there; storage (P3) saves this path as-is.
   */
  photoPath: string | null;
  /** Colour used to draw this source's pieces in 2D and 3D. */
  shade: string;
  /** True when inventory came from the sample analysis, not a real scan. */
  isSampleAnalysis: boolean;
  /** Scraps only: the measured size the user typed in. */
  measured?: { widthCm: Cm; lengthCm: Cm };
}

// ---------------------------------------------------------------- pieces

export type PieceStatus = 'tray' | 'canvas' | 'stored' | 'discarded';

export type PieceCategory =
  | 'front-leg-panel'
  | 'back-leg-panel'
  | 'waistband'
  | 'back-pocket'
  | 'back-yoke'
  | 'belt-loop-strip'
  | 'panel'
  | 'pocket'
  | 'scrap'
  | 'fragment';

export interface FabricPiece {
  /** Unique per piece. A cut gives each fragment a new id. */
  id: string;
  sourceId: string;
  /** The physical piece this came from. Fragments keep their parent's value. */
  originalPieceId: string;
  displayName: string;
  category: PieceCategory;
  /** Outline in the piece's LOCAL design coordinates (cm), centred near the origin. */
  polygon: Polygon;
  /** Physical area in cm². Fragments take a share of the parent's area by polygon area. */
  areaCm2: Cm2;
  color: string;
  /** Centre of the piece in design (guide) coordinates, cm. Meaningful when on the canvas. */
  position: Point;
  rotationDeg: number;
  /** Mirrored across the piece's local vertical axis. Applied before rotation. */
  flipped: boolean;
  status: PieceStatus;
  /** Stitch (post-demo): pieces sharing a groupId move together. */
  groupId?: string;
}

// ---------------------------------------------------------------- patterns

export type GuideSurface = 'front' | 'back';

export interface GuideRegion {
  /** Shared by the 2D guide (P2) and the 3D preview (P3). Never rename casually. */
  id: string;
  label: string;
  /** Region outline in design coordinates (cm). */
  polygon: Polygon;
  /** Which side of the 3D model this region maps to, when the pattern has a preview. */
  surface?: GuideSurface;
}

export interface Pattern {
  id: string;
  name: string;
  estimatedAreaCm2: Cm2;
  /** Size of the guide canvas in design units (cm). */
  canvas: { widthCm: Cm; heightCm: Cm };
  guideRegions: GuideRegion[];
  /** Template-specific construction steps, when prepared. */
  instructions?: string[];
  /** Only the skirt has a 3D preview for the mentor demo. */
  has3dPreview: boolean;
}

// ---------------------------------------------------------------- project

export type DesignMode = { kind: 'pattern'; patternId: string } | { kind: 'freestyle' };

export interface Project {
  id: string;
  schemaVersion: typeof SCHEMA_VERSION;
  /** Ordered: original garment first. At most one additional garment. */
  sources: MaterialSource[];
  pieces: FabricPiece[];
  /** Null until the user picks a pattern or Freestyle. */
  mode: DesignMode | null;
}

/**
 * Not part of Project: selection and in-progress gestures live in local UI
 * state inside the Studio, never in the reducer.
 */
