import { Camera, Sparkles } from 'lucide-react';
import Link from 'next/link';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="brand" aria-label="PhotoBox Ranking System">
      <span className="brand-mark">
        <Camera size={23} strokeWidth={1.8} />
        <Sparkles className="brand-spark" size={12} />
      </span>
      <span className="brand-type">
        Photo<span>Box</span>
        {!compact && <small>RANKING SYSTEM</small>}
      </span>
    </Link>
  );
}
