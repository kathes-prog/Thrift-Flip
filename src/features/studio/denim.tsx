/**
 * Owner: P2. A diagonal twill texture laid over a piece's colour so fabric
 * reads as denim, on the canvas and in the tray cards.
 */
import { Defs, Line, Pattern } from 'react-native-svg';

interface DenimDefsProps {
  id: string;
  /** Distance between twill lines, in the Svg's own units. */
  spacing: number;
}

export function DenimDefs({ id, spacing }: DenimDefsProps) {
  return (
    <Defs>
      <Pattern
        id={id}
        patternUnits="userSpaceOnUse"
        width={spacing}
        height={spacing}
        patternTransform="rotate(40)"
      >
        <Line
          x1={0}
          y1={0}
          x2={0}
          y2={spacing}
          stroke="#FFFFFF"
          strokeOpacity={0.22}
          strokeWidth={spacing * 0.28}
        />
      </Pattern>
    </Defs>
  );
}
