'use client';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MomentumChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://nairobi-signal-api.onrender.com/momentum')
      .then(r => r.json())
      .then(result => {
        if (Array.isArray(result)) {
          setData(result);
        } else if (result && result.data && Array.isArray(result.data)) {
          setData(result.data);
        } else {
          setData([]);
        }
      })
      .catch(err => console.error("Momentum Pipeline Error:", err));
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="mb-6">
        <h3 className="font-bold text-slate-800 text-lg">Ecosystem Momentum</h3>
        <p className="text-sm text-slate-500">Weekly split of Capital vs. Policy signals</p>
      </div>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(str) => {
                const date = new Date(str);
                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
              }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
            <Bar dataKey="capital_count" name="Capital" stackId="a" fill="#22c55e" radius={[2, 2, 0, 0]} barSize={40} />
            <Bar dataKey="policy_count" name="Policy" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
