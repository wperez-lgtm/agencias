const ISLAND_NAMES: Readonly<Record<string, string>> = {
  GPS: 'Baltra',
  SCY: 'San Cristóbal',
};

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  en: 'Inglés',
  es: 'Español',
};

export function islandName(code: string): string {
  return ISLAND_NAMES[code] ?? code;
}

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}
