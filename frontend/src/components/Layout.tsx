import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Layers, LayoutDashboard, FolderKanban, Users, ClipboardList,
  LogOut, Menu, X, MessageSquare, Mail, Settings, Sun, Moon, MapPin,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

const NAV_MAIN = [
  { to: '/',         label: 'Dashboard',        icon: LayoutDashboard, exact: true  },
  { to: '/projects', label: 'Projects',          icon: FolderKanban,    exact: false },
  { to: '/members',  label: 'Member Allocation', icon: Users,           exact: false },
  { to: '/pending',  label: 'Pending Tasks',     icon: ClipboardList,   exact: false },
];

const NAV_COMMS = [
  { to: '/chat', label: 'Team Chat',       icon: MessageSquare, exact: false },
  { to: '/dms',  label: 'Direct Messages', icon: Mail,          exact: false },
  { to: '/locations', label: 'Locations',       icon: MapPin,        exact: false },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); onClose?.(); };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 16px 16px', borderBottom: '1px solid var(--border)',
        justifyContent: onClose ? 'space-between' : 'flex-start',
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
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div className="nav-section-label">Workspace</div>
        {NAV_MAIN.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={16} />{item.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Communication</div>
        {NAV_COMMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <item.icon size={16} />{item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="theme-toggle" style={{ width: '100%', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </div>
          <div className={`toggle-track ${theme === 'light' ? 'on' : ''}`} />
        </button>

        {/* Settings */}
        <NavLink to="/settings" onClick={onClose}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={16} />Settings
        </NavLink>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginTop: 4, borderTop: '1px solid var(--border)' }}>
          <div className="avatar" style={{ background: 'var(--accent)' }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ color: 'var(--text3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Sign out" style={{ padding: 6, flexShrink: 0 }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className="sidebar"><SidebarContent /></aside>
      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="sidebar-drawer"><SidebarContent onClose={() => setMobileOpen(false)} /></aside>
        </>
      )}
      <div className="main-content">
        <header className="topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(true)} style={{ padding: 7 }}><Menu size={18} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'var(--accent)', borderRadius: 7, padding: 6, display: 'flex' }}><Layers size={14} color="#fff" /></div>
            <span style={{ fontWeight: 900, fontSize: 16 }}>TaskFlow</span>
          </div>
          <div style={{ width: 32 }} />
        </header>
        <main className="page-body"><div className="page-max">{children}</div></main>
      </div>
    </div>
  );
};

export default Layout;