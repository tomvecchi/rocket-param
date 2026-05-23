// Blended propellant cost ($/kg of mixture), derived from component costs
// weighted by mass fraction at nominal O/F ratio.
export const PROP_COST = {
  'LOX/LH2':      0.46,   // 85.7% LOX @ $0.12, 14.3% LH2 @ $2.50
  'LOX/CH4':      0.14,   // 78% LOX, 22% CH4 @ $0.20
  'LOX/RP-1':     0.28,   // 73% LOX, 27% RP-1 @ $0.70
  'LOX/NH3':      0.24,   // 57% LOX, 43% NH3 @ $0.40
  'N2O4/UDMH':   18.40,   // 72% N2O4 @ $12, 28% UDMH @ $35
  'Solid':         8.00,   // HTPB solid
  'H2O2/HTPB':         22,   // Both on the order of $20-25 so ratio doesn't matter much
  'Fluorine/LH2':  7.31,   // 87.5% F2 @ $8, 12.5% LH2 @ $2.50
};

// Tank manufacturing cost ($/kg of tank structure).
// Includes material, machining, welding, NDT, and tooling amortised over a production run.
export const TANK_COST = {
  'Al-2219': 2_000,
  'Al-Li':   5_000,
  'CFRP':   15_000,
  'Steel':     800,
};

// Engine cost ($/kN of thrust per engine), by cycle type.
export const ENGINE_COST_PER_KN = {
  'pump-fed':      3_000,
  'electric-pump': 1_500,
  'pressure-fed':    500,
};

// Generic other-structure cost ($/kg) — avionics, thrust structure, interstage, fairing.
export const OTHER_STRUCT_COST = 2_000;
