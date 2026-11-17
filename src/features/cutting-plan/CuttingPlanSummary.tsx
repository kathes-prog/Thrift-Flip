/**
 * Owner: P3.
 *
 * TODO(P3): show the selected pattern, placed pieces and their source
 * garments, and the total used area. Show template-specific steps when the
 * pattern has prepared instructions, or a material summary for Freestyle.
 */
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { StubBanner } from '@/components/StubBanner';
import { getPattern } from '@/fixtures/patterns';
import type { Project } from '@/model/types';

export function CuttingPlanSummary({ project }: { project: Project }) {
  const mode = project.mode;
  const name =
    mode?.kind === 'pattern'
      ? (getPattern(mode.patternId)?.name ?? 'Unknown pattern')
      : mode?.kind === 'freestyle'
        ? 'Freestyle'
        : 'No design chosen';
  const placed = project.pieces.filter((p) => p.status === 'canvas');

  return (
    <Card>
      <StubBanner owner="P3" note="Summary, sources, used area and construction steps." />
      <AppText variant="heading">{name}</AppText>
      {placed.map((piece) => (
        <AppText key={piece.id}>
          {piece.displayName} ·{' '}
          {project.sources.find((s) => s.id === piece.sourceId)?.displayName ?? '?'}
        </AppText>
      ))}
    </Card>
  );
}
