const SKILL_TREE = {
  points: 0,
  skills: {
    maxTowers: {
      name: 'Tower Limit',
      level: 0, maxLevel: 5,
      costs: [1, 1, 2, 2, 3],
      bonus: [1, 2, 3, 4, 5],
      desc: '+1 tower per level',
    },
    startCoins: {
      name: 'Starting Gold',
      level: 0, maxLevel: 5,
      costs: [1, 1, 2, 2, 3],
      bonus: [50, 100, 150, 200, 300],
      desc: '+$50 starting coins per level',
    },
    costReduction: {
      name: 'Discount',
      level: 0, maxLevel: 5,
      costs: [1, 2, 2, 3, 3],
      bonus: [0.05, 0.10, 0.15, 0.20, 0.25],
      desc: '5% off tower cost per level',
    },
  },
};

function saveSkills() {
  try { localStorage.setItem('tdSkills', JSON.stringify(SKILL_TREE)); } catch (e) {}
}

function loadSkills() {
  try {
    const raw = localStorage.getItem('tdSkills');
    if (raw) {
      const data = JSON.parse(raw);
      SKILL_TREE.points = data.points || 0;
      for (const key of Object.keys(SKILL_TREE.skills)) {
        if (data.skills && data.skills[key]) {
          SKILL_TREE.skills[key].level = data.skills[key].level || 0;
        }
      }
    }
  } catch (e) {}
}

function spendSkillPoint(key) {
  const skill = SKILL_TREE.skills[key];
  if (!skill || skill.level >= skill.maxLevel) return false;
  const cost = skill.costs[skill.level];
  if (SKILL_TREE.points < cost) return false;
  SKILL_TREE.points -= cost;
  skill.level++;
  saveSkills();
  return true;
}

function awardSkillPoints(amount) {
  SKILL_TREE.points += amount;
  saveSkills();
}
