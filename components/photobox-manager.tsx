'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Plus,
  Search,
  Eye,
  Pencil,
  MapPin,
  LoaderCircle,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { PhotoBox, Assessment } from '@/lib/types';
import { rupiah, date } from '@/lib/math';
import { savePhotoBox } from '@/app/actions';
import { Modal, DeleteButton } from './mutations';
import { Badge, EmptyState, Notice, PageHeader, Panel } from './ui';
export function PhotoBoxManager({
  photoboxes,
  assessments,
}: {
  photoboxes: PhotoBox[];
  assessments: Assessment[];
}) {
  const [dialog, setDialog] = useState<'new' | 'edit' | 'detail' | null>(null);
  const [selected, setSelected] = useState<PhotoBox | null>(null);
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();
  const filtered = useMemo(
    () =>
      photoboxes.filter((p) =>
        `${p.name} ${p.location}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [photoboxes, query],
  );
  function open(mode: typeof dialog, p: PhotoBox | null = null) {
    setSelected(p);
    setDialog(mode);
    setError('');
  }
  function submit(form: FormData) {
    startTransition(async () => {
      try {
        const result = await savePhotoBox(form);
        if (result.error) {
          setError(result.error);
          toast.error(result.error);
        } else {
          toast.success(
            dialog === 'new'
              ? 'Kandidat Photo Box berhasil ditambahkan.'
              : 'Kandidat diperbarui. Silakan isi ulang assessment kandidat ini.',
          );
          setDialog(null);
          router.refresh();
        }
      } catch {
        setError('Koneksi terputus. Silakan coba lagi.');
      }
    });
  }
  return (
    <>
      <PageHeader
        eyebrow="TAHAP 02 · EVALUASI KANDIDAT"
        title="Kandidat Photo Box"
        description="Kenali pilihan Anda. Tambahkan Photo Box yang ingin dibandingkan dan dinilai."
        action={
          <button className="btn btn-primary" onClick={() => open('new')}>
            <Plus size={17} />
            Tambah Photo Box
          </button>
        }
      />
      <Panel
        title="Daftar kandidat"
        description="Hanya kandidat yang Anda tambahkan secara manual."
      >
        {photoboxes.length ? (
          <>
            <div className="table-toolbar">
              <div className="input-icon search-input">
                <Search size={17} />
                <input
                  aria-label="Cari kandidat"
                  placeholder="Cari nama atau lokasi..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Badge tone="purple">{photoboxes.length} kandidat</Badge>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Photo Box</th>
                    <th>Lokasi</th>
                    <th>Harga</th>
                    <th>Assessment</th>
                    <th className="align-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const complete = assessments.filter((a) => a.photobox_id === p.id).length === 5;
                    return (
                      <tr key={p.id}>
                        <td>
                          <button className="candidate-name" onClick={() => open('detail', p)}>
                            <span className="candidate-icon">
                              <Camera size={19} />
                            </span>
                            <span>
                              {p.name}
                              <small>Ditambahkan {date(p.created_at)}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span className="location-cell">
                            <MapPin size={14} />
                            {p.location}
                          </span>
                        </td>
                        <td className="nowrap">{rupiah(p.price)}</td>
                        <td>
                          <Badge tone={complete ? 'green' : 'amber'}>
                            {complete ? 'Sudah dinilai' : 'Belum dinilai'}
                          </Badge>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-button"
                              aria-label={`Detail ${p.name}`}
                              title="Detail"
                              onClick={() => open('detail', p)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${p.name}`}
                              title="Edit"
                              onClick={() => open('edit', p)}
                            >
                              <Pencil size={15} />
                            </button>
                            <DeleteButton kind="photobox" id={p.id} label={p.name} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="no-results">Tidak ada kandidat yang cocok dengan pencarian Anda.</p>
              )}
            </div>
          </>
        ) : (
          <div>
            <EmptyState
              icon={Camera}
              title="Belum ada kandidat Photo Box."
              description="Tambahkan nama, lokasi, dan harga Photo Box pilihan Anda. Tidak ada kandidat yang dibuat otomatis."
            />
            <div className="empty-bottom-action">
              <button className="btn btn-primary" onClick={() => open('new')}>
                <Plus size={16} />
                Tambah Photo Box pertama
              </button>
            </div>
          </div>
        )}
      </Panel>
      <Notice>
        Harga adalah informasi kandidat, bukan nilai otomatis. Seluruh assessment pada lima variabel
        aktif tetap diisi manual dengan skala 1–5.
      </Notice>
      {dialog && (
        <Modal
          title={
            dialog === 'new'
              ? 'Tambah Photo Box'
              : dialog === 'edit'
                ? 'Edit Photo Box'
                : 'Detail Photo Box'
          }
          description={
            dialog === 'detail'
              ? 'Informasi kandidat dari input Owner.'
              : 'Masukkan informasi kandidat yang sebenarnya.'
          }
          onClose={() => setDialog(null)}
          busy={pending}
          wide
        >
          {dialog === 'detail' && selected ? (
            <>
              <div className="photo-detail-hero">
                <span className="candidate-icon">
                  <Camera size={29} />
                </span>
                <h3>{selected.name}</h3>
                <p>
                  <MapPin size={14} />
                  {selected.location}
                </p>
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Harga</dt>
                  <dd>{rupiah(selected.price)}</dd>
                </div>
                <div>
                  <dt>Deskripsi</dt>
                  <dd>{selected.description || 'Tidak ada deskripsi.'}</dd>
                </div>
                <div>
                  <dt>Catatan Owner</dt>
                  <dd>{selected.notes || 'Tidak ada catatan.'}</dd>
                </div>
                <div>
                  <dt>Tanggal ditambahkan</dt>
                  <dd>{date(selected.created_at)} (WIB)</dd>
                </div>
              </dl>
              <div className="detail-id">ID: {selected.id}</div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => open('edit', selected)}>
                  <Pencil size={15} />
                  Edit kandidat
                </button>
                <Link className="btn btn-primary" href={`/assessment?candidate=${selected.id}`}>
                  Buka assessment
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <form action={submit} className="form-stack modal-form">
              {selected && (
                <>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="updated_at" value={selected.updated_at} />
                </>
              )}
              <label className="field-label">
                Nama Photo Box <span className="required">*</span>
                <input
                  name="name"
                  placeholder="Nama kandidat Photo Box"
                  defaultValue={selected?.name}
                  maxLength={120}
                  required
                  disabled={pending}
                />
              </label>
              <div className="form-two-col">
                <label className="field-label">
                  Lokasi <span className="required">*</span>
                  <input
                    name="location"
                    placeholder="Alamat atau lokasi"
                    defaultValue={selected?.location}
                    maxLength={250}
                    required
                    disabled={pending}
                  />
                </label>
                <label className="field-label">
                  Harga (Rp) <span className="required">*</span>
                  <input
                    name="price"
                    type="number"
                    placeholder="Masukkan harga"
                    min="0"
                    max="999999999999.99"
                    step="0.01"
                    defaultValue={selected?.price}
                    required
                    disabled={pending}
                  />
                </label>
              </div>
              <label className="field-label">
                Deskripsi <span className="optional">opsional</span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Informasi tentang Photo Box ini"
                  maxLength={2000}
                  defaultValue={selected?.description ?? ''}
                  disabled={pending}
                />
              </label>
              <label className="field-label">
                Catatan <span className="optional">opsional</span>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Catatan tambahan untuk evaluasi"
                  maxLength={2000}
                  defaultValue={selected?.notes ?? ''}
                  disabled={pending}
                />
              </label>
              {selected && (
                <Notice>
                  Mengedit kandidat akan menghapus assessment kandidat ini dan menunda ranking
                  sampai kandidat dinilai ulang.
                </Notice>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDialog(null)}
                  disabled={pending}
                >
                  Batal
                </button>
                <button className="btn btn-primary" type="submit" disabled={pending}>
                  {pending && <LoaderCircle size={16} className="spin" />}
                  {selected ? 'Simpan perubahan' : 'Tambah kandidat'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
