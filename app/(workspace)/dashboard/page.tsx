import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  ClipboardList,
  Camera,
  ChartNoAxesCombined,
  Star,
  Trophy,
  Check,
  Circle,
  Sparkles,
  Clock3,
  ShieldCheck,
  Layers3,
} from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { date, number } from '@/lib/math';
import { PageHeader, Panel, EmptyState, Badge, StepTrack } from '@/components/ui';
export const metadata = { title: 'Dashboard' };
export default async function DashboardPage() {
  const d = await getWorkspace();
  const hasData = d.entries.length > 0;
  const hasTop = d.selected.length === 5;
  const ranked = d.rankings.length > 0;
  const complete = d.photoboxes.filter(
    (p) => d.assessments.filter((a) => a.photobox_id === p.id).length === 5,
  ).length;
  const active = ranked ? 3 : hasTop ? 2 : hasData ? 1 : 0;
  const stats = [
    {
      title: 'Data kuesioner',
      value: hasData ? String(d.entries.length) : '—',
      suffix: hasData ? 'entri' : '',
      text: hasData ? 'Tersimpan dan dianalisis' : 'Belum ada data kuesioner',
      icon: ClipboardList,
      tone: 'purple',
      href: '/questionnaire-data',
    },
    {
      title: 'Analisis variabel',
      value: d.analysis.length ? 'Selesai' : 'Belum tersedia',
      suffix: '',
      text: d.analysis.length
        ? `${d.analysis.length} variabel telah dianalisis`
        : 'Menunggu data kuesioner',
      icon: ChartNoAxesCombined,
      tone: 'blue',
      href: '/analysis',
    },
    {
      title: 'Kandidat Photo Box',
      value: d.photoboxes.length ? String(d.photoboxes.length) : '—',
      suffix: d.photoboxes.length ? 'kandidat' : '',
      text: d.photoboxes.length
        ? complete
          ? `${complete} kandidat sudah dinilai`
          : 'Belum ada assessment lengkap'
        : 'Belum ada kandidat ditambahkan',
      icon: Camera,
      tone: 'pink',
      href: '/photoboxes',
    },
    {
      title: 'Status ranking',
      value: ranked ? 'Tersedia' : 'Belum tersedia',
      suffix: '',
      text: ranked ? 'Seluruh assessment lengkap' : 'Menunggu assessment lengkap',
      icon: Trophy,
      tone: 'amber',
      href: '/ranking',
    },
  ];
  const steps = [
    {
      title: 'Isi kuesioner preferensi',
      description: 'Nilai kepentingan 10 variabel dengan skala Likert.',
      done: hasData,
      href: '/questionnaire',
    },
    {
      title: 'Analisis & konfirmasi TOP 5',
      description: 'Pilih lima variabel terpenting berdasarkan rata-rata.',
      done: hasTop,
      href: '/top-variables',
    },
    {
      title: 'Tambahkan & nilai kandidat',
      description: 'Evaluasi Photo Box menggunakan variabel aktif.',
      done: complete > 0 && complete === d.photoboxes.length,
      href: '/assessment',
    },
    {
      title: 'Temukan Photo Box terbaik',
      description: 'Lihat ranking dan rekomendasi dari data Anda.',
      done: ranked,
      href: '/ranking',
    },
  ];
  const activities = [
    ...d.entries.map((e) => ({
      id: e.id,
      title: `Kuesioner #${e.id.slice(0, 8)}`,
      description: 'Entri penilaian disimpan',
      timestamp: e.updated_at,
      href: '/questionnaire-data',
      icon: ClipboardList,
    })),
    ...d.photoboxes.map((p) => ({
      id: p.id,
      title: p.name,
      description: 'Informasi kandidat disimpan',
      timestamp: p.updated_at,
      href: '/photoboxes',
      icon: Camera,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4);
  const best = d.rankings[0];
  const bestBox = d.photoboxes.find((p) => p.id === best?.photobox_id);
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title={`Selamat datang, ${d.profile.full_name.split(' ')[0]}.`}
        description="Setiap penilaian membawa Anda lebih dekat pada pilihan terbaik."
        action={
          <Link className="btn btn-secondary" href="/photoboxes">
            <Plus size={16} />
            Tambah Photo Box
          </Link>
        }
      />
      <section className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-label">
            <Sparkles size={14} /> YOUR DATA, BETTER DECISIONS
          </span>
          <h2>
            {ranked
              ? 'Rekomendasi Anda sudah siap.'
              : hasData
                ? 'Lanjutkan perjalanan analisis Anda.'
                : 'Pilihan terbaik dimulai dari Anda.'}
          </h2>
          <p>
            {ranked
              ? 'Seluruh kandidat telah dinilai. Temukan Photo Box terbaik dari hasil penilaian dan perhitungan yang transparan.'
              : 'Kenali preferensi, evaluasi kandidat, dan temukan Photo Box terbaik. Satu alur sederhana, sepenuhnya berdasarkan data.'}
          </p>
          <Link
            className="btn btn-white"
            href={
              ranked
                ? '/ranking'
                : hasTop
                  ? '/assessment'
                  : hasData
                    ? '/top-variables'
                    : '/questionnaire'
            }
          >
            {ranked
              ? 'Lihat hasil ranking'
              : hasTop
                ? 'Lanjutkan assessment'
                : hasData
                  ? 'Tinjau TOP 5 variabel'
                  : 'Mulai Mengisi Kuesioner'}
            <ArrowRight size={16} />
          </Link>
          <span className="hero-footnote">
            <ShieldCheck size={12} />
            Penilaian nyata. Hasil yang transparan.
          </span>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          <div className="hero-icon">
            <Camera size={46} strokeWidth={1.2} />
            <Sparkles size={20} />
          </div>
          <span className="hero-float float-a">
            <ChartNoAxesCombined size={22} />
          </span>
          <span className="hero-float float-b">
            <Trophy size={24} />
          </span>
          <span className="hero-float float-c">
            <Star size={15} />
          </span>
          <span className="hero-art-label">
            <Layers3 size={13} />
            From insight to impact
          </span>
        </div>
      </section>
      <div className="section-title">
        <h2>Ringkasan workspace</h2>
        <span>
          <span className="tiny-dot" /> Diperbarui dari data Anda
        </span>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <Link className="panel stat-card" href={s.href} key={s.title}>
            <div className="stat-label">
              <span className={`stat-icon ${s.tone}`}>
                <s.icon size={18} />
              </span>
              <ArrowUpRight size={15} />
            </div>
            <p>{s.title}</p>
            <div className={`stat-value ${s.value.length > 5 ? 'text-value' : ''}`}>
              {s.value}
              <small>{s.suffix}</small>
            </div>
            <span className="stat-description">{s.text}</span>
          </Link>
        ))}
      </div>
      <div className="section-title">
        <h2>Perjalanan evaluasi Anda</h2>
        <div className="status-chip-row">
          <Badge tone={hasTop ? 'green' : hasData ? 'amber' : 'neutral'}>
            <Star size={11} />
            {hasTop
              ? 'TOP 5 terkonfirmasi'
              : hasData
                ? 'TOP 5 menunggu konfirmasi'
                : 'TOP 5 belum tersedia'}
          </Badge>
          <Badge tone={ranked ? 'green' : 'purple'}>
            {ranked ? 'Evaluasi lengkap' : `Tahap ${active + 1} dari 4`}
          </Badge>
        </div>
      </div>
      <StepTrack active={active} />
      <div className="dashboard-grid">
        <Panel
          title={bestBox ? 'Rekomendasi utama' : 'Insight preferensi'}
          description={
            bestBox
              ? 'Hasil penilaian semua kandidat Photo Box.'
              : 'Hal yang paling penting bagi pengguna.'
          }
          action={
            <Link className="text-link" href={bestBox ? '/ranking' : '/analysis'}>
              Lihat detail
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          {bestBox ? (
            <div className="dashboard-winner">
              <div className="winner-icon">
                <Trophy size={33} />
              </div>
              <Badge tone="purple">Recommended</Badge>
              <h3>{bestBox.name}</h3>
              <p>{bestBox.location}</p>
              <strong>
                {number(best.score, 4)}
                <small> / 5</small>
              </strong>
              <Link href="/ranking" className="text-link">
                Lihat perhitungan lengkap
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : hasData ? (
            <div className="dashboard-top">
              <div className="top-mini-list">
                {d.analysis.slice(0, 5).map((a) => (
                  <div key={a.id}>
                    <span className="rank-number">{a.position}</span>
                    <div>
                      <strong>{d.variables.find((v) => v.id === a.variable_id)?.name}</strong>
                      <div className="mini-track">
                        <span style={{ width: `${(a.mean / 5) * 100}%` }} />
                      </div>
                    </div>
                    <b>{number(a.mean)}</b>
                  </div>
                ))}
              </div>
              <div className="top-status">
                <Star size={16} />
                <span>
                  {hasTop
                    ? 'TOP 5 telah dikonfirmasi untuk assessment.'
                    : 'TOP 5 tersedia. Konfirmasi untuk memulai assessment.'}
                </span>
                <Link href="/top-variables">
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="Belum ada data kuesioner."
              description="Insight dan TOP 5 variabel akan muncul setelah Anda mengisi kuesioner pertama."
              href="/questionnaire"
              label="Isi kuesioner pertama"
              compact
            />
          )}
        </Panel>
        <Panel
          title="Langkah menuju pilihan terbaik"
          description="Alur sederhana, hasil yang dapat dijelaskan."
        >
          <div className="journey-list">
            {steps.map((s, i) => (
              <Link key={s.title} href={s.href}>
                <span
                  className={`journey-number ${s.done ? 'done' : i === active ? 'current' : ''}`}
                >
                  {s.done ? <Check size={15} /> : String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.description}</p>
                </div>
                {s.done ? <Check size={15} className="text-green" /> : <ArrowUpRight size={16} />}
              </Link>
            ))}
          </div>
          <div className="journey-footer">
            <Circle size={12} />
            Tidak ada data otomatis. Anda memegang kendali.
          </div>
        </Panel>
      </div>
      <Panel
        title="Aktivitas terbaru"
        description="Entri kuesioner dan kandidat yang terakhir disimpan."
        action={<Clock3 size={18} className="muted" />}
      >
        {activities.length ? (
          <div className="activity-list">
            {activities.map((a) => (
              <Link href={a.href} key={a.id}>
                <span className="activity-icon">
                  <a.icon size={18} />
                </span>
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                </div>
                <time dateTime={a.timestamp}>{date(a.timestamp)}</time>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="activity-empty">
            <span>
              <Clock3 size={20} />
            </span>
            <div>
              <strong>Workspace Anda siap digunakan.</strong>
              <p>Aktivitas akan muncul ketika Anda mulai menambahkan data.</p>
            </div>
            <Badge>Belum ada aktivitas</Badge>
          </div>
        )}
      </Panel>
    </>
  );
}
