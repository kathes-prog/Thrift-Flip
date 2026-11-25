/**
 * Owner: P2. A photocopy halftone laid over a piece's colour so fabric reads
 * as a printed cut-out in the Zine look, on the canvas and in the tray cards.
 * (The export keeps its old name so callers don't change.)
 */
import { Circle, Defs, Pattern } from 'react-native-svg';

interface DenimDefsProps {
  id: string;
  /** Distance between halftone dots, in the Svg's own units. */
  spacing: number;
}

export function DenimDefs({ id, spacing }: DenimDefsProps) {
  return (
    <Defs>
      <Pattern id={id} patternUnits="userSpaceOnUse" width={spacing} height={spacing}>
        <Circle
          cx={spacing / 2}
          cy={spacing / 2}
          r={spacing * 0.24}
          fill="#000000"
          fillOpacity={0.28}
        />
      </Pattern>
    </Defs>
  );
}
