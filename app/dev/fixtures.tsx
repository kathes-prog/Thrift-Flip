/**
 * Shared: load a preset project so each owner can test independently.
 */
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { presets } from '@/fixtures/presets';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export default function DevFixtures() {
  const { project, dispatch } = useProject();

  return (
    <Screen title="Dev fixtures">
      <AppText color={colors.inkMuted}>
        Current project: {project.sources.length} sources, {project.pieces.length} pieces. Loading a
        preset clears undo history.
      </AppText>
      {(['Shared', 'P1', 'P2', 'P3'] as const).map((owner) => (
        <Card key={owner}>
          <AppText variant="heading">{owner}</AppText>
          {presets
            .filter((p) => p.owner === owner)
            .map((preset) => (
              <Button
                key={preset.id}
                variant="secondary"
                label={preset.label}
                onPress={() => {
                  dispatch({ type: 'LOAD_PROJECT', project: preset.make() });
                  router.back();
                }}
              />
            ))}
        </Card>
      ))}
    </Screen>
  );
}
