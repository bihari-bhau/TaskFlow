import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Plus, UserPlus, Trash2, X, AlertCircle,
  Circle, Clock, CheckSquare, AlertTriangle,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Project, Task, TaskStatus } from '../types';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  next?: TaskStatus;
}> = {
  todo:        { label: 'To Do',       icon: <Circle size={14} />,      color: '#9a7a60', next: 'in_progress' },
  in_progress: { label: 'In Progress', icon: <Clock size={14} />,       color: '#1a3a6b', next: 'done' },
  done:        { label: 'Done',        icon: <CheckSquare size={14} />, color: '#2d6a2d' },
};

const COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'todo',        label: 'To Do',       icon: <Circle size={13} />,      color: '#9a7a60' },
  { status: 'in_progress', label: 'In Progress', icon: <Clock size={13} />,       color: '#1a3a6b' },
  { status: 'done',        label: 'Done',        icon: <CheckSquare size={13} />, color: '#2d6a2d' },
];

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({
  task, isAdmin, onUpdate, onDelete,
}: {
  task:     Task;
  isAdmin:  boolean;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}) => {
  const { user }                = useAuth();
  const [updating, setUpdating] = useState(false);
  const cfg       = STATUS_CONFIG[task.status];
  const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
  const canAct    = isAdmin || task.assigned_to === user?.id;

  const handleStatusCycle = async () => {
    if (!cfg.next || !canAct) return;
    setUpdating(true);
    try {
      await api.put(`/tasks/${task.id}`, { status: cfg.next });
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    } finally { setUpdating(false); }
  };

  return (
    <div className={`task-card priority-bar-${task.priority}${isOverdue ? ' task-card-overdue' : ''}`}>
      {/* Delete (admin only) */}
      {isAdmin && (
        <button
          className="btn btn-ghost btn-sm delete-btn"
          onClick={() => onDelete(task.id)}
          style={{ padding: 4, color: '#9a7a60' }}
          title="Delete task"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <button
          onClick={handleStatusCycle}
          disabled={!cfg.next || !canAct || updating}
          style={{
            flexShrink: 0, marginTop: 2, padding: 0,
            color: cfg.color,
            cursor: cfg.next && canAct ? 'pointer' : 'default',
            opacity: updating ? 0.5 : 1,
            background: 'none', border: 'none',
          }}
          title={cfg.next ? `Mark as ${STATUS_CONFIG[cfg.next].label}` : 'Task complete'}
        >
          {updating
            ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: cfg.color }} />
            : cfg.icon
          }
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 700, fontSize: 13, lineHeight: 1.4,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            color: task.status === 'done' ? '#9a7a60' : '#1a1207',
          }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ color: '#5a3d25', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        flexWrap: 'wrap', paddingLeft: 24,
      }}>
        <span className={`badge badge-${task.status}`} style={{ fontSize: 9 }}>
          {STATUS_CONFIG[task.status].label}
        </span>
        <span className={`badge badge-${task.priority}`} style={{ fontSize: 9 }}>
          {task.priority}
        </span>

        {task.due_date && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: isOverdue ? '#991111' : '#9a7a60',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {isOverdue && <AlertTriangle size={10} />}
            {format(parseISO(task.due_date), 'MMM d, yyyy')}
          </span>
        )}

        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            <div className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
              {task.assignee.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, color: '#5a3d25',
            }}>
              {task.assignee.name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProjectDetailPage = () => {
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [project,    setProject]    = useState<Project | null>(null);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'tasks' | 'members'>('tasks');

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle,    setTaskTitle]    = useState('');
  const [taskDesc,     setTaskDesc]     = useState('');
  const [taskDueDate,  setTaskDueDate]  = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError,    setTaskError]    = useState('');

  // Member modal state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole,  setMemberRole]  = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError,  setMemberError]  = useState('');

  const myRole  = project?.members.find(m => m.user_id === user?.id)?.role;
  const isAdmin = myRole === 'admin';

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/projects/${id}/tasks`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error('Project not found or access denied');
        navigate('/projects');
      }
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Task CRUD ──────────────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) { setTaskError('Title is required'); return; }
    setCreatingTask(true); setTaskError('');
    try {
      const payload: any = {
        title:       taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority:    taskPriority,
      };
      if (taskDueDate)  payload.due_date    = new Date(taskDueDate).toISOString();
      if (taskAssignee) payload.assigned_to = parseInt(taskAssignee);
      await api.post(`/tasks/projects/${id}/tasks`, payload);
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskTitle(''); setTaskDesc(''); setTaskDueDate('');
      setTaskPriority('medium'); setTaskAssignee('');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      setTaskError(typeof msg === 'string' ? msg : 'Failed to create task');
    } finally { setCreatingTask(false); }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      loadData();
    } catch { toast.error('Failed to delete task'); }
  };

  // ── Member CRUD ────────────────────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) { setMemberError('Email is required'); return; }
    setAddingMember(true); setMemberError('');
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail.trim(), role: memberRole });
      toast.success('Member added!');
      setShowMemberModal(false); setMemberEmail(''); setMemberRole('member');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      setMemberError(typeof msg === 'string' ? msg : 'Failed to add member');
    } finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete "${project?.name}"? This will remove all tasks permanently.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/projects');
    } catch { toast.error('Failed to delete project'); }
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 300, gap: 12,
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#9a7a60',
    }}>
      <span className="spinner" /> Loading project…
    </div>
  );

  if (!project) return null;

  const tasksByStatus = (s: TaskStatus) => tasks.filter(t => t.status === s);

  return (
    <div>
      {/* ── Back button ──────────────────────────────────────────────────── */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/projects')}
        style={{ gap: 6, marginBottom: 18, color: '#5a3d25' }}
      >
        <ChevronLeft size={15} strokeWidth={2.5} />
        All Projects
      </button>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="page-title">{project.name}</div>
            {myRole && <span className={`badge badge-${myRole}`}>{myRole}</span>}
          </div>
          {project.description && (
            <div className="page-subtitle">{project.description}</div>
          )}
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
              <Plus size={13} strokeWidth={2.5} /> Add Task
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={13} strokeWidth={2.5} /> Add Member
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              <Trash2 size={13} strokeWidth={2.5} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="tabs">
        {(['tasks', 'members'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'tasks'
              ? `Tasks (${tasks.length})`
              : `Members (${project.members.length})`
            }
          </button>
        ))}
      </div>

      {/* ── Tasks Tab — Kanban ────────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <>
          {tasks.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <CheckSquare size={44} strokeWidth={1.5} />
                <h3>No tasks yet</h3>
                <p>
                  {isAdmin
                    ? 'Create the first task to get started.'
                    : 'No tasks have been assigned yet.'}
                </p>
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => setShowTaskModal(true)} style={{ marginTop: 4 }}>
                    <Plus size={14} /> Create Task
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="kanban-board">
              {COLUMNS.map(col => {
                const colTasks = tasksByStatus(col.status);
                return (
                  <div key={col.status} className="kanban-col">

                    {/* Column header */}
                    <div className="kanban-col-header">
                      <span style={{ color: col.color }}>{col.icon}</span>
                      <span style={{
                        fontFamily: "'Archivo Black', sans-serif",
                        fontSize: 11, fontWeight: 900,
                        color: col.color,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {col.label}
                      </span>
                      <span className="col-count">{colTasks.length}</span>
                    </div>

                    {/* Empty column placeholder */}
                    {colTasks.length === 0 ? (
                      <div style={{
                        border: '2px dashed rgba(26,18,7,0.18)',
                        borderRadius: 0,
                        padding: '20px 16px',
                        textAlign: 'center',
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: '#9a7a60',
                        fontSize: 11,
                        letterSpacing: '0.06em',
                      }}>
                        No tasks
                      </div>
                    ) : (
                      colTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isAdmin={isAdmin}
                          onUpdate={loadData}
                          onDelete={handleDeleteTask}
                        />
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Members Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: 560 }}>
          {project.members.map(m => (
            <div
              key={m.id}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 10, padding: '14px 18px',
                boxShadow: '3px 3px 0px rgba(26,18,7,0.1)',
              }}
            >
              <div className="avatar avatar-lg">
                {m.user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1207' }}>
                  {m.user.name}
                  {m.user_id === user?.id && (
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: '#9a7a60', fontWeight: 400, fontSize: 11, marginLeft: 8,
                    }}>
                      (you)
                    </span>
                  )}
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#9a7a60', fontSize: 11, marginTop: 2,
                }}>
                  {m.user.email}
                </div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {isAdmin && m.user_id !== user?.id && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemoveMember(m.user_id)}
                  style={{ padding: '5px 8px' }}
                  title="Remove member"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Task</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)} style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {taskError && (
              <div className="alert alert-error" style={{ marginBottom: 18 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="form-stack">
              <div className="form-group">
                <label>Title *</label>
                <input
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Add more details…"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {project.members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingTask}>
                  {creatingTask ? <span className="spinner" /> : <Plus size={14} />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ──────────────────────────────────────────────── */}
      {showMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title">Add Member</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemberModal(false)} style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {memberError && (
              <div className="alert alert-error" style={{ marginBottom: 18 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {memberError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="form-stack">
              <div className="form-group">
                <label>User Email *</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required autoFocus
                />
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, color: '#9a7a60', marginTop: 6, display: 'block',
                }}>
                  The user must already have an account on TaskFlow.
                </span>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="member">Member — can view and update assigned tasks</option>
                  <option value="admin">Admin — full control over project and tasks</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingMember}>
                  {addingMember ? <span className="spinner" /> : <UserPlus size={14} />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;