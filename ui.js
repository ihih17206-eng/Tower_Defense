const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('main-menu');
const gameContainer = document.getElementById('game-container');
const hudHp = document.getElementById('hp-display');
const hudCoins = document.getElementById('coins-display');
const hudWave = document.getElementById('wave-display');
const startBtn = document.getElementById('start-wave');
const gameOverScreen = document.getElementById('game-over');
const victoryScreen = document.getElementById('victory');
const invContainer = document.getElementById('tower-inventory');
const infoPanel = document.getElementById('tower-info');
const infoTitle = document.getElementById('info-title');
const infoStats = document.getElementById('info-stats');
const infoPrio = document.getElementById('info-priority');
const upgradeBtn = document.getElementById('upgrade-btn');
const sellBtn = document.getElementById('sell-btn');
const speedBtn = document.getElementById('speed-btn');
const evolveOptions = document.getElementById('evolve-options');
const towersDisplay = document.getElementById('towers-display');
const maxTowersDisplay = document.getElementById('max-towers');
const waveTypeDisplay = document.getElementById('wave-type-display');
const skillTreeScreen = document.getElementById('skill-tree-screen');
const skillPointsDisplay = document.getElementById('skill-points');

function initMenu() {
  document.querySelectorAll('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.dataset.diff;
      menuScreen.classList.remove('visible');
      skillTreeScreen.classList.remove('visible');
      gameContainer.style.display = 'flex';
      initGame(diff);
    });
  });
  document.getElementById('menu-skilltree').addEventListener('click', () => {
    menuScreen.classList.remove('visible');
    skillTreeScreen.classList.add('visible');
    renderSkillTree();
  });
  document.getElementById('st-back').addEventListener('click', () => {
    skillTreeScreen.classList.remove('visible');
    menuScreen.classList.add('visible');
  });
}

function updateHUD() {
  hudHp.textContent = game.hp;
  hudCoins.textContent = game.coins;
  hudWave.textContent = game.state === 'idle' ? 0 : game.currentWave + 1;
  if (towersDisplay) towersDisplay.textContent = towers.length;
  if (maxTowersDisplay) maxTowersDisplay.textContent = game.maxTowers;
  const cw = game.currentWave;
  if (waveTypeDisplay && cw >= 0 && cw < WAVES.length) {
    waveTypeDisplay.textContent = WAVE_TYPE_LABELS[WAVES[cw].type] || '-';
  } else if (waveTypeDisplay) {
    waveTypeDisplay.textContent = '-';
  }
}

function showOverlayStats(prefix) {
  const e = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  e(prefix + '-waves', game.currentWave + 1);
  e(prefix + '-kills', game.kills);
  e(prefix + '-coins', game.coinsEarned);
  e(prefix + '-towers', game.towersBuilt);
}

function buildTowerInventory() {
  invContainer.innerHTML = '';
  const categories = [
    { label: 'Attack', keys: TOWER_KEYS.filter(k => TOWER_TYPES[k].category === 'attack') },
    { label: 'Support', keys: TOWER_KEYS.filter(k => TOWER_TYPES[k].category === 'support') },
  ];
  for (const cat of categories) {
    if (cat.keys.length === 0) continue;
    const header = document.createElement('div');
    header.className = 'inv-category';
    header.textContent = cat.label;
    invContainer.appendChild(header);
    for (const key of cat.keys) {
      const def = TOWER_TYPES[key];
      const reduction = SKILL_TREE.skills.costReduction.level > 0 ? SKILL_TREE.skills.costReduction.bonus[SKILL_TREE.skills.costReduction.level - 1] : 0;
      const displayCost = Math.round(def.cost * (1 - reduction));
      const card = document.createElement('div');
      card.className = 'inv-card ' + cat.label.toLowerCase();
      card.dataset.type = key;
      card.innerHTML = `
        <span class="inv-dot" style="background:${def.color}"></span>
        <span class="inv-name">${def.name}</span>
        <span class="inv-cost">$${displayCost}</span>
      `;
      card.addEventListener('click', () => {
        if (game.placementMode === key) {
          game.placementMode = null;
        } else {
          game.placementMode = key;
          game.selectedTower = null;
          hideTowerInfo();
        }
        document.querySelectorAll('.inv-card').forEach(c =>
          c.classList.toggle('active', c.dataset.type === game.placementMode)
        );
        canvas.style.cursor = game.placementMode ? 'crosshair' : 'default';
      });
      invContainer.appendChild(card);
    }
  }
}

const PRIORITY_LABELS = { nearest: 'Nr', weakest: 'Wk', strongest: 'St', first: '1st', last: 'Lt' };
const PRIORITY_NAMES = { nearest: 'Nearest', weakest: 'Weakest', strongest: 'Strongest', first: 'First', last: 'Last' };

function showTowerInfo(tower) {
  const def = TOWER_TYPES[tower.type];
  if (tower.evolved) {
    infoTitle.textContent = def.name;
  } else {
    infoTitle.textContent = `${def.name} Lv.${tower.level}`;
  }

  if (tower.type === 'protectionTotem') {
    infoStats.innerHTML = `
      <div>Range: <b>${tower.range}</b></div>
      <div>Stun Resist: <b>${Math.round(tower.stunResist * 100)}%</b></div>
      <div>Cooldown: <b>${tower.stunResistCooldown}s</b></div>
    `;
    infoPrio.style.display = 'none';
  } else if (tower.type === 'wizard') {
    infoPrio.style.display = 'none';
    infoStats.innerHTML = `
      <div>Damage: <b>${tower.damage}</b></div>
      <div>Range: <b>${tower.range}</b></div>
      <div>Mode: <b>${tower.wizardMode === 'electric' ? 'Electric (pierce)' : 'Lava (beam)'}</b></div>
      ${tower.wizardMode === 'lava' ? `<div>Beam DPS: <b>${tower.beamDamage.toFixed(1)}</b></div>` : ''}
      <div style="color:#8e8;font-size:11px;margin-top:2px">${def.special}</div>
    `;
    infoPrio.innerHTML = `
      <button class="prio-btn${tower.wizardMode === 'electric' ? ' active' : ''}" data-wiz="electric">Electric</button>
      <button class="prio-btn${tower.wizardMode === 'lava' ? ' active' : ''}" data-wiz="lava">Lava</button>
    `;
    infoPrio.style.display = 'flex';
    infoPrio.querySelectorAll('[data-wiz]').forEach(btn => {
      btn.addEventListener('click', () => {
        tower.setWizardMode(btn.dataset.wiz);
        showTowerInfo(tower);
      });
    });
  } else {
    infoPrio.style.display = '';
    let statsHtml = `
      <div>Damage: <b>${tower.damage}</b></div>
      <div>Range: <b>${tower.range}</b></div>
      <div>Fire Rate: <b>${tower.fireRate.toFixed(1)}/s</b></div>
    `;
    const hasSlow = tower.slowFactor < 1 || def.slowByLevel || def.slowFactor !== undefined;
    if (hasSlow && (!def.isEvolution || tower.type === 'spikedIce')) {
      const slowPct = Math.round((1 - tower.slowFactor) * 100);
      statsHtml += `<div>Slow: <b>${slowPct}%</b></div>`;
    }
    if (def.slowByLevel) {
      const freezePct = Math.round(tower.freezeChance * 100);
      statsHtml += `<div>Freeze: <b>${freezePct}%</b></div>`;
    }
    if (def.special) {
      statsHtml += `<div style="color:#8e8;font-size:11px;margin-top:2px">${def.special}</div>`;
    }
    infoStats.innerHTML = statsHtml;
    infoPrio.innerHTML = '';
    for (const [key, label] of Object.entries(PRIORITY_LABELS)) {
      const btn = document.createElement('button');
      btn.className = 'prio-btn' + (tower.priority === key ? ' active' : '');
      btn.textContent = label;
      btn.title = PRIORITY_NAMES[key];
      btn.addEventListener('click', () => {
        tower.setPriority(key);
        infoPrio.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      infoPrio.appendChild(btn);
    }
  }

  const evoOptions = tower.canEvolve() ? tower.getEvolveOptions() : [];
  if (evoOptions.length > 0) {
    if (evoOptions.length === 1) {
      upgradeBtn.textContent = `Evolve \u2192 ${evoOptions[0].name} ($${evoOptions[0].cost})`;
      upgradeBtn.disabled = game.coins < evoOptions[0].cost;
      upgradeBtn.className = 'evolve';
      upgradeBtn.style.display = '';
      evolveOptions.style.display = 'none';
    } else {
      upgradeBtn.style.display = 'none';
      evolveOptions.style.display = 'flex';
      evolveOptions.innerHTML = '';
      for (const opt of evoOptions) {
        const btn = document.createElement('button');
        btn.className = 'prio-btn evolve';
        btn.textContent = `${opt.name} ($${opt.cost})`;
        btn.disabled = game.coins < opt.cost;
        btn.addEventListener('click', () => evolveSelectedTower(opt.key));
        evolveOptions.appendChild(btn);
      }
    }
  } else {
    upgradeBtn.style.display = '';
    evolveOptions.style.display = 'none';
    const upgCost = tower.getUpgradeCost();
    if (upgCost !== null) {
      upgradeBtn.textContent = `Upgrade ($${upgCost})`;
      upgradeBtn.disabled = game.coins < upgCost;
      upgradeBtn.className = '';
    } else {
      upgradeBtn.textContent = tower.evolved ? 'EVOLVED' : 'MAX LEVEL';
      upgradeBtn.disabled = true;
      upgradeBtn.className = '';
    }
  }
  sellBtn.textContent = `Sell ($${tower.getSellValue()})`;
  sellBtn.disabled = false;
  infoPanel.classList.remove('hidden');
}

function hideTowerInfo() {
  infoPanel.classList.add('hidden');
}

function renderSkillTree() {
  if (skillPointsDisplay) skillPointsDisplay.textContent = SKILL_TREE.points;
  for (const key of Object.keys(SKILL_TREE.skills)) {
    const skill = SKILL_TREE.skills[key];
    const lvlEl = document.getElementById(`st-level-${key}`);
    const costEl = document.getElementById(`st-cost-${key}`);
    const btnEl = document.getElementById(`st-btn-${key}`);
    const dotsEl = document.getElementById(`st-dots-${key}`);
    if (lvlEl) lvlEl.textContent = skill.level;
    if (dotsEl) {
      let html = '';
      for (let d = 0; d < skill.maxLevel; d++) {
        html += `<span class="st-dot${d < skill.level ? ' filled' : ''}"></span>`;
      }
      dotsEl.innerHTML = html;
    }
    const canUp = skill.level < skill.maxLevel;
    const cost = canUp ? skill.costs[skill.level] : 0;
    if (costEl) costEl.textContent = canUp ? `${cost} pt` : 'MAX';
    if (btnEl) {
      btnEl.disabled = !canUp || SKILL_TREE.points < cost;
      btnEl.textContent = canUp ? 'Upgrade' : 'MAXED';
    }
  }
}

function upgradeSkillTree(key) {
  if (spendSkillPoint(key)) {
    renderSkillTree();
    buildTowerInventory();
  }
}

document.querySelectorAll('.go-diff, .vic-diff').forEach(btn => {
  btn.addEventListener('click', () => {
    startNewGame(btn.dataset.diff);
  });
});

const SPEEDS = [0.5, 1, 2, 3];
speedBtn.addEventListener('click', () => {
  const idx = SPEEDS.indexOf(game.speed);
  game.speed = SPEEDS[(idx + 1) % SPEEDS.length];
  speedBtn.textContent = game.speed + '\u00D7';
});
