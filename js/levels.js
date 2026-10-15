/* 20 levels. Every level ends with Froggy meeting Bella the bunny.
   Level 20 = the wedding! Difficulty grows slowly from level 1 to 20. */

const THEMES = [
  { // 0 meadow
    sky: ['#7fd4ff', '#d4f4ff'], cloud: ['#ffffff', '#d3ecff'], cloudCount: 5,
    hills: ['#9edb8d', '#7cc673'], trees: { kind: 'round', cols: ['#1f5a24', '#3b9a35', '#6fd356'] },
    ground: { grass: '#5ec43a', grassDark: '#3f9b2b', dirt: '#8b4a2b', dirt2: '#703a21' },
    pipe: { main: '#4fc33a', light: '#8ae96b', dark: '#2f8a26', o: '#173b17' }
  },
  { // 1 forest
    sky: ['#6fc0e0', '#cfeee0'], cloud: ['#f4fff6', '#cfe8d6'], cloudCount: 4,
    hills: ['#6fb08a', '#4f9a6f'], trees: { kind: 'pine', cols: ['#10431f', '#1f7a3a', '#3fb257'] },
    ground: { grass: '#47a83a', grassDark: '#2f7d2c', dirt: '#6e4126', dirt2: '#573219' },
    pipe: { main: '#b0763c', light: '#d79a58', dark: '#7e4f24', o: '#2e1b0c', rings: true }
  },
  { // 2 sunset
    sky: ['#ff9a6b', '#ffe2a8'], cloud: ['#ffd6d0', '#f6a9b0'], cloudCount: 5,
    hills: ['#c97f9b', '#a35f86'], trees: { kind: 'round', cols: ['#3a2a52', '#6b4f86', '#9a78ad'] },
    ground: { grass: '#9ac43a', grassDark: '#6f9a2b', dirt: '#8a5035', dirt2: '#6e3d28' },
    pipe: { main: '#36b6a6', light: '#74e0d0', dark: '#1f7f75', o: '#10332f' },
    sun: true
  },
  { // 3 night
    sky: ['#0d1b4c', '#3b4e9a'], cloud: ['#4a5aa8', '#38468c'], cloudCount: 4,
    hills: ['#2a3a7c', '#1f2d68'], trees: { kind: 'pine', cols: ['#0c1a33', '#16335a', '#244f80'] },
    ground: { grass: '#2f9a5a', grassDark: '#1f6e41', dirt: '#3d3a6b', dirt2: '#2e2b55' },
    pipe: { main: '#7d6bd6', light: '#b4a6ff', dark: '#4c3fa0', o: '#1a1440' },
    night: true
  },
  { // 4 cloud kingdom
    sky: ['#9fb8ff', '#ffe3f4'], cloud: ['#ffffff', '#f6d4ee'], cloudCount: 7,
    hills: ['#ffd0ea', '#f5b4dc'], trees: { kind: 'round', cols: ['#d889c0', '#f2aedb', '#ffd6ef'] },
    ground: { grass: '#ffffff', grassDark: '#e9d7f5', dirt: '#f6dff6', dirt2: '#ead0f0' },
    pipe: { main: '#ffcf4a', light: '#fff0a0', dark: '#d9962a', o: '#6b3f12' },
    sparkles: true, cloudy: true
  }
];

const NAMES = [
  'MEADOW MORNING', 'LILY POND', 'WHISPERING FOREST', 'MUSHROOM GROVE', 'SUNSET HILLS',
  'PINK DUSK', 'STARRY NIGHT', 'FIREFLY NIGHT', 'CLOUD KINGDOM', 'RAINBOW SKY',
  'FLOWER FIELD', 'PINE FOREST', 'GOLDEN SUNSET', 'MOONLIT LAKE', 'CANDY CLOUDS',
  'SUNNY MEADOW', 'MISTY WOODS', 'PURPLE SUNSET', 'MIDNIGHT STARS', 'WEDDING DAY'
];
const THEME_OF = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4];

/* [bunny says, froggy says]  -  max 16 letters per line, 2 lines */
const DIALOGUE = [
  [['HI FROGGY!', 'I AM BELLA!'], ['RIBBIT!', 'HELLO BELLA!']],
  [['YOU FLY SO WELL!', 'HOP HOP HOP!'], ['THANK YOU!', 'RIBBIT RIBBIT!']],
  [['WANT TO BE', 'FRIENDS?'], ['YES! BEST', 'FRIENDS!']],
  [['I LOVE THE', 'FOREST WITH YOU'], ['ME TOO,', 'BELLA!']],
  [['SUNSETS ARE BEST', 'WITH FRIENDS!'], ['RIBBIT RIBBIT!', 'SO PRETTY!']],
  [['I MADE YOU A', 'FLOWER CROWN!'], ['AWW, THANK', 'YOU BELLA!']],
  [['THE STARS LOOK', 'LIKE FIREFLIES!'], ['I WILL FLY', 'TO THEM FOR YOU!']],
  [['DO NOT BE', 'SCARED OF NIGHT'], ['NOT WITH YOU', 'NEXT TO ME!']],
  [['THE CLOUDS ARE', 'SO FLUFFY!'], ['LIKE YOUR', 'SOFT FUR!']],
  [['HALFWAY THERE,', 'BRAVE FROGGY!'], ['RIBBIT! I WILL', 'NEVER GIVE UP!']],
  [['PICK ME A', 'FLOWER, FROGGY?'], ['I PICKED', 'THE BEST ONE!']],
  [['YOU ARE THE', 'BRAVEST FROG!'], ['BECAUSE YOU', 'CHEER FOR ME!']],
  [['I SAVED YOU', 'A SWEET BERRY!'], ['YUM! YOU ARE', 'SO KIND!']],
  [['EVERY DAY WITH', 'YOU IS HAPPY!'], ['FOR ME TOO,', 'BELLA!']],
  [['I WAS WAITING', 'FOR YOU!'], ['I FLEW AS', 'FAST AS I CAN!']],
  [['YOU MAKE MY', 'HEART GO HOP!'], ['MY HEART GOES', 'RIBBIT RIBBIT!']],
  [['WILL YOU ALWAYS', 'FLY TO ME?'], ['ALWAYS AND', 'FOREVER!']],
  [['I HAVE A', 'SECRET FOR YOU'], ['TELL ME,', 'TELL ME!']],
  [['TOMORROW IS', 'A BIG DAY!'], ['I AM SO', 'NERVOUS!']],
  [['YES YES YES!', 'I DO, FROGGY!'], ['WILL YOU MARRY', 'ME, BELLA?']]
];

const BELLA = { name: 'BELLA', body: '#ffffff', belly: '#e6e6f4', ear: '#ffb3c8', cheek: '#ffb3c8', bow: '#ff4f86', line: '#4a3550' };

const LEVELS = NAMES.map((name, i) => {
  const k = i / (NAMES.length - 1);
  return Object.assign({}, THEMES[THEME_OF[i]], {
    name,
    themeId: THEME_OF[i],
    goal: 5 + Math.round(k * 13),                 // 5 .. 18 pipes
    speed: +(2.0 + k * 0.75).toFixed(2),          // 2.0 .. 2.75
    gap: Math.round(184 - k * 26),                // 184 .. 158
    spacing: Math.round(216 - k * 12),
    move: { chance: i < 4 ? 0 : Math.min(1, (i - 3) / 12), amp: Math.round(20 + k * 28) },
    rabbit: BELLA,
    bunny: DIALOGUE[i][0],
    froggy: DIALOGUE[i][1],
    finale: i === NAMES.length - 1
  });
});