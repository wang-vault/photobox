import { notFound } from 'next/navigation';
import { getWorkspace } from '@/lib/data';
import { PageHeader } from '@/components/ui';
import { QuestionnaireForm } from '@/components/questionnaire-form';
export const metadata = { title: 'Isi Kuesioner' };
export default async function QuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const data = await getWorkspace();
  const { edit } = await searchParams;
  const entry = edit ? data.entries.find((e) => e.id === edit) : undefined;
  if (edit && !entry) notFound();
  const initial: Record<string, number> = {};
  entry?.questionnaire_scores.forEach((s) => {
    const v = data.variables.find((v) => v.id === s.variable_id);
    if (v) initial[String(v.code)] = s.value;
  });
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 01 · PREFERENSI PENGGUNA"
        title={entry ? 'Edit kuesioner' : 'Suara Anda, dasar keputusan.'}
        description="Beri penilaian pada 10 variabel untuk memahami hal yang paling penting dalam memilih Photo Box."
      />
      <QuestionnaireForm
        key={entry?.id ?? 'new'}
        initial={initial}
        id={entry?.id}
        updatedAt={entry?.updated_at}
        invalidates={data.selected.length > 0}
      />
    </>
  );
}
