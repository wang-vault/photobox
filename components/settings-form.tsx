'use client';
import { useState, useTransition } from 'react';
import { LoaderCircle, Save, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProfile, updatePassword } from '@/app/actions';
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  function submit(form: FormData) {
    startTransition(async () => {
      try {
        const result = await updateProfile(form);
        if (result.error) setError(result.error);
        else {
          setError('');
          toast.success('Profil berhasil diperbarui.');
          router.refresh();
        }
      } catch {
        setError('Koneksi terputus. Silakan coba lagi.');
      }
    });
  }
  return (
    <form action={submit} className="form-stack settings-form">
      <label className="field-label">
        Nama Owner
        <input name="full_name" defaultValue={name} maxLength={100} required disabled={pending} />
      </label>
      <label className="field-label">
        Alamat email
        <input value={email} type="email" disabled />
        <small>Email akun digunakan untuk autentikasi Supabase.</small>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Simpan profil
        </button>
      </div>
    </form>
  );
}
export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  function submit(form: FormData) {
    startTransition(async () => {
      try {
        const result = await updatePassword(form);
        if (result.error) setError(result.error);
        else {
          setError('');
          toast.success(result.success);
        }
      } catch {
        setError('Koneksi terputus. Silakan coba lagi.');
      }
    });
  }
  return (
    <form action={submit} className="form-stack settings-form">
      <label className="field-label">
        Password baru
        <input
          name="password"
          type="password"
          placeholder="Minimal 8 karakter"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          required
          disabled={pending}
        />
      </label>
      <label className="field-label">
        Konfirmasi password
        <input
          name="confirm_password"
          type="password"
          placeholder="Ketik ulang password baru"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          required
          disabled={pending}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div>
        <button className="btn btn-secondary" disabled={pending}>
          {pending ? <LoaderCircle className="spin" size={16} /> : <LockKeyhole size={16} />}
          Perbarui password
        </button>
      </div>
    </form>
  );
}
