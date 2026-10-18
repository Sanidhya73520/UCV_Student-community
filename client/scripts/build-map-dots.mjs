import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as d3Geo from 'd3-geo';
import * as topojson from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json' with { type: 'json' };
import { COUNTRIES } from '../../shared/countries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canvas dimensions for the world map SVG
const width = 1000;
const height = 520;

// Equirectangular projection
const projection = d3Geo.geoEquirectangular()
  .scale(155)
  .translate([width / 2, height / 2 + 10]);

// Feature collections
const countries = topojson.feature(worldAtlas, worldAtlas.objects.countries);

// Numerical country code to ISO Alpha-2 lookup table (standard ISO 3166-1 numeric to alpha-2)
const numericToAlpha2 = {
  '004': 'AF', '008': 'AL', '012': 'DZ', '020': 'AD', '024': 'AO', '028': 'AG', '032': 'AR',
  '051': 'AM', '036': 'AU', '040': 'AT', '031': 'AZ', '044': 'BS', '048': 'BH', '050': 'BD',
  '052': 'BB', '112': 'BY', '056': 'BE', '084': 'BZ', '204': 'BJ', '064': 'BT', '068': 'BO',
  '070': 'BA', '072': 'BW', '076': 'BR', '096': 'BN', '100': 'BG', '854': 'BF', '108': 'BI',
  '116': 'KH', '120': 'CM', '124': 'CA', '140': 'CF', '148': 'TD', '152': 'CL', '156': 'CN',
  '170': 'CO', '174': 'KM', '178': 'CG', '180': 'CD', '188': 'CR', '384': 'CI', '191': 'HR',
  '192': 'CU', '196': 'CY', '203': 'CZ', '208': 'DK', '262': 'DJ', '212': 'DM', '214': 'DO',
  '218': 'EC', '818': 'EG', '222': 'SV', '226': 'GQ', '232': 'ER', '233': 'EE', '748': 'SZ',
  '231': 'ET', '242': 'FJ', '246': 'FI', '250': 'FR', '266': 'GA', '270': 'GM', '268': 'GE',
  '276': 'DE', '288': 'GH', '300': 'GR', '308': 'GD', '320': 'GT', '324': 'GN', '624': 'GW',
  '328': 'GY', '332': 'HT', '340': 'HN', '348': 'HU', '352': 'IS', '356': 'IN', '360': 'ID',
  '364': 'IR', '368': 'IQ', '372': 'IE', '376': 'IL', '380': 'IT', '388': 'JM', '392': 'JP',
  '400': 'JO', '398': 'KZ', '404': 'KE', '408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG',
  '418': 'LA', '428': 'LV', '422': 'LB', '426': 'LS', '430': 'LR', '434': 'LY', '438': 'LI',
  '440': 'LT', '442': 'LU', '450': 'MG', '454': 'MW', '458': 'MY', '462': 'MV', '466': 'ML',
  '470': 'MT', '478': 'MR', '480': 'MU', '484': 'MX', '498': 'MD', '496': 'MN', '499': 'ME',
  '504': 'MA', '508': 'MZ', '104': 'MM', '516': 'NA', '524': 'NP', '528': 'NL', '554': 'NZ',
  '558': 'NI', '562': 'NE', '566': 'NG', '807': 'MK', '578': 'NO', '512': 'OM', '586': 'PK',
  '591': 'PA', '598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL', '620': 'PT',
  '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW', '682': 'SA', '686': 'SN', '688': 'RS',
  '694': 'SL', '702': 'SG', '703': 'SK', '705': 'SI', '706': 'SO', '710': 'ZA', '728': 'SS',
  '724': 'ES', '144': 'LK', '729': 'SD', '740': 'SR', '752': 'SE', '756': 'CH', '760': 'SY',
  '762': 'TJ', '834': 'TZ', '764': 'TH', '626': 'TL', '768': 'TG', '780': 'TT', '788': 'TN',
  '792': 'TR', '795': 'TM', '800': 'UG', '804': 'UA', '784': 'AE', '826': 'GB', '840': 'US',
  '858': 'UY', '860': 'UZ', '862': 'VE', '704': 'VN', '887': 'YE', '894': 'ZM', '716': 'ZW',
  '-99': 'XK'
};

// Fallback lat/lng for microstates and island nations not in low-res 110m atlas
const microstateCoords = {
  AD: [1.5218, 42.5063],      // Andorra
  AG: [-61.8468, 17.0608],    // Antigua and Barbuda
  BH: [50.5577, 26.0667],     // Bahrain
  BB: [-59.5432, 13.1939],    // Barbados
  CV: [-23.6052, 15.1201],    // Cabo Verde
  KM: [43.3333, -11.6455],    // Comoros
  DM: [-61.3710, 15.4150],    // Dominica
  GD: [-61.6790, 12.1165],    // Grenada
  KI: [-157.363, 1.8709],     // Kiribati
  LI: [9.5209, 47.1660],      // Liechtenstein
  MV: [73.2207, 3.2028],      // Maldives
  MT: [14.3754, 35.9375],     // Malta
  MH: [171.1845, 7.1315],     // Marshall Islands
  MU: [57.5522, -20.3484],    // Mauritius
  FM: [150.5508, 7.4256],     // Micronesia
  MC: [7.4246, 43.7384],      // Monaco
  NR: [166.9315, -0.5228],    // Nauru
  PW: [134.5825, 7.5150],     // Palau
  PS: [35.2332, 31.9522],     // Palestine
  KN: [-62.7830, 17.3578],    // Saint Kitts and Nevis
  LC: [-60.9789, 13.9094],    // Saint Lucia
  VC: [-61.2872, 13.2528],    // Saint Vincent and the Grenadines
  WS: [-172.1046, -13.7590],  // Samoa
  SM: [12.4578, 43.9424],     // San Marino
  ST: [6.6131, 0.1864],       // Sao Tome and Principe
  SC: [55.4920, -4.6796],     // Seychelles
  SG: [103.8198, 1.3521],     // Singapore
  SB: [160.1562, -9.6457],    // Solomon Islands
  TO: [-175.1982, -21.1789],  // Tonga
  TV: [179.194, -7.1095],     // Tuvalu
  VU: [166.9592, -15.3767],   // Vanuatu
  VA: [12.4534, 41.9029]      // Vatican City
};

const dots = [];
const countryCenters = {};

// Step size in pixels for grid
const step = 8;

console.log('Generating dotted world map...');

for (let y = 30; y < height - 30; y += step) {
  for (let x = 20; x < width - 20; x += step) {
    const coords = projection.invert([x, y]);
    if (!coords) continue;

    // Test which country contains this point
    for (const feature of countries.features) {
      if (d3Geo.geoContains(feature, coords)) {
        const numId = String(feature.id).padStart(3, '0');
        const code = numericToAlpha2[numId] || null;

        dots.push({
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          c: code
        });

        if (code) {
          if (!countryCenters[code]) {
            countryCenters[code] = { count: 0, sumX: 0, sumY: 0 };
          }
          countryCenters[code].count += 1;
          countryCenters[code].sumX += x;
          countryCenters[code].sumY += y;
        }

        break;
      }
    }
  }
}

// Compute centers from atlas features using geoCentroid (for high accuracy)
const centers = {};

// 1. First, populate from features geoCentroid
for (const feature of countries.features) {
  const numId = String(feature.id).padStart(3, '0');
  const code = numericToAlpha2[numId];
  if (code) {
    const centroid = d3Geo.geoCentroid(feature);
    const pt = projection(centroid);
    if (pt) {
      centers[code] = {
        x: Math.round(pt[0] * 10) / 10,
        y: Math.round(pt[1] * 10) / 10
      };
    }
  }
}

// 2. Override with grid-average if grid had 3+ dots (matches visually visible dot cluster)
for (const [code, data] of Object.entries(countryCenters)) {
  if (data.count >= 3) {
    centers[code] = {
      x: Math.round((data.sumX / data.count) * 10) / 10,
      y: Math.round((data.sumY / data.count) * 10) / 10
    };
  }
}

// 3. Populate microstates and island nations
for (const [code, coords] of Object.entries(microstateCoords)) {
  if (!centers[code]) {
    const pt = projection(coords);
    if (pt) {
      centers[code] = {
        x: Math.round(pt[0] * 10) / 10,
        y: Math.round(pt[1] * 10) / 10
      };
    }
  }
}

// Geographic center overrides based on continental / mainland centroid (prevents overseas territory skew)
const exactCountryCoordinates = {
  FR: [2.2137, 46.2276],     // France (Metropolitan France, avoiding French Guiana skew)
  US: [-98.5795, 39.8283],   // United States (Contiguous 48 states, avoiding Alaska skew)
  ES: [-3.7038, 40.4168],    // Spain (Madrid / Central plateau)
  PT: [-8.2245, 39.3999],    // Portugal (Continental Portugal)
  GB: [-2.5478, 54.0036],    // United Kingdom (Great Britain)
  TR: [35.2433, 38.9637],    // Turkey (Anatolia / Central Turkey)
  GR: [21.8243, 39.0742],    // Greece (Central Greece)
  KZ: [66.9237, 48.0196],    // Kazakhstan (Central Kazakhstan)
  IT: [12.5674, 41.8719],    // Italy (Rome / Central Italy)
  KH: [104.9910, 12.5657],   // Cambodia (Phnom Penh / Central Cambodia)
  BG: [25.4858, 42.7339],    // Bulgaria (Central Bulgaria)
  RO: [24.9668, 45.9432],    // Romania (Transylvania / Central Romania)
  DE: [10.4515, 51.1657],    // Germany
  PL: [19.1451, 51.9194],    // Poland
  AT: [14.5501, 47.5162],    // Austria
  CH: [8.2275, 46.8182],     // Switzerland
  BE: [4.4699, 50.5039],     // Belgium
  NL: [5.2913, 52.1326],     // Netherlands
  HU: [19.5033, 47.1625],    // Hungary
  CZ: [15.4730, 49.8175],    // Czechia
  SK: [19.6990, 48.6690],    // Slovakia
  RS: [21.0059, 44.0165],    // Serbia
  HR: [15.5000, 45.2000],    // Croatia
  BA: [17.6791, 43.9159],    // Bosnia and Herzegovina
  MK: [21.7453, 41.6086],    // North Macedonia
  AL: [20.1683, 41.1533],    // Albania
  MD: [28.3699, 47.4116],    // Moldova
  UA: [31.1656, 48.3794],    // Ukraine
  CY: [33.4299, 35.1264],    // Cyprus
  IN: [78.9629, 20.5937],    // India
  CN: [104.1954, 35.8617],   // China
  JP: [138.2529, 36.2048],   // Japan
  KR: [127.7669, 35.9078],   // South Korea
  VN: [108.2772, 14.0583],   // Vietnam
  TH: [100.9925, 15.8700],   // Thailand
  MY: [101.9758, 4.2105],    // Malaysia
  ID: [113.9213, -0.7893],   // Indonesia
  AU: [133.7751, -25.2744],  // Australia
  NZ: [174.8860, -40.9006],  // New Zealand
  BR: [-51.9253, -14.2350],  // Brazil
  AR: [-63.6167, -38.4161],  // Argentina
  MX: [-102.5528, 23.6345],  // Mexico
  CA: [-106.3468, 56.1304],  // Canada
  EG: [30.8025, 26.8206],    // Egypt
  MA: [-7.0926, 31.7917],    // Morocco
  NG: [8.6753, 9.0820],      // Nigeria
  ZA: [22.9375, -30.5595]    // South Africa
};

// Apply exact continental / mainland centroid coordinates
for (const [code, lngLat] of Object.entries(exactCountryCoordinates)) {
  const pt = projection(lngLat);
  if (pt) {
    centers[code] = {
      x: Math.round(pt[0] * 10) / 10,
      y: Math.round(pt[1] * 10) / 10
    };
  }
}

// 4. Ensure EVERY country in COUNTRIES has a center and at least one dot
for (const c of COUNTRIES) {
  const code = c.code;
  if (!centers[code]) {
    console.warn(`Missing center for country: ${code} (${c.name})`);
  } else {
    // Check if this country has any dots in map
    const existingDots = dots.filter((d) => d.c === code);
    if (existingDots.length === 0) {
      const center = centers[code];
      dots.push({
        x: center.x,
        y: center.y,
        c: code
      });
    }
  }
}

// Specific Regional Dots to guarantee accurate shape representation on the world map
const extraDotsNeeded = [
  // Moldova
  { code: 'MD', lngLat: [28.8353, 47.0105] }, // Chișinău
  { code: 'MD', lngLat: [28.2, 47.6] },
  // Albania
  { code: 'AL', lngLat: [19.8189, 41.3275] }, // Tirana
  { code: 'AL', lngLat: [20.1, 40.7] },
  // Croatia
  { code: 'HR', lngLat: [15.9819, 45.8150] }, // Zagreb
  { code: 'HR', lngLat: [16.4402, 43.5081] }, // Split
  // Cyprus
  { code: 'CY', lngLat: [33.3823, 35.1856] }, // Nicosia
  // Montenegro
  { code: 'ME', lngLat: [19.2595, 42.4411] }, // Podgorica
  // Kosovo
  { code: 'XK', lngLat: [21.1655, 42.6629] }, // Pristina
  // Greece
  { code: 'GR', lngLat: [23.7275, 37.9838] }, // Athens
  { code: 'GR', lngLat: [22.9444, 40.6401] }, // Thessaloniki
  { code: 'GR', lngLat: [21.7344, 38.2466] }, // Patras
  { code: 'GR', lngLat: [25.1333, 35.3387] }, // Heraklion / Crete
  // Italy
  { code: 'IT', lngLat: [9.1900, 45.4642] },  // Milan
  { code: 'IT', lngLat: [11.2558, 43.7696] }, // Florence
  { code: 'IT', lngLat: [12.4964, 41.9028] }, // Rome
  { code: 'IT', lngLat: [14.2681, 40.8518] }, // Naples
  { code: 'IT', lngLat: [13.3614, 38.1157] }, // Palermo / Sicily
  // Bulgaria
  { code: 'BG', lngLat: [23.3219, 42.6977] }, // Sofia
  { code: 'BG', lngLat: [24.7500, 42.1354] }, // Plovdiv
  { code: 'BG', lngLat: [27.9167, 43.2167] }, // Varna
  { code: 'BG', lngLat: [27.4626, 42.5048] }, // Burgas
  // Cambodia
  { code: 'KH', lngLat: [104.9282, 11.5564] }, // Phnom Penh
  { code: 'KH', lngLat: [103.8603, 13.3671] }, // Siem Reap
  { code: 'KH', lngLat: [103.1982, 13.0957] }, // Battambang
  // Turkey
  { code: 'TR', lngLat: [28.9784, 41.0082] }, // Istanbul
  { code: 'TR', lngLat: [32.8597, 39.9334] }, // Ankara
  { code: 'TR', lngLat: [27.1428, 38.4237] }, // Izmir
  { code: 'TR', lngLat: [30.7133, 36.8969] }, // Antalya
  { code: 'TR', lngLat: [39.7168, 41.0027] }, // Trabzon
  { code: 'TR', lngLat: [40.2189, 37.9144] }, // Diyarbakir
  // Spain
  { code: 'ES', lngLat: [-3.7038, 40.4168] }, // Madrid
  { code: 'ES', lngLat: [2.1734, 41.3851] },  // Barcelona
  { code: 'ES', lngLat: [-5.9845, 37.3891] }, // Seville
  { code: 'ES', lngLat: [-0.3763, 39.4699] }, // Valencia
  // France
  { code: 'FR', lngLat: [2.3522, 48.8566] },  // Paris
  { code: 'FR', lngLat: [4.8357, 45.7640] },  // Lyon
  { code: 'FR', lngLat: [5.3698, 43.2965] },  // Marseille
  { code: 'FR', lngLat: [-0.5792, 44.8378] }, // Bordeaux
  // Kazakhstan
  { code: 'KZ', lngLat: [71.4491, 51.1694] }, // Astana
  { code: 'KZ', lngLat: [76.9286, 43.2220] }, // Almaty
  { code: 'KZ', lngLat: [69.5901, 42.3417] }  // Shymkent
];

for (const extra of extraDotsNeeded) {
  const pt = projection(extra.lngLat);
  if (pt) {
    const rx = Math.round(pt[0] * 10) / 10;
    const ry = Math.round(pt[1] * 10) / 10;
    // Only add if not already extremely close to an existing dot for the same country
    const existing = dots.find((d) => Math.hypot(d.x - rx, d.y - ry) < 4);
    if (!existing) {
      dots.push({
        x: rx,
        y: ry,
        c: extra.code
      });
    } else {
      existing.c = extra.code;
    }
  }
}

// Craiova coordinates: 44.3302° N, 23.7949° E
const craiovaPixel = projection([23.7949, 44.3302]);
const craiova = {
  x: Math.round(craiovaPixel[0] * 10) / 10,
  y: Math.round(craiovaPixel[1] * 10) / 10
};

const output = {
  width,
  height,
  craiova,
  centers,
  dots
};

const outDir = path.resolve(__dirname, '../src/assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'map-dots.json'), JSON.stringify(output));

console.log(`Generated ${dots.length} map dots across ${Object.keys(centers).length} countries.`);
console.log(`Moldova (MD) center:`, centers['MD']);
console.log(`Albania (AL) center:`, centers['AL']);
console.log(`Croatia (HR) center:`, centers['HR']);
