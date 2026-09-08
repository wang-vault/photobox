import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <div className="panel empty-state">
        <span className="eyebrow">HALAMAN TIDAK DITEMUKAN</span>
        <h1>Sepertinya Anda salah arah.</h1>
        <p>Halaman ini tidak tersedia atau data sudah dihapus.</p>
        <Link className="btn btn-primary" href="/dashboard">
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
