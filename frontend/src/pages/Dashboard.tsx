import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FolderKanban, TrendingUp, User, AlertTriangle,
  CheckCircle2, Clock, Circle, Loader2, Activity, ChevronRight,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { DashboardData, ProjectOut, TaskOut } from '../types';

const C = {
  copper: '#b94b10', navy: '#1a3a6b', green: '#2d6a2d',
  red: '#991111', muted: '#9a7a60', purple: '#5a3a7a',
  ink: '#1a1207', paper: '#ede8e2',
};
const STATUS_COLORS = [C.muted, C.navy, C.green];
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const black: React.CSSProperties = { fontFamily: "'Archivo Black', sans-serif" };

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const isOverdue = (due: string | null) => due ? new Date(due) < new Date() : false;

const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div style={{ background: C.paper, border: `2px solid rgba(26,18,7,0.28)`, padding: '8px 12px', fontSize: 12, ...mono, boxShadow: '3px 3px 0px rgba(26,18,7,0.14)' }}>
      {label && <p style={{ color: C.muted, marginBottom: 4 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || C.ink, fontWeight: 700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  ) : null;

// ── Clickable stat card ───────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: number | string; icon: React.ElementType;
  color: string; sub?: string; filter: string;
  onClick: (filter: string) => void;
}

const StatCard = ({ label, value, icon: Icon, color, sub, filter, onClick }: StatCardProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(filter)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--bg2)',
        border: `1.5px solid ${hovered ? color : 'var(--border)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        boxShadow: hovered ? `4px 4px 0px ${color}30` : '4px 4px 0px rgba(26,18,7,0.10)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      <div style={{ background: `${color}18`, border: `2px solid ${color}44`, padding: 9, flexShrink: 0, display: 'flex' }}>
        <Icon size={18} color={color} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ ...black, fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ ...mono, color: C.muted, fontSize: 10, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
        {sub && <div style={{ ...mono, color: C.muted, fontSize: 9, marginTop: 2 }}>{sub}</div>}
      </div>
      <ChevronRight size={14} color={color} style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }} />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
interface TaskWithProject extends TaskOut { projectName: string }

const Dashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [data,     setData]     = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<ProjectOut[]>([]);
  const [overdue,  setOverdue]  = useState<TaskWithProject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/dashboard'),
      api.get<ProjectOut[]>('/projects'),
    ]).then(async ([dRes, pRes]) => {
      setData(dRes.data);
      setProjects(pRes.data);
      const taskArrays = await Promise.all(
        pRes.data.map(p =>
          api.get<TaskOut[]>('/tasks', { params: { project_id: p.id } })
            .then(r => r.data.map(t => ({ ...t, projectName: p.name })))
            .catch(() => [] as TaskWithProject[])
        )
      );
      setOverdue(
        taskArrays.flat()
          .filter(t => t.status !== 'done' && isOverdue(t.due_date ? String(t.due_date) : null))
          .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
      );
    }).catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const go = (filter: string) => navigate(`/pending?filter=${filter}`);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: C.muted, ...mono, fontSize: 13 }}>
      <span className="spinner" /> Loading dashboard…
    </div>
  );
  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 440 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
    </div>
  );
  if (!data) return null;

  const pieData = [
    { name: 'To Do',       value: data.tasks_by_status.todo },
    { name: 'In Progress', value: data.tasks_by_status.in_progress },
    { name: 'Done',        value: data.tasks_by_status.done },
  ].filter(d => d.value > 0);

  const barData = data.tasks_per_user.map(u => ({ name: u.name.split(' ')[0], tasks: u.count }));
  const projectHealth = projects.map((p, i) => ({ name: p.name, members: p.members.length, color: [C.copper, C.navy, C.green, C.purple][i % 4] }));

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Welcome back, <strong>{user?.name?.split(' ')[0]}</strong> — click any card to explore
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono, fontSize: 10, color: C.green, letterSpacing: '0.08em', border: `1px solid ${C.green}44`, padding: '6px 12px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite' }} />
          LIVE
        </div>
      </div>

      {/* ── 6 Clickable stat cards ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Tasks"  value={data.total_tasks}                 icon={TrendingUp}    color={C.navy}                                      filter="all"         onClick={go} />
        <StatCard label="To Do"        value={data.tasks_by_status.todo}        icon={Circle}        color={C.muted}                                     filter="todo"        onClick={go} />
        <StatCard label="In Progress"  value={data.tasks_by_status.in_progress} icon={Loader2}       color={C.copper}                                    filter="in_progress" onClick={go} />
        <StatCard label="Completed"    value={data.tasks_by_status.done}        icon={CheckCircle2}  color={C.green}                                     filter="done"        onClick={go} />
        <StatCard label="Overdue"      value={data.overdue_tasks}               icon={AlertTriangle} color={data.overdue_tasks > 0 ? C.red : C.muted}    filter="overdue"     onClick={go} />
        <StatCard label="My Tasks"     value={data.my_tasks}                    icon={User}          color={C.purple}                                    filter="mine"        onClick={go} sub={`${data.completion_rate}% complete`} />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.14)' }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>// Tasks by Status</div>
          {pieData.length === 0 ? <div className="empty-state" style={{ padding: '30px 0' }}><p>No tasks yet</p></div> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ ...black, fontSize: 40, fontWeight: 900, color: C.green, lineHeight: 1 }}>{data.completion_rate}<span style={{ fontSize: 20 }}>%</span></div>
                <div style={{ ...mono, color: C.muted, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Completion Rate</div>
              </div>
              <div style={{ background: 'rgba(26,18,7,0.06)', border: '1px solid rgba(26,18,7,0.12)', height: 8, marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${data.completion_rate}%`, background: C.green, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Todo', color: STATUS_COLORS[0], val: data.tasks_by_status.todo, filter: 'todo' },
                  { label: 'Progress', color: STATUS_COLORS[1], val: data.tasks_by_status.in_progress, filter: 'in_progress' },
                  { label: 'Done', color: STATUS_COLORS[2], val: data.tasks_by_status.done, filter: 'done' },
                ].map(s => (
                  <div key={s.label} onClick={() => go(s.filter)} style={{ display: 'flex', alignItems: 'center', gap: 6, ...mono, fontSize: 11, color: '#5a3d25', cursor: 'pointer' }}>
                    <div style={{ width: 8, height: 8, background: s.color, flexShrink: 0 }} />
                    {s.label}: <strong style={{ color: C.ink }}>{s.val}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.14)' }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20 }}>// Tasks per Member</div>
          {barData.length === 0 ? <div className="empty-state" style={{ padding: '30px 0' }}><p>No assigned tasks</p></div> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={{ stroke: 'rgba(26,18,7,0.18)' }} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(185,75,16,0.06)' }} />
                <Bar dataKey="tasks" name="Tasks" fill={C.copper} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Project overview ──────────────────────────────────────────────── */}
      {projectHealth.length > 0 && (
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.14)', marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={12} /> // Project Overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {projectHealth.map(p => (
              <div key={p.name} style={{ border: `2px solid ${p.color}28`, padding: '14px 16px', borderLeft: `4px solid ${p.color}` }}>
                <div style={{ ...black, fontSize: 16, fontWeight: 900, color: p.color, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ ...mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</span>
                  <span style={{ ...black, fontSize: 18, fontWeight: 900, color: p.color }}>{p.members}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Overdue table ─────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(153,17,17,0.20)', borderTop: `3px solid ${C.red}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.red, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={12} /> // Overdue Tasks — {overdue.length} pending
            </div>
            <button onClick={() => go('overdue')} style={{ ...mono, fontSize: 10, fontWeight: 700, color: C.red, background: 'rgba(153,17,17,0.08)', border: '1px solid rgba(153,17,17,0.24)', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ChevronRight size={10} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(153,17,17,0.15)' }}>
                  {['Task', 'Project', 'Assignee', 'Priority', 'Due Date'].map(h => (
                    <th key={h} style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, textAlign: 'left', padding: '0 12px 10px 0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdue.map((task, i) => {
                  const pc = task.priority === 'high' ? C.red : task.priority === 'medium' ? C.copper : C.muted;
                  return (
                    <tr key={task.id} style={{ borderBottom: i < overdue.length - 1 ? '1px solid rgba(26,18,7,0.06)' : 'none', background: i % 2 === 0 ? 'rgba(153,17,17,0.02)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <div style={{ ...black, fontSize: 13, fontWeight: 900, color: C.ink }}>{task.title}</div>
                        {task.description && <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>{task.description.length > 50 ? task.description.slice(0, 50) + '…' : task.description}</div>}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}><span style={{ ...mono, fontSize: 10, fontWeight: 700, color: C.navy, background: 'rgba(26,58,107,0.08)', border: '1px solid rgba(26,58,107,0.24)', padding: '3px 8px' }}>{task.projectName}</span></td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        {task.assignee ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, background: 'rgba(26,18,7,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ ...black, fontSize: 10, fontWeight: 900, color: '#5a3d25' }}>{task.assignee.name.charAt(0)}</span>
                            </div>
                            <span style={{ ...mono, fontSize: 11, color: '#5a3d25' }}>{task.assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : <span style={{ ...mono, fontSize: 11, color: C.muted }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}><span style={{ ...mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: pc, background: `${pc}12`, border: `1px solid ${pc}30`, padding: '3px 8px' }}>{task.priority}</span></td>
                      <td style={{ padding: '10px 0' }}><span style={{ ...mono, fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Clock size={11} />{formatDate(task.due_date ? String(task.due_date) : null)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;