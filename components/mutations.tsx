'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { deleteRecord, confirmTopVariables } from '@/app/actions';
export function Modal({
  title,
  description,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal-wide' : ''}`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function DeleteButton({
  kind,
  id,
  label,
}: {
  kind: 'questionnaire' | 'photobox';
  id: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function remove() {
    startTransition(async () => {
      try {
        const result = await deleteRecord(kind, id);
        if (result.error) toast.error(result.error);
        else {
          toast.success('Data berhasil dihapus.');
          setOpen(false);
          router.refresh();
        }
      } catch {
        toast.error('Koneksi terputus. Coba lagi.');
      }
    });
  }
  return (
    <>
      <button
        className="icon-button danger-hover"
        onClick={() => setOpen(true)}
        aria-label={`Hapus ${label}`}
        title="Hapus"
      >
        <Trash2 size={16} />
      </button>
      {open && (
        <Modal title="Hapus data ini?" onClose={() => setOpen(false)} busy={pending}>
          <div className="delete-warning">
            <AlertTriangle size={28} />
            <p>
              <strong>{label}</strong> akan dihapus secara permanen.
            </p>
          </div>
          <p className="muted modal-note">
            {kind === 'questionnaire'
              ? 'Analisis akan dihitung ulang. Konfirmasi TOP 5, seluruh assessment, dan ranking lama akan dibatalkan.'
              : 'Assessment kandidat ini juga akan dihapus. Ranking akan dihitung ulang jika seluruh kandidat tersisa sudah dinilai.'}{' '}
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </button>
            <button className="btn btn-danger" onClick={remove} disabled={pending}>
              {pending && <LoaderCircle size={16} className="spin" />}Ya, hapus data
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function ConfirmTopButton({ ids, confirmed }: { ids: string[]; confirmed: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function confirm() {
    startTransition(async () => {
      try {
        const result = await confirmTopVariables(ids);
        if (result.error) toast.error(result.error);
        else {
          toast.success('TOP 5 dikonfirmasi. Assessment siap digunakan.');
          setOpen(false);
          router.refresh();
        }
      } catch {
        toast.error('Koneksi terputus. Coba lagi.');
      }
    });
  }
  return (
    <>
      <button
        className={`btn ${confirmed ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => setOpen(true)}
        disabled={confirmed}
      >
        <Check size={16} />
        {confirmed ? 'TOP 5 telah dikonfirmasi' : 'Konfirmasi TOP 5 untuk Ranking'}
      </button>
      {open && (
        <Modal
          title="Gunakan lima variabel ini?"
          description="Variabel aktif untuk penilaian Photo Box"
          onClose={() => setOpen(false)}
          busy={pending}
        >
          <p className="modal-note">
            Sistem akan menyimpan lima variabel teratas beserta bobotnya. Hanya kelima variabel ini
            yang digunakan dalam assessment dan ranking. Jika kuesioner berubah, Anda harus
            mengonfirmasi ulang dan mengisi kembali assessment.
          </p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={confirm} disabled={pending}>
              {pending && <LoaderCircle className="spin" size={16} />}Konfirmasi variabel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
