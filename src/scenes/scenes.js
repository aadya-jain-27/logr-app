// The worlds you can live in. Sunset Valley is fully alive; the others are
// scaffolded with their mood + atmosphere now, bespoke elements (snow, rain,
// lanterns…) come next. Each drives both the background and the glass-UI tokens.
export const SCENES = [
  { id: 'sunset',   name: 'Sunset Valley',    swatch: '#E8895A',
    sky: ['#B7A6D6', '#EBA79C', '#F4BA8C', '#F7D9A8'], glow: '#FFE3AE', silhouette: '#3C5A47', particle: 'rgba(255,238,206,0.9)', dark: false },
  { id: 'winter',   name: 'Winter Cabin',     swatch: '#3F5E92',
    sky: ['#0D1530', '#1A2A4C', '#2E4470', '#3C547E'], glow: '#A9C0EC', silhouette: '#0A1228', particle: 'rgba(255,255,255,0.92)', dark: true },
  { id: 'rainy',    name: 'Kyoto Rain',       swatch: '#D2536F',
    sky: ['#14151E', '#22202E', '#352B3C', '#1E2330'], glow: '#E86A86', silhouette: '#0C0D14', particle: 'rgba(190,205,230,0.45)', dark: true },
  { id: 'lakeside', name: 'Lakeside Morning', swatch: '#5FA39A',
    sky: ['#CFE8E1', '#E7E0C8', '#F3E6CF', '#F7EEDC'], glow: '#FCE6B4', silhouette: '#577E76', particle: 'rgba(255,250,236,0.9)', dark: false },
  { id: 'lavender', name: 'Lavender Fields',  swatch: '#9B7BC4',
    sky: ['#8A78B6', '#C99BC0', '#EFC3AC', '#F2D2B6'], glow: '#FBD6C2', silhouette: '#4A3A63', particle: 'rgba(244,224,255,0.9)', dark: false },
  { id: 'ocean',    name: 'Ocean Cliff',      swatch: '#3E8C9C',
    sky: ['#A6D7E6', '#C9E6E4', '#E6F1E6', '#EEF4EA'], glow: '#FFFFFF', silhouette: '#2C6470', particle: 'rgba(255,255,255,0.85)', dark: false },
]
export const getScene = (id) => SCENES.find((s) => s.id === id) || SCENES[0]
