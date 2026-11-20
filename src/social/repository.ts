import { createInitialSocialState } from './seedData';
import type {
  ChatMessage,
  ChatRoom,
  CreateRoomInput,
  LinkPreview,
  SendMessageInput,
  SocialRepository,
  SocialState,
} from './types';

const STORAGE_KEY = 'odyssey/social-hub/v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Extract a YouTube video ID from standard watch, share, or shorts URLs. */
export function extractYouTubeId(text: string): string | undefined {
  const match = text.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match?.[1];
}

/** Extract the first HTTP(S) URL in a message and construct a clean preview card. */
export function extractLinkPreview(text: string): LinkPreview | undefined {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!match) return undefined;
  const rawUrl = match[0].replace(/[),.;!?]+$/, '');
  try {
    const parsed = new URL(rawUrl);
    const domain = parsed.hostname.replace(/^www\./, '');
    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      return {
        url: rawUrl,
        domain: 'youtube.com',
        title: 'Shared YouTube Study Video',
        description: `Embedded clip (${ytId}) — watch inline without leaving your voyage.`,
      };
    }
    const pathSegment = parsed.pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]+/g, ' ');
    const title = pathSegment ? `${domain} · ${pathSegment.slice(0, 42)}` : domain;
    return {
      url: rawUrl,
      domain,
      title,
      description: `Shared resource link from ${domain}`,
    };
  } catch {
    return undefined;
  }
}

export function isSnapExpired(message: ChatMessage, now: number = Date.now()): boolean {
  const att = message.attachment;
  if (!att?.snapSeconds || !att.openedAt) return false;
  return now >= att.openedAt + att.snapSeconds * 1000;
}

export function snapRemainingSeconds(message: ChatMessage, now: number = Date.now()): number {
  const att = message.attachment;
  if (!att?.snapSeconds) return 0;
  if (!att.openedAt) return att.snapSeconds;
  return Math.max(0, Math.ceil((att.openedAt + att.snapSeconds * 1000 - now) / 1000));
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildPeerReply(room: ChatRoom, senderText: string, hasLatex: boolean): string {
  const lower = senderText.toLowerCase();
  if (lower.includes('limit') || lower.includes('asymptote') || lower.includes('ivt')) {
    return 'Nice catch on limits — checking the left and right approaches separately always keeps me from missing jump discontinuities.';
  }
  if (lower.includes('chain') || lower.includes('derivative') || lower.includes('rate')) {
    return 'Solid derivative breakdown! Writing the outer/inner functions explicitly makes Chain Rule way cleaner.';
  }
  if (lower.includes('integral') || lower.includes('sub') || lower.includes('area') || lower.includes('volume')) {
    return 'Love that integral intuition — checking your antiderivative by differentiating back is undefeated (+ C of course!).';
  }
  if (hasLatex) {
    return 'Clean LaTeX! Saved that formula for my next review encounter.';
  }
  if (room.kind === 'dm') {
    return 'Got your message! Want to run a quick Calculus I problem or swap hints on the current chapter?';
  }
  return 'Appreciate you sharing that with the squad — let’s keep the streak alive!';
}

export class LocalSocialRepository implements SocialRepository {
  private state: SocialState;
  private listeners = new Set<() => void>();
  private storage: StorageLike | null;
  private enableAutoReplies: boolean;

  constructor(opts?: { storage?: StorageLike | null; displayName?: string; interests?: string[]; enableAutoReplies?: boolean }) {
    this.storage = opts?.storage !== undefined ? opts.storage : typeof localStorage !== 'undefined' ? localStorage : null;
    this.enableAutoReplies = opts?.enableAutoReplies ?? true;
    this.state = this.load(opts?.displayName, opts?.interests);
  }

  private load(displayName?: string, interests?: string[]): SocialState {
    if (this.storage) {
      try {
        const raw = this.storage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SocialState;
          if (parsed && Array.isArray(parsed.rooms) && Array.isArray(parsed.peers) && parsed.messages) {
            return parsed;
          }
        }
      } catch {
        /* fallback to seed */
      }
    }
    return createInitialSocialState(displayName, interests);
  }

  private persist() {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* ignore quota */
    }
  }

  private emit() {
    this.persist();
    for (const fn of this.listeners) fn();
  }

  getState = (): SocialState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  updateCurrentUser(name: string, interests: string[]): void {
    const cleanName = name.trim() || this.state.currentUser.name;
    const initials =
      cleanName
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2) || 'AX';
    this.state = {
      ...this.state,
      currentUser: {
        ...this.state.currentUser,
        name: cleanName,
        handle: `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'odysseus'}`,
        initials,
        interests: interests.length > 0 ? interests : this.state.currentUser.interests,
      },
    };
    this.emit();
  }

  createRoom(input: CreateRoomInput): ChatRoom {
    const name = input.name.trim() || 'Calculus Study Room';
    const room: ChatRoom = {
      id: makeId('room'),
      kind: 'group',
      name,
      description: input.description.trim() || 'Student-created Calculus I study & interest lounge.',
      category: input.category.trim() || 'General',
      isPrivate: input.isPrivate,
      joined: true,
      memberIds: ['me', 'peer-maya'],
      unreadCount: 0,
    };
    const welcome: ChatMessage = {
      id: makeId('msg'),
      roomId: room.id,
      senderId: 'peer-maya',
      createdAt: Date.now(),
      text: `Welcome to ${room.name}! Drop LaTeX equations, YouTube links, memes, or quick study snaps here.`,
    };
    this.state = {
      ...this.state,
      rooms: [room, ...this.state.rooms],
      messages: { ...this.state.messages, [room.id]: [welcome] },
    };
    this.emit();
    return room;
  }

  toggleJoinRoom(roomId: string): void {
    this.state = {
      ...this.state,
      rooms: this.state.rooms.map((r) => {
        if (r.id !== roomId || r.kind !== 'group') return r;
        const joined = !r.joined;
        const memberIds = joined
          ? Array.from(new Set([...r.memberIds, 'me']))
          : r.memberIds.filter((id) => id !== 'me');
        return { ...r, joined, memberIds, unreadCount: 0 };
      }),
    };
    this.emit();
  }

  markRoomRead(roomId: string): void {
    const target = this.state.rooms.find((r) => r.id === roomId);
    if (!target || target.unreadCount === 0) return;
    this.state = {
      ...this.state,
      rooms: this.state.rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
    };
    this.emit();
  }

  openDirectMessage(peerId: string): ChatRoom {
    const existing = this.state.rooms.find((r) => r.kind === 'dm' && r.dmPeerId === peerId);
    if (existing) {
      this.markRoomRead(existing.id);
      return existing;
    }
    const peer = this.state.peers.find((p) => p.id === peerId);
    if (!peer) throw new Error(`Unknown peer ${peerId}`);
    const dmRoom: ChatRoom = {
      id: `dm-${peer.id}`,
      kind: 'dm',
      name: peer.name,
      description: `Private 1-on-1 chat with ${peer.name} (${peer.handle})`,
      category: 'Direct Message',
      isPrivate: true,
      joined: true,
      memberIds: ['me', peer.id],
      dmPeerId: peer.id,
      unreadCount: 0,
    };
    const opener: ChatMessage = {
      id: makeId('msg'),
      roomId: dmRoom.id,
      senderId: peer.id,
      createdAt: Date.now(),
      text: `Hey ${this.state.currentUser.name}! Ready to tackle ${peer.currentUnit}? Send a problem or LaTeX snippet anytime.`,
    };
    this.state = {
      ...this.state,
      rooms: [dmRoom, ...this.state.rooms],
      messages: { ...this.state.messages, [dmRoom.id]: [opener] },
    };
    this.emit();
    return dmRoom;
  }

  sendMessage(input: SendMessageInput): ChatMessage {
    const room = this.state.rooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error(`Unknown room ${input.roomId}`);
    const text = input.text.trim();
    const youtubeId = extractYouTubeId(text);
    const linkPreview = extractLinkPreview(text);

    const msg: ChatMessage = {
      id: makeId('msg'),
      roomId: room.id,
      senderId: 'me',
      createdAt: Date.now(),
      text,
      latexSnippet: input.latexSnippet?.trim() || undefined,
      youtubeId,
      linkPreview,
      attachment: input.attachment,
    };

    const existing = this.state.messages[room.id] ?? [];
    this.state = {
      ...this.state,
      rooms: this.state.rooms.map((r) => (r.id === room.id ? { ...r, joined: true, unreadCount: 0 } : r)),
      messages: { ...this.state.messages, [room.id]: [...existing, msg] },
    };
    this.emit();

    // Contextual community peer reply so the room feels alive while testing.
    if (this.enableAutoReplies && typeof window !== 'undefined') {
      const responderId = room.dmPeerId ?? room.memberIds.find((id) => id !== 'me') ?? this.state.peers[0]?.id;
      if (responderId) {
        const replyText = buildPeerReply(room, text, Boolean(msg.latexSnippet));
        window.setTimeout(() => {
          const reply: ChatMessage = {
            id: makeId('msg'),
            roomId: room.id,
            senderId: responderId,
            createdAt: Date.now(),
            text: replyText,
          };
          const current = this.state.messages[room.id] ?? [];
          this.state = {
            ...this.state,
            messages: { ...this.state.messages, [room.id]: [...current, reply] },
          };
          this.emit();
        }, 1200);
      }
    }

    return msg;
  }

  openSnap(roomId: string, messageId: string, now: number = Date.now()): void {
    const list = this.state.messages[roomId];
    if (!list) return;
    let changed = false;
    const next = list.map((m) => {
      if (m.id !== messageId || !m.attachment?.snapSeconds || m.attachment.openedAt) return m;
      changed = true;
      return {
        ...m,
        attachment: { ...m.attachment, openedAt: now },
      };
    });
    if (!changed) return;
    this.state = {
      ...this.state,
      messages: { ...this.state.messages, [roomId]: next },
    };
    this.emit();
  }
}
