/**
 * Shared: app icons.
 *
 * TODO(skeleton): replace these placeholder glyphs with the custom icons from
 * the Figma Make prototype (export as SVG paths on a 24 × 24 grid). Keep the
 * names stable so screens don't need to change.
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from './tokens';

export const iconNames = [
  'photo',
  'garment',
  'pattern',
  'scrap',
  'move',
  'cut',
  'rotate',
  'flip',
  'color',
  'undo',
  'redo',
  'resize',
  'stitch',
  'layers',
  'back',
  'store',
  'restore',
  'discard',
  'add',
  'cube',
  'save',
] as const;

export type IconName = (typeof iconNames)[number];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = colors.ink }: IconProps) {
  const stroke = { stroke: color, strokeWidth: 2, fill: 'none' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={`${name} icon`}>
      {glyph(name, stroke)}
    </Svg>
  );
}

type StrokeProps = { stroke: string; strokeWidth: number; fill: 'none' };

function glyph(name: IconName, s: StrokeProps) {
  switch (name) {
    case 'photo':
      return (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={2} {...s} />
          <Circle cx={12} cy={12} r={3.5} {...s} />
        </>
      );
    case 'garment':
      return <Path d="M8 3h8l3 6h-3v12H8V9H5z" {...s} />;
    case 'pattern':
      return <Path d="M4 4h16v16H4zM4 12h16M12 4v16" {...s} strokeDasharray="3 2" />;
    case 'scrap':
      return <Path d="M5 6l12-2 2 12-13 3z" {...s} />;
    case 'move':
      return (
        <Path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" {...s} />
      );
    case 'cut':
      return (
        <>
          <Circle cx={6} cy={18} r={3} {...s} />
          <Circle cx={18} cy={18} r={3} {...s} />
          <Path d="M8 16L19 4M16 16L5 4" {...s} />
        </>
      );
    case 'rotate':
      return <Path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" {...s} />;
    case 'flip':
      return <Path d="M12 3v18M9 7L4 17h5zM15 7l5 10h-5z" {...s} />;
    case 'color':
      return (
        <>
          <Path
            d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"
            {...s}
          />
          <Circle cx={7.5} cy={11} r={1.2} {...s} />
          <Circle cx={10} cy={7} r={1.2} {...s} />
          <Circle cx={15} cy={7.5} r={1.2} {...s} />
        </>
      );
    case 'undo':
      return <Path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" {...s} />;
    case 'redo':
      return <Path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" {...s} />;
    case 'resize':
      return <Path d="M4 20L20 4M13 4h7v7M4 13v7h7" {...s} />;
    case 'stitch':
      return (
        <>
          <Rect x={3} y={7} width={7} height={10} rx={1} {...s} />
          <Rect x={14} y={7} width={7} height={10} rx={1} {...s} />
          <Path d="M10 10h4M10 14h4" {...s} />
        </>
      );
    case 'layers':
      return <Path d="M12 3l9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" {...s} />;
    case 'back':
      return <Path d="M15 4l-8 8 8 8" {...s} />;
    case 'store':
      return <Path d="M3 8h18v12H3zM3 8l2-4h14l2 4M9 12h6" {...s} />;
    case 'restore':
      return <Path d="M3 8h18v12H3zM12 17v-6M9 14l3-3 3 3" {...s} />;
    case 'discard':
      return <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...s} />;
    case 'add':
      return <Path d="M12 5v14M5 12h14" {...s} />;
    case 'cube':
      return <Path d="M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7" {...s} />;
    case 'save':
      return <Path d="M5 3h11l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7" {...s} />;
  }
}
