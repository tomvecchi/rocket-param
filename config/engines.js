// Engine cycle types: each implies a characteristic tank pressure and engine T/W.
// tankPressure (bar): minimum required NPSP + line losses for pump-fed; full propellant
//   head pressure for pressure-fed.
// engineTW: vacuum engine thrust-to-weight (dimensionless), used for engine mass fraction.
export const ENGINE_TYPES = {
  'pump-fed':      { name: 'Turbopump',      tankPressure: 3,  engineTW: 140 },
  'electric-pump': { name: 'Electric pump',  tankPressure: 6,  engineTW: 80  },
  'pressure-fed':  { name: 'Pressure-fed',   tankPressure: 25, engineTW: 50  },
};

// Plumbing overhead fraction: each engine beyond the first adds this fraction of one engine's
// mass to account for its own feed lines, valves, manifold, and ignition hardware.
export const PLUMBING_FRAC = 0.15;

// Solid motor case pressure (bar) — used in Barlow formula for the motor casing.
export const SOLID_CASE_PRESSURE = 60;

// Solid motors have no engine count to derive a burn time from: it is set by the
// grain's web thickness, which scales with the motor, so burn time stays roughly
// constant across sizes. Shuttle SRB 124 s, Ariane 5 EAP 130 s, Atlas V SRB 90 s.
export const SOLID_BURN_TIME = 120; // s
