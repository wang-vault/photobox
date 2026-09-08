'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Database,
  ChartNoAxesCombined,
  Star,
  Camera,
  ListChecks,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Brand } from './brand';
import { signOut } from '@/app/actions';
const sections = [
  {
    label: 'WORKSPACE',
    items: [{ href: '/dashboard', title: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'TAHAP 01 · PREFERENSI',
    items: [
      { href: '/questionnaire', title: 'Isi Kuesioner', icon: ClipboardList },
      { href: '/questionnaire-data', title: 'Data Kuesioner', icon: Database },
      { href: '/analysis', title: 'Analisis Variabel', icon: ChartNoAxesCombined },
      { href: '/top-variables', title: 'TOP 5 Variabel', icon: Star },
    ],
  },
  {
    label: 'TAHAP 02 · EVALUASI',
    items: [
      { href: '/photoboxes', title: 'Kandidat Photo Box', icon: Camera },
      { href: '/assessment', title: 'Assessment', icon: ListChecks },
      { href: '/ranking', title: 'Hasil Ranking', icon: Trophy },
    ],
  },
];
export function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title =
    sections.flatMap((x) => x.items).find((x) => x.href === pathname)?.title ?? 'Pengaturan';
  return (
    <div className="app-shell">
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Owner Workspace<small>PhotoBox Analytics</small>
          </div>
          <ShieldCheck size={16} />
        </div>
        <nav className="side-nav">
          {sections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p>{section.label}</p>
              {section.items.map(({ href, title, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`nav-item ${pathname === href ? 'active' : ''}`}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{title}</span>
                  {pathname === href && <span className="nav-dot" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-tip">
            <span className="side-tip-icon">
              <SparkleIcon />
            </span>
            <strong>Keputusan berbasis data</strong>
            <p>Dari preferensi menjadi rekomendasi yang lebih objektif.</p>
            <Link href="/analysis" onClick={() => setOpen(false)}>
              Jelajahi analisis <ArrowUpRight size={14} />
            </Link>
          </div>
          <Link
            className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
            href="/settings"
            onClick={() => setOpen(false)}
          >
            <Settings size={18} />
            Pengaturan
          </Link>
          <form action={signOut}>
            <button className="nav-item logout" type="submit">
              <LogOut size={18} />
              Keluar
            </button>
          </form>
          <div className="sidebar-version">
            <span className="tiny-dot" /> PhotoBox Ranking System<span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              onClick={() => setOpen(true)}
              aria-label="Buka navigasi"
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <span className="tiny-dot" />
              Supabase terhubung
            </span>
            <div className="topbar-divider" />
            <Link href="/settings" className="profile-pill">
              <span className="avatar">{name.charAt(0).toUpperCase()}</span>
              <span>
                {name}
                <small>Owner</small>
              </span>
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="workspace-footer">
          <span>© {new Date().getFullYear()} PhotoBox Ranking System</span>
          <span>
            <ShieldCheck size={13} /> Data privat · Akses khusus Owner
          </span>
        </footer>
      </div>
    </div>
  );
}
function SparkleIcon() {
  return <Star size={18} />;
}
