class Stunner extends Enemy {
  constructor(config) {
    super(config);
    this.stunRadius = config.stunRadius || 110;
    this.stunCooldown = config.stunCooldown || 8;
    this.stunDuration = config.stunDuration || 2.5;
    this.stunTimer = 2;
  }
  update(dt) {
    super.update(dt);
    if (!this.alive) return;
    if (this.stunTimer > 0) this.stunTimer -= dt;
    if (this.stunTimer <= 0) {
      this.stunTimer = this.stunCooldown;
      for (const t of towers) {
        if (dist(this, t) <= this.stunRadius) {
          t.applyStun(this.stunDuration);
        }
      }
      spawnExplosion(this.x, this.y, '#CE93D8', 10);
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = 'rgba(156,39,176,0.15)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
    ctx.fill();
    super.draw(ctx);
  }
}
