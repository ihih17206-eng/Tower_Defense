const PATH_WAYPOINTS = {
  L: [
    { x: 0, y: 300 },
    { x: 120, y: 180 },
    { x: 260, y: 340 },
    { x: 380, y: 240 },
    { x: 500, y: 340 },
    { x: 640, y: 240 },
    { x: 780, y: 340 },
    { x: 900, y: 300 },
  ],
  R: [
    { x: 0, y: 300 },
    { x: 120, y: 180 },
    { x: 260, y: 340 },
    { x: 380, y: 440 },
    { x: 500, y: 340 },
    { x: 640, y: 240 },
    { x: 780, y: 340 },
    { x: 900, y: 300 },
  ],
};

function buildPathData(waypoints) {
  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ len, dx, dy });
    totalLength += len;
  }
  return { waypoints, segments, totalLength };
}

const PATH_DATA = { L: buildPathData(PATH_WAYPOINTS.L), R: buildPathData(PATH_WAYPOINTS.R) };

const TOWER_TYPES = {
  archer: {
    name: 'Archer', cost: 50, category: 'attack',
    baseStats: { damage: 10, range: 120, fireRate: 2, projectileSpeed: 400 },
    color: '#8B4513', projectileColor: '#8B4513', size: 10,
    upgradeCosts: [75, 100],
    evolvesTo: ['arbalest', 'sniper'],
    evolveCosts: { arbalest: 400, sniper: 500 },
  },
  mage: {
    name: 'Mage', cost: 100, category: 'attack',
    baseStats: { damage: 25, range: 140, fireRate: 0.8, projectileSpeed: 280 },
    color: '#9B59B6', projectileColor: '#BB6BD9', size: 12,
    upgradeCosts: [150, 200],
    evolvesTo: ['darkMage', 'wizard'],
    evolveCosts: { darkMage: 500, wizard: 500 },
  },
  mortar: {
    name: 'Mortar', cost: 150, category: 'attack',
    baseStats: { damage: 50, range: 180, fireRate: 0.4, projectileSpeed: 220 },
    color: '#E74C3C', projectileColor: '#E74C3C', size: 14, aoeRadius: 40,
    upgradeCosts: [225, 300],
    evolvesTo: ['fireMortar'],
    evolveCosts: { fireMortar: 600 },
  },
  ice: {
    name: 'Ice', cost: 100, category: 'support',
    baseStats: { damage: 0, range: 130, fireRate: 1.0, projectileSpeed: 300 },
    color: '#00BCD4', projectileColor: '#4DD0E1', size: 12,
    slowByLevel: [0.5, 0.3, 0.15],
    freezeByLevel: [0, 0.15, 0.3],
    slowDuration: 2.0,
    upgradeCosts: [150, 200],
    evolvesTo: ['spikedIce'],
    evolveCosts: { spikedIce: 500 },
  },
  protectionTotem: {
    name: 'Protection Totem', cost: 150, category: 'support',
    baseStats: { damage: 0, range: 150, fireRate: 0, projectileSpeed: 0 },
    color: '#FFD700', projectileColor: '#FFD700', size: 14,
    upgradeCosts: [200, 300],
    stunResistByLevel: [0.5, 0.75, 1.0],
    stunResistCooldownByLevel: [10, 7, 4],
  },
  // Evolutions
  arbalest: {
    name: 'Arbalest', evolvesFrom: 'archer', isEvolution: true, category: 'attack',
    baseStats: { damage: 60, range: 160, fireRate: 2.5, projectileSpeed: 500 },
    color: '#2E7D32', projectileColor: '#4CAF50', size: 12,
    special: 'High single-target DPS',
  },
  sniper: {
    name: 'Sniper', evolvesFrom: 'archer', isEvolution: true, category: 'attack',
    baseStats: { damage: 200, range: 280, fireRate: 0.3, projectileSpeed: 1000 },
    color: '#C62828', projectileColor: '#EF5350', size: 12,
    special: 'Extreme damage & range, very slow attack',
  },
  darkMage: {
    name: 'Dark Mage', evolvesFrom: 'mage', isEvolution: true, category: 'attack',
    baseStats: { damage: 40, range: 160, fireRate: 1.1, projectileSpeed: 300 },
    color: '#8E24AA', projectileColor: '#CE93D8', size: 12,
    special: 'Poison: 10 DPS / 3s (non-stacking)',
  },
  wizard: {
    name: 'Wizard', evolvesFrom: 'mage', isEvolution: true, category: 'attack',
    baseStats: { damage: 15, range: 150, fireRate: 1.5, projectileSpeed: 400 },
    color: '#FF9800', projectileColor: '#FFB74D', size: 12,
    wizardMode: 'electric',
    special: 'Electric (pierce) or Lava (beam) - toggle in panel',
  },
  fireMortar: {
    name: 'Fire Mortar', evolvesFrom: 'mortar', isEvolution: true, category: 'attack',
    baseStats: { damage: 70, range: 200, fireRate: 0.48, projectileSpeed: 240 },
    color: '#D32F2F', projectileColor: '#FF6B35', size: 14, aoeRadius: 45,
    special: 'Napalm: 18 DPS / 3s ground zone on hit',
  },
  spikedIce: {
    name: 'Spiked Ice', evolvesFrom: 'ice', isEvolution: true, category: 'support',
    baseStats: { damage: 12, range: 140, fireRate: 1.2, projectileSpeed: 300 },
    color: '#00BCD4', projectileColor: '#4DD0E1', size: 12,
    slowFactor: 0.4, slowDuration: 2.0, freezeChance: 0,
    special: 'Deals damage + 60% slow',
  },
};

const TOWER_KEYS = ['archer', 'mage', 'mortar', 'ice', 'protectionTotem'];

const LEVEL_MULTIPLIERS = {
  1: { damage: 1.0, range: 1.0, fireRate: 1.0 },
  2: { damage: 1.5, range: 1.1, fireRate: 1.15 },
  3: { damage: 2.0, range: 1.2, fireRate: 1.3 },
};

const DIFFICULTY_CONFIG = {
  easy: {
    waveCount: 15, isEndless: false,
    waveTypes: [
      'normal','normal','fast','normal','strong',
      'normal','double','normal','fast','strong',
      'normal','double','fast','normal','normal',
    ],
    enemyHpMul: 0.8, enemyCountMul: 0.7, enemySpeedMul: 0.9,
    startCoins: 300, startHp: 25, maxTowers: 15,
  },
  medium: {
    waveCount: 20, isEndless: false,
    waveTypes: [
      'normal','normal','fast','normal','strong',
      'normal','double','normal','stun','fast',
      'normal','strong','double','stun','strongStun',
      'fast','normal','stun','double','strongStun',
    ],
    enemyHpMul: 1.0, enemyCountMul: 1.0, enemySpeedMul: 1.0,
    startCoins: 200, startHp: 20, maxTowers: 12,
  },
  hard: {
    waveCount: 25, isEndless: false,
    waveTypes: [
      'normal','fast','normal','strong','double',
      'normal','stun','fast','strong','stun',
      'double','fast','stun','strongStun','normal',
      'double','stun','fast','strongStun','double',
      'stun','strongStun','fast','strongStun','double',
    ],
    enemyHpMul: 1.2, enemyCountMul: 1.3, enemySpeedMul: 1.1,
    startCoins: 150, startHp: 15, maxTowers: 10,
  },
  endless: {
    waveCount: Infinity, isEndless: true,
    waveTypes: [],
    enemyHpMul: 1.0, enemyCountMul: 1.0, enemySpeedMul: 1.0,
    startCoins: 200, startHp: 20, maxTowers: 12,
  },
};

const WAVE_TYPE_LABELS = {
  normal: 'Normal', fast: 'Fast', strong: 'Strong',
  double: 'Double', stun: 'Stun', strongStun: 'Strong Stun',
};

let WAVES = [];
let TOTAL_WAVES = 0;

function _generateEnemyForWave(i, j, baseHp, baseSpeed, baseReward, colors, colorIdx) {
  const v = 0.85 + (j / baseHp) * 0.3; // re-using count from caller via baseHp is wrong, fix below
  return {
    hp: Math.round(baseHp * v),
    speed: Math.round(baseSpeed * (0.9 + j * 0.02)),
    reward: Math.round(baseReward * v),
    color: colors[colorIdx],
    branch: (j + i) % 2 === 0 ? 'L' : 'R',
  };
}

function _addStunner(enemies, i, t, s) {
  enemies.push({
    hp: Math.round((60 + t * 120) * (1 - s * 0.15)),
    speed: Math.max(20, 30 + Math.round(t * 6) - s * 3),
    reward: Math.round((30 + t * 25) * (1 - s * 0.1)),
    color: '#9C27B0',
    branch: (s + i) % 2 === 0 ? 'L' : 'R',
    isStunner: true,
    stunRadius: 110 - s * 10,
    stunCooldown: 8 + s * 2,
    stunDuration: +(2.5 - s * 0.3).toFixed(1),
  });
}

function _addMegaTank(enemies, i, t) {
  enemies.push({
    hp: Math.round(400 + t * 600),
    speed: 20,
    reward: Math.round(60 + t * 60),
    color: '#880E4F',
    branch: 'L',
    isMegaTank: true,
    stunRadius: 120,
    stunCooldown: 12,
    stunDuration: 2,
  });
}

function _addBoss(enemies, t, waveNum) {
  enemies.push({
    hp: Math.round((300 + waveNum * 30) * (t > 0 ? 1 + t * 0.5 : 1)),
    speed: 22,
    reward: Math.round(80 + t * 60),
    color: '#D50000', branch: waveNum % 2 === 0 ? 'L' : 'R', isBoss: true,
  });
}

function _applyWaveTypeModifiers(enemies, waveType) {
  if (waveType === 'fast') {
    for (const e of enemies) { e.speed = Math.round(e.speed * 1.5); e.hp = Math.round(e.hp * 0.6); }
  } else if (waveType === 'strong') {
    for (const e of enemies) { e.hp = Math.round(e.hp * 1.5); e.speed = Math.round(e.speed * 0.8); }
  } else if (waveType === 'double') {
    const copy = enemies.map(e => ({ ...e, branch: e.branch === 'L' ? 'R' : 'L' }));
    enemies.push(...copy);
  }
}

function generateWave(i, cfg) {
  const t = (i - 1) / ((cfg.waveCount || 100) - 1 || 1);
  const rawCount = 5 + Math.min(t, 1) * 11;
  const count = Math.max(1, Math.round(rawCount * cfg.enemyCountMul));
  const baseHp = Math.round((30 + t * 270) * cfg.enemyHpMul);
  const baseSpeed = Math.round((62 - t * 28) * cfg.enemySpeedMul);
  const baseReward = Math.round(10 + t * 40);
  const interval = Math.max(0.2, +(1.0 - t * 0.6).toFixed(2));
  const colorIdx = t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
  const colors = ['#66BB6A', '#FFD54F', '#FF9100', '#EF5350'];
  const enemies = [];

  for (let j = 0; j < count; j++) {
    const v = 0.85 + (j / count) * 0.3;
    enemies.push({
      hp: Math.round(baseHp * v),
      speed: Math.round(baseSpeed * (0.9 + j * 0.02)),
      reward: Math.round(baseReward * v),
      color: colors[colorIdx],
      branch: (j + i) % 2 === 0 ? 'L' : 'R',
    });
  }

  const waveType = cfg.waveTypes ? cfg.waveTypes[i - 1] : 'normal';
  _applyWaveTypeModifiers(enemies, waveType);

  if (i >= 7 && i % 3 === 1) {
    const stunnerCount = i <= 10 ? 1 : i <= 15 ? 2 : 3;
    for (let s = 0; s < stunnerCount; s++) _addStunner(enemies, i, t, s);
  }
  if (i >= 14 && i % 2 === 0) _addMegaTank(enemies, i, t);

  if (i === 10) enemies.push({ hp: 400, speed: 35, reward: 60, color: '#D50000', branch: 'L', isBoss: true });
  if (i === 15) enemies.push({ hp: 600, speed: 28, reward: 80, color: '#AA00FF', branch: 'R', isBoss: true });
  if (i === 20) enemies.push({ hp: 800, speed: 25, reward: 100, color: '#FF1744', branch: 'L', isBoss: true });
  if (i === 25) enemies.push({ hp: 1000, speed: 22, reward: 120, color: '#D50000', branch: 'R', isBoss: true });
  if (i === (cfg.waveCount || 999) && ![10, 15, 20, 25].includes(i)) {
    enemies.push({
      hp: Math.round((300 + i * 30) * cfg.enemyHpMul), speed: 22,
      reward: Math.round(80 + t * 60), color: '#D50000', branch: 'L', isBoss: true,
    });
  }

  return { enemies, spawnInterval: interval, type: waveType };
}

function generateEndlessWave(i) {
  const cap = 50;
  const t = Math.min(1, (i - 1) / cap);
  const hpScale = i <= cap ? 1 : Math.pow(1.04, i - cap);
  const count = Math.min(40, Math.max(3, 5 + Math.round(i * 0.25)));
  const baseHp = Math.round((25 + t * 275) * hpScale);
  const baseSpeed = Math.max(18, Math.round((60 - Math.min(i, 80) * 0.3)));
  const baseReward = Math.round(8 + Math.min(i, 80) * 0.5);
  const interval = Math.max(0.15, 0.9 - Math.min(i, 80) * 0.008);
  const colorIdx = Math.min(3, Math.floor((i - 1) / 20));
  const colors = ['#66BB6A', '#FFD54F', '#FF9100', '#EF5350'];
  const enemies = [];

  for (let j = 0; j < count; j++) {
    const v = 0.85 + (j / count) * 0.3;
    enemies.push({
      hp: Math.round(baseHp * v),
      speed: Math.round(baseSpeed * (0.9 + j * 0.02)),
      reward: Math.round(baseReward * v),
      color: colors[colorIdx],
      branch: (j + i) % 2 === 0 ? 'L' : 'R',
    });
  }

  const waveTypesCycle = ['normal', 'normal', 'fast', 'normal', 'strong', 'double', 'normal', 'stun', 'fast', 'double'];
  const waveType = waveTypesCycle[(i - 1) % waveTypesCycle.length];
  _applyWaveTypeModifiers(enemies, waveType);

  if (i >= 7 && i % 3 === 1) {
    const sc = i <= 10 ? 1 : i <= 15 ? 2 : 3;
    for (let s = 0; s < sc; s++) _addStunner(enemies, i, t, s);
  }
  if (i >= 14 && i % 2 === 0) _addMegaTank(enemies, i, 1);

  if (i % 10 === 0) _addBoss(enemies, t, i);

  return { enemies, spawnInterval: interval, type: waveType };
}

function generateWaves(difficulty) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const waves = [];

  if (cfg.isEndless) {
    for (let i = 1; i <= 10; i++) waves.push(generateEndlessWave(i));
    WAVES = waves;
    TOTAL_WAVES = Infinity;
    return;
  }

  for (let i = 1; i <= cfg.waveCount; i++) {
    waves.push(generateWave(i, cfg));
  }
  WAVES = waves;
  TOTAL_WAVES = waves.length;
}

function extendEndlessWaves() {
  const startFrom = WAVES.length + 1;
  for (let i = startFrom; i < startFrom + 10; i++) {
    WAVES.push(generateEndlessWave(i));
  }
}
