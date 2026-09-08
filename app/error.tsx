'use client';
import { AlertTriangle, RefreshCw } from 'lucide-react';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <div className="panel empty-state">
        <div className="empty-icon">
          <AlertTriangle />
        </div>
        <h2>Data belum dapat dimuat</h2>
        <p>
          Koneksi atau konfigurasi database bermasalah. Pastikan environment variables dan migration
          Supabase sudah siap. Data Anda tidak diganti dengan hasil kosong.
        </p>
        <button className="btn btn-primary" onClick={reset}>
          <RefreshCw size={16} />
          Coba lagi
        </button>
        <a className="text-link" href="/login">
          Kembali ke login
        </a>
      </div>
    </main>
  );
}
