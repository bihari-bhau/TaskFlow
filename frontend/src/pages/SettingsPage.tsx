import React, { useState, useEffect } from 'react';
import {
  User, Palette, Bell, Shield,
  Sun, Moon, Check, Save, Eye, EyeOff, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';

type Section = 'profile' | 'appearance' | 'notifications' | 'security';

const SECTIONS: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: User,    desc: 'Name, email, and location' },
  { id: 'appearance',    label: 'Appearance',    icon: Palette, desc: 'Theme and display' },
  { id: 'notifications', label: 'Notifications', icon: Bell,    desc: 'Alerts and emails' },
  { id: 'security',      label: 'Security',      icon: Shield,  desc: 'Password and sessions' },
];

const TIMEZONES = [
  { label: '🇮🇳  IST — India (UTC+5:30)',            value: 'Asia/Kolkata'                       },
  { label: '🌐  UTC',                                value: 'UTC'                                },
  { label: '🇺🇸  EST — New York (UTC-5)',             value: 'America/New_York'                   },
  { label: '🇺🇸  CST — Chicago (UTC-6)',              value: 'America/Chicago'                    },
  { label: '🇺🇸  MST — Denver (UTC-7)',               value: 'America/Denver'                     },
  { label: '🇺🇸  PST — Los Angeles (UTC-8)',          value: 'America/Los_Angeles'                },
  { label: '🇬🇧  GMT — London (UTC+0)',               value: 'Europe/London'                      },
  { label: '🇪🇺  CET — Paris/Berlin (UTC+1)',         value: 'Europe/Paris'                       },
  { label: '🇪🇺  EET — Helsinki/Kyiv (UTC+2)',        value: 'Europe/Helsinki'                    },
  { label: '🇷🇺  MSK — Moscow (UTC+3)',               value: 'Europe/Moscow'                      },
  { label: '🇵🇰  PKT — Karachi (UTC+5)',              value: 'Asia/Karachi'                       },
  { label: '🇧🇩  BST — Dhaka (UTC+6)',               value: 'Asia/Dhaka'                         },
  { label: '🇹🇭  ICT — Bangkok (UTC+7)',              value: 'Asia/Bangkok'                       },
  { label: '🇮🇩  WIB — Jakarta (UTC+7)',              value: 'Asia/Jakarta'                       },
  { label: '🇨🇳  CST — Shanghai (UTC+8)',             value: 'Asia/Shanghai'                      },
  { label: '🇸🇬  SGT — Singapore (UTC+8)',            value: 'Asia/Singapore'                     },
  { label: '🇯🇵  JST — Tokyo (UTC+9)',                value: 'Asia/Tokyo'                         },
  { label: '🇦🇺  AEST — Sydney (UTC+10)',             value: 'Australia/Sydney'                   },
  { label: '🇳🇿  NZST — Auckland (UTC+12)',           value: 'Pacific/Auckland'                   },
  { label: '🇧🇷  BRT — São Paulo (UTC-3)',            value: 'America/Sao_Paulo'                  },
  { label: '🇦🇷  ART — Buenos Aires (UTC-3)',         value: 'America/Argentina/Buenos_Aires'     },
  { label: '🇰🇪  EAT — Nairobi (UTC+3)',              value: 'Africa/Nairobi'                     },
  { label: '🇳🇬  WAT — Lagos (UTC+1)',                value: 'Africa/Lagos'                       },
  { label: '🇿🇦  SAST — Johannesburg (UTC+2)',        value: 'Africa/Johannesburg'                },
  { label: '🇮🇱  IST — Israel (UTC+2)',               value: 'Asia/Jerusalem'                     },
];

const LOCATION_KEY = 'tf_member_locations';
const loadLocations = (): Record<number, any> => {
  try { return JSON.parse(localStorage.getItem(LOCATION_KEY) || '{}'); }
  catch { return {}; }
};
const saveLocation = (userId: number, data: any) => {
  const all = loadLocations();
  all[userId] = { ...all[userId], ...data };
  localStorage.setItem(LOCATION_KEY, JSON.stringify(all));
};

// ── Profile Section ───────────────────────────────────────────────────────────
const ProfileSection = () => {
  const { user } = useAuth();
  const saved = user ? loadLocations()[user.id] || {} : {};

  const [name,     setName]     = useState(user?.name ?? '');
  const [email,    setEmail]    = useState(user?.email ?? '');
  const [city,     setCity]     = useState(saved.city     || '');
  const [country,  setCountry]  = useState(saved.country  || '');
  const [timezone, setTimezone] = useState(saved.timezone || 'Asia/Kolkata');
  const [lat,      setLat]      = useState<string>(saved.lat?.toString() || '');
  const [lng,      setLng]      = useState<string>(saved.lng?.toString() || '');
  const [saving,   setSaving]   = useState(false);
  const [locating, setLocating] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
        toast.success('Location detected! Add your city & country manually.');
      },
      () => {
        setLocating(false);
        toast.error('Location access denied');
      }
    );
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    saveLocation(user.id, {
      userId: user.id, name: user.name, email: user.email,
      city, country, timezone,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
    });
    setSaving(false);
    toast.success('Profile & location saved!');
  };

  const initials = name.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">Profile Information</div>
        <div className="settings-section-desc">Update your display name, email, and account details</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{name || 'Your Name'}</div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>{email}</div>
            {city && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{city}{country ? `, ${country}` : ''}</div>}
          </div>
        </div>

        <div className="form-stack">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
              : <><Save size={14} /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* Location section */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <MapPin size={16} color="var(--accent)" />
          <div className="settings-section-title" style={{ marginBottom: 0 }}>Location</div>
        </div>
        <div className="settings-section-desc">
          Your location is shown on the Team Locations page and used for timezone-aware scheduling
        </div>

        <div className="form-stack">
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Patna, Delhi, Mumbai" />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. India" />
            </div>
          </div>

          <div className="form-group">
            <label>Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Coordinates (for map pin)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="Latitude e.g. 25.5941"
                  type="number"
                  step="any"
                />
              </div>
              <div style={{ flex: 1 }}>
                <input
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  placeholder="Longitude e.g. 85.1376"
                  type="number"
                  step="any"
                />
              </div>
              <button
                onClick={detectLocation}
                disabled={locating}
                className="btn btn-secondary"
                title="Auto-detect from browser"
                style={{ flexShrink: 0, gap: 6 }}
              >
                {locating
                  ? <span className="spinner" style={{ width: 14, height: 14 }} />
                  : <MapPin size={14} />}
                {locating ? 'Detecting…' : 'Detect'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              Used to show your pin on the map. Click Detect to use your browser's GPS, or enter manually.
              Find coordinates at{' '}
              <a href="https://www.latlong.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                latlong.net
              </a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
              : <><MapPin size={14} /> Save Location</>}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Danger Zone</div>
        <div className="settings-section-desc">Irreversible account actions</div>
        <button className="btn btn-danger" onClick={() => toast.error('This would delete your account')}>
          Delete Account
        </button>
      </div>
    </div>
  );
};

// ── Appearance Section ────────────────────────────────────────────────────────
const AppearanceSection = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">Theme</div>
        <div className="settings-section-desc">Choose how TaskFlow looks on your device</div>

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          {[
            { id: 'dark',  icon: Moon, label: 'Dark',  preview: { bg: '#09090b', border: '#27272a', stripe: '#6366f1' } },
            { id: 'light', icon: Sun,  label: 'Light', preview: { bg: '#ffffff', border: '#e2e2ea', stripe: '#6366f1' } },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => theme !== opt.id && toggleTheme()}
              style={{
                flex: 1, padding: 16, borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${theme === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === opt.id ? 'rgba(99,102,241,0.06)' : 'var(--bg3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 52, height: 36, borderRadius: 8, background: opt.preview.bg, border: `1px solid ${opt.preview.border}`, display: 'flex', flexDirection: 'column', padding: 6, gap: 4 }}>
                <div style={{ height: 4, background: opt.preview.border, borderRadius: 2, width: '60%' }} />
                <div style={{ height: 4, background: opt.preview.border, borderRadius: 2 }} />
                <div style={{ height: 4, background: opt.preview.stripe, borderRadius: 2, width: '40%' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <opt.icon size={13} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                {theme === opt.id && <Check size={13} style={{ color: 'var(--accent)' }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Display</div>
        <div className="settings-section-desc">Customize your workspace appearance</div>
        {[
          { label: 'Compact sidebar',       desc: 'Show only icons in the sidebar',          defaultOn: false },
          { label: 'Reduce motion',         desc: 'Minimize animations across the app',       defaultOn: false },
          { label: 'Show member avatars',   desc: 'Display profile pictures on task cards',   defaultOn: true  },
        ].map(opt => (
          <ToggleRow key={opt.label} label={opt.label} desc={opt.desc} defaultOn={opt.defaultOn} />
        ))}
      </div>
    </div>
  );
};

// ── Notifications ─────────────────────────────────────────────────────────────
const NotificationsSection = () => (
  <div>
    <div className="settings-section">
      <div className="settings-section-title">Email Notifications</div>
      <div className="settings-section-desc">Choose which emails you'd like to receive</div>
      {[
        { label: 'Task assigned to you', desc: 'When a task is assigned to your account',    defaultOn: true  },
        { label: 'Task due soon',        desc: 'Reminder 24 hours before a task is due',      defaultOn: true  },
        { label: 'Project updates',      desc: "When a project you're on is updated",         defaultOn: false },
        { label: 'New team member',      desc: 'When someone joins your workspace',           defaultOn: false },
        { label: 'Weekly digest',        desc: 'A summary of activity every Monday',          defaultOn: true  },
      ].map(opt => (
        <ToggleRow key={opt.label} label={opt.label} desc={opt.desc} defaultOn={opt.defaultOn} />
      ))}
    </div>

    <div className="settings-section">
      <div className="settings-section-title">In-App Notifications</div>
      <div className="settings-section-desc">Control real-time alerts within TaskFlow</div>
      {[
        { label: 'Direct messages',  desc: 'Notify when you receive a new DM',           defaultOn: true  },
        { label: 'Chat mentions',    desc: 'Notify when someone @mentions you',           defaultOn: true  },
        { label: 'Task comments',    desc: 'Notify on new comments on your tasks',        defaultOn: true  },
        { label: 'Status changes',   desc: 'Notify when task status is updated',          defaultOn: false },
      ].map(opt => (
        <ToggleRow key={opt.label} label={opt.label} desc={opt.desc} defaultOn={opt.defaultOn} />
      ))}
    </div>
  </div>
);

// ── Security ──────────────────────────────────────────────────────────────────
const SecuritySection = () => {
  const [current, setCurrent]   = useState('');
  const [newPw,   setNewPw]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  const strength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const s = strength(newPw);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][s];
  const strengthColor = ['', 'var(--red)', 'var(--yellow)', 'var(--blue)', 'var(--green)'][s];

  const save = async () => {
    if (!current || !newPw || newPw !== confirm) {
      toast.error(newPw !== confirm ? 'Passwords do not match' : 'Fill in all fields');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Password updated! (Connect backend to persist)');
    setCurrent(''); setNewPw(''); setConfirm('');
  };

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-title">Change Password</div>
        <div className="settings-section-desc">Use a strong password to keep your account secure</div>

        <div className="form-stack">
          <div className="form-group">
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showCurr ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current password" style={{ paddingRight: 40 }} />
              <button onClick={() => setShowCurr(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
                {showCurr ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" style={{ paddingRight: 40 }} />
              <button onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {newPw && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= s ? strengthColor : 'var(--border2)', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter new password"
              style={{ borderColor: confirm && confirm !== newPw ? 'var(--red)' : undefined }} />
            {confirm && confirm !== newPw && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Passwords do not match</div>}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Updating…</> : <><Shield size={14} /> Update Password</>}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Active Sessions</div>
        <div className="settings-section-desc">Devices currently logged in</div>
        {[
          { device: 'Chrome on Windows', location: 'Delhi, India', current: true  },
          { device: 'Safari on iPhone',  location: 'Delhi, India', current: false },
        ].map(s => (
          <div key={s.device} className="settings-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.device}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.location}</div>
            </div>
            {s.current
              ? <span className="badge badge-done">Current</span>
              : <button className="btn btn-danger btn-sm" onClick={() => toast.success('Session revoked')}>Revoke</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Toggle helper ─────────────────────────────────────────────────────────────
const ToggleRow = ({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="settings-row">
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={() => setOn(v => !v)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}>
        <div className={`toggle-track ${on ? 'on' : ''}`} />
      </button>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const CONTENT: Record<Section, React.ReactNode> = {
  profile:       <ProfileSection />,
  appearance:    <AppearanceSection />,
  notifications: <NotificationsSection />,
  security:      <SecuritySection />,
};

const SettingsPage = () => {
  const [active, setActive] = useState<Section>('profile');
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your account and preferences</div>
        </div>
      </div>
      <div className="settings-outer">
        <nav className="settings-nav">
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => setActive(sec.id)}
              className={`settings-nav-item ${active === sec.id ? 'active' : ''}`}>
              <sec.icon size={15} />{sec.label}
            </button>
          ))}
        </nav>
        <div className="settings-content" key={active} style={{ animation: 'fadeIn 0.15s ease' }}>
          {CONTENT[active]}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
