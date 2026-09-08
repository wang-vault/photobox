'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { VARIABLES, VARIABLE_DESCRIPTIONS, LIKERT } from '@/lib/constants';
import { saveQuestionnaire } from '@/app/actions';
import { Notice } from './ui';
export function QuestionnaireForm({
  initial = {},
  id,
  updatedAt,
  invalidates,
}: {
  initial?: Record<string, number>;
  id?: string;
  updatedAt?: string;
  invalidates: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [ack, setAck] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const count = Object.keys(values).length;
  function submit() {
    if (count !== 10) {
      toast.error('Isi seluruh 10 variabel terlebih dahulu.');
      return;
    }
    if (invalidates && !ack) {
      toast.error('Setujui pembatalan assessment lama terlebih dahulu.');
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveQuestionnaire(values, id, updatedAt);
        if (result.error) toast.error(result.error);
        else {
          toast.success('Kuesioner berhasil disimpan. Analisis telah diperbarui.');
          setSaved(true);
          router.refresh();
        }
      } catch {
        toast.error('Koneksi terputus. Jawaban Anda masih tersimpan di form ini.');
      }
    });
  }
  if (saved)
    return (
      <div className="panel empty-state">
        <div className="success-orb">
          <CheckCircle2 size={38} />
        </div>
        <span className="eyebrow">TERSIMPAN DI SUPABASE</span>
        <h2>Kuesioner berhasil disimpan!</h2>
        <p>
          Sepuluh penilaian Anda telah masuk ke analisis. Lihat hasilnya atau tambahkan entri
          penilaian berikutnya.
        </p>
        <div className="button-row">
          <Link className="btn btn-primary" href="/analysis">
            Lihat analisis
            <ArrowRight size={16} />
          </Link>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (id) {
                router.push('/questionnaire');
              } else {
                setValues({});
                setStep(0);
                setAck(false);
                setSaved(false);
              }
            }}
          >
            Isi kuesioner baru
          </button>
        </div>
      </div>
    );
  return (
    <div className="questionnaire-layout">
      <aside className="panel questionnaire-aside">
        <div className="panel-header">
          <div>
            <h2>
              <ClipboardList size={17} />
              Variabel penilaian
            </h2>
            <p>Seberapa penting bagi Anda?</p>
          </div>
        </div>
        <div className="question-steps">
          {VARIABLES.map((name, i) => (
            <button
              key={name}
              onClick={() => setStep(i)}
              disabled={pending}
              className={`${i === step ? 'active' : ''} ${values[String(i + 1)] ? 'answered' : ''}`}
            >
              <span>
                {values[String(i + 1)] ? <Check size={12} /> : String(i + 1).padStart(2, '0')}
              </span>
              <strong>{name}</strong>
            </button>
          ))}
        </div>
        <div className="aside-note">
          <ShieldCheck size={16} />
          <span>Setiap entri adalah satu data kuesioner. Tidak ada nilai yang diisi otomatis.</span>
        </div>
      </aside>
      <div className="questionnaire-main">
        <div className="panel question-panel">
          <div className="question-progress">
            <span>
              Pertanyaan <strong>{step + 1}</strong> dari 10
            </span>
            <span>{count} / 10 terisi</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${count * 10}%` }} />
          </div>
          <div className="question-body">
            <div className="question-number">VARIABEL {String(step + 1).padStart(2, '0')}</div>
            <h2>{VARIABLES[step]}</h2>
            <p>{VARIABLE_DESCRIPTIONS[step]}</p>
            <fieldset className="likert-options">
              <legend>Pilih tingkat kepentingan</legend>
              {LIKERT.map((label, i) => (
                <label
                  key={label}
                  className={`likert-option ${values[String(step + 1)] === i + 1 ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`variable-${step}`}
                    value={i + 1}
                    checked={values[String(step + 1)] === i + 1}
                    onChange={() => setValues({ ...values, [String(step + 1)]: i + 1 })}
                    disabled={pending}
                  />
                  <span className="likert-value">{i + 1}</span>
                  <span>{label}</span>
                  <span className="radio-indicator">
                    {values[String(step + 1)] === i + 1 && <span />}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="question-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || pending}
            >
              <ArrowLeft size={16} />
              Sebelumnya
            </button>
            {step < 9 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                disabled={!values[String(step + 1)] || pending}
              >
                Selanjutnya
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={count !== 10 || pending || (invalidates && !ack)}
              >
                {pending ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}Simpan
                Kuesioner
              </button>
            )}
          </div>
        </div>
        {invalidates ? (
          <div className="panel acknowledgement">
            <Notice>
              Perubahan kuesioner menghitung ulang analisis dan membatalkan TOP 5, seluruh
              assessment, serta ranking sebelumnya.
            </Notice>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                disabled={pending}
              />
              Saya memahami bahwa assessment perlu diisi ulang.
            </label>
          </div>
        ) : (
          <Notice>
            Nilai 1–5 menunjukkan tingkat <strong>kepentingan variabel</strong>, bukan kualitas
            kandidat Photo Box. Seluruh jawaban wajib diisi sebelum disimpan.
          </Notice>
        )}
      </div>
    </div>
  );
}
