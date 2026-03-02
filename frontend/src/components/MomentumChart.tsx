'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function MomentumChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/momentum')
      .then(r => r.json())
      .then(d => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
  }, []);

  const formatted = data.map((d: any) => ({
    week: new Date(d.week).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
    Capital: Number(d.capital_count),
    Policy: Number(d.policy_count),
    Growth: Number(d.growth_count),
  }));

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Loading Momentum...</div>;
  if (!formatted.length) return <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">Accumulating Weekly Data...</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ecosystem Momentum</h2>
        <p className="text-sm text-slate-500">Weekly split of Capital vs. Policy signals</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Capital" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Policy" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Growth" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
