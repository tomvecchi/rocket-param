// Per-component propellant costs ($/kg), used to compute blended mixture cost at the O/F ratio.
export const OX_COST = {
  Lox:        0.12,
  N2O4:      12.00,
  H2O2:      25.00,   // 90% rocket grade
  MON:       15.00,
  NitricAcid: 2.00,
  N2O:        4.00,
  LF2:        8.00,
  CF2:       50.00,
  ClF3:      50.00,
  ClO3F:     40.00,
  BrF5:      80.00,
};

export const FUEL_COST = {
  Kerosene:    0.70,
  LCH4:        0.20,
  Ethane:      0.30,   // natural gas byproduct
  Propane:     0.80,   // commodity LPG
  Butane:      0.90,   // commodity LPG
  Furfuryl:    2.00,   // bio-derived from furfural
  Cyclopropane: 6.00,  // specialty chemical
  Propyne:    10.00,   // methylacetylene, specialty chemical
  LH2:         2.50,
  Ammonia:     0.40,
  Alcohol:     1.00,
  Hydyne:     30.00,
  'JP-X':     18.00,
  UDMH:       35.00,
  LLi:        25.80,
  MMH:        40.00,
  Hydrazine:  20.00,
  Solid:      12.00,   // HTPB hybrid grain
};

export const SOLID_PROP_COST = 8.00;   // complete SRM grain (HTPB/AP composite) $/kg

// Tank manufacturing cost ($/kg of tank structure).
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
