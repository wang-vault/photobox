'use client';
import { useState, useSyncExternalStore } from 'react';
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
function useMounted() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import { number } from '@/lib/math';
const COLORS = [
  '#7C3AED',
  '#EC4899',
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#06B6D4',
  '#F97316',
  '#6366F1',
];
export function AnalysisChart({
  data,
}: {
  data: { name: string; label: string; value: number; top: boolean }[];
}) {
  const mounted = useMounted();
  if (!data.length) return null;
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Rata-rata sepuluh variabel. Nilai lengkap tersedia di tabel analisis."
    >
      {mounted ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 16, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#eeedf2" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#868393', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#868393', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: '#f8f5ff' }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="chart-tooltip">
                    <strong>{payload[0].payload.label}</strong>
                    <span>Rata-rata: {number(Number(payload[0].value), 4)} / 5</span>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={38} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.top ? '#8b5cf6' : '#ddd4f7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="skeleton" style={{ height: 300 }} />
      )}
      <div className="chart-legend">
        <span>
          <i style={{ background: '#8b5cf6' }} />
          TOP 5 variabel
        </span>
        <span>
          <i style={{ background: '#ddd4f7' }} />
          Variabel lainnya
        </span>
      </div>
    </div>
  );
}
export function RankingBarChart({ data }: { data: { name: string; value: number }[] }) {
  const mounted = useMounted();
  if (!data.length) return null;
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label="Perbandingan skor akhir kandidat. Nilai lengkap tersedia di tabel ranking."
    >
      {mounted ? (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 48)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 5, right: 20, top: 15, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#eeedf2" />
            <XAxis
              type="number"
              domain={[0, 5]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#868393' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#686575' }}
              tickFormatter={(v) =>
                String(v).length > 16 ? String(v).slice(0, 16) + '…' : String(v)
              }
            />
            <Tooltip
              cursor={{ fill: '#f8f5ff' }}
              formatter={(v) => [number(Number(v), 4), 'Skor akhir']}
              contentStyle={{ borderRadius: 12, border: '1px solid #eeeaf4', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={28} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.name + i} fill={i === 0 ? '#7c3aed' : '#d4c5f7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="skeleton" style={{ height: 300 }} />
      )}
    </div>
  );
}
export function AssessmentRadar({
  data,
  candidates,
}: {
  data: Record<string, string | number>[];
  candidates: { id: string; name: string }[];
}) {
  const mounted = useMounted();
  const [visible, setVisible] = useState(candidates.map((p) => p.id));
  if (!data.length || !candidates.length) return null;
  return (
    <div className="radar-container">
      <div className="radar-filters">
        {candidates.map((p, i) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={visible.includes(p.id)}
              onChange={(e) =>
                setVisible(
                  e.target.checked ? [...visible, p.id] : visible.filter((id) => id !== p.id),
                )
              }
            />
            <i style={{ background: COLORS[i % COLORS.length] }} />
            {p.name}
          </label>
        ))}
      </div>
      {!visible.length ? (
        <p className="no-results">Pilih kandidat untuk ditampilkan.</p>
      ) : (
        <div
          role="img"
          aria-label="Radar assessment lima variabel. Nilai lengkap tersedia di rincian perhitungan."
        >
          {mounted ? (
            <ResponsiveContainer width="100%" height={335}>
              <RadarChart data={data} outerRadius="68%">
                <PolarGrid stroke="#e9e4f1" />
                <PolarAngleAxis dataKey="variable" tick={{ fontSize: 12, fill: '#777183' }} />
                <PolarRadiusAxis
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fontSize: 10, fill: '#97919f' }}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v, name) => [v, candidates.find((p) => p.id === name)?.name ?? name]}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload.label ?? _label}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                {candidates
                  .filter((p) => visible.includes(p.id))
                  .map((p) => {
                    const i = candidates.findIndex((c) => c.id === p.id);
                    return (
                      <Radar
                        key={p.id}
                        dataKey={p.id}
                        name={p.id}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.06}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    );
                  })}
                <Legend
                  formatter={(v) => candidates.find((p) => p.id === v)?.name ?? v}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="skeleton" style={{ height: 335 }} />
          )}
        </div>
      )}
    </div>
  );
}
