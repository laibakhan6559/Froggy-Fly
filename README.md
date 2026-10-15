# 🐸 Froggy Fly

Cute pixel-art flying game (Flappy-style) — 5 levels, and at the end of every level Froggy meets a cute bunny! 🐰

Pure HTML + CSS + JavaScript (canvas). No build step, no dependencies.

## Levels
| # | Name | Pipes | Bunny friend |
|---|------|-------|--------------|
| 1 | Meadow Morning | 6 | Bella |
| 2 | Whispering Forest | 8 | Coco |
| 3 | Sunset Hills (moving pipes) | 10 | Mimi |
| 4 | Starry Night | 12 | Luna |
| 5 | Cloud Kingdom (finale) | 15 | Princess Lily |

## Controls
- Mobile: tap the screen to flap
- Desktop: click / Space / Arrow Up / W
- P or Esc = pause, M = mute

Collect ⭐ for bonus points. You have 3 hearts per level; finish with all 3 hearts for 3 stars.
Progress (unlocked levels + stars) is saved in the browser.

## Run locally
Just open `index.html`, or:
```bash
npx serve .
```

## Deploy on Vercel
**Option A - Vercel website (easiest)**
1. Push this folder to a GitHub repo.
2. vercel.com -> Add New -> Project -> import the repo.
3. Framework Preset: **Other**. Leave Build Command empty. Output Directory: leave empty (root). Click **Deploy**.

**Option B - Vercel CLI**
```bash
npm i -g vercel
cd froggy-fly
vercel --prod
```

## Project structure
```
index.html
css/style.css
js/audio.js     sound effects (WebAudio)
js/sprites.js   pixel sprites (frog, rabbit, hearts, stars, clouds)
js/levels.js    level settings (speed, gap, goal, theme, bunny dialogue)
js/game.js      game engine
assets/fonts/   Press Start 2P (OFL license)
vercel.json
```
To tweak difficulty, edit `js/levels.js` (goal, speed, gap, spacing).
running on terminal command
npx serve .