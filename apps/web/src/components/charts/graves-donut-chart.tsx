'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_CONFIG = [
  { key: 'occupied', label: 'Ocupados', color: '#ef4444' },
  { key: 'available', label: 'Disponíveis', color: '#22c55e' },
  { key: 'reserved', label: 'Reservados', color: '#f59e0b' },
  { key: 'blocked', label: 'Interditados', color: '#6b7280' },
];

interface Props {
  data: {
    available: number;
    occupied: number;
    reserved: number;
    blocked: number;
  };
}

export default function GravesDonutChart({ data }: Props) {
  const chartData = STATUS_CONFIG.map((s) => ({
    name: s.label,
    value: data[s.key as keyof typeof data],
    color: s.color,
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
        Nenhum jazigo cadastrado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
