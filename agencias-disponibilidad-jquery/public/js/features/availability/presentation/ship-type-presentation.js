const SHIP_TYPE_CRUISE = 1;
const SHIP_TYPE_DAILY_TOUR = 5;

const CRUISE = {
  label: 'Crucero',
  priceNote: 'por persona, doble acomodación',
  itineraryTitle: ({ name }) => `Itinerario ${name}`,
};

const DAILY_TOUR = {
  label: 'Tour diario',
  priceNote: 'por persona',
  itineraryTitle: ({ name }) => name,
};

/** Strategy: un tipo de barco nuevo solo requiere registrar su presentación aquí. */
const PRESENTATIONS = {
  [SHIP_TYPE_CRUISE]: CRUISE,
  [SHIP_TYPE_DAILY_TOUR]: DAILY_TOUR,
};

export function shipTypePresentation(type) {
  return PRESENTATIONS[type] ?? CRUISE;
}
