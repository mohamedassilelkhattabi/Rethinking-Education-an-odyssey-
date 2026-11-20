import Phaser from 'phaser';
import { CHAR_H, CHAR_W, heroSheet, HERO_FRAMES, npcSheet } from '../art/characters';
import {
  contactShadowTexture,
  realisticBackdrop,
  realisticEndingBackdrop,
  realisticShipTexture,
  realisticTileset,
  realisticWaterTexture,
} from '../art/realisticWorld';
import {
  boulderTexture,
  caveMouthTexture,
  flameSheet,
  itemTexture,
  particleTextures,
  PROP_KINDS,
  propTexture,
} from '../art/world';
import { ITEM_ORDER } from '../items';
import type { Theme } from '../levels';
import { NPCS } from '../npcs';

function addCanvas(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  return scene.textures.addCanvas(key, canvas)!;
}

function addSheet(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement, fw: number, fh: number) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.addCanvas(key, canvas)!;
  const cols = Math.floor(canvas.width / fw);
  for (let i = 0; i < cols; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}

const THEMES: Theme[] = ['lotus', 'cyclops', 'aeolus', 'sirens', 'passage', 'ithaca'];

/** Generate every texture and animation the game uses (upgraded realistic procedural assets). */
export function registerTextures(scene: Phaser.Scene) {
  addSheet(scene, 'hero', heroSheet(), CHAR_W * 2, CHAR_H * 2);
  for (const npc of NPCS) addSheet(scene, `npc-${npc.key}`, npcSheet(npc.look), CHAR_W * 2, CHAR_H * 2);

  addCanvas(scene, 'tiles', realisticTileset());
  for (const id of ITEM_ORDER) addCanvas(scene, `item-${id}`, itemTexture(id));
  for (const kind of PROP_KINDS) addCanvas(scene, `prop-${kind}`, propTexture(kind));
  addSheet(scene, 'flame', flameSheet(), 16, 16);
  addCanvas(scene, 'ship', realisticShipTexture('#fbf0d4', '#d8af63'));
  addCanvas(scene, 'windship', realisticShipTexture('#eaf8fc', '#4fb3c2'));
  addCanvas(scene, 'boulder', boulderTexture());
  addCanvas(scene, 'cave-light', caveMouthTexture());
  addCanvas(scene, 'contact-shadow', contactShadowTexture());
  for (const [k, c] of Object.entries(particleTextures())) addCanvas(scene, `fx-${k}`, c);

  // Soft sea-spray / dust mote particle
  if (!scene.textures.exists('fx-mote')) {
    const c = document.createElement('canvas');
    c.width = c.height = 12;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
    g.addColorStop(0, 'rgba(255, 248, 224, 0.95)');
    g.addColorStop(1, 'rgba(255, 248, 224, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 12, 12);
    scene.textures.addCanvas('fx-mote', c);
  }

  for (const t of THEMES) {
    const b = realisticBackdrop(t);
    addCanvas(scene, `bg-${t}-sky`, b.sky);
    addCanvas(scene, `bg-${t}-clouds`, b.clouds);
    addCanvas(scene, `bg-${t}-rays`, b.rays);
    addCanvas(scene, `bg-${t}-far`, b.far);
    addCanvas(scene, `bg-${t}-mid`, b.mid);
    addCanvas(scene, `water-${t}`, realisticWaterTexture(t));
  }

  const m = realisticBackdrop('menu');
  addCanvas(scene, 'bg-menu-sky', m.sky);
  addCanvas(scene, 'bg-menu-clouds', m.clouds);
  addCanvas(scene, 'bg-menu-rays', m.rays);
  addCanvas(scene, 'bg-menu-far', m.far);
  addCanvas(scene, 'bg-menu-mid', m.mid);
  addCanvas(scene, 'water-menu', realisticWaterTexture('menu'));

  addCanvas(scene, 'end-victory', realisticEndingBackdrop('victory'));
  addCanvas(scene, 'end-death', realisticEndingBackdrop('death'));

  if (!scene.textures.exists('px')) {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 4, 4);
    scene.textures.addCanvas('px', c);
  }

  if (!scene.textures.exists('glow')) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,224,158,0.85)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    scene.textures.addCanvas('glow', c);
  }

  const a = scene.anims;
  if (!a.exists('hero-idle')) {
    a.create({ key: 'hero-idle', frames: a.generateFrameNumbers('hero', { frames: HERO_FRAMES.idle }), frameRate: 2, repeat: -1 });
    a.create({ key: 'hero-walk', frames: a.generateFrameNumbers('hero', { frames: HERO_FRAMES.walk }), frameRate: 10, repeat: -1 });
    a.create({ key: 'hero-jump', frames: [{ key: 'hero', frame: HERO_FRAMES.jump }] });
    a.create({ key: 'hero-fall', frames: [{ key: 'hero', frame: HERO_FRAMES.fall }] });
    a.create({ key: 'hero-hurt', frames: [{ key: 'hero', frame: HERO_FRAMES.hurt }] });
    a.create({ key: 'flame', frames: a.generateFrameNumbers('flame', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    for (const npc of NPCS) {
      a.create({ key: `npc-${npc.key}-idle`, frames: a.generateFrameNumbers(`npc-${npc.key}`, { start: 0, end: 1 }), frameRate: 1.6, repeat: -1 });
    }
  }
}
