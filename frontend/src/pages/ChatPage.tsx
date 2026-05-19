import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, Users, Smile } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface ChatMessage {
  id: string;
  channel: string;
  userId: number;
  userName: string;
  text: string;
  timestamp: number;
}

const CHANNELS = [
  { id: 'general',       label: 'general',       desc: 'Team-wide announcements' },
  { id: 'development',   label: 'development',   desc: 'Dev discussions & code' },
  { id: 'design',        label: 'design',        desc: 'UI/UX & design work' },
  { id: 'random',        label: 'random',        desc: 'Off-topic & fun' },
];

const STORAGE_KEY = 'tf_chat_messages';

const loadMessages = (): ChatMessage[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveMessages = (msgs: ChatMessage[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-500)));
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatDateSep = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const ChatPage = () => {
  const { user } = useAuth();
  const [channel, setChannel]   = useState('general');
  const [allMsgs, setAllMsgs]   = useState<ChatMessage[]>(loadMessages);
  const [input, setInput]       = useState('');
  const messagesEndRef           = useRef<HTMLDivElement>(null);
  const inputRef                 = useRef<HTMLTextAreaElement>(null);

  const channelMsgs = allMsgs.filter(m => m.channel === channel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMsgs.length, channel]);

  const send = () => {
    if (!input.trim() || !user) return;
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      channel,
      userId: user.id,
      userName: user.name,
      text: input.trim(),
      timestamp: Date.now(),
    };
    const updated = [...allMsgs, msg];
    setAllMsgs(updated);
    saveMessages(updated);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Group messages: show date separator + group consecutive msgs from same user
  const grouped: Array<{ type: 'date'; label: string } | { type: 'msg'; msg: ChatMessage; showAvatar: boolean }> = [];
  let lastDate = '';
  let lastUserId = -1;

  channelMsgs.forEach((msg, i) => {
    const dateStr = formatDateSep(msg.timestamp);
    if (dateStr !== lastDate) {
      grouped.push({ type: 'date', label: dateStr });
      lastDate = dateStr;
      lastUserId = -1;
    }
    const timeDiff = i > 0 ? msg.timestamp - channelMsgs[i - 1].timestamp : 999999;
    const showAvatar = msg.userId !== lastUserId || timeDiff > 5 * 60 * 1000;
    grouped.push({ type: 'msg', msg, showAvatar });
    lastUserId = msg.userId;
  });

  const currentChannel = CHANNELS.find(c => c.id === channel);

  return (
    <div style={{ marginTop: -8 }}>
      <div className="chat-outer">
        {/* Sidebar: channels */}
        <div className="chat-sidebar">
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>Team Chat</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              <Users size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Channels
            </div>
          </div>

          <div style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
            {CHANNELS.map(ch => {
              const unread = allMsgs.filter(m => m.channel === ch.id && m.userId !== user?.id).length;
              return (
                <div
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  className={`chat-item ${channel === ch.id ? 'active' : ''}`}
                >
                  <Hash size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chat-item-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                      {ch.label}
                    </div>
                    {channel !== ch.id && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ch.desc}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          {/* Header */}
          <div className="chat-header">
            <Hash size={18} style={{ color: 'var(--text2)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{currentChannel?.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{currentChannel?.desc}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {channelMsgs.length === 0 && (
              <div className="empty-state" style={{ paddingTop: 80 }}>
                <Hash size={40} />
                <h3>Welcome to #{currentChannel?.label}</h3>
                <p>{currentChannel?.desc}. Be the first to say something!</p>
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
              const isMe = msg.userId === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`msg-row ${isMe ? 'me' : 'other'}`}
                  style={{ marginTop: showAvatar ? 8 : 2 }}
                >
                  {/* Avatar */}
                  {!isMe && (
                    showAvatar ? (
                      <div className="avatar avatar-sm" style={{ background: avatarColor(msg.userId), alignSelf: 'flex-end', flexShrink: 0 }}>
                        {getInitials(msg.userName)}
                      </div>
                    ) : <div style={{ width: 26, flexShrink: 0 }} />
                  )}

                  <div className="msg-bubble">
                    {showAvatar && !isMe && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: avatarColor(msg.userId) }}>
                          {msg.userName}
                        </span>
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
                    showAvatar ? (
                      <div className="avatar avatar-sm" style={{ background: avatarColor(msg.userId), alignSelf: 'flex-end', flexShrink: 0 }}>
                        {getInitials(msg.userName)}
                      </div>
                    ) : <div style={{ width: 26, flexShrink: 0 }} />
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
              placeholder={`Message #${currentChannel?.label}…`}
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
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
