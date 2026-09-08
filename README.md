# PhotoBox Ranking System

Aplikasi full-stack untuk kuesioner internal Owner, analisis preferensi 10 variabel, konfirmasi TOP 5, assessment kandidat, serta pemilihan Photo Box dengan **Weighted Average**.

**Tidak ada data awal, seed, data penelitian fiktif, mock API, impor CSV, Google Form, atau AI API.** Semua entri dan assessment harus diisi manual melalui website. Tanpa koneksi Supabase, aplikasi menampilkan petunjuk konfigurasi di login dan tidak mengaktifkan autentikasi palsu.

## Teknologi

- Next.js 16 App Router, TypeScript, React 19, Server Components dan Server Actions.
- Tailwind CSS 4, CSS responsif, font Inter/Manrope yang di-host lokal, Lucide, Sonner.
- Supabase Authentication dengan cookie SSR dan PostgreSQL dengan Row Level Security.
- Recharts untuk bar chart dan radar chart, hanya ketika data nyata lengkap tersedia.
- Deployment Next.js di Vercel; database dan autentikasi di Supabase.
- Versi dependensi aktual dikunci di `package-lock.json`. Gunakan `npm ci` untuk instalasi yang konsisten.

## 1. Buat dan konfigurasi proyek Supabase

1. Buat **proyek Supabase baru/kosong**, khusus untuk aplikasi ini.
2. Buka **Authentication → Providers / Sign In** dan aktifkan Email/Password serta registrasi pengguna baru.
3. Aktifkan **Confirm email** untuk produksi.
4. Di **Authentication → URL Configuration**:
   - Isi **Site URL** dengan origin aplikasi yang sedang digunakan.
   - Untuk lokal: `http://localhost:3000`.
   - Untuk Vercel: origin HTTPS deployment/domain milik Anda.
   - Untuk live preview Arena: origin HTTPS preview yang ditampilkan Arena, **bukan localhost**.
   - Tambahkan URL redirect aplikasi: `/auth/callback`, `/auth/callback?next=/settings`, dan `/auth/confirm` pada origin yang diizinkan. Supabase juga mendukung pola `origin/**` jika diperlukan untuk pengembangan.
5. Atur SMTP produksi, pembatasan pengiriman email, kebijakan password, dan rate limit Auth. SMTP bawaan Supabase memiliki batas pengiriman dan bukan untuk operasional produksi.

**Role:** akun yang mendaftar melalui website menjadi `OWNER`. Tiap Owner mempunyai workspace privat dengan akses penuh atas **datanya sendiri**, bukan data Owner lain. Role tidak diambil dari metadata yang bebas diedit pengguna. Jika aplikasi hanya untuk satu Owner, setelah akun nyata pertama dibuat Anda dapat menonaktifkan registrasi baru di Supabase.

### Template email yang disarankan untuk SSR

Di **Authentication → Email Templates**, gunakan tautan token hash berikut agar konfirmasi juga dapat dilakukan dari perangkat/browser berbeda:

**Confirm signup:**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup"
  >Konfirmasi akun Owner</a
>
```

**Reset password:**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
  >Atur ulang password</a
>
```

Pastikan `Site URL` menunjuk deployment yang benar. Gunakan proyek Supabase terpisah untuk pengembangan dan produksi bila keduanya digunakan bersamaan. Route `/auth/callback` juga mendukung pertukaran kode PKCE standar dari browser yang memulai proses autentikasi. Tautan recovery yang valid membuat sesi autentikasi lalu membuka `/settings` untuk memasukkan password baru. Redirect callback hanya mengizinkan tujuan internal yang ditentukan aplikasi.

## 2. Jalankan SQL migration

1. Buka **Supabase → SQL Editor → New query**.
2. Salin seluruh isi:

   ```text
   supabase/migrations/202609080001_initial.sql
   ```

3. Jalankan sekali pada proyek baru. Migration menggunakan transaksi; jika gagal, perubahan di-rollback.
4. Pastikan sembilan tabel aplikasi muncul dan RLS aktif.
5. **Semua tabel aplikasi tetap kosong setelah migration.** Migration tidak membuat akun Owner, responden, kandidat, nilai, statistik, atau ranking.
6. Buat akun pertama **melalui halaman `/login` → Daftar Owner** setelah environment diatur.

Migration harus dijalankan **sebelum** registrasi akun pertama. Trigger `on_auth_user_created` membuat profil hanya ketika pengguna nyata melakukan registrasi. Tidak ada backfill akun lama atau seed profil. Jangan memasang schema ini di proyek produksi lain yang memiliki tabel bernama sama tanpa meninjau konfliknya terlebih dahulu.

### Mengapa tabel `variables` kosong setelah migration?

Sepuluh nama variabel adalah **definisi instrumen yang ditetapkan dalam spesifikasi**, bukan data penelitian. Definisi tersedia di source untuk menampilkan form pertama. Database membuat metadata variabel per Owner di dalam transaksi **penyimpanan kuesioner nyata pertama**. Jika validasi atau transaksi gagal, metadata juga tidak dibuat. Tidak ada angka Likert yang ditetapkan otomatis.

## 3. Environment variables

Prasyarat: Node.js 22 LTS atau versi yang kompatibel dengan Next.js 16, npm, dan proyek Supabase yang sudah dimigrasi.

```bash
npm ci
cp .env.example .env.local
```

Isi `.env.local` dari **Supabase → Project Settings → API / API Keys**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- URL adalah Project URL milik Anda.
- Key adalah public `anon` key, atau publishable key yang kompatibel, dari proyek tersebut.
- **Jangan gunakan `service_role` / secret key.** Aplikasi tidak memerlukan key istimewa.
- Jangan memasukkan kredensial ke source atau Git. `.env.local` sudah diabaikan.
- Walaupun public key memang boleh berada di browser, akses database tetap dibatasi oleh identitas Supabase Auth, RLS, privilege tabel, dan RPC yang tervalidasi.
- Restart server atau redeploy setelah mengubah environment variables.

## 4. Jalankan secara lokal

```bash
npm run dev
```

Buka `http://localhost:3000`. Server bind ke `0.0.0.0` agar juga bisa digunakan melalui proxy preview. Request aplikasi memakai URL relatif dan Server Actions; browser tidak memanggil backend melalui localhost.

Untuk build produksi lokal:

```bash
npm run build
npm start
```

Jika Supabase belum dikonfigurasi, halaman login menjelaskan setup dan menonaktifkan submit autentikasi. Halaman manajemen tetap terlindungi. Kegagalan database **tidak** diubah menjadi statistik nol/empty-state palsu; error boundary memberi pesan kegagalan dan tombol coba lagi.

## 5. Deploy ke Vercel

1. Import repository ke Vercel, pilih framework **Next.js**.
2. Gunakan Node.js 22 LTS, install command `npm ci`, build command `npm run build`, output default Next.js.
3. Tambahkan kedua environment variables untuk environment Production dan Preview yang memang digunakan.
4. Jalankan migration pada Supabase sebelum penggunaan aplikasi.
5. Deploy. Tidak dibutuhkan custom server, worker, cron, atau `vercel.json`.
6. Perbarui Supabase **Site URL** dan daftar redirect sesuai domain HTTPS Vercel Anda. Sesuaikan template email.
7. Registrasi Owner nyata melalui aplikasi, konfirmasi email, dan login.

`next.config.ts` mengizinkan origin `*.e2b.app` untuk live preview Arena. Allowlist dev juga mendukung lokal. Untuk deployment yang tidak menggunakan Arena, Anda dapat menghapus pengecualian preview dari konfigurasi Server Actions; pemeriksaan same-origin bawaan Next.js tetap disarankan.

**Status deployment:** repository ini berisi implementasi dan konfigurasi siap deploy, bukan proyek Supabase/Vercel yang sudah diprovisikan. Aktivasi memerlukan environment, migration, dan konfigurasi Auth milik Anda. Tidak ada kredensial atau akun buatan yang disertakan.

## Halaman dan alur operasional

| Route                 | Fungsi                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `/login`              | Login, registrasi Owner, konfirmasi email, permintaan pemulihan password                        |
| `/dashboard`          | Jumlah entri dan kandidat aktual; status analisis, TOP 5, assessment, ranking; aktivitas aktual |
| `/questionnaire`      | Wizard 10 pertanyaan dengan Skala Likert 1–5, progress, navigasi, dan validasi lengkap          |
| `/questionnaire-data` | Daftar, pencarian, pagination, detail lengkap, edit dan hapus dengan konfirmasi                 |
| `/analysis`           | Total, jumlah data, rata-rata, urutan 10 variabel, bar chart, dan daftar peringkat              |
| `/top-variables`      | Lima variabel teratas, penjelasan bobot, dan konfirmasi snapshot ke database                    |
| `/photoboxes`         | Tambah, cari, lihat, edit, hapus kandidat; nama, lokasi, harga, deskripsi, catatan              |
| `/assessment`         | Lima nilai manual per kandidat, hanya setelah seluruh prasyarat terpenuhi                       |
| `/ranking`            | Rekomendasi, ranking, bar chart, radar chart, dan kontribusi setiap variabel                    |
| `/settings`           | Edit nama Owner, ubah password, kebijakan sistem dan integritas data                            |

### Penggunaan pertama

1. Daftar dan login sebagai Owner. Dashboard belum memiliki hasil penelitian.
2. Isi satu kuesioner lengkap. Nilai belum dipilih sebelumnya; semua 10 variabel wajib diberi nilai 1–5.
3. Simpan. Database menyimpan entri dan skor lalu menghitung ulang analisis dalam transaksi yang sama.
4. Tambahkan entri nyata lainnya bila diperlukan. Setiap entri adalah satu kuesioner, bukan satu akun responden otomatis. Tidak ada klaim verifikasi responden unik.
5. Tinjau analisis dan **Konfirmasi TOP 5 untuk Ranking**.
6. Tambahkan kandidat Photo Box manual. Kandidat juga boleh dimasukkan sebelum kuesioner, tetapi assessment tetap terkunci sampai prasyarat lengkap.
7. Beri nilai kualitas 1–5 pada seluruh lima variabel aktif untuk setiap kandidat, lalu simpan masing-masing kandidat.
8. Setelah **seluruh kandidat** memiliki assessment lengkap, database membentuk ranking. Lihat hasilnya di `/ranking`.

### Skala dan metode

**Kuesioner kepentingan:**

- 1: Sangat Tidak Penting
- 2: Tidak Penting
- 3: Cukup Penting
- 4: Penting
- 5: Sangat Penting

**Assessment kualitas:**

- 1: Sangat Kurang
- 2: Kurang
- 3: Cukup
- 4: Baik
- 5: Sangat Baik

Semua variabel assessment diperlakukan sebagai **benefit**: nilai lebih tinggi berarti kandidat lebih baik pada aspek tersebut. Harga metadata tidak dimasukkan otomatis ke rumus; Owner menilai _kesesuaian harga_. Aplikasi tidak menganggap harga nominal yang lebih besar pasti lebih baik.

```text
Rata-rata variabel j = Σ nilai kuesioner j / jumlah entri
Bobot variabel j    = rata-rata j / Σ rata-rata TOP 5
Skor kandidat i     = Σ (assessment i,j × bobot j), untuk j pada TOP 5 saja
```

- Seluruh entri kuesioner berbobot sama.
- TOP 5 adalah lima rata-rata tertinggi.
- Bobot disimpan dengan tipe PostgreSQL `numeric`. Empat bobot pertama memakai rasio rata-rata; bobot terakhir menerima sisa presisi desimal sehingga **total bobot tersimpan tepat 1**.
- Tidak ada normalisasi kandidat tambahan, pembobotan tersembunyi, atau nilai otomatis.
- Skor akhir berada pada rentang 1–5.
- Hasil akhir dihitung dan diurutkan **di PostgreSQL**, bukan dengan urutan hardcoded di frontend.
- Frontend hanya membulatkan angka untuk tampilan. Tabel rinci menunjukkan mean/score hingga empat atau enam desimal. Pembulatan tampilan dapat membuat persentase yang dijumlahkan manual sedikit berbeda dari total aslinya.
- Rekomendasi memakai template dinamis dari kandidat terbaik, nilai assessment, bobot terbesar, dan skor akhir. Tidak memanggil AI API.
- Chart tidak dirender jika data yang diperlukan belum tersedia; tabel selalu menyediakan nilai yang mendasarinya.

### Aturan nilai seri

- Rata-rata variabel sama: kode variabel lebih kecil (V1–V10) didahulukan.
- Skor kandidat sama persis di PostgreSQL: kandidat yang ditambahkan lebih dulu didahulukan, kemudian UUID sebagai pemecah seri terakhir.
- Peringkat tetap unik dan berurutan. Posisi pertama berstatus `Recommended`; posisi lain `Alternative`.
- Jika skor tertinggi seri, aplikasi menampilkan penjelasan eksplisit. Pemecah seri bukan bukti bahwa kualitas kandidat pertama lebih tinggi.
- Deteksi seri dilakukan dengan presisi database, bukan pembandingan angka tampilan yang dibulatkan.

## Arsitektur database

Semua sembilan tabel memiliki primary key UUID, `created_at`, dan `updated_at`. Data turunan yang dibangun ulang memiliki ID/timestamp baru; `updated_at` pada baris yang diedit diperbarui trigger.

| Tabel                    | Isi dan relasi utama                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| `profiles`               | Profil Owner, FK ke `auth.users`; role tetap `OWNER`                        |
| `variables`              | Definisi instrumen per Owner; kode unik 1–10                                |
| `questionnaire_entries`  | Satu entri kuesioner nyata, FK ke profil                                    |
| `questionnaire_scores`   | Sepuluh skor entri, FK ke entri dan variabel                                |
| `variable_analysis`      | Total, jumlah entri, mean dan posisi per variabel, hasil transaksi database |
| `selected_top_variables` | Snapshot lima variabel aktif, mean, bobot dan posisi                        |
| `photoboxes`             | Informasi kandidat yang diinput Owner                                       |
| `photobox_assessments`   | Skor kandidat terhadap ID snapshot variabel terpilih                        |
| `ranking_results`        | Skor dan posisi kandidat, hanya jika seluruh assessment lengkap             |

### Keamanan dan integritas

- `proxy.ts` menyegarkan sesi dan melindungi route. Layout dan Server Actions memverifikasi pengguna lagi melalui `auth.getUser()`.
- Semua tabel menggunakan RLS dan kebijakan SELECT per Owner.
- Role `anon` tidak dapat membaca/menulis tabel atau menjalankan RPC aplikasi.
- Role `authenticated` hanya memiliki SELECT langsung. INSERT, UPDATE, DELETE, dan TRUNCATE langsung tidak diberikan.
- Seluruh mutasi menggunakan RPC `SECURITY DEFINER` dengan `search_path = ''`, nama objek terkualifikasi, identitas dari `auth.uid()`, dan validasi backend.
- Owner ID tidak pernah dipercaya dari payload klien. Role Owner juga diperiksa di database.
- Foreign key komposit menyertakan `owner_id`, sehingga baris tidak bisa menghubungkan data dua Owner berbeda.
- Setiap mutasi mengambil transaction advisory lock per Owner. Penyimpanan entri, analisis, invalidasi, dan ranking berjalan atomik; mutasi bersamaan tidak meninggalkan data setengah lengkap.
- Fungsi helper internal tidak dapat dieksekusi role API.
- `get_workspace()` adalah satu RPC `SECURITY INVOKER` yang tunduk pada RLS dan membaca seluruh tabel dari satu snapshot PostgreSQL. Halaman tidak mencampurkan dua versi data dari query paralel yang berbeda.
- TOP 5 yang dikonfirmasi menyertakan ID analisis yang ditinjau pengguna. Jika analisis berubah, konfirmasi lama ditolak.
- Assessment menyertakan ID snapshot variabel aktif dan timestamp kandidat. Snapshot/kandidat yang sudah berubah akan ditolak.
- Edit kuesioner dan kandidat memakai timestamp optimistic concurrency. Perubahan dari tab lama tidak menimpa versi yang lebih baru tanpa memuat ulang.
- Account service-role/database administrator tetap memiliki privilege istimewa bawaan Supabase. Jangan melakukan perubahan penelitian langsung dengan privilege tersebut karena akan melewati prosedur bisnis aplikasi.

### Invalidasi hasil

| Perubahan                        | Konsekuensi                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Tambah/edit/hapus kuesioner      | Analisis dihitung ulang. TOP 5, seluruh assessment dan ranking lama dibatalkan. Konfirmasi dan assessment harus diulang. |
| Konfirmasi TOP 5 yang masih sama | Idempoten, tidak menghapus assessment yang sudah tersimpan.                                                              |
| Tambah kandidat                  | Ranking ditunda sampai kandidat baru dinilai lengkap.                                                                    |
| Edit informasi kandidat          | Assessment kandidat tersebut dihapus; ranking ditunda sampai dinilai ulang.                                              |
| Hapus kandidat                   | Assessment kandidat tersebut ikut dihapus; ranking dihitung ulang jika semua kandidat tersisa lengkap.                   |
| Simpan/edit assessment           | Ranking dihitung ulang hanya apabila semua kandidat lengkap.                                                             |
| Hapus semua kuesioner/kandidat   | Hasil yang tidak lagi valid dihapus; tampil empty state, bukan hasil nol.                                                |

Antarmuka memberi peringatan sebelum perubahan destruktif, checkbox persetujuan untuk revisi kuesioner yang membatalkan hasil, serta dialog konfirmasi penghapusan. Draft form yang belum disimpan hanya ada dalam state browser dan bisa hilang ketika halaman ditutup.

## Pemeriksaan dan pengujian

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` menjalankan PostgreSQL melalui **PGlite** untuk memverifikasi migration, database kosong, RLS, privilege, foreign key, batas nilai, akses RPC, serta guard perhitungan tanpa data. Test hanya membuat schema infrastruktur Auth yang kosong. **Tidak membuat pengguna/akun uji, kandidat, entri kuesioner, nilai Likert, atau ranking fiktif.** PGlite adalah dependency pengujian, bukan pengganti Supabase saat aplikasi dijalankan.

Pengujian browser terhadap server yang sudah berjalan:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

`TEST_BASE_URL` dapat dipakai untuk origin server yang diuji. `CHROMIUM_EXECUTABLE` opsional untuk browser yang sudah terpasang. Pengujian ini memeriksa navigasi login/registrasi/pemulihan, semua protected routes, responsivitas mobile, dan kondisi belum terkonfigurasi. Tidak ada interception API, fixture data, atau bypass login.

**Batas verifikasi:** tanpa proyek dan kredensial Supabase nyata, pengujian tidak memverifikasi pengiriman email, penyimpanan atas nama Owner, atau seluruh perjalanan ranking melalui layanan Supabase live. Lakukan penerimaan berikut dengan akun Anda sendiri dan data penelitian yang benar setelah setup:

- Registrasi dan konfirmasi email; login; logout; buka route privat setelah logout.
- Pastikan semua halaman awal tidak berisi hasil penelitian.
- Isi kuesioner sebenarnya; coba simpan sebelum lengkap; tinjau detail dan mean hasilnya.
- Konfirmasi TOP 5; pastikan jumlah bobot 1 dan hanya lima variabel ini tampil pada assessment.
- Masukkan kandidat sebenarnya; pastikan ranking tertahan sampai semua assessment lengkap.
- Bandingkan kontribusi `nilai × bobot` dan skor akhir dengan perhitungan manual dari data Anda.
- Ubah kuesioner/kandidat; periksa invalidasi dan penolakan form tab lama.
- Periksa bahwa akun Owner nyata lain (jika ada) tidak dapat melihat data Anda.
- Periksa email recovery dan alur reset password di domain deployment sebenarnya.

## Struktur proyek

```text
app/
  (workspace)/       Seluruh route privat dan layout workspace
  auth/               Callback PKCE dan verifikasi token email
  login/              Login/registrasi/recovery
  actions.ts          Validasi Server Actions dan pemanggilan RPC
  globals.css         Tailwind, design system dan responsive styling
components/           Form interaktif, dialog, tabel, chart dan navigasi
lib/
  constants.ts        Definisi 10 variabel dan label skala, tanpa nilai awal
  data.ts             Snapshot workspace per request
  math.ts             Guard matematis, pratinjau bobot, format angka
  supabase/server.ts  Supabase SSR berbasis cookie
  types.ts            Tipe domain TypeScript
supabase/migrations/  DDL, RLS, trigger dan RPC transaksi
proxy.ts              Refresh sesi dan proteksi route
.env.example          Nama environment, tidak berisi kredensial
tests/                Pengujian schema kosong dan akses browser
```

### Catatan operasional

Workspace memuat satu snapshot seluruh data Owner untuk menjaga konsistensi dan menyediakan tabel dengan pencarian/pagination lokal. Untuk penelitian berskala sangat besar, pertimbangkan RPC snapshot berhalaman/versioned dan query khusus agregat tanpa mengubah aturan transaksi. Profil kandidat bersifat informasi teks, bukan unggahan gambar atau aplikasi pengambilan foto. Buat backup database sesuai kebijakan penelitian Anda; penghapusan permanen tidak menyediakan undo.
