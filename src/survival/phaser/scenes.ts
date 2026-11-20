import Phaser from 'phaser';
import { registerTextures } from './textures';

/** Generates all textures, waits for fonts, then hands control to the router. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    registerTextures(this);
    const fonts = typeof document !== 'undefined' && document.fonts ? document.fonts : null;
    const ready = () => this.game.events.emit('odyssey-ready');
    if (fonts) {
      Promise.all([fonts.load('10px "Press Start 2P"'), fonts.load('20px "VT323"'), fonts.load('700 24px "Cinzel"')])
        .catch(() => undefined)
        .finally(ready);
    } else {
      ready();
    }
  }
}

/** Animated realistic Mediterranean title backdrop: golden-hour cliffs, clouds, sun shafts, sailing trireme & shimmering sea. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0e2444);
    this.add.image(0, 0, 'bg-menu-sky').setOrigin(0);
    const clouds = this.add.tileSprite(0, 12, 960, 280, 'bg-menu-clouds').setOrigin(0).setAlpha(0.92);
    const rays = this.add.image(0, 0, 'bg-menu-rays').setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.75);
    this.tweens.add({ targets: rays, alpha: 0.48, duration: 3800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const far = this.add.tileSprite(0, 0, 960, 540, 'bg-menu-far').setOrigin(0);
    const mid = this.add.tileSprite(0, 0, 960, 540, 'bg-menu-mid').setOrigin(0);

    const waterBack = this.add.tileSprite(0, 444, 960, 96, 'water-menu').setOrigin(0).setAlpha(0.92);
    const ship = this.add.image(-160, 466, 'ship').setOrigin(0.5, 1).setScale(1.1);
    this.tweens.add({ targets: ship, x: 1120, duration: 42000, repeat: -1 });
    this.tweens.add({ targets: ship, angle: { from: -1.8, to: 1.8 }, y: 470, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const waterFront = this.add.tileSprite(0, 488, 960, 56, 'water-menu').setOrigin(0).setAlpha(0.82);

    this.add
      .particles(0, 0, 'fx-mote', {
        x: { min: 0, max: 960 },
        y: { min: 40, max: 360 },
        lifespan: 4200,
        speedX: { min: -14, max: 14 },
        speedY: { min: -10, max: 8 },
        alpha: { start: 0, end: 0.65 },
        scale: { start: 0.35, end: 0.9 },
        frequency: 260,
        blendMode: 'ADD',
      })
      .setDepth(5);

    this.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, d: number) => {
      clouds.tilePositionX += d * 0.009;
      far.tilePositionX += d * 0.005;
      mid.tilePositionX += d * 0.013;
      waterBack.tilePositionX += d * 0.025;
      waterFront.tilePositionX += d * 0.042;
    });
    this.cameras.main.fadeIn(600);
  }
}

/** Backdrop for the death and victory screens. */
export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create(data: { kind: 'victory' | 'death' }) {
    const victory = data.kind === 'victory';
    this.add.image(0, 0, victory ? 'end-victory' : 'end-death').setOrigin(0);
    if (victory) {
      const ship = this.add.image(-120, 460, 'ship').setOrigin(0.5, 1).setScale(1.0);
      this.tweens.add({ targets: ship, x: 450, duration: 5500, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: ship, angle: { from: -1.4, to: 1.4 }, duration: 1800, yoyo: true, repeat: -1 });
      const hero = this.add.sprite(560, 412, 'hero', 0).setOrigin(0.5, 1).setScale(1.5).setAlpha(0);
      hero.play('hero-idle');
      this.tweens.add({ targets: hero, alpha: 1, delay: 4500, duration: 900 });
      this.add
        .particles(0, 0, 'fx-mote', {
          x: { min: 0, max: 960 },
          y: { min: 0, max: 340 },
          lifespan: 3000,
          alpha: { start: 0.85, end: 0 },
          frequency: 150,
          blendMode: 'ADD',
        })
        .setDepth(5);
    } else {
      const hero = this.add.sprite(480, 420, 'hero', 8).setOrigin(0.5, 1).setScale(1.5).setAngle(-90).setTint(0x8a3030);
      this.tweens.add({ targets: hero, alpha: { from: 1, to: 0.6 }, duration: 1600, yoyo: true, repeat: -1 });
      this.add
        .particles(0, 0, 'fx-rain', {
          x: { min: 0, max: 1000 },
          y: -10,
          lifespan: 1200,
          speedY: 560,
          speedX: -90,
          alpha: 0.5,
          frequency: 16,
        })
        .setDepth(5);
    }
    this.cameras.main.fadeIn(900);
  }
}
