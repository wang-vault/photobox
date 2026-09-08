import Link from 'next/link';
import { Star, ArrowRight, LockKeyhole, CheckCircle2, Sigma } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { number, normalizeWeights, date } from '@/lib/math';
import { PageHeader, Panel, Badge, Notice, EmptyState } from '@/components/ui';
import { ConfirmTopButton } from '@/components/mutations';
export const metadata = { title: 'TOP 5 Variabel' };
export default async function TopVariablesPage() {
  const d = await getWorkspace();
  const top = d.analysis.slice(0, 5);
  const confirmed = d.selected.length === 5;
  const weights = confirmed
    ? d.selected.map((s) => s.weight)
    : top.length === 5
      ? normalizeWeights(top.map((a) => a.mean))
      : [];
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 01 · SELEKSI VARIABEL"
        title="Fokus pada yang paling penting."
        description="Lima variabel dengan rata-rata tertinggi menjadi dasar penilaian kandidat Photo Box."
        action={
          top.length === 5 && <ConfirmTopButton ids={top.map((a) => a.id)} confirmed={confirmed} />
        }
      />
      {top.length !== 5 ? (
        <Panel>
          <EmptyState
            icon={Star}
            title="TOP 5 belum tersedia."
            description="TOP 5 variabel akan tersedia setelah data kuesioner dianalisis."
            href="/questionnaire"
            label="Mulai Mengisi Kuesioner"
          />
        </Panel>
      ) : (
        <>
          {confirmed ? (
            <div className="confirmation-banner">
              <CheckCircle2 size={23} />
              <div>
                <strong>TOP 5 telah dikonfirmasi</strong>
                <p>
                  Disimpan {date(d.selected[0].created_at)} · Hanya lima variabel ini digunakan
                  dalam assessment.
                </p>
              </div>
              <Link href="/assessment" className="btn btn-secondary">
                Lanjut assessment
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <Notice>
              <strong>Tinjau sebelum melanjutkan.</strong> Konfirmasi TOP 5 untuk menyimpan variabel
              aktif dan bobotnya ke database. Lima variabel lain tidak akan digunakan dalam ranking.
            </Notice>
          )}
          <div className="top-five-grid">
            {top.map((a, i) => {
              const v = d.variables.find((v) => v.id === a.variable_id)!;
              return (
                <div className={`panel top-five-card ${i === 0 ? 'top-winner' : ''}`} key={a.id}>
                  <div className="top-five-label">
                    <span>TOP {a.position}</span>
                    <Star size={17} fill={i === 0 ? 'currentColor' : 'none'} />
                  </div>
                  <span className="variable-code">V{v.code}</span>
                  <h2>{v.name}</h2>
                  <div className="top-five-score">
                    <strong>{number(a.mean, 4)}</strong>
                    <span>/ 5</span>
                  </div>
                  <small>Rata-rata kepentingan</small>
                  <div className="top-five-bottom">
                    {confirmed ? <LockKeyhole size={12} /> : <Star size={12} />}
                    <span>{confirmed ? 'Variabel aktif' : 'Menunggu konfirmasi'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Panel
            title="Perhitungan bobot variabel"
            description={
              confirmed
                ? 'Bobot aktif tersimpan di database. Tidak dibulatkan sebelum perhitungan skor.'
                : 'Pratinjau matematis dari data kuesioner aktual. Bobot disimpan saat konfirmasi.'
            }
            action={
              <Badge tone={confirmed ? 'green' : 'amber'}>
                {confirmed ? 'Bobot aktif' : 'Belum dikonfirmasi'}
              </Badge>
            }
          >
            <div className="weight-formula">
              <span>
                <Sigma size={20} />
              </span>
              <div>
                <strong>Bobot variabel = rata-rata variabel ÷ jumlah rata-rata TOP 5</strong>
                <p>
                  Jumlah rata-rata TOP 5:{' '}
                  <b>
                    {number(
                      top.reduce((s, a) => s + a.mean, 0),
                      4,
                    )}
                  </b>
                </p>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variabel</th>
                    <th>Rata-rata</th>
                    <th>Bobot</th>
                    <th>Persentase bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((a, i) => (
                    <tr key={a.id}>
                      <td>{d.variables.find((v) => v.id === a.variable_id)?.name}</td>
                      <td>{number(a.mean, 4)}</td>
                      <td className="mono">{number(weights[i], 6)}</td>
                      <td>
                        <div className="weight-cell">
                          <div className="mini-track">
                            <span style={{ width: `${weights[i] * 100}%` }} />
                          </div>
                          <strong>{number(weights[i] * 100)}%</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total bobot</td>
                    <td>
                      {number(
                        weights.reduce((s, w) => s + w, 0),
                        6,
                      )}
                    </td>
                    <td>{number(weights.reduce((s, w) => s + w, 0) * 100)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>
          <Notice>
            Angka yang terlihat dibulatkan untuk keterbacaan; perhitungan menggunakan presisi
            database. Sisa presisi desimal diberikan pada bobot kelima sehingga jumlah bobot
            tersimpan tepat 1. Jika nilai rata-rata seri, kode variabel terkecil didahulukan.
            Perubahan kuesioner membatalkan konfirmasi dan assessment lama.
          </Notice>
        </>
      )}
    </>
  );
}
