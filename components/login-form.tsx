'use client';
import { useState, useTransition } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { authenticate } from '@/app/actions';
export function LoginForm({
  configured,
  confirmationError,
}: {
  configured: boolean;
  confirmationError: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>(
    confirmationError
      ? {
          error:
            'Tautan konfirmasi tidak valid atau kedaluwarsa. Coba login atau minta tautan pemulihan baru.',
        }
      : {},
  );
  const [pending, startTransition] = useTransition();
  function changeMode(next: typeof mode) {
    setMode(next);
    setResult({});
  }
  function submit(form: FormData) {
    startTransition(async () => {
      try {
        setResult(await authenticate(mode, form));
      } catch (e) {
        if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e;
        setResult({ error: 'Koneksi terputus. Silakan coba lagi.' });
      }
    });
  }
  return (
    <div className="login-form-wrap">
      <div className="login-overline">
        <span className="tiny-dot" /> WORKSPACE OWNER
      </div>
      <h1>
        {mode === 'register'
          ? 'Mulai perjalanan Anda.'
          : mode === 'reset'
            ? 'Lupa password?'
            : 'Selamat datang kembali.'}
      </h1>
      <p className="login-description">
        {mode === 'register'
          ? 'Buat akun Owner dan temukan Photo Box terbaik dengan penilaian yang terukur.'
          : mode === 'reset'
            ? 'Kami akan mengirimkan tautan untuk mengatur ulang password Anda.'
            : 'Masuk untuk mengelola kuesioner, menganalisis preferensi, dan menemukan Photo Box terbaik.'}
      </p>
      {mode !== 'reset' && (
        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => changeMode('login')}
            disabled={pending}
          >
            Masuk
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
            disabled={pending}
          >
            Daftar Owner
          </button>
        </div>
      )}
      {!configured && (
        <div className="setup-notice">
          <span className="setup-dot" />
          <div>
            <strong>Hubungkan workspace Anda</strong>
            <p>
              Supabase belum dikonfigurasi. Atur environment variables dan jalankan migration sesuai
              README untuk mengaktifkan akun.
            </p>
          </div>
        </div>
      )}
      <form action={submit} className="form-stack">
        {mode === 'register' && (
          <label className="field-label">
            Nama lengkap
            <div className="input-icon">
              <UserRound size={18} />
              <input
                name="full_name"
                placeholder="Nama Owner"
                autoComplete="name"
                maxLength={100}
                required
                disabled={pending}
              />
            </div>
          </label>
        )}
        <label className="field-label">
          Alamat email
          <div className="input-icon">
            <Mail size={18} />
            <input
              name="email"
              type="email"
              placeholder="Masukkan email Anda"
              autoComplete="email"
              required
              disabled={pending}
              maxLength={254}
            />
          </div>
        </label>
        {mode !== 'reset' && (
          <div className="field-label">
            <div className="label-row">
              <label htmlFor="auth-password">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => changeMode('reset')}
                  className="text-link"
                  disabled={pending}
                >
                  Lupa password?
                </button>
              )}
            </div>
            <div className="input-icon">
              <LockKeyhole size={18} />
              <input
                id="auth-password"
                name="password"
                type={visible ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Minimal 8 karakter' : 'Masukkan password Anda'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={8}
                maxLength={128}
                required
                disabled={pending}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
        {result.error && (
          <div className="notice notice-error" role="alert">
            <AlertCircle size={18} />
            <span>{result.error}</span>
          </div>
        )}
        {result.success && (
          <div className="notice notice-success" role="status">
            <CheckCircle2 size={18} />
            <span>{result.success}</span>
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={!configured || pending}
        >
          {pending ? <LoaderCircle size={18} className="spin" /> : null}
          {mode === 'register'
            ? 'Buat akun Owner'
            : mode === 'reset'
              ? 'Kirim tautan pemulihan'
              : 'Masuk ke workspace'}
          {!pending && <ArrowRight size={18} />}
        </button>
      </form>
      <p className="auth-switch">
        {mode === 'login'
          ? 'Belum memiliki akun?'
          : mode === 'register'
            ? 'Sudah memiliki akun?'
            : ''}{' '}
        <button
          className="text-link"
          onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
          disabled={pending}
        >
          {mode === 'login' ? (
            'Daftar sebagai Owner'
          ) : mode === 'register' ? (
            'Masuk sekarang'
          ) : (
            <>
              <ArrowLeft size={14} /> Kembali ke login
            </>
          )}
        </button>
      </p>
      <div className="login-security">
        <LockKeyhole size={14} />
        <span>Autentikasi aman dengan Supabase</span>
        <span className="security-line" />
        <span>Akses khusus Owner</span>
      </div>
    </div>
  );
}
