import Link from 'next/link';
import { ArrowRight, ChartNoAxesCombined, UsersRound, Layers3, TrendingUp } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { number } from '@/lib/math';
import { PageHeader, EmptyState, Panel, Badge, Notice } from '@/components/ui';
import { AnalysisChart } from '@/components/charts';
export const metadata = { title: 'Analisis Variabel' };
export default async function AnalysisPage() {
  const d = await getWorkspace();
  const name = (id: string) => d.variables.find((v) => v.id === id)?.name ?? '';
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 01 · PREFERENSI PENGGUNA"
        title="Dari penilaian menjadi insight."
        description="Pahami variabel yang paling berarti melalui analisis seluruh kuesioner Anda."
        action={
          d.analysis.length > 0 && (
            <Link className="btn btn-primary" href="/top-variables">
              Lihat TOP 5<ArrowRight size={16} />
            </Link>
          )
        }
      />
      {!d.entries.length ? (
        <Panel>
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Belum ada data untuk dianalisis."
            description="Isi kuesioner terlebih dahulu untuk memulai analisis."
            href="/questionnaire"
            label="Mulai Mengisi Kuesioner"
          />
        </Panel>
      ) : (
        <>
          <div className="analysis-summary">
            <div>
              <UsersRound size={20} />
              <span>
                <strong>{d.entries.length}</strong>
                <small>Data kuesioner dianalisis</small>
              </span>
            </div>
            <div>
              <Layers3 size={20} />
              <span>
                <strong>{d.analysis.length}</strong>
                <small>Variabel kepentingan</small>
              </span>
            </div>
            <div>
              <TrendingUp size={20} />
              <span>
                <strong>
                  {number(d.analysis[0].mean, 4)} <small>/ 5</small>
                </strong>
                <small>Rata-rata tertinggi</small>
              </span>
            </div>
            <Badge tone="green">Dihitung otomatis</Badge>
          </div>
          <div className="analysis-grid">
            <Panel
              title="Perbandingan rata-rata"
              description="Sepuluh variabel · skala kepentingan 1–5"
              action={<Badge tone="purple">Data aktual</Badge>}
            >
              <AnalysisChart
                data={d.variables.map((v) => ({
                  name: `V${v.code}`,
                  label: v.name,
                  value: d.analysis.find((a) => a.variable_id === v.id)!.mean,
                  top: d.analysis.find((a) => a.variable_id === v.id)!.position <= 5,
                }))}
              />
            </Panel>
            <Panel title="Variabel paling penting" description="Lima rata-rata tertinggi">
              <div className="top-mini-list">
                {d.analysis.slice(0, 5).map((a) => (
                  <div key={a.id}>
                    <span className="rank-number">{a.position}</span>
                    <div>
                      <strong>{name(a.variable_id)}</strong>
                      <div className="mini-track">
                        <span style={{ width: `${(a.mean / 5) * 100}%` }} />
                      </div>
                    </div>
                    <b>{number(a.mean)}</b>
                  </div>
                ))}
              </div>
              <Link href="/top-variables" className="panel-bottom-link">
                Tinjau & konfirmasi TOP 5<ArrowRight size={15} />
              </Link>
            </Panel>
          </div>
          <Panel
            title="Rincian analisis variabel"
            description="Diurutkan dari rata-rata tertinggi. Angka ditampilkan hingga empat desimal."
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Variabel</th>
                    <th>Total nilai</th>
                    <th>Jumlah data</th>
                    <th>Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {d.analysis.map((a) => (
                    <tr key={a.id} className={a.position <= 5 ? 'highlight-row' : ''}>
                      <td>
                        <span className={`rank-number ${a.position === 1 ? 'first' : ''}`}>
                          {a.position}
                        </span>
                      </td>
                      <td>
                        <span className="variable-table-name">
                          <small>V{d.variables.find((v) => v.id === a.variable_id)?.code}</small>
                          {name(a.variable_id)}
                        </span>
                      </td>
                      <td>{a.total}</td>
                      <td>{a.count}</td>
                      <td>
                        <strong className={a.position <= 5 ? 'text-purple' : ''}>
                          {number(a.mean, 4)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Notice>
            <strong>Rata-rata = total nilai variabel ÷ jumlah data kuesioner.</strong> Setiap entri
            memiliki bobot yang sama. Jika rata-rata seri, urutan kode variabel (V1–V10) digunakan
            sebagai pemecah seri agar hasil konsisten, bukan sebagai bukti preferensi yang lebih
            tinggi.
          </Notice>
        </>
      )}
    </>
  );
}
