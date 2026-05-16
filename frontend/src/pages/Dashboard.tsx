import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { FolderKanban, TrendingUp, User, AlertTriangle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { DashboardData } from '../types';

// ── Copper Brutalist chart palette ────────────────────────────────────────────
const STATUS_COLORS = [
  '#9a7a60', // todo     — muted copper-brown
  '#1a3a6b', // progress — deep navy
  '#2d6a2d', // done     — forest green
];

// ── Recharts custom tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div style={{
      background: '#ede8e2',
      border: '2px solid rgba(26,18,7,0.38)',
      borderRadius: 0,
      padding: '8px 12px',
      fontSize: 12,
      fontFamily: "'IBM Plex Mono', monospace",
      boxShadow: '3px 3px 0px rgba(26,18,7,0.14)',
    }}>
      {label && (
        <p style={{ color: '#5a3d25', marginBottom: 4, letterSpacing: '0.04em' }}>{label}</p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#1a1207', fontWeight: 700 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  ) : null;

// ── Component ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#5a3d25', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
      <span className="spinner" /> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 440 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
      {error}
    </div>
  );

  if (!data) return null;

  const pieData = [
    { name: 'To Do',       value: data.tasks_by_status.todo },
    { name: 'In Progress', value: data.tasks_by_status.in_progress },
    { name: 'Done',        value: data.tasks_by_status.done },
  ].filter(d => d.value > 0);

  const barData = data.tasks_per_user.map(u => ({
    name:  u.name.split(' ')[0],
    tasks: u.count,
  }));

  const statCards = [
    {
      label: 'Total Projects',
      value: data.total_projects,
      icon:  FolderKanban,
      color: '#b94b10',                       // copper
      bg:    'rgba(185,75,16,0.1)',
      bd:    'rgba(185,75,16,0.28)',
    },
    {
      label: 'Total Tasks',
      value: data.total_tasks,
      icon:  TrendingUp,
      color: '#1a3a6b',                       // navy
      bg:    'rgba(26,58,107,0.1)',
      bd:    'rgba(26,58,107,0.28)',
    },
    {
      label: 'My Tasks',
      value: data.my_tasks,
      icon:  User,
      color: '#2d6a2d',                       // forest green
      bg:    'rgba(45,106,45,0.1)',
      bd:    'rgba(45,106,45,0.28)',
    },
    {
      label: 'Overdue',
      value: data.overdue_tasks,
      icon:  AlertTriangle,
      color: data.overdue_tasks > 0 ? '#991111' : '#9a7a60',
      bg:    data.overdue_tasks > 0 ? 'rgba(153,17,17,0.08)' : 'rgba(26,18,7,0.05)',
      bd:    data.overdue_tasks > 0 ? 'rgba(153,17,17,0.28)' : 'rgba(26,18,7,0.18)',
    },
  ];

  const legendItems = [
    { label: 'To Do',       color: STATUS_COLORS[0], val: data.tasks_by_status.todo },
    { label: 'In Progress', color: STATUS_COLORS[1], val: data.tasks_by_status.in_progress },
    { label: 'Done',        color: STATUS_COLORS[2], val: data.tasks_by_status.done },
  ];

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Welcome back, {user?.name?.split(' ')[0]} — here's your team overview
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div
            key={s.label}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 16, boxShadow: '4px 4px 0px rgba(26,18,7,0.14)' }}
          >
            <div style={{
              background: s.bg,
              border: `2px solid ${s.bd}`,
              borderRadius: 0,
              padding: 10,
              flexShrink: 0,
              display: 'flex',
            }}>
              <s.icon size={20} color={s.color} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{
                fontSize: 32,
                fontFamily: "'Archivo Black', sans-serif",
                fontWeight: 900,
                color: s.color,
                lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                color: '#9a7a60',
                fontSize: 10,
                marginTop: 5,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>

        {/* Status distribution */}
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.14)' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9a7a60',
            marginBottom: 20,
          }}>
            // Tasks by Status
          </div>

          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No tasks yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Completion rate */}
              <div style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                <div style={{
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 36,
                  fontWeight: 900,
                  color: '#2d6a2d',
                  lineHeight: 1,
                }}>
                  {data.completion_rate}
                  <span style={{ fontSize: 20 }}>%</span>
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#9a7a60',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}>
                  Completion Rate
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
                {legendItems.map(s => (
                  <div key={s.label} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11, color: '#5a3d25',
                  }}>
                    <div style={{ width: 8, height: 8, background: s.color, flexShrink: 0 }} />
                    {s.label}: <strong style={{ color: '#1a1207' }}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tasks per team member */}
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.14)' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9a7a60',
            marginBottom: 20,
          }}>
            // Tasks per Member
          </div>

          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>No assigned tasks yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9a7a60', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                  axisLine={{ stroke: 'rgba(26,18,7,0.18)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9a7a60', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(185,75,16,0.06)' }}
                />
                <Bar
                  dataKey="tasks"
                  name="Tasks"
                  fill="#b94b10"
                  radius={[0, 0, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Overdue alert ────────────────────────────────────────────────── */}
      {data.overdue_tasks > 0 && (
        <div className="alert alert-error">
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {data.overdue_tasks} task{data.overdue_tasks !== 1 ? 's are' : ' is'} overdue.
            </strong>
            {' '}Go to your projects and update them to stay on track.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;