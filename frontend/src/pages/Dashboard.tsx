import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FolderKanban, CheckSquare, User, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { DashboardData } from '../types';

const STATUS_COLORS = ['#71717a', '#3b82f6', '#10b981'];
const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--text)', fontWeight: 700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  ) : null;

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text2)' }}>
      <span className="spinner" /> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 400 }}>
      <AlertTriangle size={16} /> {error}
    </div>
  );

  if (!data) return null;

  const pieData = [
    { name: 'To Do', value: data.tasks_by_status.todo },
    { name: 'In Progress', value: data.tasks_by_status.in_progress },
    { name: 'Done', value: data.tasks_by_status.done },
  ].filter(d => d.value > 0);

  const barData = data.tasks_per_user.map(u => ({
    name: u.name.split(' ')[0],
    tasks: u.count,
  }));

  const statCards = [
    { label: 'Total Projects', value: data.total_projects, icon: FolderKanban, color: 'var(--accent)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Total Tasks', value: data.total_tasks, icon: TrendingUp, color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
    { label: 'My Tasks', value: data.my_tasks, icon: User, color: 'var(--green)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Overdue', value: data.overdue_tasks, icon: AlertTriangle, color: data.overdue_tasks > 0 ? 'var(--red)' : 'var(--text2)', bg: data.overdue_tasks > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg3)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Welcome back, {user?.name?.split(' ')[0]} 👋 — here's your team overview
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: s.bg, borderRadius: 12, padding: 12, flexShrink: 0, display: 'flex' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Status distribution */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Tasks by Status</div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckSquare size={32} />
              <p>No tasks yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Completion rate overlay */}
              <div style={{ textAlign: 'center', marginTop: -16, marginBottom: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)', lineHeight: 1 }}>
                  {data.completion_rate}%
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 12 }}>completion rate</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                {[{ label: 'To Do', color: STATUS_COLORS[0], val: data.tasks_by_status.todo },
                  { label: 'In Progress', color: STATUS_COLORS[1], val: data.tasks_by_status.in_progress },
                  { label: 'Done', color: STATUS_COLORS[2], val: data.tasks_by_status.done }
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    {s.label}: <strong style={{ color: 'var(--text)' }}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tasks per user */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20 }}>Tasks per Team Member</div>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <User size={32} />
              <p>No assigned tasks yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.07)' }} />
                <Bar dataKey="tasks" name="Tasks" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overdue warning */}
      {data.overdue_tasks > 0 && (
        <div className="alert alert-error" style={{ marginTop: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>{data.overdue_tasks} task{data.overdue_tasks !== 1 ? 's are' : ' is'} overdue.</strong>
            {' '}Go to your projects and update them to stay on track.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
