'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Entry, Variable } from '@/lib/types';
import { date } from '@/lib/math';
import { DeleteButton, Modal } from './mutations';
export function QuestionnaireTable({
  entries,
  variables,
}: {
  entries: Entry[];
  variables: Variable[];
}) {
  const [detail, setDetail] = useState<Entry | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      entries.filter((e) =>
        `${e.id} ${date(e.created_at)}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [entries, query],
  );
  const pageCount = Math.ceil(filtered.length / 10);
  const current = Math.min(page, Math.max(0, pageCount - 1));
  return (
    <>
      <div className="table-toolbar">
        <div className="input-icon search-input">
          <Search size={17} />
          <input
            aria-label="Cari kuesioner"
            placeholder="Cari ID atau tanggal..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <span className="muted">{entries.length} entri tersimpan</span>
      </div>
      <div className="table-scroll">
        <table className="data-table questionnaire-table">
          <thead>
            <tr>
              <th>ID Kuesioner</th>
              <th>Tanggal pengisian</th>
              {variables.map((v) => (
                <th key={v.id} title={v.name}>
                  V{v.code}
                </th>
              ))}
              <th className="align-right">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(current * 10, current * 10 + 10).map((e) => (
              <tr key={e.id}>
                <td>
                  <button className="table-id" onClick={() => setDetail(e)} title={e.id}>
                    #{e.id.slice(0, 8)}
                  </button>
                </td>
                <td className="nowrap">{date(e.created_at)}</td>
                {variables.map((v) => (
                  <td key={v.id}>
                    <span className="score-cell">
                      {e.questionnaire_scores.find((s) => s.variable_id === v.id)?.value ?? '—'}
                    </span>
                  </td>
                ))}
                <td>
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      onClick={() => setDetail(e)}
                      title="Lihat detail"
                      aria-label="Lihat detail kuesioner"
                    >
                      <Eye size={16} />
                    </button>
                    <Link
                      className="icon-button"
                      href={`/questionnaire?edit=${e.id}`}
                      title="Edit"
                      aria-label="Edit kuesioner"
                    >
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton
                      kind="questionnaire"
                      id={e.id}
                      label={`Kuesioner #${e.id.slice(0, 8)}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="no-results">Tidak ada kuesioner yang cocok dengan pencarian Anda.</p>
        )}
      </div>
      <div className="table-pagination">
        <span>
          {filtered.length
            ? `${current * 10 + 1}–${Math.min((current + 1) * 10, filtered.length)} dari ${filtered.length} entri`
            : 'Tidak ada hasil'}
        </span>
        <div>
          <button
            className="icon-button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="icon-button"
            disabled={current + 1 >= pageCount}
            onClick={() => setPage(current + 1)}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      {detail && (
        <Modal
          title="Detail kuesioner"
          description={`Diisi ${date(detail.created_at)} · WIB`}
          onClose={() => setDetail(null)}
          wide
        >
          <div className="detail-id">ID: {detail.id}</div>
          <div className="detail-scores">
            {variables.map((v) => (
              <div key={v.id}>
                <span>
                  <small>V{v.code}</small>
                  {v.name}
                </span>
                <strong>
                  {detail.questionnaire_scores.find((s) => s.variable_id === v.id)?.value ?? '—'}{' '}
                  <small>/ 5</small>
                </strong>
              </div>
            ))}
          </div>
          <p className="muted modal-note">Terakhir diperbarui: {date(detail.updated_at)} (WIB)</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setDetail(null)}>
              Tutup
            </button>
            <Link className="btn btn-primary" href={`/questionnaire?edit=${detail.id}`}>
              <Pencil size={15} />
              Edit kuesioner
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}
