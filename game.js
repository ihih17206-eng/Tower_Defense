const game = {
  hp: 20, coins: 200, currentWave: -1, state: 'menu',
  spawnTimer: 0, spawnIndex: 0, waveCooldown: 0,
  selectedTower: null, speed: 1, placementMode: null,
  mouseX: 0, mouseY: 0, placementValid: false,
  difficulty: 'medium', maxTowers: 12,
  kills: 0, coinsEarned: 0, towersBuilt: 0,
};

const enemies = [];
const projectiles = [];
const particles = [];
const towers = [];
const napalmZones = [];

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function getPathPosition(traveled, pathData) {
  const { waypoints, segments, totalLength } = pathData;
  if (traveled <= 0) return { x: waypoints[0].x, y: waypoints[0].y };
  if (traveled >= totalLength) return { x: waypoints[waypoints.length - 1].x, y: waypoints[waypoints.length - 1].y };
  let accum = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (accum + seg.len >= traveled) {
      const t = (traveled - accum) / seg.len;
      return { x: waypoints[i].x + seg.dx * t, y: waypoints[i].y + seg.dy * t };
    }
    accum += seg.len;
  }
  return { x: waypoints[waypoints.length - 1].x, y: waypoints[waypoints.length - 1].y };
}

function distToSegment(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - a.x, py - a.y);
  let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

function isOnRoad(x, y) {
  const minDist = 34;
  for (const branch of ['L', 'R']) {
    const pts = PATH_WAYPOINTS[branch];
    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment(x, y, pts[i], pts[i + 1]) < minDist) return true;
    }
  }
  return false;
}

function isOverlapping(x, y) {
  for (const t of towers) {
    if (Math.hypot(x - t.x, y - t.y) < 30) return true;
  }
  return false;
}

function spawnExplosion(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 30,
      0.3 + Math.random() * 0.4,
      color,
      2 + Math.random() * 3
    ));
  }
}

function initGame(difficulty) {
  generateWaves(difficulty);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  game.difficulty = difficulty;
  game.currentWave = -1;
  game.state = 'idle';
  game.spawnTimer = 0;
  game.spawnIndex = 0;
  game.waveCooldown = 0;
  game.selectedTower = null;
  game.speed = 1;
  game.placementMode = null;
  game.kills = 0;
  game.coinsEarned = 0;
  game.towersBuilt = 0;

  const tSkill = SKILL_TREE.skills.maxTowers;
  game.maxTowers = cfg.maxTowers + (tSkill.level > 0 ? tSkill.bonus[tSkill.level - 1] : 0);

  const cSkill = SKILL_TREE.skills.startCoins;
  game.hp = cfg.startHp;
  game.coins = cfg.startCoins + (cSkill.level > 0 ? cSkill.bonus[cSkill.level - 1] : 0);

  enemies.length = 0;
  projectiles.length = 0;
  particles.length = 0;
  towers.length = 0;
  napalmZones.length = 0;
  hideTowerInfo();
  document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('active'));
  document.getElementById('total-waves').textContent = cfg.isEndless ? '\u221E' : TOTAL_WAVES;
  if (startBtn) startBtn.disabled = false;
  if (speedBtn) speedBtn.textContent = '1\u00D7';
  updateHUD();
}

function startWave() {
  if (game.state !== 'idle' && game.state !== 'betweenWaves') return;
  game.currentWave++;
  if (!DIFFICULTY_CONFIG[game.difficulty].isEndless && game.currentWave >= TOTAL_WAVES) return;
  if (DIFFICULTY_CONFIG[game.difficulty].isEndless && game.currentWave >= WAVES.length - 1) {
    extendEndlessWaves();
  }
  game.state = 'spawning';
  game.spawnTimer = 0;
  game.spawnIndex = 0;
  startBtn.disabled = true;
  updateHUD();
}

function createEnemy(config) {
  if (config.isMegaTank) return new MegaTank(config);
  if (config.isStunner) return new Stunner(config);
  if (config.isBoss) return new Boss(config);
  return new Enemy(config);
}

function createTower(x, y, type) {
  switch (type) {
    case 'archer': return new Archer(x, y);
    case 'mage': return new Mage(x, y);
    case 'mortar': return new Mortar(x, y);
    case 'ice': return new Ice(x, y);
    case 'protectionTotem': return new ProtectionTotem(x, y);
    default: return new Tower(x, y, type);
  }
}

function spawnEnemyFromWave() {
  const wave = WAVES[game.currentWave];
  if (game.spawnIndex >= wave.enemies.length) return;
  enemies.push(createEnemy(wave.enemies[game.spawnIndex]));
  game.spawnIndex++;
}

function checkWaveComplete() {
  if (game.state !== 'spawning' && game.state !== 'active') return;
  const wave = WAVES[game.currentWave];
  if (game.spawnIndex >= wave.enemies.length && enemies.every(e => !e.alive)) {
    if (DIFFICULTY_CONFIG[game.difficulty].isEndless) {
      const waveNum = game.currentWave + 1;
      if (waveNum % 10 === 0) {
        awardSkillPoints(1);
      }
      game.state = 'betweenWaves';
      game.waveCooldown = 5;
      startBtn.disabled = false;
    } else if (game.currentWave >= TOTAL_WAVES - 1) {
      game.state = 'victory';
      victoryScreen.classList.add('visible');
      awardSkillPoints(1);
      showOverlayStats('victory');
    } else {
      game.state = 'betweenWaves';
      game.waveCooldown = 5;
      startBtn.disabled = false;
    }
    updateHUD();
  }
}

function buildTower(x, y, type) {
  const def = TOWER_TYPES[type];
  const reduction = SKILL_TREE.skills.costReduction.level > 0 ? SKILL_TREE.skills.costReduction.bonus[SKILL_TREE.skills.costReduction.level - 1] : 0;
  const effectiveCost = Math.round(def.cost * (1 - reduction));
  if (game.coins < effectiveCost) return false;
  if (isOnRoad(x, y) || isOverlapping(x, y)) return false;
  if (towers.length >= game.maxTowers) return false;
  game.coins -= effectiveCost;
  game.towersBuilt++;
  const tower = createTower(x, y, type);
  towers.push(tower);
  game.selectedTower = null;
  hideTowerInfo();
  updateHUD();
  return true;
}

function upgradeSelectedTower() {
  if (!game.selectedTower) return;
  if (game.selectedTower.upgrade()) {
    updateHUD();
    showTowerInfo(game.selectedTower);
  }
}

function evolveSelectedTower(key) {
  if (!game.selectedTower) return;
  if (game.selectedTower.evolve(key)) {
    updateHUD();
    showTowerInfo(game.selectedTower);
  }
}

function sellSelectedTower() {
  if (!game.selectedTower) return;
  const t = game.selectedTower;
  t.sell();
  game.selectedTower = null;
  hideTowerInfo();
  updateHUD();
}

function update(dt) {
  if (game.state === 'menu' || game.state === 'gameOver' || game.state === 'victory') return;
  if (dt > 0.1) dt = 0.1;
  dt *= game.speed;

  if (game.state === 'spawning') {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      const wave = WAVES[game.currentWave];
      if (game.spawnIndex < wave.enemies.length) {
        spawnEnemyFromWave();
        game.spawnTimer = wave.spawnInterval;
      } else {
        game.state = 'active';
      }
    }
    if (game.state === 'spawning' && game.spawnIndex >= WAVES[game.currentWave].enemies.length) {
      game.state = 'active';
    }
  }

  if (game.state === 'betweenWaves' && game.waveCooldown > 0) {
    game.waveCooldown -= dt;
    if (game.waveCooldown <= 0) {
      game.waveCooldown = 0;
      if (game.currentWave < TOTAL_WAVES - 1 || DIFFICULTY_CONFIG[game.difficulty].isEndless) startWave();
    }
  }

  for (const e of enemies) {
    e.update(dt);
    if (e.reachedEnd && !e.alive) {
      game.hp -= 1;
      updateHUD();
      if (game.hp <= 0) {
        game.state = 'gameOver';
        gameOverScreen.classList.add('visible');
        showOverlayStats('gameOver');
      }
    }
  }

  for (const t of towers) t.update(dt);
  for (const p of projectiles) p.update(dt);
  for (const p of particles) p.update(dt);
  for (const nz of napalmZones) nz.update(dt);

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (!enemies[i].alive) enemies.splice(i, 1);
  }
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (!projectiles[i].alive) projectiles.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].alive) particles.splice(i, 1);
  }
  for (let i = napalmZones.length - 1; i >= 0; i--) {
    if (!napalmZones[i].alive) napalmZones.splice(i, 1);
  }

  checkWaveComplete();
  updateHUD();
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
  lastTime = timestamp;
  if (game.state !== 'gameOver' && game.state !== 'victory') {
    update(dt);
    render();
  } else {
    render();
  }
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  initGame(game.difficulty);
  gameOverScreen.classList.remove('visible');
  victoryScreen.classList.remove('visible');
}

function startNewGame(difficulty) {
  gameOverScreen.classList.remove('visible');
  victoryScreen.classList.remove('visible');
  initGame(difficulty);
}
