import { G0 } from '../config/propellants.js';

const R_EARTH = 6_371_000;      // m
const MU      = 3.986004418e14; // m^3/s^2
const RHO0    = 1.225;          // kg/m^3
const P0      = 101_325;        // Pa
const H_SCALE = 8_500;          // m, exponential atmosphere scale height
const V_ROT   = 465.1;          // m/s, equatorial surface rotation speed

// Ascent assumptions. All vehicles are flown against this same prescribed pitch
// profile — this is a comparative estimator, not a trajectory optimiser.
export const ASCENT = {
  targetAltitude: 200_000, // m, circular orbit the budget is quoted against
  launchLatitude: 28.5,    // deg, Cape Canaveral
  launchAzimuth:  90,      // deg, due east
  pitchExponent:  0.315,   // shape of the pitchover; lower = pitches over sooner
  steeringLoss:   50,      // m/s, flat allowance for non-tangential thrust
  cdScale:        1.0,     // global drag multiplier for calibration
  accelMax:       4.5,     // g, axial acceleration cap; the vehicle throttles to hold it
  maxQLimit:      50_000,  // Pa, structural ceiling on dynamic pressure
  dt:             0.5,     // s, integration step
};

// Exponential atmosphere. Good to ~30 km, and above that both terms are
// negligible for drag and for Isp blending.
function atmosphere(h) {
  const f = Math.exp(-h / H_SCALE);
  return { rho: RHO0 * f, pressure: P0 * f, soundSpeed: soundSpeed(h) };
}

function soundSpeed(h) {
  const km = h / 1000;
  if (km < 11) return 340.3 - 4.0 * km;
  if (km < 20) return 295.0;
  if (km < 32) return 295.0 + (km - 20) * (303 - 295) / 12;
  if (km < 47) return 303.0 + (km - 32) * (329 - 303) / 15;
  return 329.0;
}

// Blunt-body drag curve: subsonic plateau, transonic peak, hypersonic decay.
const CD_TABLE = [[0, 0.30], [0.8, 0.32], [1.2, 0.60], [2.0, 0.45], [4.0, 0.30], [6.0, 0.25]];

function dragCoefficient(mach) {
  const t = CD_TABLE;
  if (mach <= t[0][0]) return t[0][1];
  if (mach >= t[t.length - 1][0]) return t[t.length - 1][1];
  for (let i = 1; i < t.length; i++) {
    if (mach <= t[i][0]) {
      const [m0, c0] = t[i - 1], [m1, c1] = t[i];
      return c0 + (c1 - c0) * (mach - m0) / (m1 - m0);
    }
  }
  return t[t.length - 1][1];
}

// Prescribed pitch profile, keyed on altitude: vertical off the pad, pitching
// over as a power law in altitude, horizontal on arrival at the target orbit.
// Keying on altitude rather than speed makes the profile self-terminating (γ→0
// as h→target, so dh/dt→0) and keeps the TWR trade honest: a sluggish vehicle
// spends longer at high γ and eats the gravity loss for it.
// Returns the flight path angle in rad.
export function pitchAngle(h, opts = ASCENT) {
  const frac = h / opts.targetAltitude;
  if (frac >= 1) return 0;
  return (Math.PI / 2) * (1 - Math.pow(frac, opts.pitchExponent));
}

const gravity = h => MU / (R_EARTH + h) ** 2;

export const orbitalVelocity = alt => Math.sqrt(MU / (R_EARTH + alt));

// Eastward launch from a rotating Earth starts with this much velocity for free.
export function rotationCredit(opts = ASCENT) {
  const lat = opts.launchLatitude * Math.PI / 180;
  const az  = opts.launchAzimuth  * Math.PI / 180;
  return V_ROT * Math.cos(lat) * Math.sin(az);
}

/**
 * Integrate a powered ascent to accumulate the loss budget.
 *
 * burners: propellant sources, each { propMass, mdot, ispSl, ispVac }. A burner
 *   persists across phases, so a core stage that lights alongside the boosters
 *   and keeps firing after they separate is one burner spanning two phases.
 * phases: ordered segments, each { active, primary, area, jettison }
 *   active   indices of the burners firing during this phase
 *   primary  index of the burner whose burnout ends the phase
 *   area     frontal reference area during the phase (m^2)
 *   jettison dry mass dropped at the end of the phase (kg)
 * m0: gross liftoff mass (kg).
 *
 * Returns the ΔV integrals plus per-burner attribution and diagnostics.
 */
export function simulateAscent(burners, phases, m0, opts = ASCENT) {
  let v = 0, h = 0, t = 0, m = m0;
  let dvIdeal = 0, dvGrav = 0, dvDrag = 0;
  let maxQ = 0, maxQAlt = 0, liftoffTwr = null;
  let throttleTime = 0, peakAccel = 0;

  const b = burners.map(x => ({ ...x, left: x.propMass, dv: 0, ispPropSum: 0, burned: 0 }));

  for (const ph of phases) {
    const primary  = b[ph.primary];
    const active   = ph.active.map(i => b[i]);
    const nominal  = active.reduce((a, x) => a + x.mdot, 0);
    // Headroom for throttling, but hard-capped: an under-engined stage can ask for
    // a burn of arbitrary length, and the loop must not become unbounded work.
    const maxSteps = nominal > 0
      ? Math.min(Math.ceil(5 * primary.propMass / (primary.mdot * opts.dt)), 8000)
      : 0;

    for (let i = 0; i < maxSteps && primary.left > 0; i++) {
      const { rho, pressure, soundSpeed: a } = atmosphere(h);

      // Full-throttle thrust from every burner that still has propellant.
      let full = 0;
      for (const x of active) {
        x.isp    = x.ispVac - (x.ispVac - x.ispSl) * (pressure / P0);
        x.thrust = x.left > 0 ? x.mdot * x.isp * G0 : 0;
        full += x.thrust;
      }
      if (full <= 0) break;

      // The acceleration cap throttles the whole cluster together.
      const cap      = opts.accelMax * G0 * m;
      const throttle = full > cap ? cap / full : 1;
      const thrust   = full * throttle;

      // Never step past the primary burner's burnout.
      let dt = opts.dt;
      if (primary.left > 0) dt = Math.min(dt, primary.left / (primary.mdot * throttle));

      const q     = 0.5 * rho * v * v;
      const drag  = q * dragCoefficient(v / a) * ph.area * opts.cdScale;
      const gamma = pitchAngle(h, opts);

      if (liftoffTwr === null) liftoffTwr = thrust / (m * G0);
      if (q > maxQ) { maxQ = q; maxQAlt = h; }
      if (throttle < 1) throttleTime += dt;

      const aThrust = thrust / m;
      const aDrag   = drag / m;
      const aGrav   = gravity(h) * Math.sin(gamma);
      if (aThrust / G0 > peakAccel) peakAccel = aThrust / G0;

      dvIdeal += aThrust * dt;
      dvGrav  += aGrav   * dt;
      dvDrag  += aDrag   * dt;

      // Attribute ΔV to each burner by its share of the impulse, so a stage that
      // burns alongside the boosters is credited for exactly what it contributed.
      for (const x of active) {
        if (x.left <= 0) continue;
        const used = x.mdot * throttle * dt;
        x.dv         += (x.thrust * throttle / m) * dt;
        x.ispPropSum += x.isp * used;
        x.burned     += used;
        x.left       -= used;
        m            -= used;
      }

      // Semi-implicit Euler: advance speed first, then integrate altitude with it.
      v = Math.max(0, v + (aThrust - aDrag - aGrav) * dt);
      h = Math.max(0, h + v * Math.sin(gamma) * dt);
      t += dt;
    }
    m -= ph.jettison;
  }

  return {
    dvIdeal, dvGrav, dvDrag,
    dvLosses: dvGrav + dvDrag + opts.steeringLoss,
    burners: b.map(x => ({
      dv: x.dv,
      ispEff: x.burned > 0 ? x.ispPropSum / x.burned : x.ispVac,
      burned: x.burned,
    })),
    finalVelocity: v, finalAltitude: h, burnDuration: t,
    maxQ, maxQAlt, liftoffTwr, throttleTime, peakAccel,
    // Airframe mass is not modelled as a function of aero load, so an over-thrusted
    // design would otherwise be rewarded for a max-Q no real vehicle would fly.
    overQ: maxQ > opts.maxQLimit,
    cannotLift: liftoffTwr !== null && liftoffTwr < 1,
  };
}

// ΔV a vehicle must produce ideally to reach the target circular orbit, given
// the losses its own thrust profile incurs.
export function leoRequirement(ascent, opts = ASCENT) {
  return orbitalVelocity(opts.targetAltitude) - rotationCredit(opts) + ascent.dvLosses;
}
