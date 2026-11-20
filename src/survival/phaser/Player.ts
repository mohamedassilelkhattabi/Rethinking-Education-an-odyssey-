import Phaser from 'phaser';
import { sfx } from '../../game/sound';

export const MOVE_SPEED = 210;
export const JUMP_VELOCITY = -390;
const COYOTE_MS = 100;
const JUMP_BUFFER_MS = 120;

export interface PlayerKeys {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
}

/** Odysseus: arcade-physics platformer controller with coyote time, jump buffering and variable jump height. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private coyoteUntil = 0;
  private jumpBufferedUntil = 0;
  private jumpCut = false;
  private stepTimer = 0;
  private hurtUntil = 0;
  dead = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 42);
    body.setOffset(8, 6);
    body.setMaxVelocityY(720);
    this.setDepth(20);
    this.play('hero-idle');
  }

  get arcade(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get onGround(): boolean {
    return this.arcade.blocked.down || this.arcade.touching.down;
  }

  freeze() {
    this.arcade.setVelocity(0, 0);
    this.anims.pause();
  }

  thaw() {
    if (this.anims.isPaused) this.anims.resume();
  }

  update(time: number, delta: number, keys: PlayerKeys) {
    if (this.dead) return;
    const down = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => k.isDown);
    const pressed = keys.jump.some((k) => Phaser.Input.Keyboard.JustDown(k));
    const left = down(keys.left);
    const right = down(keys.right);

    if (this.onGround) {
      this.coyoteUntil = time + COYOTE_MS;
      this.jumpCut = false;
    }
    if (pressed) this.jumpBufferedUntil = time + JUMP_BUFFER_MS;

    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    this.arcade.setVelocityX(dir * MOVE_SPEED);
    if (dir !== 0) this.setFlipX(dir < 0);

    if (this.jumpBufferedUntil > time && this.coyoteUntil > time) {
      this.arcade.setVelocityY(JUMP_VELOCITY);
      this.jumpBufferedUntil = 0;
      this.coyoteUntil = 0;
      sfx.jump();
    }
    // Releasing jump early cuts the arc short for finer control.
    if (!down(keys.jump) && this.arcade.velocity.y < -150 && !this.jumpCut) {
      this.arcade.setVelocityY(this.arcade.velocity.y * 0.5);
      this.jumpCut = true;
    }

    // Animation state.
    if (time < this.hurtUntil) {
      this.anims.play('hero-hurt', true);
    } else if (!this.onGround) {
      this.anims.play(this.arcade.velocity.y < 0 ? 'hero-jump' : 'hero-fall', true);
    } else if (dir !== 0) {
      this.anims.play('hero-walk', true);
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        sfx.step();
        this.stepTimer = 280;
      }
    } else {
      this.anims.play('hero-idle', true);
    }
  }

  /** Flash red and recoil (damage feedback). */
  hurt(time: number) {
    this.hurtUntil = time + 450;
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.35, to: 1 },
      duration: 90,
      repeat: 4,
      onStart: () => this.setTint(0xff6b5a),
      onComplete: () => this.clearTint(),
    });
  }

  /** Death animation: stagger, topple and fade. */
  die(onDone: () => void) {
    this.dead = true;
    this.arcade.setVelocity(0, 0);
    this.arcade.setAllowGravity(false);
    this.anims.play('hero-hurt');
    this.setTint(0xc64f4f);
    this.scene.tweens.add({
      targets: this,
      angle: this.flipX ? 90 : -90,
      y: this.y - 4,
      duration: 650,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: this, alpha: 0.25, duration: 900, onComplete: onDone });
      },
    });
  }
}
