"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

/**
 * NairobiSignal Momentum Chart v2.2
 * Aligned with metadata-wrapped API schema and Next.js Client Boundary.
 */
export default function MomentumChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('https://nairobi-signal-api.onrender.com/momentum')
      .then(res => res.json())
      .then(result => {
        /**
         * V2.2 SCHEMA ALIGNMENT:
         * We extract the 'data' array from the { metadata, data } object.
         */
        if (result && result.data && Array.isArray(result.data)) {
          setData(result.data);
        } else if (Array.isArray(result)) {
          // Fallback for legacy raw array format
          setData(result);
        }
      })
      .catch(err => {
        console.error("Momentum Chart Pipeline Error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-xs font-mono text-slate-400 uppercase">Hydrating_Momentum_Data...</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Ecosystem Momentum</h3>
        <p className="text-xs text-slate-500 uppercase tracking-wider">Weekly split of Capital vs. Policy signals</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="week" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 10}} 
            />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
            />
            <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
            <Bar dataKey="capital_count" name="Capital" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="policy_count" name="Policy" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
