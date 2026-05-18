import React, { useEffect, useState } from 'react';
import { Users, FolderKanban, AlertTriangle, Crown, User } from 'lucide-react';
import api from '../api';
import { ProjectOut, DashboardData } from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────
const PROJECT_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  0: { accent: '#b94b10', bg: 'rgba(185,75,16,0.08)',  border: 'rgba(185,75,16,0.28)' },
  1: { accent: '#1a3a6b', bg: 'rgba(26,58,107,0.08)',  border: 'rgba(26,58,107,0.28)' },
  2: { accent: '#2d6a2d', bg: 'rgba(45,106,45,0.08)',  border: 'rgba(45,106,45,0.28)' },
  3: { accent: '#7a3a6b', bg: 'rgba(122,58,107,0.08)', border: 'rgba(122,58,107,0.28)' },
};

const mono: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
};

const MembersPage = () => {
  const [projects, setProjects]   = useState<ProjectOut[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([
      api.get<ProjectOut[]>('/projects'),
      api.get<DashboardData>('/dashboard'),
    ])
      .then(([pRes, dRes]) => {
        setProjects(pRes.data);
        setDashboard(dRes.data);
      })
      .catch(() => setError('Failed to load member data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#5a3d25', ...mono, fontSize: 13 }}>
      <span className="spinner" /> Loading members…
    </div>
  );

  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 440 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
    </div>
  );

  // Build task count map: user_id → count
  const taskCountMap: Record<number, number> = {};
  dashboard?.tasks_per_user.forEach(u => { taskCountMap[u.user_id] = u.count; });

  const totalMembers = new Set(
    projects.flatMap(p => p.members.map(m => m.user_id))
  ).size;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">Member Allocation</div>
          <div className="page-subtitle">
            {totalMembers} members across {projects.length} active projects
          </div>
        </div>
      </div>

      {/* ── Summary bar ───────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Members', value: totalMembers,       icon: Users,        color: '#b94b10' },
          { label: 'Projects',      value: projects.length,    icon: FolderKanban, color: '#1a3a6b' },
          { label: 'Avg Team Size', value: totalMembers > 0 && projects.length > 0
              ? (totalMembers / projects.length).toFixed(1)
              : 0,                                                icon: User,         color: '#2d6a2d' },
          { label: 'Admins',        value: projects.reduce((acc, p) =>
              acc + p.members.filter(m => m.role === 'admin').length, 0),
                                                                icon: Crown,        color: '#7a3a6b' },
        ].map(s => (
          <div key={s.label} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '4px 4px 0px rgba(26,18,7,0.14)',
          }}>
            <div style={{
              background: `${s.color}18`,
              border: `2px solid ${s.color}44`,
              padding: 10, flexShrink: 0, display: 'flex',
            }}>
              <s.icon size={20} color={s.color} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{
                fontSize: 32,
                fontFamily: "'Archivo Black', sans-serif",
                fontWeight: 900, color: s.color, lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{
                ...mono, color: '#9a7a60', fontSize: 10,
                marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Project cards ─────────────────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={32} strokeWidth={1.5} />
          <p>No projects found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {projects.map((project, idx) => {
            const palette = PROJECT_COLORS[String(idx % 4)];
            const admins  = project.members.filter(m => m.role === 'admin');
            const members = project.members.filter(m => m.role !== 'admin');

            return (
              <div key={project.id} className="card" style={{
                boxShadow: '4px 4px 0px rgba(26,18,7,0.14)',
                borderLeft: `4px solid ${palette.accent}`,
              }}>
                {/* Project header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{
                      fontFamily: "'Archivo Black', sans-serif",
                      fontSize: 20, fontWeight: 900,
                      color: palette.accent, letterSpacing: '-0.01em',
                    }}>
                      {project.name}
                    </div>
                    {project.description && (
                      <div style={{
                        ...mono, fontSize: 11, color: '#9a7a60',
                        marginTop: 4, maxWidth: 520,
                      }}>
                        {project.description}
                      </div>
                    )}
                  </div>
                  <div style={{
                    ...mono, fontSize: 10, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: palette.bg,
                    border: `2px solid ${palette.border}`,
                    color: palette.accent, padding: '4px 10px',
                    fontWeight: 700,
                  }}>
                    {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Member table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(26,18,7,0.12)' }}>
                        {['Member', 'Email', 'Role', 'Tasks Assigned'].map(h => (
                          <th key={h} style={{
                            ...mono, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#9a7a60', textAlign: 'left',
                            padding: '0 12px 10px 0',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...admins, ...members].map((member, mi) => {
                        const taskCount = taskCountMap[member.user_id] ?? 0;
                        const isAdmin   = member.role === 'admin';
                        return (
                          <tr
                            key={member.id}
                            style={{
                              borderBottom: mi < project.members.length - 1
                                ? '1px solid rgba(26,18,7,0.06)' : 'none',
                              background: isAdmin ? palette.bg : 'transparent',
                            }}
                          >
                            {/* Name */}
                            <td style={{ padding: '10px 12px 10px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 30, height: 30,
                                  background: isAdmin ? palette.accent : 'rgba(26,18,7,0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  <span style={{
                                    fontFamily: "'Archivo Black', sans-serif",
                                    fontSize: 12, fontWeight: 900,
                                    color: isAdmin ? '#fff' : '#5a3d25',
                                  }}>
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span style={{
                                  fontFamily: "'Archivo Black', sans-serif",
                                  fontWeight: 900, fontSize: 13, color: '#1a1207',
                                }}>
                                  {member.user.name}
                                </span>
                              </div>
                            </td>

                            {/* Email */}
                            <td style={{ padding: '10px 12px 10px 0' }}>
                              <span style={{ ...mono, fontSize: 11, color: '#9a7a60' }}>
                                {member.user.email}
                              </span>
                            </td>

                            {/* Role */}
                            <td style={{ padding: '10px 12px 10px 0' }}>
                              <span style={{
                                ...mono, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                color: isAdmin ? palette.accent : '#9a7a60',
                                background: isAdmin ? palette.bg : 'transparent',
                                border: isAdmin ? `1px solid ${palette.border}` : '1px solid transparent',
                                padding: '2px 6px',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}>
                                {isAdmin && <Crown size={10} />}
                                {member.role}
                              </span>
                            </td>

                            {/* Task count */}
                            <td style={{ padding: '10px 0 10px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  height: 6, flex: 1, maxWidth: 80,
                                  background: 'rgba(26,18,7,0.08)',
                                  border: '1px solid rgba(26,18,7,0.12)',
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (taskCount / 5) * 100)}%`,
                                    background: taskCount > 3 ? '#991111' : palette.accent,
                                  }} />
                                </div>
                                <span style={{
                                  fontFamily: "'Archivo Black', sans-serif",
                                  fontSize: 14, fontWeight: 900,
                                  color: taskCount > 3 ? '#991111' : '#1a1207',
                                }}>
                                  {taskCount}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MembersPage;
