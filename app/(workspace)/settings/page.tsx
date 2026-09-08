import { ShieldCheck, Database, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { getWorkspace } from '@/lib/data';
import { date } from '@/lib/math';
import { PageHeader, Panel, Badge, Notice } from '@/components/ui';
import { ProfileForm, PasswordForm } from '@/components/settings-form';
export const metadata = { title: 'Pengaturan' };
export default async function SettingsPage() {
  const d = await getWorkspace();
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE · PENGATURAN"
        title="Workspace milik Anda."
        description="Kelola profil Owner, keamanan akun, dan pahami cara sistem mengolah data."
      />
      <div className="settings-profile">
        <span className="avatar large">{d.profile.full_name.charAt(0).toUpperCase()}</span>
        <div>
          <h2>{d.profile.full_name}</h2>
          <p>{d.email}</p>
        </div>
        <Badge tone="purple">
          <ShieldCheck size={13} />
          OWNER
        </Badge>
        <span className="muted">Bergabung {date(d.profile.created_at)}</span>
      </div>
      <div className="two-col">
        <Panel title="Profil Owner" description="Informasi identitas untuk workspace Anda.">
          <ProfileForm name={d.profile.full_name} email={d.email} />
        </Panel>
        <Panel
          title="Keamanan akun"
          description="Gunakan password unik untuk melindungi data Anda."
        >
          <PasswordForm />
        </Panel>
      </div>
      <Panel
        title="Sistem & integritas data"
        description="Konfigurasi dan prinsip perhitungan yang berlaku."
      >
        <div className="system-settings">
          <div>
            <span className="system-icon">
              <Database size={20} />
            </span>
            <span>
              <strong>Supabase PostgreSQL</strong>
              <small>Database dan autentikasi terhubung ke proyek Anda.</small>
            </span>
            <Badge tone="green">
              <CheckCircle2 size={12} />
              Terhubung
            </Badge>
          </div>
          <div>
            <span className="system-icon">
              <LockKeyhole size={20} />
            </span>
            <span>
              <strong>Row Level Security</strong>
              <small>Setiap Owner hanya dapat mengakses data miliknya.</small>
            </span>
            <Badge tone="purple">Privat per Owner</Badge>
          </div>
          <div>
            <span className="system-icon">
              <ShieldCheck size={20} />
            </span>
            <span>
              <strong>Weighted Average</strong>
              <small>Σ (assessment × bobot). Bobot TOP 5 berjumlah tepat 1.</small>
            </span>
            <Badge>Skala 1–5</Badge>
          </div>
        </div>
      </Panel>
      <Notice>
        <strong>Kebijakan perubahan data:</strong> perubahan kuesioner membatalkan TOP 5,
        assessment, dan ranking. Perubahan informasi kandidat membatalkan assessment kandidat
        tersebut. Ranking hanya tersedia jika semua kandidat dinilai lengkap. Tidak ada nilai
        penelitian atau kandidat yang dibuat otomatis.
      </Notice>
    </>
  );
}
