/**
 * Owner: P3. Review the chosen design and save the project on the device.
 */
import { Alert } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { CuttingPlanSummary } from '@/features/cutting-plan/CuttingPlanSummary';
import { saveProject } from '@/storage/projectStore';
import { useProject } from '@/state/ProjectContext';

export default function CuttingPlan() {
  const { project } = useProject();

  async function save() {
    try {
      await saveProject(project);
      Alert.alert('Saved', 'Your project is saved on this iPhone.');
    } catch (e) {
      Alert.alert('Not saved', String(e));
    }
  }

  return (
    <Screen title="Cutting Plan">
      <CuttingPlanSummary project={project} />
      <Button label="Save project" icon="save" onPress={save} />
    </Screen>
  );
}
