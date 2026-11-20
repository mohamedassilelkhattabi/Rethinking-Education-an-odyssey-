import { STUDY_MEMES } from './memes';
import type { ChatMessage, ChatRoom, SocialState, SocialUser } from './types';

export const SEED_PEERS: SocialUser[] = [
  {
    id: 'peer-maya',
    name: 'Maya Chen',
    handle: '@mayaderives',
    avatarColor: '#2f8190',
    initials: 'MC',
    age: 16,
    currentUnit: 'Unit 3 · Derivatives',
    bio: 'Valorant controller main + AP Calc AB grinder. Obsessed with related rates & camera physics.',
    interests: ['Gaming', 'Video Editing', 'Related Rates'],
    online: true,
  },
  {
    id: 'peer-dev',
    name: 'Dev Patel',
    handle: '@devbeats',
    avatarColor: '#8d5b2d',
    initials: 'DP',
    age: 17,
    currentUnit: 'Unit 5 · Integrals',
    bio: 'Making lo-fi & synthwave tracks in FL Studio. Sine waves are literally trig derivatives.',
    interests: ['Music Production', 'Lo-Fi Beats', 'Integrals'],
    online: true,
  },
  {
    id: 'peer-chloe',
    name: 'Chloe Brooks',
    handle: '@chloehoops',
    avatarColor: '#5c4b99',
    initials: 'CB',
    age: 16,
    currentUnit: 'Unit 4 · Optimization',
    bio: 'Varsity point guard modeling jump-shot arcs and projectile optimization.',
    interests: ['Basketball', 'Fitness & Running', 'Optimization'],
    online: true,
  },
  {
    id: 'peer-marcus',
    name: 'Marcus Kim',
    handle: '@marcuscode',
    avatarColor: '#3a7a5c',
    initials: 'MK',
    age: 15,
    currentUnit: 'Unit 2 · Limits',
    bio: 'Building a Minecraft physics mod and learning limits + continuity from scratch.',
    interests: ['Coding & Robotics', 'Minecraft', 'Limits'],
    online: true,
  },
  {
    id: 'peer-priya',
    name: 'Priya Nair',
    handle: '@priyareels',
    avatarColor: '#9e3e58',
    initials: 'PN',
    age: 17,
    currentUnit: 'Unit 6 · Volumes',
    bio: 'Short-form filmmaker & Blender 3D artist. Volumes of revolution are basically lathe meshes.',
    interests: ['Filmmaking', 'Digital Art', 'Volumes'],
    online: false,
  },
];

export const SEED_ROOMS: ChatRoom[] = [
  {
    id: 'room-related-rates',
    kind: 'group',
    name: 'Related Rates Survivors',
    description: 'Unit 3 chain rule, implicit differentiation, and time-rate sanity checks.',
    category: 'Unit 3 · Derivatives',
    isPrivate: false,
    joined: true,
    memberIds: ['me', 'peer-maya', 'peer-chloe', 'peer-dev'],
    unreadCount: 1,
  },
  {
    id: 'room-gaming-physics',
    kind: 'group',
    name: 'Gaming & Physics',
    description: 'Projectile arcs, hitbox optimization, cooldown curves, and frame-rate math.',
    category: 'Interests · Gaming',
    isPrivate: false,
    joined: true,
    memberIds: ['me', 'peer-maya', 'peer-marcus', 'peer-chloe'],
    unreadCount: 0,
  },
  {
    id: 'room-music-producers',
    kind: 'group',
    name: 'Music Producers & Waveforms',
    description: 'Trig derivatives, harmonics, BPM curves, and sound-wave integrals.',
    category: 'Interests · Music',
    isPrivate: false,
    joined: false,
    memberIds: ['peer-dev', 'peer-priya'],
    unreadCount: 0,
  },
  {
    id: 'room-limits-crew',
    kind: 'group',
    name: 'Limits & Continuity Crew',
    description: 'Unit 2 squeeze theorem, removable holes, asymptotes, and IVT.',
    category: 'Unit 2 · Limits',
    isPrivate: false,
    joined: true,
    memberIds: ['me', 'peer-marcus', 'peer-priya'],
    unreadCount: 0,
  },
  {
    id: 'room-night-owls',
    kind: 'group',
    name: 'AP Calc Night Owls',
    description: 'Private late-night study squad for Unit 5–6 integrals and FRQ speedruns.',
    category: 'Private Study Squad',
    isPrivate: true,
    joined: false,
    memberIds: ['peer-dev', 'peer-chloe', 'peer-priya'],
    unreadCount: 0,
  },
  {
    id: 'dm-peer-maya',
    kind: 'dm',
    name: 'Maya Chen',
    description: 'Direct message with Maya Chen',
    category: 'Direct Message',
    isPrivate: true,
    joined: true,
    memberIds: ['me', 'peer-maya'],
    dmPeerId: 'peer-maya',
    unreadCount: 1,
  },
];

const now = Date.now();
const minsAgo = (m: number) => now - m * 60_000;

export const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  'room-related-rates': [
    {
      id: 'm-rr-1',
      roomId: 'room-related-rates',
      senderId: 'peer-maya',
      createdAt: minsAgo(24),
      text: 'Quick trick that saved me on Unit 3 Q9: always differentiate the whole equation with respect to $t$ BEFORE plugging in the snapshot numbers!',
      latexSnippet: '\\frac{d}{dt}(x^2 + y^2) = 0 \\implies 2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0',
    },
    {
      id: 'm-rr-2',
      roomId: 'room-related-rates',
      senderId: 'peer-chloe',
      createdAt: minsAgo(16),
      text: 'This 3Blue1Brown visual finally made derivatives click for me:',
      youtubeId: 'WUvTyaaNkzM',
      linkPreview: {
        url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
        title: 'The essence of calculus — 3Blue1Brown',
        domain: 'youtube.com',
        description: 'Visual intuition for derivatives, integrals, and why slopes and areas are opposites.',
      },
    },
    {
      id: 'm-rr-3',
      roomId: 'room-related-rates',
      senderId: 'peer-dev',
      createdAt: minsAgo(6),
      text: 'Literally me every single time a balloon radius problem shows up:',
      attachment: {
        kind: 'gif',
        url: STUDY_MEMES[3].dataUrl,
        caption: STUDY_MEMES[3].title,
      },
    },
  ],
  'room-gaming-physics': [
    {
      id: 'm-gp-1',
      roomId: 'room-gaming-physics',
      senderId: 'peer-marcus',
      createdAt: minsAgo(35),
      text: 'Modeling grenade arcs in my Minecraft mod using $h(t) = -4.9t^2 + v_0 t$. Setting $h\'(t) = 0$ instantly gives the peak height time!',
    },
    {
      id: 'm-gp-2',
      roomId: 'room-gaming-physics',
      senderId: 'peer-chloe',
      createdAt: minsAgo(14),
      text: 'Try plotting the velocity and position curves side-by-side here — super clean visual:',
      linkPreview: {
        url: 'https://www.desmos.com/calculator',
        title: 'Desmos Graphing Calculator',
        domain: 'desmos.com',
        description: 'Interactive graphing calculator for exploring derivatives, tangent slopes, and integrals.',
      },
    },
  ],
  'room-music-producers': [
    {
      id: 'm-mp-1',
      roomId: 'room-music-producers',
      senderId: 'peer-dev',
      createdAt: minsAgo(40),
      text: 'Fun audio fact: the derivative of a pure sine wave $\\sin(\\omega t)$ is $\\omega \\cos(\\omega t)$ — a 90° phase shift scaled by frequency!',
    },
  ],
  'room-limits-crew': [
    {
      id: 'm-lc-1',
      roomId: 'room-limits-crew',
      senderId: 'peer-marcus',
      createdAt: minsAgo(28),
      text: 'Remember for Unit 2: if left-hand limit $\\neq$ right-hand limit, the two-sided limit does not exist (jump discontinuity).',
    },
  ],
  'room-night-owls': [
    {
      id: 'm-no-1',
      roomId: 'room-night-owls',
      senderId: 'peer-priya',
      createdAt: minsAgo(50),
      text: 'Unit 6 Disk Method tip: picture slicing a 3D Blender vase perpendicular to the $x$-axis — each slice is a circle of area $\\pi [R(x)]^2$.',
      attachment: {
        kind: 'gif',
        url: STUDY_MEMES[0].dataUrl,
        caption: STUDY_MEMES[0].title,
      },
    },
  ],
  'dm-peer-maya': [
    {
      id: 'm-dm-1',
      roomId: 'dm-peer-maya',
      senderId: 'peer-maya',
      createdAt: minsAgo(9),
      text: 'Hey! Just finished Chapter II (Limits) with 0 hints. HMU if you want to compare Chain Rule tricks for Unit 3!',
    },
  ],
};

export function createInitialSocialState(displayName = 'Alex', interests: string[] = ['Gaming', 'Calculus I']): SocialState {
  const cleanName = displayName.trim() || 'Alex';
  const initials = cleanName
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'AX';

  return {
    currentUser: {
      id: 'me',
      name: cleanName,
      handle: `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'odysseus'}`,
      avatarColor: '#c48d3f',
      initials,
      age: 16,
      currentUnit: 'Unit 1 · Pre-Calculus',
      bio: 'Voyaging through Calculus I on The Path to Ithaca.',
      interests,
      online: true,
    },
    peers: SEED_PEERS.map((p) => ({ ...p, interests: [...p.interests] })),
    rooms: SEED_ROOMS.map((r) => ({ ...r, memberIds: [...r.memberIds] })),
    messages: Object.fromEntries(Object.entries(SEED_MESSAGES).map(([k, list]) => [k, list.map((m) => ({ ...m }))])),
  };
}
