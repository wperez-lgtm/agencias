const ISLAND_NAMES = {
  GPS: 'Baltra',
  SCY: 'San Cristóbal',
};

const LANGUAGE_NAMES = {
  en: 'Inglés',
  es: 'Español',
};

export function islandName(code) {
  return ISLAND_NAMES[code] ?? code;
}

export function languageName(code) {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}
