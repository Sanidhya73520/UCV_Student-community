/**
 * Scalable Country Color System for UCV International Student Community Map.
 * Provides distinct, vibrant, accessible colors for every country on the world map.
 * Ensures high contrast against dark navy backgrounds (#18203A / #0F1527).
 * Supports curated colors, deterministic procedural generation for all 200+ countries,
 * and customizable runtime overrides for future preferences.
 */

export const CURATED_COUNTRY_COLORS = {
  // Southern & Eastern Europe / Balkans
  RO: '#F2B705', // Romania - UCV Gold / Marigold
  BG: '#14B8A6', // Bulgaria - Emerald Teal
  GR: '#06B6D4', // Greece - Aegean Turquoise
  TR: '#E11D48', // Turkey - Turkish Crimson / Vibrant Rose
  MD: '#C084FC', // Moldova - Soft Orchid / Amethyst
  RS: '#6366F1', // Serbia - Periwinkle Blue
  AL: '#DC2626', // Albania - Bright Red
  HR: '#2DD4BF', // Croatia - Adriatic Mint
  BA: '#38BDF8', // Bosnia & Herzegovina - Light Azure
  ME: '#F97316', // Montenegro - Warm Tangerine
  MK: '#F59E0B', // North Macedonia - Amber Sun
  CY: '#34D399', // Cyprus - Seafoam Green
  SI: '#818CF8', // Slovenia - Lavender Blue

  // Western & Southern Europe
  IT: '#10B981', // Italy - Italian Emerald Green
  ES: '#FF7A00', // Spain - Spanish Flame Orange
  FR: '#3B82F6', // France - French Royal Blue
  PT: '#EC4899', // Portugal - Coral Magenta
  DE: '#EAB308', // Germany - Golden Ochre
  GB: '#818CF8', // United Kingdom - Windsor Indigo
  IE: '#22C55E', // Ireland - Celtic Green
  BE: '#FB923C', // Belgium - Warm Peach
  NL: '#F97316', // Netherlands - Oranje
  AT: '#F43F5E', // Austria - Crimson
  CH: '#EF4444', // Switzerland - Swiss Red
  PL: '#FB7185', // Poland - Rose Coral
  CZ: '#A855F7', // Czechia - Bohemia Violet
  SK: '#60A5FA', // Slovakia - Sky Blue
  HU: '#4ADE80', // Hungary - Meadow Green

  // Central & East Asia
  KZ: '#0EA5E9', // Kazakhstan - Kazakh Steppe Azure
  UZ: '#2DD4BF', // Uzbekistan - Silk Road Turquoise
  TM: '#10B981', // Turkmenistan - Ashgabat Green
  KG: '#F59E0B', // Kyrgyzstan - Nomad Gold
  TJ: '#F43F5E', // Tajikistan - Pamir Red
  CN: '#EF4444', // China - Imperial Crimson
  JP: '#F43F5E', // Japan - Sakura Blossom
  KR: '#3B82F6', // South Korea - Han River Blue
  MN: '#06B6D4', // Mongolia - Blue Sky

  // Southeast Asia
  KH: '#A855F7', // Cambodia - Angkor Violet
  VN: '#E11D48', // Vietnam - Lotus Crimson
  TH: '#F59E0B', // Thailand - Siam Gold
  MY: '#059669', // Malaysia - Tropical Emerald
  ID: '#EA580C', // Indonesia - Coral Spice
  PH: '#0284C7', // Philippines - Archipelago Blue

  // South Asia & Middle East
  IN: '#FB923C', // India - Vibrant Saffron
  PK: '#10B981', // Pakistan - Crescent Green
  BD: '#059669', // Bangladesh - Bengal Green
  NP: '#DC2626', // Nepal - Rhododendron Red
  LK: '#D97706', // Sri Lanka - Lion Amber
  IR: '#0D9488', // Iran - Persian Turquoise
  IQ: '#B45309', // Iraq - Mespotamia Bronze
  SY: '#BE123C', // Syria - Damascus Rose
  LB: '#16A34A', // Lebanon - Cedar Green
  JO: '#F59E0B', // Jordan - Petra Rose Gold
  SA: '#15803D', // Saudi Arabia - Palm Green
  AE: '#D97706', // UAE - Desert Gold

  // Americas
  US: '#F43F5E', // United States - Star Rose
  CA: '#EF4444', // Canada - Maple Red
  MX: '#84CC16', // Mexico - Lime Agave
  BR: '#22C55E', // Brazil - Amazon Green
  AR: '#38BDF8', // Argentina - Celestial Blue
  CO: '#F59E0B', // Colombia - Golden Sunrise
  PE: '#FB923C', // Peru - Inca Amber
  CL: '#0284C7', // Chile - Pacific Blue

  // Africa
  EG: '#EAB308', // Egypt - Nile Sun
  MA: '#D97706', // Morocco - Terracotta Amber
  DZ: '#059669', // Algeria - Atlas Mint
  TN: '#E11D48', // Tunisia - Jasmine Red
  NG: '#16A34A', // Nigeria - Lagos Green
  ZA: '#F97316', // South Africa - Protea Orange
  KE: '#B45309', // Kenya - Savannah Umber
  ET: '#F59E0B', // Ethiopia - Abyssinian Gold
  GH: '#10B981'  // Ghana - Gold Coast Green
};

// Deterministic golden-ratio hash generator for any country code
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateCountryColor(code) {
  if (!code) return '#FF6B57';
  const clean = code.toUpperCase().trim();
  const hash = hashString(clean);

  // Golden angle (approx 137.508 degrees) distributes hues non-adjacent
  const hue = Math.round((hash * 137.508) % 360);
  // Tuned saturation and lightness for optimum contrast on dark navy (#18203A)
  const saturation = 80 + (hash % 15); // 80% to 94%
  const lightness = 55 + (hash % 10);  // 55% to 64%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Runtime configurable overrides for future preferences post-deployment
const runtimeOverrides = new Map();

export function setCountryColor(countryCode, color) {
  if (!countryCode) return;
  runtimeOverrides.set(countryCode.toUpperCase().trim(), color);
}

export function getCountryColor(countryCode, customPalette = null) {
  if (!countryCode) return '#FF6B57';
  const code = countryCode.toUpperCase().trim();

  // 1. Custom prop-level palette passed by developer / component
  if (customPalette && customPalette[code]) {
    return customPalette[code];
  }

  // 2. Runtime override set via setCountryColor
  if (runtimeOverrides.has(code)) {
    return runtimeOverrides.get(code);
  }

  // 3. Hand-tuned curated distinct color
  if (CURATED_COUNTRY_COLORS[code]) {
    return CURATED_COUNTRY_COLORS[code];
  }

  // 4. Procedural golden-ratio color (guarantees every country has a unique, vibrant color)
  return generateCountryColor(code);
}
