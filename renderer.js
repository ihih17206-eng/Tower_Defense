function drawField() {
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(0, 0, 900, 600);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 900; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(900, y); ctx.stroke();
  }
}

function drawOneRoad(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function drawRoad() {
  ctx.strokeStyle = '#8B8B7A';
  ctx.lineWidth = 40;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawOneRoad(PATH_WAYPOINTS.L);
  drawOneRoad(PATH_WAYPOINTS.R);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  drawOneRoad(PATH_WAYPOINTS.L);
  drawOneRoad(PATH_WAYPOINTS.R);
  ctx.setLineDash([]);
}

function drawTowerRange(tower) {
  if (!tower) return;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawPlacementGhost() {
  if (!game.placementMode) return;
  const def = TOWER_TYPES[game.placementMode];
  const valid = game.placementValid;
  const ok = valid ? '46,204,113' : '231,76,60';
  ctx.fillStyle = `rgba(${ok},0.15)`;
  ctx.strokeStyle = `rgba(${ok},0.35)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(game.mouseX, game.mouseY, def.baseStats.range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${ok},0.45)`;
  ctx.beginPath();
  ctx.arc(game.mouseX, game.mouseY, def.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(${ok},0.7)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(game.mouseX, game.mouseY, def.size + 4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCountdown() {
  if (game.state === 'betweenWaves' && game.waveCooldown > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 250, 900, 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Next wave in ${Math.ceil(game.waveCooldown)}...`, 450, 280);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('or click Start Wave', 450, 310);
  }
}

function drawNapalmZones() {
  for (const nz of napalmZones) nz.draw(ctx);
}

function drawBossHP() {
  const bosses = enemies.filter(e => e.alive && e.isBoss);
  if (bosses.length === 0) return;
  const barWidth = 500;
  const barHeight = 24;
  const cx = 450;
  const startY = 8;
  for (let bi = 0; bi < bosses.length; bi++) {
    const boss = bosses[bi];
    const y = startY + bi * (barHeight + 6);
    const x = cx - barWidth / 2;
    const pct = boss.hp / boss.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x - 4, y - 2, barWidth + 8, barHeight + 4);
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = pct > 0.5 ? '#27ae60' : pct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(x, y, barWidth * pct, barHeight);
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`BOSS  ${Math.ceil(boss.hp)} / ${boss.maxHp}`, cx, y + barHeight / 2);
  }
}

function render() {
  drawField();
  drawRoad();
  drawBossHP();
  drawNapalmZones();
  for (const t of towers) t.draw(ctx);
  if (game.selectedTower) drawTowerRange(game.selectedTower);
  for (const e of enemies) e.draw(ctx);
  for (const p of projectiles) p.draw(ctx);
  for (const p of particles) p.draw(ctx);
  drawPlacementGhost();
  drawCountdown();
}
