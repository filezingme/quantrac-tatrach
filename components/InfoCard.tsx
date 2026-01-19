import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'amber' | 'red';
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, unit, subValue, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
        </div>
        {subValue && <p className="text-xs text-slate-400 mt-2">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
        {icon}
      </div>
    </div>
  );
};