loadSkills();

upgradeBtn.addEventListener('click', () => {
  if (game.selectedTower && game.selectedTower.canEvolve()) {
    const options = game.selectedTower.getEvolveOptions();
    if (options.length === 1) {
      evolveSelectedTower(options[0].key);
    }
  } else {
    upgradeSelectedTower();
  }
});
sellBtn.addEventListener('click', sellSelectedTower);
document.getElementById('restart-go').addEventListener('click', restartGame);
document.getElementById('restart-vic').addEventListener('click', restartGame);
startBtn.addEventListener('click', startWave);

initMenu();
buildTowerInventory();
renderSkillTree();
requestAnimationFrame(gameLoop);
