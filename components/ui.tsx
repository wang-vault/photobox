import Link from 'next/link';
import { ArrowRight, Inbox, Info, type LucideIcon } from 'lucide-react';
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  href,
  label,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  href?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <div className="empty-illustration">
        <span />
        <div className="empty-icon">
          <Icon size={29} strokeWidth={1.5} />
        </div>
        <i />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link href={href} className="btn btn-primary">
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'purple' | 'green' | 'amber' | 'blue';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice notice-info">
      <Info size={18} />
      <div>{children}</div>
    </div>
  );
}
export function StepTrack({ active }: { active: number }) {
  const steps = ['Kuesioner', 'Analisis & TOP 5', 'Kandidat & assessment', 'Hasil ranking'];
  return (
    <div className="step-track">
      {steps.map((s, i) => (
        <div key={s} className={i < active ? 'complete' : i === active ? 'current' : ''}>
          <span>{i + 1}</span>
          <strong>{s}</strong>
          {i < 3 && <ArrowRight size={15} />}
        </div>
      ))}
    </div>
  );
}
