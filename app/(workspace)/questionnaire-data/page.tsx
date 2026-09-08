import Link from 'next/link';
import { Plus, Database } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { PageHeader, Panel, EmptyState, Notice } from '@/components/ui';
import { QuestionnaireTable } from '@/components/questionnaire-table';
export const metadata = { title: 'Data Kuesioner' };
export default async function QuestionnaireDataPage() {
  const d = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 01 · PREFERENSI PENGGUNA"
        title="Data kuesioner"
        description="Semua penilaian dalam satu tempat. Tinjau, perbarui, dan kelola data penelitian Anda."
        action={
          <Link href="/questionnaire" className="btn btn-primary">
            <Plus size={17} />
            Isi Kuesioner
          </Link>
        }
      />
      <Panel
        title="Entri kuesioner"
        description="Penilaian asli yang dimasukkan melalui workspace Anda."
      >
        {d.entries.length ? (
          <QuestionnaireTable entries={d.entries} variables={d.variables} />
        ) : (
          <EmptyState
            icon={Database}
            title="Belum ada data kuesioner."
            description="Mulai dengan satu entri penilaian. Setiap kuesioner yang disimpan akan muncul di sini."
            href="/questionnaire"
            label="Mulai Mengisi Kuesioner"
          />
        )}
      </Panel>
      {d.entries.length > 0 && (
        <>
          <div className="panel variable-legend">
            <h3>Panduan variabel</h3>
            <div>
              {d.variables.map((v) => (
                <p key={v.id}>
                  <span>V{v.code}</span>
                  {v.name}
                </p>
              ))}
            </div>
          </div>
          <Notice>
            Mengedit atau menghapus kuesioner akan menghitung ulang analisis dan membatalkan
            konfirmasi TOP 5 serta assessment lama.
          </Notice>
        </>
      )}
    </>
  );
}
