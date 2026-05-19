import React, { useState, useEffect } from 'react';
import {
  MapPin, Globe, Clock, Search, Users,
  ChevronDown, ExternalLink,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────
interface MemberLocation {
  userId: number;
  name: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  lat: number;
  lng: number;
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const LOCATION_KEY = 'tf_member_locations';

const loadLocations = (): Record<number, Partial<MemberLocation>> => {
  try { return JSON.parse(localStorage.getItem(LOCATION_KEY) || '{}'); }
  catch { return {}; }
};

// ── Timezone helpers ──────────────────────────────────────────────────────────
const TIMEZONES = [
  { label: 'IST — India (UTC+5:30)',           value: 'Asia/Kolkata',        flag: '🇮🇳' },
  { label: 'IST — Israel (UTC+2)',             value: 'Asia/Jerusalem',      flag: '🇮🇱' },
  { label: 'UTC',                              value: 'UTC',                 flag: '🌐' },
  { label: 'EST — New York (UTC-5)',           value: 'America/New_York',    flag: '🇺🇸' },
  { label: 'CST — Chicago (UTC-6)',            value: 'America/Chicago',     flag: '🇺🇸' },
  { label: 'MST — Denver (UTC-7)',             value: 'America/Denver',      flag: '🇺🇸' },
  { label: 'PST — Los Angeles (UTC-8)',        value: 'America/Los_Angeles', flag: '🇺🇸' },
  { label: 'GMT — London (UTC+0)',             value: 'Europe/London',       flag: '🇬🇧' },
  { label: 'CET — Paris/Berlin (UTC+1)',       value: 'Europe/Paris',        flag: '🇪🇺' },
  { label: 'SGT — Singapore (UTC+8)',          value: 'Asia/Singapore',      flag: '🇸🇬' },
  { label: 'JST — Tokyo (UTC+9)',              value: 'Asia/Tokyo',          flag: '🇯🇵' },
  { label: 'AEST — Sydney (UTC+10)',           value: 'Australia/Sydney',    flag: '🇦🇺' },
  { label: 'CST — Shanghai/Beijing (UTC+8)',   value: 'Asia/Shanghai',       flag: '🇨🇳' },
  { label: 'BRT — São Paulo (UTC-3)',          value: 'America/Sao_Paulo',   flag: '🇧🇷' },
  { label: 'CAT — Nairobi (UTC+3)',            value: 'Africa/Nairobi',      flag: '🇰🇪' },
  { label: 'WAT — Lagos (UTC+1)',              value: 'Africa/Lagos',        flag: '🇳🇬' },
  { label: 'SAST — Johannesburg (UTC+2)',      value: 'Africa/Johannesburg', flag: '🇿🇦' },
  { label: 'ART — Buenos Aires (UTC-3)',       value: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { label: 'MSK — Moscow (UTC+3)',             value: 'Europe/Moscow',       flag: '🇷🇺' },
  { label: 'PKT — Karachi (UTC+5)',            value: 'Asia/Karachi',        flag: '🇵🇰' },
  { label: 'BST — Dhaka (UTC+6)',              value: 'Asia/Dhaka',          flag: '🇧🇩' },
  { label: 'ICT — Bangkok (UTC+7)',            value: 'Asia/Bangkok',        flag: '🇹🇭' },
  { label: 'WIB — Jakarta (UTC+7)',            value: 'Asia/Jakarta',        flag: '🇮🇩' },
  { label: 'NZST — Auckland (UTC+12)',         value: 'Pacific/Auckland',    flag: '🇳🇿' },
];

const getLocalTime = (tz: string) => {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz,
    }).format(new Date());
  } catch { return '--:--'; }
};

const getUTCOffset = (tz: string): string => {
  try {
    const fmt = new Intl.DateTimeFormat('en', {
      timeZone: tz, timeZoneName: 'shortOffset',
    });
    const parts = fmt.formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
};

const tzFlag = (tz: string) =>
  TIMEZONES.find(t => t.value === tz)?.flag || '🌐';

// ── Avatar helpers ────────────────────────────────────────────────────────────
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const avatarColor = (id: number) => COLORS[id % COLORS.length];
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Map iframe URL via OpenStreetMap ──────────────────────────────────────────
const mapUrl = (lat: number, lng: number, zoom = 11) =>
  `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.3},${lat - 0.2},${lng + 0.3},${lat + 0.2}&layer=mapnik&marker=${lat},${lng}`;

const osmUrl = (lat: number, lng: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;

// ── Member card ───────────────────────────────────────────────────────────────
const MemberCard = ({
  member, selected, onClick,
}: {
  member: MemberLocation;
  selected: boolean;
  onClick: () => void;
}) => {
  const [time, setTime] = useState(() => getLocalTime(member.timezone));

  useEffect(() => {
    const iv = setInterval(() => setTime(getLocalTime(member.timezone)), 30000);
    return () => clearInterval(iv);
  }, [member.timezone]);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          className="avatar"
          style={{ background: avatarColor(member.userId), flexShrink: 0 }}
        >
          {getInitials(member.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MapPin size={10} />
            {member.city}{member.country ? `, ${member.country}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
            {time}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
            {tzFlag(member.timezone)} {getUTCOffset(member.timezone)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── No location placeholder ───────────────────────────────────────────────────
const NoLocationCard = ({ name, email, userId }: { name: string; email: string; userId: number }) => (
  <div style={{
    background: 'var(--bg2)', border: '1px dashed var(--border)',
    borderRadius: 12, padding: '14px 16px', opacity: 0.6,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="avatar" style={{ background: avatarColor(userId) }}>
        {getInitials(name)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{email}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <MapPin size={11} />
        Not set
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const LocationsPage = () => {
  const { user: me } = useAuth();
  const [members, setMembers]     = useState<{ id: number; name: string; email: string }[]>([]);
  const [saved, setSaved]         = useState<Record<number, Partial<MemberLocation>>>(loadLocations);
  const [selected, setSelected]   = useState<MemberLocation | null>(null);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get<any[]>('/projects').then(res => {
      const seen = new Set<number>();
      const users: { id: number; name: string; email: string }[] = [];
      res.data.forEach((p: any) => {
        p.members?.forEach((m: any) => {
          if (m.user && !seen.has(m.user.id)) {
            seen.add(m.user.id);
            users.push(m.user);
          }
        });
      });
      // Include current user if not already
      if (me && !seen.has(me.id)) users.unshift(me);
      setMembers(users);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [me]);

  // Merge API members with saved location data
  const withLocation: MemberLocation[] = members
    .filter(m => saved[m.id]?.city)
    .map(m => ({
      userId:   m.id,
      name:     m.name,
      email:    m.email,
      city:     saved[m.id]?.city || '',
      country:  saved[m.id]?.country || '',
      timezone: saved[m.id]?.timezone || 'UTC',
      lat:      saved[m.id]?.lat || 0,
      lng:      saved[m.id]?.lng || 0,
    }));

  const withoutLocation = members.filter(m => !saved[m.id]?.city);

  const filtered = withLocation.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.city.toLowerCase().includes(search.toLowerCase()) ||
    m.country.toLowerCase().includes(search.toLowerCase())
  );

  const uniqueTimezones = [...new Set(withLocation.map(m => m.timezone))].length;
  const uniqueCountries = [...new Set(withLocation.map(m => m.country).filter(Boolean))].length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Team Locations</div>
          <div className="page-subtitle">
            Where your teammates are in the world
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Team Members',    value: members.length,        icon: Users,  color: 'var(--accent)' },
          { label: 'Locations Set',   value: withLocation.length,   icon: MapPin, color: 'var(--green)'  },
          { label: 'Countries',       value: uniqueCountries,       icon: Globe,  color: 'var(--blue)'   },
          { label: 'Timezones',       value: uniqueTimezones,       icon: Clock,  color: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: `${s.color}18`, border: `1.5px solid ${s.color}44`, padding: 10, borderRadius: 10, display: 'flex', flexShrink: 0 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left: member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or city…"
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--text3)', gap: 8 }}>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 13 }}>Loading members…</span>
            </div>
          )}

          {/* Members with location */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 2px' }}>
                Located members — {filtered.length}
              </div>
              {filtered.map(m => (
                <MemberCard
                  key={m.userId}
                  member={m}
                  selected={selected?.userId === m.userId}
                  onClick={() => setSelected(s => s?.userId === m.userId ? null : m)}
                />
              ))}
            </div>
          )}

          {/* Members without location */}
          {withoutLocation.length > 0 && !search && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: filtered.length > 0 ? 8 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 2px' }}>
                Location not set — {withoutLocation.length}
              </div>
              {withoutLocation.map(m => (
                <NoLocationCard key={m.id} name={m.name} email={m.email} userId={m.id} />
              ))}
            </div>
          )}

          {filtered.length === 0 && withoutLocation.length === 0 && !loading && (
            <div className="empty-state">
              <MapPin size={32} />
              <h3>No locations found</h3>
              <p>Team members can set their location in Settings → Profile</p>
            </div>
          )}
        </div>

        {/* Right: map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
              {/* Map header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: avatarColor(selected.userId) }}>
                    {getInitials(selected.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />
                      {selected.city}{selected.country ? `, ${selected.country}` : ''}
                      <span style={{ marginLeft: 6 }}>{tzFlag(selected.timezone)} {getUTCOffset(selected.timezone)}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={osmUrl(selected.lat, selected.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> Open in OSM
                </a>
              </div>

              {/* Map embed */}
              {selected.lat !== 0 ? (
                <iframe
                  title={`Map for ${selected.name}`}
                  src={mapUrl(selected.lat, selected.lng)}
                  style={{ width: '100%', height: 420, border: 'none', display: 'block' }}
                  loading="lazy"
                />
              ) : (
                <div className="empty-state" style={{ minHeight: 300 }}>
                  <Globe size={40} />
                  <h3>No coordinates saved</h3>
                  <p>Edit location in Settings to set lat/lng for map preview</p>
                </div>
              )}
            </div>
          ) : (
            /* Default: world overview */
            <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>World Overview</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Select a member to zoom in on their location
                </div>
              </div>
              <iframe
                title="World map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-160,15,160,65&layer=mapnik"
                style={{ width: '100%', height: 420, border: 'none', display: 'block' }}
                loading="lazy"
              />
            </div>
          )}

          {/* Timezone clock row */}
          {withLocation.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                Live Team Clocks
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {[...new Map(withLocation.map(m => [m.timezone, m])).values()].map(m => (
                  <LiveClock key={m.timezone} timezone={m.timezone} city={m.city} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Live Clock widget ─────────────────────────────────────────────────────────
const LiveClock = ({ timezone, city }: { timezone: string; city: string }) => {
  const [time, setTime] = useState(() => getLocalTime(timezone));

  useEffect(() => {
    const iv = setInterval(() => setTime(getLocalTime(timezone)), 10000);
    return () => clearInterval(iv);
  }, [timezone]);

  return (
    <div style={{
      background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px',
      minWidth: 110, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
        {tzFlag(timezone)} {city}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', color: 'var(--text)' }}>
        {time}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
        {getUTCOffset(timezone)}
      </div>
    </div>
  );
};

export default LocationsPage;
