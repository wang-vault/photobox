'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, LoaderCircle, MapPin, Save, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { ASSESSMENT_LABELS } from '@/lib/constants';
import type { PhotoBox, Selected, Variable, Assessment } from '@/lib/types';
import { number } from '@/lib/math';
import { saveAssessment } from '@/app/actions';
import { Badge } from './ui';
export function AssessmentForm({
  photoboxes,
  selected,
  variables,
  assessments,
  candidate,
}: {
  photoboxes: PhotoBox[];
  selected: Selected[];
  variables: Variable[];
  assessments: Assessment[];
  candidate?: string;
}) {
  const [active, setActive] = useState(
    photoboxes.some((p) => p.id === candidate) ? candidate! : photoboxes[0].id,
  );
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(
      photoboxes.map((p) => [
        p.id,
        Object.fromEntries(
          assessments
            .filter((a) => a.photobox_id === p.id)
            .map((a) => [a.selected_variable_id, a.value]),
        ),
      ]),
    ),
  );
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const p = photoboxes.find((p) => p.id === active) ?? photoboxes[0];
  const values = drafts[p.id] ?? {};
  const count = selected.filter((s) => values[s.id]).length;
  function submit() {
    if (count !== 5) return;
    startTransition(async () => {
      try {
        const result = await saveAssessment(p.id, values, p.updated_at);
        if (result.error) toast.error(result.error);
        else {
          toast.success(`Assessment ${p.name} berhasil disimpan.`);
          setDirty((prev) => ({ ...prev, [p.id]: false }));
          router.refresh();
        }
      } catch {
        toast.error('Koneksi terputus. Nilai Anda masih tersedia di form.');
      }
    });
  }
  return (
    <div className="assessment-layout">
      <aside className="panel">
        <div className="panel-header">
          <div>
            <h2>Kandidat Photo Box</h2>
            <p>Pilih kandidat untuk dinilai.</p>
          </div>
        </div>
        <div className="candidate-selector">
          {photoboxes.map((box) => {
            const complete = assessments.filter((a) => a.photobox_id === box.id).length === 5;
            return (
              <button
                className={box.id === p.id ? 'active' : ''}
                key={box.id}
                onClick={() => setActive(box.id)}
                disabled={pending}
              >
                <span className="candidate-icon">
                  <Camera size={18} />
                </span>
                <span>
                  <strong>{box.name}</strong>
                  <small>
                    {dirty[box.id]
                      ? 'Perubahan belum disimpan'
                      : complete
                        ? 'Assessment tersimpan'
                        : 'Belum dinilai'}
                  </small>
                </span>
                {complete && !dirty[box.id] && <CheckCircle2 size={17} className="text-green" />}
              </button>
            );
          })}
        </div>
        <div className="aside-note">
          Nilai yang belum disimpan akan hilang jika Anda meninggalkan halaman ini.
        </div>
      </aside>
      <section className="panel assessment-panel">
        <div className="panel-header">
          <div>
            <h2>{p.name}</h2>
            <p className="location-cell">
              <MapPin size={14} />
              {p.location}
            </p>
          </div>
          <Badge tone={count === 5 ? 'green' : 'purple'}>{count} / 5 terisi</Badge>
        </div>
        <div className="assessment-fields">
          {selected.map((s) => (
            <fieldset key={s.id} className="assessment-field">
              <legend>
                <span className="variable-code">
                  V{variables.find((v) => v.id === s.variable_id)?.code}
                </span>
                {variables.find((v) => v.id === s.variable_id)?.name}
              </legend>
              <span className="assessment-weight">Bobot {number(s.weight * 100)}%</span>
              <div className="assessment-options">
                {ASSESSMENT_LABELS.map((label, i) => (
                  <label key={label} className={values[s.id] === i + 1 ? 'selected' : ''}>
                    <input
                      type="radio"
                      name={`${p.id}-${s.id}`}
                      checked={values[s.id] === i + 1}
                      onChange={() => {
                        setDrafts((prev) => ({
                          ...prev,
                          [p.id]: { ...prev[p.id], [s.id]: i + 1 },
                        }));
                        setDirty((prev) => ({ ...prev, [p.id]: true }));
                      }}
                      disabled={pending}
                    />
                    <strong>{i + 1}</strong>
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="question-footer">
          <span className="muted">Semua nilai wajib diisi manual.</span>
          <button
            className="btn btn-primary"
            disabled={count !== 5 || pending || !dirty[p.id]}
            onClick={submit}
          >
            {pending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}Simpan
            assessment
          </button>
        </div>
      </section>
    </div>
  );
}
