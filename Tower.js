class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.level = 1;
    this.evolved = false;
    this.totalSpent = TOWER_TYPES[type].cost;
    this.cooldown = 0;
    this.priority = 'nearest';
    this.stunTimer = 0;
    this.stunResistTimer = 0;
    this.stunResistCooldown = 0;
    this.wizardMode = 'electric';
    this.beamTarget = null;
    this.beamDamage = 0;
    this.beamRamp = 12;
    this._recalcStats();
  }
  _recalcStats() {
    const def = TOWER_TYPES[this.type];
    if (this.evolved) {
      this.damage = def.baseStats.damage;
      this.range = def.baseStats.range;
      this.fireRate = def.baseStats.fireRate;
      this.projectileSpeed = def.baseStats.projectileSpeed;
      this.color = def.color;
      this.projectileColor = def.projectileColor;
      this.size = def.size;
      this.aoeRadius = def.aoeRadius || 0;
      this.slowFactor = def.slowFactor !== undefined ? def.slowFactor : 1;
      this.freezeChance = def.freezeChance || 0;
      this.slowDuration = def.slowDuration || 0;
      this.stunResist = 0;
      if (def.wizardMode) this.wizardMode = def.wizardMode;
      return;
    }
    const mul = LEVEL_MULTIPLIERS[this.level];
    this.damage = Math.round(def.baseStats.damage * mul.damage);
    this.range = Math.round(def.baseStats.range * mul.range);
    this.fireRate = def.baseStats.fireRate * mul.fireRate;
    this.projectileSpeed = def.baseStats.projectileSpeed;
    this.color = def.color;
    this.projectileColor = def.projectileColor;
    this.size = def.size;
    this.aoeRadius = def.aoeRadius || 0;
    this.slowFactor = def.slowByLevel ? def.slowByLevel[this.level - 1] : 1;
    this.freezeChance = def.freezeByLevel ? def.freezeByLevel[this.level - 1] : 0;
    this.slowDuration = def.slowDuration || 0;
    this.stunResist = def.stunResistByLevel ? def.stunResistByLevel[this.level - 1] : 0;
    this.stunResistCooldown = def.stunResistCooldownByLevel ? def.stunResistCooldownByLevel[this.level - 1] : 0;
  }
  getEvolveOptions() {
    const def = TOWER_TYPES[this.type];
    if (this.evolved || this.level < 3 || !def.evolvesTo || def.evolvesTo.length === 0) return [];
    return def.evolvesTo.map(key => ({
      key,
      name: TOWER_TYPES[key].name,
      cost: def.evolveCosts[key],
    }));
  }
  canEvolve() {
    return this.getEvolveOptions().length > 0;
  }
  getEvolveCost() {
    return null;
  }
  evolve(key) {
    const options = this.getEvolveOptions();
    const opt = key ? options.find(o => o.key === key) : options[0];
    if (!opt) return false;
    if (game.coins < opt.cost) return false;
    game.coins -= opt.cost;
    this.totalSpent += opt.cost;
    this.evolved = true;
    this.type = opt.key;
    this.beamTarget = null;
    this.beamDamage = 0;
    this._recalcStats();
    return true;
  }
  getUpgradeCost() {
    if (this.evolved) return null;
    if (this.level >= 3) return null;
    return TOWER_TYPES[this.type].upgradeCosts[this.level - 1];
  }
  getSellValue() {
    return Math.floor(this.totalSpent * 0.5);
  }
  upgrade() {
    const cost = this.getUpgradeCost();
    if (!cost) return false;
    if (game.coins < cost) return false;
    game.coins -= cost;
    this.totalSpent += cost;
    this.level++;
    this._recalcStats();
    return true;
  }
  sell() {
    game.coins += this.getSellValue();
    const idx = towers.indexOf(this);
    if (idx !== -1) towers.splice(idx, 1);
  }
  setPriority(p) {
    this.priority = p;
  }
  setWizardMode(mode) {
    if (mode === 'electric' || mode === 'lava') {
      this.wizardMode = mode;
      this.beamTarget = null;
      this.beamDamage = 0;
    }
  }
  applyStun(duration) {
    let bestTotem = null;
    let resist = 0;
    for (const t of towers) {
      if (t.type === 'protectionTotem' && dist(this, t) <= t.range && t.stunResistTimer <= 0) {
        if (t.stunResist > resist) {
          resist = t.stunResist;
          bestTotem = t;
        }
      }
    }
    if (bestTotem && (resist >= 1 || Math.random() < resist)) {
      bestTotem.stunResistTimer = bestTotem.stunResistCooldown;
      return;
    }
    this.stunTimer = Math.max(this.stunTimer, duration);
  }
  _findTarget() {
    let target = null;
    for (const e of enemies) {
      if (!e.alive || dist(this, e) > this.range) continue;
      if (!target) { target = e; continue; }
      switch (this.priority) {
        case 'weakest': if (e.hp < target.hp) target = e; break;
        case 'strongest': if (e.hp > target.hp) target = e; break;
        case 'first': if (e.traveled < target.traveled) target = e; break;
        case 'last': if (e.traveled > target.traveled) target = e; break;
        default: if (dist(this, e) < dist(this, target)) target = e;
      }
    }
    return target;
  }
  _updateLavaBeam(dt) {
    if (!this.beamTarget || !this.beamTarget.alive || dist(this, this.beamTarget) > this.range) {
      this.beamTarget = this._findTarget();
      this.beamDamage = this.damage;
    }
    if (this.beamTarget) {
      this.beamDamage += this.beamRamp * dt;
      this.beamTarget.takeDamage(this.beamDamage * dt);
    }
  }
  update(dt) {
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
    }
    if (this.stunResistTimer > 0) this.stunResistTimer -= dt;
    if (this.stunTimer > 0) return;
    if (this.type === 'protectionTotem') return;

    if (this.type === 'wizard') {
      if (this.wizardMode === 'lava') {
        this._updateLavaBeam(dt);
        return;
      }
    }

    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const target = this._findTarget();
      if (target) {
        this.cooldown = 1 / this.fireRate;
        if (this.type === 'wizard' && this.wizardMode === 'electric') {
          projectiles.push(new PiercingProjectile(
            this.x, this.y, target,
            this.projectileSpeed, this.damage, this.projectileColor
          ));
        } else {
          const effects = {};
          if (this.slowFactor < 1) {
            effects.slow = { factor: this.slowFactor, duration: this.slowDuration, freezeChance: this.freezeChance };
          }
          if (this.type === 'darkMage') {
            effects.poison = { dps: 10, duration: 3 };
          }
          if (this.type === 'fireMortar' && this.aoeRadius > 0) {
            effects.napalm = { dps: 18, duration: 3, radius: 50 };
          }
          const effParam = Object.keys(effects).length > 0 ? effects : null;
          projectiles.push(new Projectile(
            this.x, this.y, target,
            this.projectileSpeed, this.damage,
            this.projectileColor, this.aoeRadius, effParam
          ));
        }
      }
    }
  }
  draw(ctx) {
    if (this.stunTimer > 0) {
      ctx.fillStyle = 'rgba(100,100,100,0.35)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.evolved) {
      ctx.fillStyle = 'rgba(255,215,0,0.1)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.type === 'wizard' && this.wizardMode === 'lava' && this.beamTarget && this.beamTarget.alive) {
      const intensity = Math.min(1, this.beamDamage / 100);
      ctx.strokeStyle = `rgba(255, ${Math.round(100 - intensity * 80)}, 0, ${0.3 + intensity * 0.5})`;
      ctx.lineWidth = 3 + intensity * 5;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.beamTarget.x, this.beamTarget.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, ${Math.round(200 - intensity * 100)}, 50, ${0.4 + intensity * 0.6})`;
      ctx.beginPath();
      ctx.arc(this.beamTarget.x, this.beamTarget.y, 3 + intensity * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.type === 'protectionTotem') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
      ctx.strokeStyle = this.stunTimer > 0 ? 'rgba(200,200,200,0.5)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.size, -this.size, this.size * 2, this.size * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = this.stunTimer > 0 ? 'rgba(200,200,200,0.5)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const typeLabels = {
      archer: 'A', mage: 'M', mortar: 'Rt', ice: 'Ic',
      arbalest: 'Xt', sniper: 'Sn', darkMage: 'Dk', fireMortar: 'Fm', spikedIce: 'SI',
      protectionTotem: 'Pt', wizard: 'Wz',
    };
    ctx.fillText(typeLabels[this.type] || '?', this.x, this.y + 1);
    if (this.type === 'wizard') {
      ctx.font = '7px Arial';
      ctx.fillStyle = this.wizardMode === 'lava' ? '#FF5722' : '#FFD54F';
      ctx.fillText(this.wizardMode === 'lava' ? 'LAVA' : 'ELE', this.x, this.y - this.size - 4);
    }
    if (this.stunTimer > 0) {
      ctx.font = '8px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('zZz', this.x, this.y - this.size - 2);
    }
    if (!this.evolved) {
      const dotY = this.y + this.size + 6;
      const dotSpacing = 6;
      const totalW = this.level * dotSpacing;
      const startX = this.x - totalW / 2 + 2;
      for (let i = 0; i < this.level; i++) {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(startX + i * dotSpacing, dotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
