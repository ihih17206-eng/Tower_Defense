class Enemy {
  constructor(config) {
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.baseSpeed = config.speed;
    this.reward = config.reward;
    this.color = config.color;
    this.traveled = 0;
    this.alive = true;
    this.reachedEnd = false;
    this.hitFlash = 0;
    this.slowFactor = 1;
    this.slowTimer = 0;
    this.poisonDps = 0;
    this.poisonTimer = 0;
    this.branch = config.branch || 'L';
    this.pathData = PATH_DATA[this.branch];
    this.drawSize = 10;
    this.updatePosition();
  }
  updatePosition() {
    const pos = getPathPosition(this.traveled, this.pathData);
    this.x = pos.x;
    this.y = pos.y;
  }
  isInNapalm() {
    for (const nz of napalmZones) {
      if (nz.alive && dist(this, nz) <= nz.radius) return true;
    }
    return false;
  }
  applySlow(factor, duration, freezeChance) {
    const isFrozen = freezeChance > 0 && Math.random() < freezeChance;
    if (isFrozen && this.isInNapalm()) return;
    if (this.slowTimer > 0 && factor >= this.slowFactor) return;
    this.slowFactor = isFrozen ? 0 : factor;
    this.slowTimer = isFrozen ? 1.5 : duration;
  }
  applyPoison(dps, duration) {
    if (this.poisonTimer > 0 && dps <= this.poisonDps) return;
    this.poisonDps = dps;
    this.poisonTimer = duration;
  }
  update(dt) {
    if (!this.alive) return;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) { this.slowTimer = 0; this.slowFactor = 1; }
    }
    if (this.slowFactor === 0 && this.isInNapalm()) {
      this.slowFactor = 1;
      this.slowTimer = 0;
    }
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      this.takeDamage(this.poisonDps * dt);
      if (this.poisonTimer <= 0) { this.poisonTimer = 0; this.poisonDps = 0; }
    }
    this.traveled += this.baseSpeed * this.slowFactor * dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.traveled >= this.pathData.totalLength) {
      this.alive = false;
      this.reachedEnd = true;
      return;
    }
    this.updatePosition();
  }
  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlash = 0.1;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      game.coins += this.reward;
      game.coinsEarned += this.reward;
      game.kills++;
      spawnExplosion(this.x, this.y, this.color, 10);
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    if (this.slowFactor < 1) {
      ctx.fillStyle = this.slowFactor === 0 ? 'rgba(0,188,212,0.35)' : 'rgba(0,188,212,0.15)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawSize + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.poisonTimer > 0) {
      ctx.fillStyle = 'rgba(0,200,0,0.15)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.drawSize + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.drawSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (this.hp < this.maxHp) {
      const barW = 30;
      const barH = 4;
      const bx = this.x - barW / 2;
      const by = this.y - this.drawSize - 8;
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    }
  }
}
