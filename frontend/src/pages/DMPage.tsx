import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, UserCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { UserOut } from '../types';

interface DMMessage {
  id: string;
  fromId: number;
  toId: number;
  fromName: string;
  text: string;
  timestamp: number;
}

const DM_STORAGE_KEY = 'tf_dm_messages';

const loadDMs = (): DMMessage[] => {
  try { return JSON.parse(localStorage.getItem(DM_STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveDMs = (msgs: DMMessage[]) => {
  localStorage.setItem(DM_STORAGE_KEY, JSON.stringify(msgs.slice(-1000)));
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDateSep = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const dmKey = (a: number, b: number) => [a, b].sort((x, y) => x - y).join('-');

const DMPage = () => {
  const { user } = useAuth();
  const [members, setMembers]     = useState<UserOut[]>([]);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<UserOut | null>(null);
  const [allDMs, setAllDMs]       = useState<DMMessage[]>(loadDMs);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(true);
  const messagesEndRef             = useRef<HTMLDivElement>(null);
  const inputRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get<any[]>('/projects')
      .then(res => {
        const seen = new Set<number>();
        const users: UserOut[] = [];
        res.data.forEach((p: any) => {
          p.members?.forEach((m: any) => {
            if (m.user && m.user.id !== user?.id && !seen.has(m.user.id)) {
              seen.add(m.user.id);
              users.push(m.user);
            }
          });
        });
        setMembers(users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected, allDMs.length]);

  const conversation = (selected && user)
    ? allDMs.filter(m =>
        (m.fromId === user.id && m.toId === selected.id) ||
        (m.fromId === selected.id && m.toId === user.id)
      )
    : [];

  // Last message preview per contact
  const lastMsg = (contactId: number) => {
    if (!user) return null;
    const thread = allDMs.filter(m =>
      (m.fromId === user.id && m.toId === contactId) ||
      (m.fromId === contactId && m.toId === user.id)
    );
    return thread[thread.length - 1] || null;
  };

  const send = () => {
    if (!input.trim() || !user || !selected) return;
    const msg: DMMessage = {
      id: `${Date.now()}-${Math.random()}`,
      fromId: user.id,
      toId: selected.id,
      fromName: user.name,
      text: input.trim(),
      timestamp: Date.now(),
    };
    const updated = [...allDMs, msg];
    setAllDMs(updated);
    saveDMs(updated);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Build grouped messages
  const grouped: Array<{ type: 'date'; label: string } | { type: 'msg'; msg: DMMessage; showAvatar: boolean }> = [];
  let lastDate = '';
  let lastFromId = -1;

  conversation.forEach((msg, i) => {
    const dateStr = formatDateSep(msg.timestamp);
    if (dateStr !== lastDate) {
      grouped.push({ type: 'date', label: dateStr });
      lastDate = dateStr;
      lastFromId = -1;
    }
    const timeDiff = i > 0 ? msg.timestamp - conversation[i - 1].timestamp : 999999;
    const showAvatar = msg.fromId !== lastFromId || timeDiff > 5 * 60 * 1000;
    grouped.push({ type: 'msg', msg, showAvatar });
    lastFromId = msg.fromId;
  });

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginTop: -8 }}>
      <div className="chat-outer">
        {/* Contact list */}
        <div className="chat-sidebar">
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>Direct Messages</div>
            <div style={{ marginTop: 10, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                style={{ paddingLeft: 30, fontSize: 12, padding: '7px 10px 7px 30px' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {loading && (
              <div style={{ padding: '20px 12px', color: 'var(--text3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 12, height: 12 }} /> Loading members…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: '20px 12px', color: 'var(--text3)', fontSize: 12, textAlign: 'center' }}>
                No members found
              </div>
            )}
            {filtered.map(member => {
              const last = lastMsg(member.id);
              const isActive = selected?.id === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelected(member)}
                  className={`chat-item ${isActive ? 'active' : ''}`}
                >
                  <div className="avatar avatar-sm" style={{ background: avatarColor(member.id) }}>
                    {getInitials(member.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chat-item-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last ? last.text : member.email}
                    </div>
                  </div>
                  {last && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
                      {formatTime(last.timestamp)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-main">
          {!selected ? (
            <div className="empty-state" style={{ flex: 1, justifyContent: 'center' }}>
              <UserCircle2 size={48} />
              <h3>Select a teammate</h3>
              <p>Choose someone from the list to start a direct conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <div className="avatar" style={{ background: avatarColor(selected.id) }}>
                  {getInitials(selected.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{selected.email}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {conversation.length === 0 && (
                  <div className="empty-state" style={{ paddingTop: 60 }}>
                    <div className="avatar avatar-lg" style={{ background: avatarColor(selected.id), width: 56, height: 56, fontSize: 20 }}>
                      {getInitials(selected.name)}
                    </div>
                    <h3>{selected.name}</h3>
                    <p>This is the beginning of your direct message history. Say hi!</p>
                  </div>
                )}

                {grouped.map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 8px' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      </div>
                    );
                  }

                  const { msg, showAvatar } = item;
                  const isMe = msg.fromId === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`msg-row ${isMe ? 'me' : 'other'}`}
                      style={{ marginTop: showAvatar ? 8 : 2 }}
                    >
                      {!isMe && (
                        showAvatar
                          ? <div className="avatar avatar-sm" style={{ background: avatarColor(msg.fromId), alignSelf: 'flex-end', flexShrink: 0 }}>{getInitials(msg.fromName)}</div>
                          : <div style={{ width: 26, flexShrink: 0 }} />
                      )}

                      <div className="msg-bubble">
                        {showAvatar && !isMe && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: avatarColor(msg.fromId) }}>{msg.fromName}</span>
                            <span className="msg-meta">{formatTime(msg.timestamp)}</span>
                          </div>
                        )}
                        <div className="msg-content">{msg.text}</div>
                        {showAvatar && isMe && (
                          <div className="msg-meta" style={{ justifyContent: 'flex-end' }}>
                            {formatTime(msg.timestamp)}
                          </div>
                        )}
                      </div>

                      {isMe && (
                        showAvatar
                          ? <div className="avatar avatar-sm" style={{ background: avatarColor(msg.fromId), alignSelf: 'flex-end', flexShrink: 0 }}>{getInitials(msg.fromName)}</div>
                          : <div style={{ width: 26, flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input-row">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${selected.name}…`}
                  rows={1}
                  style={{
                    resize: 'none', flex: 1, borderRadius: 10,
                    maxHeight: 120, lineHeight: 1.5,
                    padding: '10px 14px',
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="btn btn-primary"
                  style={{ padding: '10px 14px', borderRadius: 10, flexShrink: 0 }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DMPage;
