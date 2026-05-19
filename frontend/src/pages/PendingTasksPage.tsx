import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle2, Circle, Loader2, Filter } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { ProjectOut, TaskOut } from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const black: React.CSSProperties = { fontFamily: "'Archivo Black', sans-serif" };

const PRIORITY_META = {
  high:   { label: 'HIGH', color: '#991111', bg: 'rgba(153,17,17,0.08)',  border: 'rgba(153,17,17,0.28)' },
  medium: { label: 'MED',  color: '#b94b10', bg: 'rgba(185,75,16,0.08)',  border: 'rgba(185,75,16,0.28)' },
  low:    { label: 'LOW',  color: '#9a7a60', bg: 'rgba(154,122,96,0.08)', border: 'rgba(154,122,96,0.28)' },
};

const STATUS_META = {
  todo:        { label: 'TODO',        icon: Circle,       color: '#9a7a60' },
  in_progress: { label: 'IN PROGRESS', icon: Loader2,      color: '#1a3a6b' },
  done:        { label: 'DONE',        icon: CheckCircle2, color: '#2d6a2d' },
};

const isOverdue = (due: string | null) => due ? new Date(due) < new Date() : false;
const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// URL filter → human label
const FILTER_LABELS: Record<string, string> = {
  all:         'All Tasks',
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Completed',
  overdue:     'Overdue',
  mine:        'My Tasks',
};

type URLFilter    = 'all' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'mine';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

interface TaskWithProject extends TaskOut { projectName: string }

// ── filter pill ───────────────────────────────────────────────────────────────
const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{
    ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '5px 12px',
    background: active ? '#b94b10' : 'transparent',
    color: active ? '#fff' : '#9a7a60',
    border: active ? '2px solid #b94b10' : '2px solid rgba(26,18,7,0.18)',
    cursor: 'pointer', transition: 'all 0.15s',
  }}>
    {label}
  </button>
);

// ── component ─────────────────────────────────────────────────────────────────
const PendingTasksPage = () => {
  const { user }              = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL filter on mount (e.g. ?filter=overdue from dashboard card click)
  const urlFilter = (searchParams.get('filter') ?? 'all') as URLFilter;

  const [allTasks,       setAllTasks]       = useState<TaskWithProject[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [activeFilter,   setActiveFilter]   = useState<URLFilter>(urlFilter);
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterProject,  setFilterProject]  = useState<string>('all');
  const [projectNames,   setProjectNames]   = useState<{ id: number; name: string }[]>([]);

  // Sync URL param → local filter when user lands from dashboard card
  useEffect(() => {
    setActiveFilter(urlFilter);
  }, [urlFilter]);

  useEffect(() => {
    api.get<ProjectOut[]>('/projects')
      .then(async pRes => {
        const projects = pRes.data;
        setProjectNames(projects.map(p => ({ id: p.id, name: p.name })));

        // Fetch ALL tasks (including done) so every filter works
        const taskArrays = await Promise.all(
          projects.map(p =>
            api.get<TaskOut[]>('/tasks', { params: { project_id: p.id } })
              .then(r => r.data.map(t => ({ ...t, projectName: p.name })))
              .catch(() => [] as TaskWithProject[])
          )
        );
        setAllTasks(taskArrays.flat());
      })
      .catch(() => setError('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  // Change active filter and update URL so the back button works correctly
  const applyFilter = (f: URLFilter) => {
    setActiveFilter(f);
    setSearchParams(f === 'all' ? {} : { filter: f });
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = allTasks.filter(t => {
    // URL / active filter
    switch (activeFilter) {
      case 'todo':        if (t.status !== 'todo')        return false; break;
      case 'in_progress': if (t.status !== 'in_progress') return false; break;
      case 'done':        if (t.status !== 'done')        return false; break;
      case 'overdue':     if (!isOverdue(t.due_date ? String(t.due_date) : null) || t.status === 'done') return false; break;
      case 'mine':        if (t.assigned_to !== user?.id) return false; break;
      case 'all':         if (t.status === 'done')        return false; break; // default: hide done
      default:            break;
    }
    // Priority filter
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    // Project filter
    if (filterProject !== 'all' && String(t.project_id) !== filterProject) return false;
    return true;
  }).sort((a, b) => {
    const aOver = isOverdue(a.due_date ? String(a.due_date) : null);
    const bOver = isOverdue(b.due_date ? String(b.due_date) : null);
    if (aOver !== bOver) return aOver ? -1 : 1;
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pd = pOrder[a.priority] - pOrder[b.priority];
    if (pd !== 0) return pd;
    return (a.due_date ?? '').localeCompare(b.due_date ?? '');
  });

  const overdueCount = filtered.filter(t => isOverdue(t.due_date ? String(t.due_date) : null) && t.status !== 'done').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#9a7a60', ...mono, fontSize: 13 }}>
      <span className="spinner" /> Loading tasks…
    </div>
  );
  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 440 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
    </div>
  );

  const pageTitle = FILTER_LABELS[activeFilter] ?? 'Tasks';

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">{pageTitle}</div>
          <div className="page-subtitle">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
            {overdueCount > 0 && activeFilter !== 'done' && (
              <span style={{ color: '#991111', marginLeft: 8 }}>· {overdueCount} overdue</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Overdue alert ─────────────────────────────────────────────────── */}
      {overdueCount > 0 && activeFilter !== 'done' && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <strong style={mono}>{overdueCount} task{overdueCount !== 1 ? 's are' : ' is'} past due.</strong>
          {' '}Update or reassign them to stay on track.
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>

        {/* Quick filters — mirroring the 6 dashboard cards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Filter size={12} color="#9a7a60" />
          <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>View:</span>
          {(
            [
              { key: 'all',         label: 'Pending'     },
              { key: 'todo',        label: 'To Do'       },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'done',        label: 'Completed'   },
              { key: 'overdue',     label: 'Overdue'     },
              { key: 'mine',        label: 'My Tasks'    },
            ] as { key: URLFilter; label: string }[]
          ).map(f => (
            <Pill key={f.key} label={f.label} active={activeFilter === f.key} onClick={() => applyFilter(f.key)} />
          ))}
        </div>

        {/* Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Priority:</span>
          {(['all', 'high', 'medium', 'low'] as FilterPriority[]).map(p => (
            <Pill key={p} label={p === 'all' ? 'All' : p} active={filterPriority === p} onClick={() => setFilterPriority(p)} />
          ))}
        </div>

        {/* Project */}
        {projectNames.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Project:</span>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...mono, fontSize: 10, color: '#5a3d25', background: 'transparent', border: '2px solid rgba(26,18,7,0.18)', padding: '5px 10px', cursor: 'pointer' }}>
              <option value="all">All Projects</option>
              {projectNames.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={32} strokeWidth={1.5} color="#2d6a2d" />
          <p style={{ color: '#2d6a2d', fontWeight: 700 }}>
            {activeFilter === 'done' ? 'No completed tasks yet.' : 'All clear — nothing matches your filters!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => {
            const over       = isOverdue(task.due_date ? String(task.due_date) : null) && task.status !== 'done';
            const priority   = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
            const statusMeta = STATUS_META[task.status]     ?? STATUS_META.todo;
            const StatusIcon = statusMeta.icon;

            return (
              <div key={task.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                boxShadow: over ? '4px 4px 0px rgba(153,17,17,0.18)' : '4px 4px 0px rgba(26,18,7,0.08)',
                borderLeft: `4px solid ${over ? '#991111' : task.status === 'done' ? '#2d6a2d' : priority.color}`,
                flexWrap: 'wrap',
                opacity: task.status === 'done' ? 0.82 : 1,
              }}>
                <StatusIcon size={16} color={statusMeta.color} strokeWidth={2} style={{ flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ ...black, fontSize: 14, fontWeight: 900, color: '#1a1207', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                    {task.title}
                    {over && (
                      <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#991111', background: 'rgba(153,17,17,0.08)', border: '1px solid rgba(153,17,17,0.28)', padding: '2px 6px' }}>
                        OVERDUE
                      </span>
                    )}
                  </div>
                  {task.description && <div style={{ ...mono, fontSize: 11, color: '#9a7a60', marginTop: 3 }}>{task.description}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: '#1a3a6b', background: 'rgba(26,58,107,0.08)', border: '1px solid rgba(26,58,107,0.24)', padding: '3px 8px' }}>{task.projectName}</span>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: priority.color, background: priority.bg, border: `1px solid ${priority.border}`, padding: '3px 8px' }}>{priority.label}</span>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: statusMeta.color, border: '1px solid rgba(26,18,7,0.12)', padding: '3px 8px' }}>{statusMeta.label}</span>
                  {task.assignee && (
                    <span style={{ ...mono, fontSize: 10, color: '#5a3d25', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 18, height: 18, background: 'rgba(26,18,7,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#5a3d25' }}>
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      {task.assignee.name.split(' ')[0]}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: 10, color: over ? '#991111' : '#9a7a60', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {formatDate(task.due_date ? String(task.due_date) : null)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingTasksPage;