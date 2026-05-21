import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layers, LayoutDashboard, FolderKanban, Users, ClipboardList, CalendarCheck, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',        icon: LayoutDashboard, exact: true  },
  { to: '/projects',   label: 'Projects',          icon: FolderKanban,    exact: false },
  { to: '/members',    label: 'Member Allocation', icon: Users,           exact: false },
  { to: '/pending',    label: 'Pending Tasks',     icon: ClipboardList,   exact: false },
  { to: '/attendance', label: 'Attendance',        icon: CalendarCheck,   exact: false },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const initials = user?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 16px 16px', borderBottom: '1px solid var(--border)',
        justifyContent: onClose ? 'space-between' : 'flex-start'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'var(--accent)', borderRadius: 8, padding: 7, display: 'flex' }}>
            <Layers size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em' }}>TaskFlow</span>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div className="avatar" style={{ background: 'var(--accent)' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: 8 }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-drawer">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      <div className="main-content">
        <header className="topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)} style={{ padding: 7 }}>
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'var(--accent)', borderRadius: 7, padding: 6, display: 'flex' }}>
              <Layers size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>TaskFlow</span>
          </div>
        </header>

        <main className="page-body">
          <div className="page-max">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;