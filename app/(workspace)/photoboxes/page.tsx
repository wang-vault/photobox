import { getWorkspace } from '@/lib/data';
import { PhotoBoxManager } from '@/components/photobox-manager';
export const metadata = { title: 'Kandidat Photo Box' };
export default async function PhotoBoxesPage() {
  const d = await getWorkspace();
  return <PhotoBoxManager photoboxes={d.photoboxes} assessments={d.assessments} />;
}
