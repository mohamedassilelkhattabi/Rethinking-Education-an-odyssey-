import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractLinkPreview,
  extractYouTubeId,
  isSnapExpired,
  LocalSocialRepository,
  snapRemainingSeconds,
} from '../social/repository';

function createMemoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}

test('extractYouTubeId and extractLinkPreview parse YouTube URLs and web links accurately', () => {
  assert.equal(extractYouTubeId('Check this out https://www.youtube.com/watch?v=WUvTyaaNkzM!'), 'WUvTyaaNkzM');
  assert.equal(extractYouTubeId('https://youtu.be/rfG8ce4nNh0'), 'rfG8ce4nNh0');
  assert.equal(extractYouTubeId('https://youtube.com/shorts/abcdef12345'), 'abcdef12345');
  assert.equal(extractYouTubeId('no links here'), undefined);

  const preview = extractLinkPreview('Plot it on https://www.desmos.com/calculator right now');
  assert.ok(preview);
  assert.equal(preview.domain, 'desmos.com');
  assert.equal(preview.url, 'https://www.desmos.com/calculator');
});

test('LocalSocialRepository supports creating group chats, joining/leaving, 1-on-1 DMs, rich messages, and ephemeral snaps', () => {
  const mem = createMemoryStorage();
  const repo = new LocalSocialRepository({ storage: mem, displayName: 'Jordan', enableAutoReplies: false });

  const initial = repo.getState();
  assert.ok(initial.rooms.some((r) => r.name === 'Related Rates Survivors'));
  assert.ok(initial.peers.length >= 5);

  // Create a private group chat
  const created = repo.createRoom({
    name: 'Shell Method Crew',
    description: 'Unit 6 cylindrical shells practice',
    category: 'Unit 6 · Volumes & Work',
    isPrivate: true,
  });
  assert.equal(created.isPrivate, true);
  assert.equal(created.joined, true);
  assert.ok(repo.getState().rooms.some((r) => r.id === created.id));

  // Toggle join/leave
  repo.toggleJoinRoom(created.id);
  assert.equal(repo.getState().rooms.find((r) => r.id === created.id)?.joined, false);
  repo.toggleJoinRoom(created.id);
  assert.equal(repo.getState().rooms.find((r) => r.id === created.id)?.joined, true);

  // Open a new 1-on-1 DM with Dev Patel and verify idempotency
  const dm1 = repo.openDirectMessage('peer-dev');
  const dm2 = repo.openDirectMessage('peer-dev');
  assert.equal(dm1.id, dm2.id);
  assert.equal(dm1.kind, 'dm');

  // Send message with LaTeX, YouTube link, and ephemeral 5-second snap
  const sent = repo.sendMessage({
    roomId: dm1.id,
    text: 'Check https://youtu.be/WUvTyaaNkzM and my scratchpad!',
    latexSnippet: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
    attachment: {
      kind: 'image',
      url: 'data:image/png;base64,iVBORw0KGgo=',
      caption: 'whiteboard.png',
      snapSeconds: 5,
    },
  });

  assert.equal(sent.youtubeId, 'WUvTyaaNkzM');
  assert.equal(sent.latexSnippet, '\\int_0^1 x^2\\,dx = \\frac{1}{3}');
  assert.equal(isSnapExpired(sent, 1000), false);
  assert.equal(snapRemainingSeconds(sent, 1000), 5);

  // Open snap at t=10_000 and verify expiration after 5s
  repo.openSnap(dm1.id, sent.id, 10_000);
  const updatedMsg = repo.getState().messages[dm1.id].find((m) => m.id === sent.id)!;
  assert.equal(snapRemainingSeconds(updatedMsg, 12_000), 3);
  assert.equal(isSnapExpired(updatedMsg, 12_000), false);
  assert.equal(isSnapExpired(updatedMsg, 15_001), true);
  assert.equal(snapRemainingSeconds(updatedMsg, 15_001), 0);
});
