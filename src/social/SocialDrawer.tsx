import {
  Camera,
  ExternalLink,
  Flame,
  Globe,
  Hash,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Plus,
  Send,
  Sigma,
  Smile,
  Timer,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { MathText } from '../components/MathText';
import { STUDY_MEMES } from './memes';
import { isSnapExpired, snapRemainingSeconds } from './repository';
import type { ChatMessage, MediaAttachment, SocialRepository, SocialUser } from './types';

type HubTab = 'groups' | 'dms' | 'peers';

const LATEX_QUICK_SNIPPETS = [
  { label: 'Limit', code: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
  { label: 'Derivative', code: '\\frac{d}{dx}\\left[f(g(x))\\right] = f\'(g(x))g\'(x)' },
  { label: 'Related Rate', code: '\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}' },
  { label: 'Integral', code: '\\int_a^b f(x)\\,dx = F(b) - F(a)' },
];

function formatTimeShort(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export interface PrefillIntuitionDraft {
  id: number;
  text: string;
  latex?: string;
}

interface SocialDrawerProps {
  repo: SocialRepository;
  open: boolean;
  onClose: () => void;
  prefillDraft?: PrefillIntuitionDraft | null;
}

export function SocialDrawer({ repo, open, onClose, prefillDraft }: SocialDrawerProps) {
  const social = useSyncExternalStore(repo.subscribe, repo.getState, repo.getState);
  const [tab, setTab] = useState<HubTab>('groups');
  const [activeRoomId, setActiveRoomId] = useState<string>('room-related-rates');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<SocialUser | null>(null);

  // Create room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('Realm III · Derivatives');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

  // Composer state
  const [draftText, setDraftText] = useState('');
  const [draftLatex, setDraftLatex] = useState('');
  const [showLatexBar, setShowLatexBar] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [customGifUrl, setCustomGifUrl] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<MediaAttachment | null>(null);
  const [snapTimer, setSnapTimer] = useState<0 | 5 | 10>(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastPrefillIdRef = useRef<number | null>(null);

  const userMap = useMemo(() => {
    const m = new Map<string, SocialUser>();
    m.set(social.currentUser.id, social.currentUser);
    for (const p of social.peers) m.set(p.id, p);
    return m;
  }, [social.currentUser, social.peers]);

  const groupRooms = useMemo(() => social.rooms.filter((r) => r.kind === 'group'), [social.rooms]);
  const dmRooms = useMemo(() => social.rooms.filter((r) => r.kind === 'dm'), [social.rooms]);
  const activeRoom = useMemo(
    () => social.rooms.find((r) => r.id === activeRoomId) ?? social.rooms[0],
    [social.rooms, activeRoomId],
  );
  const activeMessages = useMemo(
    () => (activeRoom ? social.messages[activeRoom.id] ?? [] : []),
    [social.messages, activeRoom],
  );

  // Hydrate composer when Stage 6 "Share Your Intuition" triggers the drawer
  useEffect(() => {
    if (open && prefillDraft && prefillDraft.id !== lastPrefillIdRef.current) {
      lastPrefillIdRef.current = prefillDraft.id;
      setTab('groups');
      setDraftText(prefillDraft.text);
      if (prefillDraft.latex) {
        setDraftLatex(prefillDraft.latex);
        setShowLatexBar(true);
      }
    }
  }, [open, prefillDraft]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open && activeRoom) {
      repo.markRoomRead(activeRoom.id);
    }
  }, [open, activeRoom, repo]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, activeMessages.length, activeRoom?.id]);

  if (!open) return null;

  const handleStartDm = (peer: SocialUser) => {
    const dm = repo.openDirectMessage(peer.id);
    setSelectedPeer(null);
    setTab('dms');
    setActiveRoomId(dm.id);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = repo.createRoom({
      name: newRoomName,
      description: newRoomDesc,
      category: newRoomCategory,
      isPrivate: newRoomPrivate,
    });
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomPrivate(false);
    setShowCreateRoom(false);
    setTab('groups');
    setActiveRoomId(room.id);
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPendingAttachment({
          kind: 'image',
          url: reader.result,
          caption: file.name,
          snapSeconds: snapTimer > 0 ? snapTimer : undefined,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;
    if (!draftText.trim() && !draftLatex.trim() && !pendingAttachment) return;
    const attachment = pendingAttachment
      ? {
          ...pendingAttachment,
          snapSeconds: pendingAttachment.kind === 'image' && snapTimer > 0 ? snapTimer : pendingAttachment.snapSeconds,
        }
      : undefined;

    repo.sendMessage({
      roomId: activeRoom.id,
      text: draftText.trim(),
      latexSnippet: draftLatex.trim() || undefined,
      attachment,
    });
    setDraftText('');
    setDraftLatex('');
    setPendingAttachment(null);
    setShowGifPicker(false);
  };

  const renderMessage = (msg: ChatMessage) => {
    const sender = userMap.get(msg.senderId);
    const isMe = msg.senderId === 'me';
    const att = msg.attachment;
    const expired = isSnapExpired(msg, nowTick);
    const remaining = snapRemainingSeconds(msg, nowTick);

    return (
      <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse text-right' : ''}`}>
        <button
          type="button"
          disabled={isMe || !sender}
          onClick={() => sender && !isMe && setSelectedPeer(sender)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#FAF6EC] disabled:cursor-default"
          style={{ backgroundColor: sender?.avatarColor ?? 'var(--accent-primary)' }}
          title={isMe ? 'You' : `View ${sender?.name}'s profile`}
        >
          {sender?.initials ?? '?'}
        </button>

        <div className={`max-w-[82%] space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-baseline gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
            {!isMe && sender ? (
              <button
                type="button"
                onClick={() => setSelectedPeer(sender)}
                className="font-semibold text-[var(--accent-gold)] hover:underline"
              >
                {sender.name}
              </button>
            ) : (
              <span className="font-semibold text-[var(--accent-primary)]">{sender?.name ?? 'You'}</span>
            )}
            <span className="text-[var(--text-secondary)]">{formatTimeShort(msg.createdAt)}</span>
          </div>

          <div
            className="rounded-xl border px-3.5 py-2.5 text-left text-sm leading-relaxed text-[var(--text-primary)]"
            style={{
              backgroundColor: isMe ? 'var(--accent-primary-soft)' : 'var(--bg-elevated)',
              borderColor: isMe ? 'var(--accent-primary)' : 'var(--border-hairline)',
            }}
          >
            {msg.text && (
              <p className="whitespace-pre-wrap break-words">
                <MathText text={msg.text} />
              </p>
            )}

            {msg.latexSnippet && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-center text-[var(--text-primary)]">
                <MathText text={`$$${msg.latexSnippet}$$`} />
              </div>
            )}

            {msg.youtubeId && (
              <div className="mt-2 overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[#1A1916]">
                <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  <Video className="h-3.5 w-3.5 text-[var(--accent-terracotta)]" aria-hidden /> Embedded YouTube Clip
                </div>
                <iframe
                  title={`YouTube video ${msg.youtubeId}`}
                  src={`https://www.youtube-nocookie.com/embed/${msg.youtubeId}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {msg.linkPreview && !msg.youtubeId && (
              <a
                href={msg.linkPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-2.5 transition hover:border-[var(--accent-primary)]"
              >
                <p className="flex items-center justify-between text-[11px] font-semibold text-[var(--accent-primary)]">
                  <span>{msg.linkPreview.domain}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[var(--text-primary)]">{msg.linkPreview.title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{msg.linkPreview.description}</p>
              </a>
            )}

            {att && (
              <div className="mt-2">
                {att.snapSeconds ? (
                  expired ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      <Timer className="h-4 w-4" aria-hidden /> Ephemeral snap expired ({att.snapSeconds}s)
                    </div>
                  ) : !att.openedAt ? (
                    <button
                      type="button"
                      onClick={() => repo.openSnap(msg.roomId, msg.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--accent-terracotta)] bg-[var(--accent-terracotta-soft)] px-3 py-2.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      <span className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-[var(--accent-terracotta)]" aria-hidden /> Tap to view{' '}
                        {att.snapSeconds}s Ephemeral Snap
                      </span>
                      <span className="tabular-nums">{att.snapSeconds}s</span>
                    </button>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-[var(--accent-terracotta)] bg-[var(--bg-surface)]">
                      <div className="flex items-center justify-between bg-[var(--accent-terracotta-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)]">
                        <span className="flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" aria-hidden /> Ephemeral Snap
                        </span>
                        <span className="tabular-nums">Disappears in {remaining}s</span>
                      </div>
                      <img src={att.url} alt={att.caption || 'Ephemeral snap'} className="max-h-52 w-full object-contain" />
                    </div>
                  )
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                    <img src={att.url} alt={att.caption || 'Shared media'} className="max-h-52 w-full object-contain" />
                    {att.caption && <p className="px-2 py-1 text-[11px] text-[var(--text-secondary)]">{att.caption}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1A1916]/60"
      role="dialog"
      aria-modal="true"
      aria-label="Odyssey Study Community"
    >
      <button
        type="button"
        className="hidden flex-1 cursor-default sm:block"
        onClick={onClose}
        aria-label="Close Study Community"
      />

      <aside className="flex h-full w-full max-w-4xl flex-col border-l border-[var(--border-strong)] bg-[var(--bg-canvas)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold leading-tight text-[var(--text-primary)]">
                Study Community
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Peer Teach-Back · Interest Groups · 1-on-1 DMs · LaTeX & Media
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            aria-label="Close Study Community"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Main 2-column layout */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left rail */}
          <div className="flex max-h-[34vh] w-full flex-col border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] md:max-h-none md:w-72 md:border-b-0 md:border-r">
            <div className="grid grid-cols-3 border-b border-[var(--border-hairline)] text-xs font-semibold">
              {(
                [
                  ['groups', 'Groups'],
                  ['dms', 'DMs'],
                  ['peers', 'Voyagers'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`py-2.5 transition ${
                    tab === id
                      ? 'border-b-2 border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto p-2.5">
              {tab === 'groups' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom((v) => !v)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--accent-primary)] bg-[var(--accent-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent-primary)] transition hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Study Group
                  </button>

                  {showCreateRoom && (
                    <form
                      onSubmit={handleCreateRoom}
                      className="space-y-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3"
                    >
                      <input
                        type="text"
                        required
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Group name (e.g. u-Sub Navigators)"
                        className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={newRoomDesc}
                        onChange={(e) => setNewRoomDesc(e.target.value)}
                        placeholder="Short topic description"
                        className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                      />
                      <select
                        value={newRoomCategory}
                        onChange={(e) => setNewRoomCategory(e.target.value)}
                        aria-label="Room category"
                        className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                      >
                        <option>Realm I · Foundations</option>
                        <option>Realm II · Limits</option>
                        <option>Realm III · Derivatives</option>
                        <option>Realm IV · Peaks & Optimization</option>
                        <option>Realm V · Integrals</option>
                        <option>Realm VI · Volumes & Work</option>
                        <option>Interests · Gaming & Physics</option>
                        <option>Interests · Music & Audio</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={newRoomPrivate}
                          onChange={(e) => setNewRoomPrivate(e.target.checked)}
                          className="accent-[var(--accent-primary)]"
                        />
                        Private invite-only room
                      </label>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowCreateRoom(false)}
                          className="rounded px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-[var(--accent-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary-ink)]"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  )}

                  {groupRooms.map((room) => {
                    const selected = activeRoom?.id === room.id;
                    return (
                      <div
                        key={room.id}
                        className={`rounded-xl border p-2.5 transition ${
                          selected
                            ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)]'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRoomId(room.id);
                            repo.markRoomRead(room.id);
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                              {room.isPrivate ? (
                                <Lock className="h-3 w-3 text-[var(--accent-gold)]" aria-hidden />
                              ) : (
                                <Hash className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden />
                              )}
                              {room.name}
                            </span>
                            {room.unreadCount > 0 && (
                              <span className="rounded bg-[var(--accent-gold)] px-1.5 py-0.5 text-[10px] font-bold text-[#1A1916]">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{room.category}</p>
                        </button>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-[var(--text-secondary)]">{room.memberIds.length} members</span>
                          <button
                            type="button"
                            onClick={() => repo.toggleJoinRoom(room.id)}
                            className={`rounded-md px-2 py-0.5 font-semibold ${
                              room.joined
                                ? 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
                                : 'bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]'
                            }`}
                          >
                            {room.joined ? 'Joined' : 'Join'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'dms' && (
                <div className="space-y-2">
                  {dmRooms.map((room) => {
                    const peer = social.peers.find((p) => p.id === room.dmPeerId);
                    const selected = activeRoom?.id === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setActiveRoomId(room.id);
                          repo.markRoomRead(room.id);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                          selected
                            ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)]'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#FAF6EC]"
                          style={{ backgroundColor: peer?.avatarColor ?? 'var(--accent-primary)' }}
                        >
                          {peer?.initials ?? 'DM'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                            {room.name}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                            {peer?.currentUnit ?? 'Direct Message'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  <p className="px-1 pt-2 text-[11px] text-[var(--text-secondary)]">
                    Select any voyager in the Voyagers tab to start a calm 1-on-1 study chat.
                  </p>
                </div>
              )}

              {tab === 'peers' && (
                <div className="space-y-2">
                  {social.peers.map((peer) => (
                    <button
                      key={peer.id}
                      type="button"
                      onClick={() => setSelectedPeer(peer)}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5 text-left transition hover:border-[var(--accent-primary)]"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#FAF6EC]"
                        style={{ backgroundColor: peer.avatarColor }}
                      >
                        {peer.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-1 text-xs font-semibold text-[var(--text-primary)]">
                          <span>{peer.name}</span>
                          <span className="text-[10px] font-normal text-[var(--text-secondary)]">
                            {peer.online ? 'Online' : 'Away'}
                          </span>
                        </span>
                        <span className="block text-[11px] text-[var(--accent-primary)]">{peer.currentUnit}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--text-secondary)]">
                          {peer.interests.join(' · ')}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right pane: Active conversation */}
          <div className="flex min-h-0 flex-1 flex-col">
            {activeRoom ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {activeRoom.kind === 'dm' ? (
                        <MessageSquare className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
                      ) : activeRoom.isPrivate ? (
                        <Lock className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden />
                      ) : (
                        <Globe className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
                      )}
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{activeRoom.name}</h3>
                      <span className="text-xs text-[var(--text-secondary)]">· {activeRoom.category}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{activeRoom.description}</p>
                  </div>
                  {activeRoom.kind === 'group' && !activeRoom.joined && (
                    <button
                      type="button"
                      onClick={() => repo.toggleJoinRoom(activeRoom.id)}
                      className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-ink)]"
                    >
                      Join Group
                    </button>
                  )}
                </div>

                {selectedPeer && (
                  <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#FAF6EC]"
                          style={{ backgroundColor: selectedPeer.avatarColor }}
                        >
                          {selectedPeer.initials}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {selectedPeer.name}{' '}
                            <span className="font-normal text-[var(--text-secondary)]">
                              {selectedPeer.handle} · Age {selectedPeer.age}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--accent-primary)]">{selectedPeer.currentUnit}</p>
                          <p className="mt-1 text-xs text-[var(--text-primary)]">{selectedPeer.bio}</p>
                          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                            Interests: {selectedPeer.interests.join(' · ')}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPeer(null)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        aria-label="Close profile card"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartDm(selectedPeer)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent-primary-ink)]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Start Private DM
                      </button>
                    </div>
                  </div>
                )}

                <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
                  {activeMessages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>

                {showLatexBar && (
                  <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Quick LaTeX:</span>
                      {LATEX_QUICK_SNIPPETS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setDraftLatex(s.code)}
                          className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)] hover:border-[var(--accent-gold)]"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={draftLatex}
                      onChange={(e) => setDraftLatex(e.target.value)}
                      placeholder="LaTeX formula block (e.g. \int_0^1 x^2\,dx = \frac{1}{3})"
                      className="mt-2 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)]"
                    />
                    {draftLatex.trim() && (
                      <div className="mt-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-center text-sm text-[var(--text-primary)]">
                        <MathText text={`$$${draftLatex}$$`} />
                      </div>
                    )}
                  </div>
                )}

                {showGifPicker && (
                  <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Calculus Memes & GIFs</p>
                      <button
                        type="button"
                        onClick={() => setShowGifPicker(false)}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {STUDY_MEMES.map((meme) => (
                        <button
                          key={meme.id}
                          type="button"
                          onClick={() => {
                            setPendingAttachment({ kind: 'gif', url: meme.dataUrl, caption: meme.title });
                            setShowGifPicker(false);
                          }}
                          className="overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-left hover:border-[var(--accent-primary)]"
                        >
                          <img src={meme.dataUrl} alt={meme.title} className="h-20 w-full object-cover" />
                          <p className="truncate px-2 py-1 text-[11px] text-[var(--text-primary)]">{meme.title}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="url"
                        value={customGifUrl}
                        onChange={(e) => setCustomGifUrl(e.target.value)}
                        placeholder="Or paste a direct GIF / meme image URL..."
                        className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customGifUrl.trim()) return;
                          setPendingAttachment({ kind: 'gif', url: customGifUrl.trim(), caption: 'Shared GIF' });
                          setCustomGifUrl('');
                          setShowGifPicker(false);
                        }}
                        className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-ink)]"
                      >
                        Attach
                      </button>
                    </div>
                  </div>
                )}

                {pendingAttachment && (
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={pendingAttachment.url} alt="" className="h-12 w-16 rounded object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {pendingAttachment.caption || 'Attachment ready'}
                        </p>
                        {pendingAttachment.kind === 'image' && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                            <Timer className="h-3 w-3 text-[var(--accent-terracotta)]" aria-hidden />
                            <span>Ephemeral Snap:</span>
                            {([0, 5, 10] as const).map((sec) => (
                              <button
                                key={sec}
                                type="button"
                                onClick={() => setSnapTimer(sec)}
                                className={`rounded px-1.5 py-0.5 font-semibold ${
                                  snapTimer === sec
                                    ? 'bg-[var(--accent-terracotta)] text-[#FAF6EC]'
                                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                                }`}
                              >
                                {sec === 0 ? 'Off' : `${sec}s`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAttachment(null)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      aria-label="Remove attachment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Composer */}
                <form onSubmit={handleSend} className="border-t border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3">
                  <div className="flex items-center gap-1.5 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLatexBar((v) => !v);
                        setShowGifPicker(false);
                      }}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                        showLatexBar
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] text-[var(--text-primary)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Sigma className="h-3.5 w-3.5" aria-hidden /> LaTeX
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGifPicker((v) => !v);
                        setShowLatexBar(false);
                      }}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                        showGifPicker
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] text-[var(--text-primary)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Smile className="h-3.5 w-3.5" aria-hidden /> Meme / GIF
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <Camera className="h-3.5 w-3.5" aria-hidden /> Photo / Snap
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageFile(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                    <span className="ml-auto hidden items-center gap-1 text-[11px] text-[var(--text-secondary)] sm:inline-flex">
                      <ImageIcon className="h-3 w-3" aria-hidden /> Supports $LaTeX$ & YouTube links
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder={`Share an intuition in ${activeRoom.name}...`}
                      className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      data-testid="social-send-btn"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-primary-ink)] transition hover:bg-[var(--accent-primary-hover)]"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
                Select a study group or DM to begin.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
