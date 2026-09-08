import Link from 'next/link';
import { Trophy, MapPin, ArrowRight, Sparkles, Medal, Calculator, Info } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { number } from '@/lib/math';
import { PageHeader, Panel, EmptyState, Badge, Notice } from '@/components/ui';
import { RankingBarChart, AssessmentRadar } from '@/components/charts';
export const metadata = { title: 'Hasil Ranking' };
export default async function RankingPage() {
  const d = await getWorkspace();
  const ready =
    d.photoboxes.length > 0 &&
    d.selected.length === 5 &&
    d.entries.length > 0 &&
    d.rankings.length === d.photoboxes.length &&
    d.photoboxes.every((p) => d.assessments.filter((a) => a.photobox_id === p.id).length === 5);
  const rows = ready
    ? d.rankings.map((r) => ({ ...r, box: d.photoboxes.find((p) => p.id === r.photobox_id)! }))
    : [];
  const best = rows[0];
  const strongest = d.selected[0];
  const variable = d.variables.find((v) => v.id === strongest?.variable_id);
  const bestValue =
    best &&
    d.assessments.find(
      (a) => a.photobox_id === best.photobox_id && a.selected_variable_id === strongest?.id,
    )?.value;
  const radar = ready
    ? d.selected.map((s) => ({
        variable: `V${d.variables.find((v) => v.id === s.variable_id)?.code}`,
        label: d.variables.find((v) => v.id === s.variable_id)?.name ?? '',
        ...Object.fromEntries(
          rows.map((r) => [
            r.photobox_id,
            d.assessments.find(
              (a) => a.photobox_id === r.photobox_id && a.selected_variable_id === s.id,
            )!.value,
          ]),
        ),
      }))
    : [];
  const tied = ready && d.has_top_tie;
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 02 · HASIL AKHIR"
        title="Pilihan terbaik, berdasarkan data."
        description="Hasil evaluasi seluruh kandidat menggunakan metode Weighted Average yang transparan."
        action={
          ready && (
            <Link href="/assessment" className="btn btn-secondary">
              Tinjau assessment
              <ArrowRight size={16} />
            </Link>
          )
        }
      />
      {!ready ? (
        <Panel>
          <EmptyState
            icon={Trophy}
            title="Ranking akan tersedia setelah assessment selesai."
            description="Konfirmasi TOP 5 dan isi seluruh lima nilai untuk setiap kandidat. Sistem tidak membuat ranking parsial."
            href="/assessment"
            label="Buka assessment"
          />
          {d.photoboxes.length > 0 && (
            <div className="ranking-missing">
              <h3>Kelengkapan kandidat</h3>
              {d.photoboxes.map((p) => {
                const count = d.assessments.filter((a) => a.photobox_id === p.id).length;
                return (
                  <div key={p.id}>
                    <span>{p.name}</span>
                    <Badge tone={count === 5 ? 'green' : 'amber'}>
                      {count === 5 ? 'Assessment lengkap' : 'Assessment belum lengkap'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      ) : (
        <>
          <section className="recommendation-card">
            <div className="recommendation-decoration">
              <Trophy size={145} strokeWidth={0.8} />
            </div>
            <div className="recommendation-content">
              <div className="recommendation-eyebrow">
                <Trophy size={17} /> PHOTO BOX TERBAIK<Badge tone="purple">Recommended</Badge>
              </div>
              <h2>{best.box.name}</h2>
              <p className="location-cell">
                <MapPin size={16} />
                {best.box.location}
              </p>
              <div className="recommendation-explanation">
                <Sparkles size={18} />
                <p>
                  <strong>{best.box.name}</strong> menjadi rekomendasi utama{' '}
                  {tied
                    ? 'dengan skor tertinggi yang seri dengan kandidat lain'
                    : 'karena memperoleh skor tertinggi'}{' '}
                  berdasarkan penilaian terhadap lima variabel yang paling dianggap penting.
                </p>
              </div>
            </div>
            <div className="recommendation-score">
              <span>SKOR AKHIR</span>
              <strong>{number(best.score, 4)}</strong>
              <small>dari skala 5</small>
              <div>
                <Medal size={15} />
                Ranking #{best.position}
              </div>
            </div>
          </section>
          {tied && (
            <Notice>
              Ada kandidat dengan skor tertinggi yang sama. Peringkat ditentukan berdasarkan waktu
              penambahan kandidat, lalu UUID. Status Recommended bukan berarti kualitasnya terbukti
              lebih tinggi dari kandidat dengan skor seri.
            </Notice>
          )}
          <div className="insight-note">
            <Info size={19} />
            <p>
              Variabel <strong>{variable?.name}</strong> memiliki bobot tertinggi
              {d.selected.filter((s) => s.weight === strongest.weight).length > 1
                ? ' (termasuk bobot yang seri)'
                : ''}
              , yaitu <strong>{number(strongest.weight * 100)}%</strong>. {best.box.name} memperoleh
              nilai <strong>{bestValue}/5</strong> pada variabel ini, menyumbang{' '}
              <strong>{number(bestValue! * strongest.weight, 4)}</strong> pada skor akhir{' '}
              <strong>{number(best.score, 4)}</strong>.
            </p>
          </div>
          <Panel
            title="Perangkingan Photo Box"
            description={`${rows.length} kandidat · berdasarkan seluruh assessment yang lengkap`}
            action={<Badge tone="green">Perhitungan aktual</Badge>}
          >
            <div className="table-scroll">
              <table className="data-table ranking-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Photo Box</th>
                    <th>Skor akhir</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={r.position === 1 ? 'highlight-row' : ''}>
                      <td>
                        <span className={`rank-number ${r.position === 1 ? 'first' : ''}`}>
                          {r.position === 1 ? <Trophy size={16} /> : r.position}
                        </span>
                      </td>
                      <td>
                        <strong>{r.box.name}</strong>
                        <small className="cell-sub">{r.box.location}</small>
                      </td>
                      <td>
                        <strong className="text-purple">{number(r.score, 4)}</strong>
                        <span className="muted"> / 5</span>
                      </td>
                      <td>
                        <Badge tone={r.position === 1 ? 'purple' : 'neutral'}>
                          {r.position === 1 ? 'Recommended' : 'Alternative'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="two-col">
            <Panel title="Perbandingan skor akhir" description="Weighted Average · skala 1–5">
              <RankingBarChart data={rows.map((r) => ({ name: r.box.name, value: r.score }))} />
            </Panel>
            <Panel
              title="Profil penilaian kandidat"
              description="Perbandingan nilai assessment pada TOP 5"
            >
              <AssessmentRadar
                data={radar}
                candidates={rows.map((r) => ({ id: r.photobox_id, name: r.box.name }))}
              />
            </Panel>
          </div>
          <Panel
            title="Transparansi perhitungan"
            description="Skor = Σ (nilai assessment × bobot variabel). Tidak ada normalisasi tambahan."
          >
            <div className="weight-formula">
              <span>
                <Calculator size={21} />
              </span>
              <p>
                Setiap kontribusi dihitung dari nilai 1–5 yang diisi Owner, dikalikan bobot
                kepentingan. Penjumlahan kontribusi menghasilkan skor akhir.
              </p>
            </div>
            <div className="calculation-list">
              {rows.map((r) => (
                <details key={r.id}>
                  <summary>
                    <span>
                      #{r.position} · {r.box.name}
                    </span>
                    <strong>
                      {number(r.score, 4)} <span className="muted">/ 5</span>
                    </strong>
                  </summary>
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Variabel aktif</th>
                          <th>Assessment</th>
                          <th>Bobot</th>
                          <th>Kontribusi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.selected.map((s) => {
                          const value = d.assessments.find(
                            (a) =>
                              a.photobox_id === r.photobox_id && a.selected_variable_id === s.id,
                          )!.value;
                          return (
                            <tr key={s.id}>
                              <td>
                                <span className="variable-code">
                                  V{d.variables.find((v) => v.id === s.variable_id)?.code}
                                </span>{' '}
                                {d.variables.find((v) => v.id === s.variable_id)?.name}
                              </td>
                              <td>{value}</td>
                              <td>{number(s.weight, 6)}</td>
                              <td>{number(value * s.weight, 6)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}>Skor akhir</td>
                          <td>{number(r.score, 6)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </Panel>
          <Notice>
            Perangkingan memakai presisi penuh di PostgreSQL, bukan angka tampilan yang dibulatkan.
            Jika skor sama persis, kandidat yang lebih dahulu ditambahkan didahulukan, lalu UUID
            sebagai pemecah seri terakhir. Hasil ini mencerminkan penilaian Owner, bukan jaminan
            kualitas objektif di luar data penelitian.
          </Notice>
        </>
      )}
    </>
  );
}
