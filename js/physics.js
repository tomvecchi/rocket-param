import { G0 } from '../config/propellants.js';
import { TANK_MATERIALS } from '../config/materials.js';
import { ENGINE_TYPES, SOLID_CASE_PRESSURE, SOLID_BURN_TIME, PLUMBING_FRAC } from '../config/engines.js';
import { resolveProp } from '../config/propellant_components.js';
import { simulateAscent, leoRequirement, ASCENT } from './trajectory.js';
import { state } from './state.js';

const TANK_SF = 1.5; // aerospace pressure vessel safety factor

// Barlow's formula for cylindrical tank + hemispherical caps, normalised by propellant mass.
// Returns { tank, engine, other, total, engineCount } — sigmas are dimensionless mass fractions.
export function calcSigma(stage) {
  const prop = resolveProp(stage.oxidiser, stage.fuel);
  const mat  = TANK_MATERIALS[stage.tankMaterial];
  const { diameter: d, height: h, fill } = stage;

  const tankPressure = prop.solid
    ? SOLID_CASE_PRESSURE
    : ENGINE_TYPES[stage.engineType].tankPressure;
  const P = tankPressure * 1e5; // bar → Pa

  const tank = (2 * P * TANK_SF * (mat.rho / mat.sigmaY) * (h + d))
             / (prop.density * fill * h);

  let engine = 0, engineCount = null;
  if (!prop.solid) {
    const { engineTW } = ENGINE_TYPES[stage.engineType];
    const propMass    = Math.PI * (d / 2) ** 2 * h * fill * prop.density;
    engineCount = stage.engineCount;
    const perEngineMass = (stage.thrustPerEngine * 1000) / (engineTW * G0); // kg
    // Each engine beyond the first adds plumbing overhead (feed lines, valves, manifold).
    const plumbingMass  = (engineCount - 1) * PLUMBING_FRAC * perEngineMass; // kg
    engine = (engineCount * perEngineMass + plumbingMass) / propMass;
  }

  const other = prop.sigmaOther;
  return { tank, engine, other, total: tank + engine + other, engineCount };
}

// Burn time is an output, not an input: the cluster's rated thrust fixes the mass
// flow and the propellant load divides by it. Thrust is rated at the condition the
// stage characteristically flies in — sea level for whatever lights on the pad,
// vacuum above. Solid motors have no engine count; their burn time is a constant.
function burnTimeOf(stage, prop, propMass, atSeaLevel) {
  if (prop.solid) return SOLID_BURN_TIME;
  const isp = atSeaLevel ? prop.isp_sl : prop.isp_vac;
  return propMass * isp * G0 / (stage.engineCount * stage.thrustPerEngine * 1000);
}

export function calcPhysics(payload = 0) {
  const { stages, boosters } = state;

  const sd = stages.map((s, i) => {
    const p              = resolveProp(s.oxidiser, s.fuel);
    const sigmaBreakdown = calcSigma(s);
    const sigma          = sigmaBreakdown.total;
    const propVol        = Math.PI * (s.diameter / 2) ** 2 * s.height * s.fill;
    const propMass       = propVol * p.density;
    const dryMass        = sigma * propMass;
    const wetMass        = propMass + dryMass;
    const burnTime       = burnTimeOf(s, p, propMass, i === 0);
    return { ...s, p, sigma, sigmaBreakdown, propMass, dryMass, wetMass, burnTime };
  });

  let bd = null;
  if (boosters.count > 0) {
    const p              = resolveProp(boosters.oxidiser, boosters.fuel);
    const sigmaBreakdown = calcSigma(boosters);
    const propVol  = Math.PI * (boosters.diameter / 2) ** 2 * boosters.height * boosters.fill;
    const propMass = propVol * p.density;
    const dryMass  = sigmaBreakdown.total * propMass;
    bd = { p, sigmaBreakdown, sigma: sigmaBreakdown.total, propMass, dryMass,
           wetMass: propMass + dryMass, count: boosters.count,
           burnTime: burnTimeOf(boosters, p, propMass, true) };
  }

  const area      = d => Math.PI * (d / 2) ** 2;
  const coreArea  = area(Math.max(...stages.map(s => s.diameter)));
  const coreStack = sd.reduce((a, x) => a + x.wetMass, 0) + payload;
  const above     = i => sd.slice(i + 1).reduce((a, x) => a + x.wetMass, 0) + payload;

  // One burner per stage, plus the boosters as a single cluster. Burner 0 is the
  // boosters when fitted, so stage i is burner i + offset.
  const offset  = bd ? 1 : 0;
  const burners = [];
  if (bd) burners.push({
    propMass: bd.count * bd.propMass,
    mdot: bd.count * bd.propMass / bd.burnTime,
    ispSl: bd.p.isp_sl, ispVac: bd.p.isp_vac,
  });
  sd.forEach(s => burners.push({
    propMass: s.propMass, mdot: s.propMass / s.burnTime,
    ispSl: s.p.isp_sl, ispVac: s.p.isp_vac,
  }));

  // Boosters and the first stage light together at liftoff and the first stage
  // keeps firing after they separate, which is how strap-on vehicles actually fly.
  const phases = [];
  if (bd) phases.push({
    active: [0, 1], primary: 0, jettison: bd.count * bd.dryMass,
    area: coreArea + bd.count * area(boosters.diameter),
  });
  sd.forEach((s, i) => phases.push({
    active: [i + offset], primary: i + offset, area: coreArea, jettison: s.dryMass,
  }));

  const gross          = coreStack + (bd ? bd.count * bd.wetMass : 0);
  const traj           = simulateAscent(burners, phases, gross, ASCENT);
  const dvRequiredLeo  = leoRequirement(traj, ASCENT);

  // Stage 0 = bottom (first to fire), Stage N-1 = top
  const results = sd.map((s, i) => {
    const m0     = s.wetMass + above(i);
    const m1     = s.dryMass + above(i);
    const mr     = m0 / m1;
    const { ispEff: isp, dv } = traj.burners[i + offset];
    const thrust = (s.propMass / s.burnTime) * isp * G0;
    return { ...s, above: above(i), m0, m1, mr, isp, dv, thrust };
  });

  let boosterResult = null;
  if (bd) {
    const m0b = bd.count * bd.wetMass + coreStack;
    const m1b = bd.count * bd.dryMass + coreStack;
    const { ispEff: isp, dv } = traj.burners[0];
    boosterResult = {
      ...bd, m0: m0b, m1: m1b, mr: m0b / m1b, isp, dv,
      thrust: (bd.propMass / bd.burnTime) * isp * G0,
      oxidiser: boosters.oxidiser, fuel: boosters.fuel,
      diameter: boosters.diameter, height: boosters.height,
      thrustPerEngine: boosters.thrustPerEngine,
      tankMaterial: boosters.tankMaterial, engineType: boosters.engineType,
    };
  }

  // Taken from the integration rather than summing rocket-equation terms, because
  // under parallel burn a stage's mass ratio no longer describes what it delivered.
  const totalDv  = traj.dvIdeal;
  const totalWet = gross;

  return { stages: results, booster: boosterResult, totalDv, totalWet, traj, dvRequiredLeo };
}

// Both sides move with payload — ΔV_total falls while the ascent losses (and so the
// requirement) rise — but the margin between them is still strictly decreasing, so
// bisection holds. 23 iterations → ~0.6 kg precision over a 5,000 t search range.
//
// Returns { payload, cannotLift, overQ, maxQ }; payload is null when the design
// cannot reach the orbit at all. Max-Q is evaluated at the winning payload, which
// is the gentlest case — a heavier stack accelerates less and sees lower q — so if
// it busts the limit there, it busts it at every viable payload.
export function calcMaxPayload(dvBeyondLeo) {
  const margin = p => {
    const r = calcPhysics(p);
    return { value: r.totalDv - (r.dvRequiredLeo + dvBeyondLeo), traj: r.traj };
  };

  const atZero = margin(0);
  if (atZero.traj.cannotLift || atZero.value < 0) {
    return { payload: null, cannotLift: atZero.traj.cannotLift,
             overQ: atZero.traj.overQ, maxQ: atZero.traj.maxQ };
  }

  let lo = 0, hi = 5_000_000;
  for (let i = 0; i < 23; i++) {
    const mid = (lo + hi) / 2;
    if (margin(mid).value >= 0) lo = mid; else hi = mid;
  }
  const final = margin(lo);
  return { payload: lo, cannotLift: false,
           overQ: final.traj.overQ, maxQ: final.traj.maxQ };
}
