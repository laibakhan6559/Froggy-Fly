/* Pixel-art sprites defined as text grids, rendered to offscreen canvases. */
const PX = {
  frogA: [
    "..KKKK....KKKK..",
    ".KWWWWK..KWWWWK.",
    ".KWWBBK..KWWBBK.",
    ".KGWBBKKKKWBBGK.",
    "KGGGGGGGGGGGGGGK",
    "KGPPGGGGGGGGPPGK",
    "KGPPGKGGGGKGPPGK",
    "KGGGGGKKKKGGGGGK",
    "KGGGLLLLLLLLGGGK",
    ".KGLLLLLLLLLLGK.",
    ".KGLLLLLLLLLLGK.",
    "KGGKLLLLLLLLKGGK",
    "KGGGKKKKKKKKGGGK",
    ".KKK.KKKKKK.KKK."
  ],
  frogB: [
    "..KKKK....KKKK..",
    ".KWWWWK..KWWWWK.",
    ".KWWBBK..KWWBBK.",
    ".KGWBBKKKKWBBGK.",
    "KGGGGGGGGGGGGGGK",
    "KGPPGGGGGGGGPPGK",
    "KGPPGKGGGGKGPPGK",
    "KGGGGGKKKKGGGGGK",
    "KGGGLLLLLLLLGGGK",
    ".KGLLLLLLLLLLGK.",
    ".KGGLLLLLLLLGGK.",
    "KGGGKKKKKKKKGGGK",
    "KGGK........KGGK",
    ".KK..........KK."
  ],
  rabbit: [
    "....KK....KK....",
    "...KPPK..KPPK...",
    "...KPPK..KPPK...",
    "...KPPK..KPPK...",
    "...KPWK..KWPK...",
    "...KWWKKKKWWK...",
    "..KWWWWWWWWWWK..",
    ".KWWWWWWWWWWWWK.",
    ".KWWBBWWWWBBWWK.",
    ".KWWBBWWWWBBWWK.",
    ".KWCCWWNNWWCCWK.",
    ".KWCCWWKKWWCCWK.",
    "..KWWWWWWWWWWK..",
    "..KWWWRKKRWWWK..",
    ".KWWWWRRRRWWWWK.",
    ".KWWWWWWWWWWWWK.",
    ".KWWWSSSSSSWWWK.",
    ".KWWKWWWWWWKWWK.",
    "..KKK.KKKK.KKK.."
  ],
  heart: [
    ".RR.RR.",
    "RHRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R..."
  ],
  star: [
    "....Y....",
    "...YYY...",
    "...YHY...",
    "YYYYHYYYY",
    ".YYYYYYY.",
    "..YYYYY..",
    "..YYYYY..",
    ".YYY.YYY.",
    ".YY...YY."
  ],
  cloud: [
    "......WWWW..........",
    "....WWWWWWWW..WWW...",
    "..WWWWWWWWWWWWWWWWW.",
    ".WWWWWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWWWWWW",
    "SSSSSSSSSSSSSSSSSSSS"
  ]
};

const FROG_PAL = { K:'#1c3d1e', W:'#ffffff', B:'#111111', G:'#5ccb4a', L:'#b6ec96', P:'#ff9eb8' };

function makeSprite(rows, pal, scale) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * scale, y * scale, scale, scale); }
    }
  }
  return c;
}

const Sprites = {
  built: false,
  build() {
    if (this.built) return;
    this.frogA = makeSprite(PX.frogA, FROG_PAL, 3);
    this.frogB = makeSprite(PX.frogB, FROG_PAL, 3);
    this.heart = makeSprite(PX.heart, { R:'#ff4f6d', H:'#ffc2cf' }, 3);
    this.heartGray = makeSprite(PX.heart, { R:'#7b8294', H:'#a6adbd' }, 3);
    this.heartBig = makeSprite(PX.heart, { R:'#ff4f6d', H:'#ffc2cf' }, 5);
    this.star = makeSprite(PX.star, { Y:'#ffd23f', H:'#fff4b0' }, 3);
    this.starSmall = makeSprite(PX.star, { Y:'#ffd23f', H:'#fff4b0' }, 2);
    this.starGray = makeSprite(PX.star, { Y:'#6c7385', H:'#8a91a3' }, 3);
    this.starBig = makeSprite(PX.star, { Y:'#ffd23f', H:'#fff4b0' }, 6);
    this.starBigGray = makeSprite(PX.star, { Y:'#7c8398', H:'#9aa1b3' }, 6);
    this.rabbits = {};
  },
  rabbit(r) {
    if (this.rabbits[r.name]) return this.rabbits[r.name];
    const pal = { K: r.line, W: r.body, B: '#222222', P: r.ear, C: r.cheek, N: '#ff7a9a', R: r.bow, S: r.belly };
    return (this.rabbits[r.name] = makeSprite(PX.rabbit, pal, 3));
  },
  cloud(c1, c2) {
    this.clouds = this.clouds || {};
    const k = c1 + c2;
    return this.clouds[k] || (this.clouds[k] = makeSprite(PX.cloud, { W: c1, S: c2 }, 4));
  }
};
