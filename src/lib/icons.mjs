// Inline SVG icon set — coherent geometric set, 1.7 stroke, round joins.
// Icons inherit currentColor. No external requests.

const base = (inner, vb = '0 0 24 24', size = 20) =>
  `<svg viewBox="${vb}" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

export const icons = {
  phone: (s = 20) => base(`<path d="M5.5 3.5h3l1.6 4-2 1.6a12.6 12.6 0 0 0 6.8 6.8l1.6-2 4 1.6v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2Z"/>`, '0 0 24 24', s),
  siren: () => base(`<path d="M6 18v-6a6 6 0 0 1 12 0v6"/><path d="M4 18h16"/><path d="M6 21h12"/><path d="M12 3v-1.5M5.2 5.2 4.1 4.1M18.8 5.2l1.1-1.1"/>`),
  flame: () => base(`<path d="M12 21c3.9 0 6.5-2.3 6.5-6 0-2.7-1.7-4.9-3.3-6.6C13.7 6.7 13 5 13 3.5c-2 1.2-2.7 3-2.5 5C9 7.6 8 6.6 7.6 5.4 6.5 7 5.5 9.4 5.5 12c0 5.6 2.6 9 6.5 9Z"/><path d="M12 21c-1.8-.8-2.8-2.3-2.8-4.1 0-1.9 1.4-3.4 2.8-4.9 1.4 1.5 2.8 3 2.8 4.9 0 1.8-1 3.3-2.8 4.1Z"/>`),
  child: () => base(`<circle cx="12" cy="6.5" r="2.6"/><path d="M12 9.5c-3 0-4.5 1.6-4.5 4v2.5M12 9.5c3 0 4.5 1.6 4.5 4v2.5"/><path d="M9.5 21v-5h5v5"/><path d="M12 13.5V16"/>`),
  fraud: () => base(`<rect x="3" y="7" width="18" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.4"/><path d="M6.5 9.8h.01M17.5 15.2h.01"/><path d="M4 4.5 20.5 19"/>`),
  grid: () => base(`<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>`),
  heart: () => base(`<path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7 5.5 5 8 5c1.7 0 3.2.9 4 2.3C12.8 5.9 14.3 5 16 5c2.5 0 4.5 2 4.5 4.6 0 3.7-3.5 6.9-8.5 10.9Z"/><path d="M5.5 12h3l1.5-2.5 2 4 1.5-2.5h5"/>`),
  shieldHeart: () => base(`<path d="M12 21c-5-2-8-5.7-8-10V5.5L12 3l8 2.5V11c0 4.3-3 8-8 10Z"/><path d="M12 15s-3-1.8-3-3.6c0-1 .8-1.8 1.8-1.8.7 0 1 .3 1.2.7.2-.4.5-.7 1.2-.7 1 0 1.8.8 1.8 1.8C15 13.2 12 15 12 15Z"/>`),
  wave: () => base(`<path d="M3 8.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><path d="M3 13c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><path d="M3 17.5c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/>`),
  train: () => base(`<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M5 10h14"/><path d="M9.5 13.5h.01M14.5 13.5h.01"/><path d="M8 16.5 6.5 21M16 16.5l1.5 4.5"/>`),
  bolt: () => base(`<path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z"/>`),
  banknote: () => base(`<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.8h.01M17.5 14.2h.01"/>`),
  info: () => base(`<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>`),
  search: () => base(`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>`),
  copy: () => base(`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>`),
  check: () => base(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`),
  chevR: () => base(`<path d="m9 5.5 6.5 6.5L9 18.5"/>`),
  clock: () => base(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2.5"/>`),
  globe: () => base(`<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.7 2.3 4 5.2 4 8.5s-1.3 6.2-4 8.5c-2.7-2.3-4-5.2-4-8.5s1.3-6.2 4-8.5Z"/>`),
  printer: () => base(`<path d="M7 8V3.5h10V8"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 13.5h10V21H7z"/>`),
  arrowExt: () => base(`<path d="M14 5h5v5"/><path d="M19 5 10.5 13.5"/><path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>`),
  report: () => base(`<path d="M12 3.5 21 8v8l-9 4.5L3 16V8l9-4.5Z"/><path d="M12 8.5v4.5"/><path d="M12 16.5h.01"/>`),
  x: () => base(`<path d="m6 6 12 12M18 6 6 18"/>`),
  pin: () => base(`<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.3"/>`),
};

export const categoryIcon = {
  emergency: 'siren',
  health: 'heart',
  safety: 'shieldHeart',
  disaster: 'wave',
  travel: 'train',
  utilities: 'bolt',
  crime: 'banknote',
  other: 'info',
};

export const quickIcon = {
  ambulance: 'phone',
  police: 'siren',
  fire: 'flame',
  child: 'child',
  fraud: 'fraud',
  more: 'grid',
};
