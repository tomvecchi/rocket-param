// Engine cycle types: each implies a characteristic tank pressure and engine T/W.
// tankPressure (bar): minimum required NPSP + line losses for pump-fed; full propellant
//   head pressure for pressure-fed.
// engineTW: vacuum engine thrust-to-weight (dimensionless), used for engine mass fraction.
export const ENGINE_TYPES = {
  'pump-fed':      { name: 'Turbopump',      tankPressure: 3,  engineTW: 140 },
  'electric-pump': { name: 'Electric pump',  tankPressure: 6,  engineTW: 80  },
  'pressure-fed':  { name: 'Pressure-fed',   tankPressure: 25, engineTW: 50  },
};

// Solid motor case pressure (bar) — used in Barlow formula for the motor casing.
export const SOLID_CASE_PRESSURE = 60;
