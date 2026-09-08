import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'PhotoBox — Ranking System', template: '%s | PhotoBox' },
  description:
    'Satu workspace untuk kuesioner, analisis preferensi, dan pemilihan Photo Box terbaik berdasarkan data nyata.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
