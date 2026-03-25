import React, { useState } from 'react';
import { Table, Plus, Trash2, Download, Save } from 'lucide-react';

interface InteractiveTableProps {
  initialData: string[][];
  onSave?: (data: string[][]) => void;
}

export const InteractiveTable: React.FC<InteractiveTableProps> = ({ initialData, onSave }) => {
  const [data, setData] = useState<string[][]>(initialData.length > 0 ? initialData : [['', ''], ['', '']]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const addRow = () => {
    const newRow = new Array(data[0].length).fill('');
    setData([...data, newRow]);
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    setData(newData);
  };

  const removeRow = (index: number) => {
    if (data.length > 1) {
      setData(data.filter((_, i) => i !== index));
    }
  };

  const removeColumn = (index: number) => {
    if (data[0].length > 1) {
      setData(data.map(row => row.filter((_, i) => i !== index)));
    }
  };

  const exportCSV = () => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'table_data.csv';
    link.click();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 my-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Table size={18} />
          <span className="font-medium">Interactive Spreadsheet</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors" title="Export CSV">
            <Download size={16} />
          </button>
          <button onClick={() => onSave?.(data)} className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors" title="Save Changes">
            <Save size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {data[0].map((_, i) => (
                <th key={i} className="p-2 border border-white/10 bg-white/5 relative group">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Col {i + 1}</span>
                  <button 
                    onClick={() => removeColumn(i)}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5 transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="p-0 border border-white/10">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full p-2 bg-transparent text-white/90 focus:bg-white/5 outline-none transition-colors"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <button onClick={() => removeRow(rowIndex)} className="text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-4">
        <button onClick={addRow} className="flex items-center gap-1 text-xs text-white/60 hover:text-emerald-400 transition-colors">
          <Plus size={14} /> Add Row
        </button>
        <button onClick={addColumn} className="flex items-center gap-1 text-xs text-white/60 hover:text-emerald-400 transition-colors">
          <Plus size={14} /> Add Column
        </button>
      </div>
    </div>
  );
};
