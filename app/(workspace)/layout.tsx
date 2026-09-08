import { getWorkspace } from '@/lib/data';
import { Shell } from '@/components/shell';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const data = await getWorkspace();
  return <Shell name={data.profile.full_name}>{children}</Shell>;
}
