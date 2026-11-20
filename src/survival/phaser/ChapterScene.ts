import Phaser from 'phaser';
import { sfx } from '../../game/sound';
import { TILE_INDEX } from '../art/world';
import { ITEMS } from '../items';
import { getLevel, ROWS, standY, TILE, WORLD_HEIGHT, type LevelSpec, type PickupSpec, type Theme } from '../levels';
import { NPC_BY_QUESTION, type NpcDef } from '../npcs';
import { isExitUnlocked, isPickupAvailable, npcStatus } from '../reducer';
import type { GameStore } from '../store';
import type { SurvivalState } from '../types';
import { Player, type PlayerKeys } from './Player';

const FONT = '"Press Start 2P", monospace';
const INTERACT_RADIUS = 65;
const EXIT_RADIUS = 96;
const WATER_Y = 15 * TILE + 6;

interface ThemeTiles {
  top: number;
  fill: number;
  altTop: number;
  altFill: number;
  platform: number;
  bg: number;
  floating?: boolean;
}

const THEME_TILES: Record<Theme, ThemeTiles> = {
  lotus: { top: TILE_INDEX.grassTop, fill: TILE_INDEX.dirt, altTop: TILE_INDEX.sandTop, altFill: TILE_INDEX.sandFill, platform: TILE_INDEX.wood, bg: 0x3b86b8 },
  cyclops: { top: TILE_INDEX.caveTop, fill: TILE_INDEX.caveFill, altTop: TILE_INDEX.caveTop, altFill: TILE_INDEX.caveFill, platform: TILE_INDEX.wood, bg: 0x120c09 },
  aeolus: { top: TILE_INDEX.marbleTop, fill: TILE_INDEX.marbleFill, altTop: TILE_INDEX.marbleTop, altFill: TILE_INDEX.marbleFill, platform: TILE_INDEX.cloud, bg: 0x5ca4d4, floating: true },
  sirens: { top: TILE_INDEX.rockTop, fill: TILE_INDEX.rockFill, altTop: TILE_INDEX.marbleTop, altFill: TILE_INDEX.marbleFill, platform: TILE_INDEX.dock, bg: 0x1e2c52 },
  passage: { top: TILE_INDEX.rockTop, fill: TILE_INDEX.rockFill, altTop: TILE_INDEX.sandTop, altFill: TILE_INDEX.sandFill, platform: TILE_INDEX.dock, bg: 0x1c2c3c },
  ithaca: { top: TILE_INDEX.marbleTop, fill: TILE_INDEX.marbleFill, altTop: TILE_INDEX.sandTop, altFill: TILE_INDEX.sandFill, platform: TILE_INDEX.wood, bg: 0x4f6d99 },
};

const PLATFORM_TILES: number[] = [TILE_INDEX.wood, TILE_INDEX.cloud, TILE_INDEX.dock];

interface NpcEntity {
  def: NpcDef;
  sprite: Phaser.GameObjects.Sprite;
  marker: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
}

interface PickupEntity {
  spec: PickupSpec;
  sprite: Phaser.Physics.Arcade.Image;
  glow?: Phaser.GameObjects.Image;
}

/** One side-scrolling chapter with realistic multi-layer parallax, volumetric sun shafts, water caustics, contact shadows, and smooth camera physics. */
export class ChapterScene extends Phaser.Scene {
  private store!: GameStore;
  private level!: LevelSpec;
  private player!: Player;
  private playerShadow!: Phaser.GameObjects.Image;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private keys!: PlayerKeys & Record<'interact' | 'eat' | 'bag' | 'pause' | 'cycle', Phaser.Input.Keyboard.Key>;
  private npcs: NpcEntity[] = [];
  private pickups: PickupEntity[] = [];
  private prompt!: Phaser.GameObjects.Text;
  private clouds?: Phaser.GameObjects.TileSprite;
  private farBg?: Phaser.GameObjects.TileSprite;
  private midBg?: Phaser.GameObjects.TileSprite;
  private water?: Phaser.GameObjects.TileSprite;
  private waterOverlay?: Phaser.GameObjects.TileSprite;
  private exitX = 0;
  private exitY = 0;
  private exitSprite?: Phaser.GameObjects.Image;
  private boulder?: Phaser.GameObjects.Image;
  private caveLight?: Phaser.GameObjects.Image;
  private exitOpenShown = false;
  private unsub?: () => void;
  private prev!: SurvivalState;
  private wasPaused = true;
  private inputCooldownUntil = 0;
  private tickAccum = 0;
  private lastSafe = { x: 0, y: 0 };
  private hazardLock = false;
  private dying = false;
  private departing = false;
  private camLookOffset = 0;
  private pendingFeedback: (() => void)[] = [];

  constructor() {
    super('Chapter');
  }

  create() {
    this.store = this.registry.get('store') as GameStore;
    this.npcs = [];
    this.pickups = [];
    this.pendingFeedback = [];
    this.exitOpenShown = false;
    this.dying = false;
    this.departing = false;
    this.hazardLock = false;
    this.wasPaused = true;
    this.tickAccum = 0;
    this.camLookOffset = 0;
    const state = this.store.state;
    this.prev = state;
    this.level = getLevel(state.currentChapter);
    const W = this.level.width * TILE;
    const tiles = THEME_TILES[this.level.theme];

    this.physics.world.setBounds(0, 0, W, WORLD_HEIGHT + 600);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, W, WORLD_HEIGHT).setBackgroundColor(tiles.bg).setRoundPixels(false);

    this.buildBackground();
    this.buildTerrain(tiles);
    this.buildProps();
    this.buildWater();
    this.buildExit();
    this.buildPickups();
    this.buildNpcs();

    const spawn = this.spawnPoint();
    this.player = new Player(this, spawn.x, spawn.y);
    this.playerShadow = this.add.image(spawn.x, spawn.y + 1, 'contact-shadow').setDepth(9).setAlpha(0.75);
    this.lastSafe = spawn;
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.overlap(
      this.player,
      this.pickups.map((p) => p.sprite),
      (_pl, obj) => this.collect(obj as Phaser.Physics.Arcade.Image),
    );

    this.cameras.main.startFollow(this.player, false, 0.09, 0.12);
    this.cameras.main.setDeadzone(70, 56);
    this.cameras.main.fadeIn(450, 0, 0, 0);

    this.buildWeather();
    this.prompt = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '10px', color: '#fff6d6', stroke: '#1a1208', strokeThickness: 4, align: 'center' })
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setVisible(false);

    const kb = this.input.keyboard!;
    const k = (code: number) => kb.addKey(code, false);
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: [k(KC.A), k(KC.LEFT)],
      right: [k(KC.D), k(KC.RIGHT)],
      jump: [k(KC.SPACE), k(KC.W), k(KC.UP)],
      interact: k(KC.E),
      eat: k(KC.F),
      bag: k(KC.I),
      pause: k(KC.ESC),
      cycle: k(KC.Q),
    };

    this.refreshNpcMarkers();
    if (isExitUnlocked(state)) this.openExit(false);

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.respawnPickups() });
    this.unsub = this.store.subscribe(() => this.onStoreChange());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub?.());
  }

  // ── World construction ─────────────────────────────────────

  private spawnPoint() {
    return { x: this.level.spawnCol * TILE + TILE / 2, y: standY(this.level, this.level.spawnCol) };
  }

  private buildBackground() {
    const t = this.level.theme;
    // Layer 0: Atmospheric sky dome + sun/moon
    this.add.image(0, 0, `bg-${t}-sky`).setOrigin(0).setScrollFactor(0).setDepth(0);
    // Layer 1: Dynamic drifting volumetric clouds
    this.clouds = this.add.tileSprite(0, 6, 960, 280, `bg-${t}-clouds`).setOrigin(0).setScrollFactor(0).setDepth(0.5).setAlpha(0.9);
    // Layer 2: Volumetric sunlight shafts (additive pulsing)
    const rays = this.add
      .image(0, 0, `bg-${t}-rays`)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.72);
    this.tweens.add({ targets: rays, alpha: 0.44, duration: 3600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // Layer 3 & 4: Parallax coastal cliffs & ancient marble ruins
    this.farBg = this.add.tileSprite(0, 0, 960, 540, `bg-${t}-far`).setOrigin(0).setScrollFactor(0).setDepth(1.5);
    this.midBg = this.add.tileSprite(0, 0, 960, 540, `bg-${t}-mid`).setOrigin(0).setScrollFactor(0).setDepth(2);
  }

  private buildTerrain(tiles: ThemeTiles) {
    const L = this.level;
    const data: number[][] = Array.from({ length: ROWS }, () => new Array(L.width).fill(-1));
    for (const seg of L.ground) {
      const surface = ROWS - seg.h;
      for (let c = seg.from; c <= seg.to; c++) {
        data[surface][c] = seg.alt ? tiles.altTop : tiles.top;
        const depth = tiles.floating ? Math.min(ROWS - 1, surface + 3) : ROWS - 1;
        for (let r = surface + 1; r <= depth; r++) data[r][c] = seg.alt ? tiles.altFill : tiles.fill;
      }
    }
    for (const ceil of L.ceiling ?? []) for (let c = ceil.from; c <= ceil.to; c++) for (let r = 0; r < ceil.h; r++) data[r][c] = TILE_INDEX.ceiling;
    for (const pl of L.platforms) {
      const tile = pl.len >= 5 ? TILE_INDEX.dock : tiles.platform;
      for (let c = pl.col; c < pl.col + pl.len; c++) if (data[pl.row][c] === -1) data[pl.row][c] = tile;
    }

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    this.layer = map.createLayer(0, tileset, 0, 0)!;
    this.layer.setDepth(6);
    this.layer.setCollisionByExclusion([-1]);
    // Platforms are one-way: land on them from above, jump through from below.
    this.layer.forEachTile((tile) => {
      if (PLATFORM_TILES.includes(tile.index)) tile.setCollision(false, false, true, false);
    });
  }

  private buildProps() {
    for (const pr of this.level.props) {
      const x = pr.col * TILE + TILE / 2;
      const y = standY(this.level, pr.col, pr.row) + 3;
      this.add.image(x, y - 1, 'contact-shadow').setDepth(4.5).setScale(1.1, 0.7).setAlpha(0.45);
      const img = this.add.image(x, y, `prop-${pr.kind}`).setOrigin(0.5, 1).setDepth(5).setFlipX(!!pr.flip);
      if (pr.kind === 'torch') {
        this.add.sprite(x, img.y - 34, 'flame').setOrigin(0.5, 1).setDepth(5).play('flame');
        const glow = this.add.image(x, img.y - 40, 'glow').setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setScale(2.3).setAlpha(0.55);
        this.tweens.add({ targets: glow, alpha: 0.3, scale: 2.0, duration: 180 + Math.random() * 120, yoyo: true, repeat: -1 });
      }
      if (pr.kind === 'crystal') {
        this.add.image(x, img.y - 14, 'glow').setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setTint(0x4fc3d6).setScale(1.5).setAlpha(0.55);
      }
    }
  }

  private buildWater() {
    if (this.level.hazard !== 'water') return;
    const W = this.level.width * TILE;
    this.water = this.add
      .tileSprite(0, WATER_Y, W, WORLD_HEIGHT - WATER_Y + 48, `water-${this.level.theme}`)
      .setOrigin(0)
      .setDepth(4)
      .setAlpha(0.95);
    this.waterOverlay = this.add
      .tileSprite(0, WATER_Y + 12, W, WORLD_HEIGHT - WATER_Y + 40, `water-${this.level.theme}`)
      .setOrigin(0)
      .setDepth(12)
      .setAlpha(0.28)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  private buildExit() {
    const ex = this.level.exit;
    this.exitX = ex.col * TILE + TILE / 2;
    if (ex.kind === 'ship' || ex.kind === 'windship') {
      this.exitY = ex.kind === 'ship' ? WATER_Y + 18 : standY(this.level, ex.col) - 6;
      this.exitSprite = this.add.image(this.exitX, this.exitY, ex.kind).setOrigin(0.5, 1).setDepth(5).setTint(0x9ca5b0);
      this.tweens.add({ targets: this.exitSprite, y: this.exitY + 3, angle: 1.2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (ex.kind === 'cave') {
      this.exitY = standY(this.level, ex.col);
      this.caveLight = this.add.image(this.exitX + 12, this.exitY, 'cave-light').setOrigin(0.5, 1).setDepth(5).setAlpha(0.15);
      this.boulder = this.add.image(this.exitX, this.exitY + 2, 'boulder').setOrigin(0.5, 1).setDepth(7);
    } else {
      this.exitY = standY(this.level, ex.col);
    }
  }

  private buildPickups() {
    const s = this.store.state;
    for (const spec of this.level.pickups) {
      const x = spec.col * TILE + TILE / 2;
      const y = standY(this.level, spec.col, spec.row) - 16;
      const sprite = this.physics.add.image(x, y, `item-${spec.item}`).setDepth(11);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false).setImmovable(true);
      body.setSize(28, 28);
      sprite.setData('pickupId', spec.id);
      this.tweens.add({ targets: sprite, y: y - 5, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      let glow: Phaser.GameObjects.Image | undefined;
      if (spec.item === 'ambrosia') {
        glow = this.add.image(x, y, 'glow').setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setScale(1.2);
        this.tweens.add({ targets: glow, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
      }
      const entity: PickupEntity = { spec, sprite, glow };
      this.setPickupVisible(entity, isPickupAvailable(s, spec.id, spec.renewable));
      this.pickups.push(entity);
    }
  }

  private setPickupVisible(p: PickupEntity, visible: boolean) {
    p.sprite.setVisible(visible);
    (p.sprite.body as Phaser.Physics.Arcade.Body).enable = visible;
    p.glow?.setVisible(visible);
  }

  private buildNpcs() {
    for (const n of this.level.npcs) {
      const def = NPC_BY_QUESTION[n.questionId];
      const x = n.col * TILE + TILE / 2;
      const y = standY(this.level, n.col);
      this.add.image(x, y + 1, 'contact-shadow').setDepth(9).setAlpha(0.7);
      const sprite = this.add.sprite(x, y, `npc-${def.key}`, 0).setOrigin(0.5, 1).setDepth(10).play(`npc-${def.key}-idle`);
      const label = this.add
        .text(x, y - 52, def.name, { fontFamily: FONT, fontSize: '8px', color: '#f0e2bf', stroke: '#1a1208', strokeThickness: 3 })
        .setOrigin(0.5, 1)
        .setDepth(25);
      const marker = this.add
        .text(x, y - 64, '!', { fontFamily: FONT, fontSize: '12px', color: '#ffd166', stroke: '#1a1208', strokeThickness: 4 })
        .setOrigin(0.5, 1)
        .setDepth(25);
      this.tweens.add({ targets: marker, y: y - 69, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.npcs.push({ def, sprite, label, marker });
    }
  }

  private buildWeather() {
    const t = this.level.theme;
    // Ambient floating dust motes / sea-spray shimmer across sunlit coastal chapters
    if (t === 'lotus' || t === 'ithaca') {
      this.add
        .particles(0, 0, 'fx-mote', {
          x: { min: 0, max: 980 },
          y: { min: 40, max: 460 },
          lifespan: 6500,
          speedY: { min: -12, max: 10 },
          speedX: { min: -18, max: 14 },
          scale: { start: 0.3, end: 0.9 },
          alpha: { start: 0.65, end: 0 },
          frequency: 260,
          blendMode: 'ADD',
        })
        .setScrollFactor(0)
        .setDepth(29);
    }

    if (t === 'lotus') {
      this.add
        .particles(0, 0, 'fx-petal', {
          x: { min: 0, max: 980 },
          y: -10,
          lifespan: 11000,
          speedY: { min: 18, max: 36 },
          speedX: { min: -25, max: 15 },
          rotate: { min: 0, max: 360 },
          alpha: { start: 0.9, end: 0.1 },
          frequency: 420,
        })
        .setScrollFactor(0)
        .setDepth(30);
    } else if (t === 'cyclops') {
      this.add
        .particles(0, 0, 'fx-ember', {
          x: { min: 0, max: 960 },
          y: 560,
          lifespan: 6000,
          speedY: { min: -55, max: -25 },
          speedX: { min: -12, max: 12 },
          alpha: { start: 0.9, end: 0 },
          frequency: 220,
          blendMode: 'ADD',
        })
        .setScrollFactor(0)
        .setDepth(30);
    } else if (t === 'aeolus') {
      this.add
        .particles(0, 0, 'fx-wind', {
          x: 990,
          y: { min: 20, max: 520 },
          lifespan: 2600,
          speedX: { min: -520, max: -320 },
          alpha: { start: 0.5, end: 0 },
          scaleX: { min: 0.6, max: 1.6 },
          frequency: 140,
        })
        .setScrollFactor(0)
        .setDepth(30);
    } else if (t === 'sirens') {
      // Luminous sea mist & drifting teal spray motes
      this.add
        .particles(0, 0, 'fx-mote', {
          x: { min: 0, max: 980 },
          y: { min: 320, max: 530 },
          lifespan: 5200,
          speedY: { min: -22, max: -6 },
          speedX: { min: -30, max: 20 },
          tint: 0x8be2f0,
          scale: { start: 0.4, end: 1.2 },
          alpha: { start: 0.55, end: 0 },
          frequency: 160,
          blendMode: 'ADD',
        })
        .setScrollFactor(0)
        .setDepth(30);
    } else if (t === 'passage') {
      this.add
        .particles(0, 0, 'fx-rain', {
          x: { min: -40, max: 1100 },
          y: -20,
          lifespan: 1300,
          speedY: { min: 520, max: 640 },
          speedX: { min: -140, max: -100 },
          alpha: { start: 0.62, end: 0.2 },
          frequency: 16,
        })
        .setScrollFactor(0)
        .setDepth(30);
      const strike = () => {
        if (!this.store.worldPaused) this.cameras.main.flash(140, 200, 220, 255);
        this.time.delayedCall(6000 + Math.random() * 6000, strike);
      };
      this.time.delayedCall(4000, strike);
    } else {
      // Ithaca: warm sunlit sea spray near the harbor waterline
      this.add
        .particles(0, 0, 'fx-mote', {
          x: { min: 0, max: 980 },
          y: { min: 430, max: 510 },
          lifespan: 2800,
          speedY: { min: -28, max: -10 },
          speedX: { min: -20, max: 20 },
          tint: 0xffe4a8,
          scale: { start: 0.3, end: 0.7 },
          alpha: { start: 0.7, end: 0 },
          frequency: 220,
          blendMode: 'ADD',
        })
        .setScrollFactor(0)
        .setDepth(30);
    }
  }

  // ── Store reactions ────────────────────────────────────────

  private onStoreChange() {
    const s = this.store.state;
    const prev = this.prev;
    if (s === prev) return;
    this.prev = s;
    if (!this.player || !this.scene.isActive()) return;

    if (s.runId !== prev.runId || s.currentChapter !== prev.currentChapter) return;

    const hpLost = prev.health - s.health;
    const hungerLost = prev.hunger - s.hunger;
    if (hpLost > 0) {
      sfx.damage();
      this.feedback(() => {
        this.player.hurt(this.time.now);
        this.cameras.main.shake(hpLost >= 10 ? 260 : 120, hpLost >= 10 ? 0.012 : 0.005);
        this.floatText(`-${hpLost} HP`, '#ff6b5a', 0);
      });
    }
    if (hungerLost > 1) this.feedback(() => this.floatText(`-${hungerLost} Hunger`, '#ffb347', 18));
    if (s.health > prev.health) this.feedback(() => this.floatText(`+${s.health - prev.health} HP`, '#7ee08a', 0));
    if (s.hunger > prev.hunger) this.feedback(() => this.floatText(`+${s.hunger - prev.hunger} Hunger`, '#ffe08a', 0));
    if (s.foodConsumed > prev.foodConsumed) sfx.eat();

    if (s.respawnToken !== prev.respawnToken && s.status === 'playing') this.respawnAtStart();
    if (s.answered !== prev.answered || s.completedChapters !== prev.completedChapters) this.refreshNpcMarkers();
    if (s.status === 'dead' && prev.status !== 'dead') this.startDeath();
  }

  private feedback(fn: () => void) {
    if (this.store.worldPaused && !this.dying) this.pendingFeedback.push(fn);
    else fn();
  }

  private floatText(text: string, color: string, offset: number) {
    const t = this.add
      .text(this.player.x, this.player.y - 56 - offset, text, { fontFamily: FONT, fontSize: '10px', color, stroke: '#1a1208', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(45);
    this.tweens.add({ targets: t, y: t.y - 36, alpha: 0, duration: 1400, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  private refreshNpcMarkers() {
    const s = this.store.state;
    for (const n of this.npcs) {
      const st = npcStatus(s, n.def.questionId);
      n.marker.setText(st === 'done' ? '✓' : st === 'next' ? '!' : '…');
      n.marker.setColor(st === 'done' ? '#7ee08a' : st === 'next' ? '#ffd166' : '#9aa3ad');
      n.sprite.setAlpha(st === 'locked' ? 0.85 : 1);
    }
  }

  private respawnAtStart() {
    const sp = this.spawnPoint();
    this.player.arcade.reset(sp.x, sp.y);
    this.lastSafe = sp;
    this.cameras.main.flash(250, 120, 20, 20);
  }

  private startDeath() {
    if (this.dying) return;
    this.dying = true;
    this.store.setUI({ overlay: 'none', npc: null, cinematic: 'dying' });
    this.prompt.setVisible(false);
    sfx.death();
    this.player.thaw();
    this.cameras.main.shake(400, 0.01);
    this.player.die(() => {
      this.cameras.main.fadeOut(1000, 70, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.store.setUI({ screen: 'gameover', cinematic: 'none' });
      });
    });
  }

  private openExit(animate: boolean) {
    if (this.exitOpenShown) return;
    this.exitOpenShown = true;
    const kind = this.level.exit.kind;
    if (kind === 'ship' || kind === 'windship') {
      this.exitSprite?.clearTint();
      const glow = this.add.image(this.exitX, this.exitY - 60, 'glow').setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setScale(3.2).setAlpha(0);
      this.tweens.add({ targets: glow, alpha: 0.48, duration: 800, yoyo: true, repeat: -1 });
      if (kind === 'windship') {
        this.add
          .particles(this.exitX - 60, this.exitY - 90, 'fx-wind', {
            lifespan: 900,
            speedX: { min: 160, max: 260 },
            y: { min: -30, max: 30 },
            alpha: { start: 0.6, end: 0 },
            frequency: 120,
          })
          .setDepth(6);
      }
    } else if (kind === 'cave' && this.boulder && this.caveLight) {
      if (animate) {
        this.cameras.main.shake(700, 0.006);
        this.tweens.add({ targets: this.boulder, x: this.exitX + 90, angle: 200, duration: 1600, ease: 'Cubic.easeOut' });
      } else {
        this.boulder.setPosition(this.exitX + 90, this.boulder.y).setAngle(200);
      }
      this.tweens.add({ targets: this.caveLight, alpha: 0.95, duration: animate ? 1600 : 1 });
    }
    if (animate) {
      this.add
        .particles(this.exitX, this.exitY - 40, 'fx-spark', {
          lifespan: 900,
          speed: { min: 40, max: 120 },
          alpha: { start: 1, end: 0 },
          quantity: 24,
          emitting: false,
        })
        .setDepth(41)
        .explode(24);
    }
  }

  // ── Interaction ────────────────────────────────────────────

  private collect(sprite: Phaser.Physics.Arcade.Image) {
    if (this.store.worldPaused || !sprite.visible) return;
    const entity = this.pickups.find((p) => p.sprite === sprite);
    if (!entity) return;
    const before = this.store.state;
    this.store.dispatch({ type: 'PICKUP', pickupId: entity.spec.id, item: entity.spec.item, renewable: entity.spec.renewable });
    if (this.store.state.pickedUp[entity.spec.id] !== before.pickedUp[entity.spec.id]) {
      this.setPickupVisible(entity, false);
      sfx.pickup();
      const t = this.add
        .text(sprite.x, sprite.y - 10, `+1 ${ITEMS[entity.spec.item].name}`, { fontFamily: FONT, fontSize: '8px', color: '#ffe08a', stroke: '#1a1208', strokeThickness: 3 })
        .setOrigin(0.5)
        .setDepth(45);
      this.tweens.add({ targets: t, y: t.y - 28, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
    }
  }

  private respawnPickups() {
    const s = this.store.state;
    for (const p of this.pickups) {
      if (p.sprite.visible || !p.spec.renewable) continue;
      if (isPickupAvailable(s, p.spec.id, true)) {
        this.setPickupVisible(p, true);
        p.sprite.setScale(0.2);
        this.tweens.add({ targets: p.sprite, scale: 1, duration: 300, ease: 'Back.easeOut' });
      }
    }
  }

  private nearestNpc(): NpcEntity | null {
    let best: NpcEntity | null = null;
    let bestD = INTERACT_RADIUS;
    for (const n of this.npcs) {
      const dx = Math.abs(n.sprite.x - this.player.x);
      const dy = Math.abs(n.sprite.y - this.player.y);
      if (dx <= bestD && dy < 70) {
        best = n;
        bestD = dx;
      }
    }
    return best;
  }

  private nearExit(): boolean {
    if (this.level.exit.kind === 'temple') return false;
    return Math.abs(this.player.x - this.exitX) < EXIT_RADIUS && Math.abs(this.player.y - this.exitY) < 140;
  }

  private tryExit() {
    const s = this.store.state;
    if (!isExitUnlocked(s)) {
      this.store.dispatch({ type: 'NOTICE', text: 'The way is sealed. Solve all three challenges in a row first.', tone: 'bad' });
      sfx.invalid();
      return;
    }
    this.departing = true;
    this.store.setUI({ cinematic: 'departing' });
    this.prompt.setVisible(false);
    this.player.thaw();
    this.player.anims.play('hero-walk', true);
    const kind = this.level.exit.kind;
    const next = s.currentChapter + 1;
    this.tweens.add({
      targets: this.player,
      x: this.exitX,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        if (this.exitSprite) this.tweens.add({ targets: this.exitSprite, x: this.exitX + 520, duration: 2200, ease: 'Sine.easeIn' });
        this.cameras.main.fadeOut(kind === 'cave' ? 900 : 2000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.store.dispatch({ type: 'ENTER_CHAPTER', chapterId: next });
          this.store.setUI({ cinematic: 'none', overlay: 'intro' });
        });
      },
    });
  }

  private solidUnder(x: number): boolean {
    const t = this.layer.getTileAtWorldXY(x, this.player.y + 8);
    return !!t && t.collides;
  }

  private hazard() {
    if (this.hazardLock) return;
    this.hazardLock = true;
    const reason = this.level.hazard === 'water' ? 'You fell into the water' : 'You fell from the clouds';
    if (this.level.hazard === 'water') {
      this.add
        .particles(this.player.x, WATER_Y + 4, 'fx-splash', {
          lifespan: 600,
          speedY: { min: -220, max: -120 },
          speedX: { min: -80, max: 80 },
          gravityY: 600,
          quantity: 16,
          emitting: false,
        })
        .setDepth(41)
        .explode(16);
    }
    this.store.dispatch({ type: 'ENVIRONMENT_DAMAGE', amount: 5, reason });
    if (this.store.state.status !== 'playing') return;
    this.player.arcade.reset(this.lastSafe.x, this.lastSafe.y);
    this.cameras.main.flash(200, 30, 60, 90);
    this.time.delayedCall(400, () => (this.hazardLock = false));
  }

  // ── Main loop ──────────────────────────────────────────────

  update(time: number, delta: number) {
    // Animate sky clouds, shimmering water reflections, and parallax depth continuously
    if (this.clouds) this.clouds.tilePositionX += delta * 0.011;
    if (this.water) this.water.tilePositionX += delta * 0.028;
    if (this.waterOverlay) this.waterOverlay.tilePositionX -= delta * 0.018;
    const camX = this.cameras.main.scrollX;
    if (this.farBg) this.farBg.tilePositionX = camX * 0.22;
    if (this.midBg) this.midBg.tilePositionX = camX * 0.48;

    const paused = this.store.worldPaused || this.dying || this.departing;

    if (paused !== this.wasPaused) {
      this.wasPaused = paused;
      if (paused) {
        this.physics.world.pause();
        if (!this.dying && !this.departing) this.player.freeze();
        this.prompt.setVisible(false);
      } else {
        this.physics.world.resume();
        this.player.thaw();
        this.input.keyboard?.resetKeys();
        this.inputCooldownUntil = time + 180;
        const queued = this.pendingFeedback.splice(0);
        queued.forEach((fn, i) => this.time.delayedCall(120 + i * 220, fn));
        if (isExitUnlocked(this.store.state) && !this.exitOpenShown) this.openExit(true);
      }
    }
    if (paused) return;

    this.player.update(time, delta, this.keys);
    for (const n of this.npcs) n.sprite.setFlipX(this.player.x < n.sprite.x);

    // Smooth look-ahead camera offset based on player velocity
    const targetLook = Phaser.Math.Clamp(this.player.arcade.velocity.x * 0.28, -56, 56);
    this.camLookOffset = Phaser.Math.Linear(this.camLookOffset, targetLook, 0.05);
    this.cameras.main.setFollowOffset(-this.camLookOffset, 18);

    // Grounded contact shadow beneath player
    if (this.playerShadow) {
      this.playerShadow.setPosition(this.player.x, this.player.y + 1);
      this.playerShadow.setVisible(this.player.onGround);
    }

    // Hazards and checkpoints.
    const body = this.player.arcade;
    if ((this.level.hazard === 'water' && body.bottom > WATER_Y + 18) || body.top > WORLD_HEIGHT + 20) this.hazard();
    else if (this.player.onGround && !this.hazardLock && this.solidUnder(this.player.x - 44) && this.solidUnder(this.player.x + 44)) {
      this.lastSafe = { x: this.player.x, y: this.player.y };
    }

    // Survival clock (only while actively exploring).
    this.tickAccum += Math.min(delta, 100);
    if (this.tickAccum >= 1000) {
      this.store.dispatch({ type: 'TICK', ms: this.tickAccum });
      this.tickAccum = 0;
      if (this.store.worldPaused) return;
    }

    // Prompts.
    const npc = this.nearestNpc();
    const atExit = !npc && this.nearExit();
    if (npc) {
      this.prompt.setText(`[E] Talk to ${npc.def.name}`).setPosition(npc.sprite.x, npc.sprite.y - 80).setVisible(true);
    } else if (atExit) {
      const open = isExitUnlocked(this.store.state);
      const verb = this.level.exit.kind === 'cave' ? 'Escape the cave' : 'Board the ship';
      this.prompt
        .setText(open ? `[E] ${verb}` : 'Sealed: solve all 3 challenges')
        .setColor(open ? '#fff6d6' : '#ffb4a8')
        .setPosition(this.exitX, this.exitY - (this.level.exit.kind === 'cave' ? 80 : 120))
        .setVisible(true);
    } else {
      this.prompt.setVisible(false).setColor('#fff6d6');
    }
    if (this.prompt.visible) {
      const cam = this.cameras.main;
      const half = this.prompt.width / 2 + 6;
      this.prompt.x = Phaser.Math.Clamp(this.prompt.x, cam.scrollX + half, cam.scrollX + cam.width - half);
    }

    if (time < this.inputCooldownUntil) return;
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(this.keys.interact)) {
      if (npc) {
        sfx.talk();
        this.store.setUI({ overlay: 'dialogue', npc: npc.def.questionId });
      } else if (atExit) {
        this.tryExit();
      }
    } else if (JD(this.keys.eat)) {
      this.store.dispatch({ type: 'CONSUME' });
    } else if (JD(this.keys.cycle)) {
      this.store.dispatch({ type: 'CYCLE_ITEM', dir: 1 });
    } else if (JD(this.keys.bag)) {
      this.store.setUI({ overlay: 'inventory' });
    } else if (JD(this.keys.pause)) {
      this.store.setUI({ overlay: 'pause' });
    }
  }
}
