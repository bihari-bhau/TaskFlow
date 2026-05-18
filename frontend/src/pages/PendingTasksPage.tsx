import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Circle, Loader2, Filter } from 'lucide-react';
import api from '../api';
import { ProjectOut, TaskOut } from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────
const mono: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const PRIORITY_META = {
  high:   { label: 'HIGH',   color: '#991111', bg: 'rgba(153,17,17,0.08)',   border: 'rgba(153,17,17,0.28)' },
  medium: { label: 'MED',    color: '#b94b10', bg: 'rgba(185,75,16,0.08)',   border: 'rgba(185,75,16,0.28)' },
  low:    { label: 'LOW',    color: '#9a7a60', bg: 'rgba(154,122,96,0.08)',  border: 'rgba(154,122,96,0.28)' },
};

const STATUS_META = {
  todo:        { label: 'TODO',        icon: Circle,        color: '#9a7a60' },
  in_progress: { label: 'IN PROGRESS', icon: Loader2,       color: '#1a3a6b' },
  done:        { label: 'DONE',        icon: CheckCircle2,  color: '#2d6a2d' },
};

const isOverdue = (due: string | null) =>
  due ? new Date(due) < new Date() : false;

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

type FilterStatus = 'all' | 'todo' | 'in_progress';
type FilterPriority = 'all' | 'high' | 'medium' | 'low';

interface TaskWithProject extends TaskOut {
  projectName: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
const PendingTasksPage = () => {
  const [tasks,    setTasks]    = useState<TaskWithProject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filterStatus,   setFilterStatus]   = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
  const [filterProject,  setFilterProject]  = useState<string>('all');
  const [projectNames,   setProjectNames]   = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    api.get<ProjectOut[]>('/projects')
      .then(async pRes => {
        const projects = pRes.data;
        setProjectNames(projects.map(p => ({ id: p.id, name: p.name })));

        // Fetch tasks for all projects in parallel
        const taskArrays = await Promise.all(
          projects.map(p =>
            api.get<TaskOut[]>(`/tasks`, { params: { project_id: p.id } })
              .then(r => r.data.map(t => ({ ...t, projectName: p.name })))
              .catch(() => [] as TaskWithProject[])
          )
        );

        // Flatten and filter to pending only
        const pending = taskArrays
          .flat()
          .filter(t => t.status !== 'done')
          .sort((a, b) => {
            // Overdue first, then by priority, then by due date
            const aOver = isOverdue(a.due_date ? String(a.due_date) : null);
            const bOver = isOverdue(b.due_date ? String(b.due_date) : null);
            if (aOver !== bOver) return aOver ? -1 : 1;
            const pOrder = { high: 0, medium: 1, low: 2 };
            const pDiff = pOrder[a.priority] - pOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return (a.due_date ?? '').localeCompare(b.due_date ?? '');
          });

        setTasks(pending);
      })
      .catch(() => setError('Failed to load pending tasks'))
      .finally(() => setLoading(false));
  }, []);

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (filterStatus   !== 'all' && t.status   !== filterStatus)   return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterProject  !== 'all' && String(t.project_id) !== filterProject) return false;
    return true;
  });

  const overdueCount = filtered.filter(t =>
    isOverdue(t.due_date ? String(t.due_date) : null)
  ).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#5a3d25', ...mono, fontSize: 13 }}>
      <span className="spinner" /> Loading tasks…
    </div>
  );

  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 440 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
    </div>
  );

  // ── Filter pill component ───────────────────────────────────────────────────
  const FilterPill = ({
    label, active, onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        ...mono, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '5px 12px',
        background: active ? '#b94b10' : 'transparent',
        color: active ? '#fff' : '#9a7a60',
        border: active ? '2px solid #b94b10' : '2px solid rgba(26,18,7,0.18)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">Pending Tasks</div>
          <div className="page-subtitle">
            {filtered.length} pending task{filtered.length !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <span style={{ color: '#991111', marginLeft: 8 }}>
                · {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Overdue alert ─────────────────────────────────────────────────── */}
      {overdueCount > 0 && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <strong style={mono}>
            {overdueCount} task{overdueCount !== 1 ? 's are' : ' is'} past due date.
          </strong>
          {' '}Reassign or update them to keep your projects on track.
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16,
        marginBottom: 24, alignItems: 'center',
      }}>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={12} color="#9a7a60" />
          <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status:</span>
          {(['all', 'todo', 'in_progress'] as FilterStatus[]).map(s => (
            <FilterPill key={s} label={s === 'in_progress' ? 'In Progress' : s === 'all' ? 'All' : 'Todo'}
              active={filterStatus === s} onClick={() => setFilterStatus(s)} />
          ))}
        </div>

        {/* Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Priority:</span>
          {(['all', 'high', 'medium', 'low'] as FilterPriority[]).map(p => (
            <FilterPill key={p} label={p === 'all' ? 'All' : p}
              active={filterPriority === p} onClick={() => setFilterPriority(p)} />
          ))}
        </div>

        {/* Project */}
        {projectNames.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ ...mono, fontSize: 10, color: '#9a7a60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Project:</span>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              style={{
                ...mono, fontSize: 10, color: '#5a3d25',
                background: 'transparent',
                border: '2px solid rgba(26,18,7,0.18)',
                padding: '5px 10px', cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              <option value="all">All Projects</option>
              {projectNames.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={32} strokeWidth={1.5} color="#2d6a2d" />
          <p style={{ color: '#2d6a2d', fontWeight: 700 }}>All clear — no pending tasks match your filters!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(task => {
            const overdue    = isOverdue(task.due_date ? String(task.due_date) : null);
            const priority   = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
            const statusMeta = STATUS_META[task.status]     ?? STATUS_META.todo;
            const StatusIcon = statusMeta.icon;

            return (
              <div
                key={task.id}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                  boxShadow: overdue
                    ? '4px 4px 0px rgba(153,17,17,0.20)'
                    : '4px 4px 0px rgba(26,18,7,0.10)',
                  borderLeft: overdue
                    ? '4px solid #991111'
                    : `4px solid ${priority.color}`,
                  flexWrap: 'wrap',
                }}
              >
                {/* Status icon */}
                <StatusIcon size={16} color={statusMeta.color} strokeWidth={2} style={{ flexShrink: 0 }} />

                {/* Task info */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{
                    fontFamily: "'Archivo Black', sans-serif",
                    fontSize: 14, fontWeight: 900, color: '#1a1207',
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  }}>
                    {task.title}
                    {overdue && (
                      <span style={{
                        ...mono, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.1em', color: '#991111',
                        background: 'rgba(153,17,17,0.08)',
                        border: '1px solid rgba(153,17,17,0.28)',
                        padding: '2px 6px',
                      }}>
                        OVERDUE
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <div style={{ ...mono, fontSize: 11, color: '#9a7a60', marginTop: 3 }}>
                      {task.description}
                    </div>
                  )}
                </div>

                {/* Metadata chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Project */}
                  <span style={{
                    ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: '#1a3a6b', background: 'rgba(26,58,107,0.08)',
                    border: '1px solid rgba(26,58,107,0.24)', padding: '3px 8px',
                  }}>
                    {task.projectName}
                  </span>

                  {/* Priority */}
                  <span style={{
                    ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: priority.color, background: priority.bg,
                    border: `1px solid ${priority.border}`, padding: '3px 8px',
                  }}>
                    {priority.label}
                  </span>

                  {/* Status */}
                  <span style={{
                    ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: statusMeta.color, padding: '3px 8px',
                    border: '1px solid rgba(26,18,7,0.12)',
                  }}>
                    {statusMeta.label}
                  </span>

                  {/* Assignee */}
                  {task.assignee && (
                    <span style={{
                      ...mono, fontSize: 10, color: '#5a3d25',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <div style={{
                        width: 18, height: 18, background: 'rgba(26,18,7,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontFamily: "'Archivo Black', sans-serif", fontWeight: 900,
                        color: '#5a3d25',
                      }}>
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </div>
                      {task.assignee.name.split(' ')[0]}
                    </span>
                  )}

                  {/* Due date */}
                  <span style={{
                    ...mono, fontSize: 10,
                    color: overdue ? '#991111' : '#9a7a60',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
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
