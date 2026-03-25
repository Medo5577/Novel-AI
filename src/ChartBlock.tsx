import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, Download } from 'lucide-react';

interface ChartBlockProps {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  title: string;
  config?: {
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
  };
}

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export const ChartBlock: React.FC<ChartBlockProps> = ({ type, data, title, config }) => {
  const colors = config?.colors || DEFAULT_COLORS;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey={config?.xAxis || 'name'} stroke="#ffffff50" fontSize={12} />
            <YAxis stroke="#ffffff50" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey={config?.yAxis || 'value'} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey={config?.xAxis || 'name'} stroke="#ffffff50" fontSize={12} />
            <YAxis stroke="#ffffff50" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey={config?.yAxis || 'value'} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={config?.yAxis || 'value'}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        );
    }
  };

  const getIcon = () => {
    if (type === 'bar') return <BarChart3 size={18} />;
    if (type === 'line') return <LineIcon size={18} />;
    return <PieIcon size={18} />;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 my-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-emerald-400">
          {getIcon()}
          <span className="font-bold uppercase tracking-wider text-xs">{title}</span>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
          <Download size={16} />
        </button>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
