import { G0, PROPS } from '../config/propellants.js';
import { TANK_MATERIALS } from '../config/materials.js';
import { ENGINE_TYPES, SOLID_CASE_PRESSURE, PLUMBING_FRAC } from '../config/engines.js';
import { state } from './state.js';

const TANK_SF = 1.5; // aerospace pressure vessel safety factor

// Barlow's formula for cylindrical tank + hemispherical caps, normalised by propellant mass.
// Returns { tank, engine, other, total, engineCount } — sigmas are dimensionless mass fractions.
export function calcSigma(stage, stageIndex) {
  const prop = PROPS[stage.propellant];
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
    const isp         = stageIndex === 0 ? prop.isp_sl : prop.isp_vac;
    const propMass    = Math.PI * (d / 2) ** 2 * h * fill * prop.density;
    const totalThrust = propMass * isp * G0 / stage.burnTime; // N
    // Round up: you must buy whole engines; any surplus thrust capacity is dead mass.
    engineCount = Math.ceil(totalThrust / (stage.thrustPerEngine * 1000));
    // Per-engine mass at rated thrust; if engineCount > raw count the engine is oversized,
    // so this correctly scales mass with the (surplus) rated thrust rather than actual thrust.
    const perEngineMass = (stage.thrustPerEngine * 1000) / (engineTW * G0); // kg
    // Each engine beyond the first adds plumbing overhead (feed lines, valves, manifold).
    const plumbingMass  = (engineCount - 1) * PLUMBING_FRAC * perEngineMass; // kg
    engine = (engineCount * perEngineMass + plumbingMass) / propMass;
  }

  const other = prop.sigmaOther;
  return { tank, engine, other, total: tank + engine + other, engineCount };
}

export function calcPhysics(payload = 0) {
  const { stages, boosters } = state;

  const sd = stages.map((s, i) => {
    const p              = PROPS[s.propellant];
    const sigmaBreakdown = calcSigma(s, i);
    const sigma          = sigmaBreakdown.total;
    const propVol        = Math.PI * (s.diameter / 2) ** 2 * s.height * s.fill;
    const propMass       = propVol * p.density;
    const dryMass        = sigma * propMass;
    const wetMass        = propMass + dryMass;
    return { ...s, p, sigma, sigmaBreakdown, propMass, dryMass, wetMass };
  });

  // Stage 0 = bottom (first to fire), Stage N-1 = top
  const results = sd.map((s, i) => {
    const above  = sd.slice(i + 1).reduce((a, x) => a + x.wetMass, 0) + payload;
    const m0     = s.wetMass + above;
    const m1     = s.dryMass + above;
    const mr     = m0 / m1;
    const isp    = i === 0 ? s.p.isp_sl : s.p.isp_vac;
    const dv     = isp * G0 * Math.log(mr);
    const thrust = (s.propMass / s.burnTime) * isp * G0;
    return { ...s, above, m0, m1, mr, isp, dv, thrust };
  });

  // Boosters: parallel pre-stage exhausted before core ignition.
  let boosterResult = null;
  if (boosters.count > 0) {
    const n              = boosters.count;
    const p              = PROPS[boosters.propellant];
    const sigmaBreakdown = calcSigma(boosters, 0);
    const sig            = sigmaBreakdown.total;
    const propVol  = Math.PI * (boosters.diameter / 2) ** 2 * boosters.height * boosters.fill;
    const propMass = propVol * p.density;
    const dryMass  = sig * propMass;
    const wetMass  = propMass + dryMass;
    const coreStack = sd.reduce((a, x) => a + x.wetMass, 0) + payload;
    const m0b = n * wetMass + coreStack;
    const m1b = n * dryMass + coreStack;
    const isp = p.isp_sl;
    const dv  = isp * G0 * Math.log(m0b / m1b);
    const thrustPerUnit = (propMass / boosters.burnTime) * isp * G0;
    boosterResult = {
      count: n, p, sigma: sig, sigmaBreakdown, propMass, dryMass, wetMass,
      m0: m0b, m1: m1b, mr: m0b / m1b, isp, dv, thrust: thrustPerUnit,
      diameter: boosters.diameter, height: boosters.height,
      propellant: boosters.propellant, thrustPerEngine: boosters.thrustPerEngine,
      tankMaterial: boosters.tankMaterial, engineType: boosters.engineType,
    };
  }

  const boosterWet = boosterResult ? boosterResult.count * boosterResult.wetMass : 0;
  const totalDv    = (boosterResult ? boosterResult.dv : 0)
                   + results.reduce((a, s) => a + s.dv, 0);
  const totalWet   = sd.reduce((a, s) => a + s.wetMass, 0) + payload + boosterWet;

  return { stages: results, booster: boosterResult, totalDv, totalWet };
}

// ΔV_total(payload) is strictly decreasing; bisect to find max payload at targetDv.
// Returns null if unreachable even at zero payload.
// 23 iterations → ~0.6 kg precision over a 5,000 t search range.
export function calcMaxPayload(targetDv) {
  if (calcPhysics(0).totalDv < targetDv) return null;
  let lo = 0, hi = 5_000_000;
  for (let i = 0; i < 23; i++) {
    const mid = (lo + hi) / 2;
    if (calcPhysics(mid).totalDv >= targetDv) lo = mid; else hi = mid;
  }
  return lo;
}
