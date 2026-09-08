import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  Camera,
  ChartNoAxesCombined,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Trophy,
  Check,
  ArrowRight,
  Layers3,
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { createClient, isConfigured } from '@/lib/supabase/server';
export const metadata = { title: 'Masuk' };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = isConfigured();
  if (configured) {
    const db = await createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) redirect('/dashboard');
  }
  const params = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-main">
        <header className="auth-header">
          <Brand />
          <span className="owner-access">
            <ShieldCheck size={14} /> Owner access
          </span>
        </header>
        <div className="auth-form-center">
          <LoginForm configured={configured} confirmationError={Boolean(params.error)} />
        </div>
        <footer className="auth-footer">
          <span>© {new Date().getFullYear()} PhotoBox Ranking System</span>
          <span>
            Dibuat untuk keputusan yang lebih baik <ArrowUpRight size={13} />
          </span>
        </footer>
      </section>
      <aside className="auth-story">
        <div className="story-grid" />
        <div className="story-top">
          <span className="story-label">
            <Sparkles size={14} /> INSIGHT MENJADI KEPUTUSAN
          </span>
          <span className="story-decoration">✳</span>
        </div>
        <div className="story-copy">
          <h2>
            Lebih dari preferensi.
            <br />
            Temukan yang <span>terbaik.</span>
          </h2>
          <p>
            Ubah penilaian menjadi rekomendasi yang objektif.
            <br className="desktop-only" /> Seluruh proses, dalam satu workspace.
          </p>
        </div>
        <div className="method-art" aria-label="Alur penilaian dari preferensi menuju rekomendasi">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-chip chip-top">
            <span className="chip-icon pink">
              <ClipboardList size={17} />
            </span>
            <span>
              Berawal dari preferensi<small>Kuesioner langsung di website</small>
            </span>
            <Check size={15} className="chip-check" />
          </div>
          <div className="art-card art-card-back" />
          <div className="art-card art-card-front">
            <div className="art-card-top">
              <span className="mini-brand">
                <Camera size={15} /> PhotoBox
              </span>
              <span className="art-card-dots">•••</span>
            </div>
            <div className="art-camera">
              <Camera size={57} strokeWidth={1.2} />
              <Sparkles size={23} className="art-spark" />
            </div>
            <div className="art-caption">Pilih dengan percaya diri.</div>
            <div className="art-caption-sub">Didukung data. Bukan asumsi.</div>
            <div className="art-tags">
              <span>
                <ShieldCheck size={12} /> Objektif
              </span>
              <span>
                <Layers3 size={12} /> Terukur
              </span>
            </div>
          </div>
          <div className="art-chip chip-bottom">
            <span className="chip-icon purple">
              <Trophy size={19} />
            </span>
            <span>
              Rekomendasi berbasis data<small>Metode Weighted Average</small>
            </span>
            <ArrowUpRight size={17} />
          </div>
          <span className="float-spark spark-one">✦</span>
          <span className="float-spark spark-two">✧</span>
          <span className="float-dot dot-one" />
          <span className="float-dot dot-two" />
        </div>
        <div className="story-workflow">
          <div>
            <span className="workflow-icon">
              <ClipboardList size={18} />
            </span>
            <strong>Isi kuesioner</strong>
            <small>Kenali preferensi</small>
          </div>
          <ArrowRight size={15} />
          <div>
            <span className="workflow-icon">
              <ChartNoAxesCombined size={18} />
            </span>
            <strong>Analisis variabel</strong>
            <small>Fokus pada TOP 5</small>
          </div>
          <ArrowRight size={15} />
          <div>
            <span className="workflow-icon">
              <Trophy size={18} />
            </span>
            <strong>Temukan terbaik</strong>
            <small>Ranking transparan</small>
          </div>
        </div>
        <div className="story-bottom">
          <span className="tiny-dot" /> Satu sistem terpadu. Sepenuhnya berdasarkan data Anda.
        </div>
      </aside>
    </main>
  );
}
