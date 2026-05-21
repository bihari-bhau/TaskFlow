import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle,
  LogIn, LogOut, Calendar, Users, User,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

// ── types ─────────────────────────────────────────────────────────────────────
type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent';

interface AttendanceUser {
  id: number; name: string; email: string; created_at: string;
}
interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
  checked_out_at: string | null;
  notes: string | null;
  created_at: string;
  user?: AttendanceUser;
}

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  copper: '#b94b10', navy: '#1a3a6b', green: '#2d6a2d',
  red: '#991111', muted: '#9a7a60', ink: '#1a1207',
};

const mono: React.CSSProperties  = { fontFamily: "'IBM Plex Mono', monospace" };
const black: React.CSSProperties = { fontFamily: "'Archivo Black', sans-serif" };

const STATUS_META: Record<AttendanceStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  present:  { label: 'PRESENT',  color: C.green,  bg: 'rgba(45,106,45,0.10)',  border: 'rgba(45,106,45,0.28)',  icon: CheckCircle2 },
  late:     { label: 'LATE',     color: C.copper, bg: 'rgba(185,75,16,0.10)', border: 'rgba(185,75,16,0.28)', icon: Clock        },
  half_day: { label: 'HALF DAY', color: C.navy,   bg: 'rgba(26,58,107,0.10)', border: 'rgba(26,58,107,0.28)', icon: AlertTriangle },
  absent:   { label: 'ABSENT',   color: C.red,    bg: 'rgba(153,17,17,0.10)', border: 'rgba(153,17,17,0.28)', icon: XCircle      },
};

const fmtTime = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
const fmtDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const todayStr = () => new Date().toISOString().split('T')[0];

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: m.color, background: m.bg, border: `1px solid ${m.border}`, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon size={10} /> {m.label}
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
const AttendancePage = () => {
  const { user } = useAuth();

  // Determine admin by checking user — we check via API response
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [todayRecord,    setTodayRecord]    = useState<AttendanceRecord | null | undefined>(undefined);
  const [myHistory,      setMyHistory]      = useState<AttendanceRecord[]>([]);
  const [allRecords,     setAllRecords]     = useState<AttendanceRecord[]>([]);
  const [filterDate,     setFilterDate]     = useState<string>(todayStr());
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Fetch today's status + history
  const fetchData = useCallback(async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        api.get<AttendanceRecord>('/attendance/today').catch(() => ({ data: null })),
        api.get<AttendanceRecord[]>('/attendance/me'),
      ]);
      setTodayRecord(todayRes.data);
      setMyHistory(histRes.data);

      // Try fetching all records — if it works, user is admin
      try {
        const allRes = await api.get<AttendanceRecord[]>(`/attendance/all?date=${filterDate}`);
        setAllRecords(allRes.data);
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
    } catch {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<AttendanceRecord>('/attendance/checkin');
      setTodayRecord(res.data);
      flash('✓ Checked in successfully!');
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Check-in failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post<AttendanceRecord>('/attendance/checkout');
      setTodayRecord(res.data);
      flash('✓ Checked out successfully!');
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Check-out failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Stats for admin today view ────────────────────────────────────────────
  const todayStats = {
    present:  allRecords.filter(r => r.status === 'present').length,
    late:     allRecords.filter(r => r.status === 'late').length,
    half_day: allRecords.filter(r => r.status === 'half_day').length,
    absent:   allRecords.filter(r => r.status === 'absent').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: C.muted, ...mono, fontSize: 13 }}>
      <span className="spinner" /> Loading attendance…
    </div>
  );

  const checkedIn  = !!todayRecord?.checked_in_at;
  const checkedOut = !!todayRecord?.checked_out_at;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="page-title">Attendance</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Flash messages ────────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{ background: 'rgba(45,106,45,0.10)', border: '1px solid rgba(45,106,45,0.28)', color: C.green, padding: '12px 16px', ...mono, fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* ── Today's check-in card ─────────────────────────────────────────── */}
      <div className="card" style={{
        boxShadow: checkedIn ? '4px 4px 0px rgba(45,106,45,0.20)' : '4px 4px 0px rgba(26,18,7,0.12)',
        borderTop: `3px solid ${checkedIn ? C.green : C.copper}`,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>

          {/* Left: today's info */}
          <div>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
              // Today's Attendance — {user?.name?.split(' ')[0]}
            </div>

            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ ...mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
                {todayRecord ? (
                  <StatusBadge status={todayRecord.status} />
                ) : (
                  <span style={{ ...mono, fontSize: 11, color: C.muted }}>Not marked yet</span>
                )}
              </div>

              <div>
                <div style={{ ...mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Check In</div>
                <div style={{ ...black, fontSize: 20, fontWeight: 900, color: checkedIn ? C.green : C.muted, lineHeight: 1 }}>
                  {fmtTime(todayRecord?.checked_in_at ?? null)}
                </div>
              </div>

              <div>
                <div style={{ ...mono, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Check Out</div>
                <div style={{ ...black, fontSize: 20, fontWeight: 900, color: checkedOut ? C.navy : C.muted, lineHeight: 1 }}>
                  {fmtTime(todayRecord?.checked_out_at ?? null)}
                </div>
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {!checkedIn && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                style={{
                  ...mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '10px 20px',
                  background: C.green, color: '#fff',
                  border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: actionLoading ? 0.6 : 1,
                  boxShadow: '3px 3px 0px rgba(45,106,45,0.30)',
                }}
              >
                <LogIn size={14} />
                {actionLoading ? 'Marking…' : 'Check In'}
              </button>
            )}

            {checkedIn && !checkedOut && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                style={{
                  ...mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '10px 20px',
                  background: C.navy, color: '#fff',
                  border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: actionLoading ? 0.6 : 1,
                  boxShadow: '3px 3px 0px rgba(26,58,107,0.30)',
                }}
              >
                <LogOut size={14} />
                {actionLoading ? 'Marking…' : 'Check Out'}
              </button>
            )}

            {checkedIn && checkedOut && (
              <div style={{ ...mono, fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Day complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin: all records for selected date ──────────────────────────── */}
      {isAdmin && (
        <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.12)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={12} /> // Team Attendance
            </div>

            {/* Date picker */}
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ ...mono, fontSize: 11, width: 'auto', padding: '6px 10px', border: '2px solid rgba(26,18,7,0.18)', background: 'transparent', color: C.ink, cursor: 'pointer' }}
            />
          </div>

          {/* Admin stat summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: 12, marginBottom: 20 }}>
            {(Object.entries(todayStats) as [AttendanceStatus, number][]).map(([st, count]) => {
              const m = STATUS_META[st];
              return (
                <div key={st} style={{ background: m.bg, border: `2px solid ${m.border}`, padding: '10px 14px' }}>
                  <div style={{ ...black, fontSize: 24, fontWeight: 900, color: m.color, lineHeight: 1 }}>{count}</div>
                  <div style={{ ...mono, fontSize: 9, color: m.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{m.label}</div>
                </div>
              );
            })}
          </div>

          {/* All records table */}
          {allRecords.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Calendar size={28} strokeWidth={1.5} />
              <p>No attendance records for this date</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(26,18,7,0.12)' }}>
                    {['Member', 'Status', 'Check In', 'Check Out', 'Notes'].map(h => (
                      <th key={h} style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, textAlign: 'left', padding: '0 12px 10px 0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((rec, i) => (
                    <tr key={rec.id} style={{ borderBottom: i < allRecords.length - 1 ? '1px solid rgba(26,18,7,0.06)' : 'none' }}>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, background: 'rgba(26,18,7,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ ...black, fontSize: 11, fontWeight: 900, color: '#5a3d25' }}>{(rec.user?.name ?? '?').charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div style={{ ...black, fontSize: 13, fontWeight: 900, color: C.ink }}>{rec.user?.name ?? `User #${rec.user_id}`}</div>
                            <div style={{ ...mono, fontSize: 10, color: C.muted }}>{rec.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}><StatusBadge status={rec.status} /></td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <span style={{ ...mono, fontSize: 12, color: rec.checked_in_at ? C.green : C.muted, fontWeight: rec.checked_in_at ? 700 : 400 }}>
                          {fmtTime(rec.checked_in_at)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <span style={{ ...mono, fontSize: 12, color: rec.checked_out_at ? C.navy : C.muted, fontWeight: rec.checked_out_at ? 700 : 400 }}>
                          {fmtTime(rec.checked_out_at)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0' }}>
                        <span style={{ ...mono, fontSize: 11, color: C.muted }}>{rec.notes ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── My attendance history ─────────────────────────────────────────── */}
      <div className="card" style={{ boxShadow: '4px 4px 0px rgba(26,18,7,0.10)' }}>
        <div style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={12} /> // My History (last 30 days)
        </div>

        {myHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <Calendar size={28} strokeWidth={1.5} />
            <p>No attendance history yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(26,18,7,0.12)' }}>
                  {['Date', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => (
                    <th key={h} style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, textAlign: 'left', padding: '0 12px 10px 0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myHistory.map((rec, i) => {
                  // Calculate hours worked
                  let hours = '—';
                  if (rec.checked_in_at && rec.checked_out_at) {
                    const diff = (new Date(rec.checked_out_at).getTime() - new Date(rec.checked_in_at).getTime()) / 1000 / 60 / 60;
                    hours = `${diff.toFixed(1)}h`;
                  }
                  const isToday = rec.date === todayStr();
                  return (
                    <tr key={rec.id} style={{
                      borderBottom: i < myHistory.length - 1 ? '1px solid rgba(26,18,7,0.06)' : 'none',
                      background: isToday ? 'rgba(185,75,16,0.04)' : 'transparent',
                    }}>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <div style={{ ...black, fontSize: 13, fontWeight: 900, color: isToday ? C.copper : C.ink }}>
                          {fmtDate(rec.date)}
                          {isToday && <span style={{ ...mono, fontSize: 9, color: C.copper, marginLeft: 6, letterSpacing: '0.06em' }}>TODAY</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}><StatusBadge status={rec.status} /></td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <span style={{ ...mono, fontSize: 12, color: rec.checked_in_at ? C.green : C.muted }}>
                          {fmtTime(rec.checked_in_at)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px 10px 0' }}>
                        <span style={{ ...mono, fontSize: 12, color: rec.checked_out_at ? C.navy : C.muted }}>
                          {fmtTime(rec.checked_out_at)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0' }}>
                        <span style={{ ...black, fontSize: 13, fontWeight: 900, color: hours !== '—' ? C.ink : C.muted }}>{hours}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
