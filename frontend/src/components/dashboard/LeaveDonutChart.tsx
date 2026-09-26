import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface LeaveDonutChartProps {
  totalQuota: number;
  approvedDays: number;
  pendingDays: number;
  availableDays: number;
  title?: string;
}

export const LeaveDonutChart: React.FC<LeaveDonutChartProps> = ({
  totalQuota,
  approvedDays,
  pendingDays,
  availableDays,
  title = 'Leave Overview',
}) => {
  const data = [
    { name: 'Taken', value: approvedDays, color: '#0284c7' },       // Vibrant sky blue
    { name: 'Pending', value: pendingDays, color: '#f97316' },      // Coral orange
    { name: 'Available', value: Math.max(0, availableDays), color: '#e2e8f0' }, // Soft slate gray
  ];

  // If all values are 0, provide default placeholder display
  const chartData = (approvedDays === 0 && pendingDays === 0 && availableDays === 0)
    ? [{ name: 'Available', value: 1, color: '#e2e8f0' }]
    : data.filter((d) => d.value > 0);

  return (
    <div className="bg-white p-6 sm:p-7 rounded-[26px] border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <div className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Donut Chart Visualization */}
      <div className="relative w-full h-48 sm:h-52 flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg">
                      {item.name}: {item.value} {item.value === 1 ? 'Day' : 'Days'}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={chartData.length > 1 ? 4 : 0}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Cutout Stats */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-950 leading-none tracking-tight">
            {availableDays}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
            Remaining
          </span>
        </div>
      </div>

      {/* Legend with Equal Grid Spacing & Tabular Figures */}
      <div className="grid grid-cols-3 gap-1 pt-4 border-t border-slate-100 text-xs text-center font-tabular">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f97316] flex-shrink-0" />
          <span className="text-slate-500 font-medium text-2xs">Pending</span>
          <span className="font-bold text-slate-900 text-xs">{pendingDays}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0284c7] flex-shrink-0" />
          <span className="text-slate-500 font-medium text-2xs">Taken</span>
          <span className="font-bold text-slate-900 text-xs">{approvedDays}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
          <span className="text-slate-500 font-medium text-2xs">Available</span>
          <span className="font-bold text-slate-900 text-xs">{availableDays}</span>
        </div>
      </div>
    </div>
  );
};
