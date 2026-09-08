import Link from 'next/link';
import { ListChecks, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { PageHeader, Panel, EmptyState, Notice, Badge } from '@/components/ui';
import { AssessmentForm } from '@/components/assessment-form';
export const metadata = { title: 'Assessment' };
export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string }>;
}) {
  const d = await getWorkspace();
  const { candidate } = await searchParams;
  const ready =
    d.entries.length > 0 &&
    d.analysis.length === 10 &&
    d.selected.length === 5 &&
    d.photoboxes.length > 0;
  const complete = d.photoboxes.filter(
    (p) => d.assessments.filter((a) => a.photobox_id === p.id).length === 5,
  ).length;
  const steps = [
    { label: 'Isi kuesioner', done: d.entries.length > 0, href: '/questionnaire' },
    { label: 'Konfirmasi TOP 5', done: d.selected.length === 5, href: '/top-variables' },
    { label: 'Tambahkan kandidat', done: d.photoboxes.length > 0, href: '/photoboxes' },
  ];
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 02 · EVALUASI KANDIDAT"
        title="Assessment Photo Box"
        description="Nilai setiap kandidat berdasarkan lima variabel yang paling penting bagi pengguna."
        action={
          ready && (
            <Link className="btn btn-secondary" href="/ranking">
              Lihat ranking
              <ArrowRight size={16} />
            </Link>
          )
        }
      />
      {ready ? (
        <>
          <div className="assessment-summary">
            <div>
              <ListChecks size={20} />
              <span>
                <strong>
                  {complete > 0
                    ? `${complete} dari ${d.photoboxes.length} kandidat selesai`
                    : 'Belum ada assessment tersimpan'}
                </strong>
                <small>Ranking tersedia setelah seluruh kandidat dinilai lengkap.</small>
              </span>
            </div>
            <Badge tone="green">TOP 5 terkonfirmasi</Badge>
          </div>
          <AssessmentForm
            key={
              d.selected.map((s) => s.id).join(',') +
              d.photoboxes.map((p) => p.id + p.updated_at).join(',')
            }
            photoboxes={d.photoboxes}
            selected={d.selected}
            variables={d.variables}
            assessments={d.assessments}
            candidate={candidate}
          />
          <Notice>
            Skala assessment: 1 = Sangat Kurang, 2 = Kurang, 3 = Cukup, 4 = Baik, 5 = Sangat Baik.
            Semakin tinggi nilai, semakin baik kualitas kandidat pada variabel tersebut. Harga
            dinilai sebagai kesesuaian harga, bukan otomatis semakin mahal semakin baik.
          </Notice>
        </>
      ) : (
        <Panel>
          <EmptyState
            icon={ListChecks}
            title="Tambahkan kandidat dan selesaikan analisis terlebih dahulu."
            description="Assessment baru dapat digunakan setelah seluruh prasyarat di bawah terpenuhi."
          />
          <div className="prerequisite-list">
            {steps.map((s) => (
              <Link href={s.href} key={s.label}>
                {s.done ? <CheckCircle2 className="text-green" size={21} /> : <Circle size={21} />}
                <span>{s.label}</span>
                <Badge tone={s.done ? 'green' : 'neutral'}>
                  {s.done ? 'Selesai' : 'Diperlukan'}
                </Badge>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
