class Projectile {
  constructor(x, y, target, speed, damage, color, aoeRadius, effects) {
    this.x = x; this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.aoeRadius = aoeRadius || 0;
    this.effects = effects || null;
    this.alive = true;
    this.size = aoeRadius ? 5 : 3;
  }
  update(dt) {
    if (!this.alive) return;
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 6) {
      this.hit();
      return;
    }
    const step = this.speed * dt;
    if (step >= d) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.hit();
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
  }
  hit() {
    this.alive = false;
    if (this.target && this.target.alive) {
      if (this.damage > 0) this.target.takeDamage(this.damage);
      if (this.effects) {
        if (this.effects.slow) this.target.applySlow(this.effects.slow.factor, this.effects.slow.duration, this.effects.slow.freezeChance);
        if (this.effects.poison) this.target.applyPoison(this.effects.poison.dps, this.effects.poison.duration);
      }
      spawnExplosion(this.x, this.y, this.effects && this.effects.slow ? '#4DD0E1' : this.color, 5);
      if (this.aoeRadius > 0) {
        for (const e of enemies) {
          if (e !== this.target && e.alive && dist(e, this) <= this.aoeRadius) {
            e.takeDamage(this.damage);
            if (this.effects) {
              if (this.effects.slow) e.applySlow(this.effects.slow.factor, this.effects.slow.duration, this.effects.slow.freezeChance);
              if (this.effects.poison) e.applyPoison(this.effects.poison.dps, this.effects.poison.duration);
            }
          }
        }
        spawnExplosion(this.x, this.y, '#FF6B35', 12);
        if (this.effects && this.effects.napalm) {
          napalmZones.push(new NapalmZone(this.x, this.y, this.effects.napalm.dps, this.effects.napalm.duration, this.effects.napalm.radius));
        }
      }
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class PiercingProjectile {
  constructor(x, y, target, speed, damage, color) {
    this.x = x; this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.alive = true;
    this.size = 4;
    this.hitCount = 0;
    this.maxHits = 4;
    this.chainRadius = 65;
  }
  update(dt) {
    if (!this.alive) return;
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 8) {
      this.hit();
      return;
    }
    const step = this.speed * dt;
    if (step >= d) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.hit();
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
  }
  hit() {
    if (!this.target || !this.target.alive) { this.alive = false; return; }
    this.target.takeDamage(this.damage);
    spawnExplosion(this.x, this.y, '#FFB74D', 4);
    this.hitCount++;
    if (this.hitCount >= this.maxHits) { this.alive = false; return; }
    let nearest = null;
    let nearDist = this.chainRadius;
    for (const e of enemies) {
      if (e !== this.target && e.alive) {
        const d = dist(e, this.target);
        if (d <= nearDist) { nearDist = d; nearest = e; }
      }
    }
    if (nearest) {
      this.target = nearest;
      this.x = nearest.x;
      this.y = nearest.y;
      this.hit();
    } else {
      this.alive = false;
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    ctx.fillStyle = this.color;
    ctx.shadowColor = '#FFB74D';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class NapalmZone {
  constructor(x, y, dps, duration, radius) {
    this.x = x; this.y = y;
    this.dps = dps;
    this.radius = radius;
    this.timer = duration;
    this.maxTimer = duration;
    this.alive = true;
  }
  update(dt) {
    if (!this.alive) return;
    this.timer -= dt;
    if (this.timer <= 0) { this.alive = false; return; }
    for (const e of enemies) {
      if (e.alive && dist(this, e) <= this.radius) {
        e.takeDamage(this.dps * dt);
      }
    }
  }
  draw(ctx) {
    const alpha = Math.min(1, (this.timer / this.maxTimer) * 2);
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.5;
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}
