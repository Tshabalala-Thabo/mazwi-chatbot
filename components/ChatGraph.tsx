'use client';

import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface GraphData {
  name: string;
  value: number;
}

interface ChatGraphProps {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: GraphData[];
}

const COLORS = ['#036DAD', '#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

export default function ChatGraph({ type, title, data }: ChatGraphProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="my-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        {type === 'bar' && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
            <Bar dataKey="value" fill="#036DAD" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
        
        {type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#036DAD"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
          </PieChart>
        )}
        
        {type === 'line' && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }} 
            />
            <Line type="monotone" dataKey="value" stroke="#036DAD" strokeWidth={2} dot={{ fill: '#036DAD' }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
