/**
 * Owner: P3. Review the chosen design and save the project on the device.
 */
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { CuttingPlanSummary } from '@/features/cutting-plan/CuttingPlanSummary';
import { saveProject } from '@/storage/projectStore';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export default function CuttingPlan() {
  const { project } = useProject();
  const alert = useZineAlert();

  async function save() {
    try {
      await saveProject(project);
      alert('Saved', 'Your project is saved on this iPhone.');
    } catch (e) {
      alert('Not saved', String(e));
    }
  }

  return (
    <Screen
      kicker="Step 4/4"
      title="Cutting plan"
      highlight="plan"
      footer={
        <>
          <Button label="Save to this iPhone" icon="save" onPress={save} />
          <AppText variant="caption" color={colors.inkMuted}>
            Saves the project and its photos on your phone.
          </AppText>
        </>
      }
    >
      <CuttingPlanSummary project={project} />
    </Screen>
  );
}
