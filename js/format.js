export function fmass(kg) {
  if (kg >= 1e6) return `${(kg / 1e6).toFixed(2)} kt`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg)} kg`;
}

export function fdv(ms) {
  return (ms / 1000).toFixed(2);
}

export function fcost(usd) {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)} B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)} M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)} k`;
  return `$${Math.round(usd)}`;
}

export function fthrust(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MN`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kN`;
  return `${Math.round(n)} N`;
}
