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

interface SocialDrawerProps {
  repo: SocialRepository;
  open: boolean;
  onClose: () => void;
}

export function SocialDrawer({ repo, open, onClose }: SocialDrawerProps) {
  const social = useSyncExternalStore(repo.subscribe, repo.getState, repo.getState);
  const [tab, setTab] = useState<HubTab>('groups');
  const [activeRoomId, setActiveRoomId] = useState<string>('room-related-rates');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<SocialUser | null>(null);

  // Create room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('Unit 3 · Derivatives');
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

  const userMap = useMemo(() => {
    const m = new Map<string, SocialUser>();
    m.set(social.currentUser.id, social.currentUser);
    for (const p of social.peers) m.set(p.id, p);
    return m;
  }, [social.currentUser, social.peers]);

  const groupRooms = useMemo(() => social.rooms.filter((r) => r.kind === 'group'), [social.rooms]);
  const dmRooms = useMemo(() => social.rooms.filter((r) => r.kind === 'dm'), [social.rooms]);
  const activeRoom = useMemo(() => social.rooms.find((r) => r.id === activeRoomId) ?? social.rooms[0], [social.rooms, activeRoomId]);
  const activeMessages = useMemo(() => (activeRoom ? social.messages[activeRoom.id] ?? [] : []), [social.messages, activeRoom]);

  // Tick every 500ms while open so active ephemeral snaps count down live.
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white disabled:cursor-default"
          style={{ backgroundColor: sender?.avatarColor ?? '#3b4a5e' }}
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
                className="font-semibold text-[#f1d49a] hover:underline"
              >
                {sender.name}
              </button>
            ) : (
              <span className="font-semibold text-[#5fb8c4]">{sender?.name ?? 'You'}</span>
            )}
            <span className="text-[#8ba0b8]">{formatTimeShort(msg.createdAt)}</span>
          </div>

          <div
            className={`rounded-xl border px-3 py-2 text-left text-sm leading-relaxed ${
              isMe
                ? 'border-[#5fb8c4]/40 bg-[#183548] text-[#eef9fc]'
                : 'border-[#d8af63]/20 bg-[#152033] text-[#f2e8cf]'
            }`}
          >
            {msg.text && (
              <p className="whitespace-pre-wrap break-words">
                <MathText text={msg.text} />
              </p>
            )}

            {msg.latexSnippet && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#d8af63]/25 bg-[#0b1320] px-3 py-2 text-center text-[#f7ebd0]">
                <MathText text={`$$${msg.latexSnippet}$$`} />
              </div>
            )}

            {msg.youtubeId && (
              <div className="mt-2 overflow-hidden rounded-lg border border-[#d8af63]/25 bg-black">
                <div className="flex items-center gap-1.5 bg-[#101a2a] px-2.5 py-1 text-[11px] text-[#c9b98a]">
                  <Video className="h-3.5 w-3.5 text-[#ff6b5a]" aria-hidden /> Embedded YouTube Clip
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
                className="mt-2 block rounded-lg border border-[#5fb8c4]/30 bg-[#0d1828] p-2.5 transition hover:border-[#5fb8c4]"
              >
                <p className="flex items-center justify-between text-[11px] font-semibold text-[#5fb8c4]">
                  <span>{msg.linkPreview.domain}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#f5ebd2]">{msg.linkPreview.title}</p>
                <p className="mt-0.5 text-[11px] text-[#9eb4ca]">{msg.linkPreview.description}</p>
              </a>
            )}

            {att && (
              <div className="mt-2">
                {att.snapSeconds ? (
                  expired ? (
                    <div className="flex items-center gap-2 rounded-lg border border-[#d8af63]/20 bg-[#0b1320] px-3 py-2 text-xs text-[#8ba0b8]">
                      <Timer className="h-4 w-4" aria-hidden /> Ephemeral snap expired ({att.snapSeconds}s)
                    </div>
                  ) : !att.openedAt ? (
                    <button
                      type="button"
                      onClick={() => repo.openSnap(msg.roomId, msg.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#ff7e6b]/50 bg-[#2b1520] px-3 py-2.5 text-xs font-bold text-[#ffd6cf] hover:bg-[#3a1c2b]"
                    >
                      <span className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-[#ff7e6b]" aria-hidden /> Tap to view {att.snapSeconds}s Ephemeral Snap
                      </span>
                      <span className="tabular-nums">{att.snapSeconds}s</span>
                    </button>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-[#ff7e6b]/50 bg-[#0b1320]">
                      <div className="flex items-center justify-between bg-[#2b1520] px-2.5 py-1 text-[11px] font-bold text-[#ffb5a8]">
                        <span className="flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" aria-hidden /> Ephemeral Snap
                        </span>
                        <span className="tabular-nums">Disappears in {remaining}s</span>
                      </div>
                      <img src={att.url} alt={att.caption || 'Ephemeral snap'} className="max-h-52 w-full object-contain" />
                    </div>
                  )
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[#d8af63]/25 bg-[#0b1320]">
                    <img src={att.url} alt={att.caption || 'Shared media'} className="max-h-52 w-full object-contain" />
                    {att.caption && <p className="px-2 py-1 text-[11px] text-[#9eb4ca]">{att.caption}</p>}
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
      className="fixed inset-0 z-50 flex justify-end bg-[#050911]/75"
      role="dialog"
      aria-modal="true"
      aria-label="Odyssey Community Hub"
    >
      {/* Clickable dim area to dismiss */}
      <button type="button" className="hidden flex-1 cursor-default sm:block" onClick={onClose} aria-label="Close Social Hub" />

      <aside className="flex h-full w-full max-w-4xl flex-col border-l border-[#d8af63]/40 bg-[#0e1624] text-[#f2e8cf] shadow-2xl">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[#d8af63]/25 bg-[#142034] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f8190]/25 text-[#5fb8c4]">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-base font-bold tracking-wide text-[#f1d49a]">
                Calculus Community Hub
              </h2>
              <p className="text-xs text-[#9eb4ca]">
                Interest group chats · 1-on-1 DMs · LaTeX, YouTube, Memes & Ephemeral Snaps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d8af63]/30 bg-[#0b1320] p-2 text-[#f0e2bf] hover:border-[#d8af63]"
            aria-label="Close Social Hub"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Main 2-column layout */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Left rail: Rooms / DMs / Peers */}
          <div className="flex max-h-[36vh] w-full flex-col border-b border-[#d8af63]/20 bg-[#0b1220] md:max-h-none md:w-72 md:border-b-0 md:border-r">
            <div className="grid grid-cols-3 border-b border-[#d8af63]/20 text-xs font-semibold">
              {(
                [
                  ['groups', 'Groups'],
                  ['dms', 'DMs'],
                  ['peers', 'Players'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`py-2.5 transition ${
                    tab === id ? 'border-b-2 border-[#d8af63] bg-[#142034] text-[#f1d49a]' : 'text-[#8da3bc] hover:text-[#f0e2bf]'
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
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#5fb8c4]/50 bg-[#122638] px-3 py-2 text-xs font-semibold text-[#eafcff] hover:bg-[#18334a]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Group Chat
                  </button>

                  {showCreateRoom && (
                    <form onSubmit={handleCreateRoom} className="space-y-2 rounded-lg border border-[#d8af63]/30 bg-[#142034] p-2.5">
                      <input
                        type="text"
                        required
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Group name (e.g. u-Sub Speedrunners)"
                        className="w-full rounded border border-[#d8af63]/25 bg-[#0b1320] px-2.5 py-1.5 text-xs text-[#f5ebd2]"
                      />
                      <input
                        type="text"
                        value={newRoomDesc}
                        onChange={(e) => setNewRoomDesc(e.target.value)}
                        placeholder="Short topic description"
                        className="w-full rounded border border-[#d8af63]/25 bg-[#0b1320] px-2.5 py-1.5 text-xs text-[#f5ebd2]"
                      />
                      <select
                        value={newRoomCategory}
                        onChange={(e) => setNewRoomCategory(e.target.value)}
                        aria-label="Room category"
                        className="w-full rounded border border-[#d8af63]/25 bg-[#0b1320] px-2 py-1.5 text-xs text-[#f0e2bf]"
                      >
                        <option>Unit 1 · Pre-Calculus</option>
                        <option>Unit 2 · Limits</option>
                        <option>Unit 3 · Derivatives</option>
                        <option>Unit 4 · Applications</option>
                        <option>Unit 5 · Integrals</option>
                        <option>Unit 6 · Volumes & Work</option>
                        <option>Interests · Gaming</option>
                        <option>Interests · Music</option>
                        <option>Interests · Creators</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs text-[#c9b98a]">
                        <input
                          type="checkbox"
                          checked={newRoomPrivate}
                          onChange={(e) => setNewRoomPrivate(e.target.checked)}
                          className="accent-[#d8af63]"
                        />
                        Private invite-only room
                      </label>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowCreateRoom(false)}
                          className="rounded px-2.5 py-1 text-xs text-[#9eb4ca] hover:text-white"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="rounded bg-[#d8af63] px-3 py-1 text-xs font-bold text-[#141008]">
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
                        className={`rounded-lg border p-2.5 transition ${
                          selected ? 'border-[#d8af63]/70 bg-[#1a2940]' : 'border-[#d8af63]/15 bg-[#121c2e] hover:border-[#d8af63]/35'
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
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#f5ebd2]">
                              {room.isPrivate ? (
                                <Lock className="h-3 w-3 text-[#f1d49a]" aria-hidden />
                              ) : (
                                <Hash className="h-3.5 w-3.5 text-[#5fb8c4]" aria-hidden />
                              )}
                              {room.name}
                            </span>
                            {room.unreadCount > 0 && (
                              <span className="rounded bg-[#d8af63] px-1.5 py-0.5 text-[10px] font-bold text-[#141008]">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#8da3bc]">{room.category}</p>
                        </button>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-[#8da3bc]">{room.memberIds.length} members</span>
                          <button
                            type="button"
                            onClick={() => repo.toggleJoinRoom(room.id)}
                            className={`rounded px-2 py-0.5 font-semibold ${
                              room.joined
                                ? 'bg-[#1a3a32] text-[#8de8bd] hover:bg-[#234b41]'
                                : 'bg-[#2f8190] text-[#eafcff] hover:bg-[#3a96a7]'
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
                        className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition ${
                          selected ? 'border-[#d8af63]/70 bg-[#1a2940]' : 'border-[#d8af63]/15 bg-[#121c2e] hover:border-[#d8af63]/35'
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: peer?.avatarColor ?? '#2f8190' }}
                        >
                          {peer?.initials ?? 'DM'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-[#f5ebd2]">{room.name}</span>
                          <span className="block truncate text-[11px] text-[#8da3bc]">{peer?.currentUnit ?? 'Direct Message'}</span>
                        </span>
                        {room.unreadCount > 0 && (
                          <span className="rounded bg-[#d8af63] px-1.5 py-0.5 text-[10px] font-bold text-[#141008]">
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <p className="px-1 pt-2 text-[11px] text-[#8da3bc]">
                    Click any player in the Players tab or inside a group chat to start a private 1-on-1 conversation.
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
                      className="flex w-full items-start gap-2.5 rounded-lg border border-[#d8af63]/15 bg-[#121c2e] p-2.5 text-left hover:border-[#5fb8c4]/50"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: peer.avatarColor }}
                      >
                        {peer.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-1 text-xs font-bold text-[#f5ebd2]">
                          <span>{peer.name}</span>
                          <span className="text-[10px] font-normal text-[#8da3bc]">{peer.online ? 'Online' : 'Away'}</span>
                        </span>
                        <span className="block text-[11px] text-[#5fb8c4]">{peer.currentUnit}</span>
                        <span className="mt-1 block truncate text-[11px] text-[#9eb4ca]">{peer.interests.join(' · ')}</span>
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
                {/* Room header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8af63]/20 bg-[#111b2c] px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {activeRoom.kind === 'dm' ? (
                        <MessageSquare className="h-4 w-4 text-[#5fb8c4]" aria-hidden />
                      ) : activeRoom.isPrivate ? (
                        <Lock className="h-4 w-4 text-[#f1d49a]" aria-hidden />
                      ) : (
                        <Globe className="h-4 w-4 text-[#5fb8c4]" aria-hidden />
                      )}
                      <h3 className="text-sm font-bold text-[#f5ebd2]">{activeRoom.name}</h3>
                      <span className="text-xs text-[#8da3bc]">· {activeRoom.category}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#9eb4ca]">{activeRoom.description}</p>
                  </div>
                  {activeRoom.kind === 'group' && !activeRoom.joined && (
                    <button
                      type="button"
                      onClick={() => repo.toggleJoinRoom(activeRoom.id)}
                      className="rounded-lg bg-[#2f8190] px-3 py-1.5 text-xs font-bold text-[#eafcff] hover:bg-[#3a96a7]"
                    >
                      Join Group
                    </button>
                  )}
                </div>

                {/* Peer profile quick card */}
                {selectedPeer && (
                  <div className="border-b border-[#5fb8c4]/30 bg-[#132538] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: selectedPeer.avatarColor }}
                        >
                          {selectedPeer.initials}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#f1d49a]">
                            {selectedPeer.name} <span className="font-normal text-[#9eb4ca]">{selectedPeer.handle} · Age {selectedPeer.age}</span>
                          </p>
                          <p className="text-xs text-[#5fb8c4]">{selectedPeer.currentUnit}</p>
                          <p className="mt-1 text-xs text-[#dce7f2]">{selectedPeer.bio}</p>
                          <p className="mt-1 text-[11px] text-[#9eb4ca]">Interests: {selectedPeer.interests.join(' · ')}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPeer(null)}
                        className="text-[#9eb4ca] hover:text-white"
                        aria-label="Close profile card"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleStartDm(selectedPeer)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8af63] px-3.5 py-1.5 text-xs font-bold text-[#141008] hover:bg-[#f1d49a]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Start Private DM
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages stream */}
                <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
                  {activeMessages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>

                {/* Rich media popovers above composer */}
                {showLatexBar && (
                  <div className="border-t border-[#d8af63]/20 bg-[#101a2a] px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#c9b98a]">Quick LaTeX:</span>
                      {LATEX_QUICK_SNIPPETS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setDraftLatex(s.code)}
                          className="rounded border border-[#d8af63]/30 bg-[#17253a] px-2 py-0.5 text-[11px] text-[#f1d49a] hover:border-[#d8af63]"
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
                      className="mt-2 w-full rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-3 py-1.5 font-mono text-xs text-[#f5ebd2] focus:border-[#d8af63] focus:outline-none"
                    />
                    {draftLatex.trim() && (
                      <div className="mt-1.5 rounded border border-[#5fb8c4]/25 bg-[#0b1320] px-3 py-1.5 text-center text-sm text-[#f7ebd0]">
                        <MathText text={`$$${draftLatex}$$`} />
                      </div>
                    )}
                  </div>
                )}

                {showGifPicker && (
                  <div className="border-t border-[#d8af63]/20 bg-[#101a2a] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#f1d49a]">Calculus Memes & GIFs</p>
                      <button type="button" onClick={() => setShowGifPicker(false)} className="text-xs text-[#9eb4ca] hover:text-white">
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
                          className="overflow-hidden rounded-lg border border-[#d8af63]/25 bg-[#0b1320] text-left hover:border-[#5fb8c4]"
                        >
                          <img src={meme.dataUrl} alt={meme.title} className="h-20 w-full object-cover" />
                          <p className="truncate px-2 py-1 text-[11px] text-[#e2d7bd]">{meme.title}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="url"
                        value={customGifUrl}
                        onChange={(e) => setCustomGifUrl(e.target.value)}
                        placeholder="Or paste a direct GIF / meme image URL..."
                        className="flex-1 rounded-lg border border-[#d8af63]/25 bg-[#0b1320] px-2.5 py-1.5 text-xs text-[#f5ebd2]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!customGifUrl.trim()) return;
                          setPendingAttachment({ kind: 'gif', url: customGifUrl.trim(), caption: 'Shared GIF' });
                          setCustomGifUrl('');
                          setShowGifPicker(false);
                        }}
                        className="rounded-lg bg-[#2f8190] px-3 py-1.5 text-xs font-semibold text-[#eafcff]"
                      >
                        Attach
                      </button>
                    </div>
                  </div>
                )}

                {pendingAttachment && (
                  <div className="flex items-center justify-between gap-3 border-t border-[#5fb8c4]/30 bg-[#112234] px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={pendingAttachment.url} alt="" className="h-12 w-16 rounded object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-[#f5ebd2]">
                          {pendingAttachment.caption || 'Attachment ready'}
                        </p>
                        {pendingAttachment.kind === 'image' && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9eb4ca]">
                            <Timer className="h-3 w-3 text-[#ff8a7a]" aria-hidden />
                            <span>Ephemeral Snap:</span>
                            {([0, 5, 10] as const).map((sec) => (
                              <button
                                key={sec}
                                type="button"
                                onClick={() => setSnapTimer(sec)}
                                className={`rounded px-1.5 py-0.5 font-semibold ${
                                  snapTimer === sec ? 'bg-[#ff7e6b] text-[#1a0a0c]' : 'bg-[#0b1320] text-[#9eb4ca]'
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
                      className="text-[#9eb4ca] hover:text-white"
                      aria-label="Remove attachment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Message Composer */}
                <form onSubmit={handleSend} className="border-t border-[#d8af63]/20 bg-[#111b2c] p-3">
                  <div className="flex items-center gap-1.5 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLatexBar((v) => !v);
                        setShowGifPicker(false);
                      }}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                        showLatexBar
                          ? 'border-[#d8af63] bg-[#d8af63]/20 text-[#f1d49a]'
                          : 'border-[#d8af63]/20 bg-[#0b1320] text-[#b4c4d6] hover:text-white'
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
                          ? 'border-[#d8af63] bg-[#d8af63]/20 text-[#f1d49a]'
                          : 'border-[#d8af63]/20 bg-[#0b1320] text-[#b4c4d6] hover:text-white'
                      }`}
                    >
                      <Smile className="h-3.5 w-3.5" aria-hidden /> Meme / GIF
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-md border border-[#d8af63]/20 bg-[#0b1320] px-2 py-1 text-[11px] font-semibold text-[#b4c4d6] hover:text-white"
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
                    <span className="ml-auto hidden items-center gap-1 text-[11px] text-[#7f97b0] sm:inline-flex">
                      <ImageIcon className="h-3 w-3" aria-hidden /> Paste YouTube or web links for rich previews
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder={`Message ${activeRoom.name} (supports $LaTeX$, YouTube links, URLs)...`}
                      className="flex-1 rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-3 py-2 text-sm text-[#f5ebd2] focus:border-[#d8af63] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8af63] px-4 py-2 text-xs font-bold text-[#141008] hover:bg-[#f1d49a]"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8da3bc]">Select a group chat or DM to start talking.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
