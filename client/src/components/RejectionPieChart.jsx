import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export default function RejectionPieChart({ applications }) {
  const data = useMemo(() => {
    if (!applications?.length) return [];
    const map = {};
    applications.forEach((a) => {
      const reason = (a.rejectionReason || '').trim() || 'No reason / N/A';
      map[reason] = (map[reason] || 0) + 1;
    });
    const total = applications.length;
    return Object.entries(map).map(([name, count]) => ({
      name: name.length > 30 ? name.slice(0, 27) + '…' : name,
      fullName: name,
      count,
      pct: total ? ((count / total) * 100).toFixed(1) : 0,
    }));
  }, [applications]);

  if (data.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray-500">No rejection data for the selected filter.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm text-gray-500">Rejection reason (hover for details)</p>
      <div className="h-[340px] w-full max-w-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              paddingAngle={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props) =>
                `${props.payload.fullName}: ${value} (${props.payload.pct}%)`
              }
              contentStyle={{ fontSize: '12px', padding: '8px 12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
