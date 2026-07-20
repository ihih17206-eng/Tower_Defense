class MegaTank extends Enemy {
  constructor(config) {
    super(config);
    this.stunRadius = 120;
    this.stunCooldown = 12;
    this.stunDuration = 2;
    this.stunTimer = 3;
    this.drawSize = 16;
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
      spawnExplosion(this.x, this.y, '#E040FB', 10);
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = 'rgba(136,14,79,0.2)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
    ctx.fill();
    super.draw(ctx);
  }
}
