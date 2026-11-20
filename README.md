# ODYSSEY: THE PATH TO ITHACA

*Survive the Journey. Outsmart the Gods. Find Your Way Home.*

A 2D pixel-art survival platformer about Homer's *Odyssey* where the challenges teach computer basics and Python. Explore four side-scrolling islands as Odysseus, find the NPCs, and solve their challenges **three in a row**. Wrong answers cost health and hunger, and if health reaches zero the whole journey restarts (permadeath).

Built with **Phaser 3** (world, physics, pixel art) plus **React + TypeScript + Tailwind** (HUD, dialogue and puzzle overlays), on **Vite**. Every sprite, tile, background and sound is generated in code, so there are no external assets, network calls or API keys.

## Run

Requires Node 20.19+ (tested on Node 24). From this folder:

```bash
npm install
npm run dev -- --host 0.0.0.0   # http://localhost:5173
npm test                        # 96 unit tests (Vitest)
npm run build                   # typecheck + production build to dist/
```

## Controls

| Key | Action |
|---|---|
| A / D or ← / → | Move |
| Space / W / ↑ | Jump (hold for higher; coyote time and jump buffering) |
| E | Talk to NPCs, use exits |
| F | Eat the selected food |
| Q | Select next food |
| I | Inventory |
| Esc | Pause / close |
| Mouse | Answer challenges |

## Rules

- **Chapters:** Lotus-Eaters (Easy: RAM, CPU, hardware/software), Cyclops (Medium: Python variables, types, conditionals), Aeolus (Medium: lists, loops, functions), Final Passage (Hard: short Python debugging based on earlier lessons). Each has 3 NPCs you must help **in order**.
- **Three in a row:** solving all three consecutively opens the exit (ship, cave mouth, wind-ship). XP is temporary until then.
- **Wrong answer:** −10 / −15 / −20 / −25 health **and** hunger (by chapter). The streak resets to 0/3, temporary XP is discarded, and you're sent back to the chapter start. Inventory and earlier chapters are kept. The explanation teaches the principle without revealing the answer.
- **Hunger** drains 1 point per 15 s of active play (never while paused or in dialogue). At 0 you starve: −3 health every 5 s.
- **Food:** apple +15, fish +25, bread +30 hunger; ambrosia +25 health. Renewable food respawns after 45 s; ambrosia does not respawn.
- **Falling** into the sea or off a cloud island costs 5 health and respawns you at the last safe ground.
- **Permadeath:** at 0 health the save is wiped and a new odyssey starts from Chapter I with 100/100, 0 XP and the starting pack.
- **XP:** 100 per answer (50 with a hint), up to 1,200.

## Demo Mode

From the main menu, choose **Demo mode** for a presenter build with isolated, unsaved state. It can jump to any chapter, refill stats, show the death sequence or show the victory. Validation stays real, and the campaign save is never touched.

## Architecture

- `src/data/questions.ts`: 12 computer and Python quizzes with lessons, hints, and answer explanations.
- `src/game/optimization.ts`: shared answer evaluation plus legacy optimization solvers covered by separate fixtures.
- `src/survival/reducer.ts`: pure survival rules (hunger, starvation, food, ordered NPCs, atomic tokened submissions, streaks, XP, chapter exits, permadeath).
- `src/survival/store.ts`: the single store shared by Phaser and React. It persists living runs and wipes the save on death.
- `src/survival/save.ts`: save validation and repair; dead or finished runs can never be continued.
- `src/survival/levels.ts`, `npcs.ts`: data-driven level layouts and the 12 NPCs.
- `src/survival/art/*`: procedural pixel art (characters, tiles, props, parallax backgrounds).
- `src/survival/phaser/*`: Boot, Menu, Chapter and End scenes, plus `GameHost`, which syncs the running scene with the store.
- `src/survival/ui/*`: HUD, dialogue, challenge and result panels, inventory, pause, menus, game over, victory.
- `src/ClassicApp.tsx`: the earlier card-and-map edition, available from the main menu as **Classic map edition**.

## Known limits

- Keyboard required: there are no on-screen touch controls for phones.
- Player position isn't saved: Continue resumes the chapter (stats, streak, inventory) from its starting checkpoint.
