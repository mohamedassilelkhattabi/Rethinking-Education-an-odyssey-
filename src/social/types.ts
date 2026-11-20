export interface SocialUser {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  initials: string;
  age: number;
  currentUnit: string;
  bio: string;
  interests: string[];
  online: boolean;
}

export interface LinkPreview {
  url: string;
  title: string;
  domain: string;
  description: string;
}

export interface MediaAttachment {
  kind: 'gif' | 'image';
  url: string;
  caption?: string;
  /** Optional ephemeral snap duration in seconds (e.g. 5 or 10). */
  snapSeconds?: number;
  /** Timestamp when the recipient opened the snap. */
  openedAt?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  createdAt: number;
  text: string;
  latexSnippet?: string;
  youtubeId?: string;
  linkPreview?: LinkPreview;
  attachment?: MediaAttachment;
}

export interface ChatRoom {
  id: string;
  kind: 'group' | 'dm';
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  joined: boolean;
  memberIds: string[];
  dmPeerId?: string;
  unreadCount: number;
}

export interface SocialState {
  currentUser: SocialUser;
  peers: SocialUser[];
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
}

export interface CreateRoomInput {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
}

export interface SendMessageInput {
  roomId: string;
  text: string;
  latexSnippet?: string;
  attachment?: MediaAttachment;
}

/**
 * Modular repository contract designed to swap LocalSocialRepository
 * for Firebase Firestore or Supabase Realtime without touching UI components.
 */
export interface SocialRepository {
  getState(): SocialState;
  subscribe(listener: () => void): () => void;
  updateCurrentUser(name: string, interests: string[]): void;
  createRoom(input: CreateRoomInput): ChatRoom;
  toggleJoinRoom(roomId: string): void;
  markRoomRead(roomId: string): void;
  openDirectMessage(peerId: string): ChatRoom;
  sendMessage(input: SendMessageInput): ChatMessage;
  openSnap(roomId: string, messageId: string, now?: number): void;
}
