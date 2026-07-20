function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = getCanvasCoords(e);
  game.mouseX = x;
  game.mouseY = y;

  if (game.placementMode) {
    const def = TOWER_TYPES[game.placementMode];
    let valid = true;
    if (game.coins < def.cost) valid = false;
    if (isOnRoad(x, y)) valid = false;
    if (isOverlapping(x, y)) valid = false;
    game.placementValid = valid;
    canvas.style.cursor = 'crosshair';
  } else {
    let cursor = 'default';
    for (const t of towers) {
      if (Math.hypot(x - t.x, y - t.y) < t.size + 4) {
        cursor = 'pointer';
        break;
      }
    }
    canvas.style.cursor = cursor;
  }
});

canvas.addEventListener('click', (e) => {
  if (game.state === 'gameOver' || game.state === 'victory') return;
  const { x, y } = getCanvasCoords(e);

  if (game.placementMode) {
    if (game.placementValid) {
      buildTower(x, y, game.placementMode);
    }
    return;
  }

  let clicked = null;
  for (const t of towers) {
    if (Math.hypot(x - t.x, y - t.y) < t.size + 4) {
      clicked = t;
      break;
    }
  }
  if (clicked) {
    game.selectedTower = clicked;
    showTowerInfo(clicked);
  } else {
    game.selectedTower = null;
    hideTowerInfo();
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (game.placementMode) {
    game.placementMode = null;
    document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('active'));
    canvas.style.cursor = 'default';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && game.placementMode) {
    game.placementMode = null;
    document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('active'));
    canvas.style.cursor = 'default';
  }
});
