import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../AuthContext';

// ── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  ink:     '#1a1207',
  linen:   '#f5f0eb',
  linen2:  '#ede8e2',
  linen3:  '#e3ddd5',
  copper:  '#b94b10',
  copper2: '#8f3509',
  copper3: '#d4672a',
  cream:   '#fdf8f3',
  text2:   '#5a3d25',
  text3:   '#9a7a60',
  green:   '#2d6a2d',
  red:     '#991111',
};

// ── Types ────────────────────────────────────────────────────────────────────
type Mode = 'login' | 'signup';

interface Fields {
  name: string;
  email: string;
  password: string;
}

interface FormField {
  key: keyof Fields;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.auth-wrap {
  font-family: 'Archivo', sans-serif;
  min-height: 100vh;
  display: flex;
  background: ${C.linen};
  overflow: hidden;
}

/* ── Left panel ───────────────────────────────────────── */
.auth-left {
  width: 48%;
  background: ${C.ink};
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 48px 52px;
}
.auth-left::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg,  transparent, transparent 36px, rgba(245,240,235,0.04) 36px, rgba(245,240,235,0.04) 37px),
    repeating-linear-gradient(90deg, transparent, transparent 36px, rgba(245,240,235,0.04) 36px, rgba(245,240,235,0.04) 37px);
  pointer-events: none;
}
.auth-left::after {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 220px; height: 600px;
  background: ${C.copper};
  opacity: 0.07;
  transform: rotate(18deg);
  pointer-events: none;
}

.watermark {
  position: absolute;
  bottom: -30px; right: -40px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 160px; font-weight: 900;
  color: rgba(245,240,235,0.025);
  line-height: 1; letter-spacing: -0.04em;
  pointer-events: none; white-space: nowrap; user-select: none;
}

.shape {
  position: absolute;
  border: 1.5px solid rgba(185,75,16,0.25);
  animation: floatShape 8s ease-in-out infinite;
}
.shape1 { width:70px; height:70px; top:12%; right:18%; animation-delay:0s; }
.shape2 { width:36px; height:36px; top:38%; right:8%;  animation-delay:-2.5s; transform:rotate(45deg); }
.shape3 { width:50px; height:50px; bottom:28%; right:22%; animation-delay:-5s; }
.shape4 { width:22px; height:22px; bottom:18%; right:10%; animation-delay:-1.5s; background:rgba(185,75,16,0.12); }

@keyframes floatShape {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  33%      { transform: translateY(-12px) rotate(3deg); }
  66%      { transform: translateY(6px) rotate(-2deg); }
}
.shape2 { animation-name: floatShape2; }
@keyframes floatShape2 {
  0%,100% { transform: translateY(0) rotate(45deg); }
  50%      { transform: translateY(-16px) rotate(52deg); }
}

.left-logo {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: auto;
  opacity: 0; transform: translateY(-16px);
  animation: revealDown 0.6s ease 0.1s forwards;
}
.left-body {
  flex: 1; display: flex; flex-direction: column; justify-content: center;
  opacity: 0; transform: translateY(20px);
  animation: revealUp 0.7s ease 0.3s forwards;
}
.left-foot {
  opacity: 0;
  animation: revealUp 0.6s ease 0.7s forwards;
}

.brand-mark {
  width: 46px; height: 46px; flex-shrink: 0;
  background: ${C.copper};
  display: flex; align-items: center; justify-content: center;
}
.brand-name {
  font-family: 'Archivo Black', sans-serif;
  font-size: 22px; font-weight: 900;
  color: ${C.linen}; letter-spacing: 0.04em;
  text-transform: uppercase; line-height: 1;
}
.brand-sub {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; color: ${C.copper3};
  letter-spacing: 0.18em; margin-top: 3px;
  text-transform: uppercase;
}

.left-headline {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(36px, 4vw, 52px); font-weight: 900;
  color: ${C.linen}; line-height: 1; letter-spacing: -0.02em;
  margin-bottom: 10px;
}
.left-headline em { font-style: italic; color: ${C.copper3}; }
.left-sub {
  font-size: 15px; color: rgba(245,240,235,0.55);
  line-height: 1.65; margin-bottom: 40px; max-width: 340px;
}

.feature-list { display: flex; flex-direction: column; gap: 16px; }
.feature-item {
  display: flex; align-items: flex-start; gap: 14px;
  opacity: 0; animation: revealUp 0.5s ease forwards;
}
.feature-item:nth-child(1) { animation-delay: 0.5s; }
.feature-item:nth-child(2) { animation-delay: 0.65s; }
.feature-item:nth-child(3) { animation-delay: 0.8s; }

.feature-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  background: rgba(185,75,16,0.18);
  border: 1.5px solid rgba(185,75,16,0.35);
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}
.feature-text h4 { font-size: 13px; font-weight: 700; color: ${C.linen}; margin-bottom: 2px; }
.feature-text p  { font-size: 12px; color: rgba(245,240,235,0.45); line-height: 1.5; }

.left-divider {
  height: 2px;
  background: linear-gradient(90deg, ${C.copper} 0%, rgba(185,75,16,0.15) 60%, transparent 100%);
  margin: 32px 0 24px;
}
.left-stat-row { display: flex; gap: 32px; }
.left-stat-val {
  font-family: 'Archivo Black', sans-serif;
  font-size: 26px; font-weight: 900; color: ${C.copper3};
}
.left-stat-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; color: rgba(245,240,235,0.4);
  letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px;
}

/* ── Right panel ──────────────────────────────────────── */
.auth-right {
  width: 52%;
  display: flex; align-items: center; justify-content: center;
  padding: 48px 64px;
  background: ${C.linen};
  background-image:
    repeating-linear-gradient(0deg,  transparent, transparent 28px, rgba(26,18,7,0.035) 28px, rgba(26,18,7,0.035) 29px),
    repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(26,18,7,0.035) 28px, rgba(26,18,7,0.035) 29px);
}
.auth-form-wrap {
  width: 100%; max-width: 400px;
  opacity: 0; transform: translateX(24px);
  animation: revealLeft 0.7s ease 0.2s forwards;
}

/* ── Mode toggle ──────────────────────────────────────── */
.mode-toggle {
  display: flex;
  background: ${C.linen3};
  border: 2px solid rgba(26,18,7,0.2);
  padding: 4px;
  margin-bottom: 36px;
  position: relative;
}
.toggle-pill {
  position: absolute;
  top: 4px; bottom: 4px;
  width: calc(50% - 4px);
  background: ${C.copper};
  transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 2px 2px 0px rgba(26,18,7,0.25);
}
.toggle-pill.right { transform: translateX(calc(100%)); }
.toggle-btn {
  flex: 1; padding: 11px; border: none; background: transparent;
  font-family: 'IBM Plex Mono', monospace; font-weight: 700;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  cursor: pointer; position: relative; z-index: 1; transition: color 0.2s;
}
.toggle-btn.active     { color: #fff; }
.toggle-btn:not(.active) { color: ${C.text2}; }

/* ── Form heading ─────────────────────────────────────── */
.form-title {
  font-family: 'Archivo Black', sans-serif;
  font-size: 32px; font-weight: 900;
  letter-spacing: -0.02em; color: ${C.ink};
  line-height: 1; text-transform: uppercase;
}
.form-title span { color: ${C.copper}; }
.form-desc { font-size: 13px; color: ${C.text3}; margin-top: 8px; line-height: 1.5; }

/* ── Fields ───────────────────────────────────────────── */
.field-wrap   { margin-bottom: 18px; position: relative; }
.field-label  {
  display: flex; justify-content: space-between;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 700;
  color: ${C.text2}; letter-spacing: 0.14em;
  text-transform: uppercase; margin-bottom: 7px;
}
.field-num   { color: ${C.copper}; margin-right: 6px; }
.field-input {
  width: 100%; padding: 13px 14px;
  background: ${C.cream}; color: ${C.ink};
  border: 2px solid rgba(26,18,7,0.2); border-radius: 0;
  font-family: 'Archivo', sans-serif; font-size: 14px; font-weight: 500;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.field-input:focus {
  border-color: ${C.copper};
  box-shadow: 3px 3px 0px rgba(185,75,16,0.2);
  background: #fff;
}
.field-input::placeholder { color: rgba(26,18,7,0.25); font-weight: 400; }
.field-bar {
  position: absolute; bottom: 0; left: 0;
  height: 2px; width: 0;
  background: ${C.copper};
  transition: width 0.25s ease;
  pointer-events: none;
}
.field-input:focus ~ .field-bar { width: 100%; }

/* ── Error ────────────────────────────────────────────── */
.error-box {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; margin-bottom: 18px;
  background: rgba(153,17,17,0.07);
  border: 2px solid rgba(153,17,17,0.25);
  color: ${C.red}; font-size: 12px;
  animation: shakeX 0.4s ease;
}
@keyframes shakeX {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}

/* ── Submit button ────────────────────────────────────── */
.submit-btn {
  width: 100%; padding: 15px 20px;
  background: ${C.copper}; color: #fff; border: 2px solid ${C.copper};
  font-family: 'IBM Plex Mono', monospace; font-weight: 700;
  font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
  cursor: pointer; border-radius: 0;
  display: flex; align-items: center; justify-content: center; gap: 12px;
  box-shadow: 4px 4px 0px rgba(26,18,7,0.2);
  transition: all 0.12s ease;
  position: relative; overflow: hidden;
  margin-top: 8px;
}
.submit-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: ${C.copper2};
  transform: translateX(-101%);
  transition: transform 0.25s ease;
}
.submit-btn:hover:not(:disabled)::before { transform: translateX(0); }
.submit-btn:hover:not(:disabled) { box-shadow: 6px 6px 0px rgba(26,18,7,0.22); transform: translate(-1px,-1px); }
.submit-btn:active:not(:disabled) { transform: translate(3px,3px); box-shadow: 1px 1px 0px rgba(26,18,7,0.2); }
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.submit-btn span, .submit-btn svg { position: relative; z-index: 1; }
.btn-arrow { transition: transform 0.2s ease; }
.submit-btn:hover .btn-arrow { transform: translateX(4px); }

/* ── Spinner ──────────────────────────────────────────── */
.spinner {
  width: 16px; height: 16px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.65s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Switch link ──────────────────────────────────────── */
.switch-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 24px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; color: ${C.text3}; letter-spacing: 0.05em;
}
.switch-btn {
  color: ${C.copper}; font-weight: 700; cursor: pointer;
  background: none; border: none; font-family: inherit;
  font-size: 11px; letter-spacing: 0.05em;
  border-bottom: 1.5px solid ${C.copper}; padding-bottom: 1px;
  transition: color 0.15s, border-color 0.15s;
}
.switch-btn:hover { color: ${C.copper2}; border-color: ${C.copper2}; }

/* ── Trust footer ─────────────────────────────────────── */
.trust-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 28px; padding-top: 20px;
  border-top: 1.5px solid rgba(26,18,7,0.1);
}
.trust-dot { width: 4px; height: 4px; background: ${C.copper}; flex-shrink: 0; }
.trust-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; color: ${C.text3}; letter-spacing: 0.04em;
}

/* ── Keyframes ────────────────────────────────────────── */
@keyframes revealUp   { to { opacity: 1; transform: translateY(0); } }
@keyframes revealDown { to { opacity: 1; transform: translateY(0); } }
@keyframes revealLeft { to { opacity: 1; transform: translateX(0); } }

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 860px) {
  .auth-left  { display: none; }
  .auth-right { width: 100%; padding: 40px 28px; }
}
`;

// ── Inline icons (no external dep) ──────────────────────────────────────────
const BoltIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <polygon points="13,4 7,13 12,13 11,20 17,11 12,11" fill="#fff" />
  </svg>
);

const ArrowRight = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="btn-arrow">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const AlertIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
    stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
  </svg>
);

const CheckIcon = ({ size = 13, color = C.copper3 }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const LockIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
    stroke={C.text3} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="0" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

// ── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { title: 'Role-based access',   desc: 'Admins manage teams, members own their tasks.' },
  { title: 'Live Kanban boards',  desc: 'Drag tasks across To Do, In Progress, and Done.' },
  { title: 'Dashboard analytics', desc: 'Completion rates, overdue counts, per-user stats.' },
];

const FIELD_NUMS: Record<string, string> = { name: '01', email: '02', password: '03' };

const LOGIN_FIELDS: FormField[] = [
  { key: 'email',    label: 'Email Address', type: 'email',    placeholder: 'you@company.com',   autoComplete: 'email'            },
  { key: 'password', label: 'Password',      type: 'password', placeholder: 'Min. 6 characters', autoComplete: 'current-password' },
];
const SIGNUP_FIELDS: FormField[] = [
  { key: 'name',     label: 'Full Name',     type: 'text',     placeholder: 'Shubham Kumar',     autoComplete: 'name'             },
  { key: 'email',    label: 'Email Address', type: 'email',    placeholder: 'you@company.com',   autoComplete: 'email'            },
  { key: 'password', label: 'Password',      type: 'password', placeholder: 'Min. 6 characters', autoComplete: 'new-password'     },
];

// ── Component ────────────────────────────────────────────────────────────────
const AuthPage = () => {
  const [mode, setMode]       = useState<Mode>('login');
  const [fields, setFields]   = useState<Fields>({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [titleKey, setTitleKey] = useState(0);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // FIX 1: explicit parameter types on all callbacks
  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setError('');
    setTitleKey((k: number) => k + 1);
  };

  // FIX 2: typed key; Returns a proper ChangeEventHandler
  const setField =
    (key: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data } = await api.post('/auth/signup', {
          name: fields.name, email: fields.email, password: fields.password,
        });
        login(data.access_token, data.user);
        toast.success(`Welcome to TaskFlow, ${data.user.name}! 🎉`);
      } else {
        const { data } = await api.post('/auth/login', {
          email: fields.email, password: fields.password,
        });
        login(data.access_token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
      }
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: unknown } } })
          ?.response?.data?.detail ?? 'Something went wrong. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const formFields = mode === 'login' ? LOGIN_FIELDS : SIGNUP_FIELDS;

  return (
    <div className="auth-wrap">
      <style>{css}</style>

      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="auth-left">
        <div className="watermark">TF</div>
        <div className="shape shape1" />
        <div className="shape shape2" />
        <div className="shape shape3" />
        <div className="shape shape4" />

        <div className="left-logo">
          <div className="brand-mark"><BoltIcon /></div>
          <div>
            <div className="brand-name">TaskFlow</div>
            <div className="brand-sub">Team Task Manager</div>
          </div>
        </div>

        <div className="left-body">
          <h1 className="left-headline">
            Build.<br />Ship.<br /><em>Together.</em>
          </h1>
          <p className="left-sub">
            One workspace for your whole team. Assign tasks, track progress,
            and ship on time — every time.
          </p>

          <div className="feature-list">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-icon">
                  <CheckIcon size={13} color={C.copper3} />
                </div>
                <div className="feature-text">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="left-divider" />

          <div className="left-stat-row">
            {([['12+', 'Projects'], ['87', 'Tasks tracked'], ['99%', 'Uptime']] as const).map(([v, l]) => (
              <div key={l}>
                <div className="left-stat-val">{v}</div>
                <div className="left-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="left-foot">
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'rgba(245,240,235,0.3)', letterSpacing: '0.08em' }}>
            © 2025 TaskFlow · FastAPI · PostgreSQL · React
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* Mode toggle */}
          <div className="mode-toggle">
            <div className={`toggle-pill${mode === 'signup' ? ' right' : ''}`} />
            <button className={`toggle-btn${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')}>
              Sign In
            </button>
            <button className={`toggle-btn${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')}>
              Sign Up
            </button>
          </div>

          {/* Heading — FIX 3: properly closed JSX tags */}
          <div style={{ marginBottom: 30, overflow: 'hidden' }} key={titleKey}>
            <div className="form-title" style={{ animation: 'revealUp 0.35s ease forwards' }}>
              {mode === 'login'
                ? <><span>Welcome</span> back.</>
                : <><span>Create</span> account.</>   /* both spans properly closed */
              }
            </div>
            <p className="form-desc">
              {mode === 'login'
                ? 'Enter your credentials to access your workspace.'
                : 'Join your team on TaskFlow — free forever.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-box">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            {formFields.map((f, i) => (
              <div
                key={`${mode}-${f.key}`}
                className="field-wrap"
                style={{ opacity: 0, animation: `revealUp 0.4s ease ${0.05 * i}s forwards` }}
              >
                <div className="field-label">
                  <span>
                    <span className="field-num">{FIELD_NUMS[f.key]}</span>
                    {f.label}
                  </span>
                  {/* FIX 4: fields[f.key] works because Fields extends Record<string,string> */}
                  {f.key === 'password' && mode === 'login' && (
                    <span style={{ color: C.copper, cursor: 'pointer', letterSpacing: '0.05em' }}>Forgot?</span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="field-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={fields[f.key as keyof Fields]}
                    onChange={setField(f.key)}
                    required
                    minLength={f.key === 'password' ? 6 : undefined}
                    autoComplete={f.autoComplete}
                  />
                  <div className="field-bar" />
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{ opacity: 0, animation: 'revealUp 0.4s ease 0.2s forwards' }}
            >
              {loading ? (
                <><div className="spinner" /><span>Please wait…</span></>
              ) : (
                <><span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span><ArrowRight /></>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="switch-row">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button className="switch-btn" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up →' : 'Sign in →'}
            </button>
          </div>

          {/* Trust line */}
          <div className="trust-row">
            <div className="trust-dot" />
            <LockIcon />
            <span className="trust-text">
              JWT secured · data encrypted at rest · no credit card needed
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;