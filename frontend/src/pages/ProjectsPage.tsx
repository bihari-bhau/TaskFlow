import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, ChevronRight, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Project } from '../types';

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadProjects = () => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const getMyRole = (project: Project) =>
    project.members.find(m => m.user_id === user?.id)?.role;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setFormError('Project name is required'); return; }
    setCreating(true);
    setFormError('');
    try {
      await api.post('/projects', { name: name.trim(), description: desc.trim() || undefined });
      toast.success('Project created successfully!');
      setShowModal(false);
      setName(''); setDesc('');
      loadProjects();
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      setFormError(typeof msg === 'string' ? msg : 'Failed to create project');
    } finally { setCreating(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text2)' }}>
      <span className="spinner" /> Loading projects…
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">
            {projects.length} project{projects.length !== 1 ? 's' : ''} you're involved in
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FolderKanban size={52} />
            <h3>No projects yet</h3>
            <p>Create your first project to start managing tasks with your team.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 4 }}>
              <Plus size={14} /> Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-auto">
          {projects.map(p => {
            const role = getMyRole(p);
            const taskCount = 0; // shown after navigation
            return (
              <div
                key={p.id}
                className="card card-hover"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 10, padding: 9, display: 'flex', flexShrink: 0 }}>
                      <FolderKanban size={18} color="var(--accent2)" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span className={`badge badge-${role}`}>{role}</span>
                    <ChevronRight size={16} color="var(--text3)" />
                  </div>
                </div>

                {p.description && (
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: p.description ? 0 : 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: 12 }}>
                    <Users size={13} />
                    {p.members.length} member{p.members.length !== 1 ? 's' : ''}
                  </div>
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Project</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} style={{ padding: 6 }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="form-stack">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Q3 Product Launch"
                  required autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3} style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <span className="spinner" /> : <Plus size={14} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
