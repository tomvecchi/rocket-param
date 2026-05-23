import { PROPS } from '../config/propellants.js';
import { PROP_COST, TANK_COST, ENGINE_COST_PER_KN, OTHER_STRUCT_COST } from '../config/costs.js';

function stageUnitCost(s) {
  const propCost   = s.propMass * PROP_COST[s.propellant];
  const tankCost   = (s.sigmaBreakdown.tank * s.propMass) * TANK_COST[s.tankMaterial];
  const otherCost  = (s.sigmaBreakdown.other * s.propMass) * OTHER_STRUCT_COST;
  let engineCost = 0;
  if (s.sigmaBreakdown.engineCount !== null) {
    engineCost = Math.ceil(s.sigmaBreakdown.engineCount)
               * s.thrustPerEngine
               * ENGINE_COST_PER_KN[s.engineType];
  }
  return { propCost, tankCost, engineCost, otherCost };
}

// Returns per-stage costs, booster cost (total for all units), and vehicle totals.
export function calcCost(phys) {
  const stages = phys.stages.map(s => {
    const c = stageUnitCost(s);
    return { ...c, total: c.propCost + c.tankCost + c.engineCost + c.otherCost };
  });

  let booster = null;
  if (phys.booster) {
    const br = phys.booster;
    const c  = stageUnitCost(br);
    const n  = br.count;
    booster  = {
      propCost:  c.propCost  * n,
      tankCost:  c.tankCost  * n,
      engineCost: c.engineCost * n,
      otherCost: c.otherCost * n,
      total: (c.propCost + c.tankCost + c.engineCost + c.otherCost) * n,
    };
  }

  const all   = [...stages, ...(booster ? [booster] : [])];
  const total = all.reduce((a, c) => a + c.total, 0);
  const propTotal   = all.reduce((a, c) => a + c.propCost,   0);
  const tankTotal   = all.reduce((a, c) => a + c.tankCost,   0);
  const engineTotal = all.reduce((a, c) => a + c.engineCost, 0);
  const otherTotal  = all.reduce((a, c) => a + c.otherCost,  0);

  return { stages, booster, total, propTotal, tankTotal, engineTotal, otherTotal };
}
