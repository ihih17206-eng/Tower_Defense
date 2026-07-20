class Boss extends Enemy {
  constructor(config) {
    super(config);
    this.drawSize = 18;
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = 'rgba(213,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 26, 0, Math.PI * 2);
    ctx.fill();
    super.draw(ctx);
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.drawSize + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
